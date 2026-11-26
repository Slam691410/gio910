# Panduan Opsi 2 · Redirect `gio910gerai.biz.id` ke Apps Script `/exec`

1. Beli domain `gio910gerai.biz.id` di **Citrahost** (`https://www.citrahost.com/harga-domain`).
2. Tambahkan domain ke **Cloudflare Free ($0)** lalu arahkan Custom Nameserver Citrahost ke 2 Nameserver Cloudflare.
3. Di menu **DNS → Records**, buat record `A` untuk `@` dan `www` ke `192.0.2.1` dengan status **Proxied (awan oranye)**.
4. Di menu **Rules → Redirect Rules → Create rule**, masukkan URL target **`/exec`** Apps Script Anda (lihat contoh JSON di `redirect-rule-template.json`) dan centang **Preserve query string**.
