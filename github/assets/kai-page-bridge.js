(function () {
  "use strict";
  const pageId = window.__KAI_EMBED_PAGE__ || "";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Text size sync
  const TEKS_MODES = ["nyaman", "besar", "padat"];
  function applyTeks(mode) {
    const m = TEKS_MODES.includes(mode) ? mode : "nyaman";
    document.documentElement.setAttribute("data-kai-teks", m);
    try { localStorage.setItem("kai-teks", m); } catch (_) {}
  }
  try { applyTeks(localStorage.getItem("kai-teks") || "nyaman"); } catch (_) { applyTeks("nyaman"); }

  // Table wrappers & labels for responsive horizontal scroll
  function wrapTables() {
    $$("main table").forEach((table) => {
      if (table.closest(".kai-table-wrap") || table.closest(".vn-scroll") || table.closest("[data-kai-skip-wrap]")) return;
      const wrap = document.createElement("div");
      wrap.className = "kai-table-wrap";
      wrap.setAttribute("role", "region");
      wrap.setAttribute("aria-label", "Tabel data, gulir horizontal");
      wrap.tabIndex = 0;
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
    $$(".kai-table-wrap, .vn-scroll").forEach((wrap) => {
      let hint = wrap.previousElementSibling;
      if (hint && hint.classList && hint.classList.contains("kai-table-hint")) hint.remove();
      if (wrap.scrollWidth > wrap.clientWidth + 2) {
        hint = document.createElement("div");
        hint.className = "kai-table-hint";
        hint.textContent = "Geser tabel horizontal →";
        wrap.parentNode.insertBefore(hint, wrap);
      }
    });
  }

  function fixBadge() {
    if (!document.body) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    let n;
    while ((n = walker.nextNode())) {
      if (/lengkapi semua|\[placeholder\]/i.test(n.nodeValue || "")) hits.push(n);
    }
    hits.forEach((node) => {
      const v = String(node.nodeValue);
      node.nodeValue = /contoh draft/i.test(v)
        ? "Isi lengkap · siap disesuaikan"
        : v.replace(/lengkapi semua/gi, "draf lengkap").replace(/\[placeholder\]/gi, "[siap disesuaikan]");
    });
  }

  // Height reporting to parent iframe host
  let lastH = 0;
  function sendHeight(force) {
    if (window.parent === window) return;
    const root = document.getElementById("root") || document.body;
    const h = Math.max(
      root ? root.scrollHeight : 0,
      document.body ? document.body.scrollHeight : 0,
      460
    );
    if (force || Math.abs(h - lastH) > 2) {
      lastH = h;
      try {
        window.parent.postMessage({ type: "kai-iframe-height", page: pageId, height: h }, "*");
      } catch (_) {}
    }
  }

  function enhanceDom() {
    wrapTables();
    fixBadge();
    sendHeight(false);
  }

  window.addEventListener("message", (ev) => {
    const m = ev && ev.data;
    if (!m || typeof m !== "object") return;
    if (m.type === "kai-request-height") {
      sendHeight(true);
    }
    if (m.type === "kai-set-teks") {
      applyTeks(m.mode);
      setTimeout(() => sendHeight(true), 60);
    }
    if (m.type === "kai-sync-session") {
      if (m.teks) applyTeks(m.teks);
      setTimeout(() => { enhanceDom(); sendHeight(true); }, 60);
    }
    if (m.type === "kai-scroll-berita") {
      setTimeout(() => {
        const el = $(".bn-head") || $("[class*='bn-']");
        if (el) {
          el.classList.add("kai-hit");
          setTimeout(() => el.classList.remove("kai-hit"), 4000);
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (window.parent !== window) {
            window.parent.postMessage({ type: "kai-scroll-to-rect", top }, "*");
          } else {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }, 80);
    }
    if (m.type === "kai-extract-text") {
      const main = $("#konten-utama") || document.body;
      const seen = new Set();
      const items = [];
      $$("h1,h2,h3,h4,p,li,tr,summary,.vn-name,.bn-name", main).forEach((el) => {
        const t = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
        if (t.length < 3 || t.length > 260 || seen.has(t)) return;
        seen.add(t);
        items.push(t);
      });
      try {
        ev.source && ev.source.postMessage({ type: "kai-extract-text-result", reqId: m.reqId, items }, "*");
      } catch (_) {}
    }
    if (m.type === "kai-highlight-text" && m.text) {
      const nodes = $$("#konten-utama *");
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
      const textOf = (el) => norm(el.innerText || el.textContent);
      const byDepth = (a, b) => a.children.length - b.children.length || textOf(a).length - textOf(b).length;
      let target = nodes.filter((el) => textOf(el) === m.text).sort(byDepth)[0];
      if (!target) {
        const prefix = m.text.slice(0, 70);
        target = nodes.filter((el) => textOf(el).startsWith(prefix)).sort(byDepth)[0];
      }
      if (!target && m.text.length > 60) {
        const mid = m.text.slice(15, 75);
        target = nodes.filter((el) => textOf(el).includes(mid)).sort(byDepth)[0];
      }
      if (target) {
        target.classList.add("kai-hit");
        setTimeout(() => target.classList.remove("kai-hit"), 4200);
        const top = target.getBoundingClientRect().top + window.scrollY;
        if (window.parent !== window) {
          window.parent.postMessage({ type: "kai-scroll-to-rect", top }, "*");
        } else {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  });

  function boot() {
    enhanceDom();
    try {
      const obs = new MutationObserver(() => enhanceDom());
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (_) {}
    if (window.ResizeObserver) {
      try {
        const ro = new ResizeObserver(() => sendHeight(false));
        ro.observe(document.body);
      } catch (_) {}
    }
    window.addEventListener("resize", () => sendHeight(true));
    setTimeout(() => sendHeight(true), 120);
    setTimeout(() => sendHeight(true), 500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
