/* ============================================================
   GIO910 — MODUL KEAMANAN TERPADU v4.6
   1) Enkripsi AES-256-GCM + PBKDF2-SHA256 & Pembangun/Pembaca File .ZIP Standar
   2) Unduh File ZIP Login Terenkripsi (WAJIB ONLINE + Terikat Akun & Password)
   3) Verifikasi Lapisan Wajah Live Camera + Anti-Spoof Liveness (Tanpa Unggah Foto)
   4) Verifikasi Lapisan Suara (Challenge Frasa + RMS Energi + Digest SHA-256)
   5) Deteksi Lokasi GPS / Google Maps Otomatis (Auto-Detect)
   ============================================================ */
(() => {
  "use strict";

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const OFFICE_LAT = -6.2297;
  const OFFICE_LNG = 106.8095;
  const OFFICE_RADIUS_M = 300;
  const OFFLINE_CACHE_KEY = "kai_zip_offline_seal_v1";

  function getApiBase() {
    return String(
      (window.__KAI_HUB_PARAMS__ && window.__KAI_HUB_PARAMS__.supabaseApiUrl) ||
        window.__KAI_SUPABASE_API_URL__ ||
        "https://dttclgkjfiwcovvqrckw.supabase.co/functions/v1/gio910-api"
    ).replace(/\/+$/, "");
  }

  function getAnonKey() {
    return String(
      (window.__KAI_HUB_PARAMS__ && window.__KAI_HUB_PARAMS__.supabaseAnonKey) ||
        window.__KAI_SUPABASE_ANON_KEY__ ||
        ""
    ).trim();
  }

  function getSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem("hi_session_v1") || "null");
      if (s && s.token && s.user && (!s.exp || Date.now() < s.exp)) return s;
    } catch (_) {}
    if (window.__KAI_ACTIVE_SUPA_TOKEN__ && window.__KAI_ACTIVE_SUPA_USER__) {
      return { token: window.__KAI_ACTIVE_SUPA_TOKEN__, user: window.__KAI_ACTIVE_SUPA_USER__ };
    }
    return null;
  }

  function haversineMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function bytesToHex(u8) {
    return Array.from(u8).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function hexToBytes(hex) {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return arr;
  }

  function b64Encode(u8) {
    let bin = "";
    const ch = 0x8000;
    for (let i = 0; i < u8.length; i += ch) {
      bin += String.fromCharCode.apply(null, u8.subarray(i, i + ch));
    }
    return btoa(bin);
  }

  function b64Decode(str) {
    const bin = atob(str);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function sha256Hex(data) {
    const u8 = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    const buf = await crypto.subtle.digest("SHA-256", u8);
    return bytesToHex(new Uint8Array(buf));
  }

  // ---- CRC32 & ZIP BUILDER / PARSER (STORE + DEFLATE) ----
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function buildZipStore(entries) {
    const enc = new TextEncoder();
    const locals = [];
    const centrals = [];
    let offset = 0;
    for (const item of entries) {
      const nameB = enc.encode(item.name);
      const dataB = item.bytes instanceof Uint8Array ? item.bytes : enc.encode(String(item.content || ""));
      const sum = crc32(dataB);

      const lh = new Uint8Array(30 + nameB.length);
      const lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true); // UTF-8
      lv.setUint16(8, 0, true); // STORE
      lv.setUint32(14, sum, true);
      lv.setUint32(18, dataB.length, true);
      lv.setUint32(22, dataB.length, true);
      lv.setUint16(26, nameB.length, true);
      lh.set(nameB, 30);
      locals.push(lh, dataB);

      const ch = new Uint8Array(46 + nameB.length);
      const cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint32(16, sum, true);
      cv.setUint32(20, dataB.length, true);
      cv.setUint32(24, dataB.length, true);
      cv.setUint16(28, nameB.length, true);
      cv.setUint32(42, offset, true);
      ch.set(nameB, 46);
      centrals.push(ch);

      offset += lh.length + dataB.length;
    }

    const cSize = centrals.reduce((s, x) => s + x.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, cSize, true);
    ev.setUint32(16, offset, true);

    const out = new Uint8Array(offset + cSize + 22);
    let pos = 0;
    for (const part of locals) { out.set(part, pos); pos += part.length; }
    for (const part of centrals) { out.set(part, pos); pos += part.length; }
    out.set(eocd, pos);
    return out;
  }

  async function parseZipEntries(arrayBuffer) {
    const u8 = new Uint8Array(arrayBuffer);
    if (u8.length < 22 || u8[0] !== 0x50 || u8[1] !== 0x4b) {
      throw new Error("File yang diunggah bukan arsip .ZIP yang valid.");
    }
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    // Cari End of Central Directory (EOCD)
    let eocdPos = -1;
    const minPos = Math.max(0, u8.length - 65558);
    for (let i = u8.length - 22; i >= minPos; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) {
        eocdPos = i;
        break;
      }
    }
    if (eocdPos < 0) throw new Error("Struktur Central Directory .ZIP rusak.");

    const totalEntries = dv.getUint16(eocdPos + 10, true);
    let cdOffset = dv.getUint32(eocdPos + 16, true);
    const dec = new TextDecoder();
    const files = {};

    for (let i = 0; i < totalEntries; i++) {
      if (cdOffset + 46 > u8.length || dv.getUint32(cdOffset, true) !== 0x02014b50) break;
      const method = dv.getUint16(cdOffset + 10, true);
      const compSize = dv.getUint32(cdOffset + 20, true);
      const nameLen = dv.getUint16(cdOffset + 28, true);
      const extraLen = dv.getUint16(cdOffset + 30, true);
      const commLen = dv.getUint16(cdOffset + 32, true);
      const localOff = dv.getUint32(cdOffset + 42, true);
      const fname = dec.decode(u8.subarray(cdOffset + 46, cdOffset + 46 + nameLen));
      cdOffset += 46 + nameLen + extraLen + commLen;

      if (localOff + 30 > u8.length || dv.getUint32(localOff, true) !== 0x04034b50) continue;
      const lNameLen = dv.getUint16(localOff + 26, true);
      const lExtraLen = dv.getUint16(localOff + 28, true);
      const dataStart = localOff + 30 + lNameLen + lExtraLen;
      const rawSlice = u8.subarray(dataStart, dataStart + compSize);

      if (method === 0) {
        files[fname] = rawSlice;
      } else if (method === 8 && typeof DecompressionStream === "function") {
        const ds = new DecompressionStream("deflate-raw");
        const stream = new Blob([rawSlice]).stream().pipeThrough(ds);
        const ab = await new Response(stream).arrayBuffer();
        files[fname] = new Uint8Array(ab);
      }
    }
    return files;
  }

  // ---- PBKDF2 + AES-256-GCM CRYPTO ----
  async function deriveAesKey(password, uidUpper, saltBytes) {
    const mat = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(String(password) + ":" + String(uidUpper || "").toUpperCase()),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
      mat,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptJsonWithPassword(secretObj, password, uidUpper) {
    const salt = new Uint8Array(16);
    const iv = new Uint8Array(12);
    crypto.getRandomValues(salt);
    crypto.getRandomValues(iv);
    const key = await deriveAesKey(password, uidUpper, salt);
    const plain = new TextEncoder().encode(JSON.stringify(secretObj));
    const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
    return {
      alg: "AES-256-GCM",
      kdf: "PBKDF2-SHA256-100000",
      saltHex: bytesToHex(salt),
      ivHex: bytesToHex(iv),
      ctB64: b64Encode(new Uint8Array(cipherBuf)),
    };
  }

  async function decryptJsonWithPassword(encObj, password, uidUpper) {
    const salt = hexToBytes(String(encObj.saltHex || ""));
    const iv = hexToBytes(String(encObj.ivHex || ""));
    const ct = b64Decode(String(encObj.ctB64 || ""));
    const key = await deriveAesKey(password, uidUpper, salt);
    try {
      const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
      return JSON.parse(new TextDecoder().decode(plainBuf));
    } catch (_) {
      throw new Error("Gagal mendekripsi file ZIP: Password salah atau file ZIP sudah rusak/dimodifikasi.");
    }
  }

  // ---- ONLINE GUARD & ENCRYPTED ZIP ISSUANCE ----
  async function isReallyOnline(apiBaseOverride) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
    const base = String(apiBaseOverride || getApiBase()).replace(/\/+$/, "");
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 4500) : null;
    try {
      const headers = {};
      const ak = getAnonKey();
      if (ak) {
        headers["apikey"] = ak;
        headers["Authorization"] = "Bearer " + ak;
      }
      const r = await fetch(base + "/api/health", {
        method: "GET",
        cache: "no-store",
        headers,
        signal: ctrl ? ctrl.signal : undefined,
      });
      if (timer) clearTimeout(timer);
      return r.ok;
    } catch (_) {
      if (timer) clearTimeout(timer);
      return false;
    }
  }

  async function apiCall(method, path, body, tokenOverride, apiBaseOverride) {
    const base = String(apiBaseOverride || getApiBase()).replace(/\/+$/, "");
    const headers = { "Content-Type": "application/json" };
    const ak = getAnonKey();
    if (ak) {
      headers["apikey"] = ak;
      headers["Authorization"] = "Bearer " + ak;
    }
    const tok = tokenOverride || (getSession() || {}).token || "";
    if (tok && UUID_RE.test(tok)) headers["x-gio-session"] = tok;
    const r = await fetch(base + path, {
      method,
      headers,
      body: body !== undefined && method !== "GET" && method !== "DELETE" ? JSON.stringify(body) : undefined,
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "HTTP " + r.status);
    return d;
  }

  async function buildEncryptedLoginZip(meta, password) {
    const uidUpper = String(meta.uid || "").toUpperCase();
    const secretPayload = {
      uid: uidUpper,
      nama: meta.nama,
      tier: meta.tier,
      email: meta.email,
      zipKeyId: meta.zipKeyId,
      nonce: meta.nonce,
      iat: meta.iat,
      exp: meta.exp,
      expMs: meta.expMs,
      serverSig: meta.serverSig,
      offlineToken: bytesToHex(crypto.getRandomValues(new Uint8Array(16))),
    };
    const enc = await encryptJsonWithPassword(secretPayload, password, uidUpper);
    const manifest = {
      app: "GIO910-KANTOR-AI",
      kind: "encrypted-zip",
      v: 2,
      uid: uidUpper,
      nama: meta.nama,
      tier: meta.tier,
      zipKeyId: meta.zipKeyId,
      nonce: meta.nonce,
      iat: meta.iat,
      exp: meta.exp,
      expMs: meta.expMs,
      serverSig: meta.serverSig,
      alg: enc.alg,
      kdf: enc.kdf,
    };
    const readme = [
      "FILE AKSES LOGIN MANUAL TERENKRIPSI — KANTOR AI GIO910",
      "=======================================================",
      "ID Akun      : " + uidUpper + " (" + meta.nama + ")",
      "Peran / Tier : " + meta.tier,
      "ID Kunci ZIP : " + meta.zipKeyId,
      "Dibuat       : " + meta.iat,
      "Berlaku s.d. : " + meta.exp,
      "Enkripsi     : AES-256-GCM + PBKDF2-SHA256 (100.000 iterasi)",
      "",
      "CARA PENGGUNAAN:",
      "1. Buka Login Manual pada Portal atau Copy Hub GIO910.",
      "2. Masukkan ID Akun, Password Anda, lalu unggah file .zip ini.",
      "3. File hanya dapat diunduh ulang saat perangkat dalam posisi ONLINE.",
    ].join("\r\n");

    const zipBytes = buildZipStore([
      { name: "manifest.json", content: JSON.stringify(manifest, null, 2) },
      { name: "payload.enc", content: JSON.stringify(enc, null, 2) },
      { name: "README.txt", content: readme },
    ]);
    const dateTag = String(meta.iat || new Date().toISOString()).slice(0, 10);
    const filename = `gio910-login-${uidUpper}-${dateTag}.zip`;
    const blob = new Blob([zipBytes], { type: "application/zip" });
    return { blob, filename, manifest, enc };
  }

  async function downloadEncryptedZipOnlineOnly(opts = {}) {
    const online = await isReallyOnline(opts.apiBase);
    if (!online) {
      throw new Error("Status OFFLINE terdeteksi: File ZIP terenkripsi hanya boleh dibuat dan diunduh saat posisi perangkat sudah ONLINE.");
    }
    const sess = getSession();
    const tok = opts.token || (sess && sess.token) || "";
    if (!tok) {
      throw new Error("Silakan login akun Anda terlebih dahulu sebelum mengunduh file ZIP terenkripsi.");
    }
    const pwd = String(opts.password || "");
    if (!pwd || pwd.length < 8 || !/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) {
      throw new Error("Password minimal 8 karakter dan wajib mengandung huruf serta angka.");
    }
    if (opts.updatePassword) {
      await apiCall("POST", "/api/auth/set-password", {
        newPassword: pwd,
        currentPassword: opts.currentPassword,
      }, tok, opts.apiBase);
    }
    const issued = await apiCall("POST", "/api/auth/zip-issue", {
      password: pwd,
      setIfEmpty: true,
      days: opts.days || 30,
      user_id: opts.userId || undefined,
    }, tok, opts.apiBase);

    const meta = issued.zipPackageMeta;
    if (!meta || !meta.serverSig) throw new Error("Server gagal menerbitkan metadata ZIP terenkripsi.");

    const built = await buildEncryptedLoginZip(meta, pwd);
    // Simpan cache bukti lokal aman untuk verifikasi offline nantinya (tidak menyimpan password)
    try {
      const cache = JSON.parse(localStorage.getItem(OFFLINE_CACHE_KEY) || "{}");
      cache[meta.uid] = {
        uid: meta.uid,
        nama: meta.nama,
        tier: meta.tier,
        email: meta.email,
        zipKeyId: meta.zipKeyId,
        expMs: meta.expMs,
        payloadHash: await sha256Hex(built.enc.ctB64),
      };
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
    } catch (_) {}

    const url = URL.createObjectURL(built.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = built.filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1200);

    return { ...built, online: true };
  }

  async function setAccountPasswordOnline(opts = {}) {
    const online = await isReallyOnline(opts.apiBase);
    if (!online) {
      throw new Error("Status OFFLINE: Pengaturan Password harus dilakukan saat perangkat ONLINE.");
    }
    return apiCall("POST", "/api/auth/set-password", {
      newPassword: opts.newPassword,
      currentPassword: opts.currentPassword,
    }, opts.token, opts.apiBase);
  }

  async function parseAndVerifyEncryptedLoginZip(file, expectedUid, password) {
    if (!file) throw new Error("Pilih file .ZIP terenkripsi Anda terlebih dahulu.");
    if (!/\.zip$/i.test(file.name || "") && file.type && !file.type.includes("zip")) {
      throw new Error("Format wajib berupa arsip .ZIP terenkripsi (bukan .txt atau format lain).");
    }
    const ab = await file.arrayBuffer();
    const entries = await parseZipEntries(ab);
    const dec = new TextDecoder();
    if (!entries["manifest.json"] || !entries["payload.enc"]) {
      throw new Error("Berkas .ZIP bukan paket akses Login Manual GIO910 (manifest.json / payload.enc tidak ditemukan).");
    }
    let manifest, encObj;
    try {
      manifest = JSON.parse(dec.decode(entries["manifest.json"]));
      encObj = JSON.parse(dec.decode(entries["payload.enc"]));
    } catch (_) {
      throw new Error("Isi manifest.json atau payload.enc di dalam .ZIP tidak valid.");
    }
    if (manifest.app !== "GIO910-KANTOR-AI" || manifest.kind !== "encrypted-zip") {
      throw new Error("File .ZIP ini bukan berkas akses GIO910 v2.");
    }
    const uidUpper = String(expectedUid || manifest.uid || "").trim().toUpperCase();
    if (expectedUid && String(manifest.uid || "").toUpperCase() !== uidUpper) {
      throw new Error(`File ZIP ini milik ID ${manifest.uid}, bukan ${uidUpper}.`);
    }
    if (!manifest.expMs || Number(manifest.expMs) < Date.now()) {
      throw new Error("Masa berlaku file ZIP terenkripsi sudah habis. Login online untuk mengunduh file ZIP terbaru.");
    }
    if (!password) throw new Error("Masukkan Password untuk membuka dekripsi file ZIP.");

    const decrypted = await decryptJsonWithPassword(encObj, password, uidUpper);
    if (decrypted.zipKeyId !== manifest.zipKeyId || decrypted.nonce !== manifest.nonce || decrypted.serverSig !== manifest.serverSig) {
      throw new Error("Integritas data di dalam file ZIP tidak konsisten.");
    }
    return { manifest, decrypted };
  }

  async function loginManualWithZip({ id, password, file, apiBase }) {
    const cleanId = String(id || "").trim().toUpperCase();
    if (!cleanId || !password) throw new Error("ID Akun dan Password wajib diisi.");
    const verified = await parseAndVerifyEncryptedLoginZip(file, cleanId, password);
    const m = verified.manifest;
    const dec = verified.decrypted;
    const online = await isReallyOnline(apiBase);
    if (online) {
      const res = await apiCall("POST", "/api/auth/login-manual", {
        id: cleanId,
        password,
        manifest: m,
      }, "", apiBase);
      return { ...res, offlineMode: false };
    }
    // Offline fallback setelah AES-256-GCM decrypt sukses
    const profile = {
      ID: dec.uid || cleanId,
      Nama: dec.nama || cleanId,
      Tier: dec.tier || "Staf",
      Email: dec.email || "",
      Peringkat: dec.tier === "Pemilik" ? 3 : dec.tier === "Manajemen" ? 2 : 1,
      Aktif: "YA",
      PasswordAktif: true,
    };
    return {
      success: true,
      token: "zip-offline-" + m.zipKeyId,
      user: profile,
      authMethod: "offline-encrypted-zip",
      offlineMode: true,
    };
  }

  // ---- ANTI-SPOOF LIVE CAMERA LIVENESS ----
  function sampleGrayscale64x48(videoEl) {
    const w = 64, h = 48;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(videoEl, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h).data;
    const gray = new Float32Array(w * h);
    let sum = 0, sumSq = 0;
    for (let i = 0, p = 0; i < img.length; i += 4, p++) {
      const l = img[i] * 0.299 + img[i + 1] * 0.587 + img[i + 2] * 0.114;
      gray[p] = l;
      sum += l;
      sumSq += l * l;
    }
    const n = gray.length;
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    return { gray, variance };
  }

  function diffFrames(a, b) {
    if (!a || !b || a.gray.length !== b.gray.length) return 0;
    let total = 0;
    for (let i = 0; i < a.gray.length; i++) total += Math.abs(a.gray[i] - b.gray[i]);
    return total / a.gray.length;
  }

  function createLivenessMonitor(videoEl, onStatus) {
    let prev = null;
    let maxScore = 0;
    let samples = 0;
    const id = setInterval(() => {
      if (!videoEl || !videoEl.videoWidth || !videoEl.videoHeight) return;
      const cur = sampleGrayscale64x48(videoEl);
      if (!cur) return;
      if (cur.variance < 25) {
        if (onStatus) onStatus({ ready: false, passed: false, score: 0, samples, msg: "Kamera terlalu gelap / tertutup. Pastikan wajah terlihat jelas.", message: "Kamera terlalu gelap / tertutup. Pastikan wajah terlihat jelas." });
        return;
      }
      if (prev) {
        const delta = diffFrames(prev, cur);
        if (delta > maxScore) maxScore = delta;
        samples++;
        const ready = maxScore >= 1.25 && samples >= 2;
        const msg = ready
          ? `✓ Wajah live terdeteksi (Liveness ${maxScore.toFixed(1)}) — siap ambil foto.`
          : `Gerakkan kepala sedikit atau kedipkan mata… (${maxScore.toFixed(1)}/1.3)`;
        if (onStatus) {
          onStatus({
            ready,
            passed: ready,
            score: Number(maxScore.toFixed(2)),
            samples,
            lastDelta: Number(delta.toFixed(2)),
            msg,
            message: msg,
          });
        }
      }
      prev = cur;
    }, 220);
    const stop = () => clearInterval(id);
    stop.stop = stop;
    stop.getState = () => ({ score: maxScore, samples, passed: maxScore >= 1.25 && samples >= 2 });
    return stop;
  }

  async function captureWithLiveness(videoEl, observedScore = 0) {
    if (!videoEl || !videoEl.videoWidth || !videoEl.videoHeight) {
      throw new Error("Video kamera belum aktif. Klik 'Aktifkan Kamera' terlebih dahulu.");
    }
    const initVal = typeof observedScore === "object" && observedScore !== null ? observedScore.score : observedScore;
    let bestScore = Number(initVal || 0);
    if (bestScore < 1.25) {
      const f1 = sampleGrayscale64x48(videoEl);
      await new Promise((r) => setTimeout(r, 200));
      const f2 = sampleGrayscale64x48(videoEl);
      await new Promise((r) => setTimeout(r, 200));
      const f3 = sampleGrayscale64x48(videoEl);
      const d1 = diffFrames(f1, f2);
      const d2 = diffFrames(f2, f3);
      const d3 = diffFrames(f1, f3);
      bestScore = Math.max(bestScore, d1, d2, d3);
      if (!f3 || f3.variance < 25) {
        throw new Error("Gambar kamera terlalu gelap atau kosong.");
      }
    }
    if (bestScore < 1.2) {
      throw new Error("Anti-Spoof: Gerakan wajah (liveness) belum terdeteksi (" + bestScore.toFixed(2) + "). Gerakkan wajah/berkedip di depan kamera langsung, bukan foto diam!");
    }
    const c = document.createElement("canvas");
    const h = Math.max(180, Math.round((videoEl.videoHeight / videoEl.videoWidth) * 360));
    c.width = 360;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Canvas kamera gagal diinisialisasi.");
    ctx.drawImage(videoEl, 0, 0, 360, h);
    const numScore = Number(bestScore.toFixed(2));
    return {
      dataUrl: c.toDataURL("image/jpeg", 0.84),
      canvas: c,
      livenessScore: numScore,
      livenessMeta: { score: numScore, source: "live-camera", ts: Date.now() },
      captureSource: "live-camera",
    };
  }

  // ---- VOICE CHALLENGE RECORDER (Lapisan 2 Suara) ----
  async function fetchVoiceChallenge(tokenOverride, apiBaseOverride) {
    try {
      return await apiCall("GET", "/api/absen/challenge", undefined, tokenOverride, apiBaseOverride);
    } catch (_) {
      const code = Math.random().toString(36).slice(2, 6).toUpperCase();
      return {
        success: true,
        phrase: "GIO910 HADIR " + code,
        challengeId: code,
        expiresAt: Date.now() + 300000,
        sig: "",
        officeCenter: { lat: OFFICE_LAT, lng: OFFICE_LNG, radiusM: OFFICE_RADIUS_M },
      };
    }
  }

  async function startVoiceRecorder(optsOrCb = {}) {
    const opts = typeof optsOrCb === "function" ? { onLevel: optsOrCb } : (optsOrCb || {});
    const { onLevel, onTranscript } = opts;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Mikrofon tidak didukung peramban ini. Gunakan pilihan 'Muka + Password'.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = AudioCtx ? new AudioCtx() : null;
    let analyser = null;
    let levelTimer = null;
    let peakEnergy = 0;
    let activeSamples = 0;
    let totalSamples = 0;
    let voiceCollector = null;

    if (ctx) {
      const src = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      if (window.__KAI_KYC__ && typeof window.__KAI_KYC__.createVoiceFrameCollector === "function") {
        try {
          voiceCollector = window.__KAI_KYC__.createVoiceFrameCollector(1024, ctx.sampleRate || 48000);
        } catch (_) {}
      }
      const buf = new Uint8Array(analyser.fftSize);
      levelTimer = setInterval(() => {
        analyser.getByteTimeDomainData(buf);
        let sumSq = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / buf.length);
        totalSamples++;
        if (rms > peakEnergy) peakEnergy = rms;
        if (rms >= 0.008) {
          activeSamples++;
          if (voiceCollector) {
            try { voiceCollector.pushAnalyser(analyser); } catch (_) {}
          }
        }
        if (onLevel) onLevel(rms, peakEnergy);
      }, 70);
    }

    let recognition = null;
    let transcript = "";
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      try {
        recognition = new SR();
        recognition.lang = "id-ID";
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.onresult = (ev) => {
          let txt = "";
          for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript + " ";
          transcript = txt.trim();
          if (onTranscript) onTranscript(transcript);
        };
        recognition.onerror = () => {};
        recognition.start();
      } catch (_) {}
    }

    const chunks = [];
    let recorder = null;
    if (typeof MediaRecorder === "function") {
      try {
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };
        recorder.start(150);
      } catch (_) {}
    }
    const startedAt = Date.now();
    let resolveDone, rejectDone;
    const done = new Promise((res, rej) => { resolveDone = res; rejectDone = rej; });
    done.catch(() => {});
    let stopped = false;

    const doStop = async () => {
      if (stopped) return await done;
      stopped = true;
      try {
        if (levelTimer) clearInterval(levelTimer);
        if (recognition) { try { recognition.stop(); } catch (_) {} }
        if (recorder && recorder.state !== "inactive") {
          await new Promise((res) => {
            recorder.onstop = res;
            try { recorder.stop(); } catch (_) { res(); }
          });
        }
        stream.getTracks().forEach((t) => t.stop());
        if (ctx) { try { await ctx.close(); } catch (_) {} }

        const durationMs = Math.max(200, Date.now() - startedAt);
        let digestHex = "";
        if (chunks.length) {
          const ab = await new Blob(chunks).arrayBuffer();
          digestHex = await sha256Hex(new Uint8Array(ab));
        } else {
          digestHex = await sha256Hex(`VOICE|${peakEnergy}|${durationMs}|${Date.now()}`);
        }
        if (peakEnergy < 0.006 || activeSamples < 2) {
          throw new Error("Suara tidak terdeteksi / terlalu pelan. Dekatkan mikrofon dan ucapkan frasa verifikasi dengan jelas.");
        }
        if (durationMs < 500) {
          throw new Error("Rekaman suara terlalu singkat (minimal 1 detik).");
        }
        const voiceProfile = voiceCollector ? voiceCollector.finalize(1) : null;
        const result = {
          ok: true,
          rms: Number(peakEnergy.toFixed(4)),
          durationMs,
          digest: digestHex.slice(0, 32).toUpperCase(),
          voiceDigest: digestHex.slice(0, 32).toUpperCase(),
          voiceEnergy: Number(peakEnergy.toFixed(4)),
          voiceDurationMs: durationMs,
          voiceProfile,
          transcript,
        };
        resolveDone(result);
        return result;
      } catch (err) {
        rejectDone(err);
        throw err;
      }
    };

    return {
      stop: doStop,
      done,
      cancel() {
        stopped = true;
        if (levelTimer) clearInterval(levelTimer);
        if (recognition) { try { recognition.stop(); } catch (_) {} }
        if (recorder && recorder.state !== "inactive") { try { recorder.stop(); } catch (_) {} }
        stream.getTracks().forEach((t) => t.stop());
        if (ctx) { try { ctx.close(); } catch (_) {} }
        rejectDone(new Error("Rekaman dibatalkan."));
      },
    };
  }

  // ---- AUTO MAPS / GPS DETECTOR ----
  function autoDetectGps(onUpdate) {
    if (typeof onUpdate !== "function") {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          return reject(new Error("Geolokasi peramban tidak tersedia."));
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(6));
            const lng = Number(pos.coords.longitude.toFixed(6));
            const distM = haversineMeters(OFFICE_LAT, OFFICE_LNG, lat, lng);
            const outsideOffice = distM > OFFICE_RADIUS_M;
            const label = outsideOffice
              ? `Luar Kantor (${distM >= 1000 ? (distM / 1000).toFixed(2) + " km" : distM + " m"} dari SCBD)`
              : `Kantor Pusat SCBD (${distM} m)`;
            resolve({
              status: "ready",
              lat,
              lng,
              accuracy: Math.round(pos.coords.accuracy || 0),
              distanceM: distM,
              outsideOffice,
              lokasiLabel: label,
              source: "gps-auto",
              autoDetectedMaps: true,
            });
          },
          (err) => {
            const msg =
              err && err.code === 1
                ? "Izin lokasi GPS ditolak peramban. Izinkan lokasi di browser agar Google Maps otomatis mendeteksi."
                : "Sinyal GPS belum terkunci. Coba aktifkan lokasi perangkat.";
            reject(new Error(msg));
          },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 }
        );
      });
    }
    if (!navigator.geolocation) {
      onUpdate({ status: "error", error: "Geolokasi peramban tidak tersedia.", lat: null, lng: null, autoDetectedMaps: true });
      return () => {};
    }
    onUpdate({ status: "detecting", msg: "Maps otomatis mendeteksi lokasi Anda…", autoDetectedMaps: true });

    const handlePos = (pos) => {
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      const distM = haversineMeters(OFFICE_LAT, OFFICE_LNG, lat, lng);
      const outsideOffice = distM > OFFICE_RADIUS_M;
      let label = outsideOffice
        ? `Luar Kantor (${distM >= 1000 ? (distM / 1000).toFixed(2) + " km" : distM + " m"} dari SCBD)`
        : `Kantor Pusat SCBD (${distM} m)`;
      if (onUpdate) {
        onUpdate({
          status: "ready",
          lat,
          lng,
          accuracy: Math.round(pos.coords.accuracy || 0),
          distanceM: distM,
          outsideOffice,
          lokasiLabel: label,
          source: "auto-gps",
          autoDetectedMaps: true,
        });
      }
      if (outsideOffice) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&accept-language=id`)
          .then((r) => r.json())
          .then((x) => {
            const nm = (x && x.address && (x.address.suburb || x.address.city_district || x.address.city || x.address.town)) || "";
            if (nm && onUpdate) {
              onUpdate({
                status: "ready",
                lat,
                lng,
                accuracy: Math.round(pos.coords.accuracy || 0),
                distanceM: distM,
                outsideOffice,
                lokasiLabel: `Luar Kantor (${distM >= 1000 ? (distM / 1000).toFixed(2) + " km" : distM + " m"}) — ${nm}`,
                source: "auto-gps",
                autoDetectedMaps: true,
              });
            }
          })
          .catch(() => {});
      }
    };

    const handleErr = (err) => {
      const msg =
        err && err.code === 1
          ? "Izin lokasi GPS ditolak peramban. Izinkan lokasi di browser agar Google Maps otomatis mendeteksi."
          : "Sinyal GPS belum terkunci. Coba aktifkan lokasi perangkat atau ketik catatan lokasi.";
      if (onUpdate) onUpdate({ status: "error", error: msg, lat: null, lng: null, autoDetectedMaps: true });
    };

    navigator.geolocation.getCurrentPosition(handlePos, handleErr, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 15000,
    });
    const watchId = navigator.geolocation.watchPosition(handlePos, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 20000,
    });
    return () => {
      try { navigator.geolocation.clearWatch(watchId); } catch (_) {}
    };
  }

  // ---- MODAL BERSAMA: ATUR PASSWORD & UNDUH FILE ZIP TERENKRIPSI (ONLINE ONLY) ----
  function ensureModalCss() {
    if (document.getElementById("kai-sec-v46-css")) return;
    const s = document.createElement("style");
    s.id = "kai-sec-v46-css";
    s.textContent = `
      .kai-sec-modal{position:fixed;inset:0;z-index:99990;background:rgba(4,9,20,.82);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:14px}
      .kai-sec-modal.is-open{display:flex}
      .kai-sec-card{width:100%;max-width:560px;max-height:92vh;overflow:auto;background:#0e172a;border:1px solid #2b4370;border-radius:16px;color:#e8eefc;box-shadow:0 24px 64px rgba(0,0,0,.6);font-family:system-ui,-apple-system,sans-serif}
      .kai-sec-head{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid #1e3054}
      .kai-sec-head h3{margin:0;font-size:16px;font-weight:800;color:#7dd3fc}
      .kai-sec-close{background:#182845;border:1px solid #2b4370;color:#e8eefc;border-radius:8px;padding:4px 10px;cursor:pointer;font-weight:700}
      .kai-sec-body{padding:16px 18px;font-size:13px;line-height:1.5;display:flex;flex-direction:column;gap:12px}
      .kai-sec-inp{width:100%;box-sizing:border-box;background:#08101e;border:1px solid #2b4370;border-radius:8px;padding:9px 12px;color:#fff;font-size:13.5px}
      .kai-sec-btn{background:#38bdf8;color:#06222f;border:0;border-radius:9px;padding:10px 14px;font-weight:800;font-size:13px;cursor:pointer}
      .kai-sec-btn:disabled{opacity:.45;cursor:not-allowed}
      .kai-sec-btn.warn{background:#fbbf24;color:#1c1305}
      .kai-sec-btn.ghost{background:#182845;color:#e8eefc;border:1px solid #2b4370}
      .kai-sec-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:11.5px;font-weight:700}
      .kai-sec-pill.on{background:#0e2b23;border:1px solid #175c49;color:#6ee7b7}
      .kai-sec-pill.off{background:#2b1414;border:1px solid #5b2c2c;color:#fca5a5}
    `;
    document.head.appendChild(s);
  }

  async function openPasswordZipModal() {
    ensureModalCss();
    const sess = getSession();
    const u = sess && sess.user;
    let el = document.getElementById("kai-sec-zip-modal");
    if (!el) {
      el = document.createElement("div");
      el.id = "kai-sec-zip-modal";
      el.className = "kai-sec-modal";
      el.innerHTML = `
        <div class="kai-sec-card">
          <div class="kai-sec-head">
            <h3>🔐 Password Akun &amp; File ZIP Login Terenkripsi</h3>
            <button type="button" class="kai-sec-close">✕</button>
          </div>
          <div class="kai-sec-body">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
              <div id="ks-user-label" style="font-size:12.5px;color:#cfe0ff"></div>
              <span id="ks-online-pill" class="kai-sec-pill off">Memeriksa koneksi…</span>
            </div>
            <div style="background:#131f36;border:1px solid #22365c;border-radius:10px;padding:12px">
              <b style="display:block;color:#e8eefc;margin-bottom:4px">Atur / Konfirmasi Password Akun</b>
              <p style="margin:0 0 8px;font-size:12px;color:#9fb0d0">Password (min. 8 karakter kombinasi huruf &amp; angka) digunakan untuk membuka dekripsi File ZIP saat Login Manual sekaligus verifikasi Lapisan 2 Absensi.</p>
              <input id="ks-pwd-1" type="password" class="kai-sec-inp" placeholder="Password (min. 8 karakter, huruf + angka)…" autocomplete="new-password" />
              <input id="ks-pwd-2" type="password" class="kai-sec-inp" style="margin-top:8px" placeholder="Ulangi Password…" autocomplete="new-password" />
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
                <button type="button" id="ks-save-pwd" class="kai-sec-btn ghost">Simpan / Perbarui Password</button>
                <button type="button" id="ks-dl-zip" class="kai-sec-btn">⬇ Unduh File ZIP Terenkripsi (.zip)</button>
              </div>
            </div>
            <div style="background:#0f1a2c;border:1px solid #22365c;border-radius:10px;padding:10px 12px;font-size:11.5px;color:#9fb0d0">
              <b>Aturan Keamanan Wajib:</b> File <code>.zip</code> dienkripsi <b>AES-256-GCM + PBKDF2</b> dan dicatat ke server Supabase (<code>access_cards</code>). Pembuatan &amp; pengunduhan file ZIP <b>diblokir otomatis saat posisi Offline</b>.
            </div>
            <div id="ks-msg" style="font-size:12.5px"></div>
          </div>
        </div>
      `;
      document.body.appendChild(el);
      el.addEventListener("click", (ev) => { if (ev.target === el) el.classList.remove("is-open"); });
      el.querySelector(".kai-sec-close").addEventListener("click", () => el.classList.remove("is-open"));
    }

    const uLabel = el.querySelector("#ks-user-label");
    const pill = el.querySelector("#ks-online-pill");
    const msgEl = el.querySelector("#ks-msg");
    const btnPwd = el.querySelector("#ks-save-pwd");
    const btnZip = el.querySelector("#ks-dl-zip");
    const pwd1 = el.querySelector("#ks-pwd-1");
    const pwd2 = el.querySelector("#ks-pwd-2");

    msgEl.textContent = "";
    pwd1.value = "";
    pwd2.value = "";
    uLabel.innerHTML = u
      ? `Akun aktif: <b>${String(u.ID)}</b> · ${String(u.Nama)} <span style="color:#7dd3fc">(${String(u.Tier)})</span>`
      : `<span style="color:#fca5a5">Belum login — masuk terlebih dahulu untuk mengatur Password &amp; mengunduh ZIP.</span>`;

    el.classList.add("is-open");

    const refreshOnlineState = async () => {
      const ok = await isReallyOnline();
      if (ok) {
        pill.className = "kai-sec-pill on";
        pill.textContent = "🟢 ONLINE · Siap Unduh ZIP";
        btnPwd.disabled = !u;
        btnZip.disabled = !u;
      } else {
        pill.className = "kai-sec-pill off";
        pill.textContent = "🔴 OFFLINE · Unduh ZIP Diblokir";
        btnPwd.disabled = true;
        btnZip.disabled = true;
        msgEl.style.color = "#fbbf24";
        msgEl.textContent = "Perangkat sedang OFFLINE. Hubungkan ke internet untuk mengatur Password dan mengunduh File ZIP Terenkripsi.";
      }
      return ok;
    };
    await refreshOnlineState();

    btnPwd.onclick = async () => {
      msgEl.textContent = "";
      const p1 = pwd1.value;
      const p2 = pwd2.value;
      if (!p1 || p1 !== p2) {
        msgEl.style.color = "#fca5a5";
        msgEl.textContent = "Konfirmasi password tidak cocok.";
        return;
      }
      btnPwd.disabled = true;
      try {
        const res = await setAccountPasswordOnline({ newPassword: p1, token: sess && sess.token });
        msgEl.style.color = "#6ee7b7";
        msgEl.textContent = "✓ " + (res.message || "Password berhasil diperbarui.");
      } catch (e) {
        msgEl.style.color = "#fca5a5";
        msgEl.textContent = e.message || String(e);
      } finally {
        btnPwd.disabled = false;
      }
    };

    btnZip.onclick = async () => {
      msgEl.textContent = "";
      const p1 = pwd1.value;
      const p2 = pwd2.value;
      if (!p1) {
        msgEl.style.color = "#fca5a5";
        msgEl.textContent = "Masukkan Password akun Anda (atau Password baru jika belum menyetel) untuk mengenkripsi file ZIP.";
        return;
      }
      if (p2 && p1 !== p2) {
        msgEl.style.color = "#fca5a5";
        msgEl.textContent = "Password dan ulangi Password tidak sama.";
        return;
      }
      btnZip.disabled = true;
      msgEl.style.color = "#93c5fd";
      msgEl.textContent = "Mengautentikasi ke Supabase & mengenkripsi file .ZIP (AES-256-GCM)…";
      try {
        const res = await downloadEncryptedZipOnlineOnly({
          password: p1,
          token: sess && sess.token,
          updatePassword: Boolean(p2 && p1 === p2),
        });
        msgEl.style.color = "#6ee7b7";
        msgEl.textContent = `✓ File ZIP Terenkripsi (${res.filename}) berhasil diunduh! Berlaku s.d. ${String(res.manifest.exp).slice(0, 10)}.`;
      } catch (e) {
        msgEl.style.color = "#fca5a5";
        msgEl.textContent = e.message || String(e);
      } finally {
        await refreshOnlineState();
      }
    };
  }

  // ---- MODAL BERSAMA ABSEN BERLAPIS ANTI-CURANG (UNTUK HOLDING OS & COPY HUB) ----
  async function openLayeredAttendanceModal(opts = {}) {
    ensureModalCss();
    const sess = getSession();
    if (!sess || !sess.token) {
      throw new Error("Silakan login akun terlebih dahulu sebelum melakukan absensi.");
    }
    let modal = document.getElementById("kai-layered-att-modal");
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = "kai-layered-att-modal";
    modal.className = "kai-sec-modal is-open";
    const kind = opts.kind === "out" ? "out" : "in";
    modal.innerHTML = `
      <div class="kai-sec-card" style="max-width:640px">
        <div class="kai-sec-head">
          <h3>🛡️ Absen ${kind === "out" ? "Pulang" : "Masuk"} Berlapis Anti-Curang</h3>
          <button type="button" class="kai-sec-close">✕</button>
        </div>
        <div class="kai-sec-body">
          <div style="font-size:12px;color:#9fb0d0">Wajib 3 Lapisan: <b>1) Kamera Wajah Live (Liveness)</b> + <b>2) Suara ATAU Password</b> + <b>3) Maps Otomatis Mendeteksi</b>. Unggah foto statis dinonaktifkan.</div>
          <div id="kla-kyc-banner" style="background:#101d35;border:1px solid #2b4370;border-radius:10px;padding:9px 11px;font-size:12px;color:#9fb0d0;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
            <span>Memeriksa status biometrik &amp; e-KYC…</span>
          </div>
          <div style="background:#131f36;border:1px solid #22365c;border-radius:10px;padding:11px">
            <b style="display:block;margin-bottom:6px;color:#7dd3fc">1. Kamera Wajah Live (Anti-Spoof Liveness)</b>
            <div style="position:relative;height:180px;background:#08101e;border-radius:8px;overflow:hidden;border:1px solid #2b4370;display:flex;align-items:center;justify-content:center">
              <video id="kla-vid" autoplay playsinline muted style="display:none;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)"></video>
              <img id="kla-img" style="display:none;width:100%;height:100%;object-fit:cover" alt="Wajah Live" />
              <div id="kla-cam-ph" style="color:#9fb0d0;font-size:12px;text-align:center;padding:12px">Klik <b>Aktifkan Kamera</b> lalu gerakkan wajah / berkedip.</div>
            </div>
            <div id="kla-live-st" style="font-size:11.5px;color:#fbbf24;margin-top:6px">Menunggu kamera…</div>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
              <button type="button" id="kla-cam-on" class="kai-sec-btn">📷 Aktifkan Kamera</button>
              <button type="button" id="kla-cam-snap" class="kai-sec-btn" style="display:none;background:#34d399;color:#06281f">✓ Kunci Foto Liveness</button>
              <button type="button" id="kla-cam-retake" class="kai-sec-btn ghost" style="display:none">↺ Foto Ulang</button>
            </div>
          </div>

          <div style="background:#131f36;border:1px solid #22365c;border-radius:10px;padding:11px">
            <b style="display:block;margin-bottom:6px;color:#7dd3fc">2. Faktor Kedua: Pilih Suara ATAU Password</b>
            <div style="display:flex;gap:8px;margin-bottom:8px">
              <button type="button" id="kla-mode-voice" class="kai-sec-btn" style="flex:1">🎙️ Muka + Suara</button>
              <button type="button" id="kla-mode-pwd" class="kai-sec-btn ghost" style="flex:1">🔐 Muka + Password</button>
            </div>
            <div id="kla-box-voice">
              <div id="kla-phrase" style="background:#08101e;border:1px solid #2b4370;border-radius:8px;padding:8px 10px;font-family:monospace;font-size:13px;color:#6ee7b7;margin-bottom:8px">Memuat frasa verifikasi…</div>
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <button type="button" id="kla-rec-btn" class="kai-sec-btn warn">🎙️ Rekam Suara Verifikasi</button>
                <span id="kla-voice-st" style="font-size:11.5px;color:#9fb0d0">Ucapkan frasa di atas ke mikrofon.</span>
              </div>
            </div>
            <div id="kla-box-pwd" style="display:none">
              <input id="kla-pwd-inp" type="password" class="kai-sec-inp" placeholder="Masukkan Password akun Anda…" />
            </div>
          </div>

          <div style="background:#131f36;border:1px solid #22365c;border-radius:10px;padding:11px">
            <b style="display:block;margin-bottom:4px;color:#7dd3fc">3. Maps Otomatis Mendeteksi</b>
            <div id="kla-gps-st" style="font-size:12px;color:#93c5fd">📍 Maps otomatis mendeteksi koordinat Anda…</div>
            <input id="kla-note" type="text" class="kai-sec-inp" style="margin-top:8px" value="${String(opts.defaultNote || "").replace(/"/g, "&quot;")}" placeholder="Catatan lokasi tambahan / keperluan (mis. WFH Depok / Klien)…" />
          </div>

          <div id="kla-err" style="font-size:12px;color:#fca5a5"></div>
          <button type="button" id="kla-submit" class="kai-sec-btn" style="width:100%;padding:12px">🛡️ Verifikasi Berlapis &amp; Kirim Absen ${kind === "out" ? "Pulang" : "Masuk"}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    let camStream = null;
    let stopLiveness = null;
    let observedLiveness = 0;
    let faceData = null;
    let faceEmbedding = null;
    let livenessScore = 0;
    let kycInfo = null;
    let secondFactorType = "voice";
    let challenge = null;
    let voiceRec = null;
    let voiceResult = null;
    let gpsState = { lat: opts.lat ?? null, lng: opts.lng ?? null, outsideOffice: false, lokasiLabel: "", autoDetectedMaps: true };

    const cleanup = () => {
      if (stopLiveness) { stopLiveness(); stopLiveness = null; }
      if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; }
      if (voiceRec) { voiceRec.cancel(); voiceRec = null; }
      if (stopGps) { stopGps(); }
    };
    const close = () => { cleanup(); modal.remove(); };
    modal.addEventListener("click", (ev) => { if (ev.target === modal) close(); });
    modal.querySelector(".kai-sec-close").addEventListener("click", close);

    const stopGps = autoDetectGps((g) => {
      const st = modal.querySelector("#kla-gps-st");
      if (g.status === "ready") {
        gpsState = g;
        st.style.color = g.outsideOffice ? "#fbbf24" : "#6ee7b7";
        st.textContent = `✓ Maps Terdeteksi Otomatis: ${g.lat.toFixed(5)}, ${g.lng.toFixed(5)} · ${g.lokasiLabel}`;
      } else if (g.status === "error") {
        st.style.color = "#fbbf24";
        st.textContent = "⚠️ " + g.error;
      }
    });

    fetchVoiceChallenge(sess.token).then((c) => {
      challenge = c;
      const pEl = modal.querySelector("#kla-phrase");
      if (pEl) pEl.textContent = `Ucapkan: "${c.phrase}"`;
    });

    (async () => {
      const bEl = modal.querySelector("#kla-kyc-banner");
      try {
        const res = await apiCall("GET", "/api/kyc/me", undefined, sess.token);
        kycInfo = res && res.kyc ? res.kyc : null;
        if (kycInfo && kycInfo.faceEnrolled) {
          if (window.__KAI_KYC__ && window.__KAI_KYC__.ensureFaceModels) {
            window.__KAI_KYC__.ensureFaceModels().catch(() => {});
          }
          if (bEl) {
            bEl.style.borderColor = "#175c49";
            bEl.style.background = "#0b241d";
            bEl.style.color = "#6ee7b7";
            bEl.innerHTML = `<span>🔒 <b>Biometrik 1:1 Aktif</b> — Wajah ${kycInfo.faceEnrolled ? "✓" : "✗"} · Voiceprint ${kycInfo.voiceEnrolled ? "✓" : "Belum"} · Status e-KYC: <b>${kycInfo.kycStatus}</b></span>`;
          }
        } else if (bEl) {
          bEl.style.borderColor = "#5b4a17";
          bEl.style.background = "#2a2113";
          bEl.style.color = "#fbbf24";
          bEl.innerHTML = `<span>⚠️ <b>Masa Transisi (Belum KYC):</b> Anda tetap dapat absen hari ini. Segera daftarkan Wajah, Suara &amp; KTP/KIA/Passport.</span><button type="button" id="kla-open-kyc-btn" class="kai-sec-btn warn" style="padding:5px 10px;font-size:11.5px">🪪 Daftar e-KYC</button>`;
          const kbtn = bEl.querySelector("#kla-open-kyc-btn");
          if (kbtn) {
            kbtn.onclick = () => {
              close();
              if (window.__KAI_KYC__ && window.__KAI_KYC__.openKycEnrollmentModal) {
                window.__KAI_KYC__.openKycEnrollmentModal("face");
              }
            };
          }
        }
      } catch (_) {
        if (bEl) bEl.style.display = "none";
      }
    })();

    const vid = modal.querySelector("#kla-vid");
    const img = modal.querySelector("#kla-img");
    const ph = modal.querySelector("#kla-cam-ph");
    const liveSt = modal.querySelector("#kla-live-st");
    const btnOn = modal.querySelector("#kla-cam-on");
    const btnSnap = modal.querySelector("#kla-cam-snap");
    const btnRetake = modal.querySelector("#kla-cam-retake");

    btnOn.onclick = async () => {
      modal.querySelector("#kla-err").textContent = "";
      try {
        camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 } }, audio: false });
        vid.srcObject = camStream;
        vid.style.display = "block";
        img.style.display = "none";
        ph.style.display = "none";
        btnOn.style.display = "none";
        btnSnap.style.display = "inline-flex";
        await vid.play().catch(() => {});
        stopLiveness = createLivenessMonitor(vid, (st) => {
          observedLiveness = Math.max(observedLiveness, st.score || 0);
          liveSt.style.color = st.ready ? "#6ee7b7" : "#fbbf24";
          liveSt.textContent = st.msg;
        });
      } catch (e) {
        modal.querySelector("#kla-err").textContent = "Kamera gagal dibuka: " + (e.message || e);
      }
    };

    btnSnap.onclick = async () => {
      modal.querySelector("#kla-err").textContent = "";
      btnSnap.disabled = true;
      try {
        const cap = await captureWithLiveness(vid, observedLiveness);
        faceData = cap.dataUrl;
        livenessScore = cap.livenessScore;
        faceEmbedding = null;
        if (window.__KAI_KYC__ && window.__KAI_KYC__.extractLiveFaceDescriptor) {
          liveSt.style.color = "#93c5fd";
          liveSt.textContent = "Mengekstrak vektor wajah 128-D…";
          try {
            const ext = await window.__KAI_KYC__.extractLiveFaceDescriptor(cap.canvas || cap.dataUrl);
            if (ext && ext.ok && ext.embedding) {
              faceEmbedding = ext.embedding;
            }
          } catch (_) {}
        }
        if (kycInfo && kycInfo.faceEnrolled && !faceEmbedding) {
          throw new Error("Wajah belum terbaca oleh detektor 128-D. Hadapkan wajah ke kamera dengan pencahayaan cukup lalu ulangi.");
        }
        img.src = faceData;
        img.style.display = "block";
        vid.style.display = "none";
        btnSnap.style.display = "none";
        btnRetake.style.display = "inline-flex";
        liveSt.style.color = "#6ee7b7";
        liveSt.textContent = `✓ Foto wajah live dikunci (Liveness ${livenessScore.toFixed(1)}${faceEmbedding ? " · 128-D Biometrik Siap" : ""})`;
        if (stopLiveness) { stopLiveness(); stopLiveness = null; }
        if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; }
      } catch (e) {
        modal.querySelector("#kla-err").textContent = e.message || String(e);
      } finally {
        btnSnap.disabled = false;
      }
    };

    btnRetake.onclick = () => {
      faceData = null;
      faceEmbedding = null;
      livenessScore = 0;
      observedLiveness = 0;
      btnRetake.style.display = "none";
      btnOn.click();
    };

    const mVoice = modal.querySelector("#kla-mode-voice");
    const mPwd = modal.querySelector("#kla-mode-pwd");
    const bVoice = modal.querySelector("#kla-box-voice");
    const bPwd = modal.querySelector("#kla-box-pwd");
    mVoice.onclick = () => {
      secondFactorType = "voice";
      mVoice.className = "kai-sec-btn";
      mPwd.className = "kai-sec-btn ghost";
      bVoice.style.display = "block";
      bPwd.style.display = "none";
    };
    mPwd.onclick = () => {
      secondFactorType = "password";
      mPwd.className = "kai-sec-btn";
      mVoice.className = "kai-sec-btn ghost";
      bPwd.style.display = "block";
      bVoice.style.display = "none";
    };

    const recBtn = modal.querySelector("#kla-rec-btn");
    const voiceSt = modal.querySelector("#kla-voice-st");
    recBtn.onclick = async () => {
      modal.querySelector("#kla-err").textContent = "";
      if (!voiceRec) {
        try {
          recBtn.textContent = "⏹ Hentikan & Verifikasi Suara";
          recBtn.className = "kai-sec-btn";
          voiceSt.style.color = "#93c5fd";
          voiceSt.textContent = "Merekam… silakan ucapkan frasa verifikasi sekarang.";
          voiceRec = await startVoiceRecorder({
            onLevel: (rms) => {
              const pct = Math.min(100, Math.round(rms * 500));
              voiceSt.textContent = `Merekam suara… level ${pct}%`;
            },
          });
        } catch (e) {
          voiceRec = null;
          recBtn.textContent = "🎙️ Rekam Suara Verifikasi";
          recBtn.className = "kai-sec-btn warn";
          modal.querySelector("#kla-err").textContent = e.message || String(e);
        }
      } else {
        try {
          const res = await voiceRec.stop();
          voiceRec = null;
          voiceResult = res;
          recBtn.textContent = "↺ Rekam Ulang Suara";
          recBtn.className = "kai-sec-btn ghost";
          voiceSt.style.color = "#6ee7b7";
          voiceSt.textContent = `✓ Suara terverifikasi (RMS ${res.voiceEnergy} · #${res.voiceDigest.slice(0, 8)})`;
        } catch (e) {
          voiceRec = null;
          recBtn.textContent = "🎙️ Rekam Suara Verifikasi";
          recBtn.className = "kai-sec-btn warn";
          modal.querySelector("#kla-err").textContent = e.message || String(e);
        }
      }
    };

    return await new Promise((resolve, reject) => {
      modal.querySelector("#kla-submit").onclick = async () => {
        const errEl = modal.querySelector("#kla-err");
        errEl.textContent = "";
        if (!faceData) { errEl.textContent = "Ambil foto wajah via kamera live terlebih dahulu."; return; }
        const note = modal.querySelector("#kla-note").value.trim();
        if (gpsState.lat == null && note.length < 6) {
          errEl.textContent = "Lokasi GPS belum terdeteksi; izinkan GPS atau isi catatan lokasi min. 6 huruf.";
          return;
        }
        const payload = {
          jenis: kind,
          kind,
          faceImage: faceData,
          faceEmbedding,
          captureSource: "live-camera",
          livenessScore,
          secondFactorType,
          lat: gpsState.lat,
          lng: gpsState.lng,
          autoDetectedMaps: true,
          outsideOffice: Boolean(gpsState.outsideOffice || gpsState.lat == null),
          workMode: gpsState.outsideOffice ? "Luar Kantor / Remote" : "WFO Kantor Pusat",
          locationNote: note,
          lokasi: note || gpsState.lokasiLabel || "Kantor Pusat SCBD",
        };
        if (secondFactorType === "voice") {
          if (!voiceResult) { errEl.textContent = "Rekam suara verifikasi terlebih dahulu."; return; }
          payload.voicePhrase = (challenge && challenge.phrase) || "GIO910 HADIR";
          payload.voiceDigest = voiceResult.voiceDigest;
          payload.voiceEnergy = voiceResult.voiceEnergy;
          payload.voiceDurationMs = voiceResult.voiceDurationMs;
          if (voiceResult.voiceProfile) payload.voiceProfile = voiceResult.voiceProfile;
          if (challenge) {
            payload.voiceChallengeSig = challenge.sig;
            payload.voiceChallengeExpiresAt = challenge.expiresAt;
          }
        } else {
          const pwd = modal.querySelector("#kla-pwd-inp").value;
          if (!pwd) { errEl.textContent = "Masukkan Password akun Anda."; return; }
          payload.password = pwd;
        }
        const subBtn = modal.querySelector("#kla-submit");
        subBtn.disabled = true;
        subBtn.textContent = "Memverifikasi ke Supabase…";
        try {
          const endpoint = opts.endpoint || "/api/absen";
          const res = await apiCall("POST", endpoint, payload, sess.token);
          close();
          resolve(res);
        } catch (e) {
          subBtn.disabled = false;
          subBtn.textContent = `🛡️ Verifikasi Berlapis & Kirim Absen ${kind === "out" ? "Pulang" : "Masuk"}`;
          errEl.textContent = e.message || String(e);
        }
      };
      modal.querySelector(".kai-sec-close").addEventListener("click", () => reject(new Error("Absensi dibatalkan.")));
    });
  }

  window.__KAI_SECURITY__ = {
    version: "v4.7",
    get API_BASE() { return getApiBase(); },
    OFFICE_LAT,
    OFFICE_LNG,
    OFFICE_RADIUS_M,
    haversineMeters,
    sha256Hex,
    buildZipStore,
    parseZipEntries,
    encryptJsonWithPassword,
    decryptJsonWithPassword,
    buildEncryptedLoginZip,
    parseAndVerifyEncryptedLoginZip,
    isReallyOnline,
    downloadEncryptedZipOnlineOnly,
    issueAndDownloadEncryptedZip: (token, password, opts) =>
      downloadEncryptedZipOnlineOnly({ token, password, ...(opts || {}) }),
    setAccountPasswordOnline,
    loginManualWithZip,
    createLivenessMonitor,
    captureWithLiveness,
    fetchVoiceChallenge,
    startVoiceRecorder,
    autoDetectGps,
    openPasswordZipModal,
    openLayeredAttendanceModal,
  };
})();
