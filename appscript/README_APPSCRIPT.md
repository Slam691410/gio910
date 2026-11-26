# Folder `appscript/` — 1 Proyek Google Apps Script Untuk Semua (Opsi 1–5 + gio910.blog)

Folder ini berisi **1 proyek tunggal Google Apps Script lengkap (65 berkas)**:
- `appsscript.json` + `Code_1_Core.gs` .. `Code_5_Backup.gs` (API JSON `doPost` + Web App `doGet`)
- `dao_hybrid_bridge.gs` (rute `dao.*` & sinkronisasi Snapshot → Google Sheets `DAO_Proposals` untuk Opsi 4)
- 13 berkas HTML portal (`Index.html`, `ringkas.html`, `org.html`, `tugas.html`, `inv.html`, `aset.html`, `dokumen.html`, `alur.html`, `vendor.html`, `unduh.html`, `inc_*.html`) + `domain-wrapper.html`
- 44 berkas aset terkompresi (`gz_*.html`)

## Cara Pasang (Pilih Salah Satu)
1. **Manual di Browser (`script.google.com`):**
   - Buat **1 New project**, aktifkan **Project Settings → Show `appsscript.json`**.
   - Salin semua file di folder ini (atau gunakan panel Copy Hub Mode Admin), lalu jalankan `gasBootstrapOwner` → `installTriggers` (di `Code_5_Backup.gs`) → **Deploy → Web app** (*Execute as: Me*, *Who has access: Anyone*) → salin URL `/exec`.
2. **Otomatis via `clasp` (Terminal/PC):**
   - `npm i -g @google/clasp && clasp login`
   - Salin `.clasp.json.example` menjadi `.clasp.json` lalu isi `scriptId` proyek Anda, kemudian jalankan `clasp push`.
