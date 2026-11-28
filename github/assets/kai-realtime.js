/* ============================================================
   GIO910 HOLDING OS v4.0 — REAL-TIME STORE & SUPABASE WEBSOCKET
   Menghubungkan seluruh aplikasi ke Supabase Postgres Realtime
   (WebSocket wss:// 36 tabel + fallback polling otomatis) dan
   endpoint gio910-api v4.0.0-realtime tanpa data simulasi.
   ============================================================ */
(() => {
  "use strict";
  if (window.__KAI_REALTIME_MOUNTED__) return;
  window.__KAI_REALTIME_MOUNTED__ = true;

  const SUPA_URL = String(window.__KAI_SUPABASE_URL__ || "https://dttclgkjfiwcovvqrckw.supabase.co").replace(/\/+$/, "");
  const API_BASE = String(window.__KAI_SUPABASE_API_URL__ || (SUPA_URL + "/functions/v1/gio910-api")).replace(/\/+$/, "");
  const ANON_KEY = String(window.__KAI_SUPABASE_ANON_KEY__ || "").trim();
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Seluruh 36 tabel public yang aktif di publikasi supabase_realtime Postgres
  const REALTIME_TABLES = [
    "ai_agent_definitions",
    "ai_agent_runs",
    "blockchain_networks",
    "blockchain_telemetry",
    "blockchain_tx_logs",
    "compliance_registers",
    "copyhub_memberships",
    "copyhub_orders",
    "crm_contacts",
    "dao_proposals",
    "deal_pipeline",
    "documents",
    "facility_tickets",
    "faktur_pajak",
    "gio_attendance",
    "gio_cash",
    "gio_connector_events",
    "gio_connector_resources",
    "gio_connectors",
    "gio_intake",
    "gio_tasks",
    "holding_asset_categories",
    "holding_market_feeds",
    "holding_positions",
    "holding_transactions",
    "hr_leave_requests",
    "hr_payroll",
    "journal",
    "notifications",
    "procurement_orders",
    "realtime_events",
    "seo_leads",
    "tenant_deposits",
    "third_party_integrations",
    "web3_contract_registry",
    "webhook_deliveries",
  ];

  const store = {
    wsStatus: "connecting", // connecting | connected | polling
    wsChannelCount: 0,
    subscribedTables: REALTIME_TABLES.length,
    wsEventCount: 0,
    lastWsTable: null,
    lastWsEventAt: null,
    lastSyncAt: null,
    loading: false,
    error: null,
    overview: null,
    attendance: [],
    leaveRequests: [],
    wibDate: null,
    catalog: [],
    portfolio: null,
    agents: null,
    blockchain: null,
    integrations: null,
    connectorsData: null,
    financeSummary: null,
    financeJournals: [],
    pajak: [],
    payroll: null,
    deposits: null,
    procurement: [],
    auditVerify: null,
    copyhubOrders: null,
    seoLeads: [],
    documentsCount: null,
    crm: [],
    facility: [],
    registers: [],
    liveAgents: {},
  };

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
    if (!res.ok) {
      const err = new Error(data.error || ("HTTP " + res.status));
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  function parseWibMinutes(str) {
    const m = String(str || "").match(/\b(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?/);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }

  function buildOfficeAttendanceMap(peopleList) {
    const people = Array.isArray(peopleList) ? peopleList : [];
    const out = {};
    const rows = store.attendance || [];
    const leaves = store.leaveRequests || [];
    const today = store.wibDate || new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

    // HANYA absensi hari ini yang terverifikasi di Postgres — tanpa fallback hari sebelumnya atau simulasi divisi
    const activeRows = rows.filter((r) => String(r.att_date || "") === today);

    const byName = {};
    const byCode = {};
    const recordAtt = (bucket, key, r) => {
      if (!key) return;
      if (!bucket[key]) {
        bucket[key] = {
          in: null,
          out: null,
          location: "",
          location_note: "",
          work_mode: "",
          distance_m: null,
          lat: null,
          lng: null,
          outsideOffice: false,
          method: "",
          status: "",
          verified_by: "",
        };
      }
      const b = bucket[key];
      const min = parseWibMinutes(r.att_time);
      const isOutOffice = Boolean(
        r.outside_office ||
        (r.distance_m != null && Number(r.distance_m) > 300) ||
        (r.work_mode && r.work_mode !== "WFO Kantor Pusat") ||
        /luar kantor|remote|wfh|dinas|lapangan/i.test(String(r.location || ""))
      );
      if (r.kind === "out") {
        if (b.out == null && min != null) b.out = min;
        if (!b.location && r.location) {
          b.location = String(r.location || "");
          b.location_note = String(r.location_note || "");
          b.work_mode = String(r.work_mode || "");
          b.distance_m = r.distance_m != null ? Number(r.distance_m) : b.distance_m;
          b.lat = r.lat != null ? Number(r.lat) : b.lat;
          b.lng = r.lng != null ? Number(r.lng) : b.lng;
          b.outsideOffice = b.outsideOffice || isOutOffice;
        }
      } else {
        if (b.in == null && min != null) b.in = min;
        if (!b.location || isOutOffice) {
          b.location = String(r.location || "");
          b.location_note = String(r.location_note || "");
          b.work_mode = String(r.work_mode || (isOutOffice ? "Luar Kantor / Remote" : "WFO Kantor Pusat"));
          b.distance_m = r.distance_m != null ? Number(r.distance_m) : b.distance_m;
          b.lat = r.lat != null ? Number(r.lat) : b.lat;
          b.lng = r.lng != null ? Number(r.lng) : b.lng;
          b.outsideOffice = isOutOffice;
          b.method = String(r.method || "");
          b.status = String(r.status || "");
          b.verified_by = String(r.verified_by || "");
        }
      }
    };

    activeRows.forEach((r) => {
      const nm = String(r.employee_name || "").trim().toLowerCase();
      const uc = String(r.user_code || "").trim().toUpperCase();
      if (uc) recordAtt(byCode, uc, r);
      if (nm) recordAtt(byName, nm, r);
    });

    const approvedLeaves = leaves.filter((l) => {
      if (l.status !== "Disetujui") return false;
      const start = String(l.tgl_mulai || "");
      const end = String(l.tgl_selesai || start);
      return !start || (today >= start && today <= end);
    });

    people.forEach((p) => {
      const pId = String(p.id || "").trim().toUpperCase();
      const nm = String(p.nama || "").trim().toLowerCase();
      const hit = (pId && byCode[pId]) || (nm && byName[nm]);
      if (hit && (hit.in != null || hit.out != null)) {
        out[p.id] = {
          in: hit.in,
          out: hit.out,
          location: hit.location,
          location_note: hit.location_note,
          work_mode: hit.work_mode,
          distance_m: hit.distance_m,
          lat: hit.lat,
          lng: hit.lng,
          outsideOffice: Boolean(hit.outsideOffice),
          method: hit.method,
          status: hit.status,
          verified_by: hit.verified_by,
          live: true,
        };
        return;
      }
      const matchedLeave = approvedLeaves.find((l) => {
        const lName = String(l.nama || "").trim().toLowerCase();
        const lCode = String(l.user_code || "").trim().toUpperCase();
        return (pId && lCode === pId) || (nm && lName === nm);
      });
      if (matchedLeave) {
        out[p.id] = { in: null, out: null, izin: true, reason: matchedLeave.jenis, live: true };
        return;
      }
      out[p.id] = {
        in: null,
        out: null,
        guest: Boolean(p.guest),
        live: true,
      };
    });

    return out;
  }

  window.__KAI_BUILD_ATTENDANCE__ = buildOfficeAttendanceMap;
  window.__KAI_PUSH_ATTENDANCE_ROW__ = (row) => {
    if (!row) return;
    const today = store.wibDate || new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
    const norm = {
      att_date: String(row.att_date || row.Tanggal || today),
      att_time: String(row.att_time || row.Jam || ""),
      employee_name: String(row.employee_name || row.Nama || ""),
      user_code: String(row.user_code || row.UserID || "").toUpperCase(),
      kind: row.kind || (String(row.Jenis || "").toLowerCase() === "out" ? "out" : "in"),
      location: row.location || row.Lokasi || "",
      location_note: row.location_note || row.LocationNote || "",
      work_mode: row.work_mode || row.WorkMode || "",
      distance_m: row.distance_m != null ? row.distance_m : (row.JarakMeter != null ? row.JarakMeter : null),
      lat: row.lat != null ? row.lat : (row.Lat != null ? row.Lat : null),
      lng: row.lng != null ? row.lng : (row.Lng != null ? row.Lng : null),
      outside_office: Boolean(row.outside_office || row.OutsideOffice || (row.distance_m != null && Number(row.distance_m) > 300) || (row.JarakMeter != null && Number(row.JarakMeter) > 300) || /luar kantor|remote|wfh|dinas|lapangan/i.test(String(row.location || row.Lokasi || ""))),
      method: row.method || row.Metode || "",
      status: row.status || row.Status || row.StatusVerifikasi || "Menunggu",
    };
    store.attendance = [norm, ...(store.attendance || [])];
    window.dispatchEvent(new CustomEvent("gio-live-attendance", { detail: { rows: store.attendance, wibDate: today } }));
  };

  function syncLiveAgentsFromData(agentsArr, runsArr) {
    const map = {};
    const list = Array.isArray(agentsArr) ? agentsArr : [];
    const runs = Array.isArray(runsArr) ? runsArr : [];
    const latestRun = {};
    runs.forEach((r) => {
      if (r && r.agent_id && !latestRun[r.agent_id]) latestRun[r.agent_id] = r;
    });
    list.forEach((a) => {
      if (!a || !a.id) return;
      const lr = a.lastRun || latestRun[a.id] || null;
      map[a.id] = {
        id: a.id,
        name: a.name || a.nama || a.id,
        mission: a.mission || a.misi || "",
        owner_role: a.owner_role || a.owner || "Pemilik",
        desk_scope: a.desk_scope || "All",
        status: (lr && lr.status) || a.status || "standby",
        summary: (lr && lr.summary) || a.mission || "",
        duration_ms: lr ? lr.duration_ms : null,
        findings_count: lr ? lr.findings_count : 0,
        executed_by: lr ? lr.executed_by : null,
        created_at: lr ? lr.created_at : null,
        engine: "pure_postgres_quant_agents",
      };
    });
    store.liveAgents = map;
    window.dispatchEvent(
      new CustomEvent("gio-live-agents", {
        detail: { byId: map, count: Object.keys(map).length, engine: "pure_postgres_quant_agents", lastSyncAt: store.lastSyncAt },
      })
    );
  }

  window.__KAI_LIVE_AGENTS__ = () => ({
    byId: store.liveAgents,
    list: Object.values(store.liveAgents),
    count: Object.keys(store.liveAgents).length,
    engine: "pure_postgres_quant_agents",
    lastSyncAt: store.lastSyncAt,
    wsStatus: store.wsStatus,
    subscribedTables: store.subscribedTables,
  });

  function emitUpdate(kind, detail, table) {
    window.dispatchEvent(
      new CustomEvent("gio-realtime-update", {
        detail: { kind, store, detail, table: table || null },
      })
    );
  }

  async function refresh(withOptionalTabs) {
    if (store.loading) return store;
    store.loading = true;
    store.error = null;
    emitUpdate("loading");
    try {
      const [ov, att, conn] = await Promise.all([
        api("GET", "/api/live-overview"),
        api("GET", "/api/attendance/live"),
        api("GET", "/api/connectors").catch(() => null),
      ]);
      store.overview = ov;
      store.attendance = att.attendance || ov.sdm?.attendanceList || [];
      store.leaveRequests = att.leaveRequests || ov.sdm?.leaveRequests || [];
      store.wibDate = ov.wibDate || att.wibDate || store.wibDate;
      if (conn) store.connectorsData = conn;
      store.lastSyncAt = new Date().toISOString();
      if (ov.ai && Array.isArray(ov.ai.agents)) {
        syncLiveAgentsFromData(ov.ai.agents, ov.ai.recentRuns);
      }

      if (withOptionalTabs) {
        await loadExtendedDatasets();
      }
      store.loading = false;
      window.dispatchEvent(new CustomEvent("gio-live-attendance", { detail: { attendance: store.attendance, leaveRequests: store.leaveRequests } }));
      emitUpdate("synced");
    } catch (e) {
      store.loading = false;
      store.error = e.message || "Gagal memuat data live.";
      emitUpdate("error", e);
    } finally {
      store.loading = false;
    }
    return store;
  }

  async function loadExtendedDatasets() {
    const tok = getActiveToken();
    const tasks = [
      api("GET", "/api/holding/catalog").then((r) => { store.catalog = r.categories || []; }).catch(() => {}),
      api("GET", "/api/holding/portfolio").then((r) => { store.portfolio = r; }).catch(() => {}),
      api("GET", "/api/agents").then((r) => { store.agents = r; if (r && Array.isArray(r.agents)) syncLiveAgentsFromData(r.agents, r.runs); }).catch(() => {}),
      api("GET", "/api/blockchain/overview").then((r) => { store.blockchain = r; }).catch(() => {}),
      api("GET", "/api/integrations/overview").then((r) => { store.integrations = r; }).catch(() => {}),
      api("GET", "/api/connectors").then((r) => { store.connectorsData = r; }).catch(() => {}),
    ];
    if (tok) {
      tasks.push(
        api("GET", "/api/registers", undefined, tok).then((r) => { store.registers = r.registers || r.items || []; }).catch(() => {}),
        api("GET", "/api/crm", undefined, tok).then((r) => { store.crm = r.contacts || []; }).catch(() => {}),
        api("GET", "/api/facility", undefined, tok).then((r) => { store.facility = r.tickets || []; }).catch(() => {}),
        api("GET", "/api/finance/summary", undefined, tok).then((r) => { store.financeSummary = r.summary || r; }).catch(() => {}),
        api("GET", "/api/finance/journals", undefined, tok).then((r) => { store.financeJournals = r.journals || []; }).catch(() => {}),
        api("GET", "/api/finance/pajak", undefined, tok).then((r) => { store.pajak = r.faktur || []; }).catch(() => {}),
        api("GET", "/api/finance/payroll", undefined, tok).then((r) => { store.payroll = r; }).catch(() => {}),
        api("GET", "/api/finance/deposits", undefined, tok).then((r) => { store.deposits = r; }).catch(() => {}),
        api("GET", "/api/finance/procurement", undefined, tok).then((r) => { store.procurement = r.orders || []; }).catch(() => {}),
        api("GET", "/api/audit/verify", undefined, tok).then((r) => { store.auditVerify = r; }).catch(() => {}),
        api("GET", "/api/copyhub/orders", undefined, tok).then((r) => { store.copyhubOrders = r; }).catch(() => {}),
        api("GET", "/api/seo/inquiries", undefined, tok).then((r) => { store.seoLeads = r.inquiries || r.leads || []; }).catch(() => {}),
        api("GET", "/api/documents", undefined, tok).then((r) => { store.documentsCount = (r.documents || []).length; }).catch(() => {})
      );
    } else {
      store.financeSummary = null;
      store.financeJournals = [];
      store.pajak = [];
      store.payroll = null;
      store.deposits = null;
      store.procurement = [];
      store.auditVerify = null;
      store.copyhubOrders = null;
      store.seoLeads = [];
      store.documentsCount = null;
    }
    await Promise.all(tasks);
    emitUpdate("extended");
  }

  // ============================================================
  // NATIVE SUPABASE PHOENIX REALTIME WEBSOCKET CLIENT (36 TABEL)
  // ============================================================
  let ws = null;
  let hbTimer = null;
  let reconTimer = null;
  let refSeq = 1;
  let refreshDebounce = null;

  function scheduleRefreshFromWs() {
    clearTimeout(refreshDebounce);
    refreshDebounce = setTimeout(() => {
      refresh(Boolean(store.catalog.length || store.connectorsData));
    }, 450);
  }

  function connectWebSocket() {
    if (window.self !== window.top || !ANON_KEY || typeof WebSocket === "undefined") {
      store.wsStatus = "polling";
      emitUpdate("ws");
      return;
    }
    try {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
      const wsBase = SUPA_URL.replace(/^https:\/\//i, "wss://").replace(/^http:\/\//i, "ws://");
      const url = `${wsBase}/realtime/v1/websocket?apikey=${encodeURIComponent(ANON_KEY)}&vsn=1.0.0`;
      store.wsStatus = "connecting";
      emitUpdate("ws");
      ws = new WebSocket(url);

      ws.onopen = () => {
        store.wsStatus = "connected";
        store.wsChannelCount = 1;
        const joinRef = String(refSeq++);
        ws.send(JSON.stringify({
          topic: "realtime:public",
          event: "phx_join",
          payload: {
            config: {
              broadcast: { self: false },
              presence: { key: "" },
              postgres_changes: REALTIME_TABLES.map((tbl) => ({
                event: "*",
                schema: "public",
                table: tbl,
              })),
            },
            access_token: ANON_KEY,
          },
          ref: joinRef,
        }));
        clearInterval(hbTimer);
        hbTimer = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(refSeq++) }));
          }
        }, 25000);
        emitUpdate("ws");
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.event === "postgres_changes") {
            const tbl = (msg.payload && (msg.payload.table || (msg.payload.data && msg.payload.data.table))) || "";
            store.wsEventCount += 1;
            store.lastWsTable = tbl || store.lastWsTable;
            store.lastWsEventAt = new Date().toISOString();
            emitUpdate("ws_event", msg.payload, tbl);
            scheduleRefreshFromWs();
          }
        } catch (_) {}
      };

      ws.onerror = () => {
        store.wsStatus = "polling";
        emitUpdate("ws");
      };

      ws.onclose = () => {
        clearInterval(hbTimer);
        store.wsStatus = "polling";
        emitUpdate("ws");
        clearTimeout(reconTimer);
        reconTimer = setTimeout(connectWebSocket, 10000);
      };
    } catch (_) {
      store.wsStatus = "polling";
      emitUpdate("ws");
    }
  }

  // Polling cadangan agar tetap sinkron bila jaringan memblokir WebSocket
  setInterval(() => {
    if (!document.hidden) refresh(false);
  }, 25000);

  window.addEventListener("kai-session-change", () => {
    refresh(true);
  });

  window.__KAI_HOLDING_OS__ = {
    REALTIME_TABLES,
    getStore: () => store,
    getActiveToken,
    api,
    refresh,
    loadExtendedDatasets,
    checkIn: async (payload) => {
      const r = await api("POST", "/api/attendance/checkin", payload || {});
      await refresh(false);
      return r;
    },
    submitLeave: async (payload) => {
      const r = await api("POST", "/api/hr/leave", payload || {});
      await refresh(false);
      return r;
    },
    decideLeave: async (payload) => {
      const r = await api("POST", "/api/hr/leave/decide", payload || {});
      await refresh(false);
      return r;
    },
    createHoldingTx: async (payload) => {
      const r = await api("POST", "/api/holding/transactions", payload || {});
      await refresh(true);
      return r;
    },
    createDeal: async (payload) => {
      const r = await api("POST", "/api/holding/deals", payload || {});
      await refresh(true);
      return r;
    },
    runAgents: async (agentId, createTasks) => {
      const r = await api("POST", "/api/agents/run", { agent_id: agentId || "ALL", create_tasks: Boolean(createTasks) });
      await refresh(true);
      return r;
    },
    probeChains: async () => {
      const r = await api("POST", "/api/blockchain/rpc-probe", {});
      await refresh(true);
      return r;
    },
    syncSnapshot: async (space) => {
      const r = await api("POST", "/api/blockchain/snapshot-sync", { space: space || "gio910gerai.eth" });
      await refresh(true);
      return r;
    },
    saveChainConfig: async (payload) => {
      const r = await api("POST", "/api/blockchain/config", payload || {});
      await refresh(true);
      return r;
    },
    verifyWalletAction: async (payload) => {
      const r = await api("POST", "/api/blockchain/verify-wallet-action", payload || {});
      await refresh(true);
      return r;
    },
    voteDao: async (payload) => {
      const r = await api("POST", "/api/dao/vote", payload || {});
      await refresh(true);
      return r;
    },
    createDaoProposal: async (payload) => {
      const r = await api("POST", "/api/dao/proposals", payload || {});
      await refresh(true);
      return r;
    },
    syncMarket: async () => {
      const r = await api("POST", "/api/integrations/market-sync", {});
      await refresh(true);
      return r;
    },
    createWebhook: async (payload) => {
      const r = await api("POST", "/api/integrations/webhooks", payload || {});
      await refresh(true);
      return r;
    },
    dispatchWebhook: async (payload) => {
      const r = await api("POST", "/api/integrations/dispatch-webhook", payload || {});
      await refresh(true);
      return r;
    },
    testInboundWebhook: async (provider, payload) => {
      const r = await api("POST", "/api/integrations/webhook/" + encodeURIComponent(provider || "gopay"), payload || {});
      await refresh(true);
      return r;
    },
    createCrm: async (payload) => {
      const r = await api("POST", "/api/crm", payload || {});
      await refresh(true);
      return r;
    },
    createFacility: async (payload) => {
      const r = await api("POST", "/api/facility", payload || {});
      await refresh(true);
      return r;
    },
    saveRegister: async (payload) => {
      const r = await api("POST", "/api/registers", payload || {});
      await refresh(true);
      return r;
    },
    connectorAction: async (payload) => {
      const r = await api("POST", "/api/connectors/action", payload || {});
      await refresh(true);
      return r;
    },
    postJournal: async (payload) => {
      const r = await api("POST", "/api/finance/post", payload || {});
      await refresh(true);
      return r;
    },
    createFaktur: async (payload) => {
      const r = await api("POST", "/api/finance/pajak", payload || {});
      await refresh(true);
      return r;
    },
    approvePayroll: async (payload) => {
      const r = await api("POST", "/api/finance/payroll/approve", payload || {});
      await refresh(true);
      return r;
    },
    runBankRecon: async (payload) => {
      const r = await api("POST", "/api/finance/bank-recon", payload || {});
      await refresh(true);
      return r;
    },
    approvePo: async (poId) => {
      const r = await api("POST", "/api/finance/procurement/" + encodeURIComponent(poId) + "/approve", {});
      await refresh(true);
      return r;
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      refresh(false);
      connectWebSocket();
    });
  } else {
    refresh(false);
    connectWebSocket();
  }
})();
