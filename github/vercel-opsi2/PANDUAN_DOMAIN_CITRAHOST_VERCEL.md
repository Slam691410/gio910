# Panduan Opsi 2 · Domain Citrahost (gio910gerai.biz.id) → Vercel Domains & Redirects

Kita **tidak lagi menggunakan Cloudflare maupun Google Apps Script**. Untuk menjalankan **Opsi 2 (`gio910gerai.biz.id`)** secara langsung ke Portal Utama Vercel & Backend Supabase:

1. **Beli / Kelola Domain di Citrahost (`citrahost.com`)**
   - Masuk ke Client Area Citrahost → pilih domain `gio910gerai.biz.id` → **DNS Management / Manage DNS**.
   - Tetap gunakan nameserver default Citrahost (tidak perlu memindahkan NS ke Cloudflare).

2. **Tambahkan Domain di Dashboard Vercel (`vercel.com`)**
   - Buka proyek Vercel **GIO910** → **Settings → Domains** → klik **Add** → masukkan `gio910gerai.biz.id` (dan opsional `www.gio910gerai.biz.id`).
   - Vercel otomatis mengeluarkan sertifikat **SSL/TLS Let's Encrypt** dan memberikan record DNS persis untuk domain tersebut.

3. **Atur Record DNS di Citrahost**
   - **`A` Record**: Name `@` → Value `76.76.21.21` (IP Edge Anycast Vercel)
   - **`CNAME` Record**: Name `www` → Value `cname.vercel-dns.com`
   - *(Opsional jika ingin redirect 301 dari `gio910gerai.biz.id` ke `gio910gerai.io`, atur langsung di tab **Vercel → Domains → Edit → Redirect to** tanpa menulis rule Cloudflare!)*

4. **Verifikasi Live**
   - Setelah propagasi DNS (umumnya 5–30 menit), domain `https://gio910gerai.biz.id` langsung menyajikan Portal Utama Vercel dan berkomunikasi live dengan **Supabase Edge Function `gio910-api`** serta **13 Konektor Ekosistem**.
