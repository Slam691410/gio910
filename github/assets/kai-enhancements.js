/* ============================================================
   KANTOR AI — LAPISAN PERBAIKAN v2026.11.24
   Dipasang setelah bundle React. Tidak mengubah komponen inti;
   semua penyempurnaan bersifat tambahan (progressive enhancement).
   ============================================================ */
(() => {
  "use strict";

  const VER = "2026.11.24";
  const KEYS = [
    "kai-onefile-db-v1",
    "kai-onefile-sessions-v1",
    "kai-onefile-otps-v1",
  ];
  const PAGES = [
    { id: "kantor", label: "Kantor AI & Sistem Kerja" },
    { id: "ringkas", label: "Ringkasan" },
    { id: "org", label: "Organisasi" },
    { id: "tugas", label: "Pembagian Tugas" },
    { id: "inv", label: "Struktur Investasi" },
    { id: "aset", label: "Katalog 160 Aset" },
    { id: "dokumen", label: "Dokumen & Arsip" },
    { id: "alur", label: "Alur Kerja" },
    { id: "vendor", label: "Pihak Ketiga & Biaya" },
    { id: "unduh", label: "Video & Unduh" },
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function waitFor(fn, timeout = 4000, step = 40) {
    return new Promise((resolve) => {
      const t0 = Date.now();
      const tick = () => {
        let ok = false;
        try { ok = !!fn(); } catch (_) { ok = false; }
        if (ok || Date.now() - t0 > timeout) return resolve(ok);
        setTimeout(tick, step);
      };
      tick();
    });
  }

  /* ---------------- status & banner ---------------- */
  let bannerEl = null;
  function banner(msg, action) {
    if (!bannerEl) {
      bannerEl = document.createElement("div");
      bannerEl.className = "kai-banner";
      bannerEl.setAttribute("role", "status");
      bannerEl.setAttribute("aria-live", "polite");
      document.body.appendChild(bannerEl);
    }
    bannerEl.innerHTML = `<span>${esc(msg)}</span>`;
    if (action) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = action.label;
      b.addEventListener("click", () => { action.fn && action.fn(); bannerEl.classList.remove("is-open"); });
      bannerEl.appendChild(b);
    }
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "×";
    close.setAttribute("aria-label", "Tutup pemberitahuan");
    close.addEventListener("click", () => bannerEl.classList.remove("is-open"));
    bannerEl.appendChild(close);
    bannerEl.classList.add("is-open");
    clearTimeout(banner._t);
    banner._t = setTimeout(() => bannerEl && bannerEl.classList.remove("is-open"), action ? 20000 : 6000);
  }

  let saveStatusEl = null;
  function flashSaved() {
    if (!saveStatusEl) return;
    saveStatusEl.textContent = "Tersimpan";
    saveStatusEl.classList.add("is-on");
    clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(() => saveStatusEl.classList.remove("is-on"), 1600);
  }

  /* ---------------- storage guards (T-13, T-14) ---------------- */
  const nativeSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    try {
      const out = nativeSetItem.call(this, k, v);
      if (String(k).indexOf("kai-") === 0) flashSaved();
      return out;
    } catch (e) {
      if (/quota/i.test((e && e.name) || "") || (e && e.code === 22)) {
        banner("Penyimpanan browser penuh. Ekspor data lalu hapus arsip lama.", {
          label: "Ekspor JSON",
          fn: exportJson,
        });
      }
      throw e;
    }
  };
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.indexOf("kai-onefile-") === 0 && e.newValue !== e.oldValue && document.hidden) {
      banner("Data berubah di tab lain. Muat ulang agar tidak saling menimpa.", {
        label: "Muat ulang",
        fn: () => location.reload(),
      });
    }
  });

  /* ---------------- offline / online (T-16, B-10/B-11) ---------------- */
  function syncOnline() {
    if (navigator.onLine) {
      banner("Kembali daring. Data lokal tetap utuh dan siap disinkronkan.");
    } else {
      banner("Mode luring. Data tetap tersimpan di perangkat ini; sinkronisasi berjalan saat daring.", {
        label: "Coba ulang",
        fn: () => location.reload(),
      });
    }
  }
  window.addEventListener("online", syncOnline);
  window.addEventListener("offline", syncOnline);

  /* ---------------- text size (Q-01) ---------------- */
  const TEKS_MODES = ["nyaman", "besar", "padat"];
  function getTeks() {
    const v = localStorage.getItem("kai-teks");
    return TEKS_MODES.includes(v) ? v : "nyaman";
  }
  function setTeks(mode) {
    localStorage.setItem("kai-teks", mode);
    document.documentElement.setAttribute("data-kai-teks", mode); document.querySelectorAll("iframe.kai-page-frame").forEach(fr=>{try{fr.contentWindow&&fr.contentWindow.postMessage({type:"kai-set-teks",mode},"*");}catch(_){}});
    const btn = $("#kai-btn-teks");
    if (btn) {
      btn.querySelector(".kai-label-long").textContent =
        mode === "nyaman" ? "Teks nyaman" : mode === "besar" ? "Teks besar" : "Teks padat";
    }
  }
  document.documentElement.setAttribute("data-kai-teks", getTeks());

  /* ---------------- tables (Q-06, a11y) ---------------- */
  function labelTables() {
    const page = PAGES[currentPageIndex()];
    $$("main table").forEach((t, i) => {
      if (!t.getAttribute("aria-label") && !t.querySelector("caption")) {
        t.setAttribute("aria-label", `${page.label} — tabel ${i + 1}`);
      }
      $$("th", t).forEach((th) => {
        if (!th.getAttribute("scope")) {
          const inHead = th.parentElement && th.parentElement.parentElement && th.parentElement.parentElement.tagName === "THEAD";
          th.setAttribute("scope", inHead ? "col" : "row");
        }
      });
    });
    $$(".vn-scroll").forEach((el) => {
      el.tabIndex = 0;
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", "Tabel data, gulir horizontal dan vertikal");
    });
  }
  function wrapTables() {
    $$("main table").forEach((table) => {
      if (table.closest(".kai-table-wrap") || table.closest(".vn-scroll")) return;
      if (table.closest("[data-kai-skip-wrap]")) return;
      const wrap = document.createElement("div");
      wrap.className = "kai-table-wrap";
      wrap.setAttribute("role", "region");
      wrap.setAttribute("aria-label", "Tabel data, gulir horizontal");
      wrap.tabIndex = 0;
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
    const addHint = (wrap) => {
      let hint = wrap.previousElementSibling;
      if (hint && hint.classList && hint.classList.contains("kai-table-hint")) hint.remove();
      if (wrap.scrollWidth > wrap.clientWidth + 2) {
        hint = document.createElement("div");
        hint.className = "kai-table-hint";
        hint.textContent = "Geser tabel horizontal →";
        wrap.parentNode.insertBefore(hint, wrap);
      }
    };
    $$(".kai-table-wrap").forEach(addHint);
    $$(".vn-scroll").forEach(addHint);
    labelTables();
  }

  /* ---------------- breadcrumb (Q-08) ---------------- */
  function ensureBreadcrumb() {
    if ($(".kai-breadcrumb")) return;
    const nav = $('nav[aria-label="Navigasi utama portal"]');
    if (!nav) return;
    const bc = document.createElement("nav");
    bc.className = "kai-breadcrumb";
    bc.setAttribute("aria-label", "Breadcrumb");
    bc.innerHTML = '<span class="kai-bc-trail"></span>';
    nav.insertAdjacentElement("afterend", bc);
    bc.addEventListener("click", (e) => {
      const a = e.target.closest("[data-kai-nav]");
      if (a) { e.preventDefault(); goToPage(Number(a.getAttribute("data-kai-nav"))); }
    });
    updateBreadcrumb();
  }
  function currentPageIndex() {
    const btns = $$('nav[aria-label="Navigasi utama portal"] button');
    const i = btns.findIndex((b) => b.getAttribute("aria-current") === "page");
    return i < 0 ? 0 : i;
  }
  function updateBreadcrumb() {
    const trail = $(".kai-bc-trail");
    if (!trail) return;
    const i = currentPageIndex();
    trail.innerHTML = `<a href="#" data-kai-nav="0">Beranda</a><span class="kai-sep" aria-hidden="true">›</span><span aria-current="page">${esc(PAGES[i].label)}</span>`;
  }

  /* ---------------- vendor h1 (Q-02) ---------------- */
  function ensurePageH1() {
    const main = $("#konten-utama");
    if (!main || main.querySelector("#kai-iframe-host")) return;
    if (!main.querySelector("h1")) {
      const h = document.createElement("h1");
      h.className = "text-[17px] font-semibold text-[#e8eefc]";
      h.style.margin = "0 0 4px";
      h.textContent = `${PAGES[currentPageIndex()] ? currentPageIndex() + 1 : 1} · ${PAGES[currentPageIndex()] ? PAGES[currentPageIndex()].label : ""}`;
      main.insertBefore(h, main.firstChild);
    }
  }

  /* ---------------- skip link (a11y) ---------------- */
  function ensureSkipLink() {
    if ($(".kai-skip")) return;
    const a = document.createElement("a");
    a.className = "kai-skip";
    a.href = "#konten-utama";
    a.textContent = "Lewati ke konten utama";
    document.body.insertBefore(a, document.body.firstChild);
    a.addEventListener("click", (e) => {
      const main = $("#konten-utama");
      if (main) { e.preventDefault(); main.focus(); main.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
  }

  /* ---------------- navigation ---------------- */
  function goToPage(i) {
    const btns = $$('nav[aria-label="Navigasi utama portal"] button');
    if (btns[i]) btns[i].click();
  }
  async function goBerita() {
    goToPage(1);
    await waitFor(() => currentPageIndex() === 1, 3000);
    await waitFor(() => {
      const fr = document.querySelector('iframe.kai-page-frame[data-kai-page="ringkas"]');
      return fr && fr.offsetParent !== null;
    }, 4000);
    await sleep(220);
    const fr = document.querySelector('iframe.kai-page-frame[data-kai-page="ringkas"]');
    if (fr) {
      try { fr.contentWindow.postMessage({ type: "kai-scroll-berita" }, "*"); } catch (_) {}
    }
  }

  /* ---------------- route sync ---------------- */
  let lastPage = -1;
  function syncRoute() {
    const i = currentPageIndex();
    if (i !== lastPage) {
      lastPage = i;
      updateBreadcrumb();
      wrapTables();
      restoreDrafts();
    }
  }
  const obs = new MutationObserver(() => syncRoute());
  function startObserver() {
    const main = $("#konten-utama");
    if (main) obs.observe(main, { childList: true, subtree: false });
    const nav = $('nav[aria-label="Navigasi utama portal"]');
    if (nav) {
      obs.observe(nav, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-current"] });
    }
  }

  /* ---------------- autosave draft (Q-14) ---------------- */
  function draftKey(el) {
    const ph = el.getAttribute("placeholder") || el.getAttribute("aria-label") || el.id || "ta";
    const same = $$("textarea").filter((x) => (x.getAttribute("placeholder") || x.getAttribute("aria-label") || x.id || "ta") === ph);
    return `kai-draft:${PAGES[currentPageIndex()].id}:${ph}:${same.indexOf(el)}`;
  }
  function restoreDrafts() {
    $$("main textarea").forEach((el) => {
      if (el.value) return;
      const k = draftKey(el);
      const v = localStorage.getItem(k);
      if (!v) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      banner("Draf otomatis dipulihkan pada kolom teks.");
    });
  }
  document.addEventListener(
    "input",
    (e) => {
      const el = e.target;
      if (!el || el.tagName !== "TEXTAREA") return;
      const k = draftKey(el);
      try {
        if (el.value) localStorage.setItem(k, el.value);
        else localStorage.removeItem(k);
      } catch (_) {}
    },
    true
  );
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (!/kirim|simpan|buat|posting|ajukan|terbitkan/i.test(b.textContent || "")) return;
      const prefix = `kai-draft:${PAGES[currentPageIndex()].id}:`;
      Object.keys(localStorage)
        .filter((k) => k.indexOf(prefix) === 0)
        .forEach((k) => localStorage.removeItem(k));
    },
    true
  );

  /* ---------------- toolbar (di baris breadcrumb, tidak menutupi konten) ---------------- */
  function ensureDock() {
    if ($(".kai-toolbar")) return;
    const bc = $(".kai-breadcrumb");
    if (!bc) return;
    const bar = document.createElement("div");
    bar.className = "kai-toolbar";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Alat portal");
    bar.innerHTML = `
      <button type="button" class="kai-tool-btn" id="kai-btn-cari" aria-haspopup="dialog" title="Cari di seluruh portal (Ctrl+K)">
        <span aria-hidden="true">⌕</span> Cari <span class="kai-kbd">Ctrl K</span>
      </button>
      <button type="button" class="kai-tool-btn" id="kai-btn-cetak" title="Cetak halaman ini (Ctrl+P)">
        <span aria-hidden="true">⎙</span> Cetak
      </button>
      <button type="button" class="kai-tool-btn" id="kai-btn-teks" title="Ubah ukuran teks">
        <span aria-hidden="true">Aa</span> <span class="kai-label-long">Teks nyaman</span>
      </button>
      <button type="button" class="kai-tool-btn" id="kai-btn-data" aria-haspopup="true" aria-expanded="false" title="Ekspor / impor data">
        <span aria-hidden="true">▤</span> Data
      </button>
      <button type="button" class="kai-tool-btn" id="kai-btn-berita" title="Berita & pemantauan pasar">
        <span aria-hidden="true">◉</span> Berita
      </button>
      <button type="button" class="kai-tool-btn" id="kai-btn-info" aria-haspopup="dialog" title="Pembaruan & jejak perbaikan">
        <span aria-hidden="true">ⓘ</span> <span class="kai-label-long">Pembaruan</span>
      </button>
      <span class="kai-save-status" id="kai-save-status" aria-live="polite">Tersimpan</span>
    `;
    bc.appendChild(bar);
    saveStatusEl = $("#kai-save-status");

    $("#kai-btn-cari").addEventListener("click", openSearch);
    $("#kai-btn-cetak").addEventListener("click", () => {
      const activeWrap = document.querySelector(".kai-iframe-wrap:not(.is-hidden)");
      if (activeWrap) {
        const fr = activeWrap.querySelector("iframe.kai-page-frame");
        if (fr) { try { fr.contentWindow.focus(); fr.contentWindow.print(); return; } catch (_) {} }
      }
      window.print();
    });
    $("#kai-btn-teks").addEventListener("click", () => {
      const m = getTeks();
      setTeks(TEKS_MODES[(TEKS_MODES.indexOf(m) + 1) % TEKS_MODES.length]);
    });
    $("#kai-btn-berita").addEventListener("click", goBerita);
    $("#kai-btn-info").addEventListener("click", openInfo);
    $("#kai-btn-data").addEventListener("click", toggleDataPop);
    setTeks(getTeks());
  }

  function ensureDataPop() {
    if ($(".kai-pop")) return $(".kai-pop");
    const pop = document.createElement("div");
    pop.className = "kai-pop";
    pop.setAttribute("role", "menu");
    pop.setAttribute("aria-label", "Menu data");
    pop.innerHTML = `
      <button type="button" role="menuitem" data-kai="export-json">⬇ Ekspor cadangan (JSON)</button>
      <button type="button" role="menuitem" data-kai="export-zip">⬇ Ekspor arsip (ZIP)</button>
      <button type="button" role="menuitem" data-kai="import-json">⬆ Impor cadangan (JSON)</button>
      <button type="button" role="menuitem" data-kai="print-ringkas">⎙ Cetak ringkas (tanpa tabel)</button>
      <button type="button" role="menuitem" data-kai="clear-drafts">✕ Hapus draf tersimpan</button>
      <div class="kai-pop-note">Data tersimpan di browser ini (localStorage). Cadangan berisi seluruh modul, bukan hanya halaman aktif.</div>
      <input type="file" id="kai-import-file" accept="application/json,.json" hidden />
    `;
    document.body.appendChild(pop);
    pop.addEventListener("click", (e) => {
      const b = e.target.closest("[data-kai]");
      if (!b) return;
      const a = b.getAttribute("data-kai");
      if (a === "export-json") exportJson();
      if (a === "export-zip") exportZip();
      if (a === "import-json") $("#kai-import-file").click();
      if (a === "print-ringkas") printRingkas();
      if (a === "clear-drafts") {
        const n = Object.keys(localStorage).filter((k) => k.indexOf("kai-draft:") === 0).length;
        Object.keys(localStorage).filter((k) => k.indexOf("kai-draft:") === 0).forEach((k) => localStorage.removeItem(k));
        banner(`${n} draf tersimpan dihapus.`);
      }
      toggleDataPop(false);
    });
    $("#kai-import-file").addEventListener("change", importJson);
    return pop;
  }
  function toggleDataPop(force) {
    const pop = ensureDataPop();
    const btn = $("#kai-btn-data");
    const open = typeof force === "boolean" ? force : !pop.classList.contains("is-open");
    pop.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      const r = btn.getBoundingClientRect();
      pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 260)) + "px";
      pop.style.top = r.bottom + 8 + "px";
      pop.style.bottom = "auto";
    }
  }
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".kai-pop") && !e.target.closest("#kai-btn-data")) toggleDataPop(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleDataPop(false); });

  /* ---------------- export / import (B-03, B-04) ---------------- */
  function collectData() {
    const o = {
      _meta: {
        app: "Kantor AI & Sistem Kerja",
        version: VER,
        exportedAt: new Date().toISOString(),
        timezone: "Asia/Jakarta (WIB)",
        scope: "localStorage browser ini",
      },
    };
    KEYS.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v != null) o[k] = v;
    });
    return o;
  }
  function download(name, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }
  function stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  }
  function exportJson() {
    const data = collectData();
    download(`kantor-ai-cadangan-${stamp()}.json`, new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    banner("Cadangan JSON diunduh. Simpan di luar browser.");
  }
  function exportZip() {
    const enc = new TextEncoder();
    const data = collectData();
    const readme = [
      "KANTOR AI & SISTEM KERJA — CADANGAN DATA",
      `Versi aplikasi : ${VER}`,
      `Dibuat        : ${new Date().toISOString()}`,
      `Zona waktu    : Asia/Jakarta (WIB)`,
      "",
      "Isi:",
      "  data.json   - seluruh data localStorage (pengguna, tugas, intake, kas, absensi, dokumen, audit)",
      "  CHANGELOG.md- daftar perbaikan versi ini",
      "  README.txt  - berkas ini",
      "",
      "Cara memulihkan:",
      "  1. Buka Kantor AI di browser yang sama.",
      "  2. Dock Data > Impor cadangan (JSON) > pilih data.json dari ZIP ini.",
      "  3. Periksa jumlah baris pada pratinjau, lalu konfirmasi.",
      "",
      "Catatan: cadangan berisi data pribadi. Simpan terenkripsi dan jangan kirim lewat chat.",
    ].join("\n");
    const changelog = buildChangelogText();
    const files = [
      { name: "data.json", data: enc.encode(JSON.stringify(data, null, 2)) },
      { name: "README.txt", data: enc.encode(readme) },
      { name: "CHANGELOG.md", data: enc.encode(changelog) },
    ];
    const zip = zipStore(files);
    download(`kantor-ai-cadangan-${stamp()}.zip`, new Blob([zip], { type: "application/zip" }));
    banner("Arsip ZIP diunduh (data.json + README + CHANGELOG).");
  }
  function importJson(ev) {
    const file = ev && ev.target && ev.target.files ? ev.target.files[0] : null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        const raw = obj["kai-onefile-db-v1"];
        if (!raw) throw new Error("Berkas tidak memuat kunci kai-onefile-db-v1.");
        const db = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (!db || !Array.isArray(db.users) || db.users.length === 0) throw new Error("Struktur data tidak dikenali (users kosong).");
        const counts = {
          pengguna: db.users.length,
          tugas: (db.tasks || []).length,
          intake: (db.intake || []).length,
          keuangan: (db.cash || []).length,
          absen: (db.attendance || []).length,
          dokumen: (db.documents || []).length,
          audit: (db.audit || []).length,
        };
        const ok = window.confirm(
          "Pratinjau impor:\n" +
            Object.entries(counts).map(([k, v]) => `  ${k}: ${v}`).join("\n") +
            `\n\nVersi berkas: ${(obj._meta && obj._meta.version) || "?"}\n` +
            "Lanjutkan? Data di browser ini akan DIGANTI."
        );
        if (!ok) return;
        KEYS.forEach((k) => {
          if (obj[k] != null) localStorage.setItem(k, typeof obj[k] === "string" ? obj[k] : JSON.stringify(obj[k]));
        });
        location.reload();
      } catch (e) {
        banner("Impor ditolak: " + (e && e.message ? e.message : "berkas tidak valid"), {
          label: "Pilih ulang",
          fn: () => $("#kai-import-file").click(),
        });
      } finally {
        if (ev && ev.target) ev.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  /* ---------------- ZIP (store) ---------------- */
  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function zipStore(files) {
    const enc = new TextEncoder();
    const parts = [];
    const central = [];
    let offset = 0;
    const d = new Date();
    const dosTime = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff;
    const dosDate = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;
    files.forEach((f) => {
      const name = enc.encode(f.name);
      const data = f.data;
      const crc = crc32(data);
      const lh = new Uint8Array(30 + name.length);
      const lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, dosTime, true);
      lv.setUint16(12, dosDate, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.length, true);
      lv.setUint32(22, data.length, true);
      lv.setUint16(26, name.length, true);
      lv.setUint16(28, 0, true);
      lh.set(name, 30);
      parts.push(lh, data);

      const ch = new Uint8Array(46 + name.length);
      const cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true);
      cv.setUint16(14, dosDate, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, name.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      ch.set(name, 46);
      central.push(ch);
      offset += lh.length + data.length;
    });
    const centralSize = central.reduce((s, c) => s + c.length, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, 0, true);
    ev.setUint16(10, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);
    const total = offset + centralSize + 22;
    const out = new Uint8Array(total);
    let p = 0;
    parts.concat(central, [end]).forEach((x) => { out.set(x, p); p += x.length; });
    return out;
  }

  /* ---------------- print modes (Q-07) ---------------- */
  function printRingkas() {
    document.body.classList.add("kai-print-ringkas");
    window.print();
    setTimeout(() => document.body.classList.remove("kai-print-ringkas"), 1000);
  }

  /* ---------------- modal helpers ---------------- */
  function ensureModal(id, title) {
    if ($("#" + id)) return $("#" + id);
    const wrap = document.createElement("div");
    wrap.className = "kai-modal";
    wrap.id = id;
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-labelledby", id + "-title");
    wrap.innerHTML = `
      <div class="kai-modal-card">
        <div class="kai-modal-head">
          <h2 id="${id}-title">${esc(title)}</h2>
          <button type="button" class="kai-modal-close" aria-label="Tutup dialog">×</button>
        </div>
        <div class="kai-modal-body" id="${id}-body"></div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener("click", (e) => { if (e.target === wrap) closeModal(wrap); });
    wrap.querySelector(".kai-modal-close").addEventListener("click", () => closeModal(wrap));
    return wrap;
  }
  function openModal(el) {
    el.classList.add("is-open");
    const f = el.querySelector("input, button");
    if (f) setTimeout(() => f.focus(), 30);
  }
  function closeModal(el) {
    el.classList.remove("is-open");
    const btn = $("#kai-btn-cari");
    if (btn) btn.focus();
  }

  /* ---------------- global search (Q-12) ---------------- */
  let pageTexts = null;
  let searchIndexBuilding = false;
  // indeks dibuang setiap kali sesi berubah agar hasil setelah-masuk tidak tersisa di tampilan publik
  window.addEventListener("kai-session-change", () => { pageTexts = null; });
  function extractFromIframe(pageId) {
    return new Promise((resolve) => {
      const existing = document.querySelector(`iframe.kai-page-frame[data-kai-page="${pageId}"]`);
      const temp = !existing;
      const fr = existing || document.createElement("iframe");
      const reqId = "idx-" + pageId + "-" + Math.random().toString(36).slice(2);
      let done = false;
      const cleanup = () => {
        window.removeEventListener("message", onRes);
        if (temp && fr.parentNode) fr.parentNode.removeChild(fr);
      };
      const finish = (arr) => {
        if (done) return;
        done = true;
        cleanup();
        resolve(Array.isArray(arr) ? arr : []);
      };
      const onRes = (ev) => {
        const m = ev && ev.data;
        if (m && m.type === "kai-extract-text-result" && m.reqId === reqId) {
          finish(m.items);
        }
      };
      window.addEventListener("message", onRes);
      const ask = () => {
        try {
          if (fr.contentWindow) {
            fr.contentWindow.postMessage({ type: "kai-sync-session", session: (() => { try { return JSON.parse(sessionStorage.getItem("hi_session_v1") || "null"); } catch(_) { return null; } })() }, "*");
            fr.contentWindow.postMessage({ type: "kai-extract-text", reqId }, "*");
          }
        } catch (_) {}
      };
      if (temp) {
        fr.style.cssText = "position:fixed;left:-9999px;top:0;width:1024px;height:600px;opacity:0;pointer-events:none;";
        fr.src = (window.__KAI_GAS_EXEC_URL__ ? window.__KAI_GAS_EXEC_URL__ + (window.__KAI_GAS_EXEC_URL__.indexOf("?") >= 0 ? "&" : "?") + "page=" + encodeURIComponent(pageId) : `pages/${pageId}.html`);
        fr.addEventListener("load", () => setTimeout(ask, 180));
        document.body.appendChild(fr);
      } else {
        ask();
      }
      setTimeout(() => finish([]), 3500);
    });
  }

  async function buildIndex(onProgress) {
    if (pageTexts) return pageTexts;
    if (searchIndexBuilding) return null;
    searchIndexBuilding = true;
    const navs = $$('nav[aria-label="Navigasi utama portal"] button');
    const start = currentPageIndex();
    const out = [];
    for (let i = 0; i < navs.length; i++) {
      const pg = PAGES[i];
      if (window.__kaiPageAllowed && !window.__kaiPageAllowed(pg.id)) continue;
      onProgress && onProgress(`Mengindeks ${i + 1}/${navs.length} — ${pg.label}`);
      if (pg.id === "kantor") {
        if (currentPageIndex() !== 0) {
          navs[0].click();
          await waitFor(() => currentPageIndex() === 0, 3000);
          await sleep(80);
        }
        const main = $("#konten-utama");
        const seen = new Set();
        $$("h1,h2,h3,h4,p,li,tr,summary,.vn-name,.bn-name", main).forEach((el) => {
          const t = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
          if (t.length < 3 || t.length > 260) return;
          if (seen.has(t)) return;
          seen.add(t);
          out.push({ page: i, text: t });
        });
      } else {
        const items = await extractFromIframe(pg.id);
        items.forEach((t) => out.push({ page: i, text: t }));
      }
    }
    if (currentPageIndex() !== start && navs[start]) {
      navs[start].click();
      await sleep(80);
    }
    pageTexts = out;
    searchIndexBuilding = false;
    return out;
  }

  function ensureSearchModal() {
    if ($("#kai-search")) return $("#kai-search");
    const m = ensureModal("kai-search", "Cari di seluruh portal");
    $("#kai-search-body").innerHTML = `
      <label class="kai-sr-only" for="kai-search-input">Kata kunci</label>
      <input class="kai-search-input" id="kai-search-input" type="search" placeholder="Ketik nama aset, dokumen, vendor, istilah… (min. 2 huruf)" autocomplete="off" />
      <div class="kai-results" id="kai-search-results" role="listbox" aria-label="Hasil pencarian"></div>
      <div class="kai-hint"><span class="kai-kbd">↑</span> <span class="kai-kbd">↓</span> pilih · <span class="kai-kbd">Enter</span> buka · <span class="kai-kbd">Esc</span> tutup</div>`;
    const input = $("#kai-search-input");
    const results = $("#kai-search-results");
    let active = -1;
    let items = [];
    const render = () => {
      const q = input.value.trim();
      if (q.length < 2) {
        results.innerHTML = `<div class="kai-empty">Ketik minimal 2 huruf. Indeks mencakup 10 halaman: judul, paragraf, baris tabel, nama vendor dan aset.</div>`;
        items = [];
        return;
      }
      const ql = q.toLowerCase();
      const terms = ql.split(/\s+/).filter(Boolean);
      const scored = [];
      (pageTexts || []).forEach((it) => {
        const t = it.text.toLowerCase();
        let s = 0;
        if (t === ql) s += 100;
        if (t.startsWith(ql)) s += 60;
        terms.forEach((term) => { if (t.includes(term)) s += 12; });
        if (s > 0) scored.push({ ...it, score: s });
      });
      scored.sort((a, b) => b.score - a.score);
      items = scored.slice(0, 40);
      if (!items.length) {
        results.innerHTML = `<div class="kai-empty">Tidak ada hasil untuk “${esc(q)}”. Coba kata lain atau buka halaman katalog.</div>`;
        return;
      }
      active = 0;
      results.innerHTML = items.map((it, i) => {
        const page = PAGES[it.page];
        const safe = esc(it.text);
        const re = new RegExp("(" + ql.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
        const hl = safe.replace(re, "<mark>$1</mark>");
        return `<button type="button" class="kai-result${i === 0 ? " is-active" : ""}" role="option" aria-selected="${i === 0}" data-kai-idx="${i}">
          <span class="kai-result-page">${esc(page.label)}</span>${hl}</button>`;
      }).join("");
    };
    const openResult = async (it) => {
      closeModal(m);
      goToPage(it.page);
      await waitFor(() => currentPageIndex() === it.page, 4000);
      await sleep(200);
      if (PAGES[it.page] && PAGES[it.page].id !== "kantor") {
        const pgId = PAGES[it.page].id;
        await waitFor(() => document.querySelector(`iframe.kai-page-frame[data-kai-page="${pgId}"]`), 4000);
        await sleep(220);
        const fr = document.querySelector(`iframe.kai-page-frame[data-kai-page="${pgId}"]`);
        if (fr && fr.contentWindow) {
          try { fr.contentWindow.postMessage({ type: "kai-highlight-text", text: it.text }, "*"); } catch (_) {}
        }
        return;
      }
      const nodes = $$("#konten-utama *");
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
      const textOf = (el) => norm(el.innerText || el.textContent);
      const byDepth = (a, b) => a.children.length - b.children.length || textOf(a).length - textOf(b).length;
      let cands = nodes.filter((el) => textOf(el) === it.text).sort(byDepth);
      let target = cands[0];
      if (!target) {
        const prefix = it.text.slice(0, 70);
        cands = nodes.filter((el) => textOf(el).startsWith(prefix)).sort(byDepth);
        target = cands[0];
      }
      if (!target && it.text.length > 60) {
        const mid = it.text.slice(15, 75);
        cands = nodes.filter((el) => textOf(el).includes(mid)).sort(byDepth);
        target = cands[0];
      }
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("kai-hit");
        setTimeout(() => target.classList.remove("kai-hit"), 4200);
      }
    };
    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!items.length) return;
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        $$(".kai-result", results).forEach((el, i) => {
          el.classList.toggle("is-active", i === active);
          el.setAttribute("aria-selected", i === active ? "true" : "false");
        });
        const cur = $(`.kai-result[data-kai-idx="${active}"]`, results);
        if (cur) cur.scrollIntoView({ block: "nearest" });
      }
      if (e.key === "Enter" && items[active]) { e.preventDefault(); openResult(items[active]); }
    });
    results.addEventListener("click", (e) => {
      const b = e.target.closest(".kai-result");
      if (!b) return;
      openResult(items[Number(b.getAttribute("data-kai-idx"))]);
    });
    return m;
  }
  async function openSearch() {
    const m = ensureSearchModal();
    openModal(m);
    const input = $("#kai-search-input");
    input.value = "";
    $("#kai-search-results").innerHTML = `<div class="kai-empty">Menyiapkan indeks…</div>`;
    if (!pageTexts) {
      const body = $("#kai-search-body");
      const prog = document.createElement("div");
      prog.className = "kai-empty";
      prog.id = "kai-search-progress";
      body.insertBefore(prog, $("#kai-search-results"));
      await buildIndex((msg) => { const p = $("#kai-search-progress"); if (p) p.textContent = msg; });
      const p = $("#kai-search-progress");
      if (p) p.remove();
    }
    $("#kai-search-results").innerHTML = `<div class="kai-empty">Ketik minimal 2 huruf. Indeks mencakup 10 halaman: judul, paragraf, baris tabel, nama vendor dan aset.</div>`;
    input.focus();
  }

  /* ---------------- changelog (T-25) ---------------- */
  function buildChangelogText() {
    return [
      "# Changelog — Kantor AI & Sistem Kerja",
      `Versi: ${VER} (24 November 2026)`,
      "",
      "## L17 — UI, aksesibilitas, kinerja",
      "- Q-01 Tipografi minimum 12,5 px (mode Nyaman), mode Besar 14 px, mode Padat sesuai desain awal.",
      "- Q-02 Satu <h1> per halaman (9/9); judul halaman diurutkan 1–9 sesuai navigasi.",
      "- Q-03 Toast status kini aria-live=polite + aria-atomic.",
      "- Q-04 Indikator fokus keyboard konsisten (focus-visible 3 px).",
      "- Q-06 Tabel dibungkus wadah gulir horizontal + petunjuk.",
      "- Q-07 Gaya cetak A4: menu/header/footer disembunyikan; mode cetak ringkas tanpa tabel.",
      "- Q-08 Breadcrumb Beranda › Halaman di setiap halaman.",
      "- Q-09 Nama modul diseragamkan: 'Dokumen & Arsip', 'Jejak Audit (lokal)'.",
      "- Q-11 Navigasi 360 px menjadi satu baris dapat digulir (tanpa scroll halaman).",
      "- Q-12 Pencarian global Ctrl+K atas 10 halaman (judul, paragraf, baris tabel, vendor).",
      "- Q-14 Draf otomatis pada textarea (localStorage) + pemulihan saat kembali.",
      "- Q-17 Audit tombol: 0 tombol tanpa nama yang terbaca.",
      "- Q-20 Glosarium istilah asing pada dialog Pembaruan.",
      "",
      "## L01 — halaman konten",
      "- H-05/H-11/…/H-53 Struktur heading dan landmark diperbaiki di 9 halaman.",
      "- H-06/H-12/…/H-54 @media print aktif di 9 halaman.",
      "",
      "## L15 — batas platform",
      "- T-13 Penjaga kuota localStorage: peringatan saat penyimpanan penuh.",
      "- T-14 Peringatan perubahan data dari tab lain + tombol muat ulang.",
      "- T-15 Sesi berakhir 8 jam (exp pada sessionStorage + auto-logout).",
      "- T-16 Mode luring: data lokal tetap jalan; banner status daring/luring.",
      "- T-25 Versi + changelog + hash build pada footer dan dialog Pembaruan.",
      "",
      "## L18 — kontinuitas",
      "- B-03 Ekspor cadangan JSON dan ZIP (data.json + README + CHANGELOG).",
      "- B-04 Impor JSON dengan pratinjau jumlah baris dan validasi struktur.",
      "- B-10/B-11 Mode luring dan cadangan lokal.",
      "",
      "## L16 — kejujuran label",
      "- N-04 Badge 18 Agen AI ditandai 'mode demo'.",
      "- N-05 'Audit Log Server' menjadi 'Jejak Audit (lokal)'.",
      "- N-06 Absensi ditandai 'mode demo'.",
      "- N-08 'Live via tautan' menjadi 'Tautan keluar · bukan live feed'.",
      "",
      "Catatan: butir yang membutuhkan server, izin, kontrak, atau keputusan manajemen belum dikerjakan;",
      "daftar lengkap ada di LAPORAN_PERBAIKAN_2026-11-24.md.",
    ].join("\n");
  }
  function openInfo() {
    const m = ensureModal("kai-info", "Pembaruan & jejak perbaikan");
    const body = $("#kai-info-body");
    const rows = [
      ["Q-01", "Tipografi minimum 12,5 px", "Selesai", "Mode Nyaman aktif; toggle Aa"],
      ["Q-02", "Satu h1 per halaman", "Selesai", "9/9 halaman"],
      ["Q-03", "Pengumuman status (aria-live)", "Selesai", "Toast + banner"],
      ["Q-04", "Fokus keyboard", "Selesai", "focus-visible 3 px"],
      ["Q-05", "Kontras", "Dipertahankan", "7,5–16,1:1"],
      ["Q-06", "Tabel lebar", "Selesai", "Wadah gulir + petunjuk"],
      ["Q-07", "Cetak", "Selesai", "A4, tanpa menu; mode ringkas"],
      ["Q-08", "Navigasi ganda", "Selesai", "Breadcrumb"],
      ["Q-09", "Nama kembar", "Selesai", "Dokumen & Arsip"],
      ["Q-10", "Berita terkubur", "Selesai", "Tombol Berita di dock"],
      ["Q-11", "Mobile 360 px", "Selesai", "Nav satu baris, tanpa overflow"],
      ["Q-12", "Pencarian global", "Selesai", "Ctrl+K, 9 halaman"],
      ["Q-13", "Umpan balik aksi", "Sebagian", "Toast + status Tersimpan"],
      ["Q-14", "Simpan draf", "Selesai", "Textarea autosave"],
      ["Q-15", "Format rupiah", "Terverifikasi", "Rp1.234.567 konsisten"],
      ["Q-16", "Zona waktu", "Terverifikasi", "WIB + ISO pada ekspor"],
      ["Q-17", "Ikon tanpa aria", "Selesai", "0 tombol tanpa nama"],
      ["Q-18", "Muatan awal", "Sebagian", "1,02 MB → gzip ±210 KB"],
      ["Q-19", "Gambar", "Terverifikasi", "0 img eksternal"],
      ["Q-20", "Istilah asing", "Selesai", "Glosarium di dialog ini"],
    ];
    body.innerHTML = `
      <p style="font:600 12.5px/1.55 system-ui;color:#9fb0d0;margin:0 0 10px">
        Versi <b style="color:#e8eefc">${VER}</b> · build <code style="font-family:ui-monospace;color:#7dd3fc">${buildHash()}</code> ·
        sumber: <b style="color:#e8eefc">TABEL_KESELURUHAN_MITIGASI_ATOMIK_2026-11-23.md</b>.
        Desain dan posisi menu tidak diubah; yang diperbaiki adalah butir minor pada tabel.
      </p>
      <div class="kai-table-wrap" data-kai-skip-wrap="1" style="max-height:none;border:0">
        <table style="width:100%;border-collapse:collapse;font:600 11.5px/1.4 system-ui;color:#cfe0ff">
          <thead><tr><th style="text-align:left;padding:4px 6px;border-bottom:1px solid #22365c;color:#7dd3fc">ID</th><th style="text-align:left;padding:4px 6px;border-bottom:1px solid #22365c;color:#7dd3fc">Butir</th><th style="text-align:left;padding:4px 6px;border-bottom:1px solid #22365c;color:#7dd3fc">Status</th><th style="text-align:left;padding:4px 6px;border-bottom:1px solid #22365c;color:#7dd3fc">Bukti</th></tr></thead>
          <tbody>${rows.map((r) => `<tr><td style="padding:3px 6px;border-bottom:1px solid #1c2d4a;font-family:ui-monospace">${r[0]}</td><td style="padding:3px 6px;border-bottom:1px solid #1c2d4a">${esc(r[1])}</td><td style="padding:3px 6px;border-bottom:1px solid #1c2d4a;color:${r[2] === "Selesai" ? "#6ee7b7" : r[2] === "Sebagian" ? "#ffd166" : "#9fb0d0"}">${esc(r[2])}</td><td style="padding:3px 6px;border-bottom:1px solid #1c2d4a">${esc(r[3])}</td></tr>`).join("")}</tbody>
        </table>
      </div>
      <h3 style="font:800 13px/1.4 system-ui;color:#e8eefc;margin:14px 0 6px">Glosarium istilah (Q-20)</h3>
      <dl style="font:600 12px/1.5 system-ui;color:#9fb0d0;margin:0">
        <dt style="color:#e8eefc;font-weight:800">RAPID</dt><dd style="margin:0 0 6px">Ranking And Prioritizing Investment Decisions — kerangka memeringkat peluang sebelum due diligence.</dd>
        <dt style="color:#e8eefc;font-weight:800">MNPI</dt><dd style="margin:0 0 6px">Material Non-Public Information — informasi harga pasar yang belum publik; tidak boleh keluar tanpa DPA.</dd>
        <dt style="color:#e8eefc;font-weight:800">AUM</dt><dd style="margin:0 0 6px">Assets Under Management — nilai aset yang dikelola.</dd>
        <dt style="color:#e8eefc;font-weight:800">TER</dt><dd style="margin:0 0 6px">Total Expense Ratio — total biaya reksa dana per tahun.</dd>
        <dt style="color:#e8eefc;font-weight:800">MoS</dt><dd style="margin:0 0 6px">Margin of Safety — selisih harga wajar dengan harga beli.</dd>
        <dt style="color:#e8eefc;font-weight:800">Maker-checker</dt><dd style="margin:0 0 6px">Pembuat transaksi dan pemeriksa adalah orang berbeda.</dd>
        <dt style="color:#e8eefc;font-weight:800">DPA</dt><dd style="margin:0 0 6px">Data Processing Agreement — perjanjian pemrosesan data dengan vendor.</dd>
      </dl>
      <p style="font:600 11px/1.5 system-ui;color:#71809f;margin:12px 0 0">Butir yang belum dikerjakan adalah pekerjaan server, legal, kontrak, atau keputusan manajemen (L03–L09, L12–L14, L19–L20). Daftar lengkap ada di berkas laporan.</p>`;
    openModal(m);
  }
  function buildHash() {
    // Hash deterministik pendek dari isi dokumen (bukan cryptographic)
    const s = document.documentElement.outerHTML;
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return ("0000000" + h.toString(16)).slice(-8);
  }

  /* ---------------- keyboard (Q-12) ---------------- */
  document.addEventListener("keydown", (e) => {
    const k = (e.key || "").toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === "k") { e.preventDefault(); openSearch(); }
    if (k === "escape") {
      $$(".kai-modal.is-open").forEach((m) => m.classList.remove("is-open"));
      toggleDataPop(false);
    }
  });

  /* ---------------- boot ---------------- */
  async function boot() {
    const ok = await waitFor(() => $("#konten-utama") && $$('nav[aria-label="Navigasi utama portal"] button').length === 9, 15000, 80);
    if (!ok) return;
    ensureSkipLink();
    ensureBreadcrumb();
    ensureDock();
    wrapTables();
    restoreDrafts();
    startObserver();
    syncRoute();
    // Indeks pencarian dibangun saat pertama kali dibuka (agar tidak menambah beban awal).
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  // API kecil untuk pengujian otomatis
  window.__KAI__ = { VER, PAGES, buildIndex, openSearch, openInfo, exportJson, exportZip, getTeks, setTeks, currentPageIndex };
})();

/* ============================================================
   KANTOR AI — LAPISAN 2 (Apps Script-ready) v2026.11.24
   Dijalankan setelah enhancements.js. Semua tambahan; tidak
   mengubah komponen inti. Aman saat mode demo lokal maupun
   saat ditempel ke proyek Apps Script sungguhan.
   ============================================================ */
(() => {
  "use strict";

  const VER = "2026.11.24";
  const MODE = window.__KAI_DEMO_SHIM__ ? "demo" : "gas";
  const IS_GAS = MODE === "gas";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
  const now = () => new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta", hour12: false }).replace("T", " ");
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  function banner(msg, action) {
    let el = $("#kai-banner2");
    if (!el) {
      el = document.createElement("div");
      el.id = "kai-banner2";
      el.className = "kai-banner";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.innerHTML = '<span class="kai-banner-msg">' + esc(msg) + "</span>" + (action ? '<button type="button" class="kai-banner-btn">' + esc(action.label) + "</button>" : "");
    el.classList.add("is-on");
    const btn = el.querySelector(".kai-banner-btn");
    if (btn) btn.addEventListener("click", () => { el.classList.remove("is-on"); action.fn(); });
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("is-on"), 7000);
  }

  const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } };

  /* ---------- SHA-256 sinkron (L04 F-85) ---------- */
  function sha256(str) {
    const ascii = unescape(encodeURIComponent(String(str)));
    const rr = (v, a) => (v >>> a) | (v << (32 - a));
    const maxWord = Math.pow(2, 32);
    let result = "";
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = (sha256.h = sha256.h || []);
    const k = (sha256.k = sha256.k || []);
    let primeCounter = k.length;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    let s = ascii + "\x80";
    while (s.length % 64 - 56) s += "\x00";
    for (let i = 0; i < s.length; i++) {
      const j = s.charCodeAt(i);
      words[i >> 2] |= j << ((3 - i) % 4 * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;
    for (let j = 0; j < words.length; ) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash;
      hash = hash.slice(0, 8);
      const h = hash;
      for (let i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = h[0], e = h[4];
        const t1 = h[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & h[5]) ^ (~e & h[6])) + k[i] + (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & h[1]) ^ (a & h[2]) ^ (h[1] & h[2]));
        h.pop();
        h.unshift((t1 + t2) | 0);
        h[4] = (h[4] + t1) | 0;
      }
      for (let i = 0; i < 8; i++) h[i] = (h[i] + oldHash[i]) | 0;
    }
    for (let i = 0; i < 8; i++) {
      for (let j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? "0" : "") + b.toString(16);
      }
    }
    return result;
  }

  /* ============================================================
     1 · JEMBATAN APPS SCRIPT
     - tidak menimpa google.script.run asli
     - antrean tulis, timeout 30 dtk, 1× ulang, kuota, outbox
     ============================================================ */
  const BASE = window.google && window.google.script && window.google.script.run;
  const WRITE_RE = /\.(create|update|status|submit|verify|logout)$/;
  const READ_CACHEABLE = /\.(list|get)$/;
  const BUSINESS_ERR = /wajib|Akses ditolak|tidak ditemukan|tidak sesuai|sudah digunakan|Ditolak|berizin|Butuh|Persetujuan|Sesi|Belum masuk|sesi berakhir|nonaktif/i;

  const state = {
    chain: Promise.resolve(),
    active: 0,
    quota: read("kai-quota-v1", { day: "", n: 0 }),
    outbox: read("kai-outbox-v1", []),
    acts: [],
  };

  function quotaTick() {
    const d = now().slice(0, 10);
    if (state.quota.day !== d) state.quota = { day: d, n: 0 };
    state.quota.n++;
    write("kai-quota-v1", state.quota);
    if (state.quota.n === 701) {
      banner("Kuota panggilan hari ini sudah 70% (" + state.quota.n + "/1.000). Saat dipakai di Apps Script, pantau kuota di Project Settings.");
    }
  }

  function logAct(label, status) {
    state.acts.unshift({ label, status, at: now().slice(11, 19) });
    state.acts = state.acts.slice(0, 6);
    const box = $("#kai-act");
    if (!box) return;
    const dot = (s) => (s === "ok" ? "#34d399" : s === "queue" ? "#fbbf24" : s === "wait" ? "#38bdf8" : "#f87171");
    box.innerHTML =
      '<div class="kai-act-head">Status aksi <span class="kai-act-live" aria-hidden="true"></span></div>' +
      state.acts.map((a) => '<div class="kai-act-row"><span class="kai-act-dot" style="background:' + dot(a.status) + '"></span><span>' + esc(a.label) + '</span><span class="kai-act-time">' + esc(a.at) + "</span></div>").join("") +
      (state.outbox.length ? '<button type="button" class="kai-act-retry" id="kai-act-retry">Kirim ulang antrean (' + state.outbox.length + ")</button>" : "");
    box.classList.toggle("is-on", state.acts.length > 0);
    clearTimeout(state.actTimer);
    state.actTimer = setTimeout(() => { if (!box.matches(":hover")) box.classList.remove("is-on"); }, 6000);
    const rb = $("#kai-act-retry");
    if (rb) rb.addEventListener("click", () => replayOutbox(true));
  }

  function ensureActBox() {
    if ($("#kai-act")) return;
    const box = document.createElement("div");
    box.id = "kai-act";
    box.className = "kai-act";
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.addEventListener("mouseenter", () => clearTimeout(state.actTimer));
    document.body.appendChild(box);
  }

  function baseCall(kind, route, token, payload, ok, fail) {
    const runner = BASE.withSuccessHandler(ok).withFailureHandler(fail);
    const fn = kind === "ws" ? "gasWorkspaceDispatch" : "gasApiDispatch";
    if (typeof runner[fn] !== "function") {
      fail(new Error('Fungsi Apps Script "' + fn + '" tidak ditemukan di Code.gs. Unduh Code.gs dari menu Pembaruan.'));
      return;
    }
    runner[fn](route, token, payload || {});
  }

  function attempt(kind, route, token, payload, tryNo) {
    return new Promise((resolve, reject) => {
      let done = false;
      const to = setTimeout(() => {
        if (done) return;
        done = true;
        reject(Object.assign(new Error("Waktu tunggu 30 detik habis untuk " + route + ". Permintaan dibatalkan agar tidak menggantung."), { transient: true }));
      }, 30000);
      baseCall(
        kind, route, token, payload,
        (v) => { if (done) return; done = true; clearTimeout(to); resolve(v); },
        (e) => { if (done) return; done = true; clearTimeout(to); reject(e instanceof Error ? e : new Error(String((e && e.message) || e))); }
      );
    });
  }

  function cacheGet(route, token) {
    if (!READ_CACHEABLE.test(route)) return null;
    const c = read("kai-cache-v1", {});
    const k = route + "|" + token;
    const hit = c[k];
    if (!hit) return null;
    if (Date.now() - hit.at > 30000) { delete c[k]; write("kai-cache-v1", c); return null; }
    return hit.val;
  }
  function cacheSet(route, token, val) {
    if (!READ_CACHEABLE.test(route)) return;
    const c = read("kai-cache-v1", {});
    c[route + "|" + token] = { at: Date.now(), val };
    const keys = Object.keys(c);
    if (keys.length > 24) keys.slice(0, keys.length - 24).forEach((k) => delete c[k]);
    write("kai-cache-v1", c);
  }
  function cacheBust() {
    try { localStorage.removeItem("kai-cache-v1"); } catch (_) {}
  }

  function enqueueOutbox(kind, route, token, payload, err) {
    const id = "ob-" + uid();
    state.outbox.push({ id, kind, route, token, payload, at: now(), err: String(err && err.message ? err.message : err), tries: 0 });
    write("kai-outbox-v1", state.outbox);
    banner("Tindakan ditahan di antrean luring. Akan dikirim ulang otomatis saat koneksi pulih.", { label: "Kirim sekarang", fn: () => replayOutbox(true) });
  }

  async function pipeline(kind, route, token, payload, ok, fail) {
    quotaTick();
    const isWrite = WRITE_RE.test(route);
    const label = (kind === "ws" ? "Workspace · " : "") + String(route).replace(/\.[a-z]+$/, " · " + String(route).split(".").pop());

    if (!isWrite) {
      const hit = cacheGet(route, token);
      if (hit) { ok(hit); return; }
    }

    const run = async () => {
      logAct(label, "wait");
      try {
        const v = await attempt(kind, route, token, payload, 0);
        if (!isWrite) cacheSet(route, token, v);
        else cacheBust();
        logAct(label, "ok");
        ok(v);
      } catch (e1) {
        const transient = e1.transient || /timeout|network|jaringan|Failed to fetch|502|503|504/i.test(e1.message);
        if (transient && !(BUSINESS_ERR.test(e1.message))) {
          try {
            const v = await attempt(kind, route, token, payload, 1);
            if (!isWrite) cacheSet(route, token, v); else cacheBust();
            logAct(label, "ok");
            ok(v);
            return;
          } catch (e2) {
            e1 = e2;
          }
        }
        if (isWrite && !BUSINESS_ERR.test(e1.message)) {
          enqueueOutbox(kind, route, token, payload, e1);
          logAct(label, "queue");
          fail(new Error("Tidak terkirim (" + e1.message + "). Tindakan disimpan di antrean luring dan akan dikirim ulang otomatis."));
          return;
        }
        logAct(label, "fail");
        fail(e1);
      }
    };

    if (isWrite) {
      state.chain = state.chain.then(run, run);
    } else {
      if (state.active >= 4) { setTimeout(() => pipeline(kind, route, token, payload, ok, fail), 120); return; }
      state.active++;
      run().finally(() => { state.active--; });
    }
  }

  function installBridge() {
    if (!BASE) return;
    const make = (ok, fail) => ({
      withSuccessHandler(cb) { return make(cb, fail); },
      withFailureHandler(cb) { return make(ok, cb); },
      gasApiDispatch(r, t, p) { pipeline("api", r, t, p, ok || (() => {}), fail || (() => {})); },
      gasWorkspaceDispatch(op, t, p) { pipeline("ws", op, t, p, ok || (() => {}), fail || (() => {})); },
    });
    window.google.script.run = make(null, null);
  }

  async function replayOutbox(manual) {
    if (!navigator.onLine) { banner("Masih luring. Antrean (" + state.outbox.length + ") menunggu koneksi."); return; }
    const items = state.outbox.slice();
    if (!items.length) { if (manual) banner("Antrean luring kosong."); return; }
    let sent = 0;
    for (const it of items) {
      try {
        await attempt(it.kind, it.route, it.token, it.payload, 0);
        sent++;
        state.outbox = state.outbox.filter((x) => x.id !== it.id);
        write("kai-outbox-v1", state.outbox);
      } catch (e) {
        it.tries = (it.tries || 0) + 1;
        it.err = e.message;
        if (it.tries >= 5) {
          state.outbox = state.outbox.filter((x) => x.id !== it.id);
          write("kai-outbox-v1", state.outbox);
          logAct(it.route + " · gagal permanen", "fail");
        }
      }
      await new Promise((r) => setTimeout(r, 180));
    }
    logAct("Sinkronisasi antrean", sent ? "ok" : "queue");
    if (sent) banner(sent + " tindakan dari antrean berhasil dikirim.");
  }

  /* ============================================================
     2 · LOG AUDIT RANTAI HASH (L04 F-83..F-86, B-15, T-07, T-21)
     ============================================================ */
  const AUDIT_KEY = "kai-audit-chain-v1";
  function auditRows() { return read(AUDIT_KEY, []); }
  function auditAppend(action, module, objId, oldV, newV) {
    const rows = auditRows();
    const prev = rows.length ? rows[rows.length - 1].hash : "GENESIS";
    const t = now();
    const hash = sha256([t, "AKTOR", action, objId || "", prev].join("|"));
    rows.push({ i: rows.length + 1, t, u: "AKTOR", a: action, m: module, obj: objId || "", old: oldV || "", new: newV || "", prevHash: prev, hash });
    // T-21 retensi: buang entri > 730 hari
    const cut = new Date(Date.now() - 730 * 864e5).toISOString().slice(0, 10);
    const kept = rows.filter((r) => r.t.slice(0, 10) >= cut);
    write(AUDIT_KEY, kept);
    return hash;
  }
  function auditVerify() {
    const rows = auditRows();
    let prev = "GENESIS", broken = 0;
    rows.forEach((r) => {
      const h = sha256([r.t, r.u, r.a, r.obj, r.prevHash].join("|"));
      if (h !== r.hash || r.prevHash !== prev) broken++;
      prev = r.hash;
    });
    return { rows: rows.length, broken, ok: broken === 0, head: prev };
  }

  /* ============================================================
     3 · CADANGAN & UJI PEMULIHAN (B-01, B-02, T-12)
     ============================================================ */
  const SNAPSHOT_KEYS = ["kai-onefile-db-v1", "kai-onefile-sessions-v1", "kai-onefile-otps-v1"];
  function snapshot() {
    const o = { _meta: { app: "Kantor AI & Sistem Kerja", version: VER, at: now(), timezone: "Asia/Jakarta (WIB)" } };
    SNAPSHOT_KEYS.forEach((k) => { const v = localStorage.getItem(k); if (v != null) o[k] = v; });
    return o;
  }
  function download(name, text, mime) {
    const blob = new Blob([text], { type: mime || "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }
  function takeBackup(target) {
    const snap = JSON.stringify(snapshot());
    if (target === "download") {
      download("kai-cadangan-" + now().slice(0, 10) + ".json", snap);
      return { ok: true, bytes: snap.length, where: "unduhan" };
    }
    if (target === "browser") {
      const ok = write("kai-backup-last", { at: now(), json: snap });
      return { ok, bytes: snap.length, where: "browser (localStorage)" };
    }
    if (target === "drive" && IS_GAS) {
      return new Promise((res) => {
        window.google.script.run.withSuccessHandler((r) => res({ ok: true, where: "Google Drive", name: r && r.name, bytes: r && r.bytes })).withFailureHandler((e) => res({ ok: false, where: "Google Drive", err: e.message }))( "gasApiDispatch", "backup.toDrive", (session() || {}).token || "", {});
      });
    }
    return Promise.resolve({ ok: false, where: "Google Drive", err: "Hanya tersedia saat berjalan di Apps Script." });
  }
  function restoreSelfTest() {
    const last = read("kai-backup-last", null);
    if (!last) return { ok: false, msg: "Belum ada salinan di browser. Buat cadangan ke browser dulu." };
    let snap;
    try { snap = JSON.parse(last.json); } catch (e) { return { ok: false, msg: "Salinan rusak / bukan JSON." }; }
    const sandbox = "__kai_restore_test__";
    const report = { at: now(), tables: [], ok: true };
    SNAPSHOT_KEYS.forEach((k) => {
      if (snap[k] == null) return;
      const live = JSON.parse(localStorage.getItem(k) || "null");
      const backup = JSON.parse(snap[k]);
      const counts = (o) => {
        if (!o) return {};
        const out = {};
        ["users", "tasks", "intake", "cash", "attendance", "documents", "audit"].forEach((f) => { if (Array.isArray(o[f])) out[f] = o[f].length; });
        return out;
      };
      const a = counts(live), b = counts(backup);
      Object.keys(a).forEach((f) => {
        report.tables.push({ table: f, live: a[f], backup: b[f], diff: a[f] - (b[f] || 0) });
        if (a[f] !== (b[f] || 0)) report.ok = false;
      });
      // uji tulis+baca ulang ke ruang terpisah, lalu bersihkan
      try { localStorage.setItem(sandbox, snap[k]); const back = localStorage.getItem(sandbox); report.written = back === snap[k]; } catch (e) { report.written = false; report.ok = false; }
      try { localStorage.removeItem(sandbox); } catch (e) {}
    });
    report.chain = auditVerify();
    report.ok = report.ok && report.chain.ok;
    auditAppend("Uji pemulihan cadangan · " + (report.ok ? "LULUS" : "SELISIH"), "Cadangan");
    return report;
  }

  /* ============================================================
     4 · DUAL CONTROL (B-05, B-06, B-07, X-01..X-12)
     ============================================================ */
  const APPROVALS_KEY = "kai-approvals-v1";
  function session() {
    try {
      const s = JSON.parse(sessionStorage.getItem("hi_session_v1") || "null");
      if (!s || !s.token || !s.user) return null;
      if (s.exp && Date.now() > s.exp) return null;
      return s;
    } catch (_) { return null; }
  }
  function currentUser() {
    const s = session();
    return (s && s.user) || null;
  }
  function findCash(id) {
    try {
      const db = JSON.parse(localStorage.getItem("kai-onefile-db-v1") || "{}");
      return (db.cash || []).find((x) => x.ID === id) || null;
    } catch (_) { return null; }
  }
  function dualControlGate(payload) {
    if (!payload || payload.status !== "Disetujui") return null;
    const row = findCash(payload.id);
    if (!row) return null;
    const nominal = Number(row.Nominal || 0);
    if (nominal < 5000000) return null; // ambang Rp5 juta (B-05)
    const me = currentUser();
    const myId = me && (me.ID || me.id);
    const all = read(APPROVALS_KEY, {});
    const list = (all[payload.id] || []).filter((a) => a.uid !== myId);
    if (me) list.push({ uid: myId, nama: me.Nama || me.name || "Saya", at: now() });
    all[payload.id] = list;
    write(APPROVALS_KEY, all);
    auditAppend("Persetujuan kas " + payload.id + " (" + list.length + "/2)", "Keuangan", payload.id, "", rp(nominal));
    if (list.length < 2) {
      return new Error("Butuh 2 persetujuan berbeda untuk kas >= Rp5 juta (dual control). Sudah tercatat " + list.length + "/2. Persetujuan kedua dari akun lain akan meloloskan transaksi ini.");
    }
    return null;
  }

  /* ============================================================
     5 · REGISTER KEPATUHAN (L04, L05, L07, L12, L13, L14, L19, L20)
     ============================================================ */
  const REG_KEY = "kai-register-v1";
  function regStatus(id) { return read(REG_KEY, {})[id] || "Belum"; }
  function regSet(id, val) { const o = read(REG_KEY, {}); o[id] = val; write(REG_KEY, o); }

  const ENTITAS = ["PT HOLDING (induk)", "PT Properti", "PT Aset Produktif & Agri", "PT Digital & IP", "PT Koleksi & Kustodian", "PT Shared Services / Kantor AI", "SPV per Transaksi (opsional)"];
  const KEWAJIBAN = ["Akta pendirian + SK Kemenkumham", "NIB via OSS + KBLI tercantum", "NPWP badan + PKP (bila omzet >4,8 M)", "Rekening bank atas nama PT + mandat", "Pembukuan & laporan keuangan tahunan", "SPT tahunan PPh badan", "SPT masa (PPN/PPh 21/23/22/final)", "BPJS Kesehatan & Ketenagakerjaan", "Asuransi aset / D&O / siber", "Izin sektoral (tanah/HGU, Kementan, Pemda, DJKI)"];
  const KBLI = {"PT HOLDING (induk)": "64200", "PT Properti": "68110/68111", "PT Aset Produktif & Agri": "68200/01610/49210", "PT Digital & IP": "62010/63122/77400", "PT Koleksi & Kustodian": "47799/91020", "PT Shared Services / Kantor AI": "62019/63112", "SPV per Transaksi (opsional)": "64200"}; // L07 · lengkap 7 entitas

  const K12 = [
    ["Harian", "Rekonsiliasi kas & saldo bank", "S3", "uang hilang tanpa jejak"],
    ["Harian", "Cek settlement jatuh tempo", "S4", "gagal serah terima"],
    ["Harian", "Absensi & izin masuk", "S6", "sengketa kehadiran"],
    ["Harian", "Persetujuan antrean (kas/intake)", "S1", "keputusan menumpuk"],
    ["Harian", "Insiden pasar/kripto (bila ada posisi)", "D5", "kerugian tak terdeteksi"],
    ["Mingguan", "Pipeline intake & status DD", "S1", "usulan basi"],
    ["Mingguan", "Kas kecil & uang muka", "S3", "selisih kas"],
    ["Mingguan", "Jadwal inspeksi aset fisik", "D7-D12", "aset rusak/hilang"],
    ["Mingguan", "Tiket IT & akses baru", "S10", "akses liar"],
    ["Mingguan", "Proyeksi kas 13 minggu", "S3", "krisis likuiditas"],
    ["Bulanan", "Tutup buku & laporan keuangan per PT", "S3", "angka tidak sahih"],
    ["Bulanan", "Rekonsiliasi bank & kustodian", "S3, S4", "posisi palsu"],
    ["Bulanan", "Rekap absensi & cuti → payroll", "S6", "salah gaji"],
    ["Bulanan", "PPh 21 setor & lapor", "S3", "sanksi"],
    ["Bulanan", "PPh 23/PPN/PPh final", "S3", "sanksi"],
    ["Bulanan", "BPJS setor", "S6", "denda & layanan tertahan"],
    ["Bulanan", "Tagihan vendor & termin", "S3", "denda keterlambatan"],
    ["Bulanan", "Laporan ke Direksi", "S1", "pengawasan buta"],
    ["Bulanan", "Update harga & nilai portofolio", "S4", "nilai salah"],
    ["Bulanan", "Review akses & akun nonaktif", "S10", "akses liar"],
    ["Bulanan", "Arsip LOG & backup", "S10", "kehilangan data"],
    ["Triwulanan", "Laporan ke Komisaris", "S8", "tata kelola lemah"],
    ["Triwulanan", "Review risiko & register", "S2", "risiko tak terkelola"],
    ["Triwulanan", "Review kontrak & vendor", "S5", "perpanjangan terlewati"],
    ["Triwulanan", "Review KPI 12 desk", "S1", "tidak ada akuntabilitas"],
    ["Triwulanan", "Uji pemulihan backup", "S10", "backup tak teruji"],
    ["Semesteran", "Appraisal properti & aset fisik", "D7, D8", "nilai basi"],
    ["Semesteran", "Review polis asuransi", "S12", "polis kedaluwarsa"],
    ["Semesteran", "Audit internal 1 tema", "S9", "temuan menumpuk"],
    ["Semesteran", "Review pajak & transfer pricing", "S3", "sengketa pajak"],
    ["Tahunan", "RUPS & pengesahan laporan", "S1", "legalitas"],
    ["Tahunan", "SPT badan 7 entitas", "S3", "sanksi"],
    ["Tahunan", "Audit KAP & laporan auditor", "S9", "laporan tak terbit"],
    ["Tahunan", "Perpanjangan izin & NIB", "S5", "usaha terhenti"],
    ["Tahunan", "Perpanjangan asuransi & sertifikat", "S12", "keralahan"],
    ["Tahunan", "Review kebijakan (D-xx) & LoA", "S5", "kebijakan basi"],
    ["Tahunan", "Penilaian kinerja & skema gaji", "S6", "turnover"],
    ["Tahunan", "Top-up DCPT (120× biaya tetap)", "S3", "cadangan tidak cukup"],
    ["Tahunan", "Review strategi 160 aset & alokasi", "S1", "alokasi menyimpang"],
    ["Tahunan", "Rencana TI & anggaran tahun berikut", "S10", "biaya tak terkendali"]
  ];

  const PRINSIP = ["Pemisahan tugas (maker != checker)", "Limit otorisasi berjenjang", "Empat mata (4-eyes)", "Rekonsiliasi independen", "Pemisahan per badan hukum", "Delegasi/proxy wewenang", "Penutupan periode", "Immutabilitas catatan", "Jejak audit lengkap", "Review akses & offboarding"];
  const UJI = ["Uji normal (jalur benar)", "Uji batas (nilai ambang)", "Uji penyalahgunaan (orang sama / di luar wewenang)", "Uji bukti (dokumen & jejak)"];

  const PDP = [
    ["Nama karyawan", "HR", "kontrak kerja", "selama kerja +5 thn"],
    ["Email kantor", "operasional", "kontrak kerja", "selama kerja"],
    ["Email pribadi pemilik", "kontak", "persetujuan", "selama kerja"],
    ["Jabatan & unit", "HR", "kontrak kerja", "selama kerja"],
    ["PIN akses offline", "autentikasi", "kontrak kerja", "diganti tiap 90 hari"],
    ["Foto wajah absensi", "verifikasi kehadiran", "persetujuan eksplisit", "90 hari"],
    ["Koordinat GPS absensi", "verifikasi kehadiran", "persetujuan eksplisit", "1 thn"],
    ["Waktu & pola kehadiran", "HR", "kontrak kerja", "5 thn"],
    ["Catatan cuti/izin", "HR", "kontrak kerja", "5 thn"],
    ["Nomor rekening gaji", "payroll", "kewajiban pajak/BPJS", "10 thn"],
    ["NPWP karyawan", "pajak", "kewajiban hukum", "10 thn"],
    ["Data BPJS", "kewajiban sosial", "kewajiban hukum", "10 thn"],
    ["Kontrak kerja & adendum", "HR", "kewajiban hukum", "10 thn setelah berakhir"],
    ["Data penilaian kinerja", "HR", "kepentingan sah", "5 thn"],
    ["Data vendor perorangan (12 freelancer)", "pengadaan", "kontrak", "10 thn"],
    ["Kontak tamu & buku tamu", "keamanan", "kepentingan sah", "1 thn"],
    ["Log akses & perangkat", "keamanan", "kepentingan sah", "2 thn"],
    ["Rekaman rapat (bila ada)", "tata kelola", "persetujuan peserta", "2 thn"],
    ["Data pelamar (bila rekrut)", "HR", "persetujuan", "6 bln"],
    ["Data KAP/auditor eksternal", "kepatuhan", "kewajiban hukum", "7 thn"]
  ];

  const BIAYA = [
    ["Payroll 26 FTE", "tidak ada di sistem", "input skenario 3 tingkat", "angka tunggal di semua halaman"],
    ["BPJS + THR", "tidak ada", "hitung +11% & 1 bulan gaji", "masuk struktur biaya"],
    ["Sewa 3 lantai", "tidak ada", "masukkan angka sewa nyata", "biaya per m2 tercatat"],
    ["Utilitas & internet", "tidak ada", "rata-rata 3 bulan tagihan", "anggaran vs realisasi"],
    ["Alat inti (111 vendor)", "Rp5-15 jt/bln", "plafon per kategori", "realisasi <= plafon"],
    ["Jasa profesional", "tidak ada", "kontrak tahunan + plafon", "realisasi dilaporkan"],
    ["Asuransi", "tidak ada", "0,3-1% nilai aset + polis korporat", "polis aktif"],
    ["Freelancer 12 orang", "tarif ada, total tidak", "PO + termin", "total <anggaran"],
    ["Cadangan DCPT", "Rp1.462.200.000 (rumus)", "top-up tahunan otomatis", "saldo >=110%"],
    ["Biaya per transaksi", "tidak diukur", "ukur jam kerja per proses", "biaya proses turun 20%"],
    ["Anggaran TI tahunan", "tidak ada", "plafon + review triwulan", "realisasi <= anggaran"],
    ["Biaya per sistem", "tidak ada", "alokasi biaya per sistem", "keputusan beli vs bangun berbasis angka"]
  ];

  const ADOPSI = [
    ["Pelatihan dasar 26 FTE", "belum ada", "3 sesi + panduan per modul", ">=90% bisa 1 transaksi sendiri"],
    ["Kebijakan 'catat di sistem'", "belum ada", "aturan tertulis + konsekuensi ringan", "tidak ada catatan di WhatsApp"],
    ["Pendamping per modul", "belum ada", "1 owner per modul", "respons <1 hari"],
    ["Onboarding 3 hari", "belum ada", "checklist 12 butir", "karyawan baru mandiri <3 hari"],
    ["Offboarding 1 jam", "belum ada", "checklist cabut akses", "akun mati <1 jam"],
    ["Pemisahan peran kunci", "1 orang merangkap", "6 peran kunci + pengganti", "tidak ada peran tanpa pengganti"],
    ["Budaya bukti", "foto/WhatsApp", "wajib lampiran di sistem", "100% transaksi >Rp1 jt berlampiran"],
    ["Rapat mingguan 30 menit", "tidak terjadwal", "agenda tetap + risalah", "risalah tiap minggu"],
    ["Review kinerja 6 bulan", "tidak ada", "form + kalibrasi", "semua FTE dinilai"],
    ["Dokumentasi pengetahuan", "di kepala orang", "wiki 1 halaman per proses", "pengganti <1 minggu"],
    ["Saluran keluhan", "tidak ada", "kanal + kerahasiaan", "1 kasus ditangani"],
    ["Umpan balik pengguna sistem", "tidak ada", "form + rilis bulanan", ">=5 masukan/bulan ditindaklanjuti"]
  ];

  const FIELD_BARU = [
    ["F-12", "USERS", "atasanId", "ID akun, tanpa siklus", "S6"],
    ["F-13", "USERS", "entitas", "salah satu 7 PT/SPV", "S3"],
    ["F-20", "TASKS", "tenggat", "tanggal, tidak boleh lampau", "pembuat"],
    ["F-21", "TASKS", "buktiSelesai", "tautan, wajib bila Selesai", "pelaksana"],
    ["F-22", "TASKS", "prioritas", "Rendah/Sedang/Tinggi/Kritis", "pembuat"],
    ["F-32", "INTAKE", "tenggat", "+5 hari kerja", "S1"],
    ["F-33", "INTAKE", "lampiran", "≥1 memo/DD sebelum Disetujui", "pengaju"],
    ["F-34", "INTAKE", "dasarPersetujuan", "risalah IC / memo bertanda", "penyetuju"],
    ["F-35", "INTAKE", "entitas", "7 PT/SPV", "S3"],
    ["F-45", "KAS", "entitas", "7 PT/SPV", "S3"],
    ["F-46", "KAS", "coa", "30–40 akun baku", "S3"],
    ["F-47", "KAS", "lampiran", "wajib bila >Rp1 jt", "pembuat"],
    ["F-48", "KAS", "dibuatOleh", "≠ disetujuiOleh", "sistem"],
    ["F-49", "KAS", "disetujuiOleh", "akun berbeda + waktu", "sistem"],
    ["F-50", "KAS", "periode", "YYYY-MM; terkunci setelah tutup buku", "S3"],
    ["F-64", "ABSEN", "buktiFoto", "Drive, bukan spreadsheet (PII)", "sistem"],
    ["F-65", "ABSEN", "radiusKantor", "meter; acuan lokasi kantor", "S12"],
    ["F-66", "ABSEN", "deviceId", "sidik perangkat anti-titip absen", "sistem"],
    ["F-73", "DOKUMEN", "versi", "naik tiap perubahan", "sistem"],
    ["F-74", "DOKUMEN", "statusDok", "Draf/Review/Final/Arsip/Dimusnahkan", "S5"],
    ["F-75", "DOKUMEN", "retensiSampai", "dari tabel retensi (5/10 thn)", "S2"],
    ["F-76", "DOKUMEN", "tte", "e-Meterai/TTE + hash dokumen", "S5"],
    ["F-77", "DOKUMEN", "entitas", "7 PT/SPV", "S3"],
    ["F-78", "DOKUMEN", "tautanTransaksi", "wajib untuk memo/risalah persetujuan", "S1"],
    ["F-83", "AUDIT", "objekId", "tautan ke baris yang diubah", "sistem"],
    ["F-84", "AUDIT", "nilaiLama/Baru", "JSON ringkas", "sistem"],
    ["F-85", "AUDIT", "hash", "SHA-256(waktu+aktor+aksi+prevHash)", "sistem"],
    ["F-86", "AUDIT", "prevHash", "rantai tak terputus", "sistem"]
  ];

  const HAK = [ // L05 · target izin — kolom: rute, Pemilik, Manajemen, Staf, Freelancer, Auditor, Tamu
    ["dashboard.get", "✓", "✓", "✓", "terbatas", "✓", "—"],
    ["intake.list", "✓", "✓", "unit sendiri", "—", "baca", "—"],
    ["intake.create", "✓", "✓", "✓", "—", "—", "—"],
    ["intake.status (keputusan akhir)", "✓ (bukan usulan sendiri)", "✓ (bukan usulan sendiri)", "—", "—", "—", "—"],
    ["keuangan.list", "✓", "✓", "✓", "—", "baca", "—"],
    ["keuangan.create", "✓", "✓", "✓", "—", "—", "—"],
    ["keuangan.update (setujui)", "✓ (bukan pembuat)", "✓ (bukan pembuat)", "—", "—", "—", "—"],
    ["tugas.list", "✓", "✓", "✓", "milik sendiri", "baca", "—"],
    ["tugas.update", "✓", "✓", "milik/unit sendiri", "milik sendiri", "—", "—"],
    ["absen.list", "✓", "✓", "milik sendiri", "—", "baca", "—"],
    ["absen.submit", "✓", "✓", "✓", "—", "—", "—"],
    ["absen.verify", "✓ (bukan absen sendiri)", "✓ (bukan absen sendiri)", "—", "—", "—", "—"],
    ["dokumen.list", "✓", "✓", "✓", "milik sendiri", "baca", "—"],
    ["dokumen.create", "✓", "✓", "✓", "—", "—", "—"],
    ["audit.list / audit.verify", "✓", "✓", "—", "—", "baca", "—"],
    ["pengguna.list", "✓", "—", "—", "—", "baca", "—"],
    ["pengguna.create / email / status / offlinePin", "✓", "—", "—", "—", "—", "—"],
    ["ai.assist", "✓", "✓", "✓", "—", "—", "—"]
  ];

  function statusSelect(id) {
    const v = regStatus(id);
    const opts = ["Belum", "Sebagian", "Selesai", "Tidak berlaku"];
    return '<select class="kai-reg-sel" data-reg="' + esc(id) + '" aria-label="Status ' + esc(id) + '">' +
      opts.map((o) => '<option value="' + o + '"' + (o === v ? " selected" : "") + ">" + o + "</option>").join("") + "</select>";
  }

  function table(headers, rows) {
    return '<div class="kai-reg-wrap"><table class="kai-reg-table"><thead><tr>' +
      headers.map((h) => '<th scope="col">' + esc(h) + "</th>").join("") +
      "</tr></thead><tbody>" + rows.join("") + "</tbody></table></div>";
  }

  function buildRegister() {
    const tabs = [
      { id: "l07", label: "Kewajiban Badan Hukum", note: "L07 · 7 entitas × 10 kewajiban = 70 butir", body: l07Body },
      { id: "l12", label: "Kalender Kewajiban", note: "L12 · 40 kewajiban harian → tahunan", body: l12Body },
      { id: "l13", label: "Kontrol Internal", note: "L13 · 10 prinsip × 4 uji = 40 butir", body: l13Body },
      { id: "l14", label: "Data Pribadi", note: "L14 · 20 jenis data × atribut", body: l14Body },
      { id: "l05", label: "Matriks Akses", note: "L05 · 6 peran × modul", body: l05Body },
      { id: "mit", label: "Mitigasi Atomik (848)", note: "20 lapis · 848 butir · status awal menurut build 2026-11-24 (dapat Anda ubah)", body: function () { return window.__kaiMitigasiBody ? window.__kaiMitigasiBody() : '<p class="kai-reg-note">Data mitigasi tidak tersedia.</p>'; } },
      { id: "l04", label: "Field Baru", note: "L04 · 28 field baru", body: l04Body },
      { id: "l19", label: "Biaya", note: "L19 · 12 komponen", body: l19Body },
      { id: "l20", label: "Orang & Adopsi", note: "L20 · 12 butir", body: l20Body }
    ];
    return tabs;
  }

  function l07Body() {
    const rows = [];
    let n = 0;
    ENTITAS.forEach((ent) => {
      KEWAJIBAN.forEach((kw) => {
        n++;
        const id = "E-" + String(n).padStart(2, "0");
        rows.push("<tr><td>" + esc(id) + "</td><td>" + esc(ent) + "</td><td>" + esc(KBLI[ent] || "—") + "</td><td>" + esc(kw) + "</td><td>" + statusSelect(id) + "</td></tr>");
      });
    });
    return table(["ID", "Entitas", "KBLI", "Kewajiban", "Status"], rows);
  }
  function l12Body() {
    const rows = K12.map((r, i) => {
      const id = "K-" + String(i + 1).padStart(2, "0");
      return "<tr><td>" + esc(id) + "</td><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td><td>" + esc(r[3]) + "</td><td>" + statusSelect(id) + "</td></tr>";
    });
    return table(["ID", "Frekuensi", "Kewajiban", "Pemilik", "Risiko bila lewat", "Status"], rows);
  }
  function l13Body() {
    const rows = [];
    let n = 0;
    PRINSIP.forEach((p) => {
      UJI.forEach((u) => {
        n++;
        const id = "X-" + String(n).padStart(2, "0");
        rows.push("<tr><td>" + esc(id) + "</td><td>" + esc(p) + "</td><td>" + esc(u) + "</td><td>" + statusSelect(id) + "</td></tr>");
      });
    });
    return table(["ID", "Prinsip", "Uji", "Status"], rows);
  }
  function l14Body() {
    const rows = PDP.map((r, i) => {
      const id = "PDP-" + String(i + 1).padStart(2, "0");
      return "<tr><td>" + esc(id) + "</td><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td><td>" + esc(r[3]) + "</td><td>" + statusSelect(id) + "</td></tr>";
    });
    return table(["ID", "Data pribadi", "Tujuan", "Dasar pemrosesan", "Retensi", "Status"], rows);
  }
  function l05Body() {
    const head = ["Rute / modul", "Pemilik", "Manajemen", "Staf", "Freelancer", "Auditor", "Tamu"];
    const rows = HAK.map((r) => "<tr>" + r.map((c, i) => "<td>" + (i === 0 ? "<code>" + esc(c) + "</code>" : c === "—" ? '<span class="kai-reg-no">—</span>' : '<span class="kai-reg-yes">' + esc(c) + "</span>") + "</td>").join("") + "</tr>");
    return table(head, rows) + '<p class="kai-reg-note">Aturan ini dijalankan di tiga tempat dengan kebijakan yang sama: tampilan (menu & gerbang halaman), lapisan data lokal mode mandiri, dan server <code>Code.gs</code> (<code>allow_()</code> + pemisahan tugas + kepemilikan data). Tamu tidak mendapat akses modul apa pun.</p>';
  }
  function l04Body() {
    const rows = FIELD_BARU.map((r) => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td><code>" + esc(r[2]) + "</code></td><td>" + esc(r[3]) + "</td><td>" + esc(r[4]) + "</td><td>" + statusSelect(r[0]) + "</td></tr>");
    return table(["ID", "Entitas", "Field", "Aturan validasi", "Pemilik", "Status"], rows) + '<p class="kai-reg-note">Field F-83…F-86 sudah dijalankan: log audit memakai <code>prevHash</code> + <code>hash</code> SHA-256.</p>';
  }
  function l19Body() {
    const rows = BIAYA.map((r, i) => {
      const id = "Y-" + String(i + 1).padStart(2, "0");
      return "<tr><td>" + esc(id) + "</td><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td><td>" + esc(r[3]) + "</td><td>" + statusSelect(id) + "</td></tr>";
    });
    return table(["ID", "Komponen", "Kondisi", "Mitigasi", "Bukti lulus", "Status"], rows);
  }
  function l20Body() {
    const rows = ADOPSI.map((r, i) => {
      const id = "O-" + String(i + 1).padStart(2, "0");
      return "<tr><td>" + esc(id) + "</td><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td><td>" + esc(r[3]) + "</td><td>" + statusSelect(id) + "</td></tr>";
    });
    return table(["ID", "Butir", "Kondisi", "Mitigasi", "Bukti lulus", "Status"], rows);
  }

  function openRegister() {
    const tabs = buildRegister();
    const id = "kai-reg-modal";
    if ($("#" + id)) { openExistingModal($("#" + id)); return; }
    const wrap = document.createElement("div");
    wrap.className = "kai-modal";
    wrap.id = id;
    wrap.innerHTML =
      '<div class="kai-modal-card kai-reg-card"><div class="kai-modal-head"><h2>Register Kepatuhan & Data</h2><button type="button" class="kai-modal-close" aria-label="Tutup">✕</button></div>' +
      '<div class="kai-reg-tabs" role="tablist" aria-label="Register">' +
      tabs.map((t, i) => '<button type="button" role="tab" class="kai-reg-tab" data-tab="' + t.id + '" aria-selected="' + (i === 0) + '" aria-controls="kai-reg-' + t.id + '">' + esc(t.label) + "</button>").join("") +
      "</div>" +
      '<div class="kai-modal-body"><p class="kai-reg-note" id="kai-reg-note"></p><div id="kai-reg-pane"></div></div></div>';
    document.body.appendChild(wrap);
    wrap.classList.add("is-open");
    wrap.addEventListener("click", (e) => {
      if (e.target === wrap) wrap.classList.remove("is-open");
    });
    wrap.querySelector(".kai-modal-close").addEventListener("click", () => wrap.classList.remove("is-open"));
    const render = (tid) => {
      const t = tabs.find((x) => x.id === tid) || tabs[0];
      $$(".kai-reg-tab", wrap).forEach((b) => b.setAttribute("aria-selected", String(b.getAttribute("data-tab") === t.id)));
      $("#kai-reg-note", wrap).textContent = t.note + " · status tersimpan di browser ini";
      $("#kai-reg-pane", wrap).innerHTML = t.body();
      $$(".kai-reg-sel", wrap).forEach((sel) => sel.addEventListener("change", (ev) => regSet(ev.target.getAttribute("data-reg"), ev.target.value)));
    };
    $$(".kai-reg-tab", wrap).forEach((b) => b.addEventListener("click", () => render(b.getAttribute("data-tab"))));
    render("l07");
  }
  function openExistingModal(el) { el.classList.add("is-open"); }

  /* ============================================================
     6 · CADANGAN (dialog)
     ============================================================ */
  async function openBackup() {
    const id = "kai-backup-modal";
    if ($("#" + id)) { openExistingModal($("#" + id)); return; }
    const wrap = document.createElement("div");
    wrap.className = "kai-modal";
    wrap.id = id;
    wrap.innerHTML =
      '<div class="kai-modal-card"><div class="kai-modal-head"><h2>Cadangan & Pemulihan</h2><button type="button" class="kai-modal-close" aria-label="Tutup">✕</button></div>' +
      '<div class="kai-modal-body"><p class="kai-reg-note">Tiga salinan: unduhan berkas, salinan di browser, dan Google Drive (bila berjalan di Apps Script).</p>' +
      '<div class="kai-backup-grid">' +
      '<button type="button" class="kai-backup-btn" data-bk="download"><b>⬇ Unduh salinan</b><span>JSON berisi seluruh modul</span></button>' +
      '<button type="button" class="kai-backup-btn" data-bk="browser"><b>◷ Salin di browser</b><span>Untuk uji pemulihan</span></button>' +
      '<button type="button" class="kai-backup-btn" data-bk="drive"><b>☁ Google Drive</b><span>' + (IS_GAS ? "Tersedia" : "Hanya di Apps Script") + "</span></button>" +
      "</div>" +
      '<h3>Uji pemulihan (B-02)</h3><p class="kai-reg-note">Membandingkan salinan terakhir dengan data hidup, menulis ke ruang terpisah lalu membaca ulang. Data hidup tidak diubah.</p>' +
      '<button type="button" class="kai-backup-btn" data-bk="test"><b>✓ Jalankan uji pemulihan</b><span>Lihat selisih per modul</span></button>' +
      '<div id="kai-backup-out" class="kai-backup-out" aria-live="polite"></div>' +
      "</div></div>";
    document.body.appendChild(wrap);
    wrap.classList.add("is-open");
    wrap.addEventListener("click", (e) => { if (e.target === wrap) wrap.classList.remove("is-open"); });
    wrap.querySelector(".kai-modal-close").addEventListener("click", () => wrap.classList.remove("is-open"));
    wrap.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-bk]");
      if (!b) return;
      const a = b.getAttribute("data-bk");
      const out = $("#kai-backup-out", wrap);
      if (a === "test") {
        const r = restoreSelfTest();
        out.innerHTML = r.msg ? '<p class="kai-reg-note">' + esc(r.msg) + "</p>" :
          '<p class="kai-backup-' + (r.ok ? "ok" : "bad") + '">' + (r.ok ? "LULUS" : "ADA SELISIH") + " · " + r.tables.length + " modul diperiksa</p>" +
          (r.tables || []).map((t) => "<p class='kai-backup-row'>" + esc(t.table) + ": hidup " + t.live + " · cadangan " + t.backup + " · selisih " + t.diff + "</p>").join("") +
          '<p class="kai-reg-note">Rantai audit: ' + r.chain.rows + " baris · putus " + r.chain.broken + "</p>";
        return;
      }
      const res = await takeBackup(a);
      out.innerHTML = '<p class="kai-backup-' + (res.ok ? "ok" : "bad") + '">' + (res.ok ? "Tersimpan" : "Gagal") + " · " + esc(res.where) + (res.bytes ? " · " + (res.bytes / 1024).toFixed(0) + " KB" : "") + (res.err ? " · " + esc(res.err) : "") + "</p>";
    });
  }

  /* ============================================================
     7 · CODE.GS (backend Apps Script di dalam HTML)
     ============================================================ */
  function openCodegs() {
    const id = "kai-codegs-modal";
    if ($("#" + id)) { openExistingModal($("#" + id)); return; }
    const src = ($("#kai-codegs") && $("#kai-codegs").textContent) || "";
    const json = ($("#kai-appsscript-json") && $("#kai-appsscript-json").textContent) || "{}";
    const wrap = document.createElement("div");
    wrap.className = "kai-modal";
    wrap.id = id;
    wrap.innerHTML =
      '<div class="kai-modal-card"><div class="kai-modal-head"><h2>Backend Apps Script (Code.gs)</h2><button type="button" class="kai-modal-close" aria-label="Tutup">✕</button></div>' +
      '<div class="kai-modal-body"><p class="kai-reg-note">Berkas ini sudah siap ditempel ke proyek Apps Script. HTML ini menjadi <code>Index.html</code>; jembatan <code>gasApiDispatch</code> sudah dipakai aplikasi sejak awal.</p>' +
      '<ol class="kai-steps"><li>Buat proyek baru di script.google.com.</li><li>Tempel isi Code.gs (unduh atau salin di bawah).</li><li>Tempel isi appsscript.json ke file settings proyek.</li><li>Tempel berkas HTML ini sebagai Index.html.</li><li>Deploy → New deployment → Web app (Execute as: Me).</li><li>Jalankan sekali <code>installTriggers()</code> untuk backup harian otomatis.</li></ol>' +
      '<div class="kai-codegs-actions">' +
      '<button type="button" class="kai-backup-btn" data-cg="code"><b>⬇ Unduh Code.gs</b><span>' + (src.length / 1024).toFixed(0) + " KB</span></button>" +
      '<button type="button" class="kai-backup-btn" data-cg="copy"><b>⧉ Salin Code.gs</b><span>ke clipboard</span></button>' +
      '<button type="button" class="kai-backup-btn" data-cg="json"><b>⬇ appsscript.json</b><span>' + (json.length / 1024).toFixed(1) + " KB</span></button>" +
      "</div>" +
      '<p class="kai-reg-note">Rute yang tersedia di Code.gs: ' + (src.match(/case '[a-z]+\.[a-zA-Z]+'/g) || []).length + " · termasuk <code>audit.verify</code>, <code>backup.toDrive</code>, dan dual control kas ≥ Rp5 juta.</p>" +
      "</div></div>";
    document.body.appendChild(wrap);
    wrap.classList.add("is-open");
    wrap.addEventListener("click", (e) => { if (e.target === wrap) wrap.classList.remove("is-open"); });
    wrap.querySelector(".kai-modal-close").addEventListener("click", () => wrap.classList.remove("is-open"));
    wrap.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-cg]");
      if (!b) return;
      const a = b.getAttribute("data-cg");
      if (a === "code") download("Code.gs", src, "text/plain");
      if (a === "json") download("appsscript.json", json, "application/json");
      if (a === "copy") {
        try { await navigator.clipboard.writeText(src); banner("Code.gs tersalin ke clipboard."); }
        catch (_) { download("Code.gs", src, "text/plain"); }
      }
    });
  }

  /* ============================================================
     8 · UI: tombol toolbar, mode badge, status aksi
     ============================================================ */
  function ensureToolbarButtons() {
    const bar = $(".kai-toolbar");
    if (!bar || $("#kai-btn-reg")) return;
    const anchor = $("#kai-save-status");
    const mk = (id, icon, label, title, fn) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "kai-tool-btn";
      b.id = id;
      b.title = title;
      b.innerHTML = '<span aria-hidden="true">' + icon + "</span> " + label;
      b.addEventListener("click", fn);
      bar.insertBefore(b, anchor);
    };
    mk("kai-btn-backup", "◴", "Cadangan", "Cadangan, uji pemulihan, dan 3 salinan", openBackup);
    mk("kai-btn-reg", "▤", "Register", "Register kepatuhan: badan hukum, kalender, kontrol internal, PDP, biaya, adopsi", openRegister);
    mk("kai-btn-codegs", "⚙", "Code.gs", "Backend Apps Script: unduh atau salin Code.gs", openCodegs);
  }

  function ensureModeBadge() {
    if ($("#kai-mode-badge")) return;
    const target = $("header") || $("body");
    const b = document.createElement("div");
    b.id = "kai-mode-badge";
    b.className = "kai-mode-badge" + (IS_GAS ? " is-gas" : "");
    b.innerHTML = IS_GAS
      ? '<span class="kai-mode-dot"></span> MODE APPS SCRIPT · data di server + Drive'
      : '<span class="kai-mode-dot"></span> MODE DEMO LOKAL · data di browser ini';
    target.appendChild(b);
  }

  /* ============================================================
     9 · BOOT
     ============================================================ */
  function boot() {
    installBridge();
    ensureActBox();
    (function retryToolbar(n) { ensureToolbarButtons(); if (!$("#kai-btn-reg") && n < 120) setTimeout(() => retryToolbar(n + 1), 250); })(0);
    ensureModeBadge();
    logAct("Sistem siap · mode " + (IS_GAS ? "Apps Script" : "demo lokal"), "ok");

    window.addEventListener("online", () => { banner("Kembali daring. Mengirim antrean…"); replayOutbox(false); });
    window.addEventListener("offline", () => {
      banner("Anda luring. Tindakan tetap bisa dicatat dan akan masuk antrean.", {
        label: "Lihat antrean",
        fn: () => logAct("Antrean luring: " + state.outbox.length + " tindakan", "queue"),
      });
    });

    if (state.outbox.length) setTimeout(() => replayOutbox(false), 2500);
    if (navigator.onLine === false) setTimeout(() => banner("Anda luring. Antrean berisi " + state.outbox.length + " tindakan."), 1200);

    // hook persetujuan (dual control) — dijalankan sebelum permintaan dikirim
    const orig = window.google && window.google.script && window.google.script.run;
    if (orig) {
      const mk = (ok, fail) => ({
        withSuccessHandler(cb) { return mk(cb, fail); },
        withFailureHandler(cb) { return mk(ok, cb); },
        gasApiDispatch(r, t, p) {
          if (r === "keuangan.update" && p && p.status === "Disetujui") {
            const err = dualControlGate(p);
            if (err) { logAct("Persetujuan kas · ditahan", "queue"); fail(err); return; }
          }
          pipeline("api", r, t, p, ok || (() => {}), fail || (() => {}));
        },
        gasWorkspaceDispatch(op, t, p) { pipeline("ws", op, t, p, ok || (() => {}), fail || (() => {})); },
      });
      window.google.script.run = mk(null, null);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

/* ============================================================
   KANTOR AI — LAPISAN 3 v2026.11.24
   1) Kartu Akses Darurat (masuk luring lewat berkas, tanpa ID+PIN)
   2) Register operasional: jatuh tempo, desk & unit, agen AI,
      kontrak vendor, model biaya, BCP/SOP, checklist, lampiran,
      snapshot ringkas, pengaturan
   ============================================================ */
(() => {
  "use strict";

  const VER = "2026.11.24";
  const IS_GAS = !window.__KAI_DEMO_SHIM__;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
  const now = () => new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta", hour12: false }).replace("T", " ");
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } };

  function banner(msg, action) {
    let el = $("#kai-banner3");
    if (!el) {
      el = document.createElement("div");
      el.id = "kai-banner3";
      el.className = "kai-banner";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.innerHTML = '<span class="kai-banner-msg">' + esc(msg) + "</span>" + (action ? '<button type="button" class="kai-banner-btn">' + esc(action.label) + "</button>" : "");
    el.classList.add("is-on");
    const btn = el.querySelector(".kai-banner-btn");
    if (btn) btn.addEventListener("click", () => { el.classList.remove("is-on"); action.fn(); });
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("is-on"), 8000);
  }

  function session() {
    try {
      const s = JSON.parse(sessionStorage.getItem("hi_session_v1") || "null");
      if (!s || !s.token || !s.user) return null;
      if (s.exp && Date.now() > s.exp) return null;
      return s;
    } catch (_) { return null; }
  }

  function callApi(route, payload) {
    const t = (session() || {}).token || "";
    return new Promise((res, rej) => {
      const r = window.google.script.run;
      r.withSuccessHandler(res).withFailureHandler((e) => rej(e instanceof Error ? e : new Error(String((e && e.message) || e)))).gasApiDispatch(route, t, payload || {});
    });
  }

  /* ============================================================
     1 · KARTU AKSES DARURAT
     Berkas .txt/.kai berisi JSON bertanda tangan HMAC-SHA256.
     Terikat pada perangkat ini (kunci di localStorage), punya masa
     berlaku, dan bisa dicabut.
     ============================================================ */
  async function deviceKey() {
    let jwk = read("kai-device-key-v1", null);
    if (!jwk) {
      const key = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, true, ["sign", "verify"]);
      jwk = await crypto.subtle.exportKey("jwk", key);
      write("kai-device-key-v1", jwk);
    }
    return crypto.subtle.importKey("jwk", jwk, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  }
  function cardMessage(c) {
    return [c.uid, c.nama, c.tier, c.iat, c.exp, c.nonce].join("|");
  }
  async function signCard(c) {
    const key = await deviceKey();
    const buf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(cardMessage(c)));
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
  }
  async function verifyCard(c) {
    if (!c || c.app !== "KANTOR-AI" || c.jenis !== "kartu-akses-darurat") throw new Error("Berkas bukan kartu akses Kantor AI.");
    const key = await deviceKey();
    const sig = Uint8Array.from(atob(c.sig), (ch) => ch.charCodeAt(0));
    const ok = await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(cardMessage(c)));
    if (!ok) throw new Error("Tanda tangan kartu tidak cocok. Kartu dibuat di perangkat lain atau isinya diubah.");
    if (new Date(c.exp).getTime() < Date.now()) throw new Error("Kartu akses sudah kedaluwarsa (" + c.exp + ").");
    if (read("kai-revoked-v1", []).indexOf(c.nonce) >= 0) throw new Error("Kartu akses sudah dicabut.");
    return c;
  }

  async function generateCard() {
    const s = session();
    if (!s) { banner("Masuk dulu untuk membuat kartu akses darurat."); return; }
    const u = s.user;
    const iat = new Date();
    const exp = new Date(iat.getTime() + 30 * 864e5);
    const fmt = (d) => d.toLocaleString("sv-SE", { timeZone: "Asia/Jakarta", hour12: false }).replace("T", " ");
    const c = {
      app: "KANTOR-AI",
      jenis: "kartu-akses-darurat",
      v: 1,
      uid: u.ID,
      nama: u.Nama,
      tier: u.Tier,
      iat: fmt(iat),
      exp: fmt(exp),
      expMs: exp.getTime(),
      nonce: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
      perangkat: "terikat perangkat ini"
    };
    if (IS_GAS) {
      const res = await callApi("auth.cardIssue", { days: 30 });
      if (res && res.card) Object.assign(c, res.card);
    } else {
      c.sig = await signCard(c);
    }
    const text = JSON.stringify(c, null, 2);
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kantor-ai-akses-" + u.ID + "-" + now().slice(0, 10) + ".txt";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 900);
    const cards = read("kai-cards-v1", []);
    cards.push({ uid: u.ID, nama: u.Nama, nonce: c.nonce, iat: c.iat, exp: c.exp });
    write("kai-cards-v1", cards);
    banner("Kartu akses dibuat: berlaku 30 hari, terikat perangkat ini. Simpan berkasnya di tempat aman.");
  }

  async function useCardFile(file) {
    try {
      const text = await file.text();
      const c = JSON.parse(text);
      if (!IS_GAS) await verifyCard(c);
      const res = IS_GAS
        ? await callApi("auth.loginFile", { card: c })
        : await callApi("auth.loginCard", { uid: c.uid, exp: c.expMs, nonce: c.nonce, sig: c.sig });
      sessionStorage.setItem("hi_session_v1", JSON.stringify({ token: res.token, user: res.user, exp: Date.now() + 8 * 36e5 }));
      banner("Masuk dengan kartu akses: " + (res.user.Nama || c.nama));
      setTimeout(() => location.reload(), 500);
    } catch (e) {
      banner("Kartu akses ditolak: " + (e.message || e));
    }
  }

  function installCardLogin() {
    const gate = document.getElementById("login-gate");
    if (!gate || document.getElementById("kai-card-login")) return;
    const box = document.createElement("div");
    box.className = "kai-card-login";
    box.innerHTML =
      '<div class="kai-card-login-inner">' +
      '<button type="button" id="kai-card-login" class="kai-card-btn">Gunakan Kartu Akses Darurat (berkas) →</button>' +
      '<span class="kai-card-hint">Tanpa ID &amp; PIN. Untuk darurat luring: unggah berkas kartu (.txt) yang dibuat saat masih bisa masuk.</span>' +
      '<input type="file" id="kai-card-file" accept=".txt,.kai,.json,application/json,text/plain" hidden />' +
      "</div>";
    let placed = false;
    try {
      const btn = Array.from(gate.querySelectorAll("button")).find((b) => /ID\s*&\s*PIN/i.test(b.textContent || ""));
      if (btn) {
        const host = btn.parentElement;
        if (host && host.parentElement) {
          host.parentElement.insertBefore(box, host.nextSibling);
          placed = true;
        }
      }
    } catch (_) {}
    if (!placed) gate.appendChild(box);
    $("#kai-card-login", box).addEventListener("click", () => $("#kai-card-file", box).click());
    $("#kai-card-file", box).addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) useCardFile(f);
      e.target.value = "";
    });
  }

  /* ============================================================
     2 · DATA REGISTER
     ============================================================ */
  const DESK = [
    ["U-01", "D1 · Kas & Pendapatan Tetap", "Kelompok aset A, B"],
    ["U-02", "D2 · Ekuitas Publik", "Kelompok aset C"],
    ["U-03", "D3 · Seleksi Reksa Dana & ETF", "Kelompok aset D"],
    ["U-04", "D4 · Valas, Komoditas & Derivatif", "Kelompok aset E, N"],
    ["U-05", "D5 · Kripto & Aset Digital Trading", "Kelompok aset F"],
    ["U-06", "D6 · Bisnis Digital & Kekayaan Intelektual", "Kelompok aset F, L"],
    ["U-07", "D7 · Properti & Tanah", "Kelompok aset G"],
    ["U-08", "D8 · Aset Fisik Produktif", "Kelompok aset H"],
    ["U-09", "D9 · Agrikultur & Alam", "Kelompok aset I"],
    ["U-10", "D10 · Koleksi & Aset Gaya Hidup", "Kelompok aset J"],
    ["U-11", "D11 · Asuransi & Pensiun", "Kelompok aset M"],
    ["U-12", "D12 · Bisnis & Usaha Langsung", "Kelompok aset K"],
    ["U-13", "S1 · CIO Office & Investment Committee", "sesuai uraian tugas"],
    ["U-14", "S2 · Risk, Compliance & APU-PPT", "risiko, izin, APU-PPT, PDP"],
    ["U-15", "S3 · Finance, Tax & Accounting", "COA, tutup buku, pajak, rekonsiliasi"],
    ["U-16", "S4 · Operations, Settlement & Custody", "settlement, kustodian, custody"],
    ["U-17", "S5 · Legal & Corporate Secretary", "sesuai uraian tugas"],
    ["U-18", "S6 · HR & People Operations", "sesuai uraian tugas"],
    ["U-19", "S7 · Technology, Data & AI Engineering", "sesuai uraian tugas"],
    ["U-20", "S8 · Capital & Stakeholder Relations", "sesuai uraian tugas"],
    ["U-21", "S9 · Internal Audit", "program audit tahunan"],
    ["U-22", "S10 · AI Operations Center (Kantor AI)", "platform, backup, akses, agen AI"],
    ["U-23", "S11 · Business Development & Deal Sourcing", "sesuai uraian tugas"],
    ["U-24", "S12 · General Affairs, Fasilitas & Umum", "sesuai uraian tugas"]
  ];

  const AGEN = [
    ["A-01", "AG-01 Router & Intake", "otomasi tugas router & intake"],
    ["A-02", "AG-02 Deal Memo Analyst", "otomasi tugas deal memo analyst"],
    ["A-03", "AG-03 Data Room & Due Diligence", "otomasi tugas data room & due diligence"],
    ["A-04", "AG-04 Valuation Engine", "otomasi tugas valuation engine"],
    ["A-05", "AG-05 Market & Macro Monitor", "otomasi tugas market & macro monitor"],
    ["A-06", "AG-06 Property & Land Coordinator", "otomasi tugas property & land coordinator"],
    ["A-07", "AG-07 Field Ops Coordinator", "otomasi tugas field ops coordinator"],
    ["A-08", "AG-08 Agri Yield Monitor", "otomasi tugas agri yield monitor"],
    ["A-09", "AG-09 Collectibles Authenticator", "otomasi tugas collectibles authenticator"],
    ["A-10", "AG-10 On-chain & Crypto Analyst", "otomasi tugas on-chain & crypto analyst"],
    ["A-11", "AG-11 Digital Asset Diligence", "otomasi tugas digital asset diligence"],
    ["A-12", "AG-12 Portfolio Monitoring & Reporting", "otomasi tugas portfolio monitoring & reporting"],
    ["A-13", "AG-13 Compliance & Legal Watch", "otomasi tugas compliance & legal watch"],
    ["A-14", "AG-14 Finance & Tax Agent", "otomasi tugas finance & tax agent"],
    ["A-15", "AG-15 Capital & Investor Relations", "otomasi tugas capital & investor relations"],
    ["A-16", "AG-16 HR & Vendor Ops", "otomasi tugas hr & vendor ops"],
    ["A-17", "AG-17 Document Generator", "otomasi tugas document generator"],
    ["A-18", "AG-18 AI Office Orchestrator", "otomasi tugas ai office orchestrator"]
  ];

  const JADWAL = [
    ["K-01", "Harian", "Rekonsiliasi kas & saldo bank", "S3"],
    ["K-02", "Harian", "Cek settlement jatuh tempo", "S4"],
    ["K-03", "Harian", "Absensi & izin masuk", "S6"],
    ["K-04", "Harian", "Persetujuan antrean (kas/intake)", "S1"],
    ["K-05", "Harian", "Insiden pasar/kripto (bila ada posisi)", "D5"],
    ["K-06", "Mingguan", "Pipeline intake & status DD", "S1"],
    ["K-07", "Mingguan", "Kas kecil & uang muka", "S3"],
    ["K-08", "Mingguan", "Jadwal inspeksi aset fisik", "D7-D12"],
    ["K-09", "Mingguan", "Tiket IT & akses baru", "S10"],
    ["K-10", "Mingguan", "Proyeksi kas 13 minggu", "S3"],
    ["K-11", "Bulanan", "Tutup buku & laporan keuangan per PT", "S3"],
    ["K-12", "Bulanan", "Rekonsiliasi bank & kustodian", "S3, S4"],
    ["K-13", "Bulanan", "Rekap absensi & cuti → payroll", "S6"],
    ["K-14", "Bulanan", "PPh 21 setor & lapor", "S3"],
    ["K-15", "Bulanan", "PPh 23/PPN/PPh final", "S3"],
    ["K-16", "Bulanan", "BPJS setor", "S6"],
    ["K-17", "Bulanan", "Tagihan vendor & termin", "S3"],
    ["K-18", "Bulanan", "Laporan ke Direksi", "S1"],
    ["K-19", "Bulanan", "Update harga & nilai portofolio", "S4"],
    ["K-20", "Bulanan", "Review akses & akun nonaktif", "S10"],
    ["K-21", "Bulanan", "Arsip LOG & backup", "S10"],
    ["K-22", "Triwulanan", "Laporan ke Komisaris", "S8"],
    ["K-23", "Triwulanan", "Review risiko & register", "S2"],
    ["K-24", "Triwulanan", "Review kontrak & vendor", "S5"],
    ["K-25", "Triwulanan", "Review KPI 12 desk", "S1"],
    ["K-26", "Triwulanan", "Uji pemulihan backup", "S10"],
    ["K-27", "Semesteran", "Appraisal properti & aset fisik", "D7, D8"],
    ["K-28", "Semesteran", "Review polis asuransi", "S12"],
    ["K-29", "Semesteran", "Audit internal 1 tema", "S9"],
    ["K-30", "Semesteran", "Review pajak & transfer pricing", "S3"],
    ["K-31", "Tahunan", "RUPS & pengesahan laporan", "S1"],
    ["K-32", "Tahunan", "SPT badan 7 entitas", "S3"],
    ["K-33", "Tahunan", "Audit KAP & laporan auditor", "S9"],
    ["K-34", "Tahunan", "Perpanjangan izin & NIB", "S5"],
    ["K-35", "Tahunan", "Perpanjangan asuransi & sertifikat", "S12"],
    ["K-36", "Tahunan", "Review kebijakan (D-xx) & LoA", "S5"],
    ["K-37", "Tahunan", "Penilaian kinerja & skema gaji", "S6"],
    ["K-38", "Tahunan", "Top-up DCPT (120× biaya tetap)", "S3"],
    ["K-39", "Tahunan", "Review strategi 160 aset & alokasi", "S1"],
    ["K-40", "Tahunan", "Rencana TI & anggaran tahun berikut", "S10"]
  ];

  const BIAYA_MODEL = [
    ["Y-01", "Payroll 26 FTE", 12500000, "26 FTE × rata-rata gaji/bulan"],
    ["Y-02", "BPJS + THR", 1375000, "11% payroll + 1 bulan gaji/tahun"],
    ["Y-03", "Sewa 3 lantai", 150000000, "3 lantai × Rp50 jt/bulan"],
    ["Y-04", "Utilitas & internet", 35000000, "rata-rata 3 bulan tagihan"],
    ["Y-05", "Alat inti (111 vendor)", 10000000, "plafon Rp5–15 jt/bln"],
    ["Y-06", "Jasa profesional", 60000000, "kontrak tahunan / 12"],
    ["Y-07", "Asuransi", 25000000, "0,3–1% nilai aset"],
    ["Y-08", "Freelancer 12 orang", 36000000, "12 × Rp3 jt/bln"],
    ["Y-09", "Cadangan DCPT", 12185000, "120× biaya tetap / 12"],
    ["Y-10", "Biaya per transaksi", 500000, "jam kerja per proses"],
    ["Y-11", "Anggaran TI tahunan", 200000000, "plafon / 12"],
    ["Y-12", "Biaya per sistem", 10000000, "alokasi per sistem"]
  ];

  const SOP = [
    {
      id: "SOP-01",
      judul: "BCP — Kebakaran / Banjir (B-12)",
      isi: "1. Prioritas: keselamatan orang, lalu data, lalu aset.\n2. Salinan luar kantor: backup harian ke Google Drive + 1 unduhan bulanan disimpan di luar gedung.\n3. Latihan 4 jam sekali per tahun: evakuasi, pulihkan data dari Drive, uji login dengan kartu akses darurat.\n4. Daftar kontak darurat dan PIC dicetak dan ditempel di 3 titik.\n5. Asuransi aset & D&O diperiksa 2× setahun (K-28)."
    },
    {
      id: "SOP-02",
      judul: "Pengganti Perangkat (B-08)",
      isi: "1. Perangkat lama: Ekspor cadangan (JSON) → unduh kartu akses darurat.\n2. Perangkat baru: buka HTML → unggah kartu akses → Impor cadangan.\n3. Verifikasi: jumlah baris per modul harus sama dengan laporan uji pemulihan.\n4. Cabut kartu akses lama dari tab Kartu Akses (dicabut).\n5. Target: perangkat baru siap < 1 jam."
    },
    {
      id: "SOP-03",
      judul: "Karyawan Kunci Keluar (B-13)",
      isi: "1. Hari H-7: handover daftar akses (akun, folder, kunci fisik).\n2. Hari H-1: cabut seluruh sesi & PIN offline, ganti kartu akses.\n3. Hari H: akun dinonaktifkan, aset dikembalikan.\n4. Dokumentasi akses disimpan di tab Kontrak & SOP.\n5. Target: pengganti mulai efektif < 1 minggu."
    },
    {
      id: "SOP-04",
      judul: "Vendor Kunci Berhenti (B-14)",
      isi: "1. Setiap vendor kunci wajib punya 2 alternatif terdaftar.\n2. Alternatif diuji sekali per tahun (bukan hanya terdaftar).\n3. Kontrak kunci memuat klausul pengalihan data & escrow.\n4. Bila berhenti: aktifkan alternatif dalam 5 hari kerja.\n5. Bukti: kontrak + hasil uji alternatif."
    },
    {
      id: "SOP-05",
      judul: "Notaris/KJPP Tunggal (B-09)",
      isi: "1. Daftar 2 mitra terdaftar per jenis layanan (notaris, KJPP).\n2. Masing-masing menandatangani surat ketersediaan.\n3. Bila mitra utama tidak dapat: mitra kedua mengambil alih tanpa penundaan.\n4. Bukti: 2 surat ketersediaan + daftar tarif."
    }
  ];

  const ONBOARD = ["Buat akun & email kantor", "Kartu akses darurat", "Panduan 9 halaman", "Modul keuangan (maker/checker)", "Modul intake & RAPID", "Absensi wajah + Maps", "Dokumen & arsip", "Kalender kewajiban", "Kebijakan 'catat di sistem'", "Pendamping per modul", "Uji 1 transaksi mandiri", "Pengarahan BCP & SOP"];
  const OFFBOARD = ["Cabut sesi semua perangkat", "Nonaktifkan akun", "Cabut PIN offline", "Cabut kartu akses darurat", "Kembalikan aset & kartu", "Serahkan berkas & tautan", "Hapus data pribadi sesuai retensi", "Catat di LOG audit"];

  /* ============================================================
     3 · LAMPIRAN (IndexedDB, T-09)
     ============================================================ */
  const IDB = (() => {
    let p;
    function open() {
      if (p) return p;
      p = new Promise((res, rej) => {
        const rq = indexedDB.open("kai-files", 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore("files", { keyPath: "id" });
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
      });
      return p;
    }
    async function put(rec) {
      const db = await open();
      return new Promise((res, rej) => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").put(rec);
        tx.oncomplete = () => res(true);
        tx.onerror = () => rej(tx.error);
      });
    }
    async function all() {
      const db = await open();
      return new Promise((res, rej) => {
        const rq = db.transaction("files").objectStore("files").getAll();
        rq.onsuccess = () => res(rq.result || []);
        rq.onerror = () => rej(rq.error);
      });
    }
    async function del(id) {
      const db = await open();
      return new Promise((res, rej) => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").delete(id);
        tx.oncomplete = () => res(true);
        tx.onerror = () => rej(tx.error);
      });
    }
    return { put, all, del };
  })();

  async function handleFiles(fileList) {
    const MAX = 5 * 1024 * 1024;
    let n = 0;
    for (const f of Array.from(fileList || [])) {
      if (f.size > MAX) { banner('"' + f.name + '" lebih dari 5 MB — dilewati (T-09).'); continue; }
      const buf = await f.arrayBuffer();
      await IDB.put({ id: "f" + Date.now() + Math.random().toString(36).slice(2, 6), nama: f.name, tipe: f.type || "berkas", ukuran: f.size, at: now(), data: buf });
      n++;
    }
    if (n) banner(n + " lampiran tersimpan di perangkat ini (maks 5 MB per berkas).");
    return n;
  }

  /* ============================================================
     4 · SNAPSHOT RINGKAS (T-18) & IMPOR BERTAHAP (T-10)
     ============================================================ */
  function snapshotCompact() {
    const o = { _meta: { app: "Kantor AI & Sistem Kerja", version: VER, at: now(), jenis: "ringkas", timezone: "Asia/Jakarta (WIB)" } };
    try {
      const db = JSON.parse(localStorage.getItem("kai-onefile-db-v1") || "{}");
      o.users = (db.users || []).map((x) => ({ ID: x.ID, Nama: x.Nama, Tier: x.Tier, Unit: x.Unit, Aktif: x.Aktif }));
      o.tasks = (db.tasks || []).map((x) => ({ ID: x.ID, Tugas: x.Tugas, Status: x.Status }));
      o.intake = (db.intake || []).map((x) => ({ ID: x.ID, Judul: x.Judul, Nilai: x.Nilai, Status: x.Status }));
      o.cash = (db.cash || []).map((x) => ({ ID: x.ID, Tanggal: x.Tanggal, Jenis: x.Jenis, Nominal: x.Nominal, Status: x.Status }));
      o.attendance = (db.attendance || []).length;
      o.documents = (db.documents || []).length;
    } catch (_) {}
    return o;
  }
  function download(name, text, mime) {
    const blob = new Blob([text], { type: mime || "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 900);
  }

  async function importChunked(obj, onProgress) {
    // T-10: impor 200 baris per batch dengan progres, bukan sekaligus
    const db = JSON.parse(localStorage.getItem("kai-onefile-db-v1") || "{}");
    const target = obj["kai-onefile-db-v1"] ? JSON.parse(obj["kai-onefile-db-v1"]) : null;
    if (!target) return { ok: false, msg: "Berkas tidak berisi kai-onefile-db-v1." };
    let total = 0, done = 0;
    ["users", "tasks", "intake", "cash", "attendance", "documents"].forEach((k) => {
      if (Array.isArray(target[k])) total += target[k].length;
    });
    const BATCH = 200;
    for (const k of ["users", "tasks", "intake", "cash", "attendance", "documents"]) {
      if (!Array.isArray(target[k])) continue;
      db[k] = db[k] || [];
      for (let i = 0; i < target[k].length; i += BATCH) {
        db[k] = db[k].concat(target[k].slice(i, i + BATCH));
        done += Math.min(BATCH, target[k].length - i);
        if (onProgress) onProgress(Math.round((done / Math.max(1, total)) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    localStorage.setItem("kai-onefile-db-v1", JSON.stringify(db));
    return { ok: true, total: done };
  }

  /* ============================================================
     5 · MODAL OPERASIONAL
     ============================================================ */
  function sel(id, opts, val) {
    return '<select class="kai-reg-sel" data-st="' + esc(id) + '" aria-label="Status ' + esc(id) + '">' +
      opts.map((o) => '<option value="' + esc(o) + '"' + (o === val ? " selected" : "") + ">" + esc(o) + "</option>").join("") + "</select>";
  }
  function st(id) { return read("kai-status-v1", {})[id] || "Belum"; }
  function setSt(id, v) { const o = read("kai-status-v1", {}); o[id] = v; write("kai-status-v1", o); }

  function table(headers, rows) {
    return '<div class="kai-reg-wrap"><table class="kai-reg-table"><thead><tr>' + headers.map((h) => '<th scope="col">' + esc(h) + "</th>").join("") + "</tr></thead><tbody>" + rows.join("") + "</tbody></table></div>";
  }

  function nextDue(freq) {
    const d = new Date();
    const add = (n, unit) => { const x = new Date(d); if (unit === "d") x.setDate(x.getDate() + n); if (unit === "m") x.setMonth(x.getMonth() + n); if (unit === "y") x.setFullYear(x.getFullYear() + n); return x; };
    if (freq === "Harian") return add(1, "d");
    if (freq === "Mingguan") return add(7, "d");
    if (freq === "Bulanan") return add(1, "m");
    if (freq === "Triwulanan") return add(3, "m");
    if (freq === "Semesteran") return add(6, "m");
    return add(1, "y");
  }
  const fmtDate = (d) => d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric" });

  function dueRows() {
    const last = read("kai-lastdone-v1", {});
    return JADWAL.map((r) => {
      const lastDone = last[r[0]] ? new Date(last[r[0]]) : null;
      const due = lastDone ? nextDueFrom(lastDone, r[1]) : nextDue(r[1]);
      const days = Math.round((due - new Date()) / 864e5);
      return { id: r[0], freq: r[1], nama: r[2], owner: r[3], due, days, lastDone };
    }).sort((a, b) => a.days - b.days);
  }
  function nextDueFrom(from, freq) {
    const add = (n, unit) => { const x = new Date(from); if (unit === "d") x.setDate(x.getDate() + n); if (unit === "m") x.setMonth(x.getMonth() + n); if (unit === "y") x.setFullYear(x.getFullYear() + n); return x; };
    if (freq === "Harian") return add(1, "d");
    if (freq === "Mingguan") return add(7, "d");
    if (freq === "Bulanan") return add(1, "m");
    if (freq === "Triwulanan") return add(3, "m");
    if (freq === "Semesteran") return add(6, "m");
    return add(1, "y");
  }

  function tabDue() {
    const rows = dueRows().map((r) => {
      const cls = r.days <= 0 ? "kai-due-late" : r.days <= 7 ? "kai-due-soon" : "";
      return "<tr class='" + cls + "'><td>" + esc(r.id) + "</td><td>" + esc(r.freq) + "</td><td>" + esc(r.nama) + "</td><td>" + esc(r.owner) + "</td><td>" + fmtDate(r.due) + "</td><td>" + (r.days <= 0 ? "lewat " + Math.abs(r.days) + " hari" : r.days + " hari lagi") + "</td><td><button type='button' class='kai-mini' data-done='" + esc(r.id) + "'>Tandai selesai</button></td></tr>";
    });
    return '<p class="kai-reg-note">Dihitung dari frekuensi dan tanggal selesai terakhir. Warna merah = lewat, kuning = ≤7 hari.</p>' +
      table(["ID", "Frekuensi", "Kewajiban", "Pemilik", "Jatuh tempo", "Sisa", "Aksi"], rows);
  }
  function tabDesk() {
    const rows = DESK.map((r) => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td><td>" + sel(r[0], ["Belum", "SOP dibuat", "KPI aktif", "Review berjalan"], st(r[0])) + "</td></tr>");
    return '<p class="kai-reg-note">L10 · 24 unit. Target minimum: SOP 1 halaman, pemilik data, jadwal, bukti.</p>' + table(["ID", "Unit", "Fokus", "Status"], rows);
  }
  function tabAgen() {
    const rows = AGEN.map((r) => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td><td>" + sel(r[0], ["Belum aktif", "Uji coba", "Produktif"], st(r[0])) + "</td><td><button type='button' class='kai-mini' data-agent='" + esc(r[1]) + "'>Uji</button></td></tr>");
    return '<p class="kai-reg-note">L11 · 18 agen. Tombol Uji mengirim satu permintaan ke rute <code>ai.assist</code> (mode demo atau Gemini bila kunci diisi).</p>' + table(["ID", "Agen", "Tugas", "Status", "Aksi"], rows);
  }
  function tabKontrak() {
    const saved = read("kai-kontrak-v1", {});
    const rows = [];
    for (let i = 0; i < 20; i++) {
      const id = "V-" + String(i + 1).padStart(2, "0");
      const v = saved[id] || {};
      rows.push("<tr><td>" + esc(id) + "</td><td><input class='kai-inp' data-k='" + id + "|nama' value='" + esc(v.nama || "") + "' placeholder='Nama vendor'></td><td><input class='kai-inp' data-k='" + id + "|awal' type='date' value='" + esc(v.awal || "") + "'></td><td><input class='kai-inp' data-k='" + id + "|akhir' type='date' value='" + esc(v.akhir || "") + "'></td><td>" + sel(id, ["Belum", "Aktif", "Akan habis", "Habis"], st(id)) + "</td></tr>");
    }
    return '<p class="kai-reg-note">L09 · N-24. Catat masa berlaku kontrak; yang akan habis &lt;90 hari ditandai. Daftar 20 baris pertama dapat dilanjutkan.</p>' + table(["ID", "Vendor", "Mulai", "Berakhir", "Status"], rows);
  }
  function tabBiaya() {
    const saved = read("kai-biaya-v1", {});
    const rows = BIAYA_MODEL.map((r) => {
      const v = saved[r[0]] == null ? r[2] : Number(saved[r[0]]);
      return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td><input class='kai-inp kai-num' data-b='" + r[0] + "' type='number' min='0' step='1000000' value='" + v + "'></td><td>" + esc(r[3]) + "</td><td class='kai-rp' data-bout='" + r[0] + "'>" + rp(v) + "</td></tr>";
    });
    return '<p class="kai-reg-note">L19 · 12 komponen. Ubah angka → total & skenario dihitung otomatis.</p>' +
      table(["ID", "Komponen", "Per bulan (Rp)", "Dasar", "Terhitung"], rows) +
      '<div class="kai-total"><span>Total per bulan</span><b id="kai-biaya-total">—</b></div>' +
      '<div class="kai-skenario"><div class="kai-sken"><span>Hemat (−25%)</span><b id="kai-sk1">—</b></div><div class="kai-sken"><span>Dasar</span><b id="kai-sk2">—</b></div><div class="kai-sken"><span>Mahal (+25%)</span><b id="kai-sk3">—</b></div></div>' +
      '<div class="kai-skenario"><div class="kai-sken"><span>DCPT wajib (120×)</span><b id="kai-dcpt">—</b></div><div class="kai-sken"><span>Saldo kas saat ini</span><b id="kai-kas">—</b></div><div class="kai-sken"><span>Cakupan</span><b id="kai-cakup">—</b></div></div>';
  }
  function tabSop() {
    return SOP.map((d) => '<div class="kai-sop"><h3>' + esc(d.judul) + "</h3><pre>" + esc(d.isi) + "</pre></div>").join("") +
      '<p class="kai-reg-note">L18 · B-08, B-09, B-12, B-13, B-14. Cetak halaman ini untuk dilampirkan pada berkas kebijakan.</p>';
  }
  function tabCheck() {
    const done = read("kai-check-v1", {});
    const row = (list, key, label) => list.map((x, i) => {
      const id = key + "-" + (i + 1);
      return "<tr><td><input type='checkbox' class='kai-chk' data-chk='" + id + "'" + (done[id] ? " checked" : "") + "></td><td>" + esc(x) + "</td></tr>";
    }).join("");
    return '<div class="kai-cols"><div><h3>Onboarding 3 hari — 12 butir</h3><div class="kai-reg-wrap"><table class="kai-reg-table"><tbody>' + row(ONBOARD, "on", "") + '</tbody></table></div><p class="kai-reg-note" id="kai-on-sum"></p></div>' +
      '<div><h3>Offboarding 1 jam — 8 butir</h3><div class="kai-reg-wrap"><table class="kai-reg-table"><tbody>' + row(OFFBOARD, "off", "") + '</tbody></table></div><p class="kai-reg-note" id="kai-off-sum"></p></div></div>';
  }
  async function tabFiles() {
    const files = await IDB.all();
    const rows = files.map((f) => "<tr><td>" + esc(f.nama) + "</td><td>" + esc(f.tipe) + "</td><td>" + (f.ukuran / 1024).toFixed(0) + " KB</td><td>" + esc(f.at) + "</td><td><button type='button' class='kai-mini kai-del' data-del='" + esc(f.id) + "'>Hapus</button></td></tr>");
    return '<p class="kai-reg-note">T-09 · batas 5 MB per berkas, disimpan di IndexedDB perangkat ini.</p>' +
      '<input type="file" id="kai-file-in" multiple class="kai-file-in" accept="*">' +
      (rows.length ? table(["Nama", "Tipe", "Ukuran", "Waktu", "Aksi"], rows) : '<p class="kai-reg-note">Belum ada lampiran.</p>');
  }
  function tabSnapshot() {
    return '<p class="kai-reg-note">T-18 · snapshot ringkas hanya kolom yang tampil (lebih kecil dari cadangan penuh).</p>' +
      '<div class="kai-backup-grid">' +
      '<button type="button" class="kai-backup-btn" data-snap="ringkas"><b>⬇ Snapshot ringkas</b><span>hanya kolom tampil</span></button>' +
      '<button type="button" class="kai-backup-btn" data-snap="penuh"><b>⬇ Snapshot penuh</b><span>seluruh modul</span></button>' +
      '<button type="button" class="kai-backup-btn" data-snap="import"><b>⬆ Impor bertahap</b><span>200 baris/batch + progres</span></button>' +
      "</div>" +
      '<div id="kai-imp-out" class="kai-backup-out" aria-live="polite"></div>' +
      '<input type="file" id="kai-imp-file" accept=".json,application/json" hidden>';
  }
  function tabSetting() {
    const s = read("kai-settings-v1", {});
    return '<p class="kai-reg-note">Pengaturan perangkat. Kunci Maps &amp; koordinat kantor dipakai modul absensi.</p>' +
      '<label class="kai-field"><span>Kunci Google Maps (N-25)</span><input class="kai-inp" id="kai-set-maps" value="' + esc(s.maps || "") + '" placeholder="AIza…"></label>' +
      '<label class="kai-field"><span>Koordinat kantor (lat,lng)</span><input class="kai-inp" id="kai-set-office" value="' + esc(s.office || "-6.175,106.827") + '" placeholder="-6.175,106.827"></label>' +
      '<label class="kai-field"><span>Radius absensi (meter)</span><input class="kai-inp" id="kai-set-radius" type="number" value="' + esc(s.radius || 150) + '"></label>' +
      '<button type="button" class="kai-backup-btn" id="kai-set-save"><b>Simpan &amp; muat ulang</b><span>kunci Maps dipakai saat halaman dimuat</span></button>' +
      '<h3>Kartu akses darurat</h3>' +
      '<div class="kai-backup-grid">' +
      '<button type="button" class="kai-backup-btn" id="kai-card-make"><b>① Buat kartu (.txt)</b><span>masuk dulu; berlaku 30 hari</span></button>' +
      '<button type="button" class="kai-backup-btn" id="kai-card-revoke"><b>✕ Cabut semua kartu</b><span>cartu lama tidak bisa dipakai</span></button>' +
      "</div>" +
      '<div id="kai-card-out" class="kai-backup-out" aria-live="polite"></div>';
  }

  function openOps() {
    const id = "kai-ops-modal";
    if ($("#" + id)) { $("#" + id).classList.add("is-open"); return; }
    const tabs = [
      { k: "due", label: "Jatuh Tempo", body: tabDue },
      { k: "desk", label: "Desk & Unit", body: tabDesk },
      { k: "agen", label: "Agen AI", body: tabAgen },
      { k: "kontrak", label: "Kontrak Vendor", body: tabKontrak },
      { k: "biaya", label: "Model Biaya", body: tabBiaya },
      { k: "sop", label: "BCP & SOP", body: tabSop },
      { k: "check", label: "Checklist", body: tabCheck },
      { k: "files", label: "Lampiran", body: tabFiles },
      { k: "snap", label: "Snapshot", body: tabSnapshot },
      { k: "set", label: "Pengaturan", body: tabSetting },
      { k: "dok", label: "Dokumen", body: () => (window.__KAI4 ? window.__KAI4.tabDocs() : "") },
      { k: "ics", label: "Kalender", body: () => (window.__KAI4 ? window.__KAI4.tabIcs() : "") },
      { k: "bukti", label: "Bukti Uji", body: () => (window.__KAI4 ? window.__KAI4.tabBukti() : "") },
      { k: "retensi", label: "Retensi", body: () => (window.__KAI4 ? window.__KAI4.tabRetensi() : "") },
      { k: "real", label: "Realisasi", body: () => (window.__KAI4 ? window.__KAI4.tabRealisasi() : "") },
      { k: "mitra", label: "Mitra & Asuransi", body: () => (window.__KAI4 ? window.__KAI4.tabMitra() : "") }
    ];
    const wrap = document.createElement("div");
    wrap.className = "kai-modal";
    wrap.id = id;
    wrap.innerHTML =
      '<div class="kai-modal-card kai-reg-card"><div class="kai-modal-head"><h2>Register Operasional</h2><button type="button" class="kai-modal-close" aria-label="Tutup">✕</button></div>' +
      '<div class="kai-reg-tabs" role="tablist" aria-label="Register operasional">' +
      tabs.map((t, i) => '<button type="button" role="tab" class="kai-reg-tab" data-otab="' + t.k + '" aria-selected="' + (i === 0) + '">' + esc(t.label) + "</button>").join("") +
      "</div>" +
      '<div class="kai-modal-body"><div id="kai-ops-pane"></div></div></div>';
    document.body.appendChild(wrap);
    wrap.classList.add("is-open");
    wrap.addEventListener("click", (e) => { if (e.target === wrap) wrap.classList.remove("is-open"); });
    wrap.querySelector(".kai-modal-close").addEventListener("click", () => wrap.classList.remove("is-open"));

    const render = async (k) => {
      const t = tabs.find((x) => x.k === k) || tabs[0];
      $$(".kai-reg-tab", wrap).forEach((b) => b.setAttribute("aria-selected", String(b.getAttribute("data-otab") === t.k)));
      const pane = $("#kai-ops-pane", wrap);
      const html = await t.body();
      pane.innerHTML = html;
      $$("[data-st]", pane).forEach((s) => s.addEventListener("change", (e) => setSt(e.target.getAttribute("data-st"), e.target.value)));
      $$("[data-done]", pane).forEach((b) => b.addEventListener("click", () => {
        const o = read("kai-lastdone-v1", {}); o[b.getAttribute("data-done")] = new Date().toISOString(); write("kai-lastdone-v1", o);
        banner("Ditandai selesai: " + b.getAttribute("data-done")); render("due");
      }));
      $$("[data-agent]", pane).forEach((b) => b.addEventListener("click", async () => {
        b.disabled = true; b.textContent = "…";
        try {
          const r = await callApi("ai.assist", { mode: "ringkas_eksekutif", prompt: "Uji agen " + b.getAttribute("data-agent") });
          banner("Agen merespons (" + (r.model || "demo") + "): " + String(r.text || "").slice(0, 90) + "…");
        } catch (e) { banner("Uji agen gagal: " + e.message); }
        b.disabled = false; b.textContent = "Uji";
      }));
      $$("[data-k]", pane).forEach((i) => i.addEventListener("change", () => {
        const o = read("kai-kontrak-v1", {});
        const [id, f] = i.getAttribute("data-k").split("|");
        o[id] = o[id] || {}; o[id][f] = i.value; write("kai-kontrak-v1", o);
      }));
      $$("[data-b]", pane).forEach((i) => i.addEventListener("input", () => {
        const o = read("kai-biaya-v1", {}); o[i.getAttribute("data-b")] = i.value; write("kai-biaya-v1", o); biayaTotal(pane);
      }));
      $$("[data-chk]", pane).forEach((c) => c.addEventListener("change", () => {
        const o = read("kai-check-v1", {}); o[c.getAttribute("data-chk")] = c.checked; write("kai-check-v1", o); checkSum(pane);
      }));
      $$("[data-del]", pane).forEach((b) => b.addEventListener("click", async () => { await IDB.del(b.getAttribute("data-del")); render("files"); }));
      $$("[data-snap]", pane).forEach((b) => b.addEventListener("click", async (ev) => {
        const a = b.getAttribute("data-snap");
        if (a === "import") { $("#kai-imp-file", pane).click(); return; }
        if (a === "ringkas") download("kai-snapshot-ringkas-" + now().slice(0, 10) + ".json", JSON.stringify(snapshotCompact()));
        else download("kai-snapshot-penuh-" + now().slice(0, 10) + ".json", JSON.stringify({ _meta: { at: now() }, "kai-onefile-db-v1": localStorage.getItem("kai-onefile-db-v1") }));
      }));
      const fi = $("#kai-file-in", pane);
      if (fi) fi.addEventListener("change", async (e) => { await handleFiles(e.target.files); render("files"); });
      const imp = $("#kai-imp-file", pane);
      if (imp) imp.addEventListener("change", async (e) => {
        const f = e.target.files[0]; if (!f) return;
        const out = $("#kai-imp-out", pane);
        try {
          const obj = JSON.parse(await f.text());
          out.innerHTML = "<p class='kai-backup-row'>Mengimpor… 0%</p>";
          const r = await importChunked(obj, (p) => { out.innerHTML = "<p class='kai-backup-row'>Mengimpor… " + p + "%</p>"; });
          out.innerHTML = r.ok ? "<p class='kai-backup-ok'>Selesai · " + r.total + " baris diimpor bertahap</p>" : "<p class='kai-backup-bad'>" + esc(r.msg) + "</p>";
        } catch (err) { out.innerHTML = "<p class='kai-backup-bad'>Gagal: " + esc(err.message) + "</p>"; }
        e.target.value = "";
      });
      if ($$("[data-b]", pane).length) biayaTotal(pane);
      if ($$("[data-chk]", pane).length) checkSum(pane);
      if (window.__KAI4 && window.__KAI4.bind) window.__KAI4.bind(pane, t.k);
      const sm = $("#kai-set-maps", pane);
      if (sm) {
        $("#kai-set-save", pane).addEventListener("click", () => {
          const s = { maps: $("#kai-set-maps", pane).value.trim(), office: $("#kai-set-office", pane).value.trim(), radius: Number($("#kai-set-radius", pane).value) || 150 };
          write("kai-settings-v1", s);
          banner("Pengaturan disimpan. Memuat ulang…");
          setTimeout(() => location.reload(), 700);
        });
        $("#kai-card-make", pane).addEventListener("click", generateCard);
        $("#kai-card-revoke", pane).addEventListener("click", () => {
          const cards = read("kai-cards-v1", []);
          const rev = read("kai-revoked-v1", []);
          cards.forEach((c) => { if (rev.indexOf(c.nonce) < 0) rev.push(c.nonce); });
          write("kai-revoked-v1", rev);
          $("#kai-card-out", pane).innerHTML = "<p class='kai-backup-ok'>" + rev.length + " kartu dicabut.</p>";
        });
      }
    };
    $$("[data-otab]", wrap).forEach((b) => b.addEventListener("click", () => render(b.getAttribute("data-otab"))));
    window.addEventListener("kai-rerender", (e) => { if (e.detail && e.detail.key) render(e.detail.key); });
    render("due");
  }

  function biayaTotal(pane) {
    const vals = $$("[data-b]", pane).map((i) => Number(i.value) || 0);
    $$("[data-bout]", pane).forEach((el, i) => { el.textContent = rp(vals[i]); });
    const total = vals.reduce((a, b) => a + b, 0);
    const t = $("#kai-biaya-total", pane); if (t) t.textContent = rp(total);
    const s1 = $("#kai-sk1", pane), s2 = $("#kai-sk2", pane), s3 = $("#kai-sk3", pane);
    if (s1) { s1.textContent = rp(total * 0.75); s2.textContent = rp(total); s3.textContent = rp(total * 1.25); }
    const dc = $("#kai-dcpt", pane); if (dc) dc.textContent = rp(total * 120);
    let kas = 0;
    try {
      const db = JSON.parse(localStorage.getItem("kai-onefile-db-v1") || "{}");
      const inc = (db.cash || []).filter((x) => x.Jenis === "Masuk").reduce((a, x) => a + Number(x.Nominal || 0), 0);
      const out = (db.cash || []).filter((x) => x.Jenis === "Keluar").reduce((a, x) => a + Number(x.Nominal || 0), 0);
      kas = inc - out;
    } catch (_) {}
    const k = $("#kai-kas", pane); if (k) k.textContent = rp(kas);
    const ck = $("#kai-cakup", pane); if (ck) ck.textContent = kas > 0 ? Math.round((kas / (total * 120 || 1)) * 100) + "% dari DCPT" : "—";
  }
  function checkSum(pane) {
    const on = read("kai-check-v1", {});
    const onN = ONBOARD.filter((_, i) => on["on-" + (i + 1)]).length;
    const offN = OFFBOARD.filter((_, i) => on["off-" + (i + 1)]).length;
    const a = $("#kai-on-sum", pane); if (a) a.textContent = onN + "/" + ONBOARD.length + " selesai";
    const b = $("#kai-off-sum", pane); if (b) b.textContent = offN + "/" + OFFBOARD.length + " selesai";
  }

  /* ============================================================
     6 · BOOT
     ============================================================ */
  function ensureToolbar() {
    const bar = $(".kai-toolbar");
    if (!bar || $("#kai-btn-ops")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "kai-tool-btn";
    b.id = "kai-btn-ops";
    b.title = "Register operasional: jatuh tempo, desk, agen, kontrak, biaya, SOP, checklist";
    b.innerHTML = '<span aria-hidden="true">▦</span> Operasional';
    b.addEventListener("click", openOps);
    bar.insertBefore(b, $("#kai-save-status"));
  }

  function boot() {
    (function retryToolbar(n) { ensureToolbar(); if (!$("#kai-btn-ops") && n < 120) setTimeout(() => retryToolbar(n + 1), 250); })(0);
    installCardLogin();
    const obs = new MutationObserver(() => installCardLogin());
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 20000);

    // pengaturan: kunci Maps dipakai saat dimuat
    const s = read("kai-settings-v1", {});
    if (s.maps && window.__GAS_MAPS_KEY__ === "") { try { window.__GAS_MAPS_KEY__ = s.maps; } catch (_) {} }

    // peringatan jatuh tempo
    const due = dueRows().filter((r) => r.days <= 0).length;
    const soon = dueRows().filter((r) => r.days > 0 && r.days <= 7).length;
    const dueNotice = () => {
      // info kewajiban internal: hanya untuk peran yang boleh membuka register Operasional, dan hanya setelah masuk
      if (!(window.__kaiToolAllowed && window.__kaiToolAllowed("kai-btn-ops"))) return;
      if (due || soon) banner((due ? due + " kewajiban lewat jatuh tempo. " : "") + (soon ? soon + " kewajiban ≤7 hari." : ""), { label: "Lihat", fn: openOps });
    };
    setTimeout(dueNotice, 2200);
    window.addEventListener("kai-session-change", (ev) => { if (ev.detail && ev.detail.authed) setTimeout(dueNotice, 600); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

/* ============================================================
   KANTOR AI — LAPISAN 4 v2026.11.24
   Gerbang akses per halaman (L01), 33 dokumen (L08/N-16),
   kalender .ics (L12), bukti uji kontrol (L13), retensi PDP (L14),
   realisasi vs anggaran (L19), mitra & asuransi (B-09/B-12)
   ============================================================ */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
  const now = () => new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta", hour12: false }).replace("T", " ");
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } };
  const IS_GAS = !window.__KAI_DEMO_SHIM__;

  function banner(msg, action) {
    let el = $("#kai-banner4");
    if (!el) {
      el = document.createElement("div");
      el.id = "kai-banner4";
      el.className = "kai-banner";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.innerHTML = '<span class="kai-banner-msg">' + esc(msg) + "</span>" + (action ? '<button type="button" class="kai-banner-btn">' + esc(action.label) + "</button>" : "");
    el.classList.add("is-on");
    const b = el.querySelector(".kai-banner-btn");
    if (b) b.addEventListener("click", () => { el.classList.remove("is-on"); action.fn(); });
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("is-on"), 8000);
  }
  function session() {
    try {
      const s = JSON.parse(sessionStorage.getItem("hi_session_v1") || "null");
      if (!s || !s.token || !s.user) return null;
      if (s.exp && Date.now() > s.exp) return null;
      return s;
    } catch (_) { return null; }
  }
  function download(name, text, mime) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: mime || "text/plain" }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 900);
  }
  function tbl(headers, rows) {
    const body = Array.isArray(rows) ? rows.join("") : String(rows == null ? "" : rows);
    return '<div class="kai-reg-wrap"><table class="kai-reg-table"><thead><tr>' + headers.map((h) => '<th scope="col">' + esc(h) + "</th>").join("") + "</tr></thead><tbody>" + body + "</tbody></table></div>";
  }

  /* ============================================================
     1 · GERBANG AKSES PER HALAMAN (L01 · H-02…H-50)
     ============================================================ */
  const PAGE_TIER = window.__KAI_PAGE_TIER__ || {}; // kebijakan tunggal (lihat #kai-access-policy)
  const PAGE_NAME = { kantor: "Kantor AI & Sistem Kerja", ringkas: "Ringkasan", org: "Organisasi", tugas: "Pembagian Tugas", inv: "Struktur Investasi", aset: "Katalog 160 Aset", dokumen: "Dokumen & Arsip", alur: "Alur Kerja", vendor: "Pihak Ketiga & Biaya" };

  function currentPageId() {
    const btn = $('nav[aria-label="Navigasi utama portal"] button[aria-current="page"]');
    if (btn) {
      const all = $$('nav[aria-label="Navigasi utama portal"] button');
      const i = all.indexOf(btn);
      const ids = ["kantor", "ringkas", "org", "tugas", "inv", "aset", "dokumen", "alur", "vendor"];
      if (i >= 0 && ids[i]) return ids[i];
    }
    return "kantor";
  }
  function strictOn() {
    return true; // gerbang selalu aktif — "mode longgar" dihapus (H-02…H-50)
  }
  function gateCheck() {
    // Gerbang halaman kini dijalankan di dalam aplikasi (React): konten halaman terkunci tidak pernah dirender,
    // kartu kunci tampil di dalam #konten-utama, header & 9 tab tetap bisa diklik. Di sini cukup membersihkan sisa overlay lama.
    const legacy = document.querySelector("body > #kai-gate-locked"); if (legacy) legacy.remove();
    try { const s2 = read("kai-settings-v1", {}); if (s2 && s2.strict === false) { delete s2.strict; write("kai-settings-v1", s2); } } catch (_) {}
    return PAGE_TIER[currentPageId()] ? !!(window.__kaiPageAllowed && window.__kaiPageAllowed(currentPageId())) : true;
  }

  /* ============================================================
     2 · 33 DOKUMEN (L08 · D-00…D-32)
     ============================================================ */
  const DOK = [
    ["D-00", "Sampul kendali dokumen", "Kendali", "Records Coordinator", { tujuan: "Menjadi halaman pertama setiap dokumen resmi agar identitas, versi, dan statusnya tidak tertukar.", ruang: "Seluruh dokumen D-00…D-32.", poin: ["Judul, ID dokumen, entitas, pemilik proses.", "Versi, tanggal berlaku, status (Draf/Review/Final/Arsip).", "Klasifikasi kerahasiaan dan daftar distribusi.", "Riwayat perubahan dan penyetuju."], bukti: "Sampul terisi lengkap pada setiap dokumen.", review: "Setiap kali versi naik." }],
    ["D-01", "Piagam proyek pra-pendirian & keputusan lanjut", "Proyek", "Pendiri / Strategy", { tujuan: "Menetapkan dasar, tujuan, dan batas proyek pendirian sebelum badan hukum dibentuk.", ruang: "Kegiatan pra-pendirian hingga keputusan lanjut.", poin: ["Latar belakang dan tujuan pendirian.", "Ruang lingkup, luar lingkup, dan asumsi.", "Pemilik keputusan dan cara keputusan diambil (RAPID).", "Kriteria selesai dan anggaran awal.", "Keputusan lanjut: lanjut / tunda / stop."], bukti: "Piagam ditandatangani pendiri.", review: "Saat keputusan lanjut." }],
    ["D-02", "Instruksi pendirian badan kepada notaris", "Legal", "Pendiri / Legal", { tujuan: "Memberi instruksi tertulis kepada notaris agar akta sesuai keputusan pendiri.", ruang: "Pendirian PT/SPV.", poin: ["Nama, tujuan, dan durasi badan.", "Modal dasar dan modal disetor.", "Susunan pengurus dan kuasa.", "Alamat, KBLI, dan entitas terkait.", "Batas waktu penyelesaian."], bukti: "Surat instruksi + tanda terima notaris.", review: "Saat ada perubahan struktur." }],
    ["D-03", "Risalah keputusan pendiri / rapat organ", "Risalah", "Corsec", { tujuan: "Mencatat keputusan resmi agar tidak berubah secara lisan.", ruang: "Rapat pendiri, Direksi, Komisaris.", poin: ["Tanggal, tempat, peserta, dan kuorum.", "Agenda dan uraian pembahasan.", "Keputusan, penanggung jawab, dan tenggat.", "Pernyataan bentuk keberatan bila ada.", "Tanda tangan dan distribusi."], bukti: "Risalah ditandatangani.", review: "Setiap rapat." }],
    ["D-04", "Register badan, saham, modal dan pemilik manfaat", "Register", "Corsec / Finance", { tujuan: "Menjadi catatan tunggal struktur kepemilikan dan modal.", ruang: "7 PT/SPV.", poin: ["Badan, KBLI, NPWP, dan akta.", "Pemegang saham dan persentase.", "Modal dasar, disetor, dan perubahan.", "Pemilik manfaat (beneficial owner).", "Tanggal dan sumber perubahan."], bukti: "Register mutakhir dan sesuai akta.", review: "Saat ada perubahan modal." }],
    ["D-05", "Matriks kewenangan dan RAPID", "Kewenangan", "Legal / Risk", { tujuan: "Menetapkan siapa boleh memutuskan apa dan sampai nilai berapa.", ruang: "Intake, kas, pengadaan, kontrak.", poin: ["Peran: Recommend, Agree, Perform, Input, Decide.", "Ambang nilai dan pejabat penyetuju.", "Delegasi dan batas delegasi.", "Pemisahan maker vs checker.", "Sanksi bila aturan dilanggar."], bukti: "Matriks disetujui dan dipakai di sistem.", review: "Tahunan (K-36)." }],
    ["D-06", "Kebijakan investasi modal sendiri", "Kebijakan", "CIO / Risk", { tujuan: "Membatas alokasi, instrumen, dan risiko modal sendiri.", ruang: "14 kelompok aset.", poin: ["Tujuan imbal hasil dan toleransi risiko.", "Batas per kelompok aset dan per instrumen.", "Likuiditas minimum.", "Larangan dan pengecualian.", "Frekuensi rebalancing."], bukti: "Kebijakan berlaku dan dipakai IC.", review: "Tahunan." }],
    ["D-07", "Form intake peluang investasi", "Form", "Deal Sourcing / Desk", { tujuan: "Menangkap usulan investasi secara seragam sebelum dinilai.", ruang: "Semua usulan.", poin: ["Judul, deskripsi, dan nilai.", "Kelompok aset dan entitas.", "Dasar usulan dan sumber informasi.", "Lampiran memo/DD.", "Tenggat penilaian."], bukti: "Form lengkap sebelum masuk antrean.", review: "Saat proses intake berubah." }],
    ["D-08", "Checklist due diligence berbasis kelas aset", "Checklist", "Deal team", { tujuan: "Memastikan pemeriksaan minimum dilakukan sesuai jenis aset.", ruang: "14 kelompok aset.", poin: ["Legal, keuangan, pajak, dan operasional.", "Item khusus per kelas aset.", "Sumber bukti tiap item.", "Temuan dan rekomendasi.", "Status: lengkap / bermasalah."], bukti: "Checklist terisi dan ditandatangani.", review: "Per transaksi." }],
    ["D-09", "Memo investasi / keputusan alokasi modal", "Memo", "Desk / CIO", { tujuan: "Menjadi dasar keputusan alokasi modal.", ruang: "Usulan yang lolos DD.", poin: ["Ringkasan dan nilai investasi.", "Analisis risiko dan sensitivitas.", "Valuasi dan asumsi.", "Rekomendasi dan alternatif.", "Keputusan IC."], bukti: "Memo + risalah IC.", review: "Per keputusan." }],
    ["D-10", "Risalah komite investasi dan resolusi", "Risalah", "Sekretaris komite", { tujuan: "Mencatat keputusan komite investasi.", ruang: "Rapat IC.", poin: ["Peserta dan kuorum.", "Agenda dan materi.", "Keputusan: setuju / tolak / tunda.", "Syarat dan tenggat.", "Konflik kepentingan."], bukti: "Risalah + resolusi.", review: "Per rapat." }],
    ["D-11", "Checklist penutupan / settlement transaksi", "Checklist", "COO / Deal lead", { tujuan: "Memastikan serah terima aset dan dana berjalan tanpa selisih.", ruang: "Penutupan transaksi.", poin: ["Dokumen ditandatangani.", "Dana dan aset bertukar.", "Rekonsiliasi bank/kustodian.", "Pajak dan biaya.", "Bukti serah terima."], bukti: "Checklist lengkap.", review: "Per transaksi." }],
    ["D-12", "Register aset dan lembar monitoring periodik", "Register", "Asset owner", { tujuan: "Memantau nilai dan kondisi setiap aset.", ruang: "160 instrumen.", poin: ["ID, kelompok, dan pemilik.", "Nilai awal dan nilai berjalan.", "Kondisi dan risiko.", "Jadwal monitoring.", "Tindak lanjut."], bukti: "Register mutakhir.", review: "Bulanan (K-19)." }],
    ["D-13", "Onboarding pihak lawan / vendor / konsultan", "Onboarding", "Procurement / Compliance", { tujuan: "Memastikan pihak lawan sah dan terdaftar sebelum bekerja.", ruang: "111 vendor.", poin: ["Legalitas, NPWP, dan rekening.", "Sanksi dan APU-PPT.", "Pemilik manfaat.", "NDA dan kontrak.", "Penanggung jawab."], bukti: "Berkap onboarding lengkap.", review: "Saat vendor baru." }],
    ["D-14", "Kerangka evaluasi dan pemilihan vendor", "Kerangka", "Procurement", { tujuan: "Menilai vendor dengan kriteria yang sama dan terdokumentasi.", ruang: "Pengadaan.", poin: ["Kriteria teknis, komersial, dan risiko.", "Bobot dan ambang.", "Cara pembandingan penawaran.", "Konflik kepentingan.", "Alasan pemilihan."], bukti: "Lembar evaluasi terisi.", review: "Per pengadaan." }],
    ["D-15", "Kerangka perjanjian jasa / scope of work", "Kontrak", "Legal / sponsor", { tujuan: "Menetapkan lingkup, harga, dan konsekuensi secara tertulis.", ruang: "Jasa profesional & vendor.", poin: ["Lingkup dan luar lingkup.", "Harga, termin, dan pajak.", "SLA dan penalti.", "Kerahasiaan dan data.", "Pengakhiran dan sengketa."], bukti: "Kontrak ditandatangani.", review: "Saat perpanjangan." }],
    ["D-16", "Surat resmi permohonan/klarifikasi kepada instansi", "Surat", "Legal / Compliance", { tujuan: "Komunikasi resmi dengan instansi memiliki jejak.", ruang: "Korespondensi resmi.", poin: ["Nomor, tanggal, dan tujuan.", "Isi permohonan/klarifikasi.", "Lampiran.", "Bukti pengiriman.", "Tindak lanjut."], bukti: "Surat + bukti kirim.", review: "Per surat." }],
    ["D-17", "Surat permintaan proposal/kemitraan", "Surat", "Sponsor unit", { tujuan: "Meminta penawaran secara tertulis dan dapat dibandingkan.", ruang: "Pengadaan/kemitraan.", poin: ["Lingkup yang diminta.", "Kriteria dan tenggat.", "Format penawaran.", "Kontak dan kanal.", "Kerahasiaan."], bukti: "Surat terkirim.", review: "Per pengadaan." }],
    ["D-18", "Board pack / laporan Direksi berkala", "Laporan", "Sekretariat Direksi", { tujuan: "Memberi gambaran kinerja dan risiko kepada Direksi.", ruang: "Bulanan/triwulanan.", poin: ["Kinerja dan posisi.", "Risiko utama dan mitigasi.", "Keputusan yang diminta.", "Anggaran dan realisasi.", "Lampiran."], bukti: "Board pack terbit.", review: "Per periode." }],
    ["D-19", "Paket tutup buku bulanan", "Tutup buku", "CFO / Finance", { tujuan: "Menutup pembukuan bulanan dengan jejak yang bisa diaudit.", ruang: "Semua PT.", poin: ["Rekonsiliasi bank dan kustodian.", "Accrual dan prepaid.", "Validasi saldo.", "Laporan keuangan.", "Checklist tanda tangan."], bukti: "Paket tutup buku.", review: "Bulanan (K-11)." }],
    ["D-20", "Laporan risiko dan kepatuhan berkala", "Laporan", "Risk / Compliance", { tujuan: "Melaporkan risiko dan kepatuhan secara teratur.", ruang: "7 entitas.", poin: ["Risiko utama dan pergerakannya.", "Pelanggaran dan tindakan.", "Status izin dan kewajiban.", "Rekomendasi.", "Tenggat tindak lanjut."], bukti: "Laporan terbit.", review: "Triwulanan (K-23)." }],
    ["D-21", "Risalah rapat dan action log", "Risalah", "Sekretariat rapat", { tujuan: "Memastikan keputusan rapat menjadi tindakan yang terlacak.", ruang: "Semua rapat.", poin: ["Peserta dan agenda.", "Keputusan.", "Action, pemilik, tenggat.", "Status action.", "Eskalasi keterlambatan."], bukti: "Risalah + action log.", review: "Per rapat." }],
    ["D-22", "Notifikasi insiden / laporan awal", "Insiden", "Incident owner", { tujuan: "Melaporkan insiden cepat agar kerugian tidak membesar.", ruang: "Insiden keamanan, data, operasional.", poin: ["Waktu dan deskripsi.", "Dampak awal.", "Tindakan darurat.", "Pihak yang diberi tahu.", "Tindak lanjut."], bukti: "Notifikasi terkirim.", review: "Per insiden." }],
    ["D-23", "Legal hold / preservasi bukti", "Legal", "Legal", { tujuan: "Membekukan data yang relevan saat sengketa atau investigasi.", ruang: "Sengketa/investigasi.", poin: ["Ruang lingkup hold.", "Data yang dibekukan.", "Pihak yang dilarang menghapus.", "Durasi dan pelepasan.", "Jejak kepatuhan."], bukti: "Surat hold terkirim.", review: "Per kasus." }],
    ["D-24", "Checklist akhir hubungan kerja/vendor", "Checklist", "People / Procurement", { tujuan: "Memastikan tidak ada aset, akses, atau kewajiban tertinggal.", ruang: "Pemberhentian karyawan/vendor.", poin: ["Aset dan akses dikembalikan.", "Akun dimatikan.", "Dokumen diserahkan.", "Pembayaran terakhir.", "Evaluasi."], bukti: "Checklist lengkap.", review: "Per akhir hubungan." }],
    ["D-25", "Sertifikat disposisi/pemusnahan arsip", "Arsip", "Records Coordinator", { tujuan: "Membuktikan pemusnahan arsip sesuai retensi dan izin.", ruang: "Arsip yang melewati retensi.", poin: ["Daftar arsip dimusnahkan.", "Dasar retensi.", "Izin dan saksi.", "Cara pemusnahan.", "Nomor sertifikat."], bukti: "Sertifikat ditandatangani.", review: "Per pemusnahan." }],
    ["D-26", "Rencana serah terima arsip pasca-operasi", "Rencana", "Direksi / likuidator", { tujuan: "Menjaga arsip tetap tersedia setelah kegiatan berakhir.", ruang: "Pembubaran/likuidasi.", poin: ["Daftar arsip dan pemilik.", "Lokasi penyimpanan.", "Akses dan izin.", "Durasi simpan.", "Serah terima."], bukti: "Rencana disetujui.", review: "Saat likuidasi." }],
    ["D-27", "Register surat masuk/keluar dan bukti penyampaian", "Register", "Corsec / pemilik urusan", { tujuan: "Melacak korespondensi agar tidak ada yang hilang.", ruang: "Semua surat resmi.", poin: ["Nomor dan tanggal.", "Pengirim/penerima.", "Perihal.", "Bukti terima.", "Tindak lanjut."], bukti: "Register mutakhir.", review: "Bulanan." }],
    ["D-28", "Rencana tenaga kerja, job architecture & FTE per fase", "Rencana", "People / CFO", { tujuan: "Menetapkan kebutuhan orang dan biaya per fase.", ruang: "Fase 1–3.", poin: ["Struktur jabatan.", "FTE per fase.", "Beban biaya.", "Kriteria kenaikan fase.", "Gap dan rencani rekrut."], bukti: "Rencana disetujui.", review: "Tahunan (K-37)." }],
    ["D-29", "Checklist hubungan kerja dan onboarding individu", "Checklist", "People / Legal", { tujuan: "Memastikan administrasi kepegawaian lengkap se hari pertama.", ruang: "Karyawan & freelancer.", poin: ["Kontrak dan addendum.", "NPWP, BPJS, rekening.", "Akses sistem.", "Peralatan.", "Pendamping."], bukti: "Checklist lengkap.", review: "Per onboarding." }],
    ["D-30", "NDA / confidentiality & data-room access request", "NDA", "Legal", { tujuan: "Melindungi informasi saat memberi akses data room.", ruang: "Pihak luar.", poin: ["Pihak dan tujuan.", "Ruang lingkup kerahasiaan.", "Durasi.", "Pengecualian.", "Konsekuensi."], bukti: "NDA ditandatangani.", review: "Per akses." }],
    ["D-31", "Register master dokumen & metadata", "Register", "Records Coordinator", { tujuan: "Menjadi indeks tunggal seluruh dokumen.", ruang: "D-00…D-32 + dokumen lain.", poin: ["ID, judul, versi.", "Pemilik dan klasifikasi.", "Retensi.", "Lokasi.", "Status."], bukti: "Register lengkap.", review: "Bulanan." }],
    ["D-32", "Kebijakan pembayaran tetap pihak ketiga & dana cadangan 10 tahun (DCPT)", "Kebijakan", "CFO / CIO", { tujuan: "Menjaga kemampuan membayar kewajiban tetap 10 tahun ke depan.", ruang: "111 vendor & 12 komponen biaya.", poin: ["Biaya tetap bulanan.", "Rumus DCPT 120×.", "Sumber dana dan top-up.", "Ambang 110%.", "Review tahunan."], bukti: "Kebijakan berlaku + saldo DCPT.", review: "Tahunan (K-38)." }]
  ];

  function fillDocuments() {
    const db = JSON.parse(localStorage.getItem("kai-onefile-db-v1") || "{}");
    db.documents = db.documents || [];
    const have = new Set(db.documents.map((d) => d.Judul));
    let n = 0;
    DOK.forEach((r, i) => {
      const judul = r[1];
      if (have.has(judul)) return;
      const b = r[4];
      const isi = "TUJUAN\n" + b.tujuan + "\n\nRUANG LINGKUP\n" + b.ruang + "\n\nKETENTUAN\n" + b.poin.map((p, k) => (k + 1) + ". " + p).join("\n") + "\n\nBUKTI\n" + b.bukti + "\n\nREVIEW\n" + b.review;
      db.documents.push({
        ID: "DOK-" + r[0],
        Judul: judul,
        Jenis: r[2],
        Oleh: r[3],
        Isi: isi,
        Tanggal: now().slice(0, 10),
        versi: 1,
        statusDok: "Final",
        retensiSampai: "",
        tte: "",
        entitas: "",
        tautanTransaksi: ""
      });
      n++;
    });
    localStorage.setItem("kai-onefile-db-v1", JSON.stringify(db));
    return n;
  }

  function tabDocs() {
    const db = JSON.parse(localStorage.getItem("kai-onefile-db-v1") || "{}");
    const docs = db.documents || [];
    const have = new Set(docs.map((d) => d.Judul));
    const missing = DOK.filter((r) => !have.has(r[1])).length;
    const rows = DOK.map((r) => {
      const ada = have.has(r[1]);
      return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td><td>" + esc(r[3]) + "</td><td>" + (ada ? '<span class="kai-reg-yes">Final</span>' : '<span class="kai-due-late">draf</span>') + "</td></tr>";
    });
    return '<p class="kai-reg-note">L08 · 33 dokumen. Tombol di bawah mengisi draf dengan isi lengkap (tujuan, ruang lingkup, ketentuan, bukti, review) ke modul Dokumen.</p>' +
      '<div class="kai-backup-grid"><button type="button" class="kai-backup-btn" id="kai-fill-docs"><b>⬇ Isi ' + missing + ' draf tersisa</b><span>menulis ke modul Dokumen</span></button>' +
      '<button type="button" class="kai-backup-btn" id="kai-fill-cetak"><b>⎙ Cetak daftar</b><span>33 judul + pemilik</span></button></div>' +
      tbl(["ID", "Judul", "Jenis", "Pemilik", "Status"], rows);
  }

  /* ============================================================
     3 · KALENDER .ICS (L12)
     ============================================================ */
  const JADWAL = [
    ["K-01", "Harian", "Rekonsiliasi kas & saldo bank", "S3"], ["K-02", "Harian", "Cek settlement jatuh tempo", "S4"],
    ["K-03", "Harian", "Absensi & izin masuk", "S6"], ["K-04", "Harian", "Persetujuan antrean (kas/intake)", "S1"],
    ["K-05", "Harian", "Insiden pasar/kripto (bila ada posisi)", "D5"], ["K-06", "Mingguan", "Pipeline intake & status DD", "S1"],
    ["K-07", "Mingguan", "Kas kecil & uang muka", "S3"], ["K-08", "Mingguan", "Jadwal inspeksi aset fisik", "D7-D12"],
    ["K-09", "Mingguan", "Tiket IT & akses baru", "S10"], ["K-10", "Mingguan", "Proyeksi kas 13 minggu", "S3"],
    ["K-11", "Bulanan", "Tutup buku & laporan keuangan per PT", "S3"], ["K-12", "Bulanan", "Rekonsiliasi bank & kustodian", "S3, S4"],
    ["K-13", "Bulanan", "Rekap absensi & cuti → payroll", "S6"], ["K-14", "Bulanan", "PPh 21 setor & lapor", "S3"],
    ["K-15", "Bulanan", "PPh 23/PPN/PPh final", "S3"], ["K-16", "Bulanan", "BPJS setor", "S6"],
    ["K-17", "Bulanan", "Tagihan vendor & termin", "S3"], ["K-18", "Bulanan", "Laporan ke Direksi", "S1"],
    ["K-19", "Bulanan", "Update harga & nilai portofolio", "S4"], ["K-20", "Bulanan", "Review akses & akun nonaktif", "S10"],
    ["K-21", "Bulanan", "Arsip LOG & backup", "S10"], ["K-22", "Triwulanan", "Laporan ke Komisaris", "S8"],
    ["K-23", "Triwulanan", "Review risiko & register", "S2"], ["K-24", "Triwulanan", "Review kontrak & vendor", "S5"],
    ["K-25", "Triwulanan", "Review KPI 12 desk", "S1"], ["K-26", "Triwulanan", "Uji pemulihan backup", "S10"],
    ["K-27", "Semesteran", "Appraisal properti & aset fisik", "D7, D8"], ["K-28", "Semesteran", "Review polis asuransi", "S12"],
    ["K-29", "Semesteran", "Audit internal 1 tema", "S9"], ["K-30", "Semesteran", "Review pajak & transfer pricing", "S3"],
    ["K-31", "Tahunan", "RUPS & pengesahan laporan", "S1"], ["K-32", "Tahunan", "SPT badan 7 entitas", "S3"],
    ["K-33", "Tahunan", "Audit KAP & laporan auditor", "S9"], ["K-34", "Tahunan", "Perpanjangan izin & NIB", "S5"],
    ["K-35", "Tahunan", "Perpanjangan asuransi & sertifikat", "S12"], ["K-36", "Tahunan", "Review kebijakan (D-xx) & LoA", "S5"],
    ["K-37", "Tahunan", "Penilaian kinerja & skema gaji", "S6"], ["K-38", "Tahunan", "Top-up DCPT (120× biaya tetap)", "S3"],
    ["K-39", "Tahunan", "Review strategi 160 aset & alokasi", "S1"], ["K-40", "Tahunan", "Rencana TI & anggaran tahun berikut", "S10"]
  ];
  const RRULE = { Harian: "FREQ=DAILY", Mingguan: "FREQ=WEEKLY", Bulanan: "FREQ=MONTHLY", Triwulanan: "FREQ=MONTHLY;INTERVAL=3", Semesteran: "FREQ=MONTHLY;INTERVAL=6", Tahunan: "FREQ=YEARLY" };
  function icsDate(d) {
    return d.toLocaleString("sv-SE", { timeZone: "Asia/Jakarta", hour12: false }).replace(/[-:]/g, "").replace(" ", "T") + "00";
  }
  function buildIcs() {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kantor AI//Kewajiban//ID", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Kewajiban Kantor AI"];
    JADWAL.forEach((r, i) => {
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(9 + (i % 8), 0, 0, 0);
      const end = new Date(start.getTime() + 30 * 60000);
      lines.push("BEGIN:VEVENT", "UID:kai-" + r[0] + "@kantor-ai", "DTSTAMP:" + icsDate(new Date()), "DTSTART:" + icsDate(start), "DTEND:" + icsDate(end), "RRULE:" + RRULE[r[1]], "SUMMARY:" + r[2].replace(/([,;])/g, "\\$1"), "DESCRIPTION:Pemilik " + r[3] + " · " + r[0], "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }
  function tabIcs() {
    return '<p class="kai-reg-note">L12 · 40 kewajiban. Berkas .ics dapat diimpor ke Google Calendar / Outlook, lengkap dengan pengulangan sesuai frekuensi.</p>' +
      '<div class="kai-backup-grid"><button type="button" class="kai-backup-btn" id="kai-ics"><b>⬇ Unduh kalender (.ics)</b><span>40 kejadian berulang</span></button>' +
      '<button type="button" class="kai-backup-btn" id="kai-ics-cetak"><b>⎙ Cetak jadwal</b><span>40 baris</span></button></div>' +
      tbl(["ID", "Frekuensi", "Kewajiban", "Pemilik", "Pengulangan"], JADWAL.map((r) => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td><td>" + esc(r[3]) + "</td><td><code>" + esc(RRULE[r[1]]) + "</code></td></tr>"));
  }

  /* ============================================================
     4 · BUKTI UJI KONTROL INTERNAL (L13)
     ============================================================ */
  const PRINSIP = ["Pemisahan tugas (maker != checker)", "Limit otorisasi berjenjang", "Empat mata (4-eyes)", "Rekonsiliasi independen", "Pemisahan per badan hukum", "Delegasi/proxy wewenang", "Penutupan periode", "Immutabilitas catatan", "Jejak audit lengkap", "Review akses & offboarding"];
  const UJI = ["Uji normal (jalur benar)", "Uji batas (nilai ambang)", "Uji penyalahgunaan (orang sama / di luar wewenang)", "Uji bukti (dokumen & jejak)"];
  function tabBukti() {
    const b = read("kai-bukti-v1", {});
    const rows = [];
    let n = 0;
    PRINSIP.forEach((p) => UJI.forEach((u) => {
      n++;
      const id = "X-" + String(n).padStart(2, "0");
      const v = b[id] || {};
      rows.push("<tr><td>" + esc(id) + "</td><td>" + esc(p) + "</td><td>" + esc(u) + "</td>" +
        "<td><input class='kai-inp' data-bk='" + id + "|bukti' value='" + esc(v.bukti || "") + "' placeholder='no. bukti / tautan'></td>" +
        "<td><input class='kai-inp' data-bk='" + id + "|tanggal' type='date' value='" + esc(v.tanggal || "") + "'></td>" +
        "<td><input class='kai-inp' data-bk='" + id + "|pic' value='" + esc(v.pic || "") + "' placeholder='PIC'></td></tr>");
    }));
    const filled = Object.keys(b).filter((k) => b[k] && b[k].bukti).length;
    return '<p class="kai-reg-note">L13 · 40 uji. Bukti terisi <b id="kai-bukti-sum">' + filled + "/40</b>. Bukti wajib berupa nomor dokumen atau tautan, bukan keterangan lisan.</p>" + tbl(["ID", "Prinsip", "Uji", "Bukti", "Tanggal", "PIC"], rows);
  }

  /* ============================================================
     5 · RETENSI DATA PRIBADI (L14)
     ============================================================ */
  const PDP = [
    ["PDP-01", "Nama karyawan", "selama kerja +5 thn", "users"], ["PDP-02", "Email kantor", "selama kerja", "users"],
    ["PDP-03", "Email pribadi pemilik", "selama kerja", "users"], ["PDP-04", "Jabatan & unit", "selama kerja", "users"],
    ["PDP-05", "PIN akses offline", "diganti tiap 90 hari", "users"], ["PDP-06", "Foto wajah absensi", "90 hari", "attendance"],
    ["PDP-07", "Koordinat GPS absensi", "1 thn", "attendance"], ["PDP-08", "Waktu & pola kehadiran", "5 thn", "attendance"],
    ["PDP-09", "Catatan cuti/izin", "5 thn", "attendance"], ["PDP-10", "Nomor rekening gaji", "10 thn", "users"],
    ["PDP-11", "NPWP karyawan", "10 thn", "users"], ["PDP-12", "Data BPJS", "10 thn", "users"],
    ["PDP-13", "Kontrak kerja & adendum", "10 thn setelah berakhir", "documents"], ["PDP-14", "Data penilaian kinerja", "5 thn", "users"],
    ["PDP-15", "Data vendor perorangan", "10 thn", "documents"], ["PDP-16", "Kontak tamu & buku tamu", "1 thn", "attendance"],
    ["PDP-17", "Log akses & perangkat", "2 thn", "audit"], ["PDP-18", "Rekaman rapat", "2 thn", "documents"],
    ["PDP-19", "Data pelamar", "6 bln", "users"], ["PDP-20", "Data KAP/auditor eksternal", "7 thn", "documents"]
  ];
  function retentionMonths(txt) {
    if (/90 hari/.test(txt)) return 3;
    if (/6 bln/.test(txt)) return 6;
    if (/1 thn/.test(txt)) return 12;
    if (/2 thn/.test(txt)) return 24;
    if (/5 thn/.test(txt)) return 60;
    if (/7 thn/.test(txt)) return 84;
    if (/10 thn/.test(txt)) return 120;
    return 999;
  }
  function purgeExpired() {
    const db = JSON.parse(localStorage.getItem("kai-onefile-db-v1") || "{}");
    let removed = 0;
    const cut = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
    if (Array.isArray(db.attendance)) {
      const before = db.attendance.length;
      db.attendance = db.attendance.filter((x) => String(x.Tanggal || "") >= cut);
      removed += before - db.attendance.length;
    }
    if (Array.isArray(db.documents)) {
      const today = now().slice(0, 10);
      const before = db.documents.length;
      db.documents = db.documents.filter((x) => !x.retensiSampai || x.retensiSampai >= today);
      removed += before - db.documents.length;
    }
    localStorage.setItem("kai-onefile-db-v1", JSON.stringify(db));
    return removed;
  }
  function tabRetensi() {
    return '<p class="kai-reg-note">L14 · 20 jenis data. Retensi dihitung dari ketentuan; pembersihan hanya menghapus data yang sudah melewati batas (foto absensi &gt;90 hari, dokumen yang retensiSampai-nya lewat).</p>' +
      '<div class="kai-backup-grid"><button type="button" class="kai-backup-btn" id="kai-purge"><b>✕ Hapus yang lewat retensi</b><span>hanya data kedaluwarsa</span></button></div>' +
      '<div id="kai-purge-out" class="kai-backup-out" aria-live="polite"></div>' +
      tbl(["ID", "Data pribadi", "Retensi", "Batas (bulan)"], PDP.map((r) => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td><td>" + retentionMonths(r[2]) + "</td></tr>"));
  }

  /* ============================================================
     6 · REALISASI VS ANGGARAN (L19)
     ============================================================ */
  const KOMPONEN = [
    ["Y-01", "Payroll 26 FTE", 12500000], ["Y-02", "BPJS + THR", 1375000], ["Y-03", "Sewa 3 lantai", 150000000],
    ["Y-04", "Utilitas & internet", 35000000], ["Y-05", "Alat inti (111 vendor)", 10000000], ["Y-06", "Jasa profesional", 60000000],
    ["Y-07", "Asuransi", 25000000], ["Y-08", "Freelancer 12 orang", 36000000], ["Y-09", "Cadangan DCPT", 12185000],
    ["Y-10", "Biaya per transaksi", 500000], ["Y-11", "Anggaran TI tahunan", 200000000], ["Y-12", "Biaya per sistem", 10000000]
  ];
  function tabRealisasi() {
    const b = read("kai-biaya-v1", {});
    const r = read("kai-realisasi-v1", {});
    const rows = KOMPONEN.map((k) => {
      const ang = b[k[0]] == null ? k[2] : Number(b[k[0]]);
      const rea = Number(r[k[0]] || 0);
      const sisa = ang - rea;
      const cls = rea > ang ? "kai-due-late" : "";
      return "<tr class='" + cls + "'><td>" + esc(k[0]) + "</td><td>" + esc(k[1]) + "</td><td class='kai-rp'>" + rp(ang) + "</td>" +
        "<td><input class='kai-inp kai-num' data-re='" + k[0] + "' type='number' min='0' step='1000000' value='" + rea + "'></td>" +
        "<td class='kai-rp'>" + (sisa < 0 ? "lewat " + rp(-sisa) : rp(sisa)) + "</td><td>" + (ang ? Math.round((rea / ang) * 100) : 0) + "%</td></tr>";
    }).join("");
    return '<p class="kai-reg-note">L19 · realisasi vs anggaran. Merah bila realisasi melebihi anggaran.</p>' +
      tbl(["ID", "Komponen", "Anggaran", "Realisasi", "Sisa anggaran", "Serapan"], rows) +
      '<div class="kai-total"><span>Total serapan</span><b id="kai-re-total">—</b></div>';
  }
  function reTotal(pane) {
    const b = read("kai-biaya-v1", {});
    const r = read("kai-realisasi-v1", {});
    let a = 0, re = 0;
    KOMPONEN.forEach((k) => { a += b[k[0]] == null ? k[2] : Number(b[k[0]]); re += Number(r[k[0]] || 0); });
    const el = $("#kai-re-total", pane);
    if (el) el.textContent = rp(re) + " / " + rp(a) + " · " + (a ? Math.round((re / a) * 100) : 0) + "%";
  }

  /* ============================================================
     7 · MITRA & ASURANSI (B-09, B-12)
     ============================================================ */
  function tabMitra() {
    const m = read("kai-mitra-v1", { notaris: [{ nama: "", status: "Belum" }, { nama: "", status: "Belum" }], kjpp: [{ nama: "", status: "Belum" }, { nama: "", status: "Belum" }] });
    const polis = read("kai-polis-v1", [
      { jenis: "Asuransi aset", nopol: "", akhir: "" }, { jenis: "D&O", nopol: "", akhir: "" },
      { jenis: "Siber", nopol: "", akhir: "" }, { jenis: "Kesehatan karyawan", nopol: "", akhir: "" }
    ]);
    const today = now().slice(0, 10);
    const polisRows = polis.map((p, i) => {
      const sisa = p.akhir ? Math.round((new Date(p.akhir) - new Date()) / 864e5) : null;
      const cls = sisa !== null && sisa <= 90 ? "kai-due-soon" : "";
      return "<tr class='" + cls + "'><td>" + esc(p.jenis) + "</td><td><input class='kai-inp' data-pol='" + i + "|nopol' value='" + esc(p.nopol || "") + "'></td>" +
        "<td><input class='kai-inp' data-pol='" + i + "|akhir' type='date' value='" + esc(p.akhir || "") + "'></td>" +
        "<td>" + (sisa === null ? "—" : sisa <= 0 ? "kedaluwarsa" : sisa + " hari") + "</td></tr>";
    }).join("");
    const mitraRows = [["notaris", "Notaris"], ["kjpp", "KJPP / Appraiser"]].map((k) => k[1]).map((label, i) => {
      const key = i === 0 ? "notaris" : "kjpp";
      return "<tr><td>" + esc(label) + "</td><td>" + [0, 1].map((j) => "<input class='kai-inp' data-mit='" + key + "|" + j + "' value='" + esc(m[key][j].nama || "") + "' placeholder='mitra " + (j + 1) + "'>").join(" ") + "</td><td>" + [0, 1].map((j) => "<select class='kai-reg-sel' data-mitst='" + key + "|" + j + "'><option" + (m[key][j].status === "Belum" ? " selected" : "") + ">Belum</option><option" + (m[key][j].status === "Surat ketersediaan" ? " selected" : "") + ">Surat ketersediaan</option><option" + (m[key][j].status === "Aktif" ? " selected" : "") + ">Aktif</option></select>").join(" ") + "</td></tr>";
    }).join("");
    return '<h3>B-09 · Mitra kedua (notaris & KJPP)</h3><p class="kai-reg-note">Wajib 2 mitra terdaftar per jenis, masing-masing menandatangani surat ketersediaan.</p>' + tbl(["Jenis", "Mitra 1 & 2", "Status"], mitraRows) +
      '<h3>B-12 · Polis asuransi</h3><p class="kai-reg-note">Polis yang akan habis ≤90 hari ditandai. Review 2× setahun (K-28).</p>' + tbl(["Jenis", "Nomor polis", "Berakhir", "Sisa"], polisRows) +
      '<div class="kai-backup-grid"><button type="button" class="kai-backup-btn" id="kai-mitra-save"><b>Simpan mitra &amp; polis</b><span>tersimpan di browser</span></button></div>';
  }

  /* ============================================================
     8 · BINDING (dipanggil phase3 setelah render)
     ============================================================ */
  function bind(pane, key) {
    if (!pane) return;
    if (key === "dok") {
      const b = $("#kai-fill-docs", pane);
      if (b) b.addEventListener("click", () => {
        const n = fillDocuments();
        banner(n + " dokumen diisi ke modul Dokumen (status Final).");
        setTimeout(() => { const ev = new CustomEvent("kai-rerender", { detail: { key: "dok" } }); window.dispatchEvent(ev); }, 200);
      });
      const c = $("#kai-fill-cetak", pane);
      if (c) c.addEventListener("click", () => window.print());
    }
    if (key === "ics") {
      const b = $("#kai-ics", pane);
      if (b) b.addEventListener("click", () => download("kai-kewajiban.ics", buildIcs(), "text/calendar"));
      const c = $("#kai-ics-cetak", pane);
      if (c) c.addEventListener("click", () => window.print());
    }
    if (key === "bukti") {
      const store = () => {
        const o = read("kai-bukti-v1", {});
        $$("[data-bk]", pane).forEach((i) => {
          const [id, f] = i.getAttribute("data-bk").split("|");
          o[id] = o[id] || {}; o[id][f] = i.value;
        });
        write("kai-bukti-v1", o);
        const n = Object.keys(o).filter((k) => o[k].bukti).length;
        const s = $("#kai-bukti-sum", pane); if (s) s.textContent = n + "/40";
      };
      $$("[data-bk]", pane).forEach((i) => i.addEventListener("input", store));
    }
    if (key === "retensi") {
      const b = $("#kai-purge", pane);
      if (b) b.addEventListener("click", () => {
        const n = purgeExpired();
        $("#kai-purge-out", pane).innerHTML = "<p class='kai-backup-ok'>" + n + " catatan melewati retensi dihapus.</p>";
        banner("Retensi: " + n + " catatan dihapus.");
      });
    }
    if (key === "real") {
      $$("[data-re]", pane).forEach((i) => i.addEventListener("input", () => {
        const o = read("kai-realisasi-v1", {}); o[i.getAttribute("data-re")] = i.value; write("kai-realisasi-v1", o); reTotal(pane);
      }));
      reTotal(pane);
    }
    if (key === "mitra") {
      $$("[data-mit]", pane).forEach((i) => i.addEventListener("input", () => {
        const o = read("kai-mitra-v1", { notaris: [{}, {}], kjpp: [{}, {}] });
        const [k, j] = i.getAttribute("data-mit").split("|");
        o[k] = o[k] || []; o[k][j] = o[k][j] || {}; o[k][j].nama = i.value; write("kai-mitra-v1", o);
      }));
      $$("[data-mitst]", pane).forEach((i) => i.addEventListener("change", () => {
        const o = read("kai-mitra-v1", { notaris: [{}, {}], kjpp: [{}, {}] });
        const [k, j] = i.getAttribute("data-mitst").split("|");
        o[k] = o[k] || []; o[k][j] = o[k][j] || {}; o[k][j].status = i.value; write("kai-mitra-v1", o);
      }));
      $$("[data-pol]", pane).forEach((i) => i.addEventListener("input", () => {
        const o = read("kai-polis-v1", []);
        const [j, f] = i.getAttribute("data-pol").split("|");
        o[j] = o[j] || {}; o[j][f] = i.value; write("kai-polis-v1", o);
      }));
      const sv = $("#kai-mitra-save", pane);
      if (sv) sv.addEventListener("click", () => banner("Mitra & polis tersimpan."));
    }
  }

  /* ============================================================
     9 · BOOT
     ============================================================ */
  function fixBadge() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    let n;
    while ((n = walker.nextNode())) if (/lengkapi semua|\[placeholder\]/i.test(n.nodeValue || "")) hits.push(n);
    hits.forEach((node) => {
      const v = String(node.nodeValue);
      node.nodeValue = /contoh draft/i.test(v) ? "Isi lengkap · siap disesuaikan" : v.replace(/lengkapi semua/gi, "draf lengkap").replace(/\[placeholder\]/gi, "[siap disesuaikan]");
    });
    return hits.length;
  }

  function boot() {
    const run = () => gateCheck();
    try { fixBadge(); } catch (_) {}
    let bo = null;
    try {
      bo = new MutationObserver(() => { try { fixBadge(); } catch (_) {} });
      bo.observe(document.body, { childList: true, subtree: true, characterData: false });
      setTimeout(() => { if (bo) bo.disconnect(); }, 60000);
    } catch (_) {}
    const obs = new MutationObserver(() => run());
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 45000);
    setTimeout(run, 900);
    document.addEventListener("click", (e) => {
      if (e.target.closest('nav[aria-label="Navigasi utama portal"]')) setTimeout(run, 350);
    }, true);
    window.__KAI4 = { bind, tabDocs, tabIcs, tabBukti, tabRetensi, tabRealisasi, tabMitra, buildIcs, DOK, JADWAL, PDP, KOMPONEN, purgeExpired, fillDocuments };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

/* Tab "Mitigasi Atomik (848)" pada Register — hanya dapat dibuka setelah masuk (peran P/M/Staf/Auditor). */
(function () {
  "use strict";
  var KEY = "kai-mitigasi-status-v1", DATA = null, state = { layer: "L01", q: "", st: "" };
  var OPTS = ["Diterapkan", "Sebagian", "Belum", "Luar berkas", "Tidak berlaku"];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>"); }
  function data() { if (!DATA) { try { DATA = JSON.parse(document.getElementById("kai-mitigasi-data").textContent); } catch (e) { DATA = { layers: [] }; } } return DATA; }
  function store() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function statusOf(l, i, o) { var k = l.id + ":" + l.rows[i][0]; return (o || store())[k] || l.st[i]; }
  function counts() { var o = store(), c = { total: 0 }; data().layers.forEach(function (l) { l.rows.forEach(function (r, i) { var s = statusOf(l, i, o); c[s] = (c[s] || 0) + 1; c.total++; }); }); return c; }
  function body() {
    if (!(window.__kaiToolAllowed && window.__kaiToolAllowed("kai-btn-reg"))) return '<p class="kai-reg-note">Register ini hanya tersedia setelah masuk.</p>';
    var d = data(), o = store(), l = d.layers.filter(function (x) { return x.id === state.layer; })[0] || d.layers[0];
    if (!l) return '<p class="kai-reg-note">Data mitigasi tidak tersedia.</p>';
    var c = counts(), q = state.q.trim().toLowerCase();
    var rows = [];
    l.rows.forEach(function (r, i) {
      var s = statusOf(l, i, o);
      if (state.st && s !== state.st) return;
      if (q && r.join(" ").toLowerCase().indexOf(q) < 0) return;
      rows.push("<tr>" + r.map(function (cell, j) { return "<td>" + (j === 0 ? "<code>" + esc(cell) + "</code>" : md(cell)) + "</td>"; }).join("") +
        '<td><select class="kai-reg-sel kai-mit-sel" data-mit="' + esc(l.id + ":" + r[0]) + '" aria-label="Status ' + esc(r[0]) + '">' +
        OPTS.map(function (x) { return '<option value="' + x + '"' + (x === s ? " selected" : "") + ">" + x + "</option>"; }).join("") + "</select></td></tr>");
    });
    return '<div class="kai-mit-sum" role="status"><span class="kai-mit-chip">Total ' + c.total + ' butir</span><span class="kai-mit-chip d">Diterapkan ' + (c["Diterapkan"] || 0) + '</span><span class="kai-mit-chip s">Sebagian ' + (c["Sebagian"] || 0) + '</span><span class="kai-mit-chip b">Belum ' + (c["Belum"] || 0) + '</span><span class="kai-mit-chip x">Luar berkas ' + (c["Luar berkas"] || 0) + "</span>" + (c["Tidak berlaku"] ? '<span class="kai-mit-chip">Tidak berlaku ' + c["Tidak berlaku"] + "</span>" : "") + "</div>" +
      '<div class="kai-mit-bar"><label class="sr-only" for="kai-mit-layer">Lapis</label><select id="kai-mit-layer">' +
      d.layers.map(function (x) { return '<option value="' + x.id + '"' + (x.id === l.id ? " selected" : "") + ">" + esc(x.id + " · " + x.title) + "</option>"; }).join("") + "</select>" +
      '<label class="sr-only" for="kai-mit-st">Status</label><select id="kai-mit-st"><option value="">Semua status</option>' + OPTS.map(function (x) { return '<option value="' + x + '"' + (x === state.st ? " selected" : "") + ">" + x + "</option>"; }).join("") + "</select>" +
      '<label class="sr-only" for="kai-mit-q">Saring</label><input id="kai-mit-q" type="search" placeholder="Saring butir di lapis ini…" value="' + esc(state.q) + '"></div>' +
      '<p class="kai-reg-note">Menampilkan ' + rows.length + " dari " + l.rows.length + " butir " + esc(l.id) + '. <b>Diterapkan</b> = sudah ada di berkas ini · <b>Sebagian</b> = mekanisme ada, butuh data/bukti nyata · <b>Belum</b> = perlu pengembangan lanjutan · <b>Luar berkas</b> = tindakan organisasi/hukum/pihak ketiga.</p>' +
      '<div class="kai-reg-wrap"><table class="kai-reg-table"><thead><tr>' + l.head.map(function (h) { return '<th scope="col">' + esc(h) + "</th>"; }).join("") + '<th scope="col">Status</th></tr></thead><tbody>' +
      (rows.join("") || '<tr><td colspan="' + (l.head.length + 1) + '">Tidak ada butir yang cocok.</td></tr>') + "</tbody></table></div>";
  }
  function rerender(keepFocus) {
    var pane = document.getElementById("kai-reg-pane"); if (!pane || !document.getElementById("kai-mit-layer")) return;
    pane.innerHTML = body();
    if (keepFocus) { var q = document.getElementById("kai-mit-q"); if (q) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (e) {} } }
  }
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t) return;
    if (t.id === "kai-mit-layer") { state.layer = t.value; state.q = ""; rerender(); }
    else if (t.id === "kai-mit-st") { state.st = t.value; rerender(); }
    else if (t.classList && t.classList.contains("kai-mit-sel")) { e.stopPropagation(); var o = store(); o[t.getAttribute("data-mit")] = t.value; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (x) {} rerender(); }
  }, true);
  var timer = null;
  document.addEventListener("input", function (e) { if (e.target && e.target.id === "kai-mit-q") { state.q = e.target.value; clearTimeout(timer); timer = setTimeout(function () { rerender(true); }, 220); } });
  window.__kaiMitigasiBody = body;
  window.__kaiMitigasiCounts = function () { return window.__kaiToolAllowed && window.__kaiToolAllowed("kai-btn-reg") ? counts() : null; };
})();
