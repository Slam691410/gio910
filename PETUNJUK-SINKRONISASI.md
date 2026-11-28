# Sinkronisasi GIO910 v4.7

Status: paket disiapkan; BELUM diunggah atau di-push ke GitHub.
Repository: https://github.com/Slam691410/gio910
Baseline main: aa5acfc327c478aa47c95f90cffa05eabe491cdf

## Cara sinkronisasi

1. Unduh dan ekstrak gio910-v47-upload.zip.
2. Di GitHub, buat branch baru dari main, misalnya sync-v47.
3. Pada root repository, pilih Add file → Upload files. Seret folder github hasil ekstraksi; pertahankan struktur folder, jangan menjadi github/github/.
4. Commit pada branch baru, kemudian buat pull request ke main.
5. Tinjau perubahan sebelum merge. Jangan aktifkan auto-deploy dahulu.
6. Setelah merge dan verifikasi kode, barulah aktifkan deployment otomatis di Vercel. Root Directory tetap github; production branch main.

## Batas verifikasi

- 8 assertion regresi lokal KYC lulus. Ini bukan pengujian E2E setelah login.
- Pengujian kamera, mikrofon, review KYC, dan absensi setelah login masih diperlukan.
- Paket ini hanya menyinkronkan frontend/API proxy; tidak mencadangkan database, secret, atau Edge Function Supabase.
- File repository yang tidak tercantum tidak dihapus.
- Tinjau isi sebelum commit; jangan unggah kredensial atau dokumen identitas.

## File pembaruan

- `github/.github/workflows/verify-builds.yml` — diubah
- `github/README.md` — diubah
- `github/api/app-js.js` — baru
- `github/api/connectors.js` — baru
- `github/api/copy-hub.js` — baru
- `github/api/enhancements.js` — baru
- `github/api/installer.js` — baru
- `github/assets/kai-app.js` — diubah
- `github/assets/kai-config.js` — diubah
- `github/assets/kai-connectors-hub.js` — baru
- `github/assets/kai-copyhub-live.js` — baru
- `github/assets/kai-enhancements.js` — diubah
- `github/assets/kai-holding-os.css` — baru
- `github/assets/kai-holding-os.js` — baru
- `github/assets/kai-kyc-v47.js` — baru
- `github/assets/kai-live-finance.js` — baru
- `github/assets/kai-page-bridge.js` — diubah
- `github/assets/kai-realtime.js` — baru
- `github/assets/kai-security-v46.js` — baru
- `github/assets/kai-supabase-bridge.js` — baru
- `github/assets/kai-unified-hub.css` — baru
- `github/assets/kai-unified-hub.js` — baru
- `github/copy-hub.html` — diubah
- `github/dao/PANDUAN_HYBRID_DAN_FULL_DAO.md` — diubah
- `github/dao/full/dao-full-console.html` — diubah
- `github/dao/full/dao-web3-adapter.js` — diubah
- `github/dao/hybrid/dao-hybrid-sync.ts` — baru
- `github/dao/hybrid/dao-hybrid-widget.html` — diubah
- `github/ekosistem.html` — baru
- `github/gas-mobile/Index.html` — diubah
- `github/gas-mobile/index.html` — baru
- `github/index.html` — diubah
- `github/manifest.webmanifest` — baru
- `github/pages/alur.html` — diubah
- `github/pages/aset.html` — diubah
- `github/pages/dokumen.html` — diubah
- `github/pages/inv.html` — diubah
- `github/pages/org.html` — diubah
- `github/pages/ringkas.html` — diubah
- `github/pages/tugas.html` — diubah
- `github/pages/unduh.html` — diubah
- `github/pages/vendor.html` — diubah
- `github/robots.txt` — diubah
- `github/scripts/build-opsi.sh` — diubah
- `github/seo/konten-seo-artikel.md` — diubah
- `github/seo/widget-ig-freename-kontak.html` — diubah
- `github/sitemap.xml` — diubah
- `github/sw.js` — baru
- `github/tests/kyc-toolbar.test.cjs` — baru
- `github/vercel-opsi2/PANDUAN_DOMAIN_CITRAHOST_VERCEL.md` — baru
- `github/vercel.toml` — baru
- `github/wrappers/opsi1/index.html` — diubah
