const SRC_URL =
  "https://cdn.jsdelivr.net/gh/Slam691410/gio910@aa5acfc327c478aa47c95f90cffa05eabe491cdf/github/assets/kai-app.js";
const BACKEND_URL =
  "https://cdn.jsdelivr.net/gh/Slam691410/gio910@aa5acfc327c478aa47c95f90cffa05eabe491cdf/github/assets/kai-backend.js";

const PATCHES_URL =
  (process.env.KAI_SUPABASE_URL || "https://dttclgkjfiwcovvqrckw.supabase.co").replace(/\/+$/, "") +
  "/rest/v1/gio_web_assets?name=in.(app-js-v44-patches-a.json,app-js-v44-patches-b.json,app-js-v45-patches-c.json,app-js-v46-patches-d.json)&select=name,body&order=name.asc";
const SUPABASE_ANON =
  process.env.KAI_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dGNsZ2tqZml3Y292dnFyY2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2NTkzNzQsImV4cCI6MjExMTIzNTM3NH0.ozBfRkrgcVUBMfWTmOGhQprvoFLYcIzHr30-AGnlijE";

const UNIT_META = {
  D1: ["D1 · Kas & Pendapatan Tetap", "#0ea5e9", "wood"],
  D2: ["D2 · Ekuitas Publik", "#0284c7", "wood"],
  D3: ["D3 · Reksa Dana & ETF", "#38bdf8", "wood"],
  D4: ["D4 · Valas & Derivatif", "#06b6d4", "wood"],
  D5: ["D5 · Kripto & Digital", "#14b8a6", "carpet"],
  D6: ["D6 · Bisnis Digital & HKI", "#10b981", "carpet"],
  D7: ["D7 · Properti & Tanah", "#d97706", "wood"],
  D8: ["D8 · Aset Fisik Produktif", "#b45309", "wood"],
  D9: ["D9 · Agrikultur & Alam", "#65a30d", "wood"],
  D10: ["D10 · Koleksi & Gaya Hidup", "#ea580c", "carpet"],
  D11: ["D11 · Asuransi & Pensiun", "#e11d48", "carpet"],
  D12: ["D12 · Bisnis Langsung", "#c026d3", "wood"],
  S1: ["S1 · CIO Office & IC", "#6366f1", "carpet"],
  S2: ["S2 · Risk & Compliance", "#dc2626", "carpet"],
  S3: ["S3 · Finance & Tax", "#2563eb", "carpet"],
  S4: ["S4 · Ops & Custody", "#1d4ed8", "carpet"],
  S5: ["S5 · Legal & Corp Sec", "#7c3aed", "carpet"],
  S6: ["S6 · People & Culture", "#db2777", "carpet"],
  S7: ["S7 · Tech, Data & AI", "#0891b2", "tile"],
  S8: ["S8 · Stakeholder Rel", "#9333ea", "carpet"],
  S9: ["S9 · Internal Audit", "#b91c1c", "carpet"],
  S10: ["S10 · AI Ops Center", "#0d9488", "tile"],
  S11: ["S11 · Business Dev", "#d97706", "carpet"],
  S12: ["S12 · General Affairs", "#475569", "tile"]
};

const AI_AGENTS = [
  ["AG-01", "Router & Intake", "AI1"],
  ["AG-18", "Office Orchestrator", "AI1"],
  ["AG-02", "Deal Memo Analyst", "AI2"],
  ["AG-03", "Valuation Modeler", "AI2"],
  ["AG-04", "IPS & Risk Guard", "AI2"],
  ["AG-11", "Asset Cataloger", "AI2"],
  ["AG-05", "Market & Macro Watch", "AI3"],
  ["AG-06", "Portfolio Rebalancer", "AI3"],
  ["AG-08", "Corporate Action Monitor", "AI3"],
  ["AG-09", "Dividend & Coupon Tracker", "AI3"],
  ["AG-10", "Counterparty Screener", "AI3"],
  ["AG-07", "Field Ops & CapEx AI", "AI4"],
  ["AG-13", "GL & Journal Reconciler", "AI5"],
  ["AG-14", "Tax & e-Faktur AI", "AI5"],
  ["AG-17", "Audit & Compliance Sentinel", "AI5"],
  ["AG-12", "Stakeholder Reporter", "AI6"],
  ["AG-15", "Board Pack Composer", "AI6"],
  ["AG-16", "Meeting & Minutes AI", "AI6"]
];

