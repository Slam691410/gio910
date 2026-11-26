/**
 * KANTOR AI & SISTEM KERJA — Code.gs
 * Backend Google Apps Script untuk Index.html (satu berkas, 29 rute).
 * Pengerasan 2026-11-24 (Tabel Mitigasi Atomik L03/L04/L05/L13):
 *   R-01 direktori profil tertutup tanpa sesi · R-02 OTP anti-enumerasi + batas 3 percobaan
 *   PIN offline di-hash SHA-256 + kunci 5x/15 menit · maker != checker (intake & kas) · kunci periode tutup buku
 *   kepemilikan data Staf/Freelancer · Auditor baca-saja · Tamu ditolak · sesi diam 30 menit · audit baca data sensitif
 * Versi: 2026.11.24 · Zona waktu: Asia/Jakarta (WIB)
 *
 * Pemasangan:
 *   1. script.google.com → Proyek baru.
 *   2. Tempel berkas ini sebagai Code.gs, tempel HTML sebagai Index.html.
 *   3. appsscript.json → tempel isi berkas appsscript.json.
 *   4. Deploy → New deployment → Web app
 *      (Execute as: Me; Who has access: sesuai kebijakan — disarankan "Anyone with Google account").
 *   5. Buka URL /exec. Set MAPS_KEY di Project Settings → Script Properties (boleh kosong).
 *
 * Catatan kejujuran: ini backend satu proyek Apps Script, bukan infrastruktur produksi
 * bersertifikat. Kunci rahasia JANGAN ditulis di berkas ini — pakai Script Properties.
 */

const CFG = {
  VER: '2026.11.24',
  SESSION_HOURS: 8,
  DUAL_CONTROL_IDR: 5000000,
  FOUR_EYES_IDR: 100000000,
  IDEMPOTENCY_SEC: 5,
  QUOTA_SOFT_LIMIT: 1000,
  AUDIT_RETENTION_DAYS: 730,
  OTP_TTL_SEC: 300,
  OTP_MAX_TRIES: 3,
  OTP_MAX_REQ_15MIN: 5,
  PIN_MAX_FAIL: 5,
  PIN_LOCK_MIN: 15,
  IDLE_MIN: 30,
  AUDIT_LIST_MAX: 5000,
  BACKUP_KEEP: 30
};

const TIERS = ['Pemilik', 'Manajemen', 'Staf', 'Freelancer', 'Auditor', 'Tamu'];

/* ---------------- penyimpanan ---------------- */
const P = () => PropertiesService.getScriptProperties();
const C = () => CacheService.getScriptCache();
const L = () => LockService.getScriptLock();

function readJSON_(key, fallback) {
  try {
    const v = P().getProperty(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}
function writeJSON_(key, val) {
  P().setProperty(key, JSON.stringify(val));
  C().remove(key);
}
function now_() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta', hour12: false }).replace('T', ' ');
}
function date_() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
}
function makeId_(prefix) {
  return prefix + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}
function sha256_(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ((b + 256) % 256).toString(16).padStart(2, '0'); }).join('');
}

/* ---------------- kunci data ---------------- */
const DB_KEYS = {
  users: 'kai.db.users', intake: 'kai.db.intake', cash: 'kai.db.cash',
  tasks: 'kai.db.tasks', attendance: 'kai.db.attendance', documents: 'kai.db.documents'
};
const db_ = (name, fallback) => readJSON_(DB_KEYS[name] || 'kai.db.' + name, fallback === undefined ? [] : fallback);
const dbSet_ = (name, val) => writeJSON_(DB_KEYS[name] || 'kai.db.' + name, val);

