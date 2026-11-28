/* ============================================================
   KANTOR AI — HUB KONEKTOR EKOSISTEM LIVE v3.2 (13 APLIKASI)
   Semua 12 konektor ON hidup & aktif menangani layanan web:
   - Linear (create, update status, notes) ↔ Tugas Portal
   - Notion (catalog & entries, leads, DAO log) ↔ Dokumen/SEO/CopyHub
   - Google Sheets (sync ledger 3101/PPN/Payroll/PO/CopyHub/DAO/Aset + CSV)
   - Google Docs (create memo ↔ Dokumen Postgres)
   - Google Slides (Founder Deck KPI sync)
   - Google Calendar & Meet (schedule event, Meet room)
   - Gmail (Outbox queue + 1-click Gmail Compose URL)
   - Google Drive (register archive + Postgres snapshot backup)
   - Figma (Design Tokens + Work Sans global propagation)
   - WordPress CMS (gio910blog.wordpress.com — publish/draft & sinkron artikel)
   - Supabase (53-table & SHA-256 chain live health)
   - Vercel (Live routes & proxy diagnostics)
   Plus mode standby terstruktur untuk 1 konektor OFF di Arena (Dropbox).
   ============================================================ */
(() => {
  "use strict";
  if (window.__KAI_CONNECTORS_HUB_MOUNTED__) return;
  window.__KAI_CONNECTORS_HUB_MOUNTED__ = true;

  const SUPA_BASE = String(window.__KAI_SUPABASE_API_URL__ || "https://dttclgkjfiwcovvqrckw.supabase.co/functions/v1/gio910-api").replace(/\/+$/, "");
  const ANON_KEY = String(window.__KAI_SUPABASE_ANON_KEY__ || "").trim();
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const IS_TOP = (() => { try { return window.self === window.top; } catch (_) { return false; } })();

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rp = (n) => "Rp" + Math.round(Number(n || 0)).toLocaleString("id-ID");

  function getActiveToken() {
    if (window.__KAI_SUPABASE_BRIDGE__ && typeof window.__KAI_SUPABASE_BRIDGE__.getActiveToken === "function") {
      const t = window.__KAI_SUPABASE_BRIDGE__.getActiveToken();
      if (t) return t;
    }
    try {
      const hs = JSON.parse(sessionStorage.getItem("hi_session_v1") || "null");
      if (hs && hs.token && UUID_RE.test(hs.token)) return hs.token;
      const m = JSON.parse(sessionStorage.getItem("kai_supa_sessions_v1") || "{}");
      const k = Object.keys(m);
      if (k.length) return k[k.length - 1];
    } catch (_) {}
    return "";
  }

  async function apiCall(method, path, body, tok) {
    const headers = { "Content-Type": "application/json" };
    if (ANON_KEY) {
      headers["apikey"] = ANON_KEY;
      headers["Authorization"] = "Bearer " + ANON_KEY;
    }
    const useTok = tok || getActiveToken();
    if (useTok && UUID_RE.test(useTok)) headers["x-gio-session"] = useTok;

    const opts = {
      method,
      headers,
      body: body !== undefined && method !== "GET" ? JSON.stringify(body) : undefined,
    };
    const res = await fetch(SUPA_BASE + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || ("HTTP " + res.status));
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  function downloadText(filename, content, mime) {
    const blob = new Blob([content], { type: mime || "text/csv;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 3000);
  }

  function applyFigmaPreset(preset, tokens) {
    const p = preset || (tokens && tokens.activePreset) || "default";
    document.documentElement.setAttribute("data-gio-figma-preset", p);
    const useWs = tokens && tokens.useWorkSans !== undefined
      ? Boolean(tokens.useWorkSans)
      : (() => { try { return localStorage.getItem("gio_figma_ws_v1") === "1"; } catch (_) { return false; } })();
    document.documentElement.setAttribute("data-gio-figma-font", useWs ? "work-sans" : "system");
    try {
      localStorage.setItem("gio_figma_preset_v1", p);
      if (tokens && tokens.useWorkSans !== undefined) localStorage.setItem("gio_figma_ws_v1", useWs ? "1" : "0");
    } catch (_) {}
    if (tokens) window.__KAI_FIGMA_TOKENS__ = tokens;
  }

  try {
    const savedPreset = localStorage.getItem("gio_figma_preset_v1");
    if (savedPreset) applyFigmaPreset(savedPreset, null);
  } catch (_) {}

  let hubState = {
    loading: false,
    data: null,
    configs: null,
    activeTab: "connectors",
    catFilter: "all",
    feedback: null,
  };

  async function checkGithub() {
    const response = await fetch("/api/github", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "HTTP " + response.status);
    return data;
  }

  async function loadHubData() {
    hubState.loading = true;
    try {
      const data = await apiCall("GET", "/api/connectors");
      // GitHub is a separate, read-only public repository integration, not an Arena session.
      let github;
      try { github = await checkGithub(); } catch (_) { github = null; }
      data.connectors = (data.connectors || []).filter((c) => c.slug !== "github");
      data.connectors.push({
        slug: "github", name: "GitHub · GIO910", category: "product",
        arena_status: github ? "on" : "unavailable", external_url: "https://github.com/Slam691410/gio910",
        summary: github ? "Repository publik terjangkau · branch " + github.defaultBranch + " · hanya baca."
          : "Status tidak tersedia. Uji ulang koneksi GitHub; akses hanya baca.",
      });
      if (data.summary) {
        data.summary = { ...data.summary, total: Number(data.summary.total || 0) + 1,
          on: Number(data.summary.on || 0) + (github ? 1 : 0) };
      }
      hubState.data = data;
      if (data.figmaTokens) applyFigmaPreset(data.figmaTokens.activePreset || "default", data.figmaTokens);
      window.__KAI_CONNECTOR_SUMMARY__ = data.summary || null;
      window.dispatchEvent(new CustomEvent("kai-connectors-loaded", { detail: data }));

      const pill = document.getElementById("kuh-conn-text");
      if (pill && data.summary) {
        pill.textContent = "Konektor " + data.summary.on + "/" + data.summary.total + " ON";
      }
      if (data.role === "Pemilik" || data.role === "Manajemen" || data.role === "Auditor") {
        try {
          const cfg = await apiCall("GET", "/api/config");
          hubState.configs = cfg.configs || [];
        } catch (_) {}
      } else {
        hubState.configs = null;
      }
    } catch (e) {
      hubState.feedback = { ok: false, text: "Gagal memuat data konektor: " + e.message };
    } finally {
      hubState.loading = false;
    }
  }

  // Mount contextual connector action strip inside pages/*.html (even when inside iframe!)
  function mountContextualStrip() {
    const pageId = String(window.__KAI_EMBED_PAGE__ || "").toLowerCase();
    if (!pageId || document.getElementById("kai-page-conn-strip")) return;

    const specs = {
      ringkas: {
        title: "Google Slides · Google Sheets · Supabase Live",
        desc: "Sinkronkan KPI Ekuitas 3101 & Neraca Saldo ke Slide Pendiri atau ekspor langsung ke Sheets.",
        buttons: [
          { label: "Sync KPI ke Google Slides", cls: "prim", slug: "google_slides", action: "sync_deck" },
          { label: "Sync Neraca 3101 → Sheets", cls: "", slug: "google_sheets", action: "sync_ledger", payload: { module: "gl" } },
          { label: "Uji Kesehatan Postgres", cls: "", slug: "supabase", action: "verify_health" },
        ],
      },
      tugas: {
        title: "Linear Issues (GIO-5..11) ↔ Matriks Tugas Portal",
        desc: "Tugas Portal tersinkron dua arah dengan Linear Project GIO910.",
        buttons: [
          { label: "Buat Issue Linear Baru", cls: "prim", promptTitle: "Judul issue Linear baru (mis. Audit Q4):", slug: "linear", action: "create_issue" },
          { label: "Ping Sinkron Linear", cls: "", slug: "linear", action: "sync_ping" },
        ],
      },
      dokumen: {
        title: "Google Docs · Notion · WordPress (gio910blog Live)",
        desc: "Setiap dokumen baru otomatis tercatat ke Google Docs Hub, Notion, atau WordPress CMS (gio910blog.wordpress.com).",
        buttons: [
          { label: "Buat Memo Google Docs", cls: "prim", promptTitle: "Judul Memo Google Docs:", slug: "google_docs", action: "create_memo" },
          { label: "Simpan Entri Katalog Notion", cls: "", promptTitle: "Judul Entri Notion:", slug: "notion", action: "add_entry" },
          { label: "Kirim Artikel/Draft WordPress", cls: "", promptTitle: "Judul Artikel WordPress (gio910blog):", slug: "wordpress", action: "publish_draft" },
        ],
      },
      alur: {
        title: "Google Calendar · Video Meet · Gmail Outbox",
        desc: "Jadwalkan rapat koordinasi atau siapkan surat resmi langsung dari Alur Kerja.",
        buttons: [
          { label: "Buat Ruang Video Meet + Calendar", cls: "prim", promptTitle: "Topik Rapat Kantor AI:", slug: "google_calendar", action: "create_meet" },
          { label: "Siapkan Draft Gmail", cls: "", promptEmail: true, slug: "gmail", action: "send_outbox" },
        ],
      },
      inv: {
        title: "Google Sheets Live_Postgres_3101 · Konsol 3101",
        desc: "Ekspor portofolio investasi, deposit 2101, dan saldo akun 3101 ke Google Sheets.",
        buttons: [
          { label: "Sync Deposit 2101 → Sheets", cls: "prim", slug: "google_sheets", action: "sync_ledger", payload: { module: "deposits" } },
          { label: "Sync Neraca 3101 → Sheets", cls: "", slug: "google_sheets", action: "sync_ledger", payload: { module: "gl" } },
        ],
      },
      aset: {
        title: "Google Sheets KAI_Data · Inventaris Aset",
        desc: "Salin daftar aset kantor aktif dari Postgres ke tab Google Sheets KAI_Data.",
        buttons: [
          { label: "Sync Aset Kantor → Google Sheets", cls: "prim", slug: "google_sheets", action: "sync_ledger", payload: { module: "aset" } },
        ],
      },
      vendor: {
        title: "Google Sheets PO & Pajak PPN · Gmail Notifikasi",
        desc: "Ekspor PO vendor (>Rp100 Jt 4-Eyes Control) dan PPN e-Faktur ke Sheets.",
        buttons: [
          { label: "Ekspor PO Vendor → Sheets", cls: "prim", slug: "google_sheets", action: "sync_ledger", payload: { module: "po" } },
          { label: "Ekspor e-Faktur PPN → Sheets", cls: "", slug: "google_sheets", action: "sync_ledger", payload: { module: "pajak" } },
        ],
      },
      org: {
        title: "Notion Directory · Payroll 259 Personel",
        desc: "Sinkronkan direktori unit kerja & rekap payroll 259 personel.",
        buttons: [
          { label: "Ekspor Payroll 259 → Sheets", cls: "prim", slug: "google_sheets", action: "sync_ledger", payload: { module: "payroll" } },
          { label: "Catat Pembaruan ke Notion", cls: "", promptTitle: "Judul Pembaruan Organisasi:", slug: "notion", action: "add_entry" },
        ],
      },
      unduh: {
        title: "Google Drive Release Hub · Dropbox (Arena OFF Standby)",
        desc: "Daftarkan paket rilis OS ke Google Drive Hub atau cek antrean standby Dropbox.",
        buttons: [
          { label: "Backup Snapshot → Google Drive", cls: "prim", slug: "google_drive", action: "backup_snapshot" },
          { label: "Cek Standby Dropbox (Arena OFF)", cls: "warn", slug: "dropbox", action: "archive_standby" },
        ],
      },
    };

    const cfg = specs[pageId];
    if (!cfg) return;

    const strip = document.createElement("aside");
    strip.id = "kai-page-conn-strip";
    strip.className = "kcx-strip";
    strip.innerHTML = `
      <div class="kcx-head">
        <div>
          <span class="kcx-title">⚡ Konektor Aktif (${esc(pageId.toUpperCase())}): ${esc(cfg.title)}</span>
          <div style="color:#9fb0d0;font-size:11.5px">${esc(cfg.desc)}</div>
        </div>
        <div class="kcx-actions">
          ${cfg.buttons.map((b, i) => `<button type="button" class="kcx-btn ${esc(b.cls || "")}" data-kcx-idx="${i}">${esc(b.label)}</button>`).join("")}
        </div>
      </div>
      <div class="kcx-out" id="kcx-out"></div>
    `;

    const attachStrip = () => {
      if (document.getElementById("kai-page-conn-strip")) return;
      if (document.body) {
        document.body.appendChild(strip);
      }
      strip.querySelectorAll("[data-kcx-idx]").forEach((btn) => {
        btn.onclick = async () => {
          const b = cfg.buttons[Number(btn.dataset.kcxIdx)];
          const out = strip.querySelector("#kcx-out");
          out.classList.add("is-shown");
          let payload = { ...(b.payload || {}) };
          if (b.promptTitle) {
            const val = window.prompt(b.promptTitle, "Pembaruan GIO910 · " + pageId.toUpperCase());
            if (!val) return;
            payload.title = val;
          }
          if (b.promptEmail) {
            const to = window.prompt("Email penerima:", "slametsugiono.studio@gmail.com");
            if (!to) return;
            const subj = window.prompt("Subjek email:", "Koordinasi Kantor AI GIO910");
            if (!subj) return;
            payload = { to, subject: subj, body: "Dikirim dari modul " + pageId + " Portal GIO910." };
          }
          out.textContent = "Menjalankan aksi konektor " + b.slug + "…";
          try {
            const r = await apiCall("POST", "/api/connectors/action", { connector: b.slug, action: b.action, payload });
            const links = [];
            const url = r.spreadsheetUrl || r.workbookUrl || r.deck?.deckUrl || r.doc?.url || r.event?.hangoutLink || r.event?.htmlLink || r.gmailComposeUrl || r.backup?.driveUrl;
            if (url) links.push(`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;font-weight:700;margin-left:8px">Buka Hasil ↗</a>`);
            if (r.csv) {
              downloadText(`gio910-${b.payload?.module || pageId}.csv`, r.csv);
            }
            out.innerHTML = `${r.paused ? "⚠️ " : "✓ "}${esc(r.message || "Berhasil.")}${links.join("")}`;
          } catch (e) {
            out.innerHTML = `<span style="color:#fca5a5">${esc(e.message)} (Pastikan Anda sudah masuk sesi di Portal)</span>`;
          }
        };
      });
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attachStrip);
    else setTimeout(attachStrip, 120);
  }

  // Sync Figma tokens & mount contextual strip inside subpage iframes without building modal shell
  if (!IS_TOP) {
    apiCall("GET", "/api/connectors?include_resources=0").then((d) => {
      if (d && d.figmaTokens) applyFigmaPreset(d.figmaTokens.activePreset || "default", d.figmaTokens);
    }).catch(() => {});
    mountContextualStrip();
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    #gio-conn-modal{position:fixed;inset:0;z-index:10010;background:rgba(3,7,18,.8);backdrop-filter:blur(5px);display:none;align-items:center;justify-content:center;padding:14px}
    #gio-conn-modal.is-open{display:flex}
    .gch-shell{background:#0d1629;border:1px solid var(--gio-accent-border,rgba(56,189,248,.34));border-radius:16px;color:#e8eefc;font:13.5px/1.5 system-ui,-apple-system,sans-serif;width:100%;max-width:1180px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.6)}
    .gch-inline{background:#0d1629;border:1px solid var(--gio-accent-border,rgba(56,189,248,.28));border-radius:16px;color:#e8eefc;font:13.5px/1.5 system-ui,-apple-system,sans-serif;overflow:hidden;margin-bottom:22px}
    .gch-head{padding:14px 18px;background:#121f3a;border-bottom:1px solid #22365c;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px}
    .gch-tabs{display:flex;flex-wrap:wrap;gap:6px;padding:10px 16px;background:#0a1221;border-bottom:1px solid #1d2f52}
    .gch-tab{padding:6px 12px;border-radius:8px;border:1px solid #24385f;background:#13203b;color:#a9bcd9;font-weight:700;font-size:12px;cursor:pointer}
    .gch-tab.is-active{background:var(--gio-accent,#38bdf8);color:var(--gio-accent-ink,#061e2e);border-color:var(--gio-accent,#38bdf8)}
    .gch-body{padding:16px 18px;overflow:auto;flex:1}
    .gch-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:14px}
    .gch-kpi{background:#121e36;border:1px solid #22365c;border-radius:12px;padding:11px 13px}
    .gch-kpi small{display:block;color:#9fb0d0;font-size:11px}
    .gch-kpi strong{display:block;font-size:16px;color:var(--gio-accent,#7dd3fc);margin-top:2px}
    .gch-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:11px}
    .gch-card{background:#121e36;border:1px solid #22365c;border-radius:12px;padding:13px;display:flex;flex-direction:column;justify-content:space-between;gap:9px}
    .gch-card.is-off{border-color:rgba(245,158,11,.45);background:rgba(30,27,18,.55)}
    .gch-box{background:#0f1a30;border:1px solid #22365c;border-radius:12px;padding:13px;margin-bottom:14px}
    .gch-pill{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}
    .gch-pill.on{background:rgba(16,185,129,.15);color:#6ee7b7;border:1px solid rgba(16,185,129,.42)}
    .gch-pill.off{background:rgba(245,158,11,.15);color:#fcd34d;border:1px solid rgba(245,158,11,.45)}
    .gch-pill.cat{background:#192949;color:#93c5fd;border:1px solid #2a4270}
    .gch-btn{padding:6px 11px;border-radius:8px;border:1px solid #2b4370;background:#172847;color:#dbeafe;font-weight:700;font-size:12px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:5px}
    .gch-btn.prim{background:var(--gio-accent,#38bdf8);border-color:var(--gio-accent,#38bdf8);color:var(--gio-accent-ink,#061e2e)}
    .gch-btn:hover{filter:brightness(1.08)}
    .gch-inp,.gch-sel,.gch-area{padding:7px 10px;border-radius:8px;border:1px solid #28406c;background:#08101e;color:#e8eefc;font:12.5px system-ui,sans-serif;max-width:100%}
    .gch-tbl{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:8px}
    .gch-tbl th,.gch-tbl td{padding:7px 8px;border-bottom:1px solid #1e3054;text-align:left;vertical-align:top}
    .gch-tbl th{color:#93c5fd;background:#101b30}
    .gch-note{padding:9px 12px;border-radius:10px;font-size:12.5px;margin-bottom:12px;border:1px solid}
    .gch-note.ok{background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.4);color:#6ee7b7}
    .gch-note.err{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.4);color:#fca5a5}
    .gch-note.warn{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.42);color:#fcd34d}
    .gch-swatches{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
    .gch-swatch{display:flex;align-items:center;gap:8px;background:#0a1221;border:1px solid #22365c;border-radius:10px;padding:7px 10px;font-size:12px}
    .gch-chip{width:20px;height:20px;border-radius:6px;border:1px solid rgba(255,255,255,.25);flex:0 0 auto}
    @media (max-width:680px){
      .gch-head,.gch-body,.gch-tabs{padding:10px 12px}
      .gch-grid{grid-template-columns:1fr}
      .gch-tbl{display:block;overflow-x:auto}
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "gio-conn-modal";
  modal.innerHTML = `<div class="gch-shell" role="dialog" aria-modal="true" aria-label="Hub Konektor Ekosistem GIO910"><div id="gio-conn-modal-inner" style="display:flex;flex-direction:column;max-height:92vh;overflow:hidden"></div></div>`;
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("is-open"); });
  document.body.appendChild(modal);

  function renderInto(container, isModal) {
    if (!container) return;
    const d = hubState.data;
    const sum = (d && d.summary) || { total: 13, on: 12, off: 1, resourcesCount: 0, eventsCount: 0 };
    const role = (d && d.role) || "Public";
    const caps = (d && d.roleCapabilities) || {};
    const conns = (d && d.connectors) || [];
    const resources = (d && d.resources) || [];
    const events = (d && d.events) || [];
    const figma = (d && d.figmaTokens) || window.__KAI_FIGMA_TOKENS__ || { activePreset: "default", colors: [] };
    const deck = (d && d.slidesDeck) || null;
    const offConns = conns.filter((c) => c.arena_status === "off");
    const offNames = offConns.map((c) => c.name.split(" ")[0]).join(", ") || "Dropbox";
    const wpConn = conns.find((c) => c.slug === "wordpress");
    const wpIsOn = !wpConn || wpConn.arena_status === "on";

    const catMap = {
      all: `Semua (${conns.length || 13})`,
      google_workspace: "Google Workspace (6)",
      dev_design: "Linear, Notion, Figma, WordPress & GitHub",
      data_infra: "Supabase & Vercel (2)",
      off: `OFF di Arena (${conns.length ? offConns.length : 1})`,
    };

    const filteredConns = conns.filter((c) => {
      if (hubState.catFilter === "off") return c.arena_status === "off";
      if (hubState.catFilter === "google_workspace") return c.category === "google_workspace";
      if (hubState.catFilter === "dev_design") return ["linear", "notion", "figma", "wordpress", "github"].includes(c.slug);
      if (hubState.catFilter === "data_infra") return ["supabase", "vercel"].includes(c.slug);
      return true;
    });

    const fbHtml = hubState.feedback
      ? `<div class="gch-note ${hubState.feedback.ok ? "ok" : (hubState.feedback.warn ? "warn" : "err")}">${esc(hubState.feedback.text)}${hubState.feedback.link ? ` <a class="gch-btn" style="margin-left:8px" href="${esc(hubState.feedback.link)}" target="_blank" rel="noopener noreferrer">Buka Hasil ↗</a>` : ""}</div>`
      : "";

    let bodyHtml = "";

    if (!d) {
      bodyHtml = `<p style="color:#9fb0d0">Menghubungi Supabase <code>gio910-api</code> (/api/connectors)…</p>`;
    } else if (hubState.activeTab === "connectors") {
      bodyHtml = `
        <div class="gch-kpis">
          <div class="gch-kpi"><small>Konektor Aktif (ON)</small><strong>${sum.on} / ${sum.total}</strong></div>
          <div class="gch-kpi"><small>Konektor Dijeda (OFF)</small><strong style="color:#fcd34d">${sum.off} (${esc(offNames)})</strong></div>
          <div class="gch-kpi"><small>Resource Tersinkron</small><strong>${sum.resourcesCount} Item</strong></div>
          <div class="gch-kpi"><small>Sesi &amp; Peran Saat Ini</small><strong>${esc(role)}</strong></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
          ${Object.entries(catMap).map(([k, lbl]) => `<button type="button" class="gch-btn ${hubState.catFilter === k ? "prim" : ""}" data-cat="${k}">${lbl}</button>`).join("")}
        </div>
        <div class="gch-grid">
          ${filteredConns.map((c) => {
            const isOn = c.arena_status === "on";
            const cnt = resources.filter((r) => r.connector_slug === c.slug).length;
            return `
              <div class="gch-card ${isOn ? "" : "is-off"}">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:6px">
                    <strong style="font-size:14px">${esc(c.name)}</strong>
                    <span class="gch-pill ${isOn ? "on" : "off"}">${isOn ? "● ON" : (c.slug === "github" ? "⚠ Tidak tersedia" : "○ OFF di Arena")}</span>
                  </div>
                  <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px">
                    <span class="gch-pill cat">${esc(c.category)}</span>
                    <span class="gch-pill cat">${cnt} item</span>
                  </div>
                  <p style="margin:0;color:#9fb0d0;font-size:12px">${esc(c.summary || (isOn ? "Terhubung live ke Postgres + layanan eksternal." : "Toggle OFF di Arena — sinkronisasi eksternal dijeda."))}</p>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
                  ${c.external_url ? `<a class="gch-btn" href="${esc(c.external_url)}" target="_blank" rel="noopener noreferrer">Buka ↗</a>` : ""}
                  <button type="button" class="gch-btn ${isOn ? "prim" : ""}" data-ping="${esc(c.slug)}">${c.slug === "github" ? "Uji GitHub" : (isOn ? "Ping Sync" : "Uji Standby OFF")}</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
        <div class="gch-box" style="margin-top:14px;border-color:rgba(56,189,248,.38)">
          <strong style="color:#7dd3fc">WordPress CMS (${wpIsOn ? "ON · gio910blog.wordpress.com" : "Standby OFF"}) &amp; Standby OFF (${esc(offNames)})</strong>
          <p style="color:#9fb0d0;font-size:12px;margin:4px 0 8px">WordPress CMS aktif terhubung ke <code>gio910blog.wordpress.com</code> untuk menyimpan &amp; menyinkronkan artikel/draf ke Postgres, sedangkan <b>${esc(offNames)}</b> dijeda di Arena (antrean arsip tetap siap di Postgres).</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <input id="gch-wp-title" class="gch-inp" placeholder="Judul artikel / draf WordPress (gio910blog)…" style="flex:1 1 220px" />
            <input id="gch-wp-content" class="gch-inp" placeholder="Ringkasan isi artikel…" style="flex:1 1 220px" />
            <button type="button" class="gch-btn ${wpIsOn ? "prim" : ""}" id="gch-wp-draft">${wpIsOn ? "Kirim Draft WordPress Live" : "Simpan Draft WordPress (OFF)"}</button>
            <button type="button" class="gch-btn" id="gch-dbx-standby">Uji Antrean Dropbox (OFF)</button>
          </div>
        </div>
      `;
    } else if (hubState.activeTab === "linear_notion") {
      const linIssues = resources.filter((r) => r.connector_slug === "linear");
      const notionRows = resources.filter((r) => r.connector_slug === "notion");
      const states = ["Todo", "In Progress", "In Review", "Done"];
      bodyHtml = `
        <h3 style="margin:0 0 8px;color:var(--gio-accent,#7dd3fc);font-size:15px">Linear Issues (${linIssues.length}) — Project GIO910</h3>
        ${!caps.canMutateLinear ? `<div class="gch-note warn">Masuk sebagai <b>Staf / Manajemen / Pemilik</b> untuk mengubah status, menambah catatan, atau membuat issue Linear &amp; Notion (saat ini: <b>${esc(role)}</b>).</div>` : ""}
        <div class="gch-box">
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <input id="gch-lin-title" class="gch-inp" placeholder="Judul issue Linear baru (otomatis masuk Tugas Portal)…" style="flex:1 1 240px" />
            <select id="gch-lin-prio" class="gch-sel">
              <option value="high">Prioritas Tinggi</option>
              <option value="medium" selected>Prioritas Sedang</option>
              <option value="low">Prioritas Rendah</option>
            </select>
            <button type="button" class="gch-btn prim" id="gch-lin-create">+ Buat Issue Linear</button>
          </div>
        </div>
        <table class="gch-tbl">
          <thead><tr><th>Kode</th><th>Judul</th><th>Status</th><th>Catatan</th><th>Aksi</th></tr></thead>
          <tbody>
            ${linIssues.map((it) => {
              const notes = Array.isArray(it.payload && it.payload.notes) ? it.payload.notes : [];
              return `
                <tr>
                  <td><a href="${esc(it.url || "#")}" target="_blank" rel="noopener noreferrer" style="color:var(--gio-accent,#7dd3fc);font-weight:700">${esc(it.external_id)}</a></td>
                  <td>${esc(it.title)}</td>
                  <td><span class="gch-pill ${it.status === "Done" ? "on" : "cat"}">${esc(it.status)}</span></td>
                  <td style="color:#9fb0d0;font-size:11.5px">${notes.length ? esc(notes[notes.length - 1].text) : esc(it.updated_by || "-")}</td>
                  <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap">
                      <select class="gch-sel" data-lin-sel="${esc(it.external_id)}">
                        ${states.map((s) => `<option value="${s}" ${s === it.status ? "selected" : ""}>${s}</option>`).join("")}
                      </select>
                      <button type="button" class="gch-btn prim" data-lin-save="${esc(it.external_id)}">Simpan</button>
                      <button type="button" class="gch-btn" data-lin-note="${esc(it.external_id)}">+ Catatan</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>

        <h3 style="margin:18px 0 8px;color:var(--gio-accent,#7dd3fc);font-size:15px">Notion Workspace &amp; Katalog Terhubung (${notionRows.length})</h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;align-items:center">
          <input id="gch-not-title" class="gch-inp" placeholder="Judul entri baru Notion + Dokumen Postgres" style="flex:1 1 220px" />
          <input id="gch-not-note" class="gch-inp" placeholder="Ringkasan catatan operasional" style="flex:1 1 220px" />
          <button type="button" class="gch-btn prim" id="gch-not-add">Tambah Entri Notion</button>
        </div>
        <table class="gch-tbl">
          <thead><tr><th>Tipe</th><th>Judul</th><th>Status</th><th>Diperbarui</th></tr></thead>
          <tbody>
            ${notionRows.map((n) => `
              <tr>
                <td><a href="${esc(n.url || "#")}" target="_blank" rel="noopener noreferrer" style="color:var(--gio-accent,#7dd3fc)">${esc(n.resource_type)}</a></td>
                <td>${esc(n.title)}</td>
                <td><span class="gch-pill on">${esc(n.status)}</span></td>
                <td style="color:#9fb0d0;font-size:11.5px">${esc(n.updated_by || "-")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    } else if (hubState.activeTab === "google_figma") {
      const gItems = resources.filter((r) => String(r.connector_slug).startsWith("google_") || r.connector_slug === "gmail");
      const gmailHidden = !caps.canReadGmail;
      const colors = Array.isArray(figma.colors) && figma.colors.length ? figma.colors : [
        { name: "Fuschia/100", hex: "#EF5DA8", styleId: "91:0" },
        { name: "Fuschia/80", hex: "#F178B6", styleId: "91:1" },
        { name: "Fuschia/60", hex: "#FCDDEC", styleId: "91:2" },
        { name: "Iris/100", hex: "#5D5FEF", styleId: "91:3" },
        { name: "Iris/80", hex: "#7879F1", styleId: "91:4" },
        { name: "Iris/60", hex: "#A5A6F6", styleId: "91:5" },
      ];
      const presets = [
        { id: "default", label: "Default Sky (#38BDF8)" },
        { id: "fuschia-100", label: "Figma Fuschia 100 (#EF5DA8)" },
        { id: "iris-100", label: "Figma Iris 100 (#5D5FEF)" },
        { id: "fuschia-iris", label: "Figma Fuschia × Iris Duo" },
      ];
      const dk = (deck && deck.kpis) || {};
      bodyHtml = `
        <h3 style="margin:0 0 8px;color:var(--gio-accent,#7dd3fc);font-size:15px">Figma Design System · <code>KIK's team library</code> (File <code>oiSuDVXhzfUzi0nSO7FFyB</code>)</h3>
        <div class="gch-swatches">
          ${colors.map((c) => `<div class="gch-swatch"><span class="gch-chip" style="background:${esc(c.hex)}"></span><div><b>${esc(c.name)}</b><div style="color:#9fb0d0;font-size:11px">${esc(c.hex)} · ${esc(c.styleId || "")}</div></div></div>`).join("")}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;align-items:center">
          ${presets.map((pr) => `<button type="button" class="gch-btn ${(figma.activePreset || "default") === pr.id ? "prim" : ""}" data-figma-preset="${pr.id}">${pr.label}</button>`).join("")}
          <button type="button" class="gch-btn ${figma.useWorkSans ? "prim" : ""}" id="gch-figma-font">Font Work Sans: ${figma.useWorkSans ? "AKTIF" : "Default"}</button>
        </div>

        <div class="gch-box">
          <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
            <strong style="color:var(--gio-accent,#7dd3fc)">Google Slides · Deck Ringkasan untuk Pendiri (Live KPI 3101)</strong>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button type="button" class="gch-btn prim" id="gch-slides-sync">Sync KPI Live ke Slide Pendiri</button>
              <a class="gch-btn" href="${esc((deck && deck.deckUrl) || "https://docs.google.com/presentation/d/1conQN26p44-ytRBNcnluTESzxVvYeSdxw_fvv4-EUY0/edit")}" target="_blank" rel="noopener noreferrer">Buka Deck ↗</a>
            </div>
          </div>
          <div class="gch-kpis" style="margin-bottom:0">
            <div class="gch-kpi"><small>Pendapatan 2026-11</small><strong>${rp(dk.pendapatanOperasional)}</strong></div>
            <div class="gch-kpi"><small>Ekuitas / Surplus 3101</small><strong style="color:#34d399">${rp(dk.ekuitas3101)}</strong></div>
            <div class="gch-kpi"><small>Payroll · e-Faktur · DAO</small><strong>${dk.payrollCount || 259} · ${dk.fakturCount || 7} · ${dk.daoProposals || 2}</strong></div>
            <div class="gch-kpi"><small>Rantai Audit SHA-256</small><strong style="color:#6ee7b7">${dk.auditRows || 0} baris (putus: ${dk.auditBroken || 0})</strong></div>
          </div>
        </div>

        <div class="gch-box">
          <strong style="color:var(--gio-accent,#7dd3fc);display:block;margin-bottom:8px">Aksi Cepat 6 Konektor Google Workspace (Live Postgres ↔ Google)</strong>
          <div style="display:grid;gap:8px">
            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
              <select id="gch-sh-mod" class="gch-sel">
                <option value="gl">Google Sheets: Neraca Saldo &amp; Closing 3101</option>
                <option value="pajak">Google Sheets: PPN &amp; e-Faktur</option>
                <option value="payroll">Google Sheets: Payroll 259 Personel</option>
                <option value="deposits">Google Sheets: Deposit Tenant 2101</option>
                <option value="po">Google Sheets: Procurement PO Vendor</option>
                <option value="copyhub">Google Sheets: Transaksi Copy Hub MEMBER30</option>
                <option value="dao">Google Sheets: Proposal DAO (Hybrid &amp; Governor)</option>
                <option value="aset">Google Sheets: Inventaris &amp; Aset Kantor AI</option>
              </select>
              <button type="button" class="gch-btn prim" id="gch-sh-sync">Sync Sheets + Unduh CSV</button>
              <button type="button" class="gch-btn" id="gch-ws-backup">Backup Snapshot → Drive</button>
              <button type="button" class="gch-btn" id="gch-ws-verify">Uji Backup &amp; SHA-256</button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
              <input id="gch-doc-title" class="gch-inp" placeholder="Judul Memo Google Docs…" style="flex:1 1 200px" />
              <input id="gch-doc-body" class="gch-inp" placeholder="Isi ringkasan memo…" style="flex:1 1 240px" />
              <button type="button" class="gch-btn" id="gch-doc-create">Buat Memo Docs</button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
              <input id="gch-cal-title" class="gch-inp" placeholder="Judul Agenda Calendar / Ruang Meet…" style="flex:1 1 220px" />
              <button type="button" class="gch-btn" id="gch-cal-meet">+ Jadwalkan Calendar + Meet</button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
              <input id="gch-gm-to" class="gch-inp" placeholder="Email tujuan Gmail…" style="width:180px" />
              <input id="gch-gm-subj" class="gch-inp" placeholder="Subjek email…" style="flex:1 1 180px" />
              <input id="gch-gm-body" class="gch-inp" placeholder="Pesan singkat…" style="flex:1 1 180px" />
              <button type="button" class="gch-btn" id="gch-gm-send">Catat Outbox + Buka Gmail</button>
            </div>
          </div>
        </div>

        <h3 style="margin:0 0 8px;color:var(--gio-accent,#7dd3fc);font-size:15px">Registri Google Workspace Sync (${gItems.length} item aktif)</h3>
        ${gmailHidden ? `<div class="gch-note warn">Subjek &amp; isi email Gmail disembunyikan untuk peran <b>${esc(role)}</b> (khusus Pemilik / Manajemen / Auditor).</div>` : ""}
        <table class="gch-tbl">
          <thead><tr><th>Layanan</th><th>Judul</th><th>Status</th><th>Tautan</th></tr></thead>
          <tbody>
            ${gItems.slice(0, 60).map((g) => `
              <tr>
                <td><span class="gch-pill cat">${esc(g.connector_slug)}</span></td>
                <td>${esc(g.title)}</td>
                <td><span class="gch-pill on">${esc(g.status)}</span></td>
                <td>${g.url ? `<a class="gch-btn" href="${esc(g.url)}" target="_blank" rel="noopener noreferrer">Buka ↗</a>` : "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    } else if (hubState.activeTab === "events_config") {
      const cfgRows = hubState.configs || [];
      bodyHtml = `
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
          <h3 style="margin:0;color:var(--gio-accent,#7dd3fc);font-size:15px">Log Sinkronisasi Konektor (${events.length})</h3>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="gch-btn prim" id="gch-supa-health">Verifikasi Supabase 68 Tabel (36 Realtime)</button>
            <button type="button" class="gch-btn" id="gch-vercel-ping">Uji Proxy Vercel (/api/connectors?sub=health)</button>
          </div>
        </div>
        ${!events.length ? `<div class="gch-note warn">Masuk sesi login untuk melihat riwayat log konektor detail &amp; webhook.</div>` : `
          <table class="gch-tbl">
            <thead><tr><th>Waktu</th><th>Konektor</th><th>Aksi</th><th>Status</th><th>Aktor</th></tr></thead>
            <tbody>
              ${events.slice(0, 20).map((ev) => `
                <tr>
                  <td style="font-size:11.5px;color:#9fb0d0">${esc(String(ev.created_at || "").replace("T", " ").slice(0, 19))}</td>
                  <td><span class="gch-pill cat">${esc(ev.connector_slug)}</span></td>
                  <td><code>${esc(ev.action)}</code></td>
                  <td><span class="gch-pill ${ev.status === "paused_in_arena" ? "off" : "on"}">${esc(ev.status)}</span></td>
                  <td>${esc(ev.actor_name || "-")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `}

        <h3 style="margin:18px 0 8px;color:var(--gio-accent,#7dd3fc);font-size:15px">Runtime Configuration Registry (${cfgRows.length})</h3>
        ${role !== "Pemilik" ? `<div class="gch-note warn">Hanya peran <b>Pemilik</b> yang dapat mengubah konfigurasi runtime via <code>POST /api/config</code>.</div>` : `
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;align-items:center">
            <select id="gch-cfg-key" class="gch-sel">
              <option value="SESSION_HOURS">SESSION_HOURS</option>
              <option value="OTP_TTL_SEC">OTP_TTL_SEC</option>
              <option value="OTP_MAX_REQ_15MIN">OTP_MAX_REQ_15MIN</option>
              <option value="PIN_MAX_FAIL">PIN_MAX_FAIL</option>
              <option value="PIN_LOCK_MIN">PIN_LOCK_MIN</option>
            </select>
            <input id="gch-cfg-val" class="gch-inp" placeholder="Nilai baru (mis. 8)" />
            <button type="button" class="gch-btn prim" id="gch-cfg-save">Simpan Konfigurasi (/api/config)</button>
          </div>
        `}
        ${cfgRows.length ? `
          <table class="gch-tbl">
            <thead><tr><th>Kunci</th><th>Kategori</th><th>Nilai</th><th>Diperbarui</th></tr></thead>
            <tbody>
              ${cfgRows.slice(0, 16).map((c) => `
                <tr>
                  <td><code>${esc(c.key)}</code></td>
                  <td>${esc(c.category || "-")}</td>
                  <td style="max-width:340px;overflow-wrap:anywhere;font-size:11.5px;color:#cbd5e1">${esc(typeof c.value === "string" ? c.value : JSON.stringify(c.value))}</td>
                  <td style="font-size:11px;color:#9fb0d0">${esc(String(c.updated_at || "").slice(0, 10))}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : ""}
      `;
    }

    container.innerHTML = `
      <div class="gch-head">
        <div>
          <strong style="font-size:15px;color:var(--gio-accent,#7dd3fc)">Hub Konektor Ekosistem GIO910 · 13 Aplikasi (${sum.on} ON · ${sum.off} OFF)</strong>
          <div style="font-size:12px;color:#9fb0d0">Semua konektor aktif mengelola fitur nyata web: Postgres ↔ Linear, Notion, Google Workspace, Figma &amp; Vercel</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button type="button" class="gch-btn" data-gch-refresh="1">Segarkan Data</button>
          ${isModal ? `<button type="button" class="gch-btn" data-gch-close="1">Tutup ✕</button>` : `<button type="button" class="gch-btn prim" data-gch-open-modal="1">Layar Penuh ↗</button>`}
        </div>
      </div>
      <div class="gch-tabs">
        <button type="button" class="gch-tab ${hubState.activeTab === "connectors" ? "is-active" : ""}" data-gch-tab="connectors">1 · Semua Konektor (${sum.total})</button>
        <button type="button" class="gch-tab ${hubState.activeTab === "linear_notion" ? "is-active" : ""}" data-gch-tab="linear_notion">2 · Linear &amp; Notion</button>
        <button type="button" class="gch-tab ${hubState.activeTab === "google_figma" ? "is-active" : ""}" data-gch-tab="google_figma">3 · Google Workspace &amp; Figma</button>
        <button type="button" class="gch-tab ${hubState.activeTab === "events_config" ? "is-active" : ""}" data-gch-tab="events_config">4 · Log, Supabase, Vercel &amp; Config</button>
      </div>
      <div class="gch-body">${fbHtml}${bodyHtml}</div>
    `;

    container.querySelectorAll("[data-gch-tab]").forEach((btn) => {
      btn.onclick = () => { hubState.activeTab = btn.dataset.gchTab; hubState.feedback = null; renderAll(); };
    });
    container.querySelectorAll("[data-cat]").forEach((btn) => {
      btn.onclick = () => { hubState.catFilter = btn.dataset.cat; renderAll(); };
    });
    const refBtn = container.querySelector("[data-gch-refresh]");
    if (refBtn) refBtn.onclick = async () => { await loadHubData(); renderAll(); };
    const clsBtn = container.querySelector("[data-gch-close]");
    if (clsBtn) clsBtn.onclick = () => modal.classList.remove("is-open");
    const openFull = container.querySelector("[data-gch-open-modal]");
    if (openFull) openFull.onclick = () => openModal(hubState.activeTab);

    container.querySelectorAll("[data-ping]").forEach((btn) => {
      btn.onclick = async () => {
        const slug = btn.dataset.ping;
        try {
          if (slug === "github") {
            const repo = await checkGithub();
            await loadHubData();
            hubState.feedback = { ok: true, text: "GitHub terhubung (hanya baca): " + repo.repository + " · branch " + repo.defaultBranch };
            renderAll();
            return;
          }
          const r = await apiCall("POST", "/api/connectors/action", { connector: slug, action: "sync_ping" });
          hubState.feedback = { ok: !r.paused, warn: Boolean(r.paused), text: r.message || "Sinkronisasi selesai." };
          await loadHubData();
        } catch (e) {
          hubState.feedback = { ok: false, text: e.message };
        }
        renderAll();
      };
    });

    const wpBtn = container.querySelector("#gch-wp-draft");
    if (wpBtn) wpBtn.onclick = async () => {
      const title = (container.querySelector("#gch-wp-title")?.value || "").trim() || "Artikel Rilis Produk GIO910";
      const content = (container.querySelector("#gch-wp-content")?.value || "").trim();
      try {
        const r = await apiCall("POST", "/api/connectors/action", { connector: "wordpress", action: "publish_draft", payload: { title, content } });
        hubState.feedback = { ok: !r.paused, warn: Boolean(r.paused), text: r.message, link: (r.resource && r.resource.url) || r.postUrl };
        await loadHubData();
      } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
      renderAll();
    };

    const dbxBtn = container.querySelector("#gch-dbx-standby");
    if (dbxBtn) dbxBtn.onclick = async () => {
      try {
        const r = await apiCall("POST", "/api/connectors/action", { connector: "dropbox", action: "archive_standby", payload: { target: "backup-snapshot" } });
        hubState.feedback = { ok: true, warn: true, text: r.message };
        await loadHubData();
      } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
      renderAll();
    };

    const linCreate = container.querySelector("#gch-lin-create");
    if (linCreate) linCreate.onclick = async () => {
      const title = (container.querySelector("#gch-lin-title")?.value || "").trim();
      const priority = container.querySelector("#gch-lin-prio")?.value || "medium";
      try {
        const r = await apiCall("POST", "/api/connectors/action", { connector: "linear", action: "create_issue", payload: { title, priority } });
        hubState.feedback = { ok: true, text: r.message };
        await loadHubData();
      } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
      renderAll();
    };

    container.querySelectorAll("[data-lin-save]").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.linSave;
        const sel = container.querySelector(`[data-lin-sel="${id}"]`);
        const status = sel ? sel.value : "Done";
        try {
          const r = await apiCall("POST", "/api/connectors/action", { connector: "linear", action: "update_status", payload: { id, status } });
          hubState.feedback = { ok: true, text: r.message || "Status Linear diperbarui." };
          await loadHubData();
        } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
        renderAll();
      };
    });

    container.querySelectorAll("[data-lin-note]").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.linNote;
        const note = window.prompt(`Tambah catatan pada ${id}:`, "Diverifikasi via Hub Konektor GIO910");
        if (!note) return;
        try {
          const r = await apiCall("POST", "/api/connectors/action", { connector: "linear", action: "add_note", payload: { id, note } });
          hubState.feedback = { ok: true, text: r.message };
          await loadHubData();
        } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
        renderAll();
      };
    });

    const addNot = container.querySelector("#gch-not-add");
    if (addNot) addNot.onclick = async () => {
      const title = (container.querySelector("#gch-not-title")?.value || "").trim();
      const note = (container.querySelector("#gch-not-note")?.value || "").trim();
      try {
        const r = await apiCall("POST", "/api/connectors/action", { connector: "notion", action: "add_entry", payload: { title, note } });
        hubState.feedback = { ok: true, text: r.message || "Entri Notion ditambahkan." };
        await loadHubData();
      } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
      renderAll();
    };

    container.querySelectorAll("[data-figma-preset]").forEach((btn) => {
      btn.onclick = async () => {
        const preset = btn.dataset.figmaPreset;
        applyFigmaPreset(preset, null);
        try {
          const r = await apiCall("POST", "/api/connectors/action", { connector: "figma", action: "apply_theme", payload: { preset } });
          hubState.feedback = { ok: true, text: r.message || ("Tema Figma '" + preset + "' diterapkan.") };
          await loadHubData();
        } catch (e) {
          hubState.feedback = { ok: true, warn: true, text: "Pratinjau lokal tema Figma '" + preset + "' aktif di semua komponen web (masuk untuk menyimpan global ke Postgres)." };
        }
        renderAll();
      };
    });

    const figFont = container.querySelector("#gch-figma-font");
    if (figFont) figFont.onclick = async () => {
      const curWs = document.documentElement.getAttribute("data-gio-figma-font") === "work-sans";
      const nextWs = !curWs;
      applyFigmaPreset(figma.activePreset || "default", { ...figma, useWorkSans: nextWs });
      try {
        const r = await apiCall("POST", "/api/connectors/action", { connector: "figma", action: "apply_theme", payload: { preset: figma.activePreset || "default", useWorkSans: nextWs } });
        hubState.feedback = { ok: true, text: r.message };
        await loadHubData();
      } catch (_) {
        hubState.feedback = { ok: true, warn: true, text: "Font Work Sans lokal " + (nextWs ? "diaktifkan." : "dimatikan.") };
      }
      renderAll();
    };

    const slidesSync = container.querySelector("#gch-slides-sync");
    if (slidesSync) slidesSync.onclick = async () => {
      try {
        const r = await apiCall("POST", "/api/connectors/action", { connector: "google_slides", action: "sync_deck", payload: {} });
        hubState.feedback = { ok: true, text: r.message, link: r.deck && r.deck.deckUrl };
        await loadHubData();
      } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
      renderAll();
    };

    const shSync = container.querySelector("#gch-sh-sync");
    if (shSync) shSync.onclick = async () => {
      const mod = container.querySelector("#gch-sh-mod")?.value || "gl";
      try {
        const r = await apiCall("POST", "/api/connectors/action", { connector: "google_sheets", action: "sync_ledger", payload: { module: mod } });
        if (r.csv) downloadText(`gio910-${mod}-live.csv`, r.csv);
        hubState.feedback = { ok: true, text: r.message, link: r.workbookUrl || r.spreadsheetUrl };
        await loadHubData();
      } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
      renderAll();
    };

    const docBtn = container.querySelector("#gch-doc-create");
    if (docBtn) docBtn.onclick = async () => {
      const title = (container.querySelector("#gch-doc-title")?.value || "").trim();
      const content = (container.querySelector("#gch-doc-body")?.value || "").trim();
      try {
        const r = await apiCall("POST", "/api/connectors/action", { connector: "google_docs", action: "create_memo", payload: { title, content } });
        hubState.feedback = { ok: true, text: r.message, link: r.doc && r.doc.url };
        await loadHubData();
      } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
      renderAll();
    };

    const calBtn = container.querySelector("#gch-cal-meet");
    if (calBtn) calBtn.onclick = async () => {
      const title = (container.querySelector("#gch-cal-title")?.value || "").trim() || "Rapat Koordinasi GIO910";
      try {
        const r = await apiCall("POST", "/api/connectors/action", { connector: "google_calendar", action: "create_meet", payload: { title } });
        hubState.feedback = { ok: true, text: r.message, link: r.event && (r.event.meetingUri || r.event.htmlLink) };
        await loadHubData();
      } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
      renderAll();
    };

    const gmBtn = container.querySelector("#gch-gm-send");
    if (gmBtn) gmBtn.onclick = async () => {
      const to = (container.querySelector("#gch-gm-to")?.value || "").trim();
      const subject = (container.querySelector("#gch-gm-subj")?.value || "").trim();
      const body = (container.querySelector("#gch-gm-body")?.value || "").trim();
      try {
        const r = await apiCall("POST", "/api/connectors/action", { connector: "gmail", action: "send_outbox", payload: { to, subject, body } });
        hubState.feedback = { ok: true, text: r.message, link: r.gmailComposeUrl };
        await loadHubData();
      } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
      renderAll();
    };

    const wsBkp = container.querySelector("#gch-ws-backup");
    if (wsBkp) wsBkp.onclick = async () => {
      try {
        const r = await apiCall("POST", "/api/workspace", { op: "backup.toDrive", payload: {} });
        const b = r.data || {};
        hubState.feedback = { ok: true, text: `Backup Postgres + Drive tersimpan (${b.name}, ${b.totalRows} baris).`, link: b.driveUrl };
        await loadHubData();
      } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
      renderAll();
    };

    const wsVer = container.querySelector("#gch-ws-verify");
    if (wsVer) wsVer.onclick = async () => {
      try {
        const r = await apiCall("POST", "/api/workspace", { op: "backup.test", payload: {} });
        const rep = r.data || {};
        const brk = rep.auditChain ? rep.auditChain.broken : 0;
        hubState.feedback = { ok: Boolean(rep.ok), text: `Uji backup ${(rep.ok ? "LULUS" : "GAGAL")} · ${(rep.tables || []).length} tabel · SHA-256 putus: ${brk}.` };
      } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
      renderAll();
    };

    const supaHealth = container.querySelector("#gch-supa-health");
    if (supaHealth) supaHealth.onclick = async () => {
      try {
        const r = await apiCall("POST", "/api/connectors/action", { connector: "supabase", action: "verify_health", payload: {} });
        hubState.feedback = { ok: true, text: r.message };
        await loadHubData();
      } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
      renderAll();
    };

    const vercelPing = container.querySelector("#gch-vercel-ping");
    if (vercelPing) vercelPing.onclick = async () => {
      try {
        const r = await fetch("/api/connectors?sub=health");
        const j = await r.json();
        hubState.feedback = { ok: r.ok, text: `Proxy Vercel OK (HTTP ${r.status}) -> gio910-api ${j.version || ""} (${j.integrations?.connectors_on || 12} ON, ${j.integrations?.dao_proposals || 0} DAO, ${j.integrations?.seo_leads || 0} SEO leads).` };
      } catch (e) { hubState.feedback = { ok: false, text: "Proxy Vercel gagal: " + e.message }; }
      renderAll();
    };

    const cfgSave = container.querySelector("#gch-cfg-save");
    if (cfgSave) cfgSave.onclick = async () => {
      const key = container.querySelector("#gch-cfg-key")?.value;
      const rawVal = (container.querySelector("#gch-cfg-val")?.value || "").trim();
      let value = rawVal;
      if (/^\d+(\.\d+)?$/.test(rawVal)) value = Number(rawVal);
      try {
        await apiCall("POST", "/api/config", { key, value });
        hubState.feedback = { ok: true, text: `Konfigurasi ${key} = ${value} tersimpan di Postgres.` };
        await loadHubData();
      } catch (e) { hubState.feedback = { ok: false, text: e.message }; }
      renderAll();
    };
  }

  function renderAll() {
    const inlineMount = document.getElementById("gio-connectors-mount");
    if (inlineMount) {
      inlineMount.className = "gch-inline";
      renderInto(inlineMount, false);
    }
    if (modal.classList.contains("is-open")) {
      renderInto(document.getElementById("gio-conn-modal-inner"), true);
    }
  }

  async function openModal(tab) {
    if (tab) hubState.activeTab = tab;
    hubState.feedback = null;
    modal.classList.add("is-open");
    renderAll();
    await loadHubData();
    renderAll();
  }

  window.__KAI_OPEN_CONNECTORS_HUB__ = openModal;
  window.addEventListener("kai-session-change", () => { loadHubData().then(renderAll); });

  let connRtTimer = null;
  const CONN_RT_TABLES = new Set([
    "gio_connectors",
    "gio_connector_resources",
    "gio_connector_events",
    "seo_leads",
    "dao_proposals",
    "copyhub_orders",
    "documents",
    "gio_tasks",
  ]);
  window.addEventListener("gio-realtime-update", (ev) => {
    const isVisible = modal.classList.contains("is-open") || Boolean(document.getElementById("gio-connectors-mount"));
    if (!isVisible) return;
    const d = (ev && ev.detail) || {};
    if (d.kind !== "ws_event") return;
    if (d.table && !CONN_RT_TABLES.has(d.table)) return;
    const act = document.activeElement;
    if (act && act.closest && (act.closest("#gio-conn-modal") || act.closest("#gio-connectors-mount")) && (act.tagName === "INPUT" || act.tagName === "TEXTAREA" || act.tagName === "SELECT")) return;
    clearTimeout(connRtTimer);
    connRtTimer = setTimeout(() => {
      loadHubData().then(renderAll);
    }, 650);
  });

  mountContextualStrip();
  (async () => {
    await loadHubData();
    renderAll();
  })();
})();
