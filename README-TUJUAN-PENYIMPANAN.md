# GIO910 - GERAI INOVASI OLAHAN
> DARI PROSES INOVASI GAPAI KESEMPURNAAN

Paket Master Semua Jalan (Tujuan Penyimpanan Terstruktur):

1. `appscript/` (1 Proyek Google Apps Script Lengkap - 67 berkas)
   - Upload / salin semua berkas ke 1 proyek di https://script.google.com/ (atau `clasp push`).
   - Jalankan `gasBootstrapOwner` lalu `installTriggers` di `Code_5_Backup.gs`.
   - Deploy -> New deployment -> Web app (Execute as: Me, Anyone) -> salin URL `/exec`.

2. `github/` (1 Repository GitHub Lengkap)
   - Isi URL `/exec` Anda di `github/assets/kai-config.js` & `github/wrappers/opsi1/index.html` (serta parameter `github/copy-hub.html` bila perlu).
   - Masuk ke folder `github/` lalu jalankan:
     git init && git branch -M main && git add . && git commit -m "Initial GIO910"
     git remote add origin https://github.com/USERNAME/REPO.git && git push -u origin main
   - Sambungkan repo GitHub ini ke:
     - Cloudflare Pages `gio910gerai.io`: build `bash scripts/build-opsi.sh opsi3`, output `dist-opsi3`
     - Cloudflare Pages `gio910.blog`: build `bash scripts/build-opsi.sh blog`, output `dist-blog`
     - 4EVERLAND `geraiinovasiolahan.gio910`: build `bash scripts/build-opsi.sh opsi5`, output `dist-opsi5`
     - 4EVERLAND `gio910gerai.dao`: build `bash scripts/build-opsi.sh opsi4`, output `dist-opsi4`
     - 4EVERLAND `gio910gerai.eth`: output `wrappers/opsi1`

3. `dao/`
   - Berkas cadangan Hybrid DAO (`gio910gerai.dao`) & Full DAO (Remix IDE) siap upload terpisah.

4. `seo/`
   - Artikel SEO, widget IG/Freename, `robots.txt`, dan `sitemap.xml`.

5. `cloudflare-opsi2/`
   - Panduan & template Redirect Rule Cloudflare untuk `gio910gerai.biz.id` (Citrahost -> `/exec`).
