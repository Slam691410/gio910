/* ============================================================
   KANTOR AI — PUSAT AKUNTANSI LIVE, PAJAK, PAYROLL, PO & RBAC (GIO-5..11)
   Terpasang otomatis pada index.html & ekosistem.html.
   Semua data & aksi langsung dieksekusi di Supabase Postgres (gio910-api).
   ============================================================ */
(() => {
  "use strict";
  if (window.self !== window.top) return;
  if (window.__KAI_LIVE_FINANCE_MOUNTED__) return;
  window.__KAI_LIVE_FINANCE_MOUNTED__ = true;

  const API_BASE = String(window.__KAI_SUPABASE_API_URL__ || "https://dttclgkjfiwcovvqrckw.supabase.co/functions/v1/gio910-api").replace(/\/+$/, "");
  const ANON_KEY = String(window.__KAI_SUPABASE_ANON_KEY__ || "").trim();
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  async function api(method, path, body, tok) {
    const headers = { "Content-Type": "application/json" };
    if (ANON_KEY) {
      headers["apikey"] = ANON_KEY;
      headers["Authorization"] = "Bearer " + ANON_KEY;
    }
    const useTok = tok || getActiveToken();
    if (useTok && UUID_RE.test(useTok)) headers["x-gio-session"] = useTok;
    const res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined && method !== "GET" ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
    return data;
  }

  const rp = (n) => "Rp" + Math.round(Number(n || 0)).toLocaleString("id-ID");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function downloadCsv(name, csvText) {
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 3000);
  }

  async function syncModuleToSheets(mod, msgEl, tok) {
    if (msgEl) { msgEl.style.color = "#93c5fd"; msgEl.textContent = "Menyinkronkan " + mod + " ke Google Sheets…"; }
    try {
      const r = await api("POST", "/api/connectors/action", { connector: "google_sheets", action: "sync_ledger", payload: { module: mod } }, tok);
      if (r.csv) downloadCsv(`gio910-${mod}-live.csv`, r.csv);
      if (msgEl) {
        msgEl.style.color = "#6ee7b7";
        msgEl.innerHTML = `${esc(r.message || "Tersinkron ke Google Sheets.")} <a href="${esc(r.workbookUrl || r.spreadsheetUrl || "#")}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;font-weight:700">Buka Sheets ↗</a>`;
      }
    } catch (e) {
      if (msgEl) { msgEl.style.color = "#fca5a5"; msgEl.textContent = e.message; }
    }
  }

  const style = document.createElement("style");
  style.textContent = `
    #kai-fin-modal{position:fixed;inset:0;z-index:9995;background:rgba(4,9,18,.78);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;padding:16px}
    #kai-fin-modal.is-open{display:flex}
    .kfin-card{width:100%;max-width:1120px;max-height:92vh;background:#0e1729;border:1px solid #233860;border-radius:16px;color:#e8eefc;display:flex;flex-direction:column;overflow:hidden;font:13.5px/1.5 system-ui,sans-serif}
    .kfin-head{padding:14px 18px;background:#13203b;border-bottom:1px solid #233860;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .kfin-tabs{display:flex;gap:6px;padding:10px 16px;background:#0b1322;border-bottom:1px solid #203254;overflow-x:auto}
    .kfin-tab{padding:6px 12px;border-radius:8px;border:1px solid #24385f;background:#14213b;color:#a9bcd9;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap}
    .kfin-tab.is-active{background:#0284c7;color:#fff;border-color:#38bdf8}
    .kfin-body{padding:16px 18px;overflow:auto;flex:1}
    .kfin-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:14px}
    .kfin-kpi{background:#131f36;border:1px solid #22365c;border-radius:12px;padding:12px}
    .kfin-kpi small{display:block;color:#9fb0d0;font-size:11.5px}
    .kfin-kpi strong{display:block;font-size:16px;color:#7dd3fc;margin-top:2px}
    .kfin-tbl{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:8px}
    .kfin-tbl th,.kfin-tbl td{padding:7px 8px;border-bottom:1px solid #1e3054;text-align:left}
    .kfin-tbl th{color:#93c5fd;background:#101b30}
    .kfin-btn{padding:6px 12px;border-radius:8px;border:1px solid #2b4370;background:#172847;color:#7dd3fc;font-weight:700;font-size:12px;cursor:pointer}
    .kfin-btn.prim{background:#0284c7;border-color:#38bdf8;color:#fff}
    .kfin-inp{padding:7px 10px;border-radius:8px;border:1px solid #28406c;background:#09111f;color:#e8eefc;font:12.5px system-ui,sans-serif}
    .kfin-badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:#0e2b23;border:1px solid #175c49;color:#6ee7b7}
    .kfin-badge.warn{background:#2c2208;border-color:#78530b;color:#fbbf24}
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "kai-fin-modal";
  modal.innerHTML = `
    <div class="kfin-card" role="dialog" aria-label="Pusat Akuntansi Live & Tata Kelola GIO910">
      <div class="kfin-head">
        <div>
          <strong style="font-size:15px;color:#7dd3fc">Pusat Akuntansi Live, Pajak, Payroll &amp; Audit (GIO-5..11)</strong>
          <div id="kfin-sub" style="font-size:12px;color:#9fb0d0">Terhubung langsung ke Supabase Postgres (gio910-api v4.0.0-realtime · 36 Tabel CDC) + Google Sheets, Slides, Docs, Gmail &amp; Drive</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button type="button" class="kfin-btn" id="kfin-refresh">Segarkan</button>
          <button type="button" class="kfin-btn" id="kfin-close">Tutup ✕</button>
        </div>
      </div>
      <div class="kfin-tabs" id="kfin-tabs">
        <button class="kfin-tab is-active" data-tab="gl">1 · Closing 3101 &amp; COA</button>
        <button class="kfin-tab" data-tab="pajak">2 · PPN &amp; e-Faktur</button>
        <button class="kfin-tab" data-tab="payroll">3 · Payroll 259</button>
        <button class="kfin-tab" data-tab="deposit">4 · Deposit 2101 &amp; Rekon</button>
        <button class="kfin-tab" data-tab="po">5 · Procurement PO</button>
        <button class="kfin-tab" data-tab="audit">6 · Audit, RBAC &amp; CopyHub</button>
        <button class="kfin-tab" data-tab="ai">7 · AI Live Analyst</button>
      </div>
      <div class="kfin-body" id="kfin-body">Memuat data Postgres…</div>
    </div>
  `;
  document.body.appendChild(modal);

  let activeTab = "gl";

  function renderAuthGate(container) {
    container.innerHTML = `
      <div style="max-width:460px;margin:20px auto;background:#131f36;border:1px solid #22365c;border-radius:12px;padding:18px">
        <strong style="color:#7dd3fc;font-size:15px">Masuk Sesi Supabase Diperlukan</strong>
        <p style="color:#9fb0d0;font-size:12.5px">Data keuangan 3101, e-Faktur, Payroll 259, dan Audit RBAC dilindungi sesi Postgres. Masuk di Portal utama atau gunakan ID/OTP cepat di bawah:</p>
        <div style="display:grid;gap:8px;margin-top:10px">
          <input id="kfin-q-id" class="kfin-inp" placeholder="ID / Email (mis. OWN1, M5, D1-02, M8)" value="OWN1" />
          <div style="display:flex;gap:8px">
            <button id="kfin-q-otp-req" class="kfin-btn prim" type="button">Kirim OTP Postgres</button>
            <span id="kfin-q-hint" style="font-size:12px;color:#6ee7b7;align-self:center"></span>
          </div>
          <div id="kfin-q-step2" style="display:none;gap:8px">
            <input id="kfin-q-code" class="kfin-inp" placeholder="Kode OTP 6 digit" />
            <button id="kfin-q-otp-ver" class="kfin-btn prim" type="button">Verifikasi &amp; Buka Konsol</button>
          </div>
          <div id="kfin-q-err" style="color:#fca5a5;font-size:12px"></div>
        </div>
      </div>
    `;
    let resolvedEmail = "";
    document.getElementById("kfin-q-otp-req").onclick = async () => {
      try {
        const idVal = document.getElementById("kfin-q-id").value.trim();
        const res = await api("POST", "/api/auth/send-otp", idVal.includes("@") ? { email: idVal } : { id: idVal });
        resolvedEmail = idVal.includes("@") ? idVal : (res.maskedEmail.includes("sl***") ? "slametsugiono.studio@gmail.com" : idVal);
        document.getElementById("kfin-q-hint").textContent = res.previewOtp ? ("OTP: " + res.previewOtp) : "OTP dikirim ke email";
        if (res.previewOtp) document.getElementById("kfin-q-code").value = res.previewOtp;
        document.getElementById("kfin-q-step2").style.display = "flex";
      } catch (e) { document.getElementById("kfin-q-err").textContent = e.message; }
    };
    document.getElementById("kfin-q-otp-ver").onclick = async () => {
      try {
        const idVal = document.getElementById("kfin-q-id").value.trim();
        const emailMap = { OWN1: "slametsugiono.studio@gmail.com", M1: "rangga.direksi@holding-investasi.id", M5: "aditya.kepatuhan@holding-investasi.id", "D1-02": "d1.02.bagus@holding-investasi.id", M8: "audit.wijaya@eksternal.id" };
        const em = idVal.includes("@") ? idVal : (emailMap[idVal.toUpperCase()] || resolvedEmail);
        const res = await api("POST", "/api/auth/verify-otp", { email: em, code: document.getElementById("kfin-q-code").value.trim() });
        if (res && res.token) {
          sessionStorage.setItem("hi_session_v1", JSON.stringify({ token: res.token, user: res.user }));
          window.__KAI_ACTIVE_SUPA_TOKEN__ = res.token;
          loadTab(activeTab);
        }
      } catch (e) { document.getElementById("kfin-q-err").textContent = e.message; }
    };
  }

  async function loadTab(tab) {
    activeTab = tab;
    Array.from(document.querySelectorAll("#kfin-tabs .kfin-tab")).forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));
    const body = document.getElementById("kfin-body");
    const tok = getActiveToken();
    if (!tok) { renderAuthGate(body); return; }
    body.innerHTML = "<p style='color:#9fb0d0'>Mengambil data real-time dari Supabase…</p>";

    try {
      if (tab === "gl") {
        const [{ summary }, { journals }] = await Promise.all([api("GET", "/api/finance/summary", undefined, tok), api("GET", "/api/finance/journals", undefined, tok)]);
        const t = summary.totals;
        body.innerHTML = `
          <div class="kfin-grid">
            <div class="kfin-kpi"><small>Pendapatan 2026-11 (4101..4104)</small><strong>${rp(t.pendapatanOperasional)}</strong></div>
            <div class="kfin-kpi"><small>Beban OPEX (5101..5107)</small><strong>${rp(t.bebanOperasional)}</strong></div>
            <div class="kfin-kpi"><small>Surplus → Ekuitas 3101</small><strong style="color:#34d399">${rp(t.ekuitas3101)}</strong></div>
            <div class="kfin-kpi"><small>Kas 1101 · Piutang 1201</small><strong>${rp(t.kas1101)}</strong><small>Piutang: ${rp(t.piutang1201)}</small></div>
            <div class="kfin-kpi"><small>Neraca Debit = Kredit</small><strong>${t.totalDebit === t.totalKredit ? "SEIMBANG 100%" : "SELISIH"}</strong><small>${rp(t.totalDebit)}</small></div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;align-items:center">
            <span class="kfin-badge">${t.hasClosing3101 ? "✓ Jurnal Closing 3101 Terposting" : "Belum Closing"}</span>
            <span class="kfin-badge warn">Periode Terkunci: ${(summary.closedPeriods || []).join(", ") || "—"}</span>
            <button id="kfin-post-btn" class="kfin-btn prim" type="button">+ Posting Jurnal via public.post()</button>
            <button id="kfin-gl-sheets" class="kfin-btn" type="button">📊 Sync Neraca → Sheets + CSV</button>
            <button id="kfin-gl-slides" class="kfin-btn" type="button">📽️ Sync KPI → Slide Pendiri</button>
            <button id="kfin-gl-docs" class="kfin-btn" type="button">📝 Buat Memo Closing (Docs)</button>
          </div>
          <div id="kfin-gl-sync-msg" style="font-size:12px;margin-bottom:8px"></div>
          <div id="kfin-post-form" style="display:none;background:#131f36;border:1px solid #22365c;border-radius:10px;padding:12px;margin-bottom:12px">
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              <input id="jp-ref" class="kfin-inp" placeholder="Ref (mis. ADJ-2026-11)" />
              <input id="jp-ket" class="kfin-inp" style="flex:1" placeholder="Keterangan jurnal..." />
              <input id="jp-dr" class="kfin-inp" placeholder="Akun Debit (1101)" value="1101" style="width:110px" />
              <input id="jp-cr" class="kfin-inp" placeholder="Akun Kredit (4101)" value="4101" style="width:110px" />
              <input id="jp-amt" class="kfin-inp" type="number" placeholder="Nominal (Rp)" style="width:140px" />
              <button id="jp-go" class="kfin-btn prim" type="button">Posting</button>
            </div>
            <div id="jp-msg" style="margin-top:6px;font-size:12px"></div>
          </div>
          <h4 style="margin:8px 0 4px;color:#93c5fd">Neraca Saldo Akun (COA)</h4>
          <table class="kfin-tbl"><thead><tr><th>Kode</th><th>Nama Akun</th><th>Jenis</th><th>Debit</th><th>Kredit</th><th>Saldo</th></tr></thead><tbody>
            ${summary.coa.filter((c) => c.debit || c.kredit).map((c) => `<tr><td><code>${esc(c.kode)}</code></td><td>${esc(c.nama)}</td><td>${esc(c.jenis)}</td><td>${rp(c.debit)}</td><td>${rp(c.kredit)}</td><td><b>${rp(c.saldo)}</b></td></tr>`).join("")}
          </tbody></table>
          <h4 style="margin:14px 0 4px;color:#93c5fd">Jurnal Tercatat (${journals.length})</h4>
          <table class="kfin-tbl"><thead><tr><th>Tanggal</th><th>Ref</th><th>Periode</th><th>Keterangan</th></tr></thead><tbody>
            ${journals.slice(0, 15).map((j) => `<tr><td>${esc(j.tanggal)}</td><td><code>${esc(j.ref)}</code></td><td>${esc(j.periode)}</td><td>${esc(j.keterangan)}</td></tr>`).join("")}
          </tbody></table>
        `;
        document.getElementById("kfin-post-btn").onclick = () => {
          const f = document.getElementById("kfin-post-form");
          f.style.display = f.style.display === "none" ? "block" : "none";
        };
        document.getElementById("kfin-gl-sheets").onclick = () => syncModuleToSheets("gl", document.getElementById("kfin-gl-sync-msg"), tok);
        document.getElementById("kfin-gl-slides").onclick = async () => {
          const m = document.getElementById("kfin-gl-sync-msg");
          m.style.color = "#93c5fd"; m.textContent = "Menyinkronkan KPI 3101 ke Google Slides…";
          try {
            const r = await api("POST", "/api/connectors/action", { connector: "google_slides", action: "sync_deck", payload: {} }, tok);
            m.style.color = "#6ee7b7";
            m.innerHTML = `${esc(r.message)} <a href="${esc(r.deck?.deckUrl || "#")}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;font-weight:700">Buka Slides ↗</a>`;
          } catch (e) { m.style.color = "#fca5a5"; m.textContent = e.message; }
        };
        document.getElementById("kfin-gl-docs").onclick = async () => {
          const m = document.getElementById("kfin-gl-sync-msg");
          try {
            const r = await api("POST", "/api/connectors/action", {
              connector: "google_docs",
              action: "create_memo",
              payload: {
                title: "Memo Closing 3101 — " + new Date().toISOString().slice(0, 10),
                content: `Pendapatan: ${rp(t.pendapatanOperasional)}\nOPEX: ${rp(t.bebanOperasional)}\nEkuitas 3101: ${rp(t.ekuitas3101)}\nKas 1101: ${rp(t.kas1101)}`,
              },
            }, tok);
            m.style.color = "#6ee7b7";
            m.innerHTML = `${esc(r.message)} <a href="${esc(r.doc?.url || "#")}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;font-weight:700">Buka Docs ↗</a>`;
          } catch (e) { m.style.color = "#fca5a5"; m.textContent = e.message; }
        };
        document.getElementById("jp-go").onclick = async () => {
          const msg = document.getElementById("jp-msg");
          try {
            const amt = Number(document.getElementById("jp-amt").value || 0);
            const r = await api("POST", "/api/finance/post", {
              ref: document.getElementById("jp-ref").value.trim(),
              keterangan: document.getElementById("jp-ket").value.trim(),
              periode: "2026-11",
              lines: [
                { kode: document.getElementById("jp-dr").value.trim(), debit: amt, kredit: 0 },
                { kode: document.getElementById("jp-cr").value.trim(), debit: 0, kredit: amt },
              ],
            }, tok);
            msg.style.color = "#6ee7b7";
            msg.textContent = "Jurnal berhasil diposting (ID #" + r.journal_id + ")";
            setTimeout(() => loadTab("gl"), 800);
          } catch (e) { msg.style.color = "#fca5a5"; msg.textContent = e.message; }
        };
      } else if (tab === "pajak") {
        const [{ summary }, { faktur }] = await Promise.all([api("GET", "/api/finance/summary", undefined, tok), api("GET", "/api/finance/pajak", undefined, tok)]);
        body.innerHTML = `
          <div class="kfin-grid">
            <div class="kfin-kpi"><small>DPP PPN Keluaran</small><strong>${rp(summary.pajak.dppKeluaran)}</strong></div>
            <div class="kfin-kpi"><small>PPN Keluaran (11%)</small><strong>${rp(summary.pajak.ppnKeluaran)}</strong></div>
            <div class="kfin-kpi"><small>PPN Masukan Dikreditkan</small><strong>${rp(summary.pajak.ppnMasukan)}</strong></div>
            <div class="kfin-kpi"><small>Kurang Bayar SPT Masa</small><strong style="color:#fbbf24">${rp(summary.pajak.ppnKurangBayar)}</strong></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <input id="fp-lawan" class="kfin-inp" placeholder="Lawan Transaksi / Tenant / Vendor" style="flex:1;min-width:200px" />
            <select id="fp-jenis" class="kfin-inp"><option value="Keluaran">e-Faktur Keluaran</option><option value="Masukan">e-Faktur Masukan</option></select>
            <input id="fp-dpp" class="kfin-inp" type="number" placeholder="DPP (Rp)" style="width:150px" />
            <button id="fp-add" class="kfin-btn prim" type="button">Terbitkan e-Faktur</button>
            <button id="fp-sheets" class="kfin-btn" type="button">📊 Ekspor PPN → Sheets + CSV</button>
            <button id="fp-gmail" class="kfin-btn" type="button">✉️ Draft SPT ke Outbox Gmail</button>
          </div>
          <div id="fp-msg" style="font-size:12px;margin-bottom:8px"></div>
          <table class="kfin-tbl"><thead><tr><th>No. Faktur</th><th>Jenis</th><th>Lawan Transaksi</th><th>DPP</th><th>PPN 11%</th><th>Status</th></tr></thead><tbody>
            ${faktur.map((f) => `<tr><td><code>${esc(f.nomor_faktur)}</code></td><td>${esc(f.jenis)}</td><td>${esc(f.lawan_transaksi)}</td><td>${rp(f.dasar_pengenaan)}</td><td>${rp(f.ppn_nilai)}</td><td><span class="kfin-badge">${esc(f.status)}</span></td></tr>`).join("")}
          </tbody></table>
        `;
        document.getElementById("fp-sheets").onclick = () => syncModuleToSheets("pajak", document.getElementById("fp-msg"), tok);
        document.getElementById("fp-gmail").onclick = async () => {
          const m = document.getElementById("fp-msg");
          try {
            const r = await api("POST", "/api/connectors/action", {
              connector: "gmail",
              action: "send_outbox",
              payload: {
                to: "slametsugiono.studio@gmail.com",
                subject: "Rekap SPT Masa PPN 11% GIO910",
                body: `DPP Keluaran: ${rp(summary.pajak.dppKeluaran)}\nPPN Keluaran: ${rp(summary.pajak.ppnKeluaran)}\nPPN Masukan: ${rp(summary.pajak.ppnMasukan)}\nKurang Bayar: ${rp(summary.pajak.ppnKurangBayar)}`,
              },
            }, tok);
            m.style.color = "#6ee7b7";
            m.innerHTML = `${esc(r.message)} <a href="${esc(r.gmailComposeUrl || "#")}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;font-weight:700">Buka Gmail ↗</a>`;
          } catch (e) { m.style.color = "#fca5a5"; m.textContent = e.message; }
        };
        document.getElementById("fp-add").onclick = async () => {
          const msg = document.getElementById("fp-msg");
          try {
            await api("POST", "/api/finance/pajak", {
              lawan_transaksi: document.getElementById("fp-lawan").value.trim(),
              jenis: document.getElementById("fp-jenis").value,
              dasar_pengenaan: Number(document.getElementById("fp-dpp").value || 0),
            }, tok);
            loadTab("pajak");
          } catch (e) { msg.style.color = "#fca5a5"; msg.textContent = e.message; }
        };
      } else if (tab === "payroll") {
        const res = await api("GET", "/api/finance/payroll", undefined, tok);
        const tot = res.totals || {};
        body.innerHTML = `
          <div class="kfin-grid">
            <div class="kfin-kpi"><small>Total Personel Aktif</small><strong>${tot.headcount || 0} Orang</strong></div>
            <div class="kfin-kpi"><small>Total Bruto (COA 5101)</small><strong>${rp(tot.gross)}</strong></div>
            <div class="kfin-kpi"><small>Rekonsiliasi COA 5101</small><strong style="color:#34d399">${tot.coa5101Match ? "COCOK 100%" : "CEK"}</strong></div>
            <div class="kfin-kpi"><small>Total Take-Home Pay</small><strong>${rp(tot.net)}</strong></div>
          </div>
          <div style="display:flex;gap:8px;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap">
            <span style="color:#9fb0d0;font-size:12px">${res.restricted ? "Mode Staf: hanya menampilkan slip milik Anda." : "Menampilkan " + (res.rows || []).length + " baris payroll periode 2026-11."}</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button id="pay-sheets-btn" class="kfin-btn" type="button">📊 Ekspor 259 Payroll → Sheets + CSV</button>
              <button id="pay-appr-btn" class="kfin-btn prim" type="button">Approve / Finalisasi Payroll Batch</button>
            </div>
          </div>
          <div id="pay-msg" style="font-size:12px;margin-bottom:6px"></div>
          <table class="kfin-tbl"><thead><tr><th>Kode</th><th>Nama</th><th>Entitas</th><th>Gaji + Tunjangan</th><th>Potongan</th><th>THP</th><th>Status</th></tr></thead><tbody>
            ${(res.rows || []).slice(0, 60).map((r) => `<tr><td><code>${esc(r.user_code)}</code></td><td>${esc(r.nama)}</td><td>${esc(r.entitas)}</td><td>${rp(Number(r.gaji_pokok) + Number(r.tunjangan))}</td><td>${rp(r.potongan_bpjs_pph21)}</td><td><b>${rp(r.take_home_pay)}</b></td><td><span class="kfin-badge">${esc(r.status)}</span></td></tr>`).join("")}
          </tbody></table>
        `;
        document.getElementById("pay-sheets-btn").onclick = () => syncModuleToSheets("payroll", document.getElementById("pay-msg"), tok);
        document.getElementById("pay-appr-btn").onclick = async () => {
          const msg = document.getElementById("pay-msg");
          try {
            const r = await api("POST", "/api/finance/payroll/approve", { periode: "2026-11" }, tok);
            msg.style.color = "#6ee7b7";
            msg.textContent = "Status payroll 2026-11 diperbarui -> " + r.status + " (" + r.count + " personel)";
            setTimeout(() => loadTab("payroll"), 800);
          } catch (e) { msg.style.color = "#fca5a5"; msg.textContent = e.message; }
        };
      } else if (tab === "deposit") {
        const res = await api("GET", "/api/finance/deposits", undefined, tok);
        body.innerHTML = `
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center">
            <input id="rec-bank" class="kfin-inp" type="number" placeholder="Saldo Rekening Bank (Rp)" value="664204700" />
            <button id="rec-run" class="kfin-btn prim" type="button">Jalankan Rekonsiliasi Bank Live</button>
            <button id="dep-sheets-btn" class="kfin-btn" type="button">📊 Sync Deposit 2101 → Sheets + CSV</button>
            <span id="rec-msg" style="font-size:12px"></span>
          </div>
          <h4 style="margin:8px 0 4px;color:#93c5fd">Riwayat Rekonsiliasi Bank vs Buku 1101</h4>
          <table class="kfin-tbl"><thead><tr><th>Kode</th><th>Rekening</th><th>Saldo Buku 1101</th><th>Saldo Bank</th><th>Selisih</th><th>Deposit 2101</th><th>Status</th></tr></thead><tbody>
            ${(res.reconciliations || []).map((r) => `<tr><td><code>${esc(r.recon_code)}</code></td><td>${esc(r.rekening)}</td><td>${rp(r.saldo_buku)}</td><td>${rp(r.saldo_bank)}</td><td>${rp(r.selisih)}</td><td>${rp(r.deposit_2101_liability)}</td><td><span class="kfin-badge">${esc(r.status)}</span></td></tr>`).join("")}
          </tbody></table>
          <h4 style="margin:14px 0 4px;color:#93c5fd">Daftar Deposit Keamanan Tenant (COA 2101)</h4>
          <table class="kfin-tbl"><thead><tr><th>Kode</th><th>Unit</th><th>Tenant</th><th>Nominal</th><th>Ref Bank</th><th>Status</th></tr></thead><tbody>
            ${(res.deposits || []).map((d) => `<tr><td><code>${esc(d.deposit_code)}</code></td><td>${esc(d.unit)}</td><td>${esc(d.tenant_name)}</td><td><b>${rp(d.amount)}</b></td><td>${esc(d.bank_ref)}</td><td><span class="kfin-badge">${esc(d.status)}</span></td></tr>`).join("")}
          </tbody></table>
        `;
        document.getElementById("dep-sheets-btn").onclick = () => syncModuleToSheets("deposits", document.getElementById("rec-msg"), tok);
        document.getElementById("rec-run").onclick = async () => {
          const msg = document.getElementById("rec-msg");
          try {
            const r = await api("POST", "/api/finance/bank-recon", { saldo_bank: Number(document.getElementById("rec-bank").value || 0), periode: "2026-11" }, tok);
            msg.style.color = "#6ee7b7";
            msg.textContent = "Tersimpan: " + r.reconciliation.recon_code + " (" + r.reconciliation.status + ")";
            setTimeout(() => loadTab("deposit"), 800);
          } catch (e) { msg.style.color = "#fca5a5"; msg.textContent = e.message; }
        };
      } else if (tab === "po") {
        const res = await api("GET", "/api/finance/procurement", undefined, tok);
        const orders = res.orders || [];
        const totalPo = orders.reduce((s, o) => s + Number(o.nilai || 0), 0);
        body.innerHTML = `
          <div class="kfin-grid">
            <div class="kfin-kpi"><small>Total Kontrak / PO</small><strong>${orders.length} PO</strong></div>
            <div class="kfin-kpi"><small>Total Nilai (OPEX 5101..5107)</small><strong>${rp(totalPo)}</strong></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;align-items:center">
            <button id="po-sheets-btn" class="kfin-btn" type="button">📊 Ekspor PO Vendor → Sheets + CSV</button>
            <div id="po-msg" style="font-size:12px"></div>
          </div>
          <table class="kfin-tbl"><thead><tr><th>No. PO</th><th>Vendor</th><th>Kategori</th><th>Nilai</th><th>Otorisasi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
            ${orders.map((o) => `<tr><td><code>${esc(o.po_number)}</code></td><td>${esc(o.vendor)}</td><td>${esc(o.kategori)}</td><td><b>${rp(o.nilai)}</b></td><td>${o.butuh_direktur ? '<span class="kfin-badge warn">Wajib Direktur (&gt;100jt)</span>' : '<span class="kfin-badge">Manajemen</span>'}</td><td>${esc(o.status)}</td><td>${o.status === "Diajukan" ? `<button class="kfin-btn prim" data-po-id="${esc(o.id)}">Setujui</button>` : "✓"}</td></tr>`).join("")}
          </tbody></table>
        `;
        document.getElementById("po-sheets-btn").onclick = () => syncModuleToSheets("po", document.getElementById("po-msg"), tok);
        body.querySelectorAll("[data-po-id]").forEach((btn) => {
          btn.onclick = async () => {
            const msg = document.getElementById("po-msg");
            try {
              await api("POST", "/api/finance/procurement/" + encodeURIComponent(btn.dataset.poId) + "/approve", {}, tok);
              loadTab("po");
            } catch (e) { msg.style.color = "#fca5a5"; msg.textContent = e.message; }
          };
        });
      } else if (tab === "audit") {
        const [aud, den, ch] = await Promise.all([
          api("GET", "/api/audit/verify", undefined, tok).catch((e) => ({ error: e.message })),
          api("GET", "/api/audit/denials", undefined, tok).catch((e) => ({ denials: [], error: e.message })),
          api("GET", "/api/copyhub/orders", undefined, tok).catch((e) => ({ orders: [], memberships: [], error: e.message })),
        ]);
        body.innerHTML = `
          <div class="kfin-grid">
            <div class="kfin-kpi"><small>Verifikasi Rantai Audit SHA-256</small><strong style="color:${aud.ok ? "#34d399" : "#fbbf24"}">${aud.error ? esc(aud.error) : (aud.ok ? "UTUH 100%" : "PERIKSA")}</strong><small>${aud.rows || 0} entri · broken: ${aud.broken ?? "-"}</small></div>
            <div class="kfin-kpi"><small>Log Penolakan RBAC (HTTP 403)</small><strong>${(den.denials || []).length} Kejadian</strong></div>
            <div class="kfin-kpi"><small>Copy Hub Members (MEMBER30)</small><strong>${(ch.memberships || []).length} Member</strong></div>
            <div class="kfin-kpi"><small>Copy Hub Checkout Orders</small><strong>${(ch.orders || []).length} Order</strong></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;align-items:center">
            <button id="aud-copyhub-sheets" class="kfin-btn" type="button">📊 Ekspor Order CopyHub → Sheets + CSV</button>
            <button id="aud-drive-bkp" class="kfin-btn prim" type="button">☁️ Backup Snapshot Postgres → Drive</button>
            <span id="aud-sync-msg" style="font-size:12px"></span>
          </div>
          <h4 style="margin:8px 0 4px;color:#93c5fd">Log Penolakan Akses RBAC (403 Security Trail)</h4>
          <table class="kfin-tbl"><thead><tr><th>Waktu</th><th>Peran</th><th>Email</th><th>Rute</th><th>Alasan</th></tr></thead><tbody>
            ${(den.denials || []).slice(0, 15).map((d) => `<tr><td>${esc(String(d.created_at || "").slice(0, 19))}</td><td>${esc(d.user_role)}</td><td>${esc(d.user_email || "-")}</td><td><code>${esc(d.method + " " + d.route)}</code></td><td>${esc(d.reason)}</td></tr>`).join("") || "<tr><td colspan='5'>Belum ada penolakan akses tercatat.</td></tr>"}
          </tbody></table>
          <h4 style="margin:14px 0 4px;color:#93c5fd">Transaksi Copy Hub (GIO-11 · Diskon MEMBER30)</h4>
          <table class="kfin-tbl"><thead><tr><th>Kode Order</th><th>Paket</th><th>Normal</th><th>Diskon</th><th>Final</th><th>Status</th></tr></thead><tbody>
            ${(ch.orders || []).slice(0, 15).map((o) => `<tr><td><code>${esc(o.order_code)}</code></td><td>${esc(o.pkg_title)}</td><td>${rp(o.price_normal)}</td><td>${o.disc_pct}% (-${rp(o.disc_amt)})</td><td><b>${rp(o.price_final)}</b></td><td><span class="kfin-badge">${esc(o.status)}</span></td></tr>`).join("")}
          </tbody></table>
        `;
        document.getElementById("aud-copyhub-sheets").onclick = () => syncModuleToSheets("copyhub", document.getElementById("aud-sync-msg"), tok);
        document.getElementById("aud-drive-bkp").onclick = async () => {
          const m = document.getElementById("aud-sync-msg");
          m.style.color = "#93c5fd"; m.textContent = "Menyimpan snapshot Postgres + Google Drive Hub…";
          try {
            const r = await api("POST", "/api/workspace", { op: "backup.toDrive", payload: {} }, tok);
            m.style.color = "#6ee7b7";
            m.innerHTML = `✓ Tersimpan (${esc(r.data?.name || "Snapshot")}) <a href="${esc(r.data?.driveUrl || "#")}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;font-weight:700">Buka Drive ↗</a>`;
          } catch (e) { m.style.color = "#fca5a5"; m.textContent = e.message; }
        };
      } else if (tab === "ai") {
        body.innerHTML = `
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <input id="kai-ai-prompt" class="kfin-inp" style="flex:1;min-width:240px" value="Ringkas status closing 3101, PPN kurang bayar, payroll 259, dan rekonsiliasi bank" />
            <button id="kai-ai-run" class="kfin-btn prim" type="button">Tanya Analis Live Postgres</button>
          </div>
          <pre id="kai-ai-out" style="white-space:pre-wrap;background:#09111f;border:1px solid #22365c;border-radius:10px;padding:12px;color:#dbeafe;font:12.5px/1.6 ui-monospace,monospace">Klik tombol untuk menjalankan analisis langsung dari Postgres…</pre>
        `;
        document.getElementById("kai-ai-run").onclick = async () => {
          const out = document.getElementById("kai-ai-out");
          out.textContent = "Menganalisis angka live Postgres…";
          try {
            const res = await api("POST", "/api/ai/assist", { prompt: document.getElementById("kai-ai-prompt").value, mode: "audit_singkat" }, tok);
            out.textContent = res.text || JSON.stringify(res, null, 2);
          } catch (e) { out.textContent = "Gagal: " + e.message; }
        };
      }
    } catch (e) {
      body.innerHTML = `<div style="color:#fca5a5">Gagal memuat tab: ${esc(e.message)}</div>`;
    }
  }

  modal.querySelector("#kfin-close").onclick = () => modal.classList.remove("is-open");
  modal.querySelector("#kfin-refresh").onclick = () => loadTab(activeTab);
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("is-open"); });
  modal.querySelectorAll("#kfin-tabs .kfin-tab").forEach((b) => {
    b.onclick = () => loadTab(b.dataset.tab);
  });
  window.__KAI_OPEN_LIVE_FINANCE__ = (tab) => {
    if (tab) activeTab = tab;
    modal.classList.add("is-open");
    loadTab(activeTab);
  };

  let finRtTimer = null;
  const FIN_RT_TABLES = new Set([
    "journal",
    "faktur_pajak",
    "hr_payroll",
    "tenant_deposits",
    "procurement_orders",
    "copyhub_orders",
    "copyhub_memberships",
    "audit_logs",
    "gio_cash",
    "realtime_events",
  ]);
  window.addEventListener("gio-realtime-update", (ev) => {
    if (!modal.classList.contains("is-open")) return;
    const d = (ev && ev.detail) || {};
    if (d.kind !== "ws_event") return;
    if (d.table && !FIN_RT_TABLES.has(d.table)) return;
    const act = document.activeElement;
    if (act && act.closest && act.closest("#kai-fin-modal") && (act.tagName === "INPUT" || act.tagName === "TEXTAREA")) return;
    clearTimeout(finRtTimer);
    finRtTimer = setTimeout(() => {
      if (modal.classList.contains("is-open")) loadTab(activeTab);
    }, 600);
  });
})();
