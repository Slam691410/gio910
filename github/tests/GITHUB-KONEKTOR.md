# Konektor GitHub GIO910

Konektor ini membaca status repository **publik** `Slam691410/gio910` melalui `GET /api/github`. Endpoint memeriksa nama repository dan branch default melalui GitHub REST API tanpa token. Tombol **Uji GitHub** pada Hub Konektor melakukan pemeriksaan ulang. Status tidak tersedia jika GitHub tidak dapat diakses atau membatasi permintaan; status ini bukan bukti bahwa integrasi login Arena aktif.

Konektor hanya-baca: tidak membaca repository privat dan tidak membuat commit, issue, atau pull request. Untuk tindakan tersebut diperlukan autentikasi server-side dan otorisasi terpisah; jangan menaruh token di browser atau repository.

Perubahan ini baru berlaku setelah kode branch ditinjau dan di-deploy ke proyek Vercel yang benar. Status API Supabase tetap melaporkan konektor yang dikelolanya sendiri; Hub menambahkan status GitHub secara terpisah. Jalankan pengujian dengan `node --test tests/*.test.cjs` dari direktori `github`.