function rnd2(n) {
  return Math.round(n * 100) / 100;
}

function packRoomDesks(rx, ry, count, kind) {
  kind = kind || "desk";
  const cols = count <= 3 ? count : count <= 8 ? Math.floor((count + 1) / 2) : count <= 16 ? Math.min(5, count > 10 ? Math.floor((count + 2) / 3) : Math.floor((count + 1) / 2)) : 6;
  const rows = Math.floor((count + cols - 1) / cols);
  const stepX = cols >= 6 ? 1.85 : 2.0;
  const stepY = rows >= 5 ? 2.05 : 2.2;
  const w = Math.max(4, Math.floor(cols * stepX + 1.4));
  const d = Math.max(4, Math.floor(rows * stepY + 2.0));
  const furn = [];
  const seats = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idx >= count) break;
      const dx = rnd2(rx + 0.75 + c * stepX);
      const dy = rnd2(ry + 1.25 + r * stepY);
      furn.push([dx, dy, 1.3, 0.8, 0.72, kind]);
      seats.push({ x: rnd2(dx + 0.65), y: rnd2(dy + 1.15), i: idx });
      idx++;
    }
  }
  return { w, d, furn, seats };
}

function packRows(roomSpecs, startX, startY, maxRowW) {
  let curX = startX, curY = startY, rowH = 0;
  const rooms = [], furn = [], seatMap = {};
  for (const sp of roomSpecs) {
    const cnt = sp.count || 0;
    let w, d, rfurn, rseats;
    if (cnt > 0) {
      const p = packRoomDesks(0, 0, cnt, sp.kind || "desk");
      w = p.w; d = p.d; rfurn = p.furn; rseats = p.seats;
    } else {
      w = sp.w; d = sp.d; rfurn = []; rseats = [];
    }
    if (curX > startX && curX + w > maxRowW) {
      curX = startX;
      curY += rowH + 1;
      rowH = 0;
    }
    rooms.push({ k: sp.k, n: sp.n, x: curX, y: curY, w, d, f: sp.f, type: sp.type, desks: cnt });
    for (const fi of rfurn) furn.push([rnd2(fi[0] + curX), rnd2(fi[1] + curY), fi[2], fi[3], fi[4], fi[5]]);
    for (const ef of sp.extra_furn || []) furn.push([rnd2(ef[0] + curX), rnd2(ef[1] + curY), ef[2], ef[3], ef[4], ef[5]]);
    seatMap[sp.k] = rseats.map((s) => ({ x: rnd2(s.x + curX), y: rnd2(s.y + curY), i: s.i }));
    curX += w + 1;
    if (d > rowH) rowH = d;
  }
  const totalW = maxOr0(rooms.map((r) => r.x + r.w)) + 1;
  const totalD = maxOr0(rooms.map((r) => r.y + r.d)) + 1;
  return { rooms, furn, seatMap, totalW, totalD };
}

function maxOr0(arr) {
  return arr.length ? Math.max(...arr) : 0;
}