/* ---------------- LOG audit append-only + rantai hash (L04 F-83..F-86) ---------------- */
function auditMonthKey_(d) {
  const dt = d ? new Date(d) : new Date();
  return 'kai.audit.' + dt.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }).slice(0, 7);
}
function auditAppend_(actor, action, module, objId, oldValue, newValue) {
  const key = auditMonthKey_();
  const rows = readJSON_(key, []);
  const prev = rows.length ? rows[rows.length - 1].hash : 'GENESIS';
  const t = now_();
  const hash = sha256_([t, actor, action, objId || '', prev].join('|'));
  rows.push({ i: rows.length + 1, t: t, u: actor, a: action, m: module, obj: objId || '', old: oldValue || '', new: newValue || '', prevHash: prev, hash: hash });
  writeJSON_(key, rows);
  return hash;
}
function auditVerify_(monthKey) {
  const rows = readJSON_(monthKey || auditMonthKey_(), []);
  let prev = 'GENESIS', broken = 0;
  rows.forEach(function (r) {
    const h = sha256_([r.t, r.u, r.a, r.obj, r.prevHash].join('|'));
    if (h !== r.hash || r.prevHash !== prev) broken++;
    prev = r.hash;
  });
  return { rows: rows.length, broken: broken, ok: broken === 0, head: prev };
}

/* ---------------- sesi 8 jam (T-15) ---------------- */
function sessions_() { return readJSON_('kai.sessions', {}); }
function sessionSave_(s) { writeJSON_('kai.sessions', s); }
function userFromToken_(token) {
  const all = sessions_();
  const s = all[token];
  if (!s) throw new Error('Belum masuk atau sesi berakhir. Silakan masuk ulang.');
  if (s.exp < Date.now()) { delete all[token]; sessionSave_(all); throw new Error('Sesi berakhir (batas 8 jam). Silakan masuk ulang.'); }
  if (s.seen && Date.now() - s.seen > CFG.IDLE_MIN * 60000) { delete all[token]; sessionSave_(all); throw new Error('Sesi berakhir (' + CFG.IDLE_MIN + ' menit tanpa aktivitas). Silakan masuk ulang.'); }
  if (!s.seen || Date.now() - s.seen > 60000) { s.seen = Date.now(); sessionSave_(all); }
  const u = db_('users').find(function (x) { return x.ID === s.uid && x.Aktif === 'YA'; });
  if (!u) { delete all[token]; sessionSave_(all); throw new Error('Akun nonaktif. Silakan hubungi Pemilik.'); }
  u._token = token;
  return u;
}
function rank_(u) {
  if (!u) return 0;
  if (u.Tier === 'Pemilik' || /Direktur|Komisaris|Pemilik Utama/i.test(u.Jabatan || '')) return 3;
  if (u.Tier === 'Manajemen') return 2;
  return ['Staf', 'Freelancer', 'Auditor'].indexOf(u.Tier) >= 0 ? 1 : 0;
}
function allow_(u, tiers) {
  if (tiers && tiers.indexOf(u.Tier) < 0) throw new Error('Akses ditolak untuk peran ' + u.Tier + '.');
}

