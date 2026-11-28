/* ============================================================
   KANTOR AI — SUPABASE LIVE BRIDGE v2.0 (gio910-api)
   Dipasang tepat setelah kai-backend.js.
   Menghubungkan seluruh modul portal, auth (OTP / PIN / Kartu HMAC),
   buku besar 3101 (GIO-5..11), register kepatuhan, media CMS, & workspace
   ke Supabase Edge Function gio910-api secara langsung (Postgres live),
   dengan fallback lokal hanya bila offline / jaringan putus.
   ============================================================ */
(() => {
  "use strict";

  const API_BASE = String(window.__KAI_SUPABASE_API_URL__ || "").replace(/\/+$/, "");
  const ANON_KEY = String(window.__KAI_SUPABASE_ANON_KEY__ || "").trim();
  const localRunner = window.google && window.google.script && window.google.script.run ? window.google.script.run : null;
  if (!API_BASE) return;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const SUPA_SESS_KEY = "kai_supa_sessions_v1";
  const HEALTH_CACHE_MS = 30000;

  let healthState = {
    checkedAt: 0,
    ok: null,
    latencyMs: null,
    version: null,
    integrations: null,
    error: null,
  };

  function readSupaSessions() {
    try { return JSON.parse(sessionStorage.getItem(SUPA_SESS_KEY) || "{}"); }
    catch (_) { return {}; }
  }
  function saveSupaSession(token, user) {
    if (!token || !UUID_RE.test(token)) return;
    try {
      const m = readSupaSessions();
      m[token] = { user: user || null, savedAt: Date.now() };
      sessionStorage.setItem(SUPA_SESS_KEY, JSON.stringify(m));
      window.__KAI_ACTIVE_SUPA_TOKEN__ = token;
      window.__KAI_ACTIVE_SUPA_USER__ = user || null;
      window.dispatchEvent(new CustomEvent("kai-session-change", { detail: { token, user } }));
    } catch (_) {}
  }
  function dropSupaSession(token) {
    try {
      const m = readSupaSessions();
      delete m[token];
      sessionStorage.setItem(SUPA_SESS_KEY, JSON.stringify(m));
      if (window.__KAI_ACTIVE_SUPA_TOKEN__ === token) {
        window.__KAI_ACTIVE_SUPA_TOKEN__ = "";
        window.__KAI_ACTIVE_SUPA_USER__ = null;
      }
    } catch (_) {}
  }
  function getSupaSession(token) {
    if (!token || !UUID_RE.test(token)) return null;
    const rec = readSupaSessions()[token];
    if (rec) return rec;
    try {
      const hs = JSON.parse(sessionStorage.getItem("hi_session_v1") || "null");
      if (hs && hs.token === token) return { user: hs.user || null };
    } catch (_) {}
    return { user: null };
  }
  function getAnyActiveToken() {
    if (window.__KAI_ACTIVE_SUPA_TOKEN__ && UUID_RE.test(window.__KAI_ACTIVE_SUPA_TOKEN__)) {
      return window.__KAI_ACTIVE_SUPA_TOKEN__;
    }
    try {
      const hs = JSON.parse(sessionStorage.getItem("hi_session_v1") || "null");
      if (hs && hs.token && UUID_RE.test(hs.token)) return hs.token;
    } catch (_) {}
    const all = readSupaSessions();
    const keys = Object.keys(all);
    return keys.length ? keys[keys.length - 1] : "";
  }

  function callLocal(kind, arg1, token, payload) {
    if (!localRunner) return Promise.reject(new Error("Offline local runner tidak tersedia."));
    return new Promise((resolve, reject) => {
      const r = localRunner
        .withSuccessHandler((val) => resolve(val))
        .withFailureHandler((err) => reject(err instanceof Error ? err : new Error(String(err || "Gagal eksekusi lokal."))));
      if (kind === "workspace") r.gasWorkspaceDispatch(arg1, token, payload || {});
      else r.gasApiDispatch(arg1, token, payload || {});
    });
  }

  async function apiFetch(method, path, body, token) {
    const headers = { "Content-Type": "application/json" };
    if (ANON_KEY) {
      headers["apikey"] = ANON_KEY;
      headers["Authorization"] = "Bearer " + ANON_KEY;
    }
    const useTok = token || getAnyActiveToken();
    if (useTok && UUID_RE.test(useTok)) {
      headers["x-gio-session"] = useTok;
    }
    const opts = { method, headers };
    if (body !== undefined && method !== "GET" && method !== "DELETE") {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(API_BASE + path, opts);
    let data = null;
    try { data = await res.json(); } catch (_) { data = null; }
    if (!res.ok || (data && data.success === false && res.status >= 400)) {
      const err = new Error((data && data.error) || ("HTTP " + res.status + " dari Supabase gio910-api"));
      err.status = res.status;
      err.reason = data && data.reason;
      err.payload = data;
      throw err;
    }
    return data || {};
  }

  async function checkHealth(force) {
    const now = Date.now();
    if (!force && healthState.checkedAt && now - healthState.checkedAt < HEALTH_CACHE_MS) {
      return healthState;
    }
    const t0 = performance.now();
    try {
      const data = await apiFetch("GET", "/api/health");
      healthState = {
        checkedAt: Date.now(),
        ok: Boolean(data && (data.status === "healthy" || data.success)),
        latencyMs: Math.round(performance.now() - t0),
        version: data.version || "2.0.0-live",
        integrations: data.integrations || {},
        error: null,
      };
    } catch (e) {
      healthState = {
        checkedAt: Date.now(),
        ok: false,
        latencyMs: Math.round(performance.now() - t0),
        version: null,
        integrations: null,
        error: e.message || "Gagal ping Supabase",
      };
    }
    try { window.dispatchEvent(new CustomEvent("kai-supabase-health", { detail: healthState })); } catch (_) {}
    return healthState;
  }

  const PRIO_TO_ID = { high: "Tinggi", medium: "Sedang", low: "Rendah" };
  const TASK_ST_TO_ID = { open: "Belum", in_progress: "Berjalan", done: "Selesai", cancelled: "Dibatalkan" };
  const TASK_ST_FROM_ID = { Belum: "open", Berjalan: "in_progress", Selesai: "done", Dibatalkan: "cancelled" };

  function mapCashRow(r) {
    if (!r) return r;
    return {
      ID: r.code || r.id,
      _uuid: r.id,
      Tanggal: r.tx_date || String(r.created_at || "").slice(0, 10),
      Jenis: r.kind || "Masuk",
      Kategori: r.coa || "",
      coa: r.coa || "",
      Nominal: Number(r.amount || 0),
      Keterangan: r.note || "",
      Oleh: r.created_by_name || "",
      Status: r.status || "Draft",
      Rekonsiliasi: r.reconciliation || "Belum",
      entitas: r.entity || "PT HOLDING (induk)",
      lampiran: r.attachment || "",
      periode: r.period || "",
      dibuatOleh: r.created_by || "",
      disetujuiOleh: r.approved_by || "",
    };
  }

  function mapIntakeRow(r) {
    if (!r) return r;
    return {
      ID: r.code || r.id,
      _uuid: r.id,
      Judul: r.title || "",
      Kategori: r.category || "Investasi",
      Nilai: Number(r.amount || 0),
      Unit: r.unit || "",
      Pengaju: r.submitter_name || "",
      PengajuID: r.submitter_id || "",
      Status: r.status || "Masuk",
      Riwayat: r.history || "",
      TanggalBuat: r.created_date || "",
      tenggat: r.due_date || "",
      lampiran: Array.isArray(r.attachments) ? r.attachments : [],
      dasarPersetujuan: r.approval_basis || "",
      entitas: r.entity || "PT HOLDING (induk)",
    };
  }

  function mapAbsenRow(r) {
    if (!r) return r;
    const dist = r.distance_m != null ? Number(r.distance_m) : null;
    const isOut = Boolean(
      r.outside_office ||
      (dist != null && dist > 300) ||
      (r.work_mode && r.work_mode !== "WFO Kantor Pusat") ||
      /luar kantor|remote|wfh|dinas|lapangan/i.test(String(r.location || ""))
    );
    return {
      ID: r.code || r.id,
      _uuid: r.id,
      Tanggal: r.att_date || "",
      Jam: r.att_time || "",
      Nama: r.employee_name || "",
      UserID: r.user_code || r.user_id || "",
      Jenis: r.kind || "in",
      Lokasi: r.location || "",
      LocationNote: r.location_note || "",
      WorkMode: r.work_mode || (isOut ? "Luar Kantor / Remote" : "WFO Kantor Pusat"),
      OutsideOffice: isOut,
      Lat: r.lat,
      Lng: r.lng,
      JarakMeter: dist,
      FaceDigest: r.face_digest || "",
      LivenessScore: r.liveness_score != null ? Number(r.liveness_score) : null,
      SecondFactorType: r.second_factor_type || "",
      VoicePhrase: r.voice_phrase || "",
      Metode: r.method || "",
      StatusVerifikasi: r.status || "Menunggu",
      DiverifikasiOleh: r.verified_by || "",
    };
  }

  function mapAuditRow(r) {
    if (!r) return r;
    const oldStr = r.old_value != null ? (typeof r.old_value === "string" ? r.old_value : JSON.stringify(r.old_value)) : "";
    const newStr = r.new_value != null ? (typeof r.new_value === "string" ? r.new_value : JSON.stringify(r.new_value)) : "";
    return {
      Waktu: r.created_at || "",
      Siapa: r.actor_name || (r.metadata && r.metadata.actor_name) || r.user_id || "Sistem",
      Aksi: r.action || "",
      Modul: r.entity_type || "",
      objekId: r.entity_id || (r.metadata && r.metadata.entity_ref) || "",
      nilaiLama: oldStr,
      nilaiBaru: newStr,
      Sebelum: oldStr,
      Sesudah: newStr,
      prevHash: r.hash_prev || "",
      hash: r.hash_curr || "",
    };
  }

  let cachedProfiles = null;
  async function loadLiveProfiles(token) {
    const d = await apiFetch("GET", "/api/auth/profiles", undefined, token);
    if (Array.isArray(d.profiles)) {
      cachedProfiles = d.profiles;
      return d.profiles;
    }
    return [];
  }

  async function resolveEmailForId(idOrEmail) {
    const raw = String(idOrEmail || "").trim();
    if (raw.includes("@")) return raw.toLowerCase();
    const list = cachedProfiles || (await loadLiveProfiles("").catch(() => []));
    const match = (list || []).find((x) => String(x.ID || "").toUpperCase() === raw.toUpperCase());
    if (match && match.Email && !String(match.Email).includes("***")) return String(match.Email).toLowerCase();
    return raw;
  }

  function setModeNote(modeText) {
    try {
      sessionStorage.setItem("kai_backend_mode_v1", modeText);
      window.dispatchEvent(new CustomEvent("kai-backend-mode", { detail: { mode: modeText } }));
    } catch (_) {}
  }

  async function dispatchSupabase(route, token, p) {
    p = p || {};

    // Public profile directory (live Postgres)
    if (route === "auth.profiles") {
      try {
        const list = await loadLiveProfiles(token);
        if (list.length) {
          setModeNote("Supabase Live Postgres (" + list.length + " Profil)");
          return list;
        }
      } catch (_) {}
      return callLocal("api", route, token, p);
    }

    // Live OTP Request (Postgres + Email SA / In-App DB Preview)
    if (route === "auth.otpRequest") {
      try {
        const res = await apiFetch("POST", "/api/auth/send-otp", {
          email: String(p.email || "").trim().toLowerCase(),
          id: p.id ? String(p.id).trim() : undefined,
          type: "email",
        });
        setModeNote(res.delivery === "in-app-db" ? "Supabase Live Postgres (OTP Portal)" : "Supabase Live (OTP Email)");
        return {
          ok: true,
          delivery: res.delivery === "in-app-db" ? "preview" : (res.delivery || "email"),
          maskedEmail: res.maskedEmail || String(p.email || "").replace(/(^.).*(@.*$)/, "$1***$2"),
          expiresInSec: res.expiresInSec || 300,
          previewOtp: res.previewOtp || undefined,
        };
      } catch (e) {
        if (!e.status && localRunner) return callLocal("api", route, token, p);
        throw e;
      }
    }

    // Live OTP Verify
    if (route === "auth.login") {
      const email = String(p.email || "").trim().toLowerCase();
      try {
        const res = await apiFetch("POST", "/api/auth/verify-otp", {
          email,
          code: String(p.otp || ""),
          type: "email",
          faceImage: p.faceImage ? "[captured]" : undefined,
          lat: p.lat,
          lng: p.lng,
        });
        if (res && res.token && UUID_RE.test(res.token)) {
          const profile = res.user || { ID: res.user_id, Nama: email.split("@")[0], Email: email, Tier: "Staf" };
          saveSupaSession(res.token, profile);
          setModeNote("Supabase Live Postgres");
          return { token: res.token, user: profile, authMethod: res.authMethod || "supabase-otp" };
        }
      } catch (e) {
        if (!e.status && localRunner) return callLocal("api", route, token, p);
        throw e;
      }
    }

    // Live Manual Login (ID + Password + File ZIP Terenkripsi)
    if (route === "auth.loginManualZip" || route === "auth.loginManual") {
      try {
        const res = await apiFetch("POST", "/api/auth/login-manual", p || {});
        if (res && res.token && UUID_RE.test(res.token)) {
          const profile = res.user || { ID: p.id || res.user_id, Nama: p.id || "Pengguna", Tier: "Staf" };
          saveSupaSession(res.token, profile);
          setModeNote("Supabase Live Postgres (ID + Password + ZIP)");
          return { token: res.token, user: profile, authMethod: "manual-id-password-zip" };
        }
      } catch (e) {
        if (!e.status && p && p.offlineFallbackResult) return p.offlineFallbackResult;
        throw e;
      }
    }

    // Challenge suara acak & pusat kantor untuk Absensi Berlapis
    if (route === "absen.challenge") {
      return apiFetch("GET", "/api/absen/challenge", undefined, token);
    }

    // Live PIN Login (Email or ID e.g. OWN1/M1/M5/S7-01)
    if (route === "auth.loginPin") {
      const idOrEmail = await resolveEmailForId(p.email || p.id);
      try {
        const res = await apiFetch("POST", "/api/auth/login-pin", {
          id: p.id ? String(p.id).trim() : undefined,
          email: idOrEmail.includes("@") ? idOrEmail : undefined,
          pin: String(p.pin || ""),
          kendala: p.kendala,
        });
        if (res && res.token && UUID_RE.test(res.token)) {
          const profile = res.user || { ID: p.id || res.user_id, Nama: idOrEmail, Tier: "Staf" };
          saveSupaSession(res.token, profile);
          setModeNote("Supabase Live Postgres (PIN)");
          return { token: res.token, user: profile, authMethod: "supabase-pin", kendala: p.kendala };
        }
      } catch (e) {
        if (!e.status && localRunner) return callLocal("api", route, token, p);
        throw e;
      }
    }

    // Live Emergency / HMAC Card Login
    if (route === "auth.loginCard" || route === "auth.loginFile") {
      try {
        const payload = (p && (p.sig || p.card || p.kode)) ? p : { card: p };
        const res = await apiFetch("POST", "/api/auth/login-file", payload);
        if (res && res.token && UUID_RE.test(res.token)) {
          const profile = res.user || { ID: "OWN1", Nama: "Pemilik Utama", Tier: "Pemilik" };
          saveSupaSession(res.token, profile);
          setModeNote("Supabase Live Postgres (Kartu Akses)");
          return { token: res.token, user: profile, authMethod: res.authMethod || "supabase-card" };
        }
      } catch (e) {
        if (!e.status && localRunner) return callLocal("api", route, token, p);
        throw e;
      }
    }

    // Public Media CMS & Copy Hub
    if (route === "media.get") {
      return (await apiFetch("GET", "/api/media")).media;
    }

    const supaSess = getSupaSession(token);
    if (!supaSess) {
      if (String(token || "").startsWith("zip-offline-") && route === "auth.me") {
        try {
          const hs = JSON.parse(sessionStorage.getItem("hi_session_v1") || "null");
          if (hs && hs.user) return { user: hs.user };
        } catch (_) {}
      }
      return callLocal("api", route, token, p);
    }

    // Authenticated Live Supabase Session Routes
    switch (route) {
      case "auth.me":
        try {
          const me = await apiFetch("GET", "/api/auth/me", undefined, token);
          if (me && me.user) {
            saveSupaSession(token, me.user);
            return { user: me.user };
          }
        } catch (_) {}
        return { user: supaSess.user };

      case "auth.setPassword":
        return apiFetch("POST", "/api/auth/set-password", p || {}, token);

      case "auth.zipIssue":
        return apiFetch("POST", "/api/auth/zip-issue", p || {}, token);

      case "auth.logout":
        try { await apiFetch("POST", "/api/auth/logout", p || {}, token); } catch (_) {}
        dropSupaSession(token);
        return { ok: true };

      case "auth.cardIssue":
        return apiFetch("POST", "/api/auth/card-issue", p || {}, token);

      case "auth.cardRevoke":
        return apiFetch("POST", "/api/auth/card-revoke", p || {}, token);

      case "pengguna.list": {
        const d = await apiFetch("GET", "/api/karyawan?limit=300", undefined, token);
        return d.karyawan || [];
      }
      case "pengguna.create": {
        const d = await apiFetch("POST", "/api/karyawan", {
          id: p.id, nama: p.nama, email: p.email, role: p.tier, unit: p.unit, fase: p.fase, entitas: p.entitas, statusKepegawaian: p.statusKepegawaian,
        }, token);
        return d.user;
      }
      case "pengguna.email":
        return (await apiFetch("POST", "/api/karyawan/" + encodeURIComponent(p.id) + "/email", { email: p.email }, token)).user;
      case "pengguna.status":
        return (await apiFetch("POST", "/api/karyawan/" + encodeURIComponent(p.id) + "/status", { aktif: p.aktif }, token)).user;
      case "pengguna.offlinePin":
        return (await apiFetch("POST", "/api/karyawan/" + encodeURIComponent(p.id) + "/pin", { aktif: p.aktif, pin: p.pin }, token));

      case "tugas.list": {
        const d = await apiFetch("GET", "/api/tugas?limit=300", undefined, token);
        return (d.tugas || []).map((t) => ({
          ...t,
          prioritas: PRIO_TO_ID[t.prioritas] || t.prioritas || "Sedang",
          Status: TASK_ST_TO_ID[t.Status] || t.Status || "Belum",
        }));
      }
      case "tugas.create":
        return (await apiFetch("POST", "/api/tugas", p, token)).tugas;
      case "tugas.update": {
        const st = TASK_ST_FROM_ID[p.status] || p.status || "open";
        return (await apiFetch("POST", "/api/tugas/" + encodeURIComponent(p.id) + "/status", { status: st, evidence: p.buktiSelesai }, token)).tugas;
      }

      case "keuangan.list": {
        const qs = new URLSearchParams();
        if (p.entitas) qs.set("entitas", p.entitas);
        if (p.periode) qs.set("periode", p.periode);
        const d = await apiFetch("GET", "/api/keuangan" + (qs.toString() ? "?" + qs.toString() : ""), undefined, token);
        return (d.kas || []).map(mapCashRow);
      }
      case "keuangan.create":
        return mapCashRow((await apiFetch("POST", "/api/keuangan", p, token)).kas);
      case "keuangan.update": {
        const r = await apiFetch("POST", "/api/keuangan/" + encodeURIComponent(p.id) + "/status", { status: p.status, rekonsiliasi: p.rekonsiliasi }, token);
        return mapCashRow(r.kas);
      }

      case "periode.close":
        return apiFetch("POST", "/api/periode/close", { period: p.period || p.ym }, token);
      case "periode.reopen":
        return apiFetch("POST", "/api/periode/reopen", { period: p.period || p.ym }, token);

      case "intake.list":
        return ((await apiFetch("GET", "/api/intake", undefined, token)).intake || []).map(mapIntakeRow);
      case "intake.create":
        return mapIntakeRow((await apiFetch("POST", "/api/intake", p, token)).intake);
      case "intake.status":
        return mapIntakeRow((await apiFetch("POST", "/api/intake/" + encodeURIComponent(p.id) + "/status", { aksi: p.aksi, alasan: p.alasan, dasarPersetujuan: p.dasarPersetujuan }, token)).intake);

      case "absen.list":
        return ((await apiFetch("GET", "/api/absen", undefined, token)).absensi || []).map(mapAbsenRow);
      case "absen.submit": {
        const raw = (await apiFetch("POST", "/api/absen", p, token)).absensi;
        const res = mapAbsenRow(raw);
        if (res && supaSess && supaSess.user && supaSess.user.ID) {
          res.UserID = supaSess.user.ID;
          if (!res.Nama && supaSess.user.Nama) res.Nama = supaSess.user.Nama;
        }
        if (window.__KAI_PUSH_ATTENDANCE_ROW__) {
          window.__KAI_PUSH_ATTENDANCE_ROW__({ ...(raw || {}), ...(res || {}), user_code: (res && res.UserID) || (supaSess && supaSess.user && supaSess.user.ID) || "" });
        }
        if (window.__KAI_HOLDING_OS__) window.__KAI_HOLDING_OS__.refresh(false);
        return res;
      }
      case "absen.verify": {
        const vid = p._uuid || p.id;
        const res = mapAbsenRow((await apiFetch("POST", "/api/absen/" + encodeURIComponent(vid) + "/verify", { status: p.status }, token)).absensi);
        if (window.__KAI_HOLDING_OS__) window.__KAI_HOLDING_OS__.refresh(false);
        return res;
      }

      case "dokumen.list":
        return (await apiFetch("GET", "/api/documents", undefined, token)).documents || [];
      case "dokumen.create":
        return (await apiFetch("POST", "/api/documents", p, token)).document;

      case "audit.list": {
        const qs = p.modul ? "?modul=" + encodeURIComponent(p.modul) : "";
        return ((await apiFetch("GET", "/api/audit-trail" + qs, undefined, token)).audit || []).map(mapAuditRow);
      }
      case "audit.verify":
        return apiFetch("GET", "/api/audit/verify", undefined, token);
      case "audit.denials":
        return (await apiFetch("GET", "/api/audit/denials", undefined, token)).denials || [];

      case "registers.list": {
        const qs = p.type ? "?type=" + encodeURIComponent(p.type) : "";
        return apiFetch("GET", "/api/registers" + qs, undefined, token);
      }
      case "registers.save":
        return apiFetch("POST", "/api/registers", p, token);

      case "media.save":
        return (await apiFetch("POST", "/api/media", p, token)).media;

      case "finance.summary":
        return (await apiFetch("GET", "/api/finance/summary", undefined, token)).summary;
      case "finance.journals":
        return (await apiFetch("GET", "/api/finance/journals", undefined, token)).journals;
      case "finance.post":
        return apiFetch("POST", "/api/finance/post", p, token);
      case "finance.tagihan":
        return (await apiFetch("GET", "/api/finance/tagihan", undefined, token)).tagihan;
      case "finance.tagihanPay":
        return apiFetch("POST", "/api/finance/tagihan/" + encodeURIComponent(p.id) + "/pay", { amount: p.amount }, token);
      case "finance.pajak":
        return (await apiFetch("GET", "/api/finance/pajak", undefined, token)).faktur;
      case "finance.pajakCreate":
        return (await apiFetch("POST", "/api/finance/pajak", p, token)).faktur;
      case "finance.pajakStatus":
        return (await apiFetch("POST", "/api/finance/pajak/" + encodeURIComponent(p.id) + "/status", { status: p.status }, token)).faktur;
      case "finance.payroll": {
        const qs = p.search ? "?search=" + encodeURIComponent(p.search) : "";
        return apiFetch("GET", "/api/finance/payroll" + qs, undefined, token);
      }
      case "finance.payrollApprove":
        return apiFetch("POST", "/api/finance/payroll/approve", p, token);
      case "finance.deposits":
        return apiFetch("GET", "/api/finance/deposits", undefined, token);
      case "finance.depositCreate":
        return apiFetch("POST", "/api/finance/deposits", p, token);
      case "finance.bankRecon":
        return apiFetch("POST", "/api/finance/bank-recon", p, token);
      case "finance.procurement":
        return (await apiFetch("GET", "/api/finance/procurement", undefined, token)).orders;
      case "finance.procurementCreate":
        return (await apiFetch("POST", "/api/finance/procurement", p, token)).order;
      case "finance.procurementApprove":
        return (await apiFetch("POST", "/api/finance/procurement/" + encodeURIComponent(p.id) + "/approve", p, token)).order;
      case "copyhub.orders":
        return apiFetch("GET", "/api/copyhub/orders", undefined, token);

      case "system.status":
        return (await apiFetch("GET", "/api/system-status", undefined, token)).status;

      case "ai.assist":
        return apiFetch("POST", "/api/ai/assist", p, token);

      case "connectors.list":
        return apiFetch("GET", "/api/connectors", undefined, token);

      case "connectors.action":
        return apiFetch("POST", "/api/connectors/action", p, token);

      case "connectors.webhook":
        return apiFetch("POST", "/api/connectors/webhook", p, token);

      case "config.list":
        return apiFetch("GET", "/api/config", undefined, token);

      case "config.save":
        return apiFetch("POST", "/api/config", p, token);

      case "backup.toDrive":
      case "backup.create":
      case "backup.test":
        return (await apiFetch("POST", "/api/workspace", { op: route, payload: p || {} }, token)).data;

      case "dashboard.get": {
        const uRole = String((supaSess.user && supaSess.user.Tier) || "Staf");
        const seeCash = ["Pemilik", "Manajemen", "Staf", "Auditor"].includes(uRole);
        const seeAudit = ["Pemilik", "Manajemen", "Auditor"].includes(uRole);
        const [intakeRes, tugasRes, kasRes, absenRes, docRes, auditRes, finRes] = await Promise.all([
          seeCash ? apiFetch("GET", "/api/intake", undefined, token).catch(() => ({ intake: [] })) : Promise.resolve({ intake: [] }),
          apiFetch("GET", "/api/tugas?limit=300", undefined, token).catch(() => ({ tugas: [] })),
          seeCash ? apiFetch("GET", "/api/keuangan?limit=500", undefined, token).catch(() => ({ kas: [] })) : Promise.resolve({ kas: [] }),
          seeCash ? apiFetch("GET", "/api/absen", undefined, token).catch(() => ({ absensi: [] })) : Promise.resolve({ absensi: [] }),
          apiFetch("GET", "/api/documents", undefined, token).catch(() => ({ documents: [] })),
          seeAudit ? apiFetch("GET", "/api/audit-trail", undefined, token).catch(() => ({ audit: [] })) : Promise.resolve({ audit: [] }),
          seeCash ? apiFetch("GET", "/api/finance/summary", undefined, token).catch(() => null) : Promise.resolve(null),
        ]);
        const intake = intakeRes.intake || [];
        const tugas = tugasRes.tugas || [];
        const kas = (kasRes.kas || []).map(mapCashRow);
        const absen = absenRes.absensi || [];
        const docs = docRes.documents || [];
        const audits = (auditRes.audit || []).slice(0, 8).map(mapAuditRow);
        const inc = kas.filter((x) => x.Jenis === "Masuk" && x.Status !== "Ditolak").reduce((s, x) => s + Number(x.Nominal || 0), 0);
        const out = kas.filter((x) => x.Jenis === "Keluar" && x.Status !== "Ditolak").reduce((s, x) => s + Number(x.Nominal || 0), 0);
        const ym = new Date().toISOString().slice(0, 7);
        const biayaBln = kas.filter((x) => x.Jenis === "Keluar" && (x.Tanggal || "").slice(0, 7) === ym).reduce((s, x) => s + Number(x.Nominal || 0), 0);
        const gl = finRes && finRes.summary ? finRes.summary.totals : null;
        return {
          antrean: seeCash ? intake.filter((x) => ["Masuk", "Direview", "Perlu Info"].includes(x.status)).length : 0,
          totalIntake: seeCash ? intake.length : 0,
          tugasSelesai: tugas.filter((x) => x.Status === "done" || x.Status === "Selesai").length,
          totalTugas: tugas.length,
          saldoKas: seeCash ? (gl ? gl.kas1101 : (inc - out)) : 0,
          totalMasuk: seeCash ? (gl ? gl.pendapatanOperasional : inc) : 0,
          totalKeluar: seeCash ? (gl ? gl.bebanOperasional : out) : 0,
          biayaBulanIni: seeCash ? biayaBln : 0,
          dcptTarget: seeCash ? 1462200000 : 0,
          entitasAktif: 7,
          dokumen: docs.length,
          absenMenunggu: seeCash ? absen.filter((x) => String(x.status || "").toLowerCase().includes("menunggu")).length : 0,
          auditTerakhir: audits,
          financeSummary: finRes && finRes.summary ? finRes.summary : null,
          terbatas: !seeCash,
        };
      }

      default:
        return callLocal("api", route, token, p);
    }
  }

  async function dispatchWorkspaceSupabase(op, token, payload) {
    if (!getSupaSession(token)) {
      return callLocal("workspace", op, token, payload);
    }
    const res = await apiFetch("POST", "/api/workspace", { op, payload: payload || {} }, token);
    return res.data !== undefined ? res.data : res;
  }

  function makeBridgedRunner(ok, fail) {
    return {
      withSuccessHandler(cb) { return makeBridgedRunner(cb, fail); },
      withFailureHandler(cb) { return makeBridgedRunner(ok, cb); },
      gasApiDispatch(route, token, payload) {
        dispatchSupabase(route, token, payload)
          .then((res) => { if (ok) ok(res); })
          .catch((err) => { if (fail) fail(err instanceof Error ? err : new Error(String(err))); });
      },
      gasWorkspaceDispatch(op, token, payload) {
        dispatchWorkspaceSupabase(op, token, payload)
          .then((res) => { if (ok) ok(res); })
          .catch((err) => { if (fail) fail(err instanceof Error ? err : new Error(String(err))); });
      },
    };
  }

  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = makeBridgedRunner(null, null);
  window.__KAI_DEMO_SHIM__ = false;
  window.__KAI_SUPABASE_BRIDGE__ = {
    apiBase: API_BASE,
    checkHealth,
    getHealth: () => healthState,
    isLiveSession: (tok) => Boolean(getSupaSession(tok)),
    getActiveToken: getAnyActiveToken,
    getActiveSession: () => {
      const t = getAnyActiveToken();
      return t ? { token: t, ...(getSupaSession(t) || {}) } : null;
    },
    apiFetch,
    dispatchSupabase,
  };

  if (typeof window !== "undefined") {
    setTimeout(() => { checkHealth(true); }, 80);
  }
})();
