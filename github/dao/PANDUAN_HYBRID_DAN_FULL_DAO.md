# Panduan & Script Lengkap: Hybrid DAO (`gio910gerai.dao`), Copy Hub Web3 (`geraiinovasiolahan.gio910`), & Opsional Full DAO

Folder `dao/` berisi panduan dan seluruh script siap pakai untuk menjalankan **dua arsitektur DAO** terintegrasi langsung dengan **Supabase (`gio910-api`) + Vercel (`/api/connectors`) + 13 Konektor** *(tanpa Apps Script dan tanpa Cloudflare)*:
- **Bagian 1 — Hybrid DAO** *(mekanisme portal Supabase 5 peran, OTP Email/PIN, Google Workspace & Sheets Konektor tetap berlaku 100%)*.
- **Bagian 2 — Full DAO (Modul Opsional)** *(sistem login & wewenang diganti menjadi Smart Contract on-chain + Wallet Web3 + IPFS terenkripsi; sementara domain Opsi 5 `geraiinovasiolahan.gio910` dan `gio910.blog` menangani `copy-hub.html` + pusat parameter Supabase/Vercel)*.

---

## Bagian 1 — Panduan Hybrid DAO (Supabase + Vercel + Snapshot + Safe)

### Cara Kerja
1. **Operasional Harian Tetap di Portal Vercel + Supabase (`gio910gerai.io` / `gio910-jv38.vercel.app`):**
   - Staf, Manajer, Finance, Auditor, dan Pemilik tetap login memakai **OTP Email / PIN** di Supabase Postgres (`gio910-api`) dan bekerja seperti biasa di portal.
2. **Keputusan Besar di Snapshot (`gio910gerai.eth`):**
   - Proposal strategis/pencairan kas diputuskan lewat voting di **Snapshot** (gratis tanpa gas fee, hanya tanda tangan dompet Web3).
3. **Eksekusi Dana di Safe Multi-sig:**
   - Dana bersama disimpan di **Safe (`app.safe.global`)** (misal butuh tanda tangan 2 dari 3 pengurus).
4. **Sinkronisasi Otomatis ke Supabase Postgres & Konektor Google Sheets:**
   - Endpoint **`/api/dao/proposals`** pada Edge Function `gio910-api` + script **`dao/hybrid/dao-hybrid-sync.ts`** menarik hasil voting Snapshot ke tabel `public.dao_proposals`, mencatat rantai hash SHA-256 `audit_logs`, dan menyinkronkan tab **`DAO_Proposals`** lewat **Konektor Google Sheets**.

### Langkah Pemasangan Hybrid DAO
1. **Aktifkan Edge Sync (`dao/hybrid/dao-hybrid-sync.ts`):**
   - Pastikan Edge Function **`gio910-api`** aktif di Supabase (`dttclgkjfiwcovvqrckw`).
   - Set Edge Secret `DAO_ENS_SPACE = gio910gerai.eth` dan `DAO_SAFE_ADDR = <alamat Safe Anda>` di Dashboard Supabase.
   - Uji endpoint **`GET /api/dao/proposals`** atau **`POST /api/dao/vote`** melalui proxy Vercel `/api/connectors?sub=dao`.
2. **Buat Space Snapshot untuk `gio910gerai.eth`:**
   - Buka **`snapshot.org`** → hubungkan dompet pemilik `gio910gerai.eth` → **Create Space**.
   - Atur strategi voting **ERC-20 / Token Balance / Whitelist** dan simpan.
3. **Siapkan Dompet Kas Safe Multi-sig (`app.safe.global`):**
   - Pilih jaringan biaya rendah (mis. **Base** atau **Polygon**) → tambahkan penanda tangan pengurus holding (skema 2-of-3) → salin alamat Safe.
4. **Pasang `dao-hybrid-widget.html` ke IPFS / `gio910gerai.dao`:**
   - Jalankan `bash scripts/build-opsi.sh opsi4` (output `dist-opsi4/`).
   - Hubungkan repo GitHub Anda ke **4EVERLAND Hosting** (`Output directory: dist-opsi4`) atau **Vercel** untuk custom domain.
   - Salin **CID IPFS** lalu tempel di **Unstoppable Domains → Manage `gio910gerai.dao` → IPFS**.

---

## Bagian 2 — Panduan Full DAO On-Chain (Modul Opsional)

1. **Kontrak Pintar (`dao/full/Gio910Token.sol` & `dao/full/Gio910Governor.sol`):**
   - Buka **`remix.ethereum.org`** (kompiler Solidity `0.8.24` / OpenZeppelin v5).
   - Deploy `Gio910Token` → deploy `TimelockController` → deploy `Gio910Governor` → delegasikan hak suara anggota.
2. **Konsol Web3 On-Chain (`dao/full/dao-full-console.html` + `dao/full/dao-web3-adapter.js`):**
   - Dapat langsung diakses dari Vercel (`/dao/full/dao-full-console.html`) maupun diunggah ke IPFS (4EVERLAND/Pinata).
   - Mendukung tanda tangan **MetaMask / EIP-1193**, voting on-chain, Timelock, serta enkripsi dokumen **AES-256-GCM** di browser sebelum masuk IPFS.
   - Ringkasan proposal on-chain juga dapat disinkronkan kembali ke **Supabase Postgres (`/api/dao/proposals`)** sebagai arsip portal.

---

## Bagian 3 — Copy Hub Web3 (`copy-hub.html` · `gio910.blog` & `geraiinovasiolahan.gio910`)

- **Cabang 5A (Web2 Blog · `gio910.blog`):** Deploy repo GitHub ke **Vercel** (`Build command: bash scripts/build-opsi.sh blog`, `Output directory: dist-blog`) — tanpa Cloudflare!
- **Cabang 5B (Web3 IPFS · `geraiinovasiolahan.gio910`):** Deploy repo GitHub yang sama ke **4EVERLAND Hosting** (`Build command: bash scripts/build-opsi.sh opsi5`, `Output directory: dist-opsi5`), lalu isi record **`dweb.ipfs.hash`** di **Freename**.
- Kedua cabang otomatis terhubung ke **Supabase `gio910-api`**, **Vercel `/api/connectors`**, dan menyimpan seluruh konfigurasi di tabel **`public.configurations` (`COPYHUB_HUB_PARAMS`)**.
