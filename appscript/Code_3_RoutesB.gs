function dispatchB_(route, token, p) {
  let u, x;
  switch (route) {
    case 'keuangan.list': { u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Staf', 'Auditor']); return db_('cash').slice().reverse(); }
    case 'keuangan.create': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Staf']);
      const n = Number(p.nominal);
      if (!(n > 0)) throw new Error('Nominal harus > 0.');
      if (p.tanggal && !/^\d{4}-\d{2}-\d{2}$/.test(String(p.tanggal))) throw new Error('Format tanggal kas harus YYYY-MM-DD.');
      if (p.tanggal && String(p.tanggal) > date_()) throw new Error('Tanggal kas tidak boleh melebihi hari ini (F-37).');
      periodGuard_(p.tanggal || date_());
      if (p.jenis === 'Keluar' && n > 1e8 && rank_(u) < 3) throw new Error('Pengeluaran > Rp100 juta wajib Pemilik/Direktur.');
      if (n >= 1e6 && !(p.lampiran && p.lampiran.length)) throw new Error('Transaksi >= Rp1 juta wajib lampiran (kebijakan bukti O-07).');
      x = { ID: makeId_('KAS'), Tanggal: p.tanggal || date_(), Jenis: p.jenis === 'Keluar' ? 'Keluar' : 'Masuk', Kategori: String(p.kategori || 'Umum'), Nominal: Math.round(n), Keterangan: String(p.keterangan || ''), Oleh: u.Nama, Status: 'Draft', Rekonsiliasi: 'Belum', entitas: p.entitas || '', coa: p.coa || '', lampiran: p.lampiran || [], dibuatOleh: u.ID, disetujuiOleh: '', periode: (p.periode || date_().slice(0, 7)), approvals: [] };
      x.dibuatOleh = u.ID; x.periode = String(x.Tanggal).slice(0, 7); x.Status = x.Status || 'Menunggu';
      const list = db_('cash'); list.unshift(x); dbSet_('cash', list);
      auditAppend_(u.Nama, 'Kas ' + x.ID + ' dibuat', 'Keuangan', x.ID, '', String(n));
      return x;
    }
    case 'keuangan.update': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen']);
      const list = db_('cash'); x = list.find(function (a) { return a.ID === p.id; });
      if (!x) throw new Error('Kas tidak ditemukan.');
      periodGuard_(x.Tanggal);
      // R-13: pembuat transaksi tidak boleh menyetujui kasnya sendiri (maker ≠ checker)
      if (p.status === 'Disetujui' && (x.dibuatOleh ? x.dibuatOleh === u.ID : x.Oleh === u.Nama)) throw new Error('Ditolak: pemisahan tugas (maker ≠ checker) — pembuat transaksi kas tidak boleh menyetujui kasnya sendiri.');
      if (x.Status === 'Disetujui' && p.status !== undefined && p.status !== 'Disetujui' && rank_(u) < 3) throw new Error('Ditolak: kas yang sudah disetujui hanya dapat dikoreksi Pemilik/Direktur (buat jurnal balik).');
      const oldStatus = x.Status;
      if (p.status === 'Disetujui') {
        const need = Number(x.Nominal) >= CFG.DUAL_CONTROL_IDR ? 2 : 1;
        x.approvals = (x.approvals || []).filter(function (a) { return a.uid !== u.ID; });
        x.approvals.push({ uid: u.ID, nama: u.Nama, at: now_() });
        if (x.approvals.length < need) {
          x.Status = 'Menunggu persetujuan ke-' + x.approvals.length;
          dbSet_('cash', list);
          auditAppend_(u.Nama, 'Persetujuan ' + x.ID + ' (' + x.approvals.length + '/' + need + ')', 'Keuangan', x.ID, oldStatus, x.Status);
          return x;
        }
        x.disetujuiOleh = u.ID;
        x.Status = 'Disetujui';
      } else if (p.status !== undefined) {
        x.Status = p.status;
      }
      if (p.rekonsiliasi !== undefined) x.Rekonsiliasi = p.rekonsiliasi;
      dbSet_('cash', list);
      auditAppend_(u.Nama, 'Kas ' + x.ID + ' -> ' + x.Status, 'Keuangan', x.ID, oldStatus, x.Status);
      return x;
    }

    case 'tugas.list': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Staf', 'Freelancer', 'Auditor']); // P-36: Auditor baca-saja
      // P-28: Freelancer hanya melihat tugas yang ditugaskan kepadanya
      return u.Tier === 'Freelancer' ? db_('tasks').filter(function (a) { return a.Eksekutor === u.Nama || a.EksekutorID === u.ID; }) : db_('tasks');
    }
    case 'tugas.create': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Staf']);
      if (!String(p.tugas || '').trim()) throw new Error('Deskripsi tugas wajib.');
      x = { ID: makeId_('TGS'), Kategori: String(p.kategori || 'Operasional'), Tugas: String(p.tugas).slice(0, 200), Pengerja: String(p.pengerja || 'On-site'), Eksekutor: String(p.eksekutor || u.Nama), Status: 'Belum', tenggat: p.tenggat || '', prioritas: p.prioritas || 'Sedang', buktiSelesai: '' };
      x.DibuatOleh = u.Nama; x.Unit = x.Unit || u.Unit;
      const list = db_('tasks'); list.unshift(x); dbSet_('tasks', list);
      auditAppend_(u.Nama, 'Tugas baru ' + x.ID, 'Tugas', x.ID, '', x.Tugas);
      return x;
    }
    case 'tugas.update': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Staf', 'Freelancer']);
      const list = db_('tasks'); x = list.find(function (a) { return a.ID === p.id; });
      if (!x) throw new Error('Tugas tidak ditemukan.');
      // R-16: Staf/Freelancer hanya memperbarui tugas miliknya
      if (u.Tier === 'Freelancer' && x.Eksekutor !== u.Nama && x.EksekutorID !== u.ID) throw new Error('Akses ditolak: Freelancer hanya dapat memperbarui tugas yang ditugaskan kepadanya (R-16).');
      if (u.Tier === 'Staf' && x.Eksekutor !== u.Nama && x.EksekutorID !== u.ID && x.DibuatOleh !== u.Nama && String(x.Unit || '').split(' · ')[0] !== String(u.Unit || '').split(' · ')[0]) throw new Error('Akses ditolak: Staf hanya dapat memperbarui tugas miliknya atau unitnya (R-16).');
      if (p.status && ['Belum', 'Proses', 'Selesai', 'Tertunda', 'Batal'].indexOf(String(p.status)) < 0) throw new Error('Status tugas tidak dikenal.');
      if (p.status === 'Selesai' && !p.buktiSelesai && !x.buktiSelesai) throw new Error('Tugas selesai wajib bukti (tautan).');
      const oldStatus = x.Status;
      x.Status = p.status || x.Status;
      if (p.buktiSelesai) x.buktiSelesai = p.buktiSelesai;
      dbSet_('tasks', list);
      auditAppend_(u.Nama, 'Tugas ' + x.ID + ' -> ' + x.Status, 'Tugas', x.ID, oldStatus, x.Status);
      return x;
    }

    case 'absen.list': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Staf', 'Auditor']); // P-37: Auditor baca-saja
      const rows = (rank_(u) >= 2 || u.Tier === 'Auditor') ? db_('attendance') : db_('attendance').filter(function (a) { return a.UserID === u.ID; });
      if (rank_(u) >= 2 || u.Tier === 'Auditor') auditAppend_(u.Nama, 'Membaca daftar absensi (' + rows.length + ' baris)', 'Absensi', u.ID);
      return rows.slice().reverse();
    }
    case 'absen.submit': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Staf']);
      if (p.mode === 'offline_pin') {
        const lockedAbs = failLocked_('pin', u.ID);
        if (lockedAbs) throw new Error('PIN dikunci sementara (' + lockedAbs + ' menit tersisa).');
        if (u.OfflinePinAktif !== 'YA' || !pinCheck_(u, String(p.pin || ''))) { failHit_('pin', u.ID); auditAppend_(u.Nama, 'Absen offline gagal — PIN salah', 'Absensi', u.ID); throw new Error('PIN offline tidak sesuai / tidak berizin.'); }
        failReset_('pin', u.ID);
        x = { ID: makeId_('ABS'), Tanggal: date_(), Jam: now_().slice(11, 19), Nama: u.Nama, UserID: u.ID, Jenis: p.jenis === 'out' ? 'out' : 'in', Lokasi: 'Mode Offline/Darurat: ' + String(p.lokasi || 'Tanpa lokasi'), Lat: null, Lng: null, JarakMeter: null, FaceDigest: 'OFFLINE-PIN', Metode: 'Offline (ID + PIN)', StatusVerifikasi: 'menunggu-verifikasi-atasan', DiverifikasiOleh: '' };
      } else {
        const lat = Number(p.lat), lng = Number(p.lng);
        if (!isFinite(lat) || !isFinite(lng)) throw new Error('Lokasi tidak valid.');
        const RADIUS = Number(P().getProperty('KAI_RADIUS_METER') || 150);
        const office = (String(P().getProperty('KAI_OFFICE') || '-6.175,106.827')).split(',').map(Number);
        const dist = haversine_(lat, lng, office[0], office[1]);
        if (dist > RADIUS) throw new Error('Anda di luar radius kantor (' + Math.round(dist) + ' m > ' + RADIUS + ' m).');
        x = { ID: makeId_('ABS'), Tanggal: date_(), Jam: now_().slice(11, 19), Nama: u.Nama, UserID: u.ID, Jenis: p.jenis === 'out' ? 'out' : 'in', Lokasi: String(p.lokasi || 'Kantor'), Lat: lat, Lng: lng, JarakMeter: Math.round(dist), FaceDigest: 'WAJAH-DIVERIFIKASI', Metode: 'Wajah + Maps', StatusVerifikasi: 'menunggu-verifikasi-atasan', DiverifikasiOleh: '', radiusKantor: RADIUS, deviceId: String(p.deviceId || '') };
      }
      const list = db_('attendance'); list.unshift(x); dbSet_('attendance', list);
      auditAppend_(u.Nama, 'Absen ' + (x.Jenis === 'out' ? 'keluar' : 'masuk') + ' · ' + x.Metode, 'Absensi', x.ID);
      return x;
    }
    case 'absen.verify': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen']);
      const list = db_('attendance'); x = list.find(function (a) { return a.ID === p.id; });
      if (!x) throw new Error('Absen tidak ditemukan.');
      if (x.UserID === u.ID) throw new Error('Ditolak: absensi sendiri harus diverifikasi atasan lain (maker ≠ checker).');
      if (['terverifikasi', 'ditolak', 'menunggu-verifikasi-atasan'].indexOf(String(p.status)) < 0) throw new Error('Status verifikasi tidak dikenal.');
      const oldVer = x.StatusVerifikasi;
      x.StatusVerifikasi = p.status; x.DiverifikasiOleh = u.Nama; x.DiverifikasiPada = now_();
      dbSet_('attendance', list);
      auditAppend_(u.Nama, 'Absen ' + x.ID + ' -> ' + p.status, 'Absensi', x.ID, oldVer, p.status);
      return x;
    }

    case 'dokumen.list': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Staf', 'Auditor', 'Freelancer']);
      const highTier = ['Pemilik', 'Manajemen', 'Auditor'].indexOf(u.Tier) >= 0;
      // P-30: Freelancer hanya dokumen miliknya; klasifikasi Rahasia/Sangat Rahasia hanya Pemilik/Manajemen/Auditor
      return db_('documents').filter(function (a) {
        if (u.Tier === 'Freelancer') return a.pemilikID === u.ID || a.Oleh === u.Nama;
        if (!highTier && (a.klasifikasi === 'Rahasia' || a.klasifikasi === 'Sangat Rahasia')) return a.pemilikID === u.ID || a.Oleh === u.Nama;
        return true;
      }).slice().reverse();
    }
    case 'dokumen.create': {
      u = userFromToken_(token); allow_(u, ['Pemilik', 'Manajemen', 'Staf']);
      const isi = String(p.isi || '');
      if (!String(p.judul || '').trim() || !isi.trim()) throw new Error('Judul dan isi wajib.');
      if (isi.length > 20000) throw new Error('Batas 20.000 karakter — dokumen lebih panjang letakkan di Drive/Docs dan tautkan.');
      x = { ID: makeId_('DOK'), Judul: String(p.judul).slice(0, 180), Jenis: String(p.jenis || 'Memo Investasi').slice(0, 60), Oleh: u.Nama, Isi: isi, Tanggal: date_(), versi: 1, statusDok: 'Draf', retensiSampai: '', tte: '', entitas: p.entitas || '', tautanTransaksi: p.tautanTransaksi || '' };
      // R-21: versi otomatis, klasifikasi & retensi (L08, L14)
      x.versi = db_('documents').filter(function (a) { return a.Judul === x.Judul; }).reduce(function (m, a) { return Math.max(m, Number(a.versi) || 1); }, 0) + 1;
      x.klasifikasi = ['Publik', 'Internal', 'Rahasia', 'Sangat Rahasia'].indexOf(String(p.klasifikasi)) >= 0 ? String(p.klasifikasi) : 'Internal';
      x.retensiSampai = retensi_(x.Jenis); x.pemilikID = u.ID; x.hashIsi = sha256_(isi);
      const list = db_('documents'); list.unshift(x); dbSet_('documents', list);
      auditAppend_(u.Nama, 'Dokumen ' + x.ID + ' dibuat (v' + x.versi + ' · ' + x.klasifikasi + ' · retensi s.d. ' + x.retensiSampai + ')', 'Dokumen', x.ID);
      return x;
    }

    default:
      return dispatchC_(route, token, p);
  }
}
