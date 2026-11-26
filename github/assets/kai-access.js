/* Kebijakan akses tunggal: dipakai bundel React (gerbang halaman), toolbar, pencarian, dan register.
   Catatan jujur: pada mode mandiri (satu berkas, tanpa server) pemisahan ini berlaku di tingkat tampilan/aplikasi;
   penegakan yang mengikat ada di Code.gs (server) saat dipasang di Google Apps Script. */
(function () {
  "use strict";
  var KEY = "hi_session_v1", cache = null, at = 0, last = "__init__";
  function read() {
    try { var s = JSON.parse(sessionStorage.getItem(KEY) || "null"); return s && s.token && s.user && !(s.exp && Date.now() > s.exp) ? s : null; }
    catch (e) { return null; }
  }
  function paint(s) {
    var b = document.body; if (!b) return;
    b.classList.toggle("kai-authed", !!s); b.classList.toggle("kai-public", !s);
    if (s) b.setAttribute("data-kai-tier", s.user.Tier || ""); else b.removeAttribute("data-kai-tier");
    var el = document.getElementById("kai-access-state");
    if (el) el.textContent = s ? "Masuk sebagai " + (s.user.Tier || "—") + " — tampilan kerja internal sesuai peran." : "Tampilan publik — data kerja internal terbuka setelah masuk.";
  }
  function refresh() {
    cache = read(); at = Date.now();
    var sig = cache ? cache.token + "|" + (cache.user.Tier || "") : "";
    paint(cache);
    if (sig !== last) {
      var first = last === "__init__"; last = sig;
      if (!cache) { try { Array.prototype.forEach.call(document.querySelectorAll(".kai-modal.is-open"), function (m) { if (m.id !== "kai-info-modal" && m.id !== "kai-search-modal") m.classList.remove("is-open"); }); } catch (e) {} }
      if (!first || cache) { try { window.dispatchEvent(new CustomEvent("kai-session-change", { detail: { authed: !!cache, tier: cache ? cache.user.Tier : null } })); } catch (e) {} }
    }
    return cache;
  }
  var P = "Pemilik", M = "Manajemen", S = "Staf", F = "Freelancer", A = "Auditor";
  window.__kaiSess = function () { if (Date.now() - at > 400) refresh(); return cache; };
  window.__kaiSessTouch = refresh;
  window.__kaiAuthed = function () { return !!window.__kaiSess(); };
  window.__kaiTier = function () { var s = window.__kaiSess(); return s ? s.user.Tier : null; };
  window.__KAI_PAGE_IDS__ = ["kantor", "ringkas", "org", "tugas", "inv", "aset", "dokumen", "alur", "vendor", "unduh"];
  /* null = halaman publik (konten umum, data pribadi & angka internal disamarkan); array = wajib masuk dengan peran tsb. */
  window.__KAI_PAGE_TIER__ = Object.freeze({
    kantor: null, ringkas: null, org: null,
    tugas: Object.freeze([P, M, S, F, A]),
    inv: Object.freeze([P, M, S, A]),
    aset: null, dokumen: null, alur: null,
    vendor: Object.freeze([P, M, A]),
    unduh: null
  });
  window.__kaiPageAllowed = function (id) { var need = window.__KAI_PAGE_TIER__[id]; if (!need) return true; var t = window.__kaiTier(); return !!t && need.indexOf(t) >= 0; };
  window.__KAI_TOOL_TIER__ = Object.freeze({ "kai-btn-data": [P, M, A], "kai-btn-backup": [P], "kai-btn-reg": [P, M, S, A], "kai-btn-ops": [P, M, S, A], "kai-btn-codegs": [P, M] });
  window.__kaiToolAllowed = function (id) { var need = window.__KAI_TOOL_TIER__[id]; if (!need) return true; var t = window.__kaiTier(); return !!t && need.indexOf(t) >= 0; };
  /* penjaga klik (fase tangkap): alat internal tidak bisa dibuka walau tombolnya dimunculkan paksa */
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest(".kai-tool-btn") : null;
    if (b && b.id && window.__KAI_TOOL_TIER__[b.id]) { refresh(); if (!window.__kaiToolAllowed(b.id)) { e.preventDefault(); e.stopImmediatePropagation(); } }
  }, true);
  setInterval(refresh, 700);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refresh);
  refresh();
})();