function buildLayoutV43(backendJs) {
  const m = backendJs.match(/const seed = (\{.*?\});/);
  if (!m) throw new Error("Cannot parse seed from kai-backend.js");
  const users = JSON.parse(m[1]).users || [];
  const unitUsers = {}, extUsers = [];
  for (const u of users) {
    const code = u.Unit.split(" · ")[0].trim();
    if (code === "Eksternal") extUsers.push(u);
    else (unitUsers[code] = unitUsers[code] || []).push(u);
  }
  const ops1 = [], ops2 = [], ops3 = [];
  for (let i = 1; i < 90; i++) {
    const code = "OPS-" + String(i).padStart(3, "0");
    const nama = "Personel Operasional Gedung #" + i;
    if (i % 3 === 2) ops1.push({ ID: code, Nama: nama, Jabatan: "Operasional Gedung & Layanan Kantor AI", Unit: "OPS1 · Ops Gedung Kantor AI", Tier: "Staf", StatusKepegawaian: "Operasional Gedung / Alih Daya", entitas: "PT Shared Services / Kantor AI", warna: "#0ea5e9" });
    else if (i % 3 === 1) ops2.push({ ID: code, Nama: nama, Jabatan: "Operasional Lapangan & Pemeliharaan Properti", Unit: "OPS2 · Ops Lapangan PT Properti", Tier: "Staf", StatusKepegawaian: "Operasional Gedung / Alih Daya", entitas: "PT Properti", warna: "#d97706" });
    else ops3.push({ ID: code, Nama: nama, Jabatan: "Operasional Lapangan Aset Produktif & Agri", Unit: "OPS3 · Ops Lapangan PT Aset Agri", Tier: "Staf", StatusKepegawaian: "Operasional Gedung / Alih Daya", entitas: "PT Aset Produktif & Agri", warna: "#65a30d" });
  }
  const aiByRoom = {};
  for (const [aid, anm, rkey] of AI_AGENTS) (aiByRoom[rkey] = aiByRoom[rkey] || []).push([aid, anm]);

  const f1Specs = [];
  for (let i = 1; i <= 12; i++) {
    const k = "D" + i, [lbl, , flt] = UNIT_META[k], cnt = (unitUsers[k] || []).length;
    f1Specs.push({ k, n: `${lbl} (${cnt})`, f: flt, type: "unit", count: cnt });
  }
  f1Specs.push(
    { k: "DIR", n: "Direksi & Komisaris", f: "wood", type: "exec", count: 0, w: 6, d: 5, extra_furn: [[1.4, 1.5, 3.2, 1.4, 0.75, "table"], [5.0, 0.8, 0.7, 0.7, 0.2, "plant"]] },
    { k: "rapat", n: "Ruang Rapat IC", f: "carpet", type: "meet", count: 0, w: 6, d: 5, extra_furn: [[1.4, 1.5, 3.2, 1.4, 0.75, "table"], [1.6, 0.6, 2.8, 0.2, 0.9, "board"]] },
    { k: "tamu", n: "Lobby & Resepsionis", f: "tile", type: "lobby", count: 0, w: 5, d: 4, extra_furn: [[1.0, 0.9, 2.8, 0.75, 0.85, "counter"], [1.0, 2.5, 2.2, 0.8, 0.45, "sofa"]] },
    { k: "pantry", n: "Pantry L1", f: "tile", type: "pantry", count: 0, w: 5, d: 4, extra_furn: [[1.0, 1.1, 2.8, 0.75, 0.85, "counter"], [4.0, 0.8, 0.7, 0.7, 0.2, "plant"]] }
  );

  const f2Specs = [];
  for (let i = 1; i <= 12; i++) {
    const k = "S" + i, [lbl, , flt] = UNIT_META[k], cnt = (unitUsers[k] || []).length;
    f2Specs.push({ k, n: `${lbl} (${cnt})`, f: flt, type: "unit", count: cnt });
  }
  f2Specs.push(
    { k: "AUD", n: "Ruang Audit & Eksternal (2)", f: "carpet", type: "audit", count: 2 },
    { k: "rapat2", n: "Rapat Operasional", f: "carpet", type: "meet", count: 0, w: 6, d: 5, extra_furn: [[1.4, 1.5, 3.2, 1.4, 0.75, "table"], [1.6, 0.6, 2.8, 0.2, 0.9, "board"]] },
    { k: "arsip", n: "Ruang Arsip & Dokumen", f: "tile", type: "arsip", count: 0, w: 5, d: 4, extra_furn: [[1.0, 1.0, 1.3, 0.7, 1.4, "shelf"], [2.6, 1.0, 1.3, 0.7, 1.4, "shelf"]] },
    { k: "pantry2", n: "Pantry L2", f: "tile", type: "pantry", count: 0, w: 4, d: 4, extra_furn: [[0.8, 1.1, 2.4, 0.75, 0.85, "counter"]] }
  );

  const f3Specs = [
    { k: "OPS1", n: "OPS1 · Ops Gedung Kantor AI (30)", f: "tile", type: "ops", count: 30 },
    { k: "OPS2", n: "OPS2 · Ops Lapangan PT Properti (30)", f: "wood", type: "ops", count: 30 },
    { k: "OPS3", n: "OPS3 · Ops Lapangan PT Aset Agri (29)", f: "wood", type: "ops", count: 29 }
  ];

  const AI_ROOM_NAMES = {
    AI1: "AI-1 · Resepsionis & Routing (2)",
    AI2: "AI-2 · Riset & Valuasi (4)",
    AI3: "AI-3 · Pasar & Aset (5)",
    AI4: "AI-4 · Operasi Lapangan (1)",
    AI5: "AI-5 · Keuangan & Kepatuhan (3)",
    AI6: "AI-6 · Komunikasi & Pelaporan (3)"
  };
  const f4Specs = ["AI1", "AI2", "AI3", "AI4", "AI5", "AI6"].map((rk) => ({
    k: rk, n: AI_ROOM_NAMES[rk], f: "tile", type: "ai", count: (aiByRoom[rk] || []).length, kind: "aidesk"
  }));
  const srvExtra = [];
  for (let i = 0; i < 4; i++) srvExtra.push([1.0 + i * 1.5, 1.3, 0.9, 0.9, 1.8, "rack"]);
  for (let i = 0; i < 4; i++) srvExtra.push([1.0 + i * 1.5, 2.8, 0.9, 0.9, 1.8, "rack"]);
  f4Specs.push({ k: "SRV", n: "Cluster Server & Realtime DB", f: "tile", type: "server", count: 0, w: 8, d: 5, extra_furn: srvExtra });

  const f1 = packRows(f1Specs, 1, 1, 38);
  const f2 = packRows(f2Specs, 1, 1, 38);
  const f3 = packRows(f3Specs, 1, 1, 46);
  const f4 = packRows(f4Specs, 1, 1, 28);

  const m1 = packRows(f1Specs, 1, 1, 58);
  const m2 = packRows(f2Specs, 1, m1.totalD + 1, 58);
  const m3 = packRows(f3Specs, 1, m2.totalD + 1, 58);
  const m4 = packRows(f4Specs, 1, m3.totalD + 1, 58);

  const mRooms = [...m1.rooms, ...m2.rooms, ...m3.rooms, ...m4.rooms];
  const mFurn = [...m1.furn, ...m2.furn, ...m3.furn, ...m4.furn];
  const mSeats = Object.assign({}, m1.seatMap, m2.seatMap, m3.seatMap, m4.seatMap);
  const mw = Math.max(m1.totalW, m2.totalW, m3.totalW, m4.totalW);
  const md = m4.totalD;

  const shortMap = { DIR: "DIREKSI", rapat: "RAPAT IC", tamu: "LOBBY", pantry: "PANTRY L1", rapat2: "RAPAT L2", arsip: "ARSIP", pantry2: "PANTRY L2", SRV: "SERVER" };
  for (const r of mRooms) r.short = r.desks > 0 ? `${r.k} (${r.desks})` : (shortMap[r.k] || r.k);

  const people = [];
  for (let i = 1; i <= 12; i++) {
    const k = "D" + i, warna = UNIT_META[k][1];
    (unitUsers[k] || []).forEach((u, idx) => people.push({ id: u.ID, nama: u.Nama, jabatan: u.Jabatan, unit: u.Unit, tier: u.Tier, statusKepegawaian: u.StatusKepegawaian, warna, floor: 1, seat: f1.seatMap[k][idx], masterSeat: mSeats[k][idx] }));
  }
  for (let i = 1; i <= 12; i++) {
    const k = "S" + i, warna = UNIT_META[k][1];
    (unitUsers[k] || []).forEach((u, idx) => people.push({ id: u.ID, nama: u.Nama, jabatan: u.Jabatan, unit: u.Unit, tier: u.Tier, statusKepegawaian: u.StatusKepegawaian, warna, floor: 2, seat: f2.seatMap[k][idx], masterSeat: mSeats[k][idx] }));
  }
  extUsers.forEach((u, idx) => people.push({ id: u.ID, nama: u.Nama, jabatan: u.Jabatan, unit: u.Unit, tier: u.Tier, statusKepegawaian: u.StatusKepegawaian, warna: "#64748b", floor: 2, guest: true, seat: f2.seatMap.AUD[idx], masterSeat: mSeats.AUD[idx] }));
  [["OPS1", ops1], ["OPS2", ops2], ["OPS3", ops3]].forEach(([k, lst]) => {
    lst.forEach((u, idx) => people.push({ id: u.ID, nama: u.Nama, jabatan: u.Jabatan, unit: u.Unit, tier: u.Tier, statusKepegawaian: u.StatusKepegawaian, entitas: u.entitas, warna: u.warna, floor: 3, seat: f3.seatMap[k][idx], masterSeat: mSeats[k][idx] }));
  });

  const agents = [];
  ["AI1", "AI2", "AI3", "AI4", "AI5", "AI6"].forEach((rk) => {
    (aiByRoom[rk] || []).forEach(([aid, anm], idx) => agents.push({ id: aid, nama: anm, floor: 4, roomKey: rk, seat: f4.seatMap[rk][idx], masterSeat: mSeats[rk][idx] }));
  });

  const floors = [
    { nama: `Semua Divisi · ${mRooms.length} Ruang (277 Meja)`, sub: "24 Divisi Investasi & Pendukung + 3 Unit Ops Gedung + Direksi + Audit + 6 Ruang AI (259 SDM + 18 AI)", cols: mw, rows: md, rooms: mRooms, furn: mFurn, meet: [{ x: mRooms[13].x + 2.5, y: mRooms[13].y + 3.3 }, { x: mRooms[29].x + 2.5, y: mRooms[29].y + 3.3 }], pantry: [{ x: mRooms[15].x + 2.0, y: mRooms[15].y + 2.2 }] },
    { nama: "Lantai 1 — 12 Divisi Investasi (82 Meja)", sub: "D1–D12 (75 FTE + 7 Freelancer) + Direksi + Rapat IC + Lobby", cols: f1.totalW, rows: f1.totalD, rooms: f1.rooms, furn: f1.furn, meet: [{ x: f1.rooms[13].x + 2.5, y: f1.rooms[13].y + 3.3 }], pantry: [{ x: f1.rooms[15].x + 2.0, y: f1.rooms[15].y + 2.2 }] },
    { nama: "Lantai 2 — 12 Divisi Pendukung & Audit (88 Meja)", sub: "S1–S12 (81 FTE + 5 Freelancer) + Audit & Eksternal (2)", cols: f2.totalW, rows: f2.totalD, rooms: f2.rooms, furn: f2.furn, meet: [{ x: f2.rooms[13].x + 2.5, y: f2.rooms[13].y + 3.3 }], pantry: [{ x: f2.rooms[15].x + 1.5, y: f2.rooms[15].y + 2.2 }] },
    { nama: "Lantai 3 — 3 Unit Ops Gedung & Alih Daya (89 Meja)", sub: "OPS1 Kantor AI (30) + OPS2 PT Properti (30) + OPS3 PT Aset Produktif & Agri (29)", cols: f3.totalW, rows: f3.totalD, rooms: f3.rooms, furn: f3.furn },
    { nama: "Lantai 4 — 6 Ruang Agent AI (18 Meja AI)", sub: "18 Agent AI kuantitatif aktif 24 jam di 6 ruang khusus + Server Cluster", cols: f4.totalW, rows: f4.totalD, rooms: f4.rooms, furn: f4.furn }
  ];

  return "layout:" + JSON.stringify({ floors, people, agents, staff: [] });
}

