# Panduan & Script Lengkap: Hybrid DAO (`gio910gerai.dao`), Copy Hub Web3 (`geraiinovasiolahan.gio910`), & Opsional Full DAO

Folder `/home/user/kantor-ai/dao/` berisi panduan dan seluruh script siap pakai untuk menjalankan **dua arsitektur DAO**:
- **Bagian 1 — Hybrid DAO** *(mekanisme portal Apps Script 5 peran, OTP Email, Google Sheets & Drive tetap berlaku 100%)*.
- **Bagian 2 — Full DAO (Modul Opsional)** *(sistem login & wewenang lama diganti penuh menjadi Smart Contract on-chain + Wallet Web3 + IPFS terenkripsi; sementara domain Opsi 5 `geraiinovasiolahan.gio910` difokuskan untuk menghandel `copy-hub.html` + pusat parameter)*.

---

## Bagian 1 — Panduan Hybrid DAO (Portal + Snapshot + Safe)

### Cara Kerja
1. **Operasional Harian Tetap di Portal (`gio910gerai.io` + Apps Script):**
   - Staf, Manajer, Finance, Auditor, dan Pemilik tetap login memakai **OTP Email / PIN** dan bekerja seperti biasa di portal.
2. **Keputusan Besar di Snapshot (`gio910gerai.eth`):**
   - Proposal strategis/pencairan kas diputuskan lewat voting di **Snapshot** (gratis tanpa gas fee, hanya tanda tangan dompet Web3).
3. **Eksekusi Dana di Safe Multi-sig:**
   - Dana bersama disimpan di **Safe (`app.safe.global`)** (misal butuh tanda tangan 2 dari 3 pengurus).
4. **Sinkronisasi Otomatis ke Google Sheets:**
   - File `dao/hybrid/dao_hybrid_bridge.gs` mengambil hasil voting Snapshot dan menyimpannya ke tab **`DAO_Proposals`** di Google Sheets setiap 15 menit + mencatat ke rantai hash audit portal.

### Langkah Pemasangan Hybrid DAO
1. **Pasang Script Backend (`dao_hybrid_bridge.gs`):**
   - Buka proyek Apps Script Anda di **`script.google.com`**.
   - Klik **`+` → Script**, beri nama **`dao_hybrid_bridge`**.
   - Tempel seluruh isi `/home/user/kantor-ai/dao/hybrid/dao_hybrid_bridge.gs` (< 13,5 KB, aman ditempel dari HP) → **Save**.
   - Buka **Project Settings (⚙️) → Script Properties**, tambahkan:
     - `DAO_ENS_SPACE` = `gio910gerai.eth`
     - `DAO_SAFE_ADDR` = alamat Safe Multi-sig Anda *(opsional)*
   - Jalankan fungsi **`syncDaoSnapshotToPortal`** 1x untuk membuat tab `DAO_Proposals`, lalu jalankan **`installDaoSyncTrigger`** 1x agar otomatis sinkron tiap 15 menit.
   - *(Opsional jika ingin dipanggil dari UI portal)*: di `Code_4_RoutesC.gs` tambahkan:
     ```javascript
     if (route.indexOf('dao.') === 0 && typeof handleDaoHybridRoute === 'function') {
       return handleDaoHybridRoute(route, payload, session);
     }
     ```
2. **Buat Space Snapshot untuk `gio910gerai.eth`:**
   - Buka **`snapshot.org`** (atau `snapshot.box`) → hubungkan dompet pemilik `gio910gerai.eth` → buat Space menggunakan nama ENS `gio910gerai.eth`.
   - Atur strategi hak suara (misal 1 dompet = 1 suara via *whitelist*, atau berdasarkan saldo token/NFT) dan setujui pembaruan *Text Record* ENS.
3. **Pasang Widget Konsol Hybrid (`dao-hybrid-widget.html`):**
   - Dari **1 repository GitHub yang sama**, hubungkan ke **4EVERLAND IPFS (*Connect to GitHub*)** dengan *Build command* `bash scripts/build-opsi.sh opsi4` dan *Output directory* `dist-opsi4` agar `dao-hybrid-widget.html` terbit sebagai `index.html` di IPFS untuk `.dao`.

---

## Bagian 2 — Panduan Full DAO (On-Chain Governor + Timelock + IPFS AES-GCM)

### Perubahan Mekanisme dari Portal Lama
Saat beralih ke **Full DAO**:
- **Login OTP Email + PIN** digantikan oleh **Dompet Web3 (MetaMask / EIP-1193)**.
- **Persetujuan Pemilik tunggal** digantikan oleh **Smart Contract `Gio910Governor.sol`** + kas **`TimelockController`**.
- **Google Sheets** tidak dipakai sebagai pengambil keputusan — seluruh proposal, suara, dan pencairan dana tercatat permanen di blockchain.
- **Google Drive** digantikan oleh **IPFS (4EVERLAND / Pinata)** dengan file dienkripsi terlebih dahulu memakai **AES-256-GCM** (`encryptFileForIpfs`) agar dokumen rahasia tidak terbaca publik.

