# GIO910 - GERAI INOVASI OLAHAN · Holding Investasi & Kantor AI

> **DARI PROSES INOVASI GAPAI KESEMPURNAAN**

Arsitektur produksi resmi berjalan **100% di atas Supabase + Vercel + 13 Konektor Terpadu** (tidak lagi menggunakan Google Apps Script ataupun Cloudflare). Seluruh kode dikelola lewat **1 (satu) repository GitHub**, lalu Vercel dan Supabase menyajikan semua portal, API, konektor, dan target Web3 secara serentak:

- **`index.html` + `pages/` + `assets/`** — **Portal Utama** (*Holding Investasi — Portal Terpadu Kantor AI & Sistem Kerja*, 4 Lantai · 42 Ruang · 277 Meja: 259 SDM + 18 Agent AI).
- **`api/` + `vercel.toml`** — **Vercel Serverless & Edge Routing** (`/api/connectors`, `/api/copy-hub`, `/api/app-js`, `/api/enhancements`, `/api/installer`, plus rewrites & custom domain routing).
- **Supabase (`dttclgkjfiwcovvqrckw` · Edge Function `gio910-api`)** — **Database Postgres (36 Tabel Realtime WS), Auth OTP/PIN, RLS, Storage, Audit Log SHA-256 & 13 Konektor Ekosistem** (`12 Aktif`: Google Drive, Sheets, Docs, Slides, Calendar, Gmail, Figma, Notion, Linear, Supabase, Vercel, WordPress; `1 Nonaktif/Dijeda`: Dropbox).
- **`copy-hub.html`** — **Copy Hub Mandiri & Pusat Parameter Terpadu** (*Panduan 5 Mode Web2/Web3 berbasis Supabase + Vercel, Parameter Live tersinkron ke Supabase, Builder ZIP, Live Chat WIB, Formulir Member `MEMBER30`, & Modul SEO/AdSense*).
- **`dao/`** — **Hybrid DAO (`dao-hybrid-widget.html` + `dao-hybrid-sync.ts`)** & modul opsional **Full DAO** (`Gio910Token.sol`, `Gio910Governor.sol`, `dao-full-console.html`, `dao-web3-adapter.js`).
- **`seo/`** — **Materi SEO, artikel promosi, & widget embed** (`konten-seo-artikel.md`, `widget-ig-freename-kontak.html`).
- **`vercel-opsi2/`** — **Panduan DNS Citrahost → Vercel Domains & Redirect** untuk Opsi 2 (`gio910gerai.biz.id`).
- **`wrappers/opsi1/index.html`** — **Wrapper ENS (`gio910gerai.eth`)** ke Portal Vercel + Backend Supabase.

---

## Tahap 1 · Push ke 1 Repository GitHub Utama

```bash
cd /home/user/gio910-unified
git init
git branch -M main
git add .
git commit -m "GIO910 Unified v45: Supabase + Vercel + 13 Konektor"
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

---

## Tahap 2 · Siapkan Backend Supabase (`gio910-api`)

1. Buka **Supabase Dashboard (`supabase.com/dashboard`)** → buat/buka proyek Anda (`dttclgkjfiwcovvqrckw`).
2. Jalankan migrasi SQL (`supabase/migrations/gio910_core_schema.sql`) di **SQL Editor** untuk membentuk tabel inti, RLS, Realtime publication, dan bucket asset `gio_web_assets`.
3. Deploy Edge Function **`gio910-api`** dengan flag `--no-verify-jwt` (`verify_jwt: false`) agar rute publik (`/api/health`, `/api/copyhub/*`, `/api/dao/proposals`) dan rute terautentikasi (`x-gio-session`) bekerja bersama.
4. Simpan secrets sensitif di **Supabase Project Settings → Edge Functions Secrets** (bukan di kode client):
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_IMPERSONATE_EMAIL`
   - `LINEAR_API_KEY`, `NOTION_API_KEY`, `MASTER_API_KEY`

---

## Tahap 3 · Hubungkan GitHub ke Vercel (5 Mode Sekaligus)

1. Login ke **Vercel (`vercel.com/dashboard`)** → **Add New Project → Import Git Repository**.
2. Set Environment Variables (opsional jika ingin override default): `KAI_SUPABASE_URL`, `KAI_SUPABASE_API_URL`, `KAI_SUPABASE_ANON_KEY`.
3. **Opsi 3 (Portal Utama · `gio910gerai.io` / `gio910-jv38.vercel.app`)**: Root Directory `github` (atau root repo dengan `vercel.toml`), deploy otomatis tiap `git push`.
4. **Opsi 2 (`gio910gerai.biz.id`)**: Tambahkan domain di **Vercel → Project Settings → Domains**, lalu arahkan DNS `A 76.76.21.21` & `CNAME cname.vercel-dns.com` di **Citrahost** (tanpa Cloudflare!).
5. **Opsi 5A (`gio910.blog`)**: Project Vercel terpisah atau custom domain rewrite di `vercel.toml` menuju `copy-hub.html` (dengan target `bash scripts/build-opsi.sh blog` → `dist-blog`).
6. **Opsi 1 (`.eth`), Opsi 4 (`.dao`), & Opsi 5B (`.gio910`)**: Hubungkan 1 repo GitHub yang sama ke **4EVERLAND Hosting** (`dist-opsi1`, `dist-opsi4`, `dist-opsi5`) agar terbit di IPFS sambil tetap memanggil backend **Supabase `gio910-api` + Vercel `/api/connectors`** secara live.