module.exports = async function handler(req, res) {
  try {
    const [r, rb, rp] = await Promise.all([
      fetch(SRC_URL),
      fetch(BACKEND_URL),
      fetch(PATCHES_URL, { headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON } })
    ]);
    if (!r.ok) return res.status(502).send("// Upstream kai-app error " + r.status);
    if (!rb.ok) return res.status(502).send("// Upstream kai-backend error " + rb.status);
    if (!rp.ok) return res.status(502).send("// Upstream patches error " + rp.status);
    let [js, backendJs, patchRows] = await Promise.all([r.text(), rb.text(), rp.json()]);
    const sLay = js.indexOf("layout:{floors:[");
    const marker = "route:[[21,13],[12,8],[6,18]]}]}";
    const eLay = sLay >= 0 ? js.indexOf(marker, sLay) : -1;
    if (sLay >= 0 && eLay > sLay) {
      js = js.slice(0, sLay) + buildLayoutV43(backendJs) + js.slice(eLay + marker.length);
    }
    const sorted = Array.isArray(patchRows) ? patchRows.slice().sort((a, b) => String(a.name).localeCompare(String(b.name))) : [];
    const patches = sorted.flatMap((row) => JSON.parse(row.body || "[]"));
    for (let i = 0; i < patches.length; i++) {
      const pair = patches[i];
      if (js.includes(pair[0])) js = js.replace(pair[0], pair[1]);
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, must-revalidate");
    return res.status(200).send(js);
  } catch (err) {
    return res.status(500).send("// Error loading kai-app: " + (err && err.message ? err.message : String(err)));
  }
};
module.exports.buildLayoutV43 = buildLayoutV43;
