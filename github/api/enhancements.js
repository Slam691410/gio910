module.exports = async function handler(req, res) {
  const SRC_URL =
    "https://cdn.jsdelivr.net/gh/Slam691410/gio910@aa5acfc327c478aa47c95f90cffa05eabe491cdf/github/assets/kai-enhancements.js";
  try {
    const r = await fetch(SRC_URL);
    if (!r.ok) {
      res.status(502).send("// Upstream error " + r.status);
      return;
    }
    let js = await r.text();
    js = js.replace(
      'btn.setAttribute("aria-expanded", open ? "true" : "false");\n    if (open) {',
      'if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");\n    if (open && btn) {'
    );

    js = js.replace(
      '    b.className = "kai-mode-badge" + (IS_GAS ? " is-gas" : "");\n    b.innerHTML = IS_GAS\n      ? \'<span class="kai-mode-dot"></span> MODE APPS SCRIPT · data di server + Drive\'\n      : \'<span class="kai-mode-dot"></span> MODE DEMO LOKAL · data di browser ini\';',
      '    b.className = "kai-mode-badge is-gas";\n    b.style.cursor = "pointer";\n    b.title = "Klik untuk membuka Diagnostik Supabase Live & Realtime 36 Tabel";\n    b.innerHTML = \'<span class="kai-mode-dot"></span> LIVE POSTGRES REALTIME · Supabase gio910-api v4.5\';\n    b.addEventListener("click", () => { if (window.__KAI_OPEN_DIAG_MODAL__) window.__KAI_OPEN_DIAG_MODAL__(); });'
    );

    js = js.replace(
      'logAct("Sistem siap · mode " + (IS_GAS ? "Apps Script" : "demo lokal"), "ok");',
      'logAct("Sistem siap · Supabase + Vercel + 13 Konektor", "ok");'
    );
    js = js.replace('["Payroll 26 FTE"', '["Payroll 259 SDM"');
    js = js.replace('["Sewa 3 lantai"', '["Sewa 4 lantai"');
    js = js.replace(
      '    const addHint = (wrap) => {\n      let hint = wrap.previousElementSibling;\n      if (hint && hint.classList && hint.classList.contains("kai-table-hint")) hint.remove();\n      if (wrap.scrollWidth > wrap.clientWidth + 2) {\n        hint = document.createElement("div");\n        hint.className = "kai-table-hint";\n        hint.textContent = "Geser tabel horizontal →";\n        wrap.parentNode.insertBefore(hint, wrap);\n      }\n    };',
      '    const addHint = (wrap) => {\n      const prev = wrap.previousElementSibling;\n      const hasHint = !!(prev && prev.classList && prev.classList.contains("kai-table-hint"));\n      const needHint = wrap.scrollWidth > wrap.clientWidth + 2;\n      if (needHint && !hasHint) {\n        const hint = document.createElement("div");\n        hint.className = "kai-table-hint";\n        hint.textContent = "Geser tabel horizontal →";\n        wrap.parentNode.insertBefore(hint, wrap);\n      } else if (!needHint && hasHint) {\n        prev.remove();\n      }\n    };'
    );

    // Replace RBAC & Backup copy from Apps Script -> Supabase + Vercel + Konektor
    js = js.replace(
      'server <code>Code.gs</code> (<code>allow_()</code> + pemisahan tugas + kepemilikan data)',
      'Supabase Edge Function <code>gio910-api</code> (RBAC + pemisahan tugas + kepemilikan data)'
    );
    js = js.replace(
      'Tiga salinan: unduhan berkas, salinan di browser, dan Google Drive (bila berjalan di Apps Script).',
      'Tiga salinan: unduhan berkas, salinan di browser, dan Supabase + Google Drive (via Konektor).'
    );
    js = js.replace(
      '<b>☁ Google Drive</b><span>\' + (IS_GAS ? "Tersedia" : "Hanya di Apps Script")',
      '<b>☁ Supabase + Drive</b><span>\' + ((IS_GAS || window.__KAI_SUPABASE_BRIDGE__) ? "Tersedia via Konektor" : "Butuh Sesi")'
    );

    js = js.replace(
      '  async function boot() {\n    const ok = await waitFor(() => $("#konten-utama") && $$(\'nav[aria-label="Navigasi utama portal"] button\').length === 9, 15000, 80);\n    if (!ok) return;\n    ensureSkipLink();\n    ensureBreadcrumb();\n    ensureDock();\n    wrapTables();\n    restoreDrafts();\n    startObserver();\n    syncRoute();\n    // Indeks pencarian dibangun saat pertama kali dibuka (agar tidak menambah beban awal).\n  }',
      '  async function boot() {\n    let booted = false;\n    const tryMount = () => {\n      if (!$("#konten-utama") || $$(\'nav[aria-label="Navigasi utama portal"] button\').length < 9) return false;\n      ensureSkipLink();\n      ensureBreadcrumb();\n      ensureDock();\n      if (!booted) {\n        booted = true;\n        wrapTables();\n        restoreDrafts();\n        startObserver();\n        syncRoute();\n      }\n      return true;\n    };\n    tryMount();\n    if (document.body) {\n      const mountObs = new MutationObserver(() => tryMount());\n      mountObs.observe(document.body, { childList: true, subtree: true });\n    }\n    window.addEventListener("kai-session-change", () => { setTimeout(tryMount, 60); setTimeout(tryMount, 350); });\n  }'
    );

    js = js.replace(
      '    (function retryToolbar(n) { ensureToolbarButtons(); if (!$("#kai-btn-reg") && n < 120) setTimeout(() => retryToolbar(n + 1), 250); })(0);',
      '    ensureToolbarButtons();\n    if (document.body) {\n      new MutationObserver(() => { if ($(".kai-toolbar") && !$("#kai-btn-reg")) ensureToolbarButtons(); }).observe(document.body, { childList: true, subtree: true });\n    }\n    window.addEventListener("kai-session-change", () => { setTimeout(ensureToolbarButtons, 80); setTimeout(ensureToolbarButtons, 400); });'
    );

    js = js.replace(
      '    (function retryToolbar(n) { ensureToolbar(); if (!$("#kai-btn-ops") && n < 120) setTimeout(() => retryToolbar(n + 1), 250); })(0);',
      '    ensureToolbar();\n    if (document.body) {\n      new MutationObserver(() => { if ($(".kai-toolbar") && !$("#kai-btn-ops")) ensureToolbar(); }).observe(document.body, { childList: true, subtree: true });\n    }\n    window.addEventListener("kai-session-change", () => { setTimeout(ensureToolbar, 80); setTimeout(ensureToolbar, 400); });'
    );

    if (js.includes("function openCodegs() {")) {
      const startCg = js.indexOf("  function openCodegs() {");
      const endCg = js.indexOf("\n  function ensureToolbarButtons()", startCg);
      if (startCg !== -1 && endCg !== -1) {
        const replacement = `  function openCodegs() {
    const id = "kai-codegs-modal";
    if ($("#" + id)) { openExistingModal($("#" + id)); return; }
    const wrap = document.createElement("div");
    wrap.className = "kai-modal";
    wrap.id = id;
    wrap.innerHTML =
      '<div class="kai-modal-card"><div class="kai-modal-head"><h2>Arsitektur Aktif: Supabase + Vercel + 13 Konektor</h2><button type="button" class="kai-modal-close" aria-label="Tutup">✕</button></div>' +
      '<div class="kai-modal-body"><p class="kai-reg-note">Portal ini berjalan penuh di atas <b>Supabase Postgres + Edge Function (<code>gio910-api</code>)</b>, <b>Vercel Serverless (<code>/api/*</code>)</b>, dan <b>13 Konektor Ekosistem</b> (12 Aktif termasuk WordPress · 1 Dijeda: Dropbox) — tanpa Google Apps Script maupun Cloudflare.</p>' +
      '<ol class="kai-steps"><li><b>Backend Database &amp; Edge:</b> Supabase <code>dttclgkjfiwcovvqrckw</code> (36 Tabel Realtime + <code>gio910-api</code>).</li><li><b>Hosting, CDN &amp; Serverless:</b> Vercel <code>/api/connectors</code>, <code>/api/copy-hub</code> &amp; custom domain via <code>vercel.toml</code>.</li><li><b>Konektor Live:</b> Google Drive, Sheets, Docs, Slides, Calendar, Gmail, Figma, Notion, Linear, WordPress, Supabase &amp; Vercel.</li><li><b>Copy Hub &amp; ZIP:</b> Kelola parameter 5 Mode, SQL, Edge Function &amp; Vercel bundle di halaman Copy Hub.</li></ol>' +
      '<div class="kai-codegs-actions">' +
      '<button type="button" class="kai-backup-btn" data-cg="schema"><b>⬇ schema.sql</b><span>Supabase SQL</span></button>' +
      '<button type="button" class="kai-backup-btn" data-cg="edge"><b>⬇ gio910-api.ts</b><span>Edge Function</span></button>' +
      '<button type="button" class="kai-backup-btn" data-cg="vercel"><b>⬇ vercel.toml</b><span>Konfig Vercel</span></button>' +
      '<button type="button" class="kai-backup-btn" data-cg="copyhub"><b>↗ Copy Hub</b><span>5 Mode + ZIP</span></button>' +
      '<button type="button" class="kai-backup-btn" data-cg="conn"><b>🔌 Konektor</b><span>12 ON / 1 OFF</span></button>' +
      "</div>" +
      '<p class="kai-reg-note">Endpoint aktif: <code>/api/health</code>, <code>/api/copyhub/params</code>, <code>/api/connectors</code>, dan Realtime WebSocket 36 tabel.</p>' +
      "</div></div>";
    document.body.appendChild(wrap);
    wrap.classList.add("is-open");
    wrap.addEventListener("click", (e) => { if (e.target === wrap) wrap.classList.remove("is-open"); });
    wrap.querySelector(".kai-modal-close").addEventListener("click", () => wrap.classList.remove("is-open"));
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cg]");
      if (!b) return;
      const a = b.getAttribute("data-cg");
      if (a === "schema") window.open("/api/connectors?sub=stack-file&name=schema.sql", "_blank");
      if (a === "edge") window.open("/api/connectors?sub=stack-file&name=gio910-api.ts", "_blank");
      if (a === "vercel") window.open("/api/connectors?sub=stack-file&name=vercel.toml", "_blank");
      if (a === "copyhub") window.open("/copy-hub.html", "_blank");
      if (a === "conn") {
        wrap.classList.remove("is-open");
        if (window.__KAI_OPEN_CONNECTORS_HUB__) window.__KAI_OPEN_CONNECTORS_HUB__("connectors");
        else window.open("/ekosistem.html#gio-connectors-mount", "_blank");
      }
    });
  }
`;
        js = js.slice(0, startCg) + replacement + js.slice(endCg);
      }
    }

    js = js.replace(
      'LIVE POSTGRES REALTIME · Supabase gio910-api v4.5',
      'LIVE POSTGRES REALTIME · Supabase gio910-api v4.7'
    );

    if (js.includes('mk("kai-btn-codegs", "⚙", "Code.gs", "Backend Apps Script: unduh atau salin Code.gs", openCodegs);')) {
      js = js.replace(
        'mk("kai-btn-codegs", "⚙", "Code.gs", "Backend Apps Script: unduh atau salin Code.gs", openCodegs);',
        'mk("kai-btn-sec-zip", "🔐", "Password & ZIP", "Atur Password Akun & Unduh File ZIP Login Terenkripsi (khusus Online)", () => { if (window.__KAI_SECURITY__) window.__KAI_SECURITY__.openPasswordZipModal(); });\n    mk("kai-btn-codegs", "⚙", "Stack API", "Arsitektur Aktif: Supabase + Vercel & 13 Konektor (tanpa GAS/Cloudflare)", openCodegs);\n    if (window.__KAI_KYC__ && window.__KAI_KYC__.ensureToolbarButtons) window.__KAI_KYC__.ensureToolbarButtons();'
      );
    } else if (js.includes('mk("kai-btn-codegs", "⚙", "Stack API"')) {
      js = js.replace(
        'mk("kai-btn-codegs", "⚙", "Stack API", "Arsitektur Aktif: Supabase + Vercel & 13 Konektor (tanpa GAS/Cloudflare)", openCodegs);',
        'mk("kai-btn-sec-zip", "🔐", "Password & ZIP", "Atur Password Akun & Unduh File ZIP Login Terenkripsi (khusus Online)", () => { if (window.__KAI_SECURITY__) window.__KAI_SECURITY__.openPasswordZipModal(); });\n    mk("kai-btn-codegs", "⚙", "Stack API", "Arsitektur Aktif: Supabase + Vercel & 13 Konektor (tanpa GAS/Cloudflare)", openCodegs);\n    if (window.__KAI_KYC__ && window.__KAI_KYC__.ensureToolbarButtons) window.__KAI_KYC__.ensureToolbarButtons();'
      );
    }

    js = js.replace(
      "  async function generateCard() {\n",
      "  async function generateCard() {\n    if (window.__KAI_SECURITY__ && window.__KAI_SECURITY__.openPasswordZipModal) {\n      await window.__KAI_SECURITY__.openPasswordZipModal();\n      return;\n    }\n"
    );

    js = js.replace(
      `  function installCardLogin() {
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
      const btn = Array.from(gate.querySelectorAll("button")).find((b) => /ID\\s*&\\s*PIN/i.test(b.textContent || ""));
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
  }`,
      `  function installCardLogin() {
    const gate = document.getElementById("login-gate");
    if (!gate || document.getElementById("kai-card-login")) return;
    const box = document.createElement("div");
    box.className = "kai-card-login";
    box.innerHTML =
      '<div class="kai-card-login-inner">' +
      '<button type="button" id="kai-card-login" class="kai-card-btn">🔐 Kelola Password &amp; File ZIP Login (Khusus Online) →</button>' +
      '<span class="kai-card-hint">Login Manual kini wajib <b>ID + Password + File .ZIP Terenkripsi</b>. Unduh file .ZIP hanya saat sudah login &amp; Online.</span>' +
      "</div>";
    gate.appendChild(box);
    $("#kai-card-login", box).addEventListener("click", () => {
      if (window.__KAI_SECURITY__) window.__KAI_SECURITY__.openPasswordZipModal();
    });
  }`
    );

    js = js.replace(
      "<h3>Kartu akses darurat</h3>",
      "<h3>Password Akun &amp; File ZIP Login Terenkripsi</h3>"
    );
    js = js.replace(
      "<b>① Buat kartu (.txt)</b><span>masuk dulu; berlaku 30 hari</span>",
      "<b>① Atur Password &amp; Unduh File (.zip)</b><span>khusus Online · enkripsi AES-256-GCM</span>"
    );

    js = js.replace(
      'if (target === "drive" && IS_GAS) {\n      return new Promise((res) => {\n        window.google.script.run.withSuccessHandler((r) => res({ ok: true, where: "Google Drive", name: r && r.name, bytes: r && r.bytes })).withFailureHandler((e) => res({ ok: false, where: "Google Drive", err: e.message }))( "gasApiDispatch", "backup.toDrive", (session() || {}).token || "", {});\n      });\n    }',
      'if (target === "drive" && (IS_GAS || window.__KAI_SUPABASE_BRIDGE__)) {\n      return new Promise((res) => {\n        window.google.script.run.withSuccessHandler((r) => res({ ok: true, where: "Supabase + Google Drive", name: r && r.name, bytes: r && r.bytes })).withFailureHandler((e) => res({ ok: false, where: "Google Drive", err: (e && e.message) || String(e) })).gasWorkspaceDispatch("backup.toDrive", (session() || {}).token || "", {});\n      });\n    }'
    );

    js = js.replace(
      '      if (a === "test") {\n        const r = restoreSelfTest();',
      '      if (a === "test") {\n        if (window.__KAI_SUPABASE_BRIDGE__ && window.__KAI_SUPABASE_BRIDGE__.getActiveToken()) {\n          out.innerHTML = \'<p class="kai-reg-note">Menguji integritas tabel Postgres &amp; rantai audit SHA-256…</p>\';\n          window.google.script.run\n            .withSuccessHandler((rep) => {\n              const chain = (rep && rep.auditChain) || { rows: 0, broken: 0 };\n              out.innerHTML =\n                \'<p class="kai-backup-\' + (rep && rep.ok ? "ok" : "bad") + \'">\' +\n                (rep && rep.ok ? "LULUS LIVE POSTGRES" : "PERIKSA") + " · " + ((rep && rep.tables && rep.tables.length) || 0) + " tabel diperiksa</p>" +\n                ((rep && rep.tables) || []).map((t) => "<p class=\\\'kai-backup-row\\\'>" + esc(t.table) + ": live " + t.live + " · " + esc(t.status) + "</p>").join("") +\n                \'<p class="kai-reg-note">Rantai audit Postgres: \' + chain.rows + " baris · putus " + chain.broken + "</p>";\n            })\n            .withFailureHandler((err) => {\n              out.innerHTML = \'<p class="kai-backup-bad">Gagal uji Postgres: \' + esc((err && err.message) || String(err)) + "</p>";\n            })\n            .gasWorkspaceDispatch("backup.test", (session() || {}).token || "", {});\n          return;\n        }\n        const r = restoreSelfTest();'
    );

    const liveAddon = `
/* === LIVE SUPABASE SYNC HOOKS FOR CARDS, REGISTERS, AUDIT, LEDGER & CONNECTORS === */
(() => {
  try {
    const B = window.__KAI_SUPABASE_BRIDGE__;
    if (!B) return;
    const origSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      origSetItem.apply(this, arguments);
      if (this === localStorage && (k === "kai-registers-v1" || k === "kai-mitigasi-status-v1") && B.getActiveToken()) {
        try {
          const parsed = JSON.parse(v);
          const entries = Object.entries(parsed || {}).slice(0, 20);
          entries.forEach(([itemId, val]) => {
            const st = typeof val === "string" ? val : (val && (val.status || val.Status) || "Aktif");
            B.apiFetch("POST", "/api/registers", {
              item_id: k + ":" + itemId,
              register_type: k === "kai-mitigasi-status-v1" ? "mitigasi" : "register",
              status: String(st),
              data: typeof val === "object" ? val : { value: val },
            }).catch(() => {});
          });
        } catch (_) {}
      }
    };
    document.addEventListener("click", (e) => {
      const revBtn = e.target && e.target.closest ? e.target.closest("#kai-card-revoke") : null;
      if (revBtn && B.getActiveToken()) {
        let nonces = [];
        try {
          nonces = (JSON.parse(localStorage.getItem("kai-cards-v1") || "[]") || []).map((c) => c.nonce).filter(Boolean);
        } catch (_) {}
        B.apiFetch("POST", "/api/auth/card-revoke", { nonces }).then(() => {
          const out = document.getElementById("kai-card-out");
          if (out) out.innerHTML = "<p class='kai-backup-ok'>Kartu dicabut di server Supabase Postgres &amp; perangkat ini.</p>";
        }).catch(() => {});
      }
      const biayaTab = e.target && e.target.closest ? e.target.closest('[data-otab="biaya"]') : null;
      if (biayaTab && B.getActiveToken()) {
        setTimeout(() => {
          B.apiFetch("GET", "/api/finance/summary").then((r) => {
            const kasEl = document.getElementById("kai-kas");
            if (kasEl && r && r.summary && r.summary.totals) {
              kasEl.textContent = "Rp" + Math.round(Number(r.summary.totals.kas1101 || 0)).toLocaleString("id-ID");
            }
          }).catch(() => {});
        }, 120);
      }
    });
    if (window.self === window.top && document.body) {
      if (!window.__KAI_LIVE_FINANCE_MOUNTED__ && !document.getElementById("kai-live-finance-script")) {
        const s = document.createElement("script");
        s.id = "kai-live-finance-script";
        s.src = "/assets/kai-live-finance.js?v=20261128v46";
        document.body.appendChild(s);
      }
      if (!window.__KAI_CONNECTORS_HUB_MOUNTED__ && !document.getElementById("kai-connectors-hub-script")) {
        const c = document.createElement("script");
        c.id = "kai-connectors-hub-script";
        c.src = "/assets/kai-connectors-hub.js?v=20261128v46";
        document.body.appendChild(c);
      }
      if (!window.__KAI_KYC__ && !document.getElementById("kai-kyc-v47-script")) {
        const k = document.createElement("script");
        k.id = "kai-kyc-v47-script";
        k.src = "/assets/kai-kyc-v47.js?v=20261128v47";
        document.body.appendChild(k);
      }
    }
  } catch (_) {}
})();
`;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, must-revalidate");
    res.status(200).send(js + liveAddon);
  } catch (err) {
    res.status(500).send("// Error loading kai-enhancements: " + (err && err.message ? err.message : String(err)));
  }
};
