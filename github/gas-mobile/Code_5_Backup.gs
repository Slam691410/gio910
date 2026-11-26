function haversine_(lat1, lng1, lat2, lng2) {
  const R = 6371000, toRad = function (d) { return d * Math.PI / 180; };
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ---------------- workspace Google (opsional) ---------------- */
function gasWorkspaceDispatch(op, token, payload) {
  const u = userFromToken_(token);
  // Web app berjalan sebagai akun pemilik deployment: Kalender/Gmail/Drive miliknya hanya untuk Pemilik & Manajemen;
  // cadangan, uji pemulihan dan verifikasi audit hanya Pemilik (Auditor boleh verifikasi audit).
  if (/^backup\./.test(String(op))) allow_(u, ['Pemilik']);
  else if (String(op) === 'audit.verify') allow_(u, ['Pemilik', 'Manajemen', 'Auditor']);
  else allow_(u, ['Pemilik', 'Manajemen']);
  const p = payload || {};
  switch (op) {
    case 'calendar.list': {
      const now = new Date(), until = new Date(now.getTime() + 7 * 864e5);
      return CalendarApp.getDefaultCalendar().getEvents(now, until).map(function (e) { return { id: e.getId(), title: e.getTitle(), start: e.getStartTime().toISOString(), end: e.getEndTime().toISOString() }; });
    }
    case 'calendar.create': {
      const cal = CalendarApp.getDefaultCalendar();
      const start = new Date(p.start), end = new Date(p.end || start.getTime() + 3600e3);
      const ev = cal.createEvent(p.title || '(tanpa judul)', start, end, { description: p.description || '' });
      auditAppend_(u.Nama, 'Agenda dibuat: ' + (p.title || ''), 'Kalender', ev.getId());
      return { id: ev.getId(), title: ev.getTitle() };
    }
    case 'calendar.delete': {
      const ev = CalendarApp.getDefaultCalendar().getEventById(p.id);
      if (ev) ev.deleteEvent();
      return { ok: true };
    }
    case 'gmail.list': {
      const threads = GmailApp.search(p.q || 'in:inbox', 0, p.max || 10);
      return threads.map(function (t) { const m = t.getMessageCount(); return { id: t.getId(), subject: t.getFirstMessageSubject(), count: m, last: t.getLastMessageDate().toISOString() }; });
    }
    case 'gmail.send': {
      GmailApp.sendEmail(p.to, p.subject, p.body || '');
      auditAppend_(u.Nama, 'Email terkirim ke ' + p.to, 'Email');
      return { ok: true };
    }
    case 'drive.list': {
      const it = DriveApp.getFiles();
      const out = [];
      while (it.hasNext() && out.length < (p.max || 20)) { const f = it.next(); out.push({ id: f.getId(), name: f.getName(), size: f.getSize() }); }
      return out;
    }
    case 'drive.trash': { const f = DriveApp.getFileById(p.id); if (f) f.setTrashed(true); return { ok: true }; }
    case 'docs.create': {
      const d = DocumentApp.create(p.title || 'Dokumen Kantor AI');
      if (p.body) d.getBody().setText(p.body);
      auditAppend_(u.Nama, 'Dokumen Google dibuat: ' + (p.title || ''), 'Dokumen', d.getId());
      return { id: d.getId(), name: d.getName(), url: d.getUrl() };
    }
    case 'sheets.create': {
      const s = SpreadsheetApp.create(p.title || 'Kantor AI');
      auditAppend_(u.Nama, 'Spreadsheet dibuat: ' + (p.title || ''), 'Data', s.getId());
      return { id: s.getId(), name: s.getName(), url: s.getUrl() };
    }
    case 'tasks.list': {
      const lists = TasksAPI_();
      return lists;
    }
    case 'tasks.create': {
      const t = TasksAPI_('create', p);
      return t;
    }
    case 'tasks.toggle': {
      const t = TasksAPI_('toggle', p);
      return t;
    }
    case 'tasks.delete': {
      const t = TasksAPI_('delete', p);
      return t;
    }
    case 'meet.create': {
      const now = new Date(), end = new Date(now.getTime() + 3600e3);
      const ev = CalendarApp.getDefaultCalendar().createEvent(p.title || 'Rapat Kantor AI', now, end, { guests: p.guests || '' });
      return { id: ev.getId(), title: ev.getTitle() };
    }
    case 'backup.create':
    case 'backup.toDrive':
      // B-01: salinan ke Drive + retensi 30 berkas (T-12, T-21)
      return dailyBackup();
    case 'backup.test':
      // B-02: uji pemulihan tanpa menyentuh data hidup
      return restoreTest_();
    case 'audit.verify':
      return auditVerify_(p.month || auditMonthKey_());
    default:
      throw new Error('Operasi workspace tidak dikenal: ' + op);
  }
}
function TasksAPI_(action, p) {
  // Tasks API tersedia melalui layanan lanjutan; fallback aman bila tidak diaktifkan.
  if (typeof Tasks === 'undefined') {
    if (action === 'list') return [];
    throw new Error('Layanan Tasks belum diaktifkan di appsscript.json.');
  }
  const list = Tasks.Tasklists.list().items[0];
  if (action === 'list') return Tasks.Tasks.list(list.id).items || [];
  if (action === 'create') return Tasks.Tasks.insert({ title: p.title, notes: p.notes || '' }, list.id);
  if (action === 'toggle') { const t = Tasks.Tasks.get(list.id, p.id); t.status = t.status === 'completed' ? 'needsAction' : 'completed'; return Tasks.Tasks.update(t, list.id, t.id); }
  if (action === 'delete') { Tasks.Tasks.remove(list.id, p.id); return { ok: true }; }
  throw new Error('Aksi Tasks tidak dikenal.');
}

/* ---------------- backup harian & retensi (B-01, B-02, T-09, T-12, T-21) ---------------- */
function backupFolder_() {
  const id = P().getProperty('KAI_BACKUP_FOLDER');
  let folder = null;
  try { folder = id ? DriveApp.getFolderById(id) : null; } catch (e) { folder = null; }
  if (!folder) {
    folder = DriveApp.getRootFolder().createFolder('KantorAI-Backup');
    P().setProperty('KAI_BACKUP_FOLDER', folder.getId());
  }
  return folder;
}
function buildSnapshot_() {
  const snap = { _meta: { app: 'Kantor AI & Sistem Kerja', version: CFG.VER, at: now_(), timezone: 'Asia/Jakarta (WIB)' } };
  Object.keys(DB_KEYS).forEach(function (k) { snap[k] = db_(k); });
  return snap;
}
function dailyBackup() {
  const folder = backupFolder_();
  const stamp = date_();
  const payload = JSON.stringify(buildSnapshot_());
  const file = folder.createFile('kai-backup-' + stamp + '.json', payload, MimeType.JSON);
  // retensi: simpan CFG.BACKUP_KEEP berkas terbaru
  const files = folder.getFilesByType(MimeType.JSON);
  const arr = [];
  while (files.hasNext()) arr.push(files.next());
  arr.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  arr.slice(CFG.BACKUP_KEEP).forEach(function (f) { f.setTrashed(true); });
  auditAppend_('SISTEM', 'Backup harian: ' + file.getName() + ' (' + arr.length + ' berkas, retensi ' + CFG.BACKUP_KEEP + ')', 'Backup', file.getId());
  return { ok: true, name: file.getName(), bytes: payload.length, kept: Math.min(arr.length, CFG.BACKUP_KEEP) };
}
function restoreTest_() {
  // B-02: pulihkan snapshot terakhir ke ruang uji, bandingkan jumlah baris, tanpa menyentuh data hidup
  const folder = backupFolder_();
  const files = folder.getFilesByType(MimeType.JSON);
  let latest = null, latestDate = 0;
  while (files.hasNext()) {
    const f = files.next();
    if (f.getDateCreated().getTime() > latestDate) { latestDate = f.getDateCreated().getTime(); latest = f; }
  }
  if (!latest) throw new Error('Belum ada berkas backup untuk diuji.');
  const snap = JSON.parse(latest.getBlob().getDataAsString());
  const report = { file: latest.getName(), at: now_(), tables: [], ok: true };
  Object.keys(DB_KEYS).forEach(function (k) {
    const live = db_(k).length;
    const inSnap = (snap[k] || []).length;
    report.tables.push({ table: k, live: live, snapshot: inSnap, diff: live - inSnap });
    if (live !== inSnap) report.ok = false;
  });
  report.audit = auditVerify_();
  auditAppend_('SISTEM', 'Uji pemulihan ' + (report.ok ? 'LULUS' : 'SELISIH') + ' · ' + latest.getName(), 'Backup', latest.getId());
  return report;
}
function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'dailyBackup') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('dailyBackup').timeBased().everyDays(1).atHour(3).create();
  return { ok: true, triggers: ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); }) };
}

