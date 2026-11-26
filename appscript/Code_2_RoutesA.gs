function dispatch_(route, token, p) {
  let u, x;
  switch (route) {
    case 'auth.profiles': {
      // R-01: TANPA sesi → daftar kosong (nama, jabatan & email tidak bisa dipanen dari halaman publik).
      let caller = null;
      try { caller = token ? userFromToken_(token) : null; } catch (e) { caller = null; }
      if (!caller) return [];
      if (['Pemilik', 'Manajemen', 'Auditor'].indexOf(caller.Tier) < 0) return [pub_(caller)];
      auditAppend_(caller.Nama, 'Membaca direktori profil', 'Autentikasi', caller.ID);
      return db_('users').filter(function (a) { return a.Aktif === 'YA'; }).map(pub_);
    }

    case 'auth.otpRequest':
      return otpSend_(p.email);

    case 'auth.login': {
      const email = String(p.email || '').trim().toLowerCase();
      u = db_('users').find(function (a) { return a.Email.toLowerCase() === email && a.Aktif === 'YA'; });
      const rec = readJSON_('kai.otps', {})[email];
      if (!u || !rec || rec.exp < Date.now()) throw new Error('Kode OTP salah atau kedaluwarsa. Minta kode baru.');
      if (rec.code !== sha256_('KAI-OTP|' + email + '|' + String(p.otp || '').trim())) {
        const otpsF = readJSON_('kai.otps', {});
        rec.tries = (rec.tries || 0) + 1;
        if (rec.tries >= CFG.OTP_MAX_TRIES) delete otpsF[email]; else otpsF[email] = rec;
        writeJSON_('kai.otps', otpsF);
        auditAppend_(u.Nama, 'Login OTP gagal (' + rec.tries + '/' + CFG.OTP_MAX_TRIES + ')', 'Autentikasi', u.ID);
        throw new Error('Kode OTP salah atau kedaluwarsa (maks ' + CFG.OTP_MAX_TRIES + ' percobaan).');
      }
      if (!p.faceImage || !isFinite(Number(p.lat)) || !isFinite(Number(p.lng))) throw new Error('Lengkapi foto wajah dan lokasi untuk lanjut.');
      const otps = readJSON_('kai.otps', {}); delete otps[email]; writeJSON_('kai.otps', otps);
      const tok = makeId_('SESSION');
      const s = sessions_(); s[tok] = { uid: u.ID, exp: Date.now() + CFG.SESSION_HOURS * 3600 * 1000 }; sessionSave_(s);
      auditAppend_(u.Nama, 'Login Wajah + Maps + OTP', 'Autentikasi', tok);
      return { token: tok, user: pub_(u) };
    }

    case 'auth.loginPin': {
      const id = String(p.id || '').trim().toUpperCase();
      const pin = String(p.pin || '').trim();
      const kendala = String(p.kendala || 'Kondisi Offline / Kendala Faktor Utama').trim().slice(0, 120);
      if (!id || !pin) throw new Error('Masukkan ID akun dan PIN offline.');
      u = db_('users').find(function (a) { return a.ID.toUpperCase() === id && a.Aktif === 'YA'; });
      const lockedMin = failLocked_('pin', id);
      if (lockedMin) throw new Error('Akun ' + id + ' dikunci sementara (' + lockedMin + ' menit tersisa) karena ' + CFG.PIN_MAX_FAIL + '× salah PIN.');
      if (!u) { failHit_('pin', id); throw new Error('ID atau PIN akses offline tidak sesuai.'); }
      if (u.OfflinePinAktif !== 'YA' || !u.OfflinePin) {
        auditAppend_(u.Nama, 'Login Offline ditolak — tidak berizin (' + u.ID + ')', 'Autentikasi');
        throw new Error('Akses ditolak: akun ini tidak memiliki izin akses Offline (ID + PIN).');
      }
      if (!pinCheck_(u, pin)) {
        const f = failHit_('pin', id);
        auditAppend_(u.Nama, 'Login Offline gagal — PIN salah (' + u.ID + ')' + (f.until > Date.now() ? ' · akun dikunci ' + CFG.PIN_LOCK_MIN + ' menit' : ''), 'Autentikasi', u.ID);
        throw new Error('ID atau PIN akses offline tidak sesuai.');
      }
      failReset_('pin', id);
      const tok = makeId_('SESSION');
      const s = sessions_(); s[tok] = { uid: u.ID, exp: Date.now() + CFG.SESSION_HOURS * 3600 * 1000 }; sessionSave_(s);
      auditAppend_(u.Nama, 'Login Mode Offline/Darurat (ID + PIN) · ' + kendala, 'Autentikasi', tok);
      return { token: tok, user: pub_(u), authMethod: 'offline-pin', kendala: kendala };
    }

    case 'auth.me':
      return { user: pub_(userFromToken_(token)) };

    case 'auth.cardIssue': {
      // kartu akses darurat: ditandatangani server, berlaku lintas perangkat
      const days = Math.min(90, Math.max(1, Number(p.days) || 30));
      const secret = String(P().getProperty('KAI_CARD_SECRET') || '');
      if (!secret) throw new Error('KAI_CARD_SECRET belum diisi di Script Properties.');
      u = userFromToken_(token);
      const iat = new Date(), exp = new Date(iat.getTime() + days * 864e5);
      const fmt = function (d) { return d.toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta', hour12: false }).replace('T', ' '); };
      const card = { app: 'KANTOR-AI', jenis: 'kartu-akses-darurat', v: 1, uid: u.ID, nama: u.Nama, tier: u.Tier, iat: fmt(iat), exp: fmt(exp), expMs: exp.getTime(), nonce: Utilities.getUuid(), perangkat: 'server-signed' };
      card.sig = Utilities.base64Encode(Utilities.computeHmacSha256Signature([card.uid, card.nama, card.tier, card.iat, card.exp, card.nonce].join('|'), secret, Utilities.Charset.UTF_8));
      auditAppend_(u.Nama, 'Kartu akses darurat diterbitkan (' + days + ' hari)', 'Autentikasi');
      return { ok: true, card: card };
    }
    case 'auth.loginFile': {
      const c = p.card || {};
      const secret = String(P().getProperty('KAI_CARD_SECRET') || '');
      if (!secret) throw new Error('Kartu akses belum diaktifkan di server.');
      const msg = [c.uid, c.nama, c.tier, c.iat, c.exp, c.nonce].join('|');
      const sig = Utilities.base64Encode(Utilities.computeHmacSha256Signature(msg, secret, Utilities.Charset.UTF_8));
      if (sig !== String(c.sig || '')) throw new Error('Tanda tangan kartu tidak cocok.');
      if (new Date(c.exp).getTime() < Date.now()) throw new Error('Kartu akses kedaluwarsa.');
      const rev = readJSON_('kai.revoked', []);
      if (rev.indexOf(String(c.nonce)) >= 0) throw new Error('Kartu akses sudah dicabut.');
      u = db_('users').find(function (a) { return a.ID.toUpperCase() === String(c.uid || '').toUpperCase() && a.Aktif === 'YA'; });
      if (!u) throw new Error('Akun kartu tidak ditemukan atau nonaktif.');
      const tok = makeId_('SESSION');
      const s = sessions_(); s[tok] = { uid: u.ID, exp: Date.now() + CFG.SESSION_HOURS * 3600 * 1000 }; sessionSave_(s);
      auditAppend_(u.Nama, 'Login dengan Kartu Akses Darurat (berkas)', 'Autentikasi', tok);
      return { token: tok, user: pub_(u), authMethod: 'access-file' };
    }
    case 'auth.cardRevoke': {
      const secret = String(P().getProperty('KAI_CARD_SECRET') || '');
      u = userFromToken_(token); allow_(u, ['Pemilik']);
      const rev = readJSON_('kai.revoked', []);
      const nonce = String(p.nonce || '');
      if (nonce && rev.indexOf(nonce) < 0) rev.push(nonce);
      writeJSON_('kai.revoked', rev);
      auditAppend_(u.Nama, 'Kartu akses dicabut', 'Autentikasi');
      return { ok: true, revoked: rev.length };
    }
    case 'auth.logout': {
      const all = sessions_(); u = userFromToken_(token);
      delete all[token]; sessionSave_(all);
      auditAppend_(u.Nama, 'Logout', 'Autentikasi');
      return { ok: true };
    }

    case 'dashboard.get': {
      u = userFromToken_(token);
      if (['Pemilik', 'Manajemen', 'Staf', 'Auditor'].indexOf(u.Tier) < 0) {
        // L05 P-25/P-41: Freelancer & Tamu tidak menerima KPI kas, antrean, maupun jejak audit
        const mine = u.Tier === 'Freelancer' ? db_('tasks').filter(function (a) { return a.Eksekutor === u.Nama || a.EksekutorID === u.ID; }) : [];
        return { antrean: 0, totalIntake: 0, tugasSelesai: mine.filter(function (a) { return a.Status === 'Selesai'; }).length, totalTugas: mine.length, saldoKas: 0, totalMasuk: 0, totalKeluar: 0, dokumen: 0, absenMenunggu: 0, auditTerakhir: [], terbatas: true };
      }
      const cash = db_('cash');
      const inc = cash.filter(function (a) { return a.Jenis === 'Masuk'; }).reduce(function (s, a) { return s + Number(a.Nominal || 0); }, 0);
      const out = cash.filter(function (a) { return a.Jenis === 'Keluar'; }).reduce(function (s, a) { return s + Number(a.Nominal || 0); }, 0);
      const auditRows = readJSON_(auditMonthKey_(), []);
      return {
        antrean: db_('intake').filter(function (a) { return ['Masuk', 'Direview', 'Perlu Info'].indexOf(a.Status) >= 0; }).length,
        totalIntake: db_('intake').length,
        tugasSelesai: db_('tasks').filter(function (a) { return a.Status === 'Selesai'; }).length,
        totalTugas: db_('tasks').length,
        saldoKas: inc - out, totalMasuk: inc, totalKeluar: out,
        dokumen: db_('documents').length,
        absenMenunggu: db_('attendance').filter(function (a) { return a.StatusVerifikasi === 'menunggu-verifikasi-atasan'; }).length,
        auditTerakhir: ['Pemilik', 'Manajemen', 'Auditor'].indexOf(u.Tier) >= 0 ? auditRows.slice(-8).reverse() : auditRows.filter(function (a) { return a.u === u.Nama; }).slice(-8).reverse()
      };
    }

    case 'intake.list': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Staf', 'Auditor']); // P-34: Auditor baca-saja
      const unitKey = String(u.Unit || '').split(' · ')[0];
      // R-08: Staf hanya melihat usulan unitnya / yang diajukannya
      const rowsI = u.Tier === 'Staf' ? db_('intake').filter(function (a) { return String(a.Unit || '').split(' · ')[0] === unitKey || a.PengajuID === u.ID || a.Pengaju === u.Nama; }) : db_('intake');
      return rowsI.slice().reverse();
    }
    case 'intake.create': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Staf']);
      const title = String(p.judul || '').trim();
      if (!title) throw new Error('Judul intake wajib.');
      x = { ID: makeId_('INT'), Judul: title.slice(0, 180), Kategori: String(p.kategori || 'Operasional'), Nilai: Number(p.nilai) || 0, Unit: String(p.unit || u.Unit), Pengaju: u.Nama, Status: 'Masuk', Riwayat: now_() + ' dibuat ' + u.Nama, TanggalBuat: date_(), tenggat: p.tenggat || '', lampiran: p.lampiran || [], entitas: p.entitas || '', dasarPersetujuan: '' };
      x.PengajuID = u.ID; x.entitas = String(p.entitas || u.entitas || '');
      const list = db_('intake'); list.unshift(x); dbSet_('intake', list);
      auditAppend_(u.Nama, 'Intake baru ' + x.ID, 'Intake', x.ID, '', x.Judul);
      return x;
    }
    case 'intake.status': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Staf']);
      const list = db_('intake'); x = list.find(function (a) { return a.ID === p.id; });
      if (!x) throw new Error('Intake tidak ditemukan.');
      if (['Masuk', 'Direview', 'Perlu Info', 'Disetujui', 'Ditolak', 'Ditunda', 'Dieksekusi', 'Selesai'].indexOf(String(p.aksi)) < 0) throw new Error('Status intake tidak dikenal.');
      const finalDecision = p.aksi === 'Disetujui' || p.aksi === 'Ditolak';
      // R-10: keputusan akhir hanya Manajemen/Pemilik, dan pengaju tidak boleh memutus usulannya sendiri (maker ≠ checker)
      if (finalDecision && ['Pemilik', 'Manajemen'].indexOf(u.Tier) < 0) throw new Error('Akses ditolak: keputusan akhir (Disetujui/Ditolak) hanya oleh Manajemen atau Pemilik (R-10).');
      if (finalDecision && (x.PengajuID ? x.PengajuID === u.ID : x.Pengaju === u.Nama)) throw new Error('Ditolak: pemisahan tugas (maker ≠ checker) — pengaju tidak boleh memutus usulannya sendiri.');
      if (u.Tier === 'Staf' && String(x.Unit || '').split(' · ')[0] !== String(u.Unit || '').split(' · ')[0] && x.PengajuID !== u.ID) throw new Error('Akses ditolak: Staf hanya memproses usulan unitnya sendiri.');
      if (['Disetujui', 'Ditolak', 'Selesai'].indexOf(x.Status) >= 0 && rank_(u) < 3) throw new Error('Ditolak: usulan berstatus final hanya dapat dibuka kembali oleh Pemilik/Direktur.');
      if (p.aksi === 'Disetujui') {
        const need = x.Nilai > 5e9 ? 3 : (x.Nilai > 5e8 ? 2 : 1);
        if (rank_(u) < need) throw new Error('Ditolak oleh aturan RAPID: nilai ini butuh peringkat ' + need + '.');
        if (Number(x.Nilai) >= 1e8 && (!x.lampiran || !x.lampiran.length)) throw new Error('Persetujuan >Rp100 juta wajib lampiran memo/DD.');
      }
      const oldStatus = x.Status;
      x.Status = p.aksi; x.Riwayat += ' | ' + now_() + ' ' + u.Nama + ' -> ' + p.aksi;
      dbSet_('intake', list);
      auditAppend_(u.Nama, 'Intake ' + x.ID + ' -> ' + p.aksi, 'Intake', x.ID, oldStatus, p.aksi);
      return x;
    }

    default:
      return dispatchB_(route, token, p);
  }
}
