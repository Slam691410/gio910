/* GIO910 v4.7 — Biometric Enrollment (128-D Face + MFCC Voiceprint) & e-KYC (KTP/KIA/Passport + Gemini Hybrid) */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  const FACE_API_CDN = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js";
  const FACE_MODEL_BASE = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

  function getSec() {
    return window.__KAI_SECURITY__ || null;
  }

  function getSession() {
    try {
      const hs = JSON.parse(sessionStorage.getItem("hi_session_v1") || "null");
      if (hs && hs.token && hs.user && (!hs.exp || Date.now() < hs.exp)) {
        return { token: hs.token, user: hs.user };
      }
    } catch (_) {}
    try {
      const cs = JSON.parse(localStorage.getItem("kai_copyhub_admin_sess_v1") || "null");
      if (cs && cs.token && cs.user) {
        return { token: cs.token, user: cs.user };
      }
    } catch (_) {}
    if (window.__KAI_ACTIVE_SUPA_TOKEN__ && window.__KAI_ACTIVE_SUPA_USER__) {
      return { token: window.__KAI_ACTIVE_SUPA_TOKEN__, user: window.__KAI_ACTIVE_SUPA_USER__ };
    }
    try {
      for (const k of ["kai_session", "gio910_session", "kaiSession", "KAI_SESSION"]) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const p = JSON.parse(raw);
        if (p && (p.token || (p.user && p.user.token))) {
          return {
            token: p.token || p.user.token,
            user: p.user || p,
          };
        }
      }
    } catch (_) {}
    try {
      const b = window.__KAI_SUPABASE_BRIDGE__;
      if (b && typeof b.getActiveToken === "function") {
        const t = b.getActiveToken();
        if (t) {
          const u = typeof b.getSessionUser === "function" ? b.getSessionUser() : null;
          return { token: t, user: u || {} };
        }
      }
    } catch (_) {}
    return null;
  }

  function getRole() {
    const s = getSession();
    const u = (s && s.user) || {};
    return String(u.Tier || u.role || u.tier || "").trim();
  }

  function isReviewerRole() {
    const r = getRole();
    return r === "Pemilik" || r === "Manajemen";
  }

  async function apiCall(method, path, body, tokenOverride) {
    const s = getSession();
    const tok = tokenOverride || (s && s.token) || "";
    const headers = { "Content-Type": "application/json" };
    if (tok) headers["x-gio-session"] = tok;
    const isLocalHost =
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1" ||
      location.protocol === "file:";
    const sec = getSec();
    const base = !isLocalHost ? "" : (sec && sec.API_BASE) || "https://dttclgkjfiwcovvqrckw.supabase.co/functions/v1/gio910-api";
    if (base) {
      const ak = String(
        (window.__KAI_HUB_PARAMS__ && window.__KAI_HUB_PARAMS__.supabaseAnonKey) ||
          window.__KAI_SUPABASE_ANON_KEY__ ||
          ""
      ).trim();
      if (ak) {
        headers["apikey"] = ak;
        headers["Authorization"] = "Bearer " + ak;
      }
    }
    const url = (base ? base.replace(/\/+$/, "") : "") + path;
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined && method !== "GET" ? JSON.stringify(body) : undefined,
    });
    const txt = await res.text();
    let data;
    try {
      data = JSON.parse(txt);
    } catch {
      data = { raw: txt };
    }
    if (!res.ok) {
      throw new Error((data && (data.error || data.message)) || `HTTP ${res.status}`);
    }
    return data;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function maskPreview(docType, raw) {
    const clean = String(raw || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!clean) return "—";
    if (clean.length >= 10) return clean.slice(0, 4) + "•".repeat(clean.length - 8) + clean.slice(-4);
    if (clean.length >= 5) return clean.slice(0, 2) + "•".repeat(clean.length - 4) + clean.slice(-2);
    return "•".repeat(clean.length);
  }

  // =========================================================================
  // 1. FACE BIOMETRIC ENGINE (@vladmandic/face-api 128-D Descriptor)
  // =========================================================================
  let faceModelPromise = null;
  async function ensureFaceModels() {
    if (faceModelPromise) return faceModelPromise;
    faceModelPromise = (async () => {
      if (!window.faceapi) {
        await new Promise((resolve, reject) => {
          const existing = document.querySelector('script[data-kai-faceapi="1"]');
          if (existing) {
            if (window.faceapi) return resolve();
            existing.addEventListener("load", resolve, { once: true });
            existing.addEventListener("error", () => reject(new Error("Gagal memuat library biometrik wajah.")), { once: true });
            return;
          }
          const sc = document.createElement("script");
          sc.src = FACE_API_CDN;
          sc.async = true;
          sc.crossOrigin = "anonymous";
          sc.setAttribute("data-kai-faceapi", "1");
          sc.onload = () => resolve();
          sc.onerror = () => reject(new Error("Gagal memuat @vladmandic/face-api dari CDN."));
          document.head.appendChild(sc);
        });
      }
      const fa = window.faceapi;
      if (!fa) throw new Error("Objek faceapi tidak tersedia setelah pemuatan skrip.");
      await Promise.all([
        fa.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_BASE),
        fa.nets.faceLandmark68TinyNet.loadFromUri(FACE_MODEL_BASE),
        fa.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_BASE),
      ]);
      return fa;
    })().catch((e) => {
      faceModelPromise = null;
      throw e;
    });
    return faceModelPromise;
  }

  function normalizeL2(vec) {
    const arr = Array.from(vec, (x) => Number(x));
    let sq = 0;
    for (let i = 0; i < arr.length; i++) sq += arr[i] * arr[i];
    const norm = Math.sqrt(sq);
    if (!Number.isFinite(norm) || norm < 1e-6) return null;
    return arr.map((x) => Number((x / norm).toFixed(6)));
  }

  function euclideanDist(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 99;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const d = Number(a[i]) - Number(b[i]);
      sum += d * d;
    }
    return Math.sqrt(sum);
  }

  function faceDistanceToScore(d) {
    if (!Number.isFinite(d) || d > 2) return 0;
    const raw = (1 - Math.max(0, d - 0.15) / 0.85) * 100;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  async function loadCanvasFromSource(srcOrEl) {
    if (srcOrEl instanceof HTMLCanvasElement) return srcOrEl;
    if (srcOrEl instanceof HTMLVideoElement) {
      const c = document.createElement("canvas");
      c.width = srcOrEl.videoWidth || 480;
      c.height = srcOrEl.videoHeight || 360;
      c.getContext("2d").drawImage(srcOrEl, 0, 0, c.width, c.height);
      return c;
    }
    if (typeof srcOrEl === "string") {
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error("Gagal membaca gambar wajah."));
        i.src = srcOrEl;
      });
      const c = document.createElement("canvas");
      const maxDim = 960;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      c.width = Math.max(120, Math.round(img.width * scale));
      c.height = Math.max(120, Math.round(img.height * scale));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      return c;
    }
    throw new Error("Sumber gambar tidak didukung.");
  }

  async function extractLiveFaceDescriptor(srcOrEl) {
    const fa = await ensureFaceModels();
    const canvas = await loadCanvasFromSource(srcOrEl);
    for (const opts of [
      new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }),
      new fa.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.25 }),
    ]) {
      const det = await fa.detectSingleFace(canvas, opts).withFaceLandmarks(true).withFaceDescriptor();
      if (det && det.descriptor && det.descriptor.length === 128) {
        const emb = normalizeL2(det.descriptor);
        if (emb) {
          return {
            ok: true,
            embedding: emb,
            score: Number((det.detection.score || 0).toFixed(3)),
            box: det.detection.box,
          };
        }
      }
    }
    return { ok: false, embedding: null, score: 0 };
  }

  function cropAndRotateCanvas(src, sx, sy, sw, sh, angleDeg = 0, scale = 1) {
    const outW = Math.round((angleDeg % 180 === 0 ? sw : sh) * scale);
    const outH = Math.round((angleDeg % 180 === 0 ? sh : sw) * scale);
    const c = document.createElement("canvas");
    c.width = Math.max(160, outW);
    c.height = Math.max(160, outH);
    const ctx = c.getContext("2d");
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((angleDeg * Math.PI) / 180);
    ctx.drawImage(src, sx, sy, sw, sh, (-sw * scale) / 2, (-sh * scale) / 2, sw * scale, sh * scale);
    return c;
  }

  async function extractDocFaceDescriptor(docDataUrl) {
    const fa = await ensureFaceModels();
    const base = await loadCanvasFromSource(docDataUrl);
    const W = base.width;
    const H = base.height;
    const candidates = [
      base,
      // KTP portrait zone (right side)
      cropAndRotateCanvas(base, W * 0.52, H * 0.12, W * 0.46, H * 0.78, 0, 1.5),
      // Passport / KIA portrait zone (left side)
      cropAndRotateCanvas(base, W * 0.02, H * 0.12, W * 0.48, H * 0.78, 0, 1.5),
      // Rotations in case document photo was shot sideways
      cropAndRotateCanvas(base, 0, 0, W, H, 90, 1),
      cropAndRotateCanvas(base, 0, 0, W, H, 270, 1),
    ];
    for (const c of candidates) {
      const det = await fa
        .detectSingleFace(c, new fa.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.25 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();
      if (det && det.descriptor && det.descriptor.length === 128) {
        const emb = normalizeL2(det.descriptor);
        if (emb) {
          return { ok: true, embedding: emb, score: Number((det.detection.score || 0).toFixed(3)) };
        }
      }
    }
    return { ok: false, embedding: null, score: 0 };
  }

  async function compressImageFile(file, maxDim = 1100, quality = 0.84) {
    const url = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result || ""));
      r.onerror = () => rej(new Error("Gagal membaca berkas gambar."));
      r.readAsDataURL(file);
    });
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Berkas gambar tidak valid."));
      i.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(160, Math.round(img.width * scale));
    const h = Math.max(160, Math.round(img.height * scale));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    return c.toDataURL("image/jpeg", quality);
  }

  // =========================================================================
  // 2. PURE-JS VOICEPRINT EXTRACTOR (16-D MFCC + PITCH F0 + SPECTRAL CENTROID)
  // =========================================================================
  function hzToMel(hz) {
    return 2595 * Math.log10(1 + hz / 700);
  }
  function melToHz(mel) {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  function buildMelFilterbank(fftSize, sampleRate, numFilters = 24, minHz = 80, maxHz = 4000) {
    const numBins = fftSize / 2;
    const nyquist = sampleRate / 2;
    const hiHz = Math.min(maxHz, nyquist - 50);
    const melMin = hzToMel(minHz);
    const melMax = hzToMel(hiHz);
    const melPts = [];
    for (let i = 0; i < numFilters + 2; i++) {
      melPts.push(melToHz(melMin + (i / (numFilters + 1)) * (melMax - melMin)));
    }
    const binPts = melPts.map((hz) => Math.floor(((fftSize + 1) * hz) / sampleRate));
    const filters = [];
    for (let m = 1; m <= numFilters; m++) {
      const f = new Float32Array(numBins);
      const a = binPts[m - 1];
      const b = binPts[m];
      const c = binPts[m + 1];
      for (let k = Math.max(0, a); k < Math.min(numBins, b); k++) {
        f[k] = (k - a) / Math.max(1, b - a);
      }
      for (let k = Math.max(0, b); k <= Math.min(numBins - 1, c); k++) {
        f[k] = (c - k) / Math.max(1, c - b);
      }
      filters.push(f);
    }
    return filters;
  }

  function estimatePitchHz(timeBuf, sampleRate) {
    const N = timeBuf.length;
    const minLag = Math.max(12, Math.floor(sampleRate / 340));
    const maxLag = Math.min(Math.floor(N / 2), Math.floor(sampleRate / 75));
    let bestLag = 0;
    let bestCorr = 0;
    let norm0 = 0;
    for (let i = 0; i < N - maxLag; i++) norm0 += timeBuf[i] * timeBuf[i];
    if (norm0 < 1e-6) return 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let c = 0;
      for (let i = 0; i < N - maxLag; i++) c += timeBuf[i] * timeBuf[i + lag];
      const r = c / norm0;
      if (r > bestCorr) {
        bestCorr = r;
        bestLag = lag;
      }
    }
    return bestCorr > 0.32 && bestLag > 0 ? sampleRate / bestLag : 0;
  }

  function createVoiceFrameCollector(fftSize = 1024, sampleRate = 48000) {
    const filters = buildMelFilterbank(fftSize, sampleRate, 24, 80, 4000);
    const numBins = fftSize / 2;
    const timeBuf = new Float32Array(fftSize);
    const freqDbBuf = new Float32Array(numBins);
    const mfccAccum = new Array(16).fill(0);
    let pitchAccum = 0;
    let pitchCount = 0;
    let centroidAccum = 0;
    let zcrAccum = 0;
    let energyAccum = 0;
    let voicedFrames = 0;

    return {
      pushAnalyser(analyser) {
        if (!analyser) return;
        analyser.getFloatTimeDomainData(timeBuf);
        analyser.getFloatFrequencyData(freqDbBuf);

        let sumSq = 0;
        let zc = 0;
        for (let i = 0; i < timeBuf.length; i++) {
          sumSq += timeBuf[i] * timeBuf[i];
          if (i > 0 && ((timeBuf[i - 1] >= 0 && timeBuf[i] < 0) || (timeBuf[i - 1] < 0 && timeBuf[i] >= 0))) zc++;
        }
        const rms = Math.sqrt(sumSq / timeBuf.length);
        if (rms < 0.008) return; // Abaikan hening

        voicedFrames++;
        energyAccum += rms;
        zcrAccum += zc / timeBuf.length;

        const pitch = estimatePitchHz(timeBuf, sampleRate);
        if (pitch > 60 && pitch < 360) {
          pitchAccum += pitch;
          pitchCount++;
        }

        // Convert dB spectrum to power + spectral centroid
        const mag = new Float32Array(numBins);
        let num = 0;
        let den = 0;
        const binHz = sampleRate / fftSize;
        for (let k = 0; k < numBins; k++) {
          const db = Number.isFinite(freqDbBuf[k]) ? freqDbBuf[k] : -100;
          const m = Math.pow(10, Math.max(-100, db) / 20);
          mag[k] = m * m;
          num += k * binHz * m;
          den += m;
        }
        if (den > 1e-9) centroidAccum += num / den;

        // 24 Mel filterbank log energies -> DCT-II coefficients c1..c16
        const logMel = new Float32Array(filters.length);
        for (let m = 0; m < filters.length; m++) {
          let e = 1e-9;
          const flt = filters[m];
          for (let k = 0; k < numBins; k++) e += mag[k] * flt[k];
          logMel[m] = Math.log(e);
        }
        const M = filters.length;
        for (let n = 1; n <= 16; n++) {
          let sum = 0;
          for (let m = 0; m < M; m++) {
            sum += logMel[m] * Math.cos((Math.PI * n * (m + 0.5)) / M);
          }
          mfccAccum[n - 1] += sum;
        }
      },
      getVoicedCount() {
        return voicedFrames;
      },
      finalize(sampleCount = 1) {
        if (voicedFrames < 1) return null;
        const avgMfcc = mfccAccum.map((x) => x / voicedFrames);
        let nSq = 0;
        for (let i = 0; i < avgMfcc.length; i++) nSq += avgMfcc[i] * avgMfcc[i];
        const norm = Math.sqrt(nSq) || 1;
        return {
          mfcc16: avgMfcc.map((x) => Number((x / norm).toFixed(6))),
          pitchHz: pitchCount ? Number((pitchAccum / pitchCount).toFixed(2)) : 140,
          spectralCentroid: Number((centroidAccum / voicedFrames).toFixed(2)),
          zcr: Number((zcrAccum / voicedFrames).toFixed(5)),
          energyAvg: Number((energyAccum / voicedFrames).toFixed(5)),
          sampleCount,
        };
      },
    };
  }

  function averageVoiceProfiles(profiles) {
    const valid = (profiles || []).filter((p) => p && Array.isArray(p.mfcc16) && p.mfcc16.length === 16);
    if (!valid.length) return null;
    const avg = new Array(16).fill(0);
    let pitch = 0,
      cent = 0,
      zcr = 0,
      en = 0;
    for (const p of valid) {
      for (let i = 0; i < 16; i++) avg[i] += Number(p.mfcc16[i] || 0);
      pitch += Number(p.pitchHz || 140);
      cent += Number(p.spectralCentroid || 800);
      zcr += Number(p.zcr || 0.05);
      en += Number(p.energyAvg || 0.02);
    }
    let nSq = 0;
    for (let i = 0; i < 16; i++) {
      avg[i] /= valid.length;
      nSq += avg[i] * avg[i];
    }
    const norm = Math.sqrt(nSq) || 1;
    return {
      mfcc16: avg.map((x) => Number((x / norm).toFixed(6))),
      pitchHz: Number((pitch / valid.length).toFixed(2)),
      spectralCentroid: Number((cent / valid.length).toFixed(2)),
      zcr: Number((zcr / valid.length).toFixed(5)),
      energyAvg: Number((en / valid.length).toFixed(5)),
      sampleCount: valid.length,
    };
  }

  // =========================================================================
  // 3. CSS & SELF-SERVICE BIOMETRIC + e-KYC WIZARD MODAL
  // =========================================================================
  function ensureCss() {
    if (document.getElementById("kai-kyc-v47-css")) return;
    const s = document.createElement("style");
    s.id = "kai-kyc-v47-css";
    s.textContent = `
      .kai-kyc-modal{position:fixed;inset:0;z-index:99992;background:rgba(4,9,20,.84);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:12px}
      .kai-kyc-modal.is-open{display:flex}
      .kai-kyc-card{width:100%;max-width:740px;max-height:92vh;overflow:auto;background:#0e172a;border:1px solid #2b4370;border-radius:16px;color:#e8eefc;box-shadow:0 24px 64px rgba(0,0,0,.65);font-family:system-ui,-apple-system,sans-serif}
      .kai-kyc-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #1e3054;position:sticky;top:0;background:#0e172a;z-index:2}
      .kai-kyc-head h3{margin:0;font-size:15.5px;font-weight:800;color:#7dd3fc}
      .kai-kyc-body{padding:16px 18px;font-size:13px;line-height:1.5;display:flex;flex-direction:column;gap:12px}
      .kai-kyc-tabs{display:flex;gap:8px;flex-wrap:wrap}
      .kai-kyc-tab{flex:1;min-width:140px;background:#131f36;border:1px solid #2b4370;color:#cfe0ff;border-radius:10px;padding:9px 10px;font-weight:700;font-size:12px;cursor:pointer;text-align:center}
      .kai-kyc-tab.is-active{background:#12324f;border-color:#38bdf8;color:#fff}
      .kai-kyc-box{background:#131f36;border:1px solid #22365c;border-radius:12px;padding:13px}
      .kai-kyc-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700}
      .kai-kyc-pill.ok{background:#0e2b23;border:1px solid #175c49;color:#6ee7b7}
      .kai-kyc-pill.warn{background:#2a2113;border:1px solid #5b4a17;color:#fbbf24}
      .kai-kyc-pill.err{background:#2b1414;border:1px solid #5b2c2c;color:#fca5a5}
      .kai-kyc-pill.muted{background:#111c33;border:1px solid #273c66;color:#9fb0d0}
      .kai-kyc-btn{background:#38bdf8;color:#06222f;border:0;border-radius:9px;padding:9px 13px;font-weight:800;font-size:12.5px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px}
      .kai-kyc-btn:disabled{opacity:.45;cursor:not-allowed}
      .kai-kyc-btn.ok{background:#34d399;color:#05261d}
      .kai-kyc-btn.warn{background:#fbbf24;color:#1c1305}
      .kai-kyc-btn.err{background:#ef4444;color:#fff}
      .kai-kyc-btn.ghost{background:#182845;color:#e8eefc;border:1px solid #2b4370}
      .kai-kyc-inp{width:100%;box-sizing:border-box;background:#08101e;border:1px solid #2b4370;border-radius:8px;padding:8px 11px;color:#fff;font-size:13px}
      .kai-kyc-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      @media(max-width:640px){.kai-kyc-grid2{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  let cachedMyKyc = null;
  let cachedPendingCount = 0;

  async function refreshMyStatus() {
    const s = getSession();
    if (!s || !s.token) {
      cachedMyKyc = null;
      cachedPendingCount = 0;
      updateBadges();
      return null;
    }
    try {
      const r = await apiCall("GET", "/api/kyc/me", undefined, s.token);
      cachedMyKyc = r.kyc || null;
      if (isReviewerRole()) {
        try {
          const lr = await apiCall("GET", "/api/kyc/list?status=pending_review", undefined, s.token);
          cachedPendingCount = (lr && lr.counts && lr.counts.pending_review) || 0;
        } catch (_) {}
      }
      updateBadges();
      return r;
    } catch (_) {
      return null;
    }
  }

  function statusPillHtml(kyc) {
    if (!kyc) return '<span class="kai-kyc-pill muted">Belum Login</span>';
    const st = kyc.kycStatus || "unregistered";
    if (st === "verified") return '<span class="kai-kyc-pill ok">✓ e-KYC Terverifikasi</span>';
    if (st === "pending_review") return '<span class="kai-kyc-pill warn">⏳ Menunggu Review HR</span>';
    if (st === "rejected") return '<span class="kai-kyc-pill err">✕ e-KYC Ditolak</span>';
    return '<span class="kai-kyc-pill warn">⚠️ Belum KYC (Transisi)</span>';
  }

  async function openKycEnrollmentModal(initialTab = "face") {
    const sess = getSession();
    if (!sess || !sess.token) {
      alert("Silakan login akun terlebih dahulu untuk mendaftarkan Biometrik & e-KYC.");
      return;
    }
    ensureCss();
    const existing = document.getElementById("kai-kyc-wizard-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "kai-kyc-wizard-modal";
    modal.className = "kai-kyc-modal is-open";
    modal.innerHTML = `
      <div class="kai-kyc-card">
        <div class="kai-kyc-head">
          <h3>🪪 Biometrik Wajah, Suara &amp; e-KYC (KTP / KIA / Passport)</h3>
          <button type="button" id="kyc-wiz-close" class="kai-kyc-btn ghost" style="padding:4px 10px">✕</button>
        </div>
        <div class="kai-kyc-body">
          <div id="kyc-wiz-status-bar" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">Memuat status biometrik Anda…</div>
          <div class="kai-kyc-tabs">
            <button type="button" id="kyc-tab-face" class="kai-kyc-tab">1. Wajah 128-D (Live)</button>
            <button type="button" id="kyc-tab-voice" class="kai-kyc-tab">2. Voiceprint Suara</button>
            <button type="button" id="kyc-tab-doc" class="kai-kyc-tab">3. KTP / KIA / Passport</button>
          </div>

          <div id="kyc-panel-face" class="kai-kyc-box" style="display:none">
            <b style="color:#7dd3fc;display:block;margin-bottom:6px">Langkah 1 — Daftar Wajah Referensi (128-D Embedding + Anti-Spoof)</b>
            <div style="font-size:12px;color:#9fb0d0;margin-bottom:8px">Wajah referensi digunakan untuk mencocokkan foto KTP/KIA/Passport &amp; memverifikasi identitas Anda 1:1 saat absen harian.</div>
            <div style="position:relative;height:210px;background:#08101e;border-radius:10px;overflow:hidden;border:1px solid #2b4370;display:flex;align-items:center;justify-content:center">
              <video id="kyc-f-vid" autoplay playsinline muted style="display:none;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)"></video>
              <img id="kyc-f-img" style="display:none;width:100%;height:100%;object-fit:cover" alt="Selfie Biometrik" />
              <div id="kyc-f-ph" style="color:#9fb0d0;font-size:12px;text-align:center;padding:12px">Klik <b>Aktifkan Kamera</b> lalu gerakkan wajah sedikit hingga liveness &amp; detektor 128-D siap.</div>
            </div>
            <div id="kyc-f-msg" style="font-size:12px;color:#fbbf24;margin-top:7px">Menunggu kamera…</div>
            <div style="display:flex;gap:8px;margin-top:9px;flex-wrap:wrap">
              <button type="button" id="kyc-face-cam-on" class="kai-kyc-btn">📷 Aktifkan Kamera</button>
              <button type="button" id="kyc-face-snap" class="kai-kyc-btn ok" style="display:none">✓ Kunci Wajah 128-D</button>
              <button type="button" id="kyc-face-retake" class="kai-kyc-btn ghost" style="display:none">↺ Ulangi</button>
              <button type="button" id="kyc-face-save" class="kai-kyc-btn" style="display:none">💾 Simpan Biometrik Wajah</button>
            </div>
          </div>

          <div id="kyc-panel-voice" class="kai-kyc-box" style="display:none">
            <b style="color:#7dd3fc;display:block;margin-bottom:6px">Langkah 2 — Kalibrasi Voiceprint Suara (2 Sampel MFCC 16-D)</b>
            <div style="font-size:12px;color:#9fb0d0;margin-bottom:10px">Rekam 2 frasa singkat agar sistem mengenali profil frekuensi &amp; nada suara asli Anda (tahan terhadap rekaman ulang).</div>
            <div class="kai-kyc-grid2">
              <div style="background:#0a1426;border:1px solid #243961;border-radius:10px;padding:10px">
                <div style="font-size:11px;color:#9fb0d0;font-weight:700">SAMPEL 1 — Ucapkan:</div>
                <div style="font-family:monospace;color:#6ee7b7;font-size:12.5px;margin:4px 0">"GIO910 VERIFIKASI IDENTITAS SATU"</div>
                <button type="button" id="kyc-voice-rec-1" class="kai-kyc-btn warn" style="width:100%;margin-top:4px">🎙️ Rekam Sampel 1</button>
                <div id="kyc-v1-st" style="font-size:11.5px;color:#9fb0d0;margin-top:5px">Belum direkam</div>
              </div>
              <div style="background:#0a1426;border:1px solid #243961;border-radius:10px;padding:10px">
                <div style="font-size:11px;color:#9fb0d0;font-weight:700">SAMPEL 2 — Ucapkan:</div>
                <div style="font-family:monospace;color:#6ee7b7;font-size:12.5px;margin:4px 0">"KONFIRMASI SUARA KARYAWAN RESMI"</div>
                <button type="button" id="kyc-voice-rec-2" class="kai-kyc-btn warn" style="width:100%;margin-top:4px">🎙️ Rekam Sampel 2</button>
                <div id="kyc-v2-st" style="font-size:11.5px;color:#9fb0d0;margin-top:5px">Belum direkam</div>
              </div>
            </div>
            <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
              <div id="kyc-v-msg" style="font-size:12px;color:#93c5fd">Rekam kedua sampel untuk mengaktifkan tombol simpan.</div>
              <button type="button" id="kyc-voice-save" class="kai-kyc-btn ok" disabled>💾 Simpan Voiceprint</button>
            </div>
          </div>

          <div id="kyc-panel-doc" class="kai-kyc-box" style="display:none">
            <b style="color:#7dd3fc;display:block;margin-bottom:6px">Langkah 3 — Upload Dokumen e-KYC (KTP / KIA / Passport) + Pencocokan Wajah</b>
            <div style="font-size:11.5px;color:#9fb0d0;margin-bottom:8px">Dilindungi <b>UU PDP No. 27/2022</b>: nomor identitas di-<i>hash</i> SHA-256 &amp; ditampilkan ter-masking; foto dokumen disimpan di bucket privat dan hanya dapat diperiksa oleh <b>Pemilik &amp; Manajemen</b>.</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
              <label style="display:inline-flex;align-items:center;gap:5px;background:#0a1426;border:1px solid #2b4370;padding:6px 10px;border-radius:8px;cursor:pointer"><input type="radio" name="kyc-doc-type" value="KTP" checked /> e-KTP (16 Digit)</label>
              <label style="display:inline-flex;align-items:center;gap:5px;background:#0a1426;border:1px solid #2b4370;padding:6px 10px;border-radius:8px;cursor:pointer"><input type="radio" name="kyc-doc-type" value="KIA" /> KIA (16 Digit)</label>
              <label style="display:inline-flex;align-items:center;gap:5px;background:#0a1426;border:1px solid #2b4370;padding:6px 10px;border-radius:8px;cursor:pointer"><input type="radio" name="kyc-doc-type" value="PASSPORT" /> Passport (6–12 Alfanum.)</label>
            </div>
            <div class="kai-kyc-grid2">
              <div>
                <label style="font-size:11px;color:#9fb0d0;font-weight:700">Nomor Identitas <span id="kyc-doc-mask-prev" style="color:#7dd3fc;font-family:monospace"></span></label>
                <input id="kyc-doc-num" type="text" class="kai-kyc-inp" placeholder="Masukkan 16 digit NIK / No. Passport" />
              </div>
              <div>
                <label style="font-size:11px;color:#9fb0d0;font-weight:700">Nama Lengkap Sesuai Dokumen</label>
                <input id="kyc-doc-name" type="text" class="kai-kyc-inp" value="${esc((sess.user && (sess.user.Nama || sess.user.name)) || "")}" placeholder="Nama persis seperti di KTP/Passport" />
              </div>
            </div>
            <div class="kai-kyc-grid2" style="margin-top:8px">
              <div>
                <label style="font-size:11px;color:#9fb0d0;font-weight:700">Kewarganegaraan</label>
                <input id="kyc-doc-nat" type="text" class="kai-kyc-inp" value="WNI" />
              </div>
              <div>
                <label style="font-size:11px;color:#9fb0d0;font-weight:700">Foto / Scan Dokumen Asli</label>
                <input id="kyc-doc-file" type="file" accept="image/jpeg,image/png,image/webp" class="kai-kyc-inp" style="padding:5px 8px" />
              </div>
            </div>
            <div id="kyc-doc-preview-wrap" style="display:none;margin-top:8px;background:#08101e;border:1px solid #243961;border-radius:10px;padding:8px">
              <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                <img id="kyc-doc-img" style="max-height:110px;border-radius:6px;border:1px solid #2b4370" alt="Pratinjau Dokumen" />
                <div style="font-size:12px">
                  <div id="kyc-doc-face-st" style="color:#fbbf24">Menganalisis foto wajah di dokumen…</div>
                  <div id="kyc-doc-sim-st" style="color:#93c5fd;margin-top:3px"></div>
                </div>
              </div>
            </div>
            <div style="margin-top:9px;background:#0a1426;border:1px solid #243961;border-radius:10px;padding:9px">
              <div style="font-size:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
                <span id="kyc-doc-selfie-lbl">Selfie pembanding: memeriksa data wajah terdaftar…</span>
                <button type="button" id="kyc-doc-go-face" class="kai-kyc-btn ghost" style="padding:5px 10px;font-size:11.5px">📷 Ambil/Perbarui Selfie Live</button>
              </div>
            </div>
            <div id="kyc-doc-msg" style="font-size:12px;color:#fca5a5;margin-top:7px"></div>
            <button type="button" id="kyc-doc-submit" class="kai-kyc-btn ok" style="width:100%;margin-top:8px;padding:11px">🛡️ Kirim e-KYC (Hybrid Gemini Vision + 128-D)</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    let camStream = null;
    let stopLive = null;
    let obsLive = 0;
    let capturedFaceData = null;
    let capturedFaceScore = 0;
    let capturedFaceEmb = null;

    let docImgData = null;
    let docEmb = null;
    let vRecActive = null;
    let vSample1 = null;
    let vSample2 = null;
    let kycInfo = null;

    const cleanupCam = () => {
      if (stopLive) { stopLive(); stopLive = null; }
      if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; }
    };
    const cleanupAll = () => {
      cleanupCam();
      if (vRecActive) { vRecActive.cancel(); vRecActive = null; }
    };
    const close = () => {
      cleanupAll();
      modal.remove();
    };
    modal.querySelector("#kyc-wiz-close").onclick = close;
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

    const setTab = (tab) => {
      ["face", "voice", "doc"].forEach((t) => {
        modal.querySelector(`#kyc-tab-${t}`).classList.toggle("is-active", t === tab);
        modal.querySelector(`#kyc-panel-${t}`).style.display = t === tab ? "block" : "none";
      });
      if (tab !== "face") cleanupCam();
    };
    modal.querySelector("#kyc-tab-face").onclick = () => setTab("face");
    modal.querySelector("#kyc-tab-voice").onclick = () => setTab("voice");
    modal.querySelector("#kyc-tab-doc").onclick = () => setTab("doc");
    modal.querySelector("#kyc-doc-go-face").onclick = () => setTab("face");
    setTab(initialTab);

    const renderStatusBar = (r) => {
      kycInfo = (r && r.kyc) || null;
      const geminiOk = Boolean(r && r.geminiConfigured);
      const bar = modal.querySelector("#kyc-wiz-status-bar");
      if (!kycInfo) {
        bar.innerHTML = '<span class="kai-kyc-pill warn">Gagal memuat status e-KYC.</span>';
        return;
      }
      bar.innerHTML = [
        statusPillHtml(kycInfo),
        kycInfo.faceEnrolled
          ? '<span class="kai-kyc-pill ok">Wajah 128-D ✓</span>'
          : '<span class="kai-kyc-pill muted">Wajah 128-D: Belum</span>',
        kycInfo.voiceEnrolled
          ? '<span class="kai-kyc-pill ok">Voiceprint ✓</span>'
          : '<span class="kai-kyc-pill muted">Voiceprint: Belum</span>',
        geminiOk
          ? '<span class="kai-kyc-pill ok">Gemini Vision AI: AKTIF</span>'
          : '<span class="kai-kyc-pill muted">Hybrid: 128-D + Review HR</span>',
      ].join("");

      const selfieLbl = modal.querySelector("#kyc-doc-selfie-lbl");
      if (capturedFaceData) {
        selfieLbl.innerHTML = '<span style="color:#6ee7b7">✓ Selfie kamera sesi ini siap dipakai untuk pencocokan e-KYC.</span>';
      } else if (kycInfo.faceEnrolled) {
        selfieLbl.innerHTML = '<span style="color:#6ee7b7">✓ Menggunakan foto wajah terdaftar Anda sebagai pembanding live selfie.</span>';
      } else {
        selfieLbl.innerHTML = '<span style="color:#fbbf24">⚠️ Wajib kunci Wajah Live (Langkah 1) terlebih dahulu sebelum kirim e-KYC.</span>';
      }

      if (kycInfo.kycStatus === "rejected" && kycInfo.reviewNote) {
        modal.querySelector("#kyc-doc-msg").textContent = "Catatan penolakan sebelumnya: " + kycInfo.reviewNote;
      }
    };

    refreshMyStatus().then(renderStatusBar);
    ensureFaceModels().catch(() => {});

    // ---- TAB 1: FACE ENROLLMENT ----
    const fVid = modal.querySelector("#kyc-f-vid");
    const fImg = modal.querySelector("#kyc-f-img");
    const fPh = modal.querySelector("#kyc-f-ph");
    const fMsg = modal.querySelector("#kyc-f-msg");
    const fBtnOn = modal.querySelector("#kyc-face-cam-on");
    const fBtnSnap = modal.querySelector("#kyc-face-snap");
    const fBtnRetake = modal.querySelector("#kyc-face-retake");
    const fBtnSave = modal.querySelector("#kyc-face-save");

    fBtnOn.onclick = async () => {
      fMsg.style.color = "#fbbf24";
      fMsg.textContent = "Membuka kamera & memuat model biometrik 128-D…";
      try {
        const sec = getSec();
        camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 } }, audio: false });
        fVid.srcObject = camStream;
        fVid.style.display = "block";
        fImg.style.display = "none";
        fPh.style.display = "none";
        fBtnOn.style.display = "none";
        fBtnSnap.style.display = "inline-flex";
        fBtnSave.style.display = "none";
        await fVid.play().catch(() => {});
        ensureFaceModels().catch(() => {});
        if (sec && sec.createLivenessMonitor) {
          stopLive = sec.createLivenessMonitor(fVid, (st) => {
            obsLive = Math.max(obsLive, st.score || 0);
            fMsg.style.color = st.ready ? "#6ee7b7" : "#fbbf24";
            fMsg.textContent = st.msg;
          });
        }
      } catch (e) {
        fMsg.style.color = "#fca5a5";
        fMsg.textContent = "Kamera gagal dibuka: " + (e.message || e);
      }
    };

    fBtnSnap.onclick = async () => {
      const sec = getSec();
      fBtnSnap.disabled = true;
      fMsg.style.color = "#93c5fd";
      fMsg.textContent = "Mengunci frame liveness & mengekstrak vektor wajah 128-D…";
      try {
        if (!sec || typeof sec.captureWithLiveness !== "function") {
          throw new Error("Modul liveness belum siap. Muat ulang halaman sebelum mengambil selfie.");
        }
        const cap = await sec.captureWithLiveness(fVid, obsLive);
        const ext = await extractLiveFaceDescriptor(cap.canvas || cap.dataUrl);
        if (!ext.ok || !ext.embedding) {
          throw new Error("Wajah tidak terdeteksi jelas di kamera. Hadapkan wajah ke kamera dengan cahaya terang dan coba lagi.");
        }
        capturedFaceData = cap.dataUrl;
        capturedFaceScore = cap.livenessScore;
        capturedFaceEmb = ext.embedding;
        fImg.src = capturedFaceData;
        fImg.style.display = "block";
        fVid.style.display = "none";
        fBtnSnap.style.display = "none";
        fBtnRetake.style.display = "inline-flex";
        fBtnSave.style.display = "inline-flex";
        fMsg.style.color = "#6ee7b7";
        fMsg.textContent = `✓ Wajah 128-D terkunci (Confidence ${(ext.score * 100).toFixed(0)}% · Liveness ${capturedFaceScore.toFixed(1)}). Klik Simpan!`;
        cleanupCam();
      } catch (e) {
        fMsg.style.color = "#fca5a5";
        fMsg.textContent = e.message || String(e);
      } finally {
        fBtnSnap.disabled = false;
      }
    };

    fBtnRetake.onclick = () => {
      capturedFaceData = null;
      capturedFaceEmb = null;
      obsLive = 0;
      fBtnRetake.style.display = "none";
      fBtnSave.style.display = "none";
      fBtnOn.click();
    };

    fBtnSave.onclick = async () => {
      if (!capturedFaceData || !capturedFaceEmb) return;
      fBtnSave.disabled = true;
      fBtnSave.textContent = "Menyimpan…";
      try {
        const res = await apiCall("POST", "/api/kyc/enroll-face", {
          faceImage: capturedFaceData,
          captureSource: "live-camera",
          livenessScore: capturedFaceScore,
          faceEmbedding: capturedFaceEmb,
        }, sess.token);
        fMsg.style.color = "#6ee7b7";
        fMsg.textContent = "✓ " + (res.message || "Biometrik wajah tersimpan.");
        const st = await refreshMyStatus();
        renderStatusBar(st);
      } catch (e) {
        fMsg.style.color = "#fca5a5";
        fMsg.textContent = e.message || String(e);
      } finally {
        fBtnSave.disabled = false;
        fBtnSave.textContent = "💾 Simpan Biometrik Wajah";
      }
    };

    // ---- TAB 2: VOICEPRINT CALIBRATION ----
    const vSaveBtn = modal.querySelector("#kyc-voice-save");
    const vMsg = modal.querySelector("#kyc-v-msg");
    const updateVoiceReady = () => {
      const ok = Boolean(vSample1 && vSample2);
      vSaveBtn.disabled = !ok;
      if (ok) {
        vMsg.style.color = "#6ee7b7";
        vMsg.textContent = "✓ Kedua sampel suara siap! Klik Simpan Voiceprint.";
      }
    };

    async function handleVoiceSample(slotNum, btnEl, stEl) {
      if (vRecActive && vRecActive._slot !== slotNum) {
        vMsg.textContent = "Selesaikan rekaman sampel yang sedang berjalan terlebih dahulu.";
        return;
      }
      if (!vRecActive) {
        try {
          const sec = getSec();
          if (!sec || !sec.startVoiceRecorder) throw new Error("Modul perekam suara tidak tersedia.");
          btnEl.textContent = "⏹ Hentikan Rekaman";
          btnEl.className = "kai-kyc-btn";
          stEl.style.color = "#93c5fd";
          stEl.textContent = "Merekam… ucapkan frasa sekarang.";
          const rec = await sec.startVoiceRecorder({
            onLevel: (rms) => {
              stEl.textContent = `Merekam… level ${Math.min(100, Math.round(rms * 500))}%`;
            },
          });
          rec._slot = slotNum;
          vRecActive = rec;
        } catch (e) {
          vRecActive = null;
          btnEl.textContent = `🎙️ Rekam Sampel ${slotNum}`;
          btnEl.className = "kai-kyc-btn warn";
          stEl.style.color = "#fca5a5";
          stEl.textContent = e.message || String(e);
        }
      } else {
        try {
          const res = await vRecActive.stop();
          vRecActive = null;
          if (!res || !res.voiceProfile) {
            throw new Error("Profil akustik MFCC gagal diekstrak; ucapkan lebih jelas dan dekat mikrofon.");
          }
          if (slotNum === 1) vSample1 = res.voiceProfile;
          else vSample2 = res.voiceProfile;
          btnEl.textContent = `↺ Rekam Ulang ${slotNum}`;
          btnEl.className = "kai-kyc-btn ghost";
          stEl.style.color = "#6ee7b7";
          stEl.textContent = `✓ Sampel ${slotNum} siap (F0 ${Math.round(res.voiceProfile.pitchHz)} Hz · RMS ${res.voiceEnergy})`;
          updateVoiceReady();
        } catch (e) {
          vRecActive = null;
          btnEl.textContent = `🎙️ Rekam Sampel ${slotNum}`;
          btnEl.className = "kai-kyc-btn warn";
          stEl.style.color = "#fca5a5";
          stEl.textContent = e.message || String(e);
        }
      }
    }

    modal.querySelector("#kyc-voice-rec-1").onclick = () =>
      handleVoiceSample(1, modal.querySelector("#kyc-voice-rec-1"), modal.querySelector("#kyc-v1-st"));
    modal.querySelector("#kyc-voice-rec-2").onclick = () =>
      handleVoiceSample(2, modal.querySelector("#kyc-voice-rec-2"), modal.querySelector("#kyc-v2-st"));

    vSaveBtn.onclick = async () => {
      const merged = averageVoiceProfiles([vSample1, vSample2]);
      if (!merged) return;
      vSaveBtn.disabled = true;
      vSaveBtn.textContent = "Menyimpan…";
      try {
        const res = await apiCall("POST", "/api/kyc/enroll-voice", {
          voiceProfile: merged,
          phrases: ["GIO910 VERIFIKASI IDENTITAS SATU", "KONFIRMASI SUARA KARYAWAN RESMI"],
        }, sess.token);
        vMsg.style.color = "#6ee7b7";
        vMsg.textContent = "✓ " + (res.message || "Voiceprint tersimpan.");
        const st = await refreshMyStatus();
        renderStatusBar(st);
      } catch (e) {
        vMsg.style.color = "#fca5a5";
        vMsg.textContent = e.message || String(e);
      } finally {
        vSaveBtn.disabled = false;
        vSaveBtn.textContent = "💾 Simpan Voiceprint";
      }
    };

    // ---- TAB 3: DOCUMENT e-KYC (KTP / KIA / PASSPORT) ----
    const docNumInp = modal.querySelector("#kyc-doc-num");
    const docMaskPrev = modal.querySelector("#kyc-doc-mask-prev");
    const getDocType = () => {
      const chk = modal.querySelector('input[name="kyc-doc-type"]:checked');
      return chk ? chk.value : "KTP";
    };
    const updateMaskPrev = () => {
      docMaskPrev.textContent = "Mask UU PDP: " + maskPreview(getDocType(), docNumInp.value);
    };
    docNumInp.addEventListener("input", updateMaskPrev);
    modal.querySelectorAll('input[name="kyc-doc-type"]').forEach((r) => r.addEventListener("change", updateMaskPrev));

    modal.querySelector("#kyc-doc-file").addEventListener("change", async (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if (!f) return;
      const errBox = modal.querySelector("#kyc-doc-msg");
      errBox.textContent = "";
      try {
        docImgData = await compressImageFile(f, 1100, 0.85);
        docEmb = null;
        const wrap = modal.querySelector("#kyc-doc-preview-wrap");
        wrap.style.display = "block";
        modal.querySelector("#kyc-doc-img").src = docImgData;
        const faceSt = modal.querySelector("#kyc-doc-face-st");
        const simSt = modal.querySelector("#kyc-doc-sim-st");
        faceSt.style.color = "#fbbf24";
        faceSt.textContent = "Mendeteksi wajah pada foto KTP/KIA/Passport…";
        simSt.textContent = "";
        try {
          const dRes = await extractDocFaceDescriptor(docImgData);
          if (dRes.ok && dRes.embedding) {
            docEmb = dRes.embedding;
            faceSt.style.color = "#6ee7b7";
            faceSt.textContent = `✓ Foto wajah pada dokumen terdeteksi 128-D (${Math.round(dRes.score * 100)}%)`;
            if (capturedFaceEmb) {
              const dist = euclideanDist(docEmb, capturedFaceEmb);
              const pct = faceDistanceToScore(dist);
              simSt.textContent = `Pratinjau kecocokan 128-D vs Selfie: ${pct}%`;
            }
          } else {
            faceSt.style.color = "#93c5fd";
            faceSt.textContent = "Foto wajah kartu kecil/hologram — akan dicocokkan langsung via Gemini Vision AI & Review HR.";
          }
        } catch (_) {
          faceSt.style.color = "#93c5fd";
          faceSt.textContent = "Siap dikirim ke server Gemini Vision & Review HR.";
        }
      } catch (e) {
        errBox.textContent = e.message || String(e);
      }
    });

    modal.querySelector("#kyc-doc-submit").onclick = async () => {
      const docType = getDocType();
      const docNumber = docNumInp.value.trim();
      const docFullName = modal.querySelector("#kyc-doc-name").value.trim();
      const docNationality = modal.querySelector("#kyc-doc-nat").value.trim() || "WNI";
      const msgEl = modal.querySelector("#kyc-doc-msg");
      msgEl.style.color = "#fca5a5";
      msgEl.textContent = "";

      if (!docNumber) { msgEl.textContent = "Masukkan nomor KTP / KIA / Passport."; return; }
      if (docFullName.length < 3) { msgEl.textContent = "Masukkan nama lengkap sesuai dokumen."; return; }
      if (!docImgData) { msgEl.textContent = "Unggah/foto dokumen identitas terlebih dahulu."; return; }
      if (!capturedFaceData && !(kycInfo && kycInfo.faceEnrolled)) {
        msgEl.textContent = "Selesaikan Langkah 1 (Selfie Wajah Live 128-D) terlebih dahulu agar bisa dicocokkan dengan dokumen.";
        return;
      }

      const subBtn = modal.querySelector("#kyc-doc-submit");
      subBtn.disabled = true;
      subBtn.textContent = "Memproses Hybrid AI + Enkripsi UU PDP…";
      try {
        const payload = {
          docType,
          docNumber,
          docFullName,
          docNationality,
          docImage: docImgData,
          docFaceEmbedding: docEmb,
        };
        if (capturedFaceData && capturedFaceEmb) {
          payload.liveSelfieImage = capturedFaceData;
          payload.liveFaceEmbedding = capturedFaceEmb;
          payload.livenessScore = capturedFaceScore;
          payload.captureSource = "live-camera";
        }
        const res = await apiCall("POST", "/api/kyc/submit-document", payload, sess.token);
        msgEl.style.color = "#6ee7b7";
        msgEl.textContent = "✓ " + (res.message || "e-KYC dikirim ke antrean Pemilik/Manajemen.");
        const st = await refreshMyStatus();
        renderStatusBar(st);
      } catch (e) {
        msgEl.style.color = "#fca5a5";
        msgEl.textContent = e.message || String(e);
      } finally {
        subBtn.disabled = false;
        subBtn.textContent = "🛡️ Kirim e-KYC (Hybrid Gemini Vision + 128-D)";
      }
    };
  }

  // =========================================================================
  // 4. HR / PEMILIK + MANAJEMEN e-KYC REVIEW QUEUE & SIDE-BY-SIDE INSPECTOR
  // =========================================================================
  async function openInspectDialog(userId, onUpdated) {
    const sess = getSession();
    if (!sess || !sess.token) return;
    if (!isReviewerRole()) {
      alert("Akses ditolak: Hanya Pemilik & Manajemen yang boleh memeriksa dokumen KTP/KIA/Passport.");
      return;
    }
    ensureCss();
    const ex = document.getElementById("kai-kyc-inspect-modal");
    if (ex) ex.remove();

    const modal = document.createElement("div");
    modal.id = "kai-kyc-inspect-modal";
    modal.className = "kai-kyc-modal is-open";
    modal.innerHTML = `
      <div class="kai-kyc-card" style="max-width:780px">
        <div class="kai-kyc-head">
          <h3>🔍 Inspeksi e-KYC (Dokumen vs Selfie Live · UU PDP Audit Logged)</h3>
          <button type="button" id="kyc-insp-close" class="kai-kyc-btn ghost" style="padding:4px 10px">✕</button>
        </div>
        <div id="kyc-insp-body" class="kai-kyc-body">
          <div style="color:#9fb0d0">Mengunduh tautan terenkripsi 60 detik &amp; mencatat log audit akses…</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector("#kyc-insp-close").onclick = close;
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

    try {
      const r = await apiCall("GET", `/api/kyc/inspect?userId=${encodeURIComponent(userId)}`, undefined, sess.token);
      const k = r.kyc || {};
      const ga = k.geminiAnalysis || {};
      const bodyEl = modal.querySelector("#kyc-insp-body");
      bodyEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:center">
          <div>
            <b style="font-size:15px;color:#fff">${esc(k.userCode ? k.userCode + " · " : "")}${esc(k.nama || "-")}</b>
            <div style="font-size:12px;color:#9fb0d0">${esc(k.tier || "-")} · ${esc(k.unit || "-")}</div>
          </div>
          ${statusPillHtml(k)}
        </div>
        <div class="kai-kyc-box" style="display:flex;flex-wrap:wrap;gap:12px;font-size:12px">
          <div>Dokumen: <b>${esc(k.docType || "-")}</b></div>
          <div>Nomor (Masked): <b style="font-family:monospace;color:#7dd3fc">${esc(k.docNumberMasked || "-")}</b></div>
          <div>Nama Dokumen: <b>${esc(k.docFullName || "-")}</b></div>
          <div>Skor 128-D: <b style="color:#6ee7b7">${k.biometricMatchScore != null ? k.biometricMatchScore + "%" : "N/A"}</b></div>
          <div>Gemini Vision: <b style="color:#38bdf8">${k.geminiMatchScore != null ? k.geminiMatchScore + "%" : esc(ga.status || "N/A")}</b></div>
        </div>
        ${ga && ga.message ? `<div style="font-size:12px;color:#fbbf24;background:#2a2113;border:1px solid #5b4a17;border-radius:8px;padding:8px">ℹ️ ${esc(ga.message)}</div>` : ""}
        ${ga && ga.notes ? `<div style="font-size:12px;color:#93c5fd;background:#0a182d;border:1px solid #2b4370;border-radius:8px;padding:8px">🤖 <b>Analisis Gemini Vision:</b> ${esc(ga.notes)} (Nama OCR: "${esc(ga.extracted_name || "-")}", Sama Orang: ${ga.same_person ? "YA" : "TIDAK"})</div>` : ""}
        <div class="kai-kyc-grid2">
          <div class="kai-kyc-box" style="text-align:center">
            <div style="font-size:11.5px;font-weight:700;color:#7dd3fc;margin-bottom:6px">Foto Dokumen (${esc(k.docType || "ID")}) · Link Berlaku 60s</div>
            ${r.docSignedUrl ? `<img id="kyc-inspect-doc-img" src="${esc(r.docSignedUrl)}" style="max-width:100%;max-height:240px;border-radius:8px;border:1px solid #2b4370" alt="Dokumen e-KYC" />` : '<div style="color:#9fb0d0;padding:30px">Belum ada foto dokumen.</div>'}
          </div>
          <div class="kai-kyc-box" style="text-align:center">
            <div style="font-size:11.5px;font-weight:700;color:#6ee7b7;margin-bottom:6px">Selfie Kamera Live Karyawan · Link Berlaku 60s</div>
            ${r.faceSignedUrl ? `<img id="kyc-inspect-face-img" src="${esc(r.faceSignedUrl)}" style="max-width:100%;max-height:240px;border-radius:8px;border:1px solid #2b4370" alt="Selfie Live" />` : '<div style="color:#9fb0d0;padding:30px">Belum ada selfie live.</div>'}
          </div>
        </div>
        <div class="kai-kyc-box">
          <label style="font-size:11.5px;font-weight:700;color:#9fb0d0;display:block;margin-bottom:4px">Catatan Keputusan Review HR / Pemilik (Wajib diisi jika Menolak):</label>
          <input id="kyc-review-note" type="text" class="kai-kyc-inp" value="${esc(k.reviewNote || "")}" placeholder="Contoh: Foto KTP & selfie cocok / Foto KTP buram harap foto ulang" />
          <div id="kyc-review-err" style="font-size:12px;color:#fca5a5;margin-top:6px"></div>
          <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
            <button type="button" id="kyc-approve-btn" class="kai-kyc-btn ok" style="flex:1">✓ Setujui e-KYC (Approve)</button>
            <button type="button" id="kyc-reject-btn" class="kai-kyc-btn err" style="flex:1">✕ Tolak e-KYC (Reject)</button>
          </div>
        </div>
      `;

      const submitDecision = async (decision) => {
        const note = bodyEl.querySelector("#kyc-review-note").value.trim();
        const errEl = bodyEl.querySelector("#kyc-review-err");
        errEl.textContent = "";
        if (decision === "rejected" && note.length < 5) {
          errEl.textContent = "Alasan penolakan wajib diisi minimal 5 karakter.";
          return;
        }
        try {
          const res = await apiCall("POST", "/api/kyc/review", { userId, decision, note }, sess.token);
          await refreshMyStatus();
          if (typeof onUpdated === "function") onUpdated(res);
          close();
        } catch (e) {
          errEl.textContent = e.message || String(e);
        }
      };
      bodyEl.querySelector("#kyc-approve-btn").onclick = () => submitDecision("verified");
      bodyEl.querySelector("#kyc-reject-btn").onclick = () => submitDecision("rejected");
    } catch (e) {
      modal.querySelector("#kyc-insp-body").innerHTML = `<div style="color:#fca5a5">${esc(e.message || String(e))}</div>`;
    }
  }

  async function renderKycReviewContainer(containerEl) {
    const sess = getSession();
    if (!sess || !sess.token || !isReviewerRole()) {
      containerEl.innerHTML = "";
      return;
    }
    containerEl.innerHTML = `<div style="font-size:12.5px;color:#9fb0d0">Memuat daftar verifikasi Biometrik &amp; e-KYC karyawan…</div>`;
    try {
      const data = await apiCall("GET", "/api/kyc/list?status=all", undefined, sess.token);
      const items = data.items || [];
      const counts = data.counts || {};
      let activeFilter = counts.pending_review > 0 ? "pending_review" : "all";
      let searchTxt = "";

      const draw = () => {
        const filtered = items.filter((it) => {
          if (activeFilter !== "all" && it.kycStatus !== activeFilter) return false;
          if (searchTxt) {
            const q = searchTxt.toLowerCase();
            return (
              String(it.nama || "").toLowerCase().includes(q) ||
              String(it.userCode || "").toLowerCase().includes(q) ||
              String(it.docNumberMasked || "").toLowerCase().includes(q)
            );
          }
          return true;
        });

        containerEl.innerHTML = `
          <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px">
            <div>
              <b style="color:#7dd3fc;font-size:13.5px">🛡️ Pusat Review e-KYC &amp; Biometrik Karyawan (Khusus Pemilik &amp; Manajemen)</b>
              <div style="font-size:11.5px;color:#9fb0d0">Menunggu: <b style="color:#fbbf24">${counts.pending_review || 0}</b> · Terverifikasi: <b style="color:#6ee7b7">${counts.verified || 0}</b> · Ditolak: <b style="color:#fca5a5">${counts.rejected || 0}</b> · Belum Daftar: <b>${counts.unregistered || 0}</b> · ${data.geminiConfigured ? '<span style="color:#6ee7b7">Gemini Vision AKTIF</span>' : '<span style="color:#fbbf24">Mode Hybrid (128-D + HR Review)</span>'}</div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <input id="kyc-hr-search" type="text" value="${esc(searchTxt)}" placeholder="Cari karyawan / ID…" style="background:#08101e;border:1px solid #2b4370;border-radius:8px;padding:5px 9px;color:#fff;font-size:12px;width:165px" />
              <select id="kyc-hr-filter" style="background:#08101e;border:1px solid #2b4370;border-radius:8px;padding:5px 9px;color:#fff;font-size:12px">
                <option value="all" ${activeFilter === "all" ? "selected" : ""}>Semua (${counts.total || items.length})</option>
                <option value="pending_review" ${activeFilter === "pending_review" ? "selected" : ""}>Menunggu Review (${counts.pending_review || 0})</option>
                <option value="verified" ${activeFilter === "verified" ? "selected" : ""}>Terverifikasi (${counts.verified || 0})</option>
                <option value="rejected" ${activeFilter === "rejected" ? "selected" : ""}>Ditolak (${counts.rejected || 0})</option>
                <option value="unregistered" ${activeFilter === "unregistered" ? "selected" : ""}>Belum KYC (${counts.unregistered || 0})</option>
              </select>
            </div>
          </div>
          <div style="max-height:260px;overflow:auto;display:flex;flex-direction:column;gap:6px">
            ${filtered.length === 0 ? '<div style="font-size:12px;color:#9fb0d0;padding:8px 0">Tidak ada karyawan pada filter ini.</div>' : filtered.slice(0, 60).map((it) => `
              <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;background:#0b1426;border:1px solid #1e3054;border-radius:9px;padding:8px 10px;font-size:12px">
                <div>
                  <b style="color:#fff">${esc(it.userCode ? it.userCode + " · " : "")}${esc(it.nama || "-")}</b>
                  <span style="color:#9fb0d0"> (${esc(it.tier || "-")})</span>
                  <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:4px;align-items:center">
                    ${statusPillHtml(it)}
                    <span class="kai-kyc-pill ${it.faceEnrolled ? "ok" : "muted"}">Wajah ${it.faceEnrolled ? "✓" : "✗"}</span>
                    <span class="kai-kyc-pill ${it.voiceEnrolled ? "ok" : "muted"}">Suara ${it.voiceEnrolled ? "✓" : "✗"}</span>
                    ${it.docType ? `<span class="kai-kyc-pill muted">${esc(it.docType)} · ${esc(it.docNumberMasked || "")}</span>` : ""}
                    ${it.biometricMatchScore != null ? `<span class="kai-kyc-pill ok">128-D ${it.biometricMatchScore}%</span>` : ""}
                    ${it.geminiMatchScore != null ? `<span class="kai-kyc-pill ok">Gemini ${it.geminiMatchScore}%</span>` : ""}
                  </div>
                </div>
                ${it.hasDocPhoto || it.hasFacePhoto ? `<button type="button" class="kai-kyc-btn" data-kyc-inspect="${esc(it.userId)}" style="padding:6px 10px;font-size:11.5px">🔍 Bandingkan Foto &amp; Putuskan</button>` : '<span style="font-size:11px;color:#7c8fb3">Belum unggah dokumen</span>'}
              </div>
            `).join("")}
          </div>
        `;

        containerEl.querySelector("#kyc-hr-search").addEventListener("input", (e) => {
          searchTxt = e.target.value;
          draw();
          const inp = containerEl.querySelector("#kyc-hr-search");
          if (inp) { inp.focus(); inp.setSelectionRange(searchTxt.length, searchTxt.length); }
        });
        containerEl.querySelector("#kyc-hr-filter").addEventListener("change", (e) => {
          activeFilter = e.target.value;
          draw();
        });
        containerEl.querySelectorAll("[data-kyc-inspect]").forEach((btn) => {
          btn.onclick = () => openInspectDialog(btn.getAttribute("data-kyc-inspect"), () => renderKycReviewContainer(containerEl));
        });
      };

      draw();
    } catch (e) {
      containerEl.innerHTML = `<div style="font-size:12px;color:#fca5a5">Gagal memuat antrean e-KYC: ${esc(e.message || String(e))}</div>`;
    }
  }

  async function openKycReviewModal() {
    ensureCss();
    const ex = document.getElementById("kai-kyc-review-modal");
    if (ex) ex.remove();
    const modal = document.createElement("div");
    modal.id = "kai-kyc-review-modal";
    modal.className = "kai-kyc-modal is-open";
    modal.innerHTML = `
      <div class="kai-kyc-card" style="max-width:860px">
        <div class="kai-kyc-head">
          <h3>📋 Review e-KYC Karyawan (Pemilik &amp; Manajemen)</h3>
          <button type="button" id="kyc-rev-close" class="kai-kyc-btn ghost" style="padding:4px 10px">✕</button>
        </div>
        <div id="kyc-rev-mount" class="kai-kyc-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#kyc-rev-close").onclick = () => modal.remove();
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    await renderKycReviewContainer(modal.querySelector("#kyc-rev-mount"));
  }

  // =========================================================================
  // 5. TOOLBAR BUTTONS & INLINE DATA KARYAWAN MOUNTING
  // =========================================================================
  function ensureToolbarButtons() {
    const tb = document.querySelector(".kai-toolbar");
    if (tb && !document.getElementById("kai-btn-kyc")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "kai-btn-kyc";
      btn.className = "kai-tool-btn";
      btn.title = "Pendaftaran Biometrik Wajah, Suara & e-KYC KTP/KIA/Passport";
      btn.innerHTML = '<span aria-hidden="true">🪪</span><span class="kai-tool-lbl">Biometrik &amp; e-KYC</span>';
      btn.addEventListener("click", () => openKycEnrollmentModal("face"));
      tb.appendChild(btn);
    }
    if (tb && isReviewerRole()) {
      let rBtn = document.getElementById("kai-btn-kyc-review");
      if (!rBtn) {
        rBtn = document.createElement("button");
        rBtn.type = "button";
        rBtn.id = "kai-btn-kyc-review";
        rBtn.className = "kai-tool-btn";
        rBtn.title = "Review KTP/KIA/Passport & Biometrik Karyawan (Khusus Pemilik & Manajemen)";
        rBtn.innerHTML = `<span aria-hidden="true">📋</span><span class="kai-tool-lbl">Review KYC (<span id="kai-kyc-pend-cnt">${cachedPendingCount}</span>)</span>`;
        rBtn.addEventListener("click", openKycReviewModal);
        tb.appendChild(rBtn);
      }
    } else {
      const old = document.getElementById("kai-btn-kyc-review");
      if (old) old.remove();
    }
    const chAct = document.getElementById("blog-admin-actions");
    const signedIn = Boolean(getSession());
    if (chAct && signedIn && !document.getElementById("blog-kyc-btn")) {
      const kb = document.createElement("button");
      kb.type = "button";
      kb.id = "blog-kyc-btn";
      kb.className = "btn-view";
      kb.style.fontSize = "11.5px";
      kb.textContent = "🪪 Biometrik & e-KYC";
      kb.onclick = () => openKycEnrollmentModal("face");
      chAct.appendChild(kb);
    }
    if (chAct && signedIn && isReviewerRole()) {
      if (!document.getElementById("blog-kyc-review-btn")) {
        const rb = document.createElement("button");
        rb.type = "button";
        rb.id = "blog-kyc-review-btn";
        rb.className = "btn-view";
        rb.style.fontSize = "11.5px";
        rb.textContent = "📋 Review KYC";
        rb.onclick = openKycReviewModal;
        chAct.appendChild(rb);
      }
    } else {
      const old = document.getElementById("blog-kyc-review-btn");
      if (old) old.remove();
    }
    if (!signedIn) {
      const old = document.getElementById("blog-kyc-btn");
      if (old) old.remove();
    }
    updateBadges();
  }

  function updateBadges() {
    const cntEl = document.getElementById("kai-kyc-pend-cnt");
    if (cntEl) cntEl.textContent = String(cachedPendingCount || 0);
    const kBtn = document.getElementById("kai-btn-kyc");
    if (kBtn && cachedMyKyc) {
      const lbl = kBtn.querySelector(".kai-tool-lbl");
      if (lbl) {
        lbl.textContent =
          cachedMyKyc.kycStatus === "verified"
            ? "e-KYC ✓"
            : cachedMyKyc.kycStatus === "pending_review"
              ? "e-KYC (Menunggu)"
              : "Biometrik & e-KYC";
      }
    }
  }

  function tryMountInDataKaryawan() {
    ensureToolbarButtons();
    const sess = getSession();
    if (!sess || !sess.token) return;
    const headings = Array.from(document.querySelectorAll("b, h2, h3"));
    const usersHeading = headings.find((el) => /Daftar Pengguna, Email OTP/i.test(el.textContent || ""));
    if (!usersHeading) return;
    const card = usersHeading.closest("div.rounded-\\[12px\\]") || usersHeading.parentElement;
    if (!card || !card.parentElement) return;

    if (!document.getElementById("kai-kyc-inline-host")) {
      const host = document.createElement("div");
      host.id = "kai-kyc-inline-host";
      host.className = "bg-[#131f36] border border-[#22365c] rounded-[12px] p-4 space-y-2";
      host.style.marginBottom = "12px";
      host.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px">
          <div>
            <b style="color:#e8eefc;font-size:13.5px">🪪 Status Biometrik &amp; e-KYC Pribadi</b>
            <div id="kai-inline-self-st" style="font-size:12px;color:#9fb0d0;margin-top:3px">Memuat status…</div>
          </div>
          <button type="button" id="kai-inline-open-wiz" class="bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#06222f] font-bold text-xs rounded-[8px] px-3 py-1.5 cursor-pointer">🪪 Kelola Wajah, Suara &amp; KTP/Passport</button>
        </div>
        <div id="kai-kyc-hr-panel" style="margin-top:10px;padding-top:10px;border-top:1px dashed #22365c;display:none"></div>
      `;
      card.parentElement.insertBefore(host, card);
      host.querySelector("#kai-inline-open-wiz").onclick = () => openKycEnrollmentModal("face");

      refreshMyStatus().then((r) => {
        const selfEl = host.querySelector("#kai-inline-self-st");
        if (selfEl && r && r.kyc) {
          const k = r.kyc;
          selfEl.innerHTML = `${statusPillHtml(k)} · Wajah 128-D: <b>${k.faceEnrolled ? "Terdaftar ✓" : "Belum"}</b> · Suara: <b>${k.voiceEnrolled ? "Terdaftar ✓" : "Belum"}</b>${k.docNumberMasked ? ` · Dokumen: <span style="font-family:monospace;color:#7dd3fc">${esc(k.docType)} ${esc(k.docNumberMasked)}</span>` : ""}`;
        }
      });
      if (isReviewerRole()) {
        const hrPanel = host.querySelector("#kai-kyc-hr-panel");
        hrPanel.style.display = "block";
        renderKycReviewContainer(hrPanel);
      }
    }
  }

  let obsTimer = null;
  if (document.body) {
    new MutationObserver(() => {
      if (obsTimer) return;
      obsTimer = setTimeout(() => {
        obsTimer = null;
        tryMountInDataKaryawan();
      }, 150);
    }).observe(document.body, { childList: true, subtree: true });
  }

  window.addEventListener("kai-session-change", () => {
    setTimeout(() => {
      refreshMyStatus();
      ensureToolbarButtons();
      const oldHost = document.getElementById("kai-kyc-inline-host");
      if (oldHost) oldHost.remove();
      tryMountInDataKaryawan();
    }, 120);
  });

  setTimeout(() => {
    refreshMyStatus();
    tryMountInDataKaryawan();
  }, 500);

  window.__KAI_KYC__ = {
    version: "v4.7",
    ensureFaceModels,
    extractLiveFaceDescriptor,
    extractDocFaceDescriptor,
    faceDistanceToScore,
    euclideanDist,
    createVoiceFrameCollector,
    averageVoiceProfiles,
    refreshMyStatus,
    getCachedKyc: () => cachedMyKyc,
    openKycEnrollmentModal,
    openKycReviewModal,
    openInspectDialog,
    ensureToolbarButtons,
    isReviewerRole,
  };
})();