### Berkas Script Full DAO (`/home/user/kantor-ai/dao/full/`)
1. `Gio910Token.sol` — Token hak suara **`G910`** (`ERC20Votes`, maksimal 10 juta suplai, mode waktu `timestamp`).
2. `Gio910Governor.sol` — Kontrak voting on-chain **OpenZeppelin v5** (`GovernorSettings`, `GovernorCountingSimple`, `GovernorVotesQuorumFraction`, `GovernorTimelockControl`).
3. `dao-web3-adapter.js` — Script JavaScript Web3 + enkripsi/dekripsi dokumen AES-256-GCM untuk IPFS.
4. `dao-full-console.html` — Konsol web statis opsional siap deploy dari GitHub ke **4EVERLAND IPFS**.

### Langkah Pemasangan Full DAO (Lewat Remix IDE di Browser)
*(Disarankan uji coba dulu di jaringan murah/testnet seperti **Base Sepolia** atau **Base Mainnet** sebelum Ethereum Mainnet agar biaya gas sangat kecil.)*

1. **Siapkan Kontrak di Remix (`remix.ethereum.org`):**
   - Buat 2 file di Remix: `Gio910Token.sol` dan `Gio910Governor.sol`, lalu tempel masing-masing kodenya.
   - Buka tab **Solidity Compiler** → pilih versi **`0.8.24`** → aktifkan *Optimization (200 runs)* → klik **Compile**.
2. **Deploy 3 Kontrak secara Berurutan** (tab *Deploy & Run Transactions* → pilih *Injected Provider - MetaMask*):
   - **Langkah A — Deploy `Gio910Token`:**
     - `initialOwner`: alamat dompet Anda
     - `initialSupply`: misalnya `1000000000000000000000000` (1.000.000 token dengan 18 desimal)
     - Salin alamat hasil deploy **`TOKEN_ADDR`**.
   - **Langkah B — Deploy `TimelockController`** (dari `@openzeppelin/contracts/governance/TimelockController.sol`):
     - `minDelay`: `3600` (jeda keamanan eksekusi 1 jam setelah voting menang)
     - `proposers`: `[]` *(kosong dulu, nanti diisi Governor)*
     - `executors`: `["0x0000000000000000000000000000000000000000"]` *(siapa saja boleh menekan Execute setelah lolos timelock)*
     - `admin`: alamat dompet Anda *(sementara untuk setup role)*
     - Salin alamat **`TIMELOCK_ADDR`** — **alamat ini sekaligus menjadi alamat kas (Treasury) DAO Anda!**
   - **Langkah C — Deploy `Gio910Governor`:**
     - `_token`: `TOKEN_ADDR`
     - `_timelock`: `TIMELOCK_ADDR`
     - `_votingDelaySeconds`: `3600` (1 jam)
     - `_votingPeriodSeconds`: `259200` (3 hari)
     - `_proposalThreshold`: `1000000000000000000000` (1.000 G910)
     - `_quorumPercent`: `10` (kuorum 10%)
     - Salin alamat **`GOVERNOR_ADDR`**.
3. **Kunci Wewenang agar Benar-Benar Full DAO (Wajib!):**
   - Di kontrak `TimelockController`:
     1. Panggil `grantRole(PROPOSER_ROLE, GOVERNOR_ADDR)` *(nilai hash `PROPOSER_ROLE` bisa dibaca lewat fungsi view `PROPOSER_ROLE()` di Remix)*.
     2. Panggil `grantRole(CANCELLER_ROLE, GOVERNOR_ADDR)` *(opsional)*.
     3. **Penting:** Panggil `renounceRole(DEFAULT_ADMIN_ROLE, alamatDompetAnda)` supaya Anda pribadi tidak bisa mengubah aturan Timelock sepihak lagi!
   - Di kontrak `Gio910Token`:
     1. Distribusikan token ke para anggota/investor, lalu masing-masing **wajib memanggil `delegate(alamatSendiri)`** agar hak suaranya aktif.
     2. Panggil `transferOwnership(TIMELOCK_ADDR)` agar pencetakan token baru di masa depan hanya bisa terjadi lewat voting DAO.
4. **Deploy Konsol Full DAO Opsional (`dao-full-console.html` + `dao-web3-adapter.js`):**
   - Push folder `/home/user/kantor-ai/dao/full/` ke repository GitHub Anda terlebih dahulu, lalu sambungkan ke **4EVERLAND IPFS (*Connect to Git*)** bila ingin memakai mode Full DAO opsional.
   - Buka halaman konsol → sambungkan MetaMask → masukkan `TOKEN_ADDR` dan `GOVERNOR_ADDR` → siap membuat proposal, voting, eksekusi Timelock, dan mengenkripsi dokumen IPFS (`.kaienc`).