/* ---------------- endpoint uji dari browser ---------------- */
function gasHealth() {
  return { ok: true, version: CFG.VER, timezone: Session.getScriptTimeZone(), now: now_() }; // jumlah sesi tidak lagi dibuka ke publik
}
function gasRestoreTest(token) { const u = userFromToken_(token); allow_(u, ['Pemilik']); return restoreTest_(); }
function gasAuditVerify(token, month) { const u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Auditor']); return auditVerify_(month); }
/* Tutup / buka periode buku (X-37) — hanya Pemilik; periode tertutup menolak kas baru & perubahan. */
function gasClosePeriod(token, period, reopen) {
  const u = userFromToken_(token); allow_(u, ['Pemilik']);
  if (!/^\d{4}-\d{2}$/.test(String(period))) throw new Error('Format periode: YYYY-MM.');
  let list = readJSON_('kai.closedPeriods', []);
  if (reopen) list = list.filter(function (x) { return x !== period; }); else if (list.indexOf(period) < 0) list.push(period);
  writeJSON_('kai.closedPeriods', list);
  auditAppend_(u.Nama, (reopen ? 'Periode dibuka kembali: ' : 'Tutup buku periode: ') + period, 'Keuangan', period);
  return { ok: true, closed: list };
}
/* Bootstrap satu kali: dijalankan dari editor Apps Script oleh pemilik proyek saat tabel pengguna masih kosong.
   Membuat akun Pemilik pertama dengan email akun Google pemilik deployment (tanpa PIN; masuk lewat OTP email). */
function gasBootstrapOwner() {
  const list = db_('users');
  if (list.length) throw new Error('Bootstrap ditolak: tabel pengguna sudah berisi ' + list.length + ' akun.');
  const email = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  if (!validEmail_(email)) throw new Error('Email pemilik deployment tidak terbaca.');
  list.push({ ID: 'OWN1', Nama: 'Pemilik Utama', Jabatan: 'Pemilik Utama', Unit: 'Pemilik', Tier: 'Pemilik', Email: email, Aktif: 'YA', Fase: 1, StatusKepegawaian: 'Karyawan FTE', OfflinePinAktif: 'TIDAK', OfflinePin: '' });
  dbSet_('users', list);
  auditAppend_('SISTEM', 'Bootstrap akun Pemilik pertama (OWN1)', 'Pengguna', 'OWN1');
  return { ok: true, id: 'OWN1', email: maskEmail_(email) };
}
/* Migrasi satu kali: PIN lama (teks polos) → hash SHA-256. Jalankan dari editor Apps Script oleh pemilik proyek. */
function gasMigratePins() {
  const list = db_('users'); let n = 0;
  list.forEach(function (x) { if (x.OfflinePin && String(x.OfflinePin).indexOf('sha256$') !== 0) { x.OfflinePin = pinHash_(x.ID, x.OfflinePin); n++; } });
  dbSet_('users', list);
  auditAppend_('SISTEM', 'Migrasi PIN offline ke hash SHA-256: ' + n + ' akun', 'Pengguna');
  return { ok: true, migrated: n };
}
