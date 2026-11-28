/* ============================================================
   GIO910 HOLDING OS v4.0 — UNIFIED REAL-TIME COCKPIT UI
   Menampilkan seluruh modul nyata Holding Investasi GIO910:
   1. Ikhtisar Live (SDM 259), Absensi Geofence & Feed Realtime 36 Tabel
   2. Katalog 160 Jenis Aset Modal Sendiri, Portofolio & Deal Pipeline
   3. 18 Agent AI Kuantitatif (Pure Postgres, tanpa kunci eksternal)
   4. Web3 Multi-Chain (16 Chain: 13 EVM + Bitcoin/Solana/TON) & Hybrid/Full DAO
   5. 20 Gateway 3rd-Party & Bus Webhook HMAC-SHA256
   6. CRM Mitra, Tiket Fasilitas & Register Kepatuhan
   7. Akuntansi Buku Besar 3101 (GIO-5..11) & 13 Konektor Ekosistem
   8. Semua Modul & Layanan Ekosistem (Copy Hub, DAO, SEO, Mobile, Wrapper, 9 Halaman)
   ============================================================ */
(() => {
  "use strict";
  if (window.self !== window.top) return;
  if (window.__KAI_HOLDING_OS_UI_MOUNTED__) return;
  window.__KAI_HOLDING_OS_UI_MOUNTED__ = true;

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  const rp = (n) => "Rp" + Math.round(Number(n || 0)).toLocaleString("id-ID");
  const num = (n, d = 2) => Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: d });

  const ui = {
    tab: "overview", // dipakai hanya pada mode standalone (ekosistem.html)
    invTab: "gl", // gl | pajak_dep | web3 | audit
    asetTab: "portfolio", // portfolio | copyhub
    alurTab: "agents", // agents | gateways
    vendorTab: "connectors", // connectors | seo
    collapsed: false,
    feedback: null, // { ok, text }
    assetGroup: "ALL",
    assetQuery: "",
    walletAddress: "",
    walletChainId: null,
    embedMod: null, // { id, title, url }
  };

  function OS() {
    return window.__KAI_HOLDING_OS__;
  }

  function getActivePortalNav() {
    if (typeof window.__KAI_ACTIVE_NAV__ === "string" && window.__KAI_ACTIVE_NAV__) {
      return window.__KAI_ACTIVE_NAV__;
    }
    const curBtn = document.querySelector('nav[aria-label="Navigasi utama portal"] button[aria-current="page"]');
    if (curBtn) {
      const txt = (curBtn.textContent || "").toLowerCase();
      if (txt.includes("kantor")) return "kantor";
      if (txt.includes("ringkas")) return "ringkas";
      if (txt.includes("organisasi")) return "org";
      if (txt.includes("tugas")) return "tugas";
      if (txt.includes("investasi")) return "inv";
      if (txt.includes("aset") || txt.includes("katalog")) return "aset";
      if (txt.includes("dokumen") || txt.includes("arsip")) return "dokumen";
      if (txt.includes("alur")) return "alur";
      if (txt.includes("pihak") || txt.includes("vendor")) return "vendor";
      if (txt.includes("video") || txt.includes("unduh")) return "unduh";
    }
    const h = String(window.location.hash || "").replace(/^#/, "").trim();
    if (["kantor", "ringkas", "org", "tugas", "inv", "aset", "dokumen", "alur", "vendor", "unduh"].includes(h)) return h;
    if (document.getElementById("konten-utama")) return "kantor";
    return "standalone";
  }

  function mountHost() {
    const main = document.getElementById("konten-utama");
    if (!main) return null;
    const nav = getActivePortalNav();
    const slot = nav === "kantor"
      ? document.getElementById("gio-holding-os-slot")
      : document.getElementById("gio-holding-os-slot-page");
    let el = document.getElementById("gio-holding-os-mount");
    if (!el) {
      el = document.createElement("section");
      el.id = "gio-holding-os-mount";
      el.setAttribute("aria-label", "GIO910 Holding OS v4.0 Live");
    }
    const targetParent = slot || main;
    if (el.parentElement !== targetParent) {
      targetParent.appendChild(el);
    }
    el.style.display = "block";
    return el;
  }

  function setFeedback(ok, text) {
    ui.feedback = { ok: Boolean(ok), text: String(text || "") };
    render();
  }

  function findFeed(ov, sym) {
    const feeds = (ov && ov.holding && (ov.holding.feeds || ov.holding.marketFeeds)) || [];
    return feeds.find((f) => f.symbol === sym) || null;
  }

  function renderTicker(st) {
    const ov = st.overview || {};
    const h = ov.holding || {};
    const nav = h.nav || {};
    const acc = h.accounting3101 || {};
    const sdm = ov.sdm || {};
    const ai = ov.ai || {};
    const bc = ov.blockchain || {};
    const ig = ov.integrations || {};

    const usd = findFeed(ov, "FX:USDIDR") || findFeed(ov, "USD_IDR");
    const btc = findFeed(ov, "CRYPTO:BTC") || findFeed(ov, "BTC_IDR");
    const eth = findFeed(ov, "CRYPTO:ETH") || findFeed(ov, "ETH_IDR");
    const sol = findFeed(ov, "CRYPTO:SOL");
    const gold = findFeed(ov, "COMMODITY:XAU") || findFeed(ov, "GOLD_GRAM_IDR");
    const ihsg = findFeed(ov, "IDX:IHSG");

    const wsConnected = st.wsStatus === "connected";
    const subCount = st.subscribedTables || 36;
    const pillCls = wsConnected ? "ghos-live-pill" : "ghos-live-pill is-polling";
    const pillLabel = wsConnected
      ? `REALTIME WS · ${subCount} TABEL`
      : st.wsStatus === "connecting"
        ? "MENYAMBUNG REALTIME…"
        : `LIVE POLLING · ${subCount} TABEL`;

    return `
      <div class="ghos-ticker">
        <div class="ghos-ticker-left">
          <span class="${pillCls}" title="Koneksi ke Supabase Postgres Realtime (${esc(st.wsStatus)} · ${subCount} tabel CDC)">
            <span class="ghos-live-dot"></span>
            <span>${esc(pillLabel)}${st.wsEventCount ? ` (${st.wsEventCount})` : ""}</span>
          </span>
          <span class="ghos-tick-item">USD/IDR <b>${usd ? rp(usd.price_idr) : "—"}</b></span>
          <span class="ghos-tick-item">BTC <b>${btc ? rp(btc.price_idr) : "—"}</b></span>
          <span class="ghos-tick-item">ETH <b>${eth ? rp(eth.price_idr) : "—"}</b></span>
          <span class="ghos-tick-item">SOL <b>${sol ? rp(sol.price_idr) : "—"}</b></span>
          <span class="ghos-tick-item">Emas/g <b>${gold ? rp(gold.price_idr) : "—"}</b></span>
          <span class="ghos-tick-item">IHSG <b>${ihsg ? num(ihsg.price_idr, 2) : "—"}</b>${ihsg ? ` (${Number(ihsg.change_24h_pct || 0) >= 0 ? "+" : ""}${ihsg.change_24h_pct}%)` : ""}</span>
          <span class="ghos-tick-item">NAV 160 Aset <b class="ghos-tick-up">${nav.totalMarketValue ? rp(nav.totalMarketValue) : "—"}</b> (${nav.returnPct != null ? "+" + nav.returnPct + "%" : "—"})</span>
          <span class="ghos-tick-item">Surplus 3101 <b class="ghos-tick-up">${acc.surplus != null ? rp(acc.surplus) : "—"}</b></span>
        </div>
        <div class="ghos-ticker-right">
          <span class="ghos-tick-item">SDM Hadir: <b>${sdm.presentToday != null ? sdm.presentToday : 0}</b>/${sdm.totalPersonnel || 259} · AI: <b>${ai.agentsCount || 18}/18</b> · Chain: <b>${(bc.networks || []).length || 16}</b> · Konektor: <b>${ig.connectorsOn || 12}/13</b></span>
          <button type="button" class="ghos-btn" id="ghos-btn-sync-all">${st.loading ? "Menyinkronkan…" : "⟳ Segarkan Live"}</button>
          <button type="button" class="ghos-btn" id="ghos-btn-collapse">${ui.collapsed ? "Buka Panel ▾" : "Ringkas ▴"}</button>
        </div>
      </div>
    `;
  }

  function renderTabs(st) {
    const ov = st.overview || {};
    const chainCount = (ov.blockchain && ov.blockchain.networks && ov.blockchain.networks.length) || 16;
    const gwCount = (ov.integrations && ov.integrations.gateways && ov.integrations.gateways.length) || 20;
    const connOn = (ov.integrations && ov.integrations.connectorsOn) || 12;
    const tabs = [
      { id: "overview", label: "1 · Ikhtisar & Absensi" },
      { id: "holding", label: "2 · 160 Aset & Portofolio" },
      { id: "agents", label: "3 · 18 Agent AI" },
      { id: "web3", label: `4 · Web3 ${chainCount}-Chain & DAO` },
      { id: "integrations", label: `5 · ${gwCount} Gateway & Webhook` },
      { id: "ops", label: "6 · CRM, Fasilitas & Reg" },
      { id: "ledger_conn", label: `7 · Buku Besar 3101 & Konektor ${connOn}/13` },
      { id: "modules", label: "8 · Semua Modul & 9 Halaman" },
    ];
    return `
      <div class="ghos-tabs" role="tablist">
        ${tabs
          .map(
            (t) =>
              `<button type="button" role="tab" aria-selected="${ui.tab === t.id}" class="ghos-tab ${ui.tab === t.id ? "is-active" : ""}" data-ghos-tab="${t.id}">${esc(t.label)}</button>`
          )
          .join("")}
        <button type="button" class="ghos-tab" id="ghos-jump-office">↑ Denah 4 Lantai (277 Meja)</button>
      </div>
    `;
  }

  function renderOverview(st) {
    const ov = st.overview || {};
    const h = ov.holding || {};
    const nav = h.nav || {};
    const acc = h.accounting3101 || {};
    const sdm = ov.sdm || {};
    const ai = ov.ai || {};
    const rtEvents = ov.realtimeEvents || [];
    const attList = st.attendance.length ? st.attendance : (sdm.attendanceList || []);
    const leaveList = st.leaveRequests.length ? st.leaveRequests : (sdm.leaveRequests || []);
    const tok = OS() ? OS().getActiveToken() : "";

    return `
      <div class="ghos-kpis">
        <div class="ghos-kpi">
          <small>Nilai Pasar Holding (MTM)</small>
          <strong>${nav.totalMarketValue ? rp(nav.totalMarketValue) : "—"}</strong>
          <span>Basis Biaya: ${nav.totalCostBasis ? rp(nav.totalCostBasis) : "—"} · PnL +${nav.totalUnrealizedPnl ? rp(nav.totalUnrealizedPnl) : "—"}</span>
        </div>
        <div class="ghos-kpi">
          <small>Ekuitas / Surplus 3101 (Closed 2026-11)</small>
          <strong>${acc.surplus != null ? rp(acc.surplus) : "—"}</strong>
          <span>Pendapatan ${rp(acc.pendapatan)} · Beban ${rp(acc.beban)}</span>
        </div>
        <div class="ghos-kpi">
          <small>Kas &amp; Bank (COA 1101) + Pipeline</small>
          <strong>${acc.kas1101 != null ? rp(acc.kas1101) : "—"}</strong>
          <span>Deal Pipeline: ${nav.pipelineValue ? rp(nav.pipelineValue) : "—"} (${(h.deals || []).length} deal)</span>
        </div>
        <div class="ghos-kpi">
          <small>Kehadiran &amp; SDM Terdaftar</small>
          <strong>${sdm.presentToday || 0} Hadir · ${sdm.approvedLeaveCount || 0} Dinas/Cuti</strong>
          <span>Total ${sdm.totalPersonnel || 259} personel payroll · ${ai.agentsCount || 18} Agent AI 24 jam</span>
        </div>
      </div>

      <div class="ghos-grid-2">
        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>Absensi Berlapis Geofence Live &amp; Izin/Cuti SDM</h3>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button type="button" class="ghos-btn ok" id="ghos-att-in" ${!tok ? "title='Masuk akun di Portal untuk mencatat absensi ke Postgres'" : ""}>🛡️ Absen Masuk Berlapis</button>
              <button type="button" class="ghos-btn warn" id="ghos-att-out">🛡️ Absen Pulang Berlapis</button>
            </div>
          </div>
          <div style="font-size:11.5px;color:#93c5fd;margin-bottom:6px">Keamanan anti-curang: Wajib Kamera Live (Liveness) + (Suara ATAU Password) + Maps Otomatis.</div>
          <div class="ghos-form-row" style="margin-bottom:8px">
            <select id="ghos-att-mode" class="ghos-sel" aria-label="Mode lokasi absen">
              <option value="auto">GPS Otomatis</option>
              <option value="wfo">Di Kantor (WFO)</option>
              <option value="remote">Luar Kantor / WFH / Dinas</option>
            </select>
            <input id="ghos-att-note" class="ghos-inp" style="flex:1;min-width:210px" placeholder="Catatan lokasi absen (wajib/isi bila di luar kantor, mis. WFH Depok / Klien)…" />
          </div>
          ${!tok ? `<div class="ghos-collapse-note" style="margin-bottom:8px;color:#fbbf24">Anda dalam mode tampilan publik — masuk via OTP/PIN/Kartu di Portal untuk mencatat absensi, cuti, &amp; transaksi.</div>` : ""}
          <div class="ghos-tbl-wrap" style="max-height:240px;margin-bottom:10px">
            <table class="ghos-tbl">
              <thead><tr><th>Nama</th><th>Waktu WIB</th><th>Jenis</th><th>Lokasi, Catatan &amp; Jarak</th><th>Status</th></tr></thead>
              <tbody>
                ${attList
                  .slice(0, 20)
                  .map(
                    (a) => {
                      const dist = a.distance_m != null ? Number(a.distance_m) : null;
                      const isOut = Boolean(a.outside_office || (dist != null && dist > 300) || /luar kantor|remote|wfh|dinas|lapangan/i.test(String(a.location || "")));
                      const distBadge = dist != null
                        ? (isOut
                            ? `<span class="ghos-badge warn">Luar Kantor · ${dist >= 1000 ? (dist / 1000).toFixed(2) + " km" : dist + " m"}</span>`
                            : `<span class="ghos-badge">Di Kantor · ${dist} m</span>`)
                        : (isOut ? `<span class="ghos-badge warn">Luar Kantor</span>` : "");
                      const coordTxt = a.lat != null && a.lng != null ? `${Number(a.lat).toFixed(4)}, ${Number(a.lng).toFixed(4)}` : "";
                      return `
                  <tr>
                    <td><b>${esc(a.employee_name)}</b><br><small style="color:#9fb0d0">${esc(a.att_date)}</small></td>
                    <td>${esc(a.att_time)}</td>
                    <td><span class="ghos-badge ${a.kind === "out" ? "warn" : ""}">${a.kind === "out" ? "Pulang" : "Masuk"}</span></td>
                    <td>
                      <div>${esc(a.location || "-")} ${distBadge}</div>
                      <small style="color:#9fb0d0">${esc(a.method || "GPS")}${coordTxt ? " · " + esc(coordTxt) : ""}</small>
                    </td>
                    <td><span class="ghos-badge ${String(a.status || "").toLowerCase().includes("menunggu") ? "warn" : "info"}">${esc(a.status)}</span></td>
                  </tr>`;
                    }
                  )
                  .join("") || `<tr><td colspan="5" style="color:#9fb0d0">Belum ada catatan absensi hari ini.</td></tr>`}
              </tbody>
            </table>
          </div>
          <div class="ghos-form-row">
            <input id="ghos-leave-reason" class="ghos-inp" style="flex:1;min-width:160px" placeholder="Pengajuan Izin/Dinas (alasan)…" />
            <select id="ghos-leave-type" class="ghos-sel">
              <option value="Dinas Lapangan">Dinas Lapangan</option>
              <option value="Cuti Tahunan">Cuti Tahunan</option>
              <option value="Izin Sakit">Izin Sakit</option>
            </select>
            <button type="button" class="ghos-btn prim" id="ghos-leave-submit">Ajukan Izin/Cuti</button>
          </div>
          ${
            leaveList.length
              ? `<div style="font-size:11.5px;color:#9fb0d0">Pengajuan Terbaru: ${leaveList
                  .slice(0, 3)
                  .map(
                    (l) =>
                      `<span style="margin-right:10px"><b>${esc(l.nama)}</b> (${esc(l.jenis)}, ${esc(l.tgl_mulai)}) <span class="ghos-badge ${l.status === "Disetujui" ? "" : l.status === "Ditolak" ? "err" : "warn"}">${esc(l.status)}</span>${l.status === "Menunggu" && tok ? ` <button type="button" class="ghos-btn" style="padding:1px 6px;font-size:10px" data-leave-approve="${esc(l.id)}">Setujui</button>` : ""}</span>`
                  )
                  .join("")}</div>`
              : ""
          }
        </div>

        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>Aliran Peristiwa Realtime (Postgres CDC · ${st.subscribedTables || 36} Tabel)</h3>
            <span class="ghos-badge info">${rtEvents.length} event${st.lastWsTable ? ` · ${esc(st.lastWsTable)}` : ""}</span>
          </div>
          <div class="ghos-feed-list">
            ${rtEvents
              .slice(0, 20)
              .map(
                (ev) => `
              <div class="ghos-feed-item">
                <div>
                  <span class="ghos-badge ${ev.severity === "warning" ? "warn" : ev.severity === "alert" ? "err" : ev.severity === "success" ? "" : "info"}">${esc(ev.channel)}</span>
                  <b style="margin-left:6px">${esc(ev.title)}</b>
                  <div style="color:#9fb0d0;margin-top:2px">${esc(ev.summary || "")}</div>
                </div>
                <div style="color:#7dd3fc;font-size:10.5px;white-space:nowrap">${esc(String(ev.created_at || "").slice(11, 19))} UTC</div>
              </div>`
              )
              .join("") || `<div style="color:#9fb0d0;font-size:12px">Belum ada event realtime tercatat.</div>`}
          </div>
        </div>
      </div>
    `;
  }

  function renderHolding(st) {
    const ov = st.overview || {};
    const pf = st.portfolio || ov.holding || {};
    const positions = pf.positions || [];
    const txs = pf.transactions || [];
    const deals = pf.deals || [];
    const cats = st.catalog || [];
    const groups = ["ALL", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
    const q = ui.assetQuery.trim().toLowerCase();
    const filteredCats = cats.filter((c) => {
      if (ui.assetGroup !== "ALL" && c.asset_group !== ui.assetGroup) return false;
      if (q && !`${c.code} ${c.symbol} ${c.name} ${c.asset_class} ${c.desk_code} ${c.custodian_channel}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const tok = OS() ? OS().getActiveToken() : "";

    return `
      <div class="ghos-grid-2">
        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>Portofolio Modal Sendiri (${positions.length} Posisi Live)</h3>
            <span class="ghos-badge">Non-Pialang · Mark-to-Market</span>
          </div>
          <div class="ghos-tbl-wrap">
            <table class="ghos-tbl">
              <thead><tr><th>Kode</th><th>Aset &amp; Kustodian</th><th>Unit</th><th>Nilai Pasar</th><th>Unrealized PnL</th></tr></thead>
              <tbody>
                ${positions
                  .map(
                    (p) => `
                  <tr>
                    <td><b>${esc(p.asset_code)}</b><br><small style="color:#7dd3fc">${esc(p.desk_code)}</small></td>
                    <td><b>${esc(p.asset_name)}</b><br><small style="color:#9fb0d0">${esc(p.custodian)} · ${esc(p.entity_name)}</small></td>
                    <td style="font-variant-numeric:tabular-nums">${num(p.units, 4)}</td>
                    <td style="font-variant-numeric:tabular-nums"><b>${rp(p.market_value_idr)}</b><br><small style="color:#9fb0d0">Cost ${rp(p.cost_basis_idr)}</small></td>
                    <td style="color:${Number(p.unrealized_pnl_idr) >= 0 ? "#34d399" : "#fca5a5"};font-weight:700">${Number(p.unrealized_pnl_idr) >= 0 ? "+" : ""}${rp(p.unrealized_pnl_idr)}</td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>Eksekusi Transaksi Modal Sendiri &amp; IC Gate (≥ Rp500 jt)</h3>
            <span class="ghos-badge info">${txs.length} Transaksi Terbaru</span>
          </div>
          <div class="ghos-form-row">
            <input id="ghos-tx-code" class="ghos-inp" style="width:95px" value="A-01" placeholder="Kode (A-01)" />
            <select id="ghos-tx-type" class="ghos-sel">
              <option value="Beli / Tambah Posisi">Beli / Tambah Posisi</option>
              <option value="Jual / Realisasi">Jual / Realisasi</option>
              <option value="Dividen / Kupon Masuk">Dividen / Kupon Masuk</option>
            </select>
            <input id="ghos-tx-units" class="ghos-inp" type="number" step="any" style="width:90px" value="1" placeholder="Unit" />
            <input id="ghos-tx-price" class="ghos-inp" type="number" style="width:130px" value="10000000" placeholder="Harga (IDR)" />
            <label style="font-size:11.5px;display:flex;align-items:center;gap:4px;color:#9fb0d0"><input type="checkbox" id="ghos-tx-gl" /> Catat ke Jurnal GL</label>
            <button type="button" class="ghos-btn prim" id="ghos-tx-submit" ${!tok ? "disabled title='Masuk Portal dulu'" : ""}>Eksekusi</button>
          </div>
          <div class="ghos-tbl-wrap" style="max-height:190px;margin-bottom:10px">
            <table class="ghos-tbl">
              <thead><tr><th>Ref</th><th>Aset</th><th>Jenis</th><th>Nominal</th><th>Status</th></tr></thead>
              <tbody>
                ${txs
                  .map(
                    (t) => `
                  <tr>
                    <td><b>${esc(t.tx_code)}</b></td>
                    <td>${esc(t.asset_code)} · ${esc(t.asset_name)}</td>
                    <td>${esc(t.tx_type)}</td>
                    <td>${rp(t.total_idr)}</td>
                    <td><span class="ghos-badge ${t.status === "Pending IC" ? "warn" : ""}">${esc(t.status)}</span></td>
                  </tr>`
                  )
                  .join("") || `<tr><td colspan="5">Belum ada mutasi transaksi.</td></tr>`}
              </tbody>
            </table>
          </div>
          <div style="font-size:11.5px;color:#9fb0d0">
            <b>Deal Pipeline (${deals.length}):</b> ${deals
              .slice(0, 4)
              .map((d) => `${esc(d.deal_code)} ${esc(d.nama_deal)} (${rp(d.nilai_estimasi)}, ${esc(d.tahap)})`)
              .join(" · ")}
          </div>
        </div>
      </div>

      <div class="ghos-card">
        <div class="ghos-card-head">
          <h3>Katalog 160 Jenis Aset Holding (${cats.length ? filteredCats.length + " / " + cats.length : "Memuat 160 kategori…"})</h3>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
            <select id="ghos-cat-grp" class="ghos-sel">
              ${groups.map((g) => `<option value="${g}" ${ui.assetGroup === g ? "selected" : ""}>${g === "ALL" ? "Semua Grup (A–N)" : "Grup " + g}</option>`).join("")}
            </select>
            <input id="ghos-cat-q" class="ghos-inp" style="width:220px" value="${esc(ui.assetQuery)}" placeholder="Cari kode / simbol / aset / kustodian…" />
          </div>
        </div>
        <div class="ghos-tbl-wrap" style="max-height:280px">
          <table class="ghos-tbl">
            <thead><tr><th>Kode</th><th>Simbol</th><th>Nama Instrumen &amp; Kelas</th><th>Desk</th><th>COA</th><th>Risiko &amp; Kustodian</th></tr></thead>
            <tbody>
              ${filteredCats
                .slice(0, 160)
                .map(
                  (c) => `
                <tr>
                  <td><b>${esc(c.code)}</b></td>
                  <td><span class="ghos-badge info">${esc(c.symbol)}</span></td>
                  <td><b>${esc(c.name)}</b><br><small style="color:#9fb0d0">${esc(c.asset_class)} · Grup ${esc(c.asset_group)}</small></td>
                  <td>${esc(c.desk_code)}<br><small style="color:#9fb0d0">${esc(c.entity_name)}</small></td>
                  <td>${esc(c.coa_code)}</td>
                  <td><span class="ghos-badge ${c.risk_tier === "Tinggi" ? "warn" : ""}">${esc(c.risk_tier)}</span><br><small style="color:#9fb0d0">${esc(c.custodian_channel)}</small></td>
                </tr>`
                )
                .join("") || `<tr><td colspan="6" style="color:#9fb0d0">Memuat katalog 160 jenis aset dari Postgres…</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderAgents(st) {
    const ov = st.overview || {};
    const agData = st.agents || {};
    const list = agData.agents || (ov.ai && ov.ai.agents) || [];
    const runs = agData.runs || (ov.ai && ov.ai.recentRuns) || [];
    const latestByAgent = {};
    runs.forEach((r) => {
      if (!latestByAgent[r.agent_id]) latestByAgent[r.agent_id] = r;
    });
    const tok = OS() ? OS().getActiveToken() : "";

    return `
      <div class="ghos-card">
        <div class="ghos-card-head">
          <div>
            <h3>18 Agent AI Kuantitatif · Engine: <code>pure_postgres_quant_agents</code></h3>
            <div class="ghos-collapse-note">Setiap agent menghitung metrik nyata dari tabel Postgres (GL 3101, Portofolio 160 Aset, PPN, Payroll, &amp; RPC Blockchain) tanpa teks buatan.</div>
          </div>
          <button type="button" class="ghos-btn prim" id="ghos-run-all-agents" ${!tok ? "disabled title='Masuk Portal untuk menjalankan orkestrasi'" : ""}>⚡ Jalankan Semua 18 Agent (Postgres)</button>
        </div>
        <div class="ghos-agent-grid">
          ${list
            .map((a) => {
              const r = a.lastRun || latestByAgent[a.id];
              const badgeCls = r && r.status === "warning" ? "warn" : "";
              return `
                <div class="ghos-agent-card">
                  <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
                      <b style="color:#7dd3fc">${esc(a.id)} · ${esc(a.name)}</b>
                      <span class="ghos-badge ${badgeCls}">${esc(r ? r.status : a.status || "standby")}</span>
                    </div>
                    <div style="font-size:11px;color:#9fb0d0;margin-top:3px">Owner: <b>${esc(a.owner_role)}</b> · Desk: ${esc(a.desk_scope || "All")}</div>
                    <div style="font-size:11.5px;color:#cfe0ff;margin-top:6px">${esc(r ? r.summary : a.mission)}</div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;border-top:1px solid #1e3154;padding-top:7px">
                    <span style="font-size:10.5px;color:#9fb0d0">${r ? `${r.duration_ms || 0}ms · ${String(r.created_at || "").slice(11, 19)}` : "Belum dijalankan"}</span>
                    <button type="button" class="ghos-btn" data-run-agent="${esc(a.id)}" ${!tok ? "disabled" : ""}>Jalankan ▸</button>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderWeb3(st) {
    const bc = st.blockchain || (st.overview && st.overview.blockchain) || {};
    const nets = bc.networks || [];
    const props = bc.proposals || bc.daoProposals || [];
    const txLogs = bc.txLogs || [];
    const tok = OS() ? OS().getActiveToken() : "";

    return `
      <div class="ghos-grid-2">
        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>${nets.length || 16} Jaringan Blockchain Multi-Chain Live (EVM + Non-EVM)</h3>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button type="button" class="ghos-btn prim" id="ghos-probe-chains" ${!tok ? "disabled title='Masuk Portal dulu'" : ""}>⟳ Probe ${nets.length || 16} RPC Live</button>
              <button type="button" class="ghos-btn ok" id="ghos-connect-wallet">${ui.walletAddress ? esc(ui.walletAddress.slice(0, 6) + "…" + ui.walletAddress.slice(-4)) : "🦊 Hubungkan MetaMask"}</button>
            </div>
          </div>
          <div class="ghos-tbl-wrap">
            <table class="ghos-tbl">
              <thead><tr><th>Jaringan</th><th>Chain ID</th><th>Block / Slot</th><th>Gas (Gwei)</th><th>Latency</th><th>Status</th></tr></thead>
              <tbody>
                ${nets
                  .map((n) => {
                    const tel = n.telemetry || {};
                    const kindLabel = n.network_kind === "non-evm" ? "Non-EVM" : n.is_testnet ? "Testnet" : "Mainnet";
                    return `
                      <tr>
                        <td><b>${esc(n.name)}</b><br><small style="color:#9fb0d0">${esc(n.native_symbol)} · ${kindLabel}${n.safe_address ? " · Safe ✓" : ""}</small></td>
                        <td>${esc(n.chain_id)}</td>
                        <td style="font-family:monospace">${tel.block_number != null ? Number(tel.block_number).toLocaleString("id-ID") : "—"}</td>
                        <td>${n.network_kind === "non-evm" ? "—" : tel.gas_gwei != null ? tel.gas_gwei : "—"}</td>
                        <td>${tel.rpc_latency_ms != null ? tel.rpc_latency_ms + " ms" : "—"}</td>
                        <td><span class="ghos-badge ${tel.status === "connected" ? "" : "warn"}">${esc(tel.status || "siap")}</span></td>
                      </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
          ${
            ui.walletAddress
              ? `<div class="ghos-form-row" style="margin-top:10px;margin-bottom:0">
                  <span style="font-size:11.5px;color:#6ee7b7">Dompet terhubung: <code>${esc(ui.walletAddress)}</code> (Chain ${esc(ui.walletChainId)})</span>
                  <button type="button" class="ghos-btn" id="ghos-sign-eip191">Tanda Tangani EIP-191 &amp; Simpan ke Postgres</button>
                </div>`
              : `<div class="ghos-collapse-note" style="margin-top:8px">Klik Hubungkan MetaMask untuk tanda tangan EIP-191 atau atur alamat kontrak 0x / Safe / Treasury Non-EVM (Pemilik) di bawah.</div>`
          }
          ${
            tok
              ? `<div class="ghos-form-row" style="margin-top:10px;margin-bottom:0;padding-top:8px;border-top:1px solid #1e3154">
                  <select id="ghos-bc-slug" class="ghos-sel">${nets.map((n) => `<option value="${esc(n.slug)}">${esc(n.name)} (${n.network_kind === "non-evm" ? "Non-EVM" : "Chain " + n.chain_id})</option>`).join("")}</select>
                  <input id="ghos-bc-safe" class="ghos-inp" style="flex:1;min-width:150px" placeholder="Safe / Treasury Address (Pemilik)…" />
                  <input id="ghos-bc-gov" class="ghos-inp" style="flex:1;min-width:150px" placeholder="Governor / Token Address (Pemilik)…" />
                  <button type="button" class="ghos-btn" id="ghos-bc-cfg-save">Simpan Alamat Kontrak</button>
                </div>`
              : ""
          }
        </div>

        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>Hybrid Snapshot DAO &amp; Full Governor (${props.length} Proposal)</h3>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button type="button" class="ghos-btn" id="ghos-sync-snapshot" ${!tok ? "disabled" : ""}>⟳ Sync Snapshot</button>
              <button type="button" class="ghos-btn" data-open-mod-inline="daohybrid">Hybrid DAO ▾</button>
              <button type="button" class="ghos-btn" data-open-mod-inline="daofull">Full DAO ▾</button>
            </div>
          </div>
          <div class="ghos-tbl-wrap" style="max-height:215px;margin-bottom:10px">
            <table class="ghos-tbl">
              <thead><tr><th>Kode</th><th>Mode</th><th>Judul Proposal</th><th>For / Against</th><th>Vote Live</th></tr></thead>
              <tbody>
                ${props
                  .map(
                    (p) => `
                  <tr>
                    <td><b>${esc(p.proposal_code)}</b><br><span class="ghos-badge">${esc(p.state)}</span></td>
                    <td><span class="ghos-badge info">${esc(p.mode)}</span></td>
                    <td><b>${esc(p.title)}</b><br><small style="color:#9fb0d0">${esc(p.space_or_contract)}</small></td>
                    <td>${Number(p.votes_for || 0)} / ${Number(p.votes_against || 0)}</td>
                    <td>
                      <div style="display:flex;gap:4px;flex-wrap:wrap">
                        <button type="button" class="ghos-btn ok" style="padding:2px 7px;font-size:10.5px" data-dao-vote="for" data-dao-code="${esc(p.proposal_code)}">+1 Setuju</button>
                        <button type="button" class="ghos-btn" style="padding:2px 7px;font-size:10.5px" data-dao-vote="against" data-dao-code="${esc(p.proposal_code)}">+1 Tolak</button>
                      </div>
                    </td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div style="font-size:11.5px;color:#9fb0d0">
            <b>Log Verifikasi Wallet &amp; Kontrak (${txLogs.length}):</b>
            ${txLogs
              .slice(0, 3)
              .map((l) => `<div style="margin-top:3px">• <b>${esc(l.action_type)}</b> (${esc(l.network_slug)}) — <code>${esc(l.signer_address || "")}</code> <span class="ghos-badge">${esc(l.status)}</span></div>`)
              .join("") || " Belum ada aktivitas wallet tercatat."}
          </div>
        </div>
      </div>
    `;
  }

  function renderIntegrations(st) {
    const ig = st.integrations || (st.overview && st.overview.integrations) || {};
    const gateways = ig.gateways || [];
    const deliveries = ig.deliveries || [];
    const subs = ig.subscriptions || [];
    const conns = ig.connectors || [];
    const tok = OS() ? OS().getActiveToken() : "";

    return `
      <div class="ghos-grid-2">
        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>${gateways.length || 20} Gateway 3rd-Party Live (Kurs, IDX IHSG, Kripto, Bank, QRIS, Pajak, Web3, IoT)</h3>
            <button type="button" class="ghos-btn prim" id="ghos-sync-market" ${!tok ? "disabled title='Masuk Portal dulu'" : ""}>⟳ Sync Kurs, Kripto &amp; IHSG</button>
          </div>
          <div class="ghos-tbl-wrap">
            <table class="ghos-tbl">
              <thead><tr><th>Provider</th><th>Kategori</th><th>Endpoint</th><th>Status</th></tr></thead>
              <tbody>
                ${gateways
                  .map(
                    (g) => `
                  <tr>
                    <td><b>${esc(g.name)}</b><br><small style="color:#9fb0d0">${esc(g.provider)}</small></td>
                    <td>${esc(g.category)}</td>
                    <td style="font-size:11px;color:#7dd3fc;word-break:break-word;max-width:170px">${esc(g.endpoint_url || "-")}</td>
                    <td><span class="ghos-badge ${g.status === "active" ? "" : "info"}">${esc(g.status)}</span></td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div class="ghos-collapse-note" style="margin-top:8px">Konektor Workspace Arena (${ig.connectorsOn || 12} aktif / ${conns.length || 13} total): ${(() => { const off = conns.filter((c) => c.arena_status !== "on"); return off.length ? off.map((c) => "<b>" + esc(c.name.split(" ")[0]) + "</b>").join(", ") + " terhubung namun berstatus nonaktif di pengaturan Arena hingga diaktifkan oleh pengguna." : "seluruh konektor berstatus aktif."; })()}</div>
        </div>

        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>Bus Webhook HMAC-SHA256 (${subs.length} Outbound · ${deliveries.length} Log)</h3>
          </div>
          <div class="ghos-form-row">
            <select id="ghos-wh-in-prov" class="ghos-sel">
              <option value="gopay">Inbound GoPay / Midtrans QRIS</option>
              <option value="bca_mutasi">Inbound Mutasi BCA / Mandiri</option>
              <option value="djp_coretax">Inbound Callback DJP Coretax</option>
              <option value="privy_esign">Inbound Privy e-Meterai</option>
              <option value="oss_ahu">Inbound OSS RBA / AHU Legal</option>
              <option value="bpjs_payroll">Inbound BPJS / Payroll HR</option>
              <option value="iot_telemetry">Inbound IoT Telemetry Lapangan</option>
            </select>
            <input id="ghos-wh-in-amt" class="ghos-inp" type="number" style="width:120px" value="1500000" placeholder="Nominal (IDR)" />
            <button type="button" class="ghos-btn ok" id="ghos-wh-in-test" ${!tok ? "disabled" : ""}>Verifikasi &amp; Log Inbound</button>
          </div>
          <div class="ghos-form-row">
            <input id="ghos-wh-out-url" class="ghos-inp" style="flex:1;min-width:190px" placeholder="Outbound HTTPS Webhook URL (mis. https://hooks.mitra.id/gio910)…" />
            <button type="button" class="ghos-btn" id="ghos-wh-out-send" ${!tok ? "disabled" : ""}>Kirim Ping HMAC-SHA256</button>
          </div>
          <div class="ghos-tbl-wrap" style="max-height:220px">
            <table class="ghos-tbl">
              <thead><tr><th>Arah</th><th>Provider / Event</th><th>HTTP</th><th>Hasil</th></tr></thead>
              <tbody>
                ${deliveries
                  .slice(0, 15)
                  .map(
                    (d) => `
                  <tr>
                    <td><span class="ghos-badge ${d.direction === "inbound" ? "info" : ""}">${esc(d.direction)}</span></td>
                    <td><b>${esc(d.provider)}</b><br><small style="color:#9fb0d0">${esc(d.event_name)}</small></td>
                    <td>${esc(d.http_status || "—")}</td>
                    <td><span class="ghos-badge">${esc(d.status)}</span><br><small style="color:#9fb0d0">${esc(d.response_excerpt || "")}</small></td>
                  </tr>`
                  )
                  .join("") || `<tr><td colspan="4" style="color:#9fb0d0">Belum ada riwayat pengiriman webhook.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderOps(st) {
    const ov = st.overview || {};
    const ops = ov.operations || {};
    const crm = st.crm.length ? st.crm : (ops.crmContacts || []);
    const fac = st.facility.length ? st.facility : (ops.facilityTickets || []);
    const regs = st.registers.length ? st.registers : (ops.complianceRegisters || []);
    const tok = OS() ? OS().getActiveToken() : "";

    return `
      <div class="ghos-grid-2">
        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>CRM Mitra &amp; Investor (${crm.length})</h3>
          </div>
          <div class="ghos-form-row">
            <input id="ghos-crm-name" class="ghos-inp" style="flex:1" placeholder="Nama PIC…" />
            <input id="ghos-crm-org" class="ghos-inp" style="flex:1" placeholder="Perusahaan / Institusi…" />
            <button type="button" class="ghos-btn prim" id="ghos-crm-add" ${!tok ? "disabled" : ""}>+ Simpan CRM</button>
          </div>
          <div class="ghos-tbl-wrap" style="max-height:220px">
            <table class="ghos-tbl">
              <thead><tr><th>Perusahaan</th><th>Kategori</th><th>Entitas</th><th>Status</th></tr></thead>
              <tbody>
                ${crm
                  .map(
                    (c) => `
                  <tr>
                    <td><b>${esc(c.perusahaan)}</b>${c.nama ? `<br><small style="color:#9fb0d0">${esc(c.nama)}</small>` : ""}</td>
                    <td>${esc(c.kategori)}</td>
                    <td>${esc(c.entitas)}</td>
                    <td><span class="ghos-badge">${esc(c.status)}</span></td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>Tiket Fasilitas Kantor (${fac.length} Tiket)</h3>
          </div>
          <div class="ghos-form-row">
            <input id="ghos-fac-loc" class="ghos-inp" style="width:135px" placeholder="Lokasi (Lantai/Ruang)" />
            <input id="ghos-fac-desc" class="ghos-inp" style="flex:1" placeholder="Keluhan / kebutuhan fasilitas…" />
            <button type="button" class="ghos-btn prim" id="ghos-fac-add" ${!tok ? "disabled" : ""}>+ Buat Tiket</button>
          </div>
          <div class="ghos-tbl-wrap" style="max-height:220px">
            <table class="ghos-tbl">
              <thead><tr><th>Lokasi</th><th>Keluhan / Pemeliharaan</th><th>Prioritas</th><th>Status</th></tr></thead>
              <tbody>
                ${fac
                  .map(
                    (t) => `
                  <tr>
                    <td><b>${esc(t.lokasi)}</b></td>
                    <td>${esc(t.keluhan)}</td>
                    <td><span class="ghos-badge ${t.prioritas === "Tinggi" ? "warn" : ""}">${esc(t.prioritas)}</span></td>
                    <td><span class="ghos-badge info">${esc(t.status)}</span></td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="ghos-card">
        <div class="ghos-card-head">
          <h3>Register Kepatuhan &amp; Mitigasi Risiko (${regs.length})</h3>
          <div class="ghos-form-row" style="margin:0">
            <input id="ghos-reg-id" class="ghos-inp" style="width:140px" placeholder="Kode Item (REG-...)" />
            <input id="ghos-reg-st" class="ghos-inp" style="width:140px" value="Terverifikasi" placeholder="Status" />
            <button type="button" class="ghos-btn prim" id="ghos-reg-save" ${!tok ? "disabled" : ""}>Simpan Register</button>
          </div>
        </div>
        <div class="ghos-tbl-wrap" style="max-height:220px">
          <table class="ghos-tbl">
            <thead><tr><th>Kode Item</th><th>Tipe</th><th>Status</th><th>Diperbarui</th></tr></thead>
            <tbody>
              ${regs
                .slice(0, 40)
                .map(
                  (r) => `
                <tr>
                  <td><b>${esc(r.item_id)}</b></td>
                  <td><span class="ghos-badge info">${esc(r.register_type || "register")}</span></td>
                  <td><span class="ghos-badge">${esc(r.status)}</span></td>
                  <td style="color:#9fb0d0">${esc(String(r.updated_at || "").slice(0, 19).replace("T", " "))}</td>
                </tr>`
                )
                .join("") || `<tr><td colspan="4" style="color:#9fb0d0">Belum ada register kepatuhan tercatat.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderLedgerAndConnectors(st) {
    const ov = st.overview || {};
    const acc = (ov.holding && ov.holding.accounting3101) || {};
    const connData = st.connectorsData || {};
    const conns = connData.connectors || (ov.integrations && ov.integrations.connectors) || [];
    const resources = connData.resources || [];
    const deckKpis = (connData.slidesDeck && connData.slidesDeck.kpis) || {};
    const sumConn = connData.summary || { on: ov.integrations?.connectorsOn || 12, off: ov.integrations?.connectorsOff ?? 1, total: conns.length || 13 };
    const finSum = st.financeSummary;
    const finTotals = (finSum && finSum.totals) || {};
    const pajakSummary = (finSum && finSum.pajak) || {};
    const fakturList = st.pajak || [];
    const journals = st.financeJournals || [];
    const poList = st.procurement || [];
    const audit = st.auditVerify || null;
    const tok = OS() ? OS().getActiveToken() : "";

    const pendapatan = finTotals.pendapatanOperasional != null ? finTotals.pendapatanOperasional : (deckKpis.pendapatanOperasional || acc.pendapatan || 0);
    const beban = finTotals.bebanOperasional != null ? finTotals.bebanOperasional : (acc.beban || 0);
    const ekuitas3101 = finTotals.ekuitas3101 != null ? finTotals.ekuitas3101 : (deckKpis.ekuitas3101 || acc.surplus || 0);
    const kas1101 = finTotals.kas1101 != null ? finTotals.kas1101 : (acc.kas1101 || 0);
    const auditRows = audit ? audit.rows : (deckKpis.auditRows || 0);
    const auditBroken = audit ? audit.broken : (deckKpis.auditBroken || 0);

    return `
      <div class="ghos-kpis">
        <div class="ghos-kpi">
          <small>Pendapatan 2026-11 (4101..4104)</small>
          <strong>${rp(pendapatan)}</strong>
          <span>OPEX: ${rp(beban)}</span>
        </div>
        <div class="ghos-kpi">
          <small>Ekuitas / Surplus 3101</small>
          <strong style="color:#34d399">${rp(ekuitas3101)}</strong>
          <span>Kas COA 1101: ${rp(kas1101)}</span>
        </div>
        <div class="ghos-kpi">
          <small>Payroll 259 · e-Faktur PPN · DAO</small>
          <strong>${deckKpis.payrollCount || st.payroll?.totals?.headcount || 259} · ${fakturList.length || deckKpis.fakturCount || 7} · ${deckKpis.daoProposals || 2}</strong>
          <span>${pajakSummary.ppnKurangBayar != null ? "Kurang Bayar PPN: " + rp(pajakSummary.ppnKurangBayar) : "Sync e-Faktur & Payroll Postgres"}</span>
        </div>
        <div class="ghos-kpi">
          <small>Rantai Audit SHA-256 &amp; Konektor</small>
          <strong>${auditRows} Baris · ${sumConn.on}/${sumConn.total} ON</strong>
          <span>Putus: ${auditBroken} · Standby OFF: ${esc(conns.filter((c) => c.arena_status !== "on").map((c) => c.name.split(" ")[0]).join(", ") || "Dropbox")}</span>
        </div>
      </div>

      <div class="ghos-grid-2">
        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>Buku Besar 3101, e-Faktur PPN &amp; Procurement PO</h3>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button type="button" class="ghos-btn prim" id="ghos-lc-open-fin">📊 Konsol Full 3101</button>
              <button type="button" class="ghos-btn" id="ghos-lc-sync-sheets" ${!tok ? "disabled" : ""}>Sync Neraca → Sheets</button>
            </div>
          </div>
          ${
            !tok
              ? `<div class="ghos-collapse-note" style="color:#fbbf24;margin-bottom:8px">Ringkasan 3101 di atas aktif secara publik. Masuk Portal untuk melihat rincian jurnal GL, menerbitkan e-Faktur, atau menyetujui PO Vendor (&gt;Rp100 jt 4-Eyes Control).</div>`
              : `
                <div class="ghos-form-row">
                  <input id="ghos-jp-ref" class="ghos-inp" style="width:110px" placeholder="Ref (ADJ-11)" />
                  <input id="ghos-jp-ket" class="ghos-inp" style="flex:1;min-width:140px" placeholder="Keterangan jurnal GL…" />
                  <input id="ghos-jp-dr" class="ghos-inp" style="width:72px" value="1101" placeholder="Dr" />
                  <input id="ghos-jp-cr" class="ghos-inp" style="width:72px" value="4101" placeholder="Cr" />
                  <input id="ghos-jp-amt" class="ghos-inp" type="number" style="width:110px" placeholder="Nominal" />
                  <button type="button" class="ghos-btn prim" id="ghos-jp-post">+ Posting GL</button>
                </div>
                <div class="ghos-tbl-wrap" style="max-height:185px;margin-bottom:10px">
                  <table class="ghos-tbl">
                    <thead><tr><th>No. PO / Jurnal</th><th>Keterangan / Vendor</th><th>Nominal / Periode</th><th>Status</th></tr></thead>
                    <tbody>
                      ${poList
                        .slice(0, 6)
                        .map(
                          (po) => `
                        <tr>
                          <td><code>${esc(po.po_number)}</code></td>
                          <td>${esc(po.vendor)} <small style="color:#9fb0d0">(${esc(po.kategori)})</small></td>
                          <td>${rp(po.nilai)}</td>
                          <td>${po.status === "Diajukan" ? `<button type="button" class="ghos-btn ok" style="padding:2px 7px;font-size:10.5px" data-ghos-po-app="${esc(po.id)}">Setujui PO</button>` : `<span class="ghos-badge">${esc(po.status)}</span>`}</td>
                        </tr>`
                        )
                        .join("")}
                      ${journals
                        .slice(0, 6)
                        .map(
                          (j) => `
                        <tr>
                          <td><code>${esc(j.ref)}</code></td>
                          <td>${esc(j.keterangan)}</td>
                          <td>${esc(j.tanggal)} (${esc(j.periode)})</td>
                          <td><span class="ghos-badge info">GL</span></td>
                        </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>
              `
          }
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="ghos-btn" data-open-fin-tab="gl">Closing 3101</button>
            <button type="button" class="ghos-btn" data-open-fin-tab="pajak">PPN &amp; e-Faktur (${fakturList.length || deckKpis.fakturCount || 7})</button>
            <button type="button" class="ghos-btn" data-open-fin-tab="payroll">Payroll 259</button>
            <button type="button" class="ghos-btn" data-open-fin-tab="deposit">Deposit 2101</button>
            <button type="button" class="ghos-btn" data-open-fin-tab="audit">Audit &amp; CopyHub</button>
          </div>
        </div>

        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>13 Konektor Ekosistem (${sumConn.on} ON · ${sumConn.off} OFF di Arena)</h3>
            <button type="button" class="ghos-btn prim" id="ghos-lc-open-conn">⚡ Hub Konektor Full</button>
          </div>
          <div class="ghos-conn-grid" style="max-height:300px;overflow-y:auto;padding-right:2px">
            ${conns
              .map((c) => {
                const isOn = c.arena_status === "on";
                const cnt = resources.filter((r) => r.connector_slug === c.slug).length;
                return `
                  <div class="ghos-conn-card ${isOn ? "" : "is-off"}">
                    <div>
                      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
                        <b style="font-size:12.5px">${esc(c.name)}</b>
                        <span class="ghos-badge ${isOn ? "" : "warn"}">${isOn ? "● ON" : "○ OFF"}</span>
                      </div>
                      <div style="font-size:11px;color:#9fb0d0;margin-top:3px">${esc(c.category)} · ${cnt} item</div>
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                      <button type="button" class="ghos-btn ${isOn ? "prim" : ""}" style="padding:3px 9px;font-size:11px" data-ghos-conn-ping="${esc(c.slug)}">${isOn ? "Ping Sync" : "Uji Standby"}</button>
                      ${c.external_url ? `<a class="ghos-btn" style="padding:3px 9px;font-size:11px" href="${esc(c.external_url)}" target="_blank" rel="noopener noreferrer">Buka ↗</a>` : ""}
                    </div>
                  </div>
                `;
              })
              .join("") || `<div style="color:#9fb0d0">Memuat status 13 konektor…</div>`}
          </div>
        </div>
      </div>
    `;
  }

  function renderModules(st) {
    const ov = st.overview || {};
    const ops = ov.operations || {};
    const ch = st.copyhubOrders || {};
    const chOrdersCount = ch.orders ? ch.orders.length : "Live";
    const chMembersCount = ch.memberships ? ch.memberships.length : "MEMBER30";
    const daoCount = (ov.blockchain && ov.blockchain.daoProposals && ov.blockchain.daoProposals.length) || 2;
    const tasksCount = ops.tasksCount || "Live";
    const seoCount = st.seoLeads && st.seoLeads.length ? st.seoLeads.length : "Sync";
    const docsCount = st.documentsCount != null ? st.documentsCount : "AES-256";

    const mainMods = [
      { id: "mobile", title: "Mobile Portal", badge: "SELULER", desc: "Portal Kantor AI responsif untuk perangkat seluler & PWA.", url: "gas-mobile/Index.html" },
      { id: "copyhub", title: "Copy Hub · 5 Mode", badge: `ORDERS: ${chOrdersCount}`, desc: `Panduan website/domain 5 mode, diskon ${chMembersCount}, konsultasi Calendar & Meet.`, url: "copy-hub.html" },
      { id: "daohybrid", title: "Hybrid DAO (gio910gerai.eth)", badge: `${daoCount} PROPOSAL`, desc: "Voting Snapshot tanpa gas fee + kas Safe Multi-sig + Google Sheets.", url: "dao/hybrid/dao-hybrid-widget.html" },
      { id: "daofull", title: "Full DAO On-Chain", badge: "GOVERNOR", desc: "Kontrak Gio910Token & Gio910Governor + enkripsi AES-256-GCM IPFS.", url: "dao/full/dao-full-console.html" },
      { id: "seo", title: "Widget SEO · IG & Freename", badge: `LEADS: ${seoCount}`, desc: "Embed IG Reel, Freename custom TLD, & form konsultasi sinkron Notion + Gmail.", url: "seo/widget-ig-freename-kontak.html" },
      { id: "ekosistem", title: "Pusat Ekosistem Terpadu", badge: "DIAGNOSA", desc: "Peta seluruh modul, diagnosa live backend Supabase, & Hub Konektor 13 Aplikasi.", url: "ekosistem.html" },
      { id: "wrapper", title: "Wrapper Web3 Penuh", badge: "EMBEDDED", desc: "Wrapper layar penuh Portal Terpadu dengan izin geolocation & kamera.", url: "wrappers/opsi1/index.html" },
      { id: "ledger3101", title: "Buku Besar 3101 & GIO-5..11", badge: "AUDIT SHA-256", desc: "Closing 3101, e-Faktur PPN, Payroll 259, Deposit 2101, Procurement PO & Audit.", actionFin: "gl" },
    ];

    const subPages = [
      { id: "ringkas", title: "Ringkasan", desc: "KPI & berita", url: "pages/ringkas.html" },
      { id: "org", title: "Organisasi", desc: "80 jabatan & 18 AI", url: "pages/org.html" },
      { id: "tugas", title: "Pembagian Tugas", desc: `Matriks Linear (${tasksCount})`, url: "pages/tugas.html" },
      { id: "inv", title: "Struktur Investasi", desc: "Tata kelola & IC", url: "pages/inv.html" },
      { id: "aset", title: "Katalog 160 Aset", desc: "Aset modal sendiri", url: "pages/aset.html" },
      { id: "dokumen", title: "Dokumen & Arsip", desc: `Docs Hub (${docsCount})`, url: "pages/dokumen.html" },
      { id: "alur", title: "Alur Kerja", desc: "SLA & SOP lintas desk", url: "pages/alur.html" },
      { id: "vendor", title: "Pihak Ketiga & Biaya", desc: "Vendor & PO", url: "pages/vendor.html" },
      { id: "unduh", title: "Video & Unduh OS", desc: "YouTube & installer 9 OS", url: "pages/unduh.html" },
    ];

    return `
      <div class="ghos-kpis">
        <div class="ghos-kpi"><small>Modul Utama Ekosistem</small><strong>8 Layanan Terpadu</strong><span>Portal, Mobile, CopyHub, 2x DAO, SEO, Wrapper, 3101</span></div>
        <div class="ghos-kpi"><small>Sub-Halaman Operasional</small><strong>9 Halaman Khusus</strong><span>Ringkas, Org, Tugas, Inv, Aset, Dokumen, Alur, Vendor, Unduh</span></div>
        <div class="ghos-kpi"><small>Copy Hub · DAO · Tugas</small><strong>${esc(chOrdersCount)} · ${daoCount} · ${esc(tasksCount)}</strong><span>Tersinkron ke Postgres &amp; ${esc(ov.integrations?.connectorsOn || 12)} Konektor ON</span></div>
        <div class="ghos-kpi"><small>Arsip Dokumen · SEO Leads</small><strong>${esc(docsCount)} · ${esc(seoCount)}</strong><span>Google Docs, Notion &amp; Gmail Outbox aktif</span></div>
      </div>

      <div class="ghos-card">
        <div class="ghos-card-head">
          <h3>Seluruh Modul Ekosistem GIO910 (Klik "Muat Inline" untuk membuka di dalam Cockpit tanpa pindah halaman)</h3>
        </div>
        <div class="ghos-mod-grid">
          ${mainMods
            .map(
              (m) => `
            <div class="ghos-mod-card">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
                  <b style="color:#7dd3fc;font-size:13px">${esc(m.title)}</b>
                  <span class="ghos-badge info">${esc(m.badge)}</span>
                </div>
                <div style="font-size:11.5px;color:#9fb0d0;margin-top:4px">${esc(m.desc)}</div>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${
                  m.actionFin
                    ? `<button type="button" class="ghos-btn prim" data-open-fin-tab="${esc(m.actionFin)}">Buka Konsol 3101 ↗</button>
                       <button type="button" class="ghos-btn" data-ghos-goto="ledger_conn">Tab 7 Ringkas</button>`
                    : `<button type="button" class="ghos-btn prim" data-mod-inline-url="${esc(m.url)}" data-mod-inline-title="${esc(m.title)}" data-mod-inline-id="${esc(m.id)}">Muat Inline ▾</button>
                       <a class="ghos-btn" href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">Tab Baru ↗</a>`
                }
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <div class="ghos-card">
        <div class="ghos-card-head">
          <h3>9 Sub-Halaman Operasional (<code>pages/*.html</code>)</h3>
        </div>
        <div class="ghos-sub-grid">
          ${subPages
            .map(
              (s) => `
            <div class="ghos-sub-card">
              <div>
                <b style="font-size:12.5px">${esc(s.title)}</b>
                <div style="font-size:11px;color:#9fb0d0">${esc(s.desc)}</div>
              </div>
              <div style="display:flex;gap:5px;flex-wrap:wrap">
                <button type="button" class="ghos-btn prim" style="padding:3px 8px;font-size:11px" data-mod-inline-url="${esc(s.url)}" data-mod-inline-title="${esc(s.title)}" data-mod-inline-id="${esc(s.id)}">Muat Inline</button>
                <a class="ghos-btn" style="padding:3px 8px;font-size:11px" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">↗</a>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      ${
        ui.embedMod
          ? `
            <div class="ghos-iframe-box" id="ghos-mod-iframe-box">
              <div class="ghos-iframe-bar">
                <strong style="font-size:13px;color:#7dd3fc">Pratinjau Inline Cockpit: ${esc(ui.embedMod.title)} (<code>${esc(ui.embedMod.url)}</code>)</strong>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <button type="button" class="ghos-btn" id="ghos-mod-iframe-reload">⟳ Muat Ulang</button>
                  <a class="ghos-btn prim" href="${esc(ui.embedMod.url)}" target="_blank" rel="noopener noreferrer">Buka Layar Penuh ↗</a>
                  <button type="button" class="ghos-btn warn" id="ghos-mod-iframe-close">Tutup ✕</button>
                </div>
              </div>
              <iframe id="ghos-mod-iframe" class="ghos-iframe" src="${esc(ui.embedMod.url)}" title="${esc(ui.embedMod.title)}" allow="geolocation; camera; clipboard-read; clipboard-write"></iframe>
            </div>
          `
          : ""
      }
    `;
  }

  function wireEvents(el) {
    el.querySelector("#ghos-btn-sync-all")?.addEventListener("click", () => {
      OS()?.refresh(true);
    });
    el.querySelector("#ghos-btn-collapse")?.addEventListener("click", () => {
      ui.collapsed = !ui.collapsed;
      render();
    });
    el.querySelector("#ghos-jump-modules")?.addEventListener("click", async () => {
      ui.tab = "modules";
      ui.collapsed = false;
      ui.feedback = null;
      render();
      if (OS() && !OS().getStore().connectorsData) {
        await OS().loadExtendedDatasets();
        render();
      }
    });
    el.querySelectorAll("[data-ghos-tab]").forEach((b) => {
      b.addEventListener("click", async () => {
        ui.tab = b.dataset.ghosTab;
        ui.collapsed = false;
        ui.feedback = null;
        render();
        if (ui.tab !== "overview" && OS() && !OS().getStore().catalog.length) {
          await OS().loadExtendedDatasets();
          render();
        }
      });
    });
    el.querySelector("#ghos-jump-office")?.addEventListener("click", () => {
      document.getElementById("konten-utama")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Overview actions — Absensi Berlapis Anti-Curang (Muka Liveness + Suara/Password + Maps Otomatis)
    const doCheckIn = async (kind) => {
      const note = (el.querySelector("#ghos-att-note")?.value || "").trim();
      if (!window.__KAI_SECURITY__ || !window.__KAI_SECURITY__.openLayeredAttendanceModal) {
        setFeedback(false, "Modul keamanan absensi berlapis belum dimuat. Muat ulang halaman.");
        return;
      }
      try {
        const r = await window.__KAI_SECURITY__.openLayeredAttendanceModal({
          kind,
          defaultNote: note,
          endpoint: "/api/attendance/checkin",
        });
        const noteEl = el.querySelector("#ghos-att-note");
        if (noteEl) noteEl.value = "";
        if (r && (r.absensi || r.record) && window.__KAI_PUSH_ATTENDANCE_ROW__) {
          window.__KAI_PUSH_ATTENDANCE_ROW__(r.absensi || r.record);
        }
        if (OS()) await OS().refresh(true);
        setFeedback(true, (r && r.message) || "Absensi berlapis terverifikasi ke Postgres.");
      } catch (e) {
        if (e && !/dibatalkan/i.test(String(e.message || ""))) {
          setFeedback(false, e.message || String(e));
        }
      }
    };
    el.querySelector("#ghos-att-in")?.addEventListener("click", () => doCheckIn("in"));
    el.querySelector("#ghos-att-out")?.addEventListener("click", () => doCheckIn("out"));

    el.querySelector("#ghos-leave-submit")?.addEventListener("click", async () => {
      const alasan = (el.querySelector("#ghos-leave-reason")?.value || "").trim();
      const jenis = el.querySelector("#ghos-leave-type")?.value || "Dinas Lapangan";
      try {
        await OS().submitLeave({ jenis, alasan });
        setFeedback(true, "Pengajuan izin/cuti dicatat ke Postgres.");
      } catch (e) {
        setFeedback(false, e.message);
      }
    });

    el.querySelectorAll("[data-leave-approve]").forEach((b) => {
      b.addEventListener("click", async () => {
        try {
          await OS().decideLeave({ id: b.dataset.leaveApprove, status: "Disetujui" });
          setFeedback(true, "Pengajuan izin/cuti disetujui & disinkronkan ke Denah.");
        } catch (e) {
          setFeedback(false, e.message);
        }
      });
    });

    // Holding actions
    el.querySelector("#ghos-cat-grp")?.addEventListener("change", (ev) => {
      ui.assetGroup = ev.target.value;
      render();
    });
    el.querySelector("#ghos-cat-q")?.addEventListener("input", (ev) => {
      ui.assetQuery = ev.target.value;
      render();
      const inp = document.getElementById("ghos-cat-q");
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    });
    el.querySelector("#ghos-tx-submit")?.addEventListener("click", async () => {
      const asset_code = (el.querySelector("#ghos-tx-code")?.value || "").trim().toUpperCase();
      const tx_type = el.querySelector("#ghos-tx-type")?.value || "Beli / Tambah Posisi";
      const units = Number(el.querySelector("#ghos-tx-units")?.value || 0);
      const price_idr = Number(el.querySelector("#ghos-tx-price")?.value || 0);
      const post_to_ledger = Boolean(el.querySelector("#ghos-tx-gl")?.checked);
      try {
        const r = await OS().createHoldingTx({ asset_code, tx_type, units, price_idr, post_to_ledger });
        setFeedback(true, r.message);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });

    // Agents actions
    el.querySelector("#ghos-run-all-agents")?.addEventListener("click", async () => {
      try {
        const r = await OS().runAgents("ALL", false);
        setFeedback(true, r.message);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelectorAll("[data-run-agent]").forEach((b) => {
      b.addEventListener("click", async () => {
        try {
          const r = await OS().runAgents(b.dataset.runAgent, false);
          setFeedback(true, `${b.dataset.runAgent}: ${r.runs?.[0]?.summary || "Selesai"}`);
        } catch (e) {
          setFeedback(false, e.message);
        }
      });
    });

    // Web3 & DAO actions
    el.querySelector("#ghos-probe-chains")?.addEventListener("click", async () => {
      try {
        const r = await OS().probeChains();
        setFeedback(true, r.message);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-sync-snapshot")?.addEventListener("click", async () => {
      try {
        const r = await OS().syncSnapshot("gio910gerai.eth");
        setFeedback(true, `Snapshot GraphQL (${r.space}): ${r.remoteFound} proposal eksternal diperiksa (${r.latencyMs}ms).`);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelectorAll("[data-dao-vote]").forEach((b) => {
      b.addEventListener("click", async () => {
        try {
          await OS().voteDao({ proposal_code: b.dataset.daoCode, choice: b.dataset.daoVote });
          setFeedback(true, `Suara '${b.dataset.daoVote}' pada ${b.dataset.daoCode} tercatat ke Postgres.`);
        } catch (e) {
          setFeedback(false, e.message);
        }
      });
    });
    el.querySelectorAll("[data-open-mod-inline]").forEach((b) => {
      b.addEventListener("click", () => {
        const id = b.dataset.openModInline;
        const map = {
          daohybrid: { id: "daohybrid", title: "Hybrid DAO (gio910gerai.eth)", url: "dao/hybrid/dao-hybrid-widget.html" },
          daofull: { id: "daofull", title: "Full DAO On-Chain", url: "dao/full/dao-full-console.html" },
        };
        if (map[id]) {
          ui.embedMod = map[id];
          render();
          setTimeout(() => document.getElementById("ghos-mod-iframe-box")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
        }
      });
    });
    el.querySelector("#ghos-connect-wallet")?.addEventListener("click", async () => {
      if (!window.ethereum) {
        setFeedback(false, "Dompet EVM (MetaMask / Rabby / Brave Wallet) tidak terdeteksi di browser ini.");
        return;
      }
      try {
        const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
        const chHex = await window.ethereum.request({ method: "eth_chainId" });
        ui.walletAddress = accs && accs[0] ? accs[0] : "";
        ui.walletChainId = chHex ? parseInt(chHex, 16) : null;
        setFeedback(true, `Dompet terhubung: ${ui.walletAddress} (Chain ID ${ui.walletChainId}).`);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-sign-eip191")?.addEventListener("click", async () => {
      if (!window.ethereum || !ui.walletAddress) return;
      try {
        const msg = `GIO910 Holding OS v4.0 Verifikasi Wallet\nAddress: ${ui.walletAddress}\nTime: ${new Date().toISOString()}`;
        const sig = await window.ethereum.request({ method: "personal_sign", params: [msg, ui.walletAddress] });
        await OS().verifyWalletAction({
          action_type: "eip191_wallet_verify",
          network_slug: "ethereum",
          signer_address: ui.walletAddress,
          signature_hex: sig,
          details: { chainId: ui.walletChainId, message: msg },
        });
        setFeedback(true, "Tanda tangan EIP-191 terverifikasi & tercatat permanen di Postgres.");
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-bc-cfg-save")?.addEventListener("click", async () => {
      const slug = el.querySelector("#ghos-bc-slug")?.value || "ethereum";
      const safe = (el.querySelector("#ghos-bc-safe")?.value || "").trim();
      const gov = (el.querySelector("#ghos-bc-gov")?.value || "").trim();
      const payload = { slug };
      if (safe) payload.safe_address = safe;
      if (gov) payload.governor_contract = gov;
      try {
        await OS().saveChainConfig(payload);
        setFeedback(true, `Konfigurasi alamat kontrak ${slug} diperbarui di Postgres.`);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });

    // Integrations actions
    el.querySelector("#ghos-sync-market")?.addEventListener("click", async () => {
      try {
        const r = await OS().syncMarket();
        setFeedback(true, r.message);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-wh-in-test")?.addEventListener("click", async () => {
      const prov = el.querySelector("#ghos-wh-in-prov")?.value || "gopay";
      const amount = Number(el.querySelector("#ghos-wh-in-amt")?.value || 0);
      try {
        const r = await OS().testInboundWebhook(prov, {
          event: `${prov}.settlement`,
          amount,
          note: `Callback verifikasi gateway ${prov.toUpperCase()}`,
        });
        setFeedback(true, `Webhook inbound ${prov} tercatat (${r.domainEffect}).`);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-wh-out-send")?.addEventListener("click", async () => {
      const target_url = (el.querySelector("#ghos-wh-out-url")?.value || "").trim();
      try {
        const r = await OS().dispatchWebhook({ target_url, event_name: "holding.ping_v4" });
        setFeedback(true, `Webhook outbound terkirim (HTTP ${r.delivery?.http_status || "—"} · ${r.delivery?.status}).`);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });

    // Ops & Registers actions
    el.querySelector("#ghos-crm-add")?.addEventListener("click", async () => {
      const nama = (el.querySelector("#ghos-crm-name")?.value || "").trim();
      const perusahaan = (el.querySelector("#ghos-crm-org")?.value || "").trim();
      try {
        await OS().createCrm({ nama, perusahaan });
        setFeedback(true, "Kontak CRM disimpan ke Postgres.");
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-fac-add")?.addEventListener("click", async () => {
      const lokasi = (el.querySelector("#ghos-fac-loc")?.value || "").trim();
      const keluhan = (el.querySelector("#ghos-fac-desc")?.value || "").trim();
      try {
        await OS().createFacility({ lokasi, keluhan });
        setFeedback(true, "Tiket fasilitas dikirim ke Postgres.");
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-reg-save")?.addEventListener("click", async () => {
      const item_id = (el.querySelector("#ghos-reg-id")?.value || "").trim();
      const status = (el.querySelector("#ghos-reg-st")?.value || "Terverifikasi").trim();
      if (!item_id) { setFeedback(false, "Isi Kode Item Register terlebih dahulu."); return; }
      try {
        await OS().saveRegister({ item_id, register_type: "register", status, data: { updated_via: "holding_os_v4" } });
        setFeedback(true, `Register ${item_id} (${status}) tersimpan di Postgres.`);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });

    // Tab 7: Ledger 3101 & 13 Connectors
    el.querySelector("#ghos-lc-open-fin")?.addEventListener("click", () => {
      if (window.__KAI_OPEN_LIVE_FINANCE__) window.__KAI_OPEN_LIVE_FINANCE__("gl");
      else document.getElementById("kai-fin-fab")?.click();
    });
    el.querySelector("#ghos-lc-open-conn")?.addEventListener("click", () => {
      if (window.__KAI_OPEN_CONNECTORS_HUB__) window.__KAI_OPEN_CONNECTORS_HUB__("connectors");
    });
    el.querySelectorAll("[data-open-fin-tab]").forEach((b) => {
      b.addEventListener("click", () => {
        if (window.__KAI_OPEN_LIVE_FINANCE__) window.__KAI_OPEN_LIVE_FINANCE__(b.dataset.openFinTab);
      });
    });
    el.querySelector("#ghos-lc-sync-sheets")?.addEventListener("click", async () => {
      try {
        const r = await OS().connectorAction({ connector: "google_sheets", action: "sync_ledger", payload: { module: "gl" } });
        setFeedback(true, r.message || "Neraca Saldo 3101 tersinkron ke Google Sheets.");
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-jp-post")?.addEventListener("click", async () => {
      const ref = (el.querySelector("#ghos-jp-ref")?.value || "").trim();
      const keterangan = (el.querySelector("#ghos-jp-ket")?.value || "").trim();
      const dr = (el.querySelector("#ghos-jp-dr")?.value || "1101").trim();
      const cr = (el.querySelector("#ghos-jp-cr")?.value || "4101").trim();
      const amt = Number(el.querySelector("#ghos-jp-amt")?.value || 0);
      try {
        const r = await OS().postJournal({
          ref,
          keterangan,
          periode: "2026-11",
          lines: [
            { kode: dr, debit: amt, kredit: 0 },
            { kode: cr, debit: 0, kredit: amt },
          ],
        });
        setFeedback(true, `Jurnal ${ref} berhasil diposting via public.post() (ID #${r.journal_id}).`);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelectorAll("[data-ghos-po-app]").forEach((b) => {
      b.addEventListener("click", async () => {
        try {
          await OS().approvePo(b.dataset.ghosPoApp);
          setFeedback(true, "PO vendor disetujui & disinkronkan ke Postgres.");
        } catch (e) {
          setFeedback(false, e.message);
        }
      });
    });
    el.querySelectorAll("[data-ghos-conn-ping]").forEach((b) => {
      b.addEventListener("click", async () => {
        const slug = b.dataset.ghosConnPing;
        try {
          const r = await OS().connectorAction({ connector: slug, action: "sync_ping" });
          setFeedback(!r.paused, r.message || `Konektor ${slug} disinkronkan.`);
        } catch (e) {
          setFeedback(false, e.message);
        }
      });
    });

    // Tab 8: Modules & Inline Iframe Workspace
    el.querySelectorAll("[data-mod-inline-url]").forEach((b) => {
      b.addEventListener("click", () => {
        ui.embedMod = {
          id: b.dataset.modInlineId,
          title: b.dataset.modInlineTitle,
          url: b.dataset.modInlineUrl,
        };
        render();
        setTimeout(() => document.getElementById("ghos-mod-iframe-box")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      });
    });
    el.querySelectorAll("[data-ghos-goto]").forEach((b) => {
      b.addEventListener("click", () => {
        ui.tab = b.dataset.ghosGoto;
        render();
      });
    });
    el.querySelectorAll("[data-ghos-subtab]").forEach((b) => {
      b.addEventListener("click", async () => {
        const group = b.dataset.ghosSubgroup;
        ui[group] = b.dataset.ghosSubtab;
        ui.embedMod = null;
        ui.feedback = null;
        render();
        if (OS() && !OS().getStore().catalog.length) {
          await OS().loadExtendedDatasets();
          render();
        }
      });
    });
    el.querySelectorAll("[data-portal-nav]").forEach((b) => {
      b.addEventListener("click", () => {
        const pg = b.dataset.portalNav;
        const sub = b.dataset.portalSub;
        const grp = b.dataset.portalSubgroup;
        if (grp && sub) ui[grp] = sub;
        if (typeof window.__kaiNavigateTo === "function") {
          window.__kaiNavigateTo(pg);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
    el.querySelector("#ghos-open-diag")?.addEventListener("click", () => {
      if (window.__KAI_OPEN_DIAG_MODAL__) window.__KAI_OPEN_DIAG_MODAL__();
    });
    el.querySelector("#ghos-open-payroll")?.addEventListener("click", () => {
      if (window.__KAI_OPEN_LIVE_FINANCE__) window.__KAI_OPEN_LIVE_FINANCE__("payroll");
    });
    el.querySelector("#ghos-fp-add")?.addEventListener("click", async () => {
      const lawan_transaksi = (el.querySelector("#ghos-fp-lawan")?.value || "").trim();
      const jenis = el.querySelector("#ghos-fp-jenis")?.value || "Keluaran";
      const dasar_pengenaan = Number(el.querySelector("#ghos-fp-dpp")?.value || 0);
      try {
        await OS().createFaktur({ lawan_transaksi, jenis, dasar_pengenaan });
        setFeedback(true, "e-Faktur PPN berhasil diterbitkan di Postgres.");
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-rec-run")?.addEventListener("click", async () => {
      const saldo_bank = Number(el.querySelector("#ghos-rec-bank")?.value || 0);
      try {
        const r = await OS().runBankRecon({ saldo_bank, periode: "2026-11" });
        setFeedback(true, `Rekonsiliasi bank selesai (${r.reconciliation?.recon_code || "OK"}: ${r.reconciliation?.status || "Cocok"}).`);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-gl-slides")?.addEventListener("click", async () => {
      try {
        const r = await OS().connectorAction({ connector: "google_slides", action: "sync_deck", payload: {} });
        setFeedback(true, r.message || "KPI 3101 tersinkron ke Google Slides.");
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-gl-docs")?.addEventListener("click", async () => {
      try {
        const r = await OS().connectorAction({
          connector: "google_docs",
          action: "create_memo",
          payload: { title: "Memo Closing 3101 — " + new Date().toISOString().slice(0, 10), content: "Laporan Buku Besar 3101 terpadu dari Struktur Investasi GIO910." },
        });
        setFeedback(true, r.message || "Memo Closing 3101 dibuat di Google Docs.");
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-aud-drive")?.addEventListener("click", async () => {
      try {
        const r = await OS().api("POST", "/api/workspace", { op: "backup.toDrive", payload: {} });
        setFeedback(true, `Snapshot Postgres tersimpan (${r.data?.name || "Google Drive"}).`);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-pay-approve")?.addEventListener("click", async () => {
      try {
        const r = await OS().approvePayroll({ periode: "2026-11" });
        setFeedback(true, `Payroll 259 periode 2026-11 diperbarui -> ${r.status} (${r.count} personel).`);
      } catch (e) {
        setFeedback(false, e.message);
      }
    });
    el.querySelector("#ghos-mod-iframe-close")?.addEventListener("click", () => {
      ui.embedMod = null;
      render();
    });
    el.querySelector("#ghos-mod-iframe-reload")?.addEventListener("click", () => {
      const fr = document.getElementById("ghos-mod-iframe");
      if (fr) fr.src = fr.src;
    });
  }

  function renderSubTabs(group, activeVal, items) {
    return `
      <div class="ghos-tabs" role="tablist">
        ${items
          .map(
            (t) =>
              `<button type="button" role="tab" aria-selected="${activeVal === t.id}" class="ghos-tab ${activeVal === t.id ? "is-active" : ""}" data-ghos-subgroup="${esc(group)}" data-ghos-subtab="${esc(t.id)}">${esc(t.label)}</button>`
          )
          .join("")}
      </div>
    `;
  }

  function renderInlineEmbedBox() {
    if (!ui.embedMod) return "";
    return `
      <div class="ghos-iframe-box" id="ghos-mod-iframe-box" style="margin-top:12px">
        <div class="ghos-iframe-bar">
          <strong style="font-size:13px;color:#7dd3fc">${esc(ui.embedMod.title)} (<code>${esc(ui.embedMod.url)}</code>)</strong>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="ghos-btn" id="ghos-mod-iframe-reload">⟳ Muat Ulang</button>
            <a class="ghos-btn prim" href="${esc(ui.embedMod.url)}" target="_blank" rel="noopener noreferrer">Buka Layar Penuh ↗</a>
            <button type="button" class="ghos-btn warn" id="ghos-mod-iframe-close">Tutup ✕</button>
          </div>
        </div>
        <iframe id="ghos-mod-iframe" class="ghos-iframe" src="${esc(ui.embedMod.url)}" title="${esc(ui.embedMod.title)}" allow="geolocation; camera; clipboard-read; clipboard-write"></iframe>
      </div>
    `;
  }

  function renderInvGlInline(st) {
    const ov = st.overview || {};
    const acc = (ov.holding && ov.holding.accounting3101) || {};
    const finSum = st.financeSummary;
    const t = (finSum && finSum.totals) || {};
    const coa = (finSum && finSum.coa) || [];
    const journals = st.financeJournals || [];
    const tok = OS() ? OS().getActiveToken() : "";

    const pendapatan = t.pendapatanOperasional != null ? t.pendapatanOperasional : (acc.pendapatan || 0);
    const beban = t.bebanOperasional != null ? t.bebanOperasional : (acc.beban || 0);
    const ekuitas3101 = t.ekuitas3101 != null ? t.ekuitas3101 : (acc.surplus || 0);
    const kas1101 = t.kas1101 != null ? t.kas1101 : (acc.kas1101 || 0);
    const piutang1201 = t.piutang1201 != null ? t.piutang1201 : 0;
    const balanced = t.totalDebit != null ? t.totalDebit === t.totalKredit : true;

    return `
      <div class="ghos-kpis">
        <div class="ghos-kpi"><small>Pendapatan 2026-11 (4101..4104)</small><strong>${rp(pendapatan)}</strong><span>OPEX (5101..5107): ${rp(beban)}</span></div>
        <div class="ghos-kpi"><small>Surplus → Ekuitas 3101</small><strong style="color:#34d399">${rp(ekuitas3101)}</strong><span>${t.hasClosing3101 !== false ? "✓ Closing 3101 Terposting" : "Belum Closing"}</span></div>
        <div class="ghos-kpi"><small>Kas COA 1101 · Piutang 1201</small><strong>${rp(kas1101)}</strong><span>Piutang 1201: ${rp(piutang1201)}</span></div>
        <div class="ghos-kpi"><small>Neraca Saldo Debit = Kredit</small><strong>${balanced ? "SEIMBANG 100%" : "SELISIH"}</strong><span>${t.totalDebit ? rp(t.totalDebit) : "Periode: " + ((finSum && finSum.closedPeriods || ["2026-11"]).join(", "))}</span></div>
      </div>

      <div class="ghos-card">
        <div class="ghos-card-head">
          <h3>Buku Besar 3101, Neraca Saldo COA &amp; Posting Jurnal GL</h3>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="ghos-btn prim" id="ghos-lc-sync-sheets" ${!tok ? "disabled" : ""}>📊 Sync Neraca → Sheets</button>
            <button type="button" class="ghos-btn" id="ghos-gl-slides" ${!tok ? "disabled" : ""}>📽️ Sync KPI → Slides</button>
            <button type="button" class="ghos-btn" id="ghos-gl-docs" ${!tok ? "disabled" : ""}>📝 Memo Closing Docs</button>
          </div>
        </div>
        ${
          !tok
            ? `<div class="ghos-collapse-note" style="color:#fbbf24">Ringkasan Buku Besar 3101 tampil secara publik. Masuk akun di Portal untuk melihat Neraca Saldo COA penuh dan memposting jurnal GL via <code>public.post()</code>.</div>`
            : `
              <div class="ghos-form-row">
                <input id="ghos-jp-ref" class="ghos-inp" style="width:120px" placeholder="Ref (ADJ-11)" />
                <input id="ghos-jp-ket" class="ghos-inp" style="flex:1;min-width:160px" placeholder="Keterangan jurnal GL…" />
                <input id="ghos-jp-dr" class="ghos-inp" style="width:76px" value="1101" placeholder="Dr" />
                <input id="ghos-jp-cr" class="ghos-inp" style="width:76px" value="4101" placeholder="Cr" />
                <input id="ghos-jp-amt" class="ghos-inp" type="number" style="width:125px" placeholder="Nominal (Rp)" />
                <button type="button" class="ghos-btn prim" id="ghos-jp-post">+ Posting GL</button>
              </div>
              <div class="ghos-grid-2">
                <div class="ghos-tbl-wrap" style="max-height:270px">
                  <table class="ghos-tbl">
                    <thead><tr><th>Kode</th><th>Nama Akun COA</th><th>Debit</th><th>Kredit</th><th>Saldo</th></tr></thead>
                    <tbody>
                      ${coa.filter((c) => c.debit || c.kredit).map((c) => `<tr><td><code>${esc(c.kode)}</code></td><td>${esc(c.nama)}</td><td>${rp(c.debit)}</td><td>${rp(c.kredit)}</td><td><b>${rp(c.saldo)}</b></td></tr>`).join("") || `<tr><td colspan="5" style="color:#9fb0d0">Memuat Neraca Saldo COA…</td></tr>`}
                    </tbody>
                  </table>
                </div>
                <div class="ghos-tbl-wrap" style="max-height:270px">
                  <table class="ghos-tbl">
                    <thead><tr><th>Tanggal</th><th>Ref</th><th>Periode</th><th>Keterangan Jurnal GL</th></tr></thead>
                    <tbody>
                      ${journals.slice(0, 20).map((j) => `<tr><td>${esc(j.tanggal)}</td><td><code>${esc(j.ref)}</code></td><td>${esc(j.periode)}</td><td>${esc(j.keterangan)}</td></tr>`).join("") || `<tr><td colspan="4" style="color:#9fb0d0">Memuat Jurnal Umum…</td></tr>`}
                    </tbody>
                  </table>
                </div>
              </div>
            `
        }
      </div>
    `;
  }

  function renderInvPajakDepositInline(st) {
    const finSum = st.financeSummary || {};
    const pajak = finSum.pajak || {};
    const fakturList = st.pajak || [];
    const dep = st.deposits || {};
    const recons = dep.reconciliations || [];
    const deposits = dep.deposits || [];
    const tok = OS() ? OS().getActiveToken() : "";

    return `
      <div class="ghos-kpis">
        <div class="ghos-kpi"><small>DPP PPN Keluaran</small><strong>${rp(pajak.dppKeluaran || 0)}</strong></div>
        <div class="ghos-kpi"><small>PPN Keluaran (11%)</small><strong>${rp(pajak.ppnKeluaran || 0)}</strong></div>
        <div class="ghos-kpi"><small>PPN Masukan Dikreditkan</small><strong>${rp(pajak.ppnMasukan || 0)}</strong></div>
        <div class="ghos-kpi"><small>Kurang Bayar SPT Masa PPN</small><strong style="color:#fbbf24">${rp(pajak.ppnKurangBayar || 0)}</strong></div>
      </div>

      <div class="ghos-grid-2">
        <div class="ghos-card">
          <div class="ghos-card-head"><h3>e-Faktur PPN 11% (${fakturList.length})</h3></div>
          ${
            !tok
              ? `<div class="ghos-collapse-note" style="color:#fbbf24">Masuk akun di Portal untuk menerbitkan atau mengekspor e-Faktur PPN.</div>`
              : `
                <div class="ghos-form-row">
                  <input id="ghos-fp-lawan" class="ghos-inp" style="flex:1;min-width:150px" placeholder="Lawan Transaksi / Tenant…" />
                  <select id="ghos-fp-jenis" class="ghos-sel"><option value="Keluaran">Keluaran</option><option value="Masukan">Masukan</option></select>
                  <input id="ghos-fp-dpp" class="ghos-inp" type="number" style="width:120px" placeholder="DPP (Rp)" />
                  <button type="button" class="ghos-btn prim" id="ghos-fp-add">+ Terbitkan</button>
                </div>
                <div class="ghos-tbl-wrap" style="max-height:240px">
                  <table class="ghos-tbl">
                    <thead><tr><th>No. Faktur</th><th>Jenis</th><th>Lawan</th><th>PPN 11%</th><th>Status</th></tr></thead>
                    <tbody>
                      ${fakturList.map((f) => `<tr><td><code>${esc(f.nomor_faktur)}</code></td><td>${esc(f.jenis)}</td><td>${esc(f.lawan_transaksi)}</td><td>${rp(f.ppn_nilai)}</td><td><span class="ghos-badge">${esc(f.status)}</span></td></tr>`).join("") || `<tr><td colspan="5" style="color:#9fb0d0">Belum ada e-Faktur.</td></tr>`}
                    </tbody>
                  </table>
                </div>
              `
          }
        </div>

        <div class="ghos-card">
          <div class="ghos-card-head"><h3>Deposit Tenant (COA 2101) &amp; Rekonsiliasi Bank</h3></div>
          ${
            !tok
              ? `<div class="ghos-collapse-note" style="color:#fbbf24">Masuk akun di Portal untuk menjalankan rekonsiliasi bank &amp; melihat deposit 2101.</div>`
              : `
                <div class="ghos-form-row">
                  <input id="ghos-rec-bank" class="ghos-inp" type="number" value="664204700" style="width:170px" placeholder="Saldo Rekening Bank" />
                  <button type="button" class="ghos-btn prim" id="ghos-rec-run">Jalankan Rekonsiliasi Bank</button>
                </div>
                <div class="ghos-tbl-wrap" style="max-height:240px">
                  <table class="ghos-tbl">
                    <thead><tr><th>Kode</th><th>Rekening / Tenant</th><th>Saldo / Nominal</th><th>Status</th></tr></thead>
                    <tbody>
                      ${recons.map((r) => `<tr><td><code>${esc(r.recon_code)}</code></td><td>${esc(r.rekening)} (Buku ${rp(r.saldo_buku)})</td><td>${rp(r.saldo_bank)}</td><td><span class="ghos-badge">${esc(r.status)}</span></td></tr>`).join("")}
                      ${deposits.map((d) => `<tr><td><code>${esc(d.deposit_code)}</code></td><td>${esc(d.tenant_name)} (${esc(d.unit)})</td><td><b>${rp(d.amount)}</b></td><td><span class="ghos-badge info">${esc(d.status)}</span></td></tr>`).join("")}
                    </tbody>
                  </table>
                </div>
              `
          }
        </div>
      </div>
    `;
  }

  function renderInvAuditInline(st) {
    const aud = st.auditVerify || {};
    const ch = st.copyhubOrders || {};
    const tok = OS() ? OS().getActiveToken() : "";
    return `
      <div class="ghos-kpis">
        <div class="ghos-kpi"><small>Integritas Rantai Audit SHA-256</small><strong style="color:${aud.ok !== false ? "#34d399" : "#fbbf24"}">${aud.rows ? (aud.ok ? "UTUH 100%" : "PERIKSA") : "AKTIF"}</strong><span>${aud.rows || 0} entri · putus: ${aud.broken ?? 0}</span></div>
        <div class="ghos-kpi"><small>Order Copy Hub (MEMBER30)</small><strong>${(ch.orders || []).length} Order</strong><span>Member aktif: ${(ch.memberships || []).length}</span></div>
        <div class="ghos-kpi"><small>Cadangan Terjadwal</small><strong>Supabase + Drive</strong><span>Snapshot real-time siap unduh</span></div>
      </div>
      <div class="ghos-card">
        <div class="ghos-card-head">
          <h3>Kontrol Audit SHA-256 &amp; Konsol Finansial Lengkap</h3>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="ghos-btn prim" id="ghos-aud-drive" ${!tok ? "disabled" : ""}>☁️ Backup Snapshot → Google Drive</button>
            <button type="button" class="ghos-btn" id="ghos-lc-open-fin">📊 Buka Analis AI &amp; RBAC Detail</button>
          </div>
        </div>
        <div style="font-size:12px;color:#9fb0d0">Seluruh posting Buku Besar 3101, perubahan posisi 160 aset, absensi geofence, dan persetujuan PO (&gt;Rp100 jt 4-Eyes Control) tercatat berantai dengan hash SHA-256 pada <code>public.audit_logs</code>.</div>
      </div>
    `;
  }

  function renderVendorAndConnectors(st) {
    const ov = st.overview || {};
    const connData = st.connectorsData || {};
    const conns = connData.connectors || (ov.integrations && ov.integrations.connectors) || [];
    const resources = connData.resources || [];
    const sumConn = connData.summary || { on: ov.integrations?.connectorsOn || 12, off: ov.integrations?.connectorsOff ?? 1, total: conns.length || 13 };
    const poList = st.procurement || [];
    const tok = OS() ? OS().getActiveToken() : "";

    return `
      <div class="ghos-grid-2">
        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>Procurement PO Vendor &amp; Persetujuan 4-Eyes (&gt;Rp100 jt)</h3>
            <span class="ghos-badge">${poList.length} PO</span>
          </div>
          ${
            !tok
              ? `<div class="ghos-collapse-note" style="color:#fbbf24">Masuk akun di Portal untuk melihat &amp; menyetujui PO Vendor (&gt;Rp100 jt 4-Eyes Control).</div>`
              : `<div class="ghos-tbl-wrap" style="max-height:280px"><table class="ghos-tbl"><thead><tr><th>No. PO</th><th>Vendor &amp; Kategori</th><th>Nilai</th><th>Status</th></tr></thead><tbody>
                  ${poList.map((po) => `<tr><td><code>${esc(po.po_number)}</code></td><td><b>${esc(po.vendor)}</b><br><small style="color:#9fb0d0">${esc(po.kategori)}</small></td><td>${rp(po.nilai)}</td><td>${po.status === "Diajukan" ? `<button type="button" class="ghos-btn ok" style="padding:2px 8px;font-size:11px" data-ghos-po-app="${esc(po.id)}">Setujui PO</button>` : `<span class="ghos-badge">${esc(po.status)}</span>`}</td></tr>`).join("") || `<tr><td colspan="4" style="color:#9fb0d0">Belum ada PO vendor.</td></tr>`}
                </tbody></table></div>`
          }
        </div>
        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>13 Konektor Ekosistem (${sumConn.on} ON · ${sumConn.off} OFF di Arena)</h3>
            <button type="button" class="ghos-btn prim" id="ghos-lc-open-conn">⚡ Hub Konektor Full</button>
          </div>
          <div class="ghos-conn-grid" style="max-height:280px;overflow-y:auto;padding-right:2px">
            ${conns
              .map((c) => {
                const isOn = c.arena_status === "on";
                const cnt = resources.filter((r) => r.connector_slug === c.slug).length;
                return `
                  <div class="ghos-conn-card ${isOn ? "" : "is-off"}">
                    <div>
                      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
                        <b style="font-size:12.5px">${esc(c.name)}</b>
                        <span class="ghos-badge ${isOn ? "" : "warn"}">${isOn ? "● ON" : "○ OFF"}</span>
                      </div>
                      <div style="font-size:11px;color:#9fb0d0;margin-top:3px">${esc(c.category)} · ${cnt} item</div>
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                      <button type="button" class="ghos-btn ${isOn ? "prim" : ""}" style="padding:3px 9px;font-size:11px" data-ghos-conn-ping="${esc(c.slug)}">${isOn ? "Ping Sync" : "Uji Standby"}</button>
                      ${c.external_url ? `<a class="ghos-btn" style="padding:3px 9px;font-size:11px" href="${esc(c.external_url)}" target="_blank" rel="noopener noreferrer">Buka ↗</a>` : ""}
                    </div>
                  </div>
                `;
              })
              .join("") || `<div style="color:#9fb0d0">Memuat status 13 konektor…</div>`}
          </div>
        </div>
      </div>
    `;
  }

  function renderKantorSummary(st) {
    const ov = st.overview || {};
    const rtEvents = ov.realtimeEvents || [];
    const sdm = ov.sdm || {};
    return `
      <div class="ghos-card">
        <div class="ghos-card-head">
          <h3>Status Realtime Holding OS · Kehadiran &amp; Peristiwa CDC (${st.subscribedTables || 36} Tabel)</h3>
          <span class="ghos-badge info">${sdm.presentToday != null ? sdm.presentToday : 0} / ${sdm.totalPersonnel || 259} SDM Hadir · ${rtEvents.length} Event</span>
        </div>
        <div style="font-size:11.5px;color:#9fb0d0;margin-bottom:8px">
          Hanya SDM yang sudah absen masuk hari ini yang tampil &amp; aktif pada denah 4 lantai (42 ruang, 277 meja). Seluruh menu operasional, Buku Besar 3101, Katalog 160 Aset, AI &amp; Konektor menyatu langsung pada menu navigasi portal di atas.
        </div>
        <div class="ghos-feed-list" style="max-height:140px">
          ${rtEvents.slice(0, 6).map((ev) => `
            <div class="ghos-feed-item">
              <div><span class="ghos-badge ${ev.severity === "warning" ? "warn" : "info"}">${esc(ev.channel)}</span> <b style="margin-left:5px">${esc(ev.title)}</b>${ev.summary ? ` <span style="color:#9fb0d0">— ${esc(ev.summary)}</span>` : ""}</div>
              <div style="color:#7dd3fc;font-size:10.5px;white-space:nowrap">${esc(String(ev.created_at || "").slice(11, 19))}</div>
            </div>
          `).join("") || `<div style="color:#9fb0d0;font-size:12px">Terhubung ke Postgres Realtime WebSocket.</div>`}
        </div>
      </div>
    `;
  }

  function renderByNav(nav, st) {
    if (nav === "kantor") {
      return { tabsHtml: "", bodyHtml: ui.collapsed ? "" : renderKantorSummary(st) };
    }
    if (nav === "ringkas") {
      return { tabsHtml: "", bodyHtml: ui.collapsed ? "" : renderOverview(st) };
    }
    if (nav === "org") {
      const ov = st.overview || {};
      const pr = st.payroll || {};
      const tot = pr.totals || {};
      const rows = pr.rows || [];
      const hc = tot.headcount || (ov.sdm ? ov.sdm.totalPersonnel : 259);
      const tok = OS() ? OS().getActiveToken() : "";
      const ovHtml = renderOverview(st);
      const payrollInline = `
        <div class="ghos-card" style="margin-top:12px">
          <div class="ghos-card-head">
            <h3>Penggajian SDM Terpadu (${hc} Personel · Akun 5101)</h3>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${tok ? `<button type="button" class="ghos-btn prim" id="ghos-pay-approve">✓ Finalisasi Payroll 2026-11</button>` : ""}
              <button type="button" class="ghos-btn" id="ghos-open-payroll">📊 Konsol Payroll Lengkap</button>
            </div>
          </div>
          ${
            rows.length
              ? `<div class="ghos-tbl-wrap" style="max-height:220px"><table class="ghos-tbl"><thead><tr><th>Kode</th><th>Nama</th><th>Entitas</th><th>Take-Home Pay</th><th>Status</th></tr></thead><tbody>
                  ${rows.slice(0, 25).map((r) => `<tr><td><code>${esc(r.user_code)}</code></td><td>${esc(r.nama)}</td><td>${esc(r.entitas)}</td><td><b>${rp(r.take_home_pay)}</b></td><td><span class="ghos-badge">${esc(r.status)}</span></td></tr>`).join("")}
                </tbody></table></div>`
              : `<div style="font-size:12px;color:#9fb0d0">Rekonsiliasi gaji pokok, BPJS, &amp; PPh 21 dari Postgres <code>public.hr_payroll</code> (${hc} personel: 156 FTE, 12 Freelancer, 2 Eksternal, 89 Ops Gedung). Masuk akun untuk rincian per personel.</div>`
          }
        </div>
      `;
      return { tabsHtml: "", bodyHtml: ui.collapsed ? "" : (ovHtml + payrollInline) };
    }
    if (nav === "tugas") {
      const ov = st.overview || {};
      const ops = ov.operations || {};
      const crm = st.crm.length ? st.crm : (ops.crmContacts || []);
      const fac = st.facility.length ? st.facility : (ops.facilityTickets || []);
      const tok = OS() ? OS().getActiveToken() : "";
      const body = `
        <div class="ghos-grid-2">
          <div class="ghos-card">
            <div class="ghos-card-head"><h3>CRM Mitra &amp; Investor (${crm.length})</h3></div>
            <div class="ghos-form-row">
              <input id="ghos-crm-name" class="ghos-inp" style="flex:1" placeholder="Nama PIC…" />
              <input id="ghos-crm-org" class="ghos-inp" style="flex:1" placeholder="Perusahaan…" />
              <button type="button" class="ghos-btn prim" id="ghos-crm-add" ${!tok ? "disabled" : ""}>+ Simpan CRM</button>
            </div>
            <div class="ghos-tbl-wrap" style="max-height:220px"><table class="ghos-tbl"><thead><tr><th>Perusahaan</th><th>Kategori</th><th>Entitas</th><th>Status</th></tr></thead><tbody>
              ${crm.map((c) => `<tr><td><b>${esc(c.perusahaan)}</b>${c.nama ? `<br><small style="color:#9fb0d0">${esc(c.nama)}</small>` : ""}</td><td>${esc(c.kategori)}</td><td>${esc(c.entitas)}</td><td><span class="ghos-badge">${esc(c.status)}</span></td></tr>`).join("")}
            </tbody></table></div>
          </div>
          <div class="ghos-card">
            <div class="ghos-card-head"><h3>Tiket Fasilitas Kantor (${fac.length})</h3></div>
            <div class="ghos-form-row">
              <input id="ghos-fac-loc" class="ghos-inp" style="width:135px" placeholder="Lokasi" />
              <input id="ghos-fac-desc" class="ghos-inp" style="flex:1" placeholder="Keluhan / pemeliharaan…" />
              <button type="button" class="ghos-btn prim" id="ghos-fac-add" ${!tok ? "disabled" : ""}>+ Buat Tiket</button>
            </div>
            <div class="ghos-tbl-wrap" style="max-height:220px"><table class="ghos-tbl"><thead><tr><th>Lokasi</th><th>Keluhan</th><th>Prioritas</th><th>Status</th></tr></thead><tbody>
              ${fac.map((t) => `<tr><td><b>${esc(t.lokasi)}</b></td><td>${esc(t.keluhan)}</td><td><span class="ghos-badge ${t.prioritas === "Tinggi" ? "warn" : ""}">${esc(t.prioritas)}</span></td><td><span class="ghos-badge info">${esc(t.status)}</span></td></tr>`).join("")}
            </tbody></table></div>
          </div>
        </div>
      `;
      return { tabsHtml: "", bodyHtml: ui.collapsed ? "" : body };
    }
    if (nav === "inv") {
      const tabsHtml = renderSubTabs("invTab", ui.invTab, [
        { id: "gl", label: "1 · Buku Besar 3101 & Jurnal GL" },
        { id: "pajak_dep", label: "2 · e-Faktur PPN, Deposit 2101 & Rekon Bank" },
        { id: "web3", label: "3 · Web3 16-Chain & Konsol DAO" },
        { id: "audit", label: "4 · Jejak Audit SHA-256 & RBAC" },
      ]);
      if (ui.collapsed) return { tabsHtml, bodyHtml: "" };
      if (ui.invTab === "pajak_dep") return { tabsHtml, bodyHtml: renderInvPajakDepositInline(st) };
      if (ui.invTab === "web3") return { tabsHtml, bodyHtml: renderWeb3(st) + renderInlineEmbedBox() };
      if (ui.invTab === "audit") return { tabsHtml, bodyHtml: renderInvAuditInline(st) };
      return { tabsHtml, bodyHtml: renderInvGlInline(st) };
    }
    if (nav === "aset") {
      const tabsHtml = renderSubTabs("asetTab", ui.asetTab, [
        { id: "portfolio", label: "1 · Portofolio Modal Sendiri & Katalog 160 Aset Live" },
        { id: "copyhub", label: "2 · Aset Digital, Copy Hub 5 Mode & Wrapper Web3" },
      ]);
      if (ui.collapsed) return { tabsHtml, bodyHtml: "" };
      if (ui.asetTab === "copyhub") {
        const ch = st.copyhubOrders || {};
        const chOrders = ch.orders || [];
        const body = `
          <div class="ghos-card">
            <div class="ghos-card-head">
              <h3>Copy Hub · 5 Mode Domain &amp; Membership (<code>MEMBER30</code>)</h3>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <button type="button" class="ghos-btn prim" data-mod-inline-url="copy-hub.html" data-mod-inline-title="Copy Hub · 5 Mode" data-mod-inline-id="copyhub">Buka Copy Hub Inline ▾</button>
                <a class="ghos-btn" href="wrappers/opsi1/index.html" target="_blank" rel="noopener noreferrer">Wrapper Web3 ↗</a>
                <a class="ghos-btn" href="copy-hub.html" target="_blank" rel="noopener noreferrer">Tab Baru ↗</a>
              </div>
            </div>
            <div class="ghos-tbl-wrap" style="max-height:200px">
              <table class="ghos-tbl"><thead><tr><th>Kode Order</th><th>Paket</th><th>Final</th><th>Status</th></tr></thead><tbody>
                ${chOrders.slice(0, 12).map((o) => `<tr><td><code>${esc(o.order_code)}</code></td><td>${esc(o.pkg_title)}</td><td><b>${rp(o.price_final)}</b></td><td><span class="ghos-badge">${esc(o.status)}</span></td></tr>`).join("") || `<tr><td colspan="4" style="color:#9fb0d0">Klik "Buka Copy Hub Inline" atau masuk akun untuk riwayat order lengkap.</td></tr>`}
              </tbody></table>
            </div>
          </div>
          ${renderInlineEmbedBox()}
        `;
        return { tabsHtml, bodyHtml: body };
      }
      return { tabsHtml, bodyHtml: renderHolding(st) };
    }
    if (nav === "dokumen") {
      const ov = st.overview || {};
      const ops = ov.operations || {};
      const regs = st.registers.length ? st.registers : (ops.complianceRegisters || []);
      const tok = OS() ? OS().getActiveToken() : "";
      const body = `
        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>Register Kepatuhan &amp; Sinkronisasi Arsip (${regs.length})</h3>
            <div class="ghos-form-row" style="margin:0">
              <input id="ghos-reg-id" class="ghos-inp" style="width:140px" placeholder="Kode Item (REG-...)" />
              <input id="ghos-reg-st" class="ghos-inp" style="width:140px" value="Terverifikasi" placeholder="Status" />
              <button type="button" class="ghos-btn prim" id="ghos-reg-save" ${!tok ? "disabled" : ""}>Simpan Register</button>
            </div>
          </div>
          <div class="ghos-tbl-wrap" style="max-height:220px"><table class="ghos-tbl"><thead><tr><th>Kode Item</th><th>Tipe</th><th>Status</th><th>Diperbarui</th></tr></thead><tbody>
            ${regs.slice(0, 40).map((r) => `<tr><td><b>${esc(r.item_id)}</b></td><td><span class="ghos-badge info">${esc(r.register_type || "register")}</span></td><td><span class="ghos-badge">${esc(r.status)}</span></td><td style="color:#9fb0d0">${esc(String(r.updated_at || "").slice(0, 19).replace("T", " "))}</td></tr>`).join("") || `<tr><td colspan="4" style="color:#9fb0d0">Belum ada register kepatuhan tercatat.</td></tr>`}
          </tbody></table></div>
        </div>
      `;
      return { tabsHtml: "", bodyHtml: ui.collapsed ? "" : body };
    }
    if (nav === "alur") {
      const tabsHtml = renderSubTabs("alurTab", ui.alurTab, [
        { id: "agents", label: "1 · Orkestrasi 18 Agent AI Live Postgres" },
        { id: "gateways", label: "2 · 20 Gateway Eksternal & Webhook HMAC-SHA256" },
      ]);
      if (ui.collapsed) return { tabsHtml, bodyHtml: "" };
      return { tabsHtml, bodyHtml: ui.alurTab === "gateways" ? renderIntegrations(st) : renderAgents(st) };
    }
    if (nav === "vendor") {
      const ov = st.overview || {};
      const connData = st.connectorsData || {};
      const conns = connData.connectors || (ov.integrations && ov.integrations.connectors) || [];
      const sumConn = connData.summary || { on: ov.integrations?.connectorsOn || 12, off: ov.integrations?.connectorsOff ?? 1, total: conns.length || 13 };
      const tabsHtml = renderSubTabs("vendorTab", ui.vendorTab, [
        { id: "connectors", label: `1 · ${sumConn.total || 13} Konektor Ekosistem (${sumConn.on} ON / ${sumConn.off} OFF) & PO Vendor` },
        { id: "seo", label: "2 · Widget SEO, IG Reel & Freename Leads" },
      ]);
      if (ui.collapsed) return { tabsHtml, bodyHtml: "" };
      if (ui.vendorTab === "seo") {
        const leads = st.seoLeads || [];
        const body = `
          <div class="ghos-card">
            <div class="ghos-card-head">
              <h3>Widget SEO · IG Reel, Freename &amp; Leads Kontak (${leads.length})</h3>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <button type="button" class="ghos-btn prim" data-mod-inline-url="seo/widget-ig-freename-kontak.html" data-mod-inline-title="Widget SEO, IG & Freename" data-mod-inline-id="seo">Buka Widget SEO Inline ▾</button>
                <a class="ghos-btn" href="seo/widget-ig-freename-kontak.html" target="_blank" rel="noopener noreferrer">Tab Baru ↗</a>
              </div>
            </div>
            <div class="ghos-tbl-wrap" style="max-height:200px"><table class="ghos-tbl"><thead><tr><th>Nama</th><th>Email</th><th>Topik / TLD</th><th>Waktu</th></tr></thead><tbody>
              ${leads.slice(0, 15).map((l) => `<tr><td><b>${esc(l.nama || l.name || "-")}</b></td><td>${esc(l.email || "-")}</td><td>${esc(l.topik || l.domain || l.pesan || "-")}</td><td style="color:#9fb0d0">${esc(String(l.created_at || "").slice(0, 16))}</td></tr>`).join("") || `<tr><td colspan="4" style="color:#9fb0d0">Klik "Buka Widget SEO Inline" untuk formulir Freename &amp; leads kontak live.</td></tr>`}
            </tbody></table></div>
          </div>
          ${renderInlineEmbedBox()}
        `;
        return { tabsHtml, bodyHtml: body };
      }
      return { tabsHtml, bodyHtml: renderVendorAndConnectors(st) };
    }
    if (nav === "unduh") {
      const body = `
        <div class="ghos-card">
          <div class="ghos-card-head">
            <h3>Diagnostik Backend Supabase Live &amp; Tampilan Seluler / Ekosistem</h3>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button type="button" class="ghos-btn prim" id="ghos-open-diag">🩺 Uji &amp; Diagnostik Supabase</button>
              <a class="ghos-btn" href="gas-mobile/Index.html">Mobile Portal ↗</a>
              <a class="ghos-btn" href="ekosistem.html" target="_blank" rel="noopener noreferrer">Pusat Ekosistem ↗</a>
            </div>
          </div>
          <div style="font-size:12px;color:#9fb0d0">
            WebSocket Realtime: <b style="color:#6ee7b7">${esc(st.wsStatus)}</b> (${st.subscribedTables || 36} tabel CDC) · Sinkron terakhir: ${esc(st.lastSyncAt || "—")}
          </div>
        </div>
      `;
      return { tabsHtml: "", bodyHtml: ui.collapsed ? "" : body };
    }
    // Standalone fallback (mis. ekosistem.html)
    let bodyHtml = "";
    if (!ui.collapsed) {
      if (ui.tab === "overview") bodyHtml = renderOverview(st);
      else if (ui.tab === "holding") bodyHtml = renderHolding(st);
      else if (ui.tab === "agents") bodyHtml = renderAgents(st);
      else if (ui.tab === "web3") bodyHtml = renderWeb3(st);
      else if (ui.tab === "integrations") bodyHtml = renderIntegrations(st);
      else if (ui.tab === "ops") bodyHtml = renderOps(st);
      else if (ui.tab === "ledger_conn") bodyHtml = renderLedgerAndConnectors(st);
      else if (ui.tab === "modules") bodyHtml = renderModules(st);
    }
    return { tabsHtml: renderTabs(st), bodyHtml };
  }

  function render() {
    const el = mountHost();
    if (!el || !OS()) return;
    const st = OS().getStore();
    const nav = getActivePortalNav();
    const { tabsHtml, bodyHtml } = renderByNav(nav, st);

    el.innerHTML = `
      <div class="ghos-shell">
        ${renderTicker(st)}
        ${tabsHtml}
        ${
          ui.collapsed
            ? ""
            : `<div class="ghos-body">
                ${ui.feedback ? `<div class="ghos-banner-msg ${ui.feedback.ok ? "" : "is-err"}">${esc(ui.feedback.text)}</div>` : ""}
                ${st.error ? `<div class="ghos-banner-msg is-err">${esc(st.error)}</div>` : ""}
                ${bodyHtml}
              </div>`
        }
      </div>
    `;
    wireEvents(el);
  }

  window.addEventListener("kai-nav-change", async () => {
    ui.embedMod = null;
    ui.feedback = null;
    if (OS() && !OS().getStore().catalog.length) {
      OS().loadExtendedDatasets().catch(() => {});
    }
    setTimeout(render, 30);
  });

  window.addEventListener("kai-nav-go", async (ev) => {
    const d = (ev && ev.detail) || {};
    if (d.page === "inv") ui.invTab = d.sub || "gl";
    if (d.page === "aset") ui.asetTab = d.sub || "portfolio";
    if (d.page === "alur") ui.alurTab = d.sub || "agents";
    if (d.page === "vendor") ui.vendorTab = d.sub || "connectors";
    if (d.page && typeof window.__kaiNavigateTo === "function") {
      window.__kaiNavigateTo(d.page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (OS() && !OS().getStore().catalog.length) {
      await OS().loadExtendedDatasets().catch(() => {});
    }
    setTimeout(render, 40);
  });

  window.addEventListener("gio-realtime-update", (ev) => {
    const k = ev && ev.detail ? ev.detail.kind : "";
    if (k === "loading") {
      const btn = document.getElementById("ghos-btn-sync-all");
      if (btn) btn.textContent = "Menyinkronkan…";
      return;
    }
    const active = document.activeElement;
    if (active && active.closest && active.closest("#gio-holding-os-mount") && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) {
      return;
    }
    if (ui.embedMod && k !== "extended") {
      return;
    }
    render();
  });

  function startObserver() {
    const root = document.getElementById("root") || document.body;
    const obs = new MutationObserver(() => {
      const main = document.getElementById("konten-utama");
      const nav = getActivePortalNav();
      const slot = nav === "kantor" ? document.getElementById("gio-holding-os-slot") : document.getElementById("gio-holding-os-slot-page");
      const mount = document.getElementById("gio-holding-os-mount");
      if (main && (!mount || (slot && mount.parentElement !== slot))) {
        render();
      }
    });
    obs.observe(root, { childList: true, subtree: true });
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver);
  } else {
    startObserver();
  }
})();