---

## Bagian 3 — Menjalankan 5 Opsi Sekaligus (5 Ekstensi Domain Berbeda)

Kelima opsi dapat aktif bersamaan tanpa saling bentrok:

| Opsi | Domain / Ekstensi | Peran | Tempat Pasang |
| :--- | :--- | :--- | :--- |
| **Opsi 3 *(Utama)*** | `gio910gerai.io` | Portal utama 10 halaman + Email `@gio910gerai.io` | GitHub (`main`) → Cloudflare Pages (*Connect to Git*, `dist-opsi3`, 25 berkas) → `/exec` Apps Script |
| **Opsi 2 *(Redirect)*** | `gio910gerai.biz.id` | Redirect langsung ke `/exec` | Cloudflare Redirect Rule (`DNS A @ 192.0.2.1 Proxied`) |
| **Opsi 1 *(Wrapper ENS)*** | `gio910gerai.eth` / `.eth.limo` | Wrapper `index.html` ke `/exec` + Identitas Space Snapshot | 4EVERLAND IPFS (`wrappers/opsi1`) + ENS `SetContentHash` |
| **Opsi 4 *(Hybrid DAO)*** | `gio910gerai.dao` *(Unstoppable Domains)* | Widget Hybrid DAO (`dao-hybrid-widget.html`, Space tetap `gio910gerai.eth`) | IPFS (Unstoppable *Manage → IPFS* / 4EVERLAND `dist-opsi4`) |
| **Opsi 5 *(Copy Hub & Parameter)*** | `geraiinovasiolahan.gio910` *(Freename TLD `.gio910`)* | **Copy Hub (`copy-hub.html`)** sebagai `index.html` + seluruh parameter (API/Maps/AdSense/Web3) | IPFS (4EVERLAND via GitHub `dist-opsi5`) → pasang CID ke **`dweb.ipfs.hash`** di Freename *(Full DAO opsional)* |

### Catatan Teknis `.dao` & `.gio910`
- **Snapshot wajib ENS:** Space Snapshot dibuat menggunakan `gio910gerai.eth`, sementara `gio910gerai.dao` menampilkan `dao-hybrid-widget.html` yang mengarah ke Space `gio910gerai.eth` + Safe + `/exec`.
- **Akses Browser:**
  - `gio910gerai.dao` terbuka langsung di Brave/Opera, atau via Unstoppable Extension di Chrome/Firefox/Edge.
  - `geraiinovasiolahan.gio910` (`dweb.ipfs.hash`) menghandel **Copy Hub + Pusat Parameter** dan terbuka lewat Freename Web3 Extension / MetaMask Freename Resolution Snap.
  - Untuk pengunjung umum yang browser-nya tidak diketahui, tetap jadikan **`gio910gerai.io`** (atau **`gio910gerai.eth.limo`**) sebagai tautan publik utama Portal.

---

## Bagian 4 — Tabel Pengeluaran Awal & Perpanjangan Tahunan (Semua 5 Opsi)

*Estimasi acuan per November 2026 (kurs acuan ~Rp16.000/USD; biaya gas jaringan bergantung kepadatan blockchain saat transaksi):*

