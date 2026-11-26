# GIO910 - GERAI INOVASI OLAHAN · Holding Investasi & Kantor AI

> **DARI PROSES INOVASI GAPAI KESEMPURNAAN**

Semua kode disimpan & dikelola lewat **1 (satu) repository GitHub terlebih dahulu**, lalu tiap platform deploy menarik target halamannya masing-masing dengan tampilan yang **terpisah total**:

- **`index.html` + `pages/` + `assets/`** — **Portal Utama** (*Holding Investasi — Portal Terpadu Kantor AI & Sistem Kerja*, 10 halaman). Tanpa tautan ke Copy Hub.
- **`copy-hub.html`** — **Copy Hub Mandiri** (*Investasi Website & Domain, Freename, IG Reel, FAQ, Formulir Member `MEMBER30`, Perpustakaan Link 5 Mode, Live Chat WIB, 1 Tombol Popup Absen, Login Admin, Pusat Parameter API/Maps/AdSense/Web3, & Pusat Salin 63 berkas GAS*). Tanpa tautan balik ke `index.html`.
- **`appscript/`** — **1 Proyek Google Apps Script Lengkap (65 berkas + panduan + `.clasp.json.example`)** untuk menjalankan seluruh Opsi 1–5 + `gio910.blog` dari 1 URL `/exec`.
- **`dao/`** — **Hybrid DAO (`dao-hybrid-widget.html` + `dao_hybrid_bridge.gs`)** & modul opsional Full DAO.
- **`seo/`** — **Materi SEO, artikel promosi, & widget embed** (`konten-seo-artikel.md`, `widget-ig-freename-kontak.html`).
- **`cloudflare-opsi2/`** — **Template Redirect Rule Cloudflare & panduan DNS Citrahost** untuk Opsi 2 (`gio910gerai.biz.id`).
- **`wrappers/opsi1/index.html`** — **Wrapper ENS (`gio910gerai.eth`)** ke `/exec` Google Apps Script.
- **`.github/workflows/verify-builds.yml`** — **GitHub Actions** otomatis memverifikasi semua target `scripts/build-opsi.sh` saat push.

---

## Tahap 1 · Push Folder Ini ke 1 Repository GitHub Dulu

```bash
cd /home/user/kantor-ai
git init
git branch -M main
git add .
git commit -m "Initial commit: GIO910 Portal + Copy Hub + DAO + GAS (1 Repo)"
# Buat repo kosong di https://github.com/new lalu jalankan:
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

*(File `.gitignore` sudah mengabaikan `*.zip` dan folder `dist-opsi*` sementara agar repo GitHub tetap bersih.)*

---

## Tahap 2 · Sambungkan 1 Repo GitHub ke Semua Layanan Deploy

Setiap proyek di bawah membaca **repository GitHub yang sama (`main`)**, tetapi hanya mengeluarkan folder/halaman masing-masing:

| Opsi & Domain | Platform Deploy (Connect to GitHub) | Build Command | Output Directory | Yang Ditampilkan |
| :--- | :--- | :--- | :--- | :--- |
| **Opsi 3 (Utama)**<br>`gio910gerai.io` | **Cloudflare Pages** (`dash.cloudflare.com`) + beli domain `.io` di **Cloudflare Registrar** | `bash scripts/build-opsi.sh opsi3` | `dist-opsi3` | Murni Portal `index.html` + `pages/` + `assets/` (`copy-hub.html` terpisah) |
| **Opsi 5 · Cabang 5B (Web3)**<br>`geraiinovasiolahan.gio910` | **4EVERLAND IPFS Hosting** (`dashboard.4everland.org`) → pasang CID ke Freename `dweb.ipfs.hash` | `bash scripts/build-opsi.sh opsi5` | `dist-opsi5` | **Copy Hub Web3 (`copy-hub.html`)** sebagai `index.html` + parameter terpusat |
| **Opsi 5 · Cabang 5A (Web2)**<br>`gio910.blog` | **Cloudflare Pages** (`dash.cloudflare.com`) → Custom Domain `gio910.blog` | `bash scripts/build-opsi.sh blog` | `dist-blog` | **Copy Hub Publik (`copy-hub.html`)** sebagai `index.html` (Panduan + Link + 1 popup Absen; panel Admin terbuka saat Login Admin) |
| **Opsi 4 (Hybrid DAO)**<br>`gio910gerai.dao` | **4EVERLAND IPFS Hosting** → pasang CID ke Unstoppable Domains | `bash scripts/build-opsi.sh opsi4` | `dist-opsi4` | Widget Hybrid DAO (`dao-hybrid-widget.html`) + Snapshot + Safe |
| **Opsi 1 (Wrapper ENS)**<br>`gio910gerai.eth` | **4EVERLAND IPFS Hosting** → *SetContentHash* ENS | *(kosongkan)* | `wrappers/opsi1` | Wrapper `index.html` menuju `/exec` Apps Script |
| **Opsi 2 (Redirect)**<br>`gio910gerai.biz.id` | Beli `.biz.id` di **Citrahost** (`citrahost.com/harga-domain`, Rp5rb/thn 1 · Rp80rb/thn) → **Cloudflare Redirect Rule** | *(tidak perlu Pages)* | *(redirect langsung)* | Arahkan `A @ 192.0.2.1 (Proxied)` ke URL `/exec` GAS |

---

## Tahap 3 · Isi Parameter Sebelum Push ke GitHub
1. **Portal Utama (Opsi 3):** Isi `window.__KAI_GAS_API_URL__` di `assets/kai-config.js`.
2. **Wrapper ENS (Opsi 1):** Isi URL `/exec` di `wrappers/opsi1/index.html`.
3. **Copy Hub (Opsi 5):** Isi `window.__KAI_HUB_PARAMS__` & `window.__KAI_ADSENSE_CONFIG__` di `copy-hub.html` (atau atur langsung dari panel parameter di UI Copy Hub lalu simpan/unduh untuk commit ke GitHub).
4. **Commit & Push** ke `main` — Cloudflare Pages dan 4EVERLAND otomatis deploy ulang seluruh domain Anda secara serentak!
