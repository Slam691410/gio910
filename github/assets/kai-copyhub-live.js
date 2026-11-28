/* ============================================================
   KANTOR AI — COPY HUB LIVE BRIDGE v4.5 (SUPABASE + VERCEL + 13 KONEKTOR)
   Menghubungkan Pusat Parameter Terpadu (/api/copyhub/params), Matriks 13 Konektor,
   Formulir Membership (MEMBER30), Checkout ZIP, Jadwal Konsultasi (Calendar + Meet + Gmail),
   Live Chat Jadwal WIB, Admin Login/Settings & Absensi ke Supabase gio910-api & Vercel Proxy.
   ============================================================ */
(() => {
  "use strict";

  const API_BASE = String(
    (window.__KAI_HUB_PARAMS__ && window.__KAI_HUB_PARAMS__.supabaseApiUrl) ||
      window.__KAI_SUPABASE_API_URL__ ||
      "https://dttclgkjfiwcovvqrckw.supabase.co/functions/v1/gio910-api"
  ).replace(/\/+$/, "");
  const ANON_KEY = String(
    (window.__KAI_HUB_PARAMS__ && window.__KAI_HUB_PARAMS__.supabaseAnonKey) ||
      window.__KAI_SUPABASE_ANON_KEY__ ||
      ""
  ).trim();
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function activeApiBase() {
    return String(
      (document.getElementById("api-url-inp")?.value || "").trim() ||
        window.__KAI_SUPABASE_API_URL__ ||
        API_BASE
    ).replace(/\/+$/, "");
  }
  function activeAnonKey() {
    return String(
      (document.getElementById("p-supa-anon")?.value || "").trim() ||
        window.__KAI_SUPABASE_ANON_KEY__ ||
        ANON_KEY
    ).trim();
  }

  async function api(method, path, body, token) {
    const h = { "Content-Type": "application/json" };
    const k = activeAnonKey();
    if (k) {
      h["apikey"] = k;
      h["Authorization"] = "Bearer " + k;
    }
    if (token && UUID_RE.test(token)) h["x-gio-session"] = token;
    const res = await fetch(activeApiBase() + path, {
      method,
      headers: h,
      body: body !== undefined && method !== "GET" ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "HTTP " + res.status);
    return data;
  }

  function getActiveToken() {
    try {
      const s = JSON.parse(sessionStorage.getItem("hi_session_v1") || "null");
      if (s && s.token && UUID_RE.test(s.token)) return s.token;
    } catch (_) {}
    return "";
  }

  function buildGmailComposeUrl(to, subj, body) {
    const qs = new URLSearchParams({ view: "cm", fs: "1", to: to || "", su: subj || "", body: body || "" });
    return "https://mail.google.com/mail/?" + qs.toString();
  }

  window.__KAI_COPYHUB_GAS_DISPATCH__ = async function dispatchCopyHub(route, token, p) {
    p = p || {};
    if (route === "auth.otpRequest") {
      const r = await api("POST", "/api/auth/send-otp", { email: p.email, id: p.id });
      return {
        ok: true,
        delivery: r.delivery === "in-app-db" ? "preview" : r.delivery,
        maskedEmail: r.maskedEmail,
        previewOtp: r.previewOtp,
      };
    }
    if (route === "auth.login") {
      return api("POST", "/api/auth/verify-otp", {
        email: p.email,
        code: p.otp,
        faceImage: p.faceImage ? "[captured]" : undefined,
        lat: p.lat,
        lng: p.lng,
      });
    }
    if (route === "auth.loginPin") {
      return api("POST", "/api/auth/login-pin", {
        id: p.id,
        email: p.email,
        pin: p.pin,
        kendala: p.kendala,
      });
    }
    if (route === "auth.loginManualZip" || route === "auth.loginManual") {
      return api("POST", "/api/auth/login-manual", p);
    }
    if (route === "absen.challenge") {
      return api("GET", "/api/absen/challenge", undefined, token || getActiveToken());
    }
    if (route === "auth.logout") {
      try { await api("POST", "/api/auth/logout", {}, token || getActiveToken()); } catch (_) {}
      return { ok: true };
    }
    if (route === "absen.submit") {
      const d = await api("POST", "/api/absen", p, token || getActiveToken());
      return d.absensi || d;
    }
    throw new Error("Route live belum dipetakan: " + route);
  };

  function renderConnectorsMatrix(connectors) {
    const box = document.getElementById("hub-connectors-matrix");
    if (!box || !Array.isArray(connectors)) return;
    const onCount = connectors.filter((c) => c.arena_status === "on").length;
    const offCount = connectors.length - onCount;
    box.innerHTML =
      `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">` +
      `<span style="font-size:12.5px;font-weight:800;color:#e8eefc">Status Live ${connectors.length} Konektor Ekosistem (<span style="color:#6ee7b7">${onCount} Aktif</span> · <span style="color:#fbbf24">${offCount} Dijeda</span>)</span>` +
      `<button type="button" id="hub-open-conn-btn" class="btn-view" style="padding:5px 10px;font-size:11.5px;border-color:#38bdf8;color:#7dd3fc">Buka Hub Konektor ↗</button>` +
      `</div>` +
      `<div style="display:flex;flex-wrap:wrap;gap:6px">` +
      connectors
        .map((c) => {
          const isOn = c.arena_status === "on";
          const bg = isOn ? "rgba(52,211,153,.12)" : "rgba(251,191,36,.12)";
          const bd = isOn ? "rgba(52,211,153,.45)" : "rgba(251,191,36,.4)";
          const fg = isOn ? "#6ee7b7" : "#fbbf24";
          const st = isOn ? "ON" : "DIJEDA";
          return `<span title="${esc(c.name)} (${esc(c.category || "")})" style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;font-size:11.5px;font-weight:700;background:${bg};border:1px solid ${bd};color:${fg}"><span>${esc(c.slug)}</span><span style="opacity:.85">· ${st}</span></span>`;
        })
        .join("") +
      `</div>`;
    box.querySelector("#hub-open-conn-btn")?.addEventListener("click", () => {
      if (window.__KAI_OPEN_CONNECTORS_HUB__) window.__KAI_OPEN_CONNECTORS_HUB__("connectors");
      else window.open("/ekosistem.html#gio-connectors-mount", "_blank");
    });
  }

  function applyRemoteHubParams(p, connectors) {
    if (p && typeof p === "object") {
      const merged = { ...(window.__KAI_HUB_PARAMS__ || {}), ...p };
      window.__KAI_HUB_PARAMS__ = merged;
      if (merged.supabaseUrl) window.__KAI_SUPABASE_URL__ = merged.supabaseUrl;
      if (merged.supabaseApiUrl) window.__KAI_SUPABASE_API_URL__ = merged.supabaseApiUrl;
      if (merged.supabaseAnonKey && merged.supabaseAnonKey.startsWith("eyJ")) {
        window.__KAI_SUPABASE_ANON_KEY__ = merged.supabaseAnonKey;
      }
      if (merged.vercelUrl) window.__KAI_VERCEL_URL__ = merged.vercelUrl;
      try { localStorage.setItem("kai_hub_params_v1", JSON.stringify(merged)); } catch (_) {}
      const setVal = (id, v) => {
        const el = document.getElementById(id);
        if (el && v !== undefined && v !== null && String(v).length > 0 && !el.value) el.value = String(v);
      };
      setVal("p-supa-url", merged.supabaseUrl);
      setVal("api-url-inp", merged.supabaseApiUrl);
      setVal("p-supa-anon", merged.supabaseAnonKey);
      setVal("p-vercel-url", merged.vercelUrl);
      setVal("p-conn-proxy", merged.connectorsProxy || "/api/connectors");
      setVal("maps-key-inp", merged.mapsKey);
      setVal("p-freename-dom", merged.freenameDomain);
      setVal("p-ens-space", merged.ensSpace);
      setVal("p-dao-dom", merged.daoDomain);
      setVal("p-chain-id", merged.chainId);
      setVal("exec-url-inp", merged.vercelUrl);
    }
    if (Array.isArray(connectors)) {
      renderConnectorsMatrix(connectors);
    }
  }

  // Hydrate Copy Hub Parameters & 13 Connectors directly from Supabase
  api("GET", "/api/copyhub/params")
    .then((r) => {
      if (r && r.success) applyRemoteHubParams(r.params, r.connectors);
      const st = document.getElementById("hub-params-sync-status");
      if (st && r && r.params) {
        st.style.color = "#6ee7b7";
        st.textContent = "✓ Tersinkron live dengan Supabase Postgres (COPYHUB_HUB_PARAMS · " + (r.connectors ? r.connectors.length : 13) + " konektor)";
      }
    })
    .catch(() => {});

  // Sync Hub Params back to Supabase Postgres on Save
  const saveHubBtn = document.getElementById("btn-save-hub-params");
  if (saveHubBtn) {
    saveHubBtn.addEventListener("click", () => {
      const payload = {
        supabaseUrl: (document.getElementById("p-supa-url")?.value || "").trim(),
        supabaseApiUrl: (document.getElementById("api-url-inp")?.value || "").trim(),
        supabaseAnonKey: (document.getElementById("p-supa-anon")?.value || "").trim(),
        vercelUrl: (document.getElementById("p-vercel-url")?.value || "").trim(),
        connectorsProxy: (document.getElementById("p-conn-proxy")?.value || "").trim() || "/api/connectors",
        mapsKey: (document.getElementById("maps-key-inp")?.value || "").trim(),
        freenameDomain: (document.getElementById("p-freename-dom")?.value || "").trim() || "geraiinovasiolahan.gio910",
        ensSpace: (document.getElementById("p-ens-space")?.value || "").trim() || "gio910gerai.eth",
        daoDomain: (document.getElementById("p-dao-dom")?.value || "").trim() || "gio910gerai.dao",
        chainId: (document.getElementById("p-chain-id")?.value || "").trim() || "8453",
      };
      const tok = getActiveToken();
      const st = document.getElementById("hub-params-sync-status");
      if (!tok) {
        if (st) {
          st.style.color = "#fbbf24";
          st.textContent = "Parameter tersimpan lokal; login sebagai Pemilik/Manajemen untuk menyimpan langsung ke Supabase.";
        }
        return;
      }
      if (st) {
        st.style.color = "#93c5fd";
        st.textContent = "Menyinkronkan parameter ke Supabase Postgres…";
      }
      api("POST", "/api/copyhub/params", payload, tok)
        .then((res) => {
          if (st) {
            st.style.color = "#6ee7b7";
            st.textContent = "✓ Tersimpan di browser & Supabase Postgres (COPYHUB_HUB_PARAMS · " + new Date().toLocaleTimeString("id-ID") + ")";
          }
          if (res && res.params) applyRemoteHubParams(res.params, null);
        })
        .catch((err) => {
          if (st) {
            st.style.color = "#fca5a5";
            st.textContent = "Tersimpan lokal, gagal sinkron Postgres: " + (err && err.message ? err.message : String(err));
          }
        });
    });
  }

  api("GET", "/api/copyhub/config").then((r) => {
    if (!r || !r.config) return;
    try {
      for (const key of ["kai_copyhub_pay_cfg_v1", "kai_pay_cfg_v1"]) {
        const cur = JSON.parse(localStorage.getItem(key) || "{}");
        localStorage.setItem(key, JSON.stringify({
          ...cur,
          dest: r.config.dest || cur.dest || "",
          discPct: r.config.discPct ?? cur.discPct ?? 30,
        }));
      }
      const destEl = document.getElementById("pay-dest-text");
      if (destEl && r.config.dest) destEl.textContent = r.config.dest;
      const destInp = document.getElementById("pay-dest-inp");
      if (destInp && r.config.dest) destInp.value = r.config.dest;
      const discInp = document.getElementById("pay-disc-inp");
      if (discInp && r.config.discPct != null) discInp.value = String(r.config.discPct);
    } catch (_) {}
  }).catch(() => {});

  const saveCfgBtn = document.getElementById("btn-save-paycfg");
  if (saveCfgBtn) {
    saveCfgBtn.addEventListener("click", () => {
      const tok = getActiveToken();
      if (!tok) return;
      const dest = (document.getElementById("pay-dest-inp")?.value || "").trim();
      const discPct = Number(document.getElementById("pay-disc-inp")?.value || 30);
      const unlockCode = (document.getElementById("pay-code-inp")?.value || "").trim();
      api("POST", "/api/copyhub/config", { dest, discPct, unlockCode }, tok).catch(() => {});
    }, true);
  }

  const subForm = document.getElementById("kai-sub-form");
  if (subForm) {
    subForm.addEventListener("submit", () => {
      const nama = (document.getElementById("sub-nama")?.value || "").trim();
      const email = (document.getElementById("sub-email")?.value || "").trim();
      const wa = (document.getElementById("sub-wa")?.value || "").trim();
      const paket = (document.getElementById("sub-paket")?.value || "Paket 1 · Source Code Penuh").trim();
      if (!nama || !email || !wa) return;
      api("POST", "/api/copyhub/subscribe", { nama, email, wa, paket }).then((res) => {
        if (res && res.member) {
          try {
            localStorage.setItem("kai_copyhub_member_v1", JSON.stringify(res.member));
            localStorage.setItem("kai_membership_v1", JSON.stringify(res.member));
          } catch (_) {}
          const mailUrl = buildGmailComposeUrl(email, `Aktivasi Membership GIO910 (${res.member.coupon})`, `Halo ${nama},\nID Member: ${res.member.memberId}\nKupon Diskon 30%: ${res.member.coupon}`);
          const stat = document.getElementById("kai-sub-status");
          if (stat) {
            stat.classList.add("is-on");
            stat.innerHTML =
              "<strong>✓ Membership Tersimpan di Supabase + Google Sheets (Konektor_Web) + Gmail Outbox!</strong><br/>" +
              "Member: <b>" + esc(res.member.nama) + "</b> (ID: <code>" + esc(res.member.memberId) + "</code>) · " +
              "Kode Diskon " + esc(res.member.discPct) + "%: <code>" + esc(res.member.coupon) + "</code> · " +
              '<a href="' + esc(mailUrl) + '" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;font-weight:700">Kirim Kartu via Gmail ↗</a>';
          }
        }
      }).catch(() => {});
    }, true);

    if (!document.getElementById("kai-ch-sched-box")) {
      const box = document.createElement("div");
      box.id = "kai-ch-sched-box";
      box.style.cssText = "margin-top:16px;padding:14px 16px;border-radius:12px;background:#0f1a2c;border:1px solid var(--gio-accent-border,rgba(56,189,248,.35));color:#e8eefc";
      const defSlot = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16);
      box.innerHTML = `
        <strong style="color:var(--gio-accent,#7dd3fc);display:block;margin-bottom:6px;font-size:14px">📅 Jadwalkan Konsultasi Live (Google Calendar + Video Meet + Gmail Outbox)</strong>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <input id="chs-name" type="text" placeholder="Nama lengkap…" style="flex:1 1 150px;padding:8px 10px;border-radius:8px;border:1px solid #2b4370;background:#08101e;color:#fff" />
          <input id="chs-email" type="email" placeholder="Email aktif…" style="flex:1 1 180px;padding:8px 10px;border-radius:8px;border:1px solid #2b4370;background:#08101e;color:#fff" />
          <input id="chs-slot" type="datetime-local" value="${esc(defSlot)}" style="padding:8px 10px;border-radius:8px;border:1px solid #2b4370;background:#08101e;color:#fff" />
          <input id="chs-topic" type="text" value="Konsultasi Paket Website & Domain Web3 GIO910 (Supabase + Vercel)" style="flex:1 1 200px;padding:8px 10px;border-radius:8px;border:1px solid #2b4370;background:#08101e;color:#fff" />
          <button id="chs-submit" type="button" style="padding:9px 14px;border-radius:8px;border:0;background:var(--gio-accent,#38bdf8);color:var(--gio-accent-ink,#062536);font-weight:800;cursor:pointer">Booking Jadwal</button>
        </div>
        <div id="chs-out" style="margin-top:8px;font-size:12.5px;color:#9fb0d0"></div>
      `;
      const anchor = subForm.closest("section, .card, div") || subForm.parentNode;
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor.nextSibling);
      box.querySelector("#chs-submit").addEventListener("click", async () => {
        const out = box.querySelector("#chs-out");
        out.style.color = "#93c5fd";
        out.textContent = "Mencatat jadwal ke Google Calendar + Meet…";
        try {
          const r = await api("POST", "/api/copyhub/schedule", {
            name: box.querySelector("#chs-name").value.trim() || "Tamu Copy Hub",
            email: box.querySelector("#chs-email").value.trim(),
            slot: box.querySelector("#chs-slot").value,
            topic: box.querySelector("#chs-topic").value.trim(),
          });
          out.style.color = "#6ee7b7";
          out.innerHTML =
            `✓ ${esc(r.message)} ` +
            `<a href="${esc(r.googleCalUrl)}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;font-weight:700;margin-left:8px">Tambah ke Google Calendar ↗</a>` +
            `<a href="${esc(r.meetLink)}" target="_blank" rel="noopener noreferrer" style="color:#34d399;font-weight:700;margin-left:8px">Buka Ruang Meet ↗</a>` +
            `<a href="${esc(r.gmailComposeUrl)}" target="_blank" rel="noopener noreferrer" style="color:#fbbf24;font-weight:700;margin-left:8px">Kirim Undangan Gmail ↗</a>`;
        } catch (e) {
          out.style.color = "#fca5a5";
          out.textContent = e.message;
        }
      });
    }
  }

  const verifyBtn = document.getElementById("pay-verify-btn");
  if (verifyBtn) {
    verifyBtn.addEventListener("click", () => {
      const pkgName = (document.getElementById("pay-pkg-name")?.textContent || "").toLowerCase();
      const pkgKey = pkgName.includes("paket 2") || pkgName.includes("backend supabase") ? "pkg2" : pkgName.includes("dao") ? "pkg3" : "pkg1";
      const coupon = (document.getElementById("pay-coupon-inp")?.value || "").trim().toUpperCase();
      const unlockCode = (document.getElementById("pay-unlock-inp")?.value || "").trim().toUpperCase();
      let mem = null;
      try { mem = JSON.parse(localStorage.getItem("kai_copyhub_member_v1") || localStorage.getItem("kai_membership_v1") || "null"); } catch (_) {}
      if (!unlockCode) return;
      api("POST", "/api/copyhub/checkout", {
        pkgKey,
        coupon: coupon || (mem && mem.coupon) || "",
        memberCode: mem && mem.memberId,
        buyerName: mem && mem.nama,
        buyerEmail: mem && mem.email,
        buyerWa: mem && mem.wa,
        unlockCode,
      }).then((res) => {
        if (res && res.order) {
          const stEl = document.getElementById("pay-member-badge");
          if (stEl) {
            stEl.textContent = "✓ Order " + res.order.order_code + " tersinkron Postgres + Sheets + Notion (Rp" + Number(res.order.price_final).toLocaleString("id-ID") + ")";
            stEl.style.color = "#6ee7b7";
          }
        }
      }).catch(() => {});
    }, true);
  }

  const chatForm = document.getElementById("kai-chat-form");
  if (chatForm) {
    const sessKey = "guest-" + Date.now().toString(36);
    chatForm.addEventListener("submit", () => {
      const inp = document.getElementById("kai-chat-inp");
      const msg = (inp && inp.value || "").trim();
      if (!msg) return;
      api("POST", "/api/copyhub/chat", { message: msg, sessionKey: sessKey }).then((res) => {
        const box = document.getElementById("kai-chat-msgs");
        if (res && res.reply && box) {
          const d = document.createElement("div");
          d.className = "cmsg bot";
          d.textContent = "GIO910 Live (Postgres): " + res.reply;
          box.appendChild(d);
          box.scrollTop = box.scrollHeight;
        }
      }).catch(() => {});
    }, true);
  }

  /* ===== v4.6 ABSENSI BERLAPIS ANTI-CURANG DI COPY HUB ===== */
  function openSecureCopyHubAbsen(ev) {
    if (window.__KAI_SECURITY__ && window.__KAI_SECURITY__.openLayeredAttendanceModal) {
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      document.getElementById("kai-admin-modal")?.classList.remove("is-open");
      document.getElementById("kai-absen-modal")?.classList.remove("is-open");
      window.__KAI_SECURITY__.openLayeredAttendanceModal({ endpoint: "/api/absen" }).catch((err) => {
        const msg = err && err.message ? err.message : "Silakan login akun terlebih dahulu.";
        const adm = document.getElementById("kai-admin-modal");
        if (adm) {
          adm.classList.add("is-open");
          const m = document.getElementById("adm-msg");
          if (m) {
            m.style.color = "#fbbf24";
            m.textContent = msg + " — Gunakan tab Login Admin untuk masuk sebelum Absen Berlapis.";
          }
        }
      });
    }
  }
  ["btn-absen-popup", "btn-open-absen", "admin-switch-absen", "abs-submit-btn"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", openSecureCopyHubAbsen, true);
  });

  /* ===== v4.6 LIVE BLOG COPY HUB (ADMIN SUPABASE + WORDPRESS SYNC) ===== */
  function readAnyAdminSess() {
    const keys = ["kai_copyhub_admin_sess_v1", "hi_session_v1"];
    for (const k of keys) {
      for (const st of [sessionStorage, localStorage]) {
        try {
          const s = JSON.parse(st.getItem(k) || "null");
          if (s && s.token && s.user && /pemilik|manajemen/i.test(String(s.user.Tier || ""))) {
            return s;
          }
        } catch (_) {}
      }
    }
    return null;
  }

  function ensureBlogReaderModal() {
    let m = document.getElementById("kai-blog-reader-modal");
    if (m) return m;
    m = document.createElement("div");
    m.id = "kai-blog-reader-modal";
    m.className = "modal";
    m.innerHTML = `
      <div class="modal-card" style="max-width:760px">
        <div class="modal-head">
          <div>
            <b id="br-title" style="color:#f8fafc;font-size:16px">Artikel Blog</b>
            <div id="br-meta" style="font-size:11.5px;color:#9fb0d0;margin-top:2px"></div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <a id="br-wp-link" href="#" target="_blank" rel="noopener noreferrer" class="btn-view" style="display:none;border-color:#38bdf8;color:#7dd3fc">WordPress ↗</a>
            <button type="button" class="btn-view" id="br-close">Tutup ×</button>
          </div>
        </div>
        <div id="br-body" style="padding:18px 20px;overflow:auto;max-height:76vh;color:#dbeafe;font-size:14px;line-height:1.72;white-space:pre-line"></div>
      </div>`;
    document.body.appendChild(m);
    m.querySelector("#br-close").addEventListener("click", () => m.classList.remove("is-open"));
    m.addEventListener("click", (ev) => { if (ev.target === m) m.classList.remove("is-open"); });
    return m;
  }

  function openBlogPostReader(post) {
    const m = ensureBlogReaderModal();
    m.querySelector("#br-title").textContent = post.title || "";
    m.querySelector("#br-meta").textContent =
      `${post.category || "Artikel"} · Oleh ${post.author_name || "Admin"} · ` +
      new Date(post.published_at || post.created_at || Date.now()).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) +
      (post.wp_post_id ? ` · WordPress ID #${post.wp_post_id}` : "");
    m.querySelector("#br-body").textContent = post.content || post.excerpt || "";
    const wpA = m.querySelector("#br-wp-link");
    if (post.wp_url) {
      wpA.href = post.wp_url;
      wpA.style.display = "inline-flex";
    } else {
      wpA.style.display = "none";
    }
    m.classList.add("is-open");
  }

  function mountBlogSection() {
    const topArt = document.getElementById("top-artikel");
    if (!topArt || document.getElementById("copyhub-blog-section")) return;
    const nav = document.querySelector(".portal-nav-inner");
    if (nav && !document.getElementById("nav-blog-live")) {
      const a = document.createElement("a");
      a.id = "nav-blog-live";
      a.className = "portal-tab is-accent";
      a.href = "#copyhub-blog-section";
      a.textContent = "📰 Blog Live & WordPress";
      nav.insertBefore(a, nav.firstChild);
    }

    const sec = document.createElement("section");
    sec.id = "copyhub-blog-section";
    sec.className = "wrap";
    sec.style.cssText = "padding-top:14px;padding-bottom:6px";
    sec.innerHTML = `
      <div class="seo-card" style="margin-bottom:14px;border-color:rgba(56,189,248,.35)">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px">
          <div>
            <span class="badge-free" style="margin-bottom:6px">GIO910.BLOG · Live Supabase + WordPress Sync</span>
            <h2 style="margin:4px 0 4px;font-size:20px;color:#f8fafc">Arsip Blog &amp; Publikasi Resmi Holding</h2>
            <p style="margin:0;font-size:13px;color:#9fb0d0">Artikel terbaru tersimpan di Supabase Postgres dan tersinkron langsung ke WordPress <code>gio910blog.wordpress.com</code>.</p>
          </div>
          <div id="blog-admin-actions" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"></div>
        </div>
        <div id="blog-publisher-wrap" style="display:none;margin-bottom:16px;padding:14px 16px;border-radius:12px;background:#09111f;border:1px solid #1d4ed8">
          <div style="font-size:13.5px;font-weight:800;color:#7dd3fc;margin-bottom:10px">✍️ Terbitkan Artikel Blog Baru (Admin Only · Supabase + WordPress)</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:10px">
            <input id="blog-pub-title" type="text" placeholder="Judul artikel blog…" class="domain-inp" />
            <select id="blog-pub-cat" class="domain-inp">
              <option value="Strategi Digital">Strategi Digital</option>
              <option value="Investasi">Investasi</option>
              <option value="Holding OS">Holding OS</option>
              <option value="Web3 & AI">Web3 &amp; AI</option>
            </select>
          </div>
          <input id="blog-pub-excerpt" type="text" placeholder="Ringkasan singkat artikel (opsional)…" class="domain-inp" style="width:100%;margin-bottom:10px" />
          <textarea id="blog-pub-content" rows="5" placeholder="Tulis konten lengkap artikel di sini (minimal 10 karakter)…" class="domain-inp" style="width:100%;margin-bottom:10px;font-family:inherit;resize:vertical"></textarea>
          <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px">
            <label style="font-size:12.5px;color:#cfe0ff;display:flex;align-items:center;gap:7px;cursor:pointer">
              <input type="checkbox" id="blog-pub-wp" checked /> Sinkronkan otomatis ke WordPress (<code>gio910blog.wordpress.com</code>)
            </label>
            <button type="button" id="blog-pub-submit" class="btn-copy" style="flex:0 0 auto;background:#38bdf8;border-color:#38bdf8;color:#06222f">🚀 Publikasikan Artikel Sekarang</button>
          </div>
          <div id="blog-pub-status" style="margin-top:8px;font-size:12.5px"></div>
        </div>
        <div id="blog-posts-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px">
          <div style="color:#9fb0d0;font-size:13px">Memuat artikel dari Supabase…</div>
        </div>
      </div>`;
    topArt.parentNode.insertBefore(sec, topArt);

    let cachedPosts = [];
    const renderAdminControls = () => {
      const adm = readAnyAdminSess();
      const actBox = document.getElementById("blog-admin-actions");
      const pubWrap = document.getElementById("blog-publisher-wrap");
      if (adm) {
        if (pubWrap) pubWrap.style.display = "block";
        if (actBox) {
          actBox.innerHTML =
            `<span style="font-size:12px;color:#6ee7b7;font-weight:700">✓ Admin: ${esc(adm.user.ID)} (${esc(adm.user.Tier)})</span>` +
            `<button type="button" id="blog-zip-btn" class="btn-view" style="font-size:11.5px">🔐 Password &amp; .ZIP</button>`;
          actBox.querySelector("#blog-zip-btn")?.addEventListener("click", () => {
            if (window.__KAI_SECURITY__) window.__KAI_SECURITY__.openPasswordZipModal();
          });
        }
      } else {
        if (pubWrap) pubWrap.style.display = "none";
        if (actBox) {
          actBox.innerHTML = `<button type="button" id="blog-open-login" class="btn-view" style="border-color:#38bdf8;color:#7dd3fc">🔐 Login Admin untuk Terbitkan Blog</button>`;
          actBox.querySelector("#blog-open-login")?.addEventListener("click", () => {
            (document.getElementById("btn-admin-login") || document.getElementById("btn-open-admin"))?.click() || document.getElementById("kai-admin-modal")?.classList.add("is-open");
          });
        }
      }
      renderPosts(cachedPosts);
    };

    function renderPosts(posts) {
      cachedPosts = Array.isArray(posts) ? posts : [];
      const grid = document.getElementById("blog-posts-grid");
      if (!grid) return;
      const adm = readAnyAdminSess();
      if (!cachedPosts.length) {
        grid.innerHTML = `<div style="color:#9fb0d0;font-size:13px">Belum ada artikel blog tersimpan.</div>`;
        return;
      }
      grid.innerHTML = cachedPosts
        .map((p, idx) => {
          const dt = new Date(p.published_at || p.created_at || Date.now()).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
          const wpBadge = p.wp_url
            ? `<a href="${esc(p.wp_url)}" target="_blank" rel="noopener noreferrer" style="color:#6ee7b7;font-size:11px;font-weight:700;text-decoration:none">WordPress Live ↗</a>`
            : `<span style="color:#9fb0d0;font-size:11px">Supabase Blog</span>`;
          return `
            <article style="background:#0f1a2c;border:1px solid #22365c;border-radius:12px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;gap:10px">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px">
                  <span style="font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:#173056;color:#7dd3fc">${esc(p.category || "Artikel")}</span>
                  ${wpBadge}
                </div>
                <h3 style="margin:0 0 6px;font-size:15px;line-height:1.35;color:#f8fafc">${esc(p.title)}</h3>
                <p style="margin:0;font-size:12.5px;color:#9fb0d0;line-height:1.5">${esc(p.excerpt || String(p.content || "").slice(0, 150))}</p>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;border-top:1px dashed #22365c;padding-top:8px">
                <span style="font-size:11px;color:#7c8fb3">${esc(dt)} · ${esc(p.author_name || "Admin")}</span>
                <div style="display:flex;gap:6px">
                  <button type="button" class="btn-view blog-read-btn" data-idx="${idx}" style="font-size:11.5px;padding:4px 10px">Baca →</button>
                  ${adm ? `<button type="button" class="btn-view blog-del-btn" data-id="${esc(p.id)}" style="font-size:11.5px;padding:4px 8px;border-color:#7f1d1d;color:#fca5a5">Hapus</button>` : ""}
                </div>
              </div>
            </article>`;
        })
        .join("");
      grid.querySelectorAll(".blog-read-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const post = cachedPosts[Number(btn.getAttribute("data-idx"))];
          if (post) openBlogPostReader(post);
        });
      });
      grid.querySelectorAll(".blog-del-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const pid = btn.getAttribute("data-id");
          const s = readAnyAdminSess();
          if (!pid || !s) return;
          if (!confirm("Hapus artikel ini dari Copy Hub?")) return;
          try {
            await api("DELETE", "/api/copyhub/blog?id=" + encodeURIComponent(pid), undefined, s.token);
            await refreshBlog();
          } catch (e) {
            alert(e.message || "Gagal menghapus artikel.");
          }
        });
      });
    }

    async function refreshBlog() {
      try {
        const res = await api("GET", "/api/copyhub/blog");
        renderPosts(res.posts || []);
        const slugQ = new URLSearchParams(location.search).get("post");
        if (slugQ && Array.isArray(res.posts)) {
          const found = res.posts.find((x) => x.slug === slugQ);
          if (found) openBlogPostReader(found);
        }
      } catch (e) {
        const grid = document.getElementById("blog-posts-grid");
        if (grid) grid.innerHTML = `<div style="color:#fca5a5;font-size:13px">Gagal memuat blog: ${esc(e.message)}</div>`;
      }
    }

    sec.querySelector("#blog-pub-submit")?.addEventListener("click", async () => {
      const adm = readAnyAdminSess();
      const st = document.getElementById("blog-pub-status");
      if (!adm) {
        st.style.color = "#fca5a5";
        st.textContent = "Login Admin terlebih dahulu.";
        return;
      }
      const title = (document.getElementById("blog-pub-title")?.value || "").trim();
      const category = (document.getElementById("blog-pub-cat")?.value || "Strategi Digital").trim();
      const excerpt = (document.getElementById("blog-pub-excerpt")?.value || "").trim();
      const content = (document.getElementById("blog-pub-content")?.value || "").trim();
      const syncWordPress = !!document.getElementById("blog-pub-wp")?.checked;
      if (title.length < 4 || content.length < 10) {
        st.style.color = "#fca5a5";
        st.textContent = "Judul minimal 4 karakter dan isi konten minimal 10 karakter.";
        return;
      }
      st.style.color = "#93c5fd";
      st.textContent = syncWordPress ? "Menyimpan ke Postgres & menyinkronkan ke WordPress…" : "Menyimpan artikel ke Supabase Postgres…";
      try {
        const r = await api("POST", "/api/copyhub/blog", { title, category, excerpt, content, syncWordPress }, adm.token);
        document.getElementById("blog-pub-title").value = "";
        document.getElementById("blog-pub-excerpt").value = "";
        document.getElementById("blog-pub-content").value = "";
        st.style.color = "#6ee7b7";
        st.innerHTML =
          `✓ ${esc(r.message || "Artikel berhasil diterbitkan!")}` +
          (r.wordpress && r.wordpress.url ? ` · <a href="${esc(r.wordpress.url)}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;font-weight:700">Lihat di WordPress ↗</a>` : "");
        await refreshBlog();
      } catch (e) {
        st.style.color = "#fca5a5";
        st.textContent = "Gagal menerbitkan artikel: " + (e.message || String(e));
      }
    });

    window.addEventListener("kai-admin-login-changed", renderAdminControls);
    document.getElementById("adm-login-std-btn")?.addEventListener("click", () => setTimeout(renderAdminControls, 600));
    renderAdminControls();
    refreshBlog();
  }

  mountBlogSection();
})();