/* ---------------- pengerasan 2026-11-24: PIN ber-hash, kunci percobaan, periode, retensi ---------------- */
function pinHash_(id, pin) { return 'sha256$' + sha256_('KAI-PIN-V1|' + String(id).toUpperCase() + '|' + String(pin)); }
function pinCheck_(u, pin) {
  const stored = String(u.OfflinePin || '');
  if (!stored) return false;
  if (stored.indexOf('sha256$') === 0) return stored === pinHash_(u.ID, pin);
  return false; // PIN lama berbentuk teks polos tidak diterima: jalankan gasMigratePins() sekali oleh Pemilik
}
function failKey_(kind, id) { return 'kai.fail.' + kind + '.' + String(id).toUpperCase(); }
function failState_(kind, id) { return readJSON_(failKey_(kind, id), { n: 0, until: 0 }); }
function failLocked_(kind, id) { const f = failState_(kind, id); return f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 60000) : 0; }
function failHit_(kind, id) {
  const f = failState_(kind, id); f.n = (f.n || 0) + 1;
  if (f.n >= CFG.PIN_MAX_FAIL) { f.until = Date.now() + CFG.PIN_LOCK_MIN * 60000; f.n = 0; }
  writeJSON_(failKey_(kind, id), f); return f;
}
function failReset_(kind, id) { P().deleteProperty(failKey_(kind, id)); }
function periodClosed_(tanggal) { return readJSON_('kai.closedPeriods', []).indexOf(String(tanggal || '').slice(0, 7)) >= 0; }
function periodGuard_(tanggal) { if (periodClosed_(tanggal)) throw new Error('Ditolak: periode ' + String(tanggal).slice(0, 7) + ' sudah tutup buku dan terkunci (X-37).'); }
function retensi_(jenis) {
  const years = /Risalah|Akta|Register|Kebijakan|Kontrak|Keuangan|Pajak|Laporan/i.test(String(jenis || '')) ? 10 : 5;
  const d = new Date(); d.setFullYear(d.getFullYear() + years);
  return Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
}
function maskEmail_(e) { return String(e || '').replace(/^(.).+(@.*)$/, '$1***$2'); }
function validEmail_(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '')); }
function pub_(u) {
  return { ID: u.ID, Nama: u.Nama, Jabatan: u.Jabatan, Unit: u.Unit, Tier: u.Tier, Email: u.Email, Peringkat: rank_(u), Fase: u.Fase, StatusKepegawaian: u.StatusKepegawaian, OfflinePinAktif: u.OfflinePinAktif === 'YA' ? 'YA' : 'TIDAK' };
}

/* ---------------- idempotensi 5 detik (T-22) ---------------- */
function idemGet_(route, token, payload) {
  const key = 'idem:' + sha256_([route, token, JSON.stringify(payload || {})].join('|'));
  return { key: key, val: C().get(key) };
}
function idemSet_(key, val) { C().put(key, JSON.stringify(val), CFG.IDEMPOTENCY_SEC); }

/* ---------------- kuota (T-05) ---------------- */
function quotaTick_() {
  const today = date_();
  const q = readJSON_('kai.quota', { day: today, n: 0 });
  if (q.day !== today) { q.day = today; q.n = 0; }
  q.n++;
  writeJSON_('kai.quota', q);
  return q;
}

