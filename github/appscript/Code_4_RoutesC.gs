function dispatchC_(route, token, p) {
  let u, x;
  switch (route) {
    case 'audit.list': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Auditor']);
      // R-22: tidak lagi dipotong 200 baris — pilih bulan (p.month, format kunci audit) dan batas hingga CFG.AUDIT_LIST_MAX
      const lim = Math.min(CFG.AUDIT_LIST_MAX, Math.max(1, Number(p.limit) || 1000));
      if (u.Tier === 'Auditor') auditAppend_(u.Nama, 'Auditor membaca jejak audit', 'Audit', u.ID);
      return readJSON_(p.month || auditMonthKey_(), []).slice().reverse().slice(0, lim);
    }
    case 'audit.verify': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Auditor']);
      return auditVerify_(p.month || auditMonthKey_());
    }

    case 'pengguna.list': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Auditor']); // P-40: Auditor baca-saja (tanpa PIN/hash)
      auditAppend_(u.Nama, 'Membaca daftar pengguna', 'Pengguna', u.ID);
      return db_('users').map(function (a) { const q = pub_(a); q.Aktif = a.Aktif; q.OfflinePinAktif = a.OfflinePinAktif === 'YA' ? 'YA' : 'TIDAK'; q.OfflinePinSet = !!a.OfflinePin; return q; });
    }
    case 'pengguna.create': {
      u = userFromToken_(token); allow_(u, ['Pemilik']);
      const on = p.offlinePinAktif === 'YA' ? 'YA' : 'TIDAK';
      const pin = String(p.offlinePin || '').trim();
      if (on === 'YA' && !/^\d{4,8}$/.test(pin)) throw new Error('PIN offline harus 4–8 digit angka.');
      x = { ID: String(p.id || makeId_('USR')).toUpperCase(), Nama: String(p.nama || ''), Jabatan: String(p.jabatan || 'Staf'), Unit: String(p.unit || 'Umum'), Tier: p.tier || 'Staf', Email: String(p.email || '').toLowerCase(), Aktif: 'YA', StatusKepegawaian: p.statusKepegawaian || 'Karyawan FTE', Fase: p.fase || 3, OfflinePinAktif: on, OfflinePin: on === 'YA' ? pin : '', atasanId: p.atasanId || '', entitas: p.entitas || '' };
      if (!x.Nama || !x.Email) throw new Error('Nama dan email wajib.');
      if (!/^[A-Z0-9][A-Z0-9-]{1,15}$/.test(x.ID)) throw new Error('ID akun: 2–16 karakter huruf besar/angka/tanda hubung (F-01).');
      if (!validEmail_(x.Email)) throw new Error('Format email tidak valid (F-06).');
      if (TIERS.indexOf(x.Tier) < 0) throw new Error('Peran tidak dikenal (F-05).');
      if (x.OfflinePin) x.OfflinePin = pinHash_(x.ID, x.OfflinePin); // F-11: PIN tidak pernah disimpan sebagai teks polos
      const list = db_('users');
      if (list.some(function (a) { return a.ID.toUpperCase() === x.ID; })) throw new Error('ID akun sudah digunakan (R-24).');
      if (list.some(function (a) { return String(a.Email).toLowerCase() === x.Email; })) throw new Error('Email sudah dipakai akun lain (R-24).');
      list.push(x); dbSet_('users', list);
      auditAppend_(u.Nama, 'Pengguna baru ' + x.ID, 'Pengguna', x.ID, '', x.Nama);
      const q = pub_(x); q.Aktif = 'YA'; q.OfflinePinSet = !!x.OfflinePin; return q;
    }
    case 'pengguna.email': {
      u = userFromToken_(token); allow_(u, ['Pemilik']);
      const list = db_('users'); x = list.find(function (a) { return a.ID === p.id; });
      if (!x) throw new Error('Akun tidak ditemukan.');
      const newEmail = String(p.email || '').trim().toLowerCase();
      if (!validEmail_(newEmail)) throw new Error('Format email tidak valid (F-06).');
      if (list.some(function (a) { return a.ID !== x.ID && String(a.Email).toLowerCase() === newEmail; })) throw new Error('Email sudah dipakai akun lain.');
      const oldEmail = x.Email;
      x.Email = newEmail; dbSet_('users', list);
      // R-25: ganti email mencabut sesi aktif akun tersebut dan dicatat sebelum→sesudah (tersamar)
      const sE = sessions_(); Object.keys(sE).forEach(function (k) { if (sE[k].uid === x.ID) delete sE[k]; }); sessionSave_(sE);
      auditAppend_(u.Nama, 'Email ' + x.ID + ' diperbarui', 'Pengguna', x.ID, maskEmail_(oldEmail), maskEmail_(newEmail));
      const q = pub_(x); q.Aktif = x.Aktif; q.OfflinePinSet = !!x.OfflinePin; return q;
    }
    case 'pengguna.status': {
      u = userFromToken_(token); allow_(u, ['Pemilik']);
      const list = db_('users'); x = list.find(function (a) { return a.ID === p.id; });
      if (!x) throw new Error('Akun tidak ditemukan.');
      if (x.ID === u.ID && p.aktif === 'TIDAK') throw new Error('Ditolak: Pemilik tidak dapat menonaktifkan akunnya sendiri.');
      x.Aktif = p.aktif === 'TIDAK' ? 'TIDAK' : 'YA';
      if (x.Aktif === 'TIDAK') x.OfflinePinAktif = 'TIDAK'; // R-26: nonaktif = PIN offline ikut mati + sesi dicabut
      dbSet_('users', list);
      if (x.Aktif === 'TIDAK') { const s = sessions_(); Object.keys(s).forEach(function (k) { if (s[k].uid === x.ID) delete s[k]; }); sessionSave_(s); }
      auditAppend_(u.Nama, 'Pengguna ' + x.ID + ' -> ' + x.Aktif, 'Pengguna', x.ID);
      const q = pub_(x); q.Aktif = x.Aktif; q.OfflinePinSet = !!x.OfflinePin; return q;
    }
    case 'pengguna.offlinePin': {
      u = userFromToken_(token); allow_(u, ['Pemilik']);
      const list = db_('users'); x = list.find(function (a) { return a.ID === p.id; });
      if (!x) throw new Error('Akun tidak ditemukan.');
      const on = p.aktif === 'YA' ? 'YA' : 'TIDAK';
      const pin = String(p.pin || '').trim();
      if (pin && !/^\d{4,8}$/.test(pin)) throw new Error('PIN offline harus 4–8 digit angka.');
      if (on === 'YA' && !pin && !x.OfflinePin) throw new Error('Isi PIN untuk mengaktifkan akses offline.');
      if (pin) { x.OfflinePin = pinHash_(x.ID, pin); failReset_('pin', x.ID); } // R-27: simpan hash, bukan PIN
      x.OfflinePinAktif = on; dbSet_('users', list);
      auditAppend_(u.Nama, 'Akses Offline ' + x.ID + ' -> ' + on, 'Pengguna', x.ID);
      const q = pub_(x); q.Aktif = x.Aktif; q.OfflinePinAktif = on; q.OfflinePinSet = !!x.OfflinePin; return q;
    }

    case 'system.status': {
      u = userFromToken_(token); allow_(u, ['Pemilik']);
      return { tables: { pengguna: db_('users').length, tugas: db_('tasks').length, intake: db_('intake').length, keuangan: db_('cash').length, absen: db_('attendance').length, dokumen: db_('documents').length, audit: readJSON_(auditMonthKey_(), []).length }, storagePath: 'Apps Script Properties + Drive backup', timezone: 'Asia/Jakarta (WIB)', activeSessions: Object.keys(sessions_()).length, version: CFG.VER };
    }

    case 'ai.assist': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Staf']);
      if (String(p.prompt || '').length > 8000) throw new Error('Permintaan AI terlalu panjang (maks 8.000 karakter).');
      // R-29: setiap permintaan AI tercatat (tanpa menyimpan isi prompt — PDP)
      auditAppend_(u.Nama, 'Permintaan Asisten AI · mode ' + String(p.mode || 'ringkas_eksekutif') + ' · ' + String(p.prompt || '').length + ' karakter', 'AI', u.ID);
      const key = String(P().getProperty('KAI_AI_KEY') || '');
      if (!key) {
        return { text: '[MODE LOKAL — kunci AI belum diisi]\nMode: ' + (p.mode || 'ringkas_eksekutif') + '\nPermintaan: ' + String(p.prompt || '').slice(0, 1000) + '\n\nIsi KAI_AI_KEY di Script Properties untuk mengaktifkan Gemini. Periksa fakta, limit RAPID, dan persetujuan manusia sebelum tindakan.', model: 'local-stub', mode: p.mode || 'ringkas_eksekutif', timestamp: now_() };
      }
      const r = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key, { method: 'post', contentType: 'application/json', payload: JSON.stringify({ contents: [{ parts: [{ text: String(p.prompt || '').slice(0, 8000) }] }], generationConfig: { temperature: 0.2 } }), muteHttpExceptions: true });
      const data = JSON.parse(r.getContentText());
      return { text: (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text) || 'Tidak ada jawaban.', model: 'gemini-2.0-flash', mode: p.mode || 'ringkas_eksekutif', timestamp: now_() };
    }

    default:
      if (String(route || '').indexOf('dao.') === 0 && typeof handleDaoHybridRoute === 'function') {
        var daoSess = null;
        if (route === 'dao.sync') {
          u = userFromToken_(token);
          allow_(u, ['Pemilik', 'Manajemen', 'Auditor']);
          daoSess = { role: u.Tier === 'Pemilik' ? 'P' : (u.Tier === 'Manajemen' ? 'M' : 'A'), user: u };
        }
        return handleDaoHybridRoute(route, p, daoSess);
      }
      throw new Error('Route tidak dikenal: ' + route);
  }
}

/* ---------------- jarak kantor (untuk radius absensi) ---------------- */
