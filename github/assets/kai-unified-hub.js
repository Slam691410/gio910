/* ============================================================
   KANTOR AI — UNIFIED PROJECT SWITCHER & SUPABASE HEALTH UI
   Menampilkan navigasi lintas modul dalam 1 proyek terpadu +
   status koneksi live Supabase gio910-api.
   ============================================================ */
(() => {
  "use strict";

  // Jangan tampilkan bar switcher di dalam iframe sub-halaman atau mode wrapper embedded
  const isIframe = (() => {
    try { return window.self !== window.top; } catch (_) { return true; }
  })();
  const isEmbeddedParam = /[?&]embedded=wrapper\b/.test(location.search);
  if (isIframe || isEmbeddedParam) return;

  function detectBasePrefix() {
    if (typeof window.__KAI_BASE_PREFIX__ === "string") return window.__KAI_BASE_PREFIX__;
    const sc = document.currentScript || Array.from(document.scripts).find((s) => /kai-unified-hub\.js/.test(s.src || ""));
    if (sc && sc.getAttribute("src")) {
      const raw = sc.getAttribute("src");
      if (raw.startsWith("../../assets/")) return "../../";
      if (raw.startsWith("../assets/")) return "../";
      if (raw.startsWith("assets/")) return "";
    }
    const p = location.pathname;
    if (/\/(dao\/(full|hybrid)|wrappers\/opsi1)\//.test(p)) return "../../";
    if (/\/(pages|gas-mobile|seo)\//.test(p)) return "../";
    return "";
  }

  const BASE = detectBasePrefix();
  const MODULES = (window.__KAI_UNIFIED_MODULES__ && window.__KAI_UNIFIED_MODULES__.length)
    ? window.__KAI_UNIFIED_MODULES__
    : [
        { id: "portal", label: "Portal Kantor AI", path: "index.html" },
        { id: "mobile", label: "Mobile Portal", path: "gas-mobile/Index.html" },
        { id: "copyhub", label: "Copy Hub · 5 Mode", path: "copy-hub.html" },
        { id: "daohybrid", label: "Hybrid DAO", path: "dao/hybrid/dao-hybrid-widget.html" },
        { id: "daofull", label: "Full DAO", path: "dao/full/dao-full-console.html" },
        { id: "seo", label: "Widget SEO", path: "seo/widget-ig-freename-kontak.html" },
        { id: "ekosistem", label: "Pusat Ekosistem", path: "ekosistem.html" },
      ];

  function currentActiveId() {
    const p = location.pathname.toLowerCase();
    if (p.endsWith("/ekosistem.html")) return "ekosistem";
    if (p.endsWith("/copy-hub.html")) return "copyhub";
    if (p.includes("/dao/hybrid/")) return "daohybrid";
    if (p.includes("/dao/full/")) return "daofull";
    if (p.includes("/seo/")) return "seo";
    if (p.includes("/gas-mobile/")) return "mobile";
    if (p.includes("/wrappers/")) return "wrapper";
    return "portal";
  }

  function isUnifiedMainPortal() {
    const p = location.pathname.toLowerCase();
    return /(?:^\/$|\/index\.html$|\/gas-mobile(?:\/|$)|\/pages\/)/i.test(p);
  }

  function renderHub() {
    if (document.getElementById("kuh-diag-modal")) return;
    const mainPortal = isUnifiedMainPortal();

    // Di portal terpadu utama (Desktop / Mobile / Pages), JANGAN tampilkan bar atas tambahan (#kai-unified-hub)
    // agar seluruh menu menyatu dalam satu navigasi portal. Di halaman berdiri sendiri (CopyHub/DAO/SEO/Ekosistem),
    // tampilkan link kembali yang ringkas.
    if (!mainPortal && !document.getElementById("kai-unified-hub")) {
      const bar = document.createElement("nav");
      bar.id = "kai-unified-hub";
      bar.setAttribute("aria-label", "Navigasi Kembali ke Portal Terpadu GIO910");

      const left = document.createElement("div");
      left.className = "kuh-left";
      const back = document.createElement("a");
      back.className = "kuh-brand";
      back.href = BASE + "index.html";
      back.textContent = "← Kembali ke Portal Terpadu GIO910";
      left.appendChild(back);

      const right = document.createElement("div");
      right.className = "kuh-right";
      const supaBtn = document.createElement("button");
      supaBtn.type = "button";
      supaBtn.id = "kuh-supa-pill";
      supaBtn.className = "kuh-supa-btn";
      supaBtn.innerHTML = '<span class="kuh-dot"></span><span id="kuh-supa-text">Supabase Live</span>';
      supaBtn.addEventListener("click", openDiagModal);
      right.appendChild(supaBtn);

      bar.appendChild(left);
      bar.appendChild(right);
      if (document.body) document.body.insertBefore(bar, document.body.firstChild);
    }

    // Modal diagnosa backend Supabase (dibuka dari badge status header atau menu Video & Unduh)
    const modal = document.createElement("div");
    modal.id = "kuh-diag-modal";
    modal.innerHTML = `
      <div class="kuh-card" role="dialog" aria-modal="true" aria-labelledby="kuh-diag-title">
        <h3 id="kuh-diag-title">Status Backend Supabase &amp; Proyek Terpadu GIO910</h3>
        <p style="font-size:13px;color:#94a3b8;margin:0 0 10px">
          Endpoint Edge Function: <code style="color:#7dd3fc">gio910-api</code> (<code>dttclgkjfiwcovvqrckw</code>)
        </p>
        <pre id="kuh-diag-json">Memuat status...</pre>
        <div class="kuh-actions">
          <button type="button" class="primary" id="kuh-retest-btn">Uji Ulang /api/health</button>
          <button type="button" id="kuh-open-conn-btn">Hub Konektor (13)</button>
          <a class="kuh-act" href="${BASE}ekosistem.html">Buka Pusat Ekosistem</a>
          <button type="button" id="kuh-close-btn">Tutup</button>
        </div>
      </div>`;
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("is-open"); });
    document.body.appendChild(modal);
    modal.querySelector("#kuh-close-btn").addEventListener("click", () => modal.classList.remove("is-open"));
    modal.querySelector("#kuh-open-conn-btn").addEventListener("click", () => {
      modal.classList.remove("is-open");
      if (window.__KAI_OPEN_CONNECTORS_HUB__) window.__KAI_OPEN_CONNECTORS_HUB__("connectors");
      else location.href = BASE + "ekosistem.html#gio-connectors-mount";
    });
    modal.querySelector("#kuh-retest-btn").addEventListener("click", async () => {
      modal.querySelector("#kuh-diag-json").textContent = "Menghubungi Supabase gio910-api...";
      const st = await pingSupabase();
      updateDiagJson(st);
    });

    window.__KAI_OPEN_DIAG_MODAL__ = openDiagModal;
    pingSupabase();
  }

  async function pingSupabase() {
    if (window.__KAI_SUPABASE_BRIDGE__ && window.__KAI_SUPABASE_BRIDGE__.checkHealth) {
      const st = await window.__KAI_SUPABASE_BRIDGE__.checkHealth(true);
      paintStatus(st);
      return st;
    }
    const apiBase = String(window.__KAI_SUPABASE_API_URL__ || "https://dttclgkjfiwcovvqrckw.supabase.co/functions/v1/gio910-api").replace(/\/+$/, "");
    const anon = String(window.__KAI_SUPABASE_ANON_KEY__ || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dGNsZ2tqZml3Y292dnFyY2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2NTkzNzQsImV4cCI6MjExMTIzNTM3NH0.ozBfRkrgcVUBMfWTmOGhQprvoFLYcIzHr30-AGnlijE");
    const t0 = performance.now();
    let st;
    try {
      const r = await fetch(apiBase + "/api/health", {
        headers: { apikey: anon, Authorization: "Bearer " + anon },
      });
      const d = await r.json();
      st = {
        ok: Boolean(d && (d.status === "healthy" || d.success)),
        latencyMs: Math.round(performance.now() - t0),
        version: d.version || "1.2.0",
        integrations: d.integrations || {},
        error: null,
      };
    } catch (e) {
      st = { ok: false, latencyMs: Math.round(performance.now() - t0), error: e.message || String(e) };
    }
    paintStatus(st);
    return st;
  }

  function paintStatus(st) {
    const btn = document.getElementById("kuh-supa-pill");
    const txt = document.getElementById("kuh-supa-text");
    if (!btn || !txt || !st) return;
    btn.classList.remove("is-ok", "is-err");
    if (st.ok) {
      btn.classList.add("is-ok");
      txt.textContent = "Supabase Live · v" + (st.version || "1.2.0") + " (" + st.latencyMs + "ms)";
    } else {
      btn.classList.add("is-err");
      txt.textContent = "Supabase Offline (Fallback Lokal)";
    }
  }

  function updateDiagJson(st) {
    const pre = document.getElementById("kuh-diag-json");
    if (!pre) return;
    let sessMode = "Publik / Belum Login";
    try {
      const s = JSON.parse(sessionStorage.getItem("hi_session_v1") || "null");
      if (s && s.token) {
        const isLive = window.__KAI_SUPABASE_BRIDGE__ && window.__KAI_SUPABASE_BRIDGE__.isLiveSession(s.token);
        sessMode = isLive ? "Sesi Live Supabase Postgres (" + (s.user && s.user.Tier) + ")" : "Sesi Fallback Lokal (" + (s.user && s.user.Tier) + ")";
      }
    } catch (_) {}
    pre.textContent = JSON.stringify({
      unifiedVersion: window.__KAI_UNIFIED_VERSION__ || "2026.11.27-unified",
      supabaseApi: window.__KAI_SUPABASE_API_URL__ || "https://dttclgkjfiwcovvqrckw.supabase.co/functions/v1/gio910-api",
      health: st,
      sessionMode: sessMode,
    }, null, 2);
  }

  async function openDiagModal() {
    const modal = document.getElementById("kuh-diag-modal");
    if (!modal) return;
    modal.classList.add("is-open");
    const st = (window.__KAI_SUPABASE_BRIDGE__ && window.__KAI_SUPABASE_BRIDGE__.getHealth && window.__KAI_SUPABASE_BRIDGE__.getHealth().checkedAt)
      ? window.__KAI_SUPABASE_BRIDGE__.getHealth()
      : await pingSupabase();
    updateDiagJson(st);
  }

  window.addEventListener("kai-supabase-health", (ev) => {
    if (ev && ev.detail) paintStatus(ev.detail);
  });

  window.addEventListener("gio-realtime-update", (ev) => {
    const d = (ev && ev.detail) || {};
    const st = d.store || {};
    const pill = document.getElementById("kuh-conn-text");
    if (pill && st.connectorsData && st.connectorsData.summary) {
      const s = st.connectorsData.summary;
      pill.textContent = "Konektor " + s.on + "/" + s.total + " ON";
    }
    const supaTxt = document.getElementById("kuh-supa-text");
    const supaBtn = document.getElementById("kuh-supa-pill");
    if (supaTxt && supaBtn && st.wsStatus === "connected" && st.overview) {
      supaBtn.classList.remove("is-err");
      supaBtn.classList.add("is-ok");
      supaTxt.textContent = "Supabase WS · " + (st.subscribedTables || 36) + "T Live";
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderHub);
  } else {
    renderHub();
  }
})();