| Opsi / Komponen | Domain / Layanan | Biaya Awal (Tahun 1) | Biaya Perpanjangan Tahunan (Tahun ke-2 dst.) | Keterangan Penting |
| :--- | :--- | :--- | :--- | :--- |
| **Opsi 1** *(ENS + 4EVERLAND)* | `gio910gerai.eth` (5+ karakter) + 4EVERLAND IPFS | **~$5/thn** (~Rp80.000) **+ gas ETH** (~Rp30rb–Rp150rb) · 4EVERLAND **$0** (kuota gratis) | **~$5–$8/thn + gas ETH** *(bisa bayar multi-tahun sekaligus agar hemat gas)* | Wajib diperpanjang tahunan; sekaligus menjadi Space resmi Snapshot. *(Catatan: ENSv2 berpotensi menetapkan tarif $8/thn dengan diskon multi-tahun).* |
| **Opsi 2** *(Redirect)* | `gio910gerai.biz.id` (Citrahost/PANDI) + Cloudflare Free | **Rp5.000** *(promo Tahun 1 Citrahost)* · Cloudflare **Rp0** | **Rp80.000 / thn** *(tarif normal Citrahost)* | Redirect Rule + DNS + SSL Cloudflare gratis selamanya. |
| **Opsi 3** *(Utama)* | `gio910gerai.io` (Cloudflare Registrar) + GitHub + Cloudflare Pages & Email Routing + GAS | **~$45/thn** *(~Rp720.000 at-cost Cloudflare Registrar)* · GitHub, Cloudflare Pages & Google **Rp0** | **~$45 / thn** *(at-cost tanpa markup)* | 1 repo GitHub auto-deploy ke Cloudflare Pages, SSL HTTPS, Email Routing ke Gmail, Google Sheets & Drive gratis. |
| **Opsi 4** *(Hybrid DAO)* | `gio910gerai.dao` (Unstoppable Domains) + Snapshot + Safe | **~$5–$20+** sekali bayar *(mint Polygon gratis; Vault opsional ~$4)* · Safe/Snapshot **$0** (+ gas L2 &lt; Rp5.000) | **Rp0 / $0 SELAMANYA** | Domain `.dao` dibeli 1x seumur hidup tanpa biaya perpanjangan; Snapshot memakai `.eth` dari Opsi 1. |
| **Opsi 5** *(Copy Hub & Parameter)* | Custom TLD `.gio910` + `geraiinovasiolahan.gio910` (Freename) + Copy Hub IPFS *(Smart Contract opsional)* | **Mulai ~$79+** sekali bayar untuk TLD kustom *(Lisensi Royalti 50% bisa opsional terpisah)* · IPFS 4EVERLAND/Pinata **$0** | **Rp0 / $0 SELAMANYA** *(baik TLD `.gio910` maupun SLD di bawahnya)* | Domain tetap `geraiinovasiolahan.gio910`, menghandel `copy-hub.html` (diunggah sebagai `index.html` IPFS) beserta semua parameter (API `/exec`, Maps, AdSense, Pembayaran & Web3). Modul Smart Contract Full DAO tetap tersedia sebagai opsi tambahan. |
| **Total Gabungan 5 Opsi** | **Semua aktif bersamaan** | **± Rp725.000 + ~$89–$120+ Web3 &amp; gas** *(kisaran total ± Rp2,2 jt – Rp2,9 jt)* | **Hanya Opsi 1, 2, 3:** **± Rp880.000 – Rp960.000 / thn** *(Opsi 4 &amp; 5 = Rp0/thn)* | Pengeluaran rutin tahunan praktis hanya `.io`, `.biz.id`, dan `.eth`. |

---

## Bagian 5 — Panduan Freename Referral Program (15%) &amp; TLD Royalties `.gio910` (50%)

Pemilik akun dan TLD kustom **`.gio910`** di Freename memiliki **2 jalur pendapatan pasif** resmi dari Freename:

### 1. Freename Referral Program (Komisi 15%)
- **Manfaat:** Anda memperoleh **komisi 15%** dari setiap pembelian eksternal (domain Web3 maupun TLD kustom) yang dilakukan pengguna baru melalui link referral Anda.
- **Cara Mengambil &amp; Menggunakan Link Referral:**
  1. Login ke dashboard akun Anda di **`freename.com`**.
  2. Klik **ikon Profil** Anda di pojok kanan atas.
  3. Klik **`Copy referral link`** (atau salin *Referral ID* unik Anda).
  4. Bagikan tautan referral tersebut kepada mitra, investor, komunitas, vendor, atau cantumkan di halaman portal (`pages/unduh.html` / footer / email undangan anggota DAO).
  5. Pantau perolehan komisi 15% di dashboard Freename Anda dan catat sebagai pendapatan lain-lain di pembukuan Holding sesuai ketentuan pajak/kepatuhan yang berlaku.

### 2. Freename TLD Royalties (Royalti 50% atas `.gio910`)
- **Manfaat:** Sebagai pemilik TLD kustom **`.gio910`**, setiap kali pihak luar membeli Second-Level Domain (SLD) di bawah TLD Anda (contoh: `mitra.gio910`, `investor.gio910`, `gerai1.gio910`), pemegang TLD yang mengaktifkan **Royalty License** berhak atas **50% royalti transaksi** sesuai ketentuan smart contract / program royalti Freename.
- **Langkah Praktis:**
  1. Buka menu **TLD Management** di dashboard Freename untuk `.gio910`.
  2. Periksa status **Royalty License** (apakah sudah aktif atau perlu aktivasi/biaya lisensi sesuai ketentuan akun Anda) dan atur harga pendaftaran SLD di bawah `.gio910` (misal harga khusus untuk mitra/vendor).
  3. **Sinergi 50% + 15%:** Ketika Anda mengajak calon pembeli baru membeli `namamitra.gio910` lewat **Referral Link** Anda, Anda menggabungkan potensi **Royalti TLD 50%** + **Komisi Referral 15%** untuk transaksi pengguna baru tersebut (mengikuti syarat &amp; ketentuan Freename yang berlaku).