/* ---------------- penguncian (T-04, T-08) ---------------- */
function withLock_(fn) {
  const lock = L();
  lock.waitLock(30000); // batas tunggu 30 detik — tidak ada tunggu lebih lama
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ---------------- OTP email nyata (N-07) ---------------- */
function otpSend_(email) {
  const users = db_('users');
  const u = users.find(function (x) { return String(x.Email).toLowerCase() === String(email).toLowerCase() && x.Aktif === 'YA'; });
  const key = String(email || '').trim().toLowerCase();
  // R-02: jawaban seragam — tidak membocorkan apakah email terdaftar (anti-enumerasi) + batas permintaan
  const uniform = { ok: true, delivery: 'email', maskedEmail: maskEmail_(key), expiresInSec: CFG.OTP_TTL_SEC };
  if (!validEmail_(key)) throw new Error('Format email tidak valid.');
  const rlKey = 'otpreq:' + sha256_(key).slice(0, 24);
  const reqN = Number(C().get(rlKey) || 0) + 1;
  C().put(rlKey, String(reqN), 900);
  if (reqN > CFG.OTP_MAX_REQ_15MIN) throw new Error('Terlalu banyak permintaan OTP. Coba lagi 15 menit lagi.');
  if (!u) { auditAppend_('PUBLIK', 'Permintaan OTP untuk email tidak dikenal (' + maskEmail_(key) + ')', 'Autentikasi'); return uniform; }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const all = readJSON_('kai.otps', {});
  all[key] = { code: sha256_('KAI-OTP|' + key + '|' + code), exp: Date.now() + CFG.OTP_TTL_SEC * 1000, tries: 0 };
  writeJSON_('kai.otps', all);
  const preview = P().getProperty('KAI_DEV_PREVIEW_OTP') === 'true';
  if (!preview) {
    try {
      MailApp.sendEmail({ to: email, subject: 'Kode masuk Kantor AI', htmlBody: 'Kode masuk Anda: <b>' + code + '</b><br>Berlaku ' + CFG.OTP_TTL_SEC + ' detik. Abaikan bila bukan Anda.' });
    } catch (e) {
      throw new Error('Email OTP gagal dikirim: ' + e.message);
    }
  }
  return { ok: true, delivery: preview ? 'preview' : 'email', maskedEmail: String(email).replace(/^(.).+(@.*)$/, '$1***$2'), expiresInSec: CFG.OTP_TTL_SEC, previewOtp: preview ? code : undefined };
}

/* ---------------- HELPER INCLUDE, DO GET & DO POST API (Opsi 3 + HtmlService) ---------------- */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const allowedPages = ['ringkas', 'org', 'tugas', 'inv', 'aset', 'dokumen', 'alur', 'vendor', 'unduh'];
  const reqPage = e && e.parameter && e.parameter.page ? String(e.parameter.page).trim() : '';
  const targetFile = allowedPages.indexOf(reqPage) >= 0 ? reqPage : 'Index';

  let raw = '';
  try {
    raw = HtmlService.createHtmlOutputFromFile(targetFile).getContent();
  } catch (err) {
    return jsonOut_({ ok: true, mode: 'api', status: 'Kantor AI API Ready (Opsi 3)', version: CFG.VER, time: now_() });
  }

  let execUrl = '';
  try { execUrl = ScriptApp.getService().getUrl() || ''; } catch (err) { execUrl = ''; }
  const mapsKey = String(P().getProperty('MAPS_KEY') || '').replace(/[^a-zA-Z0-9_\-]/g, '');

  let html;
  if (raw.indexOf('<?') >= 0) {
    const tpl = HtmlService.createTemplate(raw);
    tpl.execUrl = execUrl;
    tpl.mapsKey = mapsKey;
    html = tpl.evaluate().getContent();
  } else {
    html = raw
      .replace("window.__GAS_MAPS_KEY__ = '';", "window.__GAS_MAPS_KEY__ = '" + mapsKey + "';")
      .replace("window.__KAI_GAS_EXEC_URL__ = '';", "window.__KAI_GAS_EXEC_URL__ = '" + execUrl + "';");
  }

  return HtmlService.createHtmlOutput(html)
    .setTitle(targetFile === 'Index' ? 'Kantor AI & Sistem Kerja' : ('Kantor AI — ' + targetFile))
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const req = JSON.parse(raw);
    if (req.type === 'health') {
      return jsonOut_({ ok: true, data: gasHealth() });
    }
    if (req.type === 'workspace') {
      return jsonOut_({ ok: true, data: gasWorkspaceDispatch(req.op, req.token || '', req.payload || {}) });
    }
    return jsonOut_({ ok: true, data: gasApiDispatch(req.route, req.token || '', req.payload || {}) });
  } catch (err) {
    return jsonOut_({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}

/* ---------------- router utama ---------------- */
function gasApiDispatch(route, token, payload) {
  const started = Date.now();
  const q = quotaTick_();
  if (q.n > CFG.QUOTA_SOFT_LIMIT) throw new Error('Kuota panggilan hari ini mendekati batas (' + q.n + '). Coba lagi besok atau hubungi admin.');
  try {
    return withLock_(function () { return dispatch_(route, token, payload || {}); });
  } catch (e) {
    if (/^Route tidak dikenal/.test(e.message)) throw e;
    auditAppend_('SISTEM', 'ERROR ' + route + ': ' + e.message, 'Sistem');
    throw e;
  } finally {
    C().put('last:' + route, String(Date.now() - started), 60);
  }
}

