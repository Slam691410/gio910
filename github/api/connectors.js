const SUPABASE_API = (
  process.env.KAI_SUPABASE_API_URL ||
  "https://dttclgkjfiwcovvqrckw.supabase.co/functions/v1/gio910-api"
).replace(/\/+$/, "");

const SUPABASE_ANON =
  process.env.KAI_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dGNsZ2tqZml3Y292dnFyY2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2NTkzNzQsImV4cCI6MjExMTIzNTM3NH0.ozBfRkrgcVUBMfWTmOGhQprvoFLYcIzHr30-AGnlijE";

function buildStackFiles(baseUrl) {
  const schemaSql = [
    "-- GIO910 Core Schema (Supabase Postgres + Realtime + RLS)",
    "-- Jalankan pada Supabase SQL Editor (Project: dttclgkjfiwcovvqrckw)",
    "CREATE TABLE IF NOT EXISTS public.gio_attendance (",
    "  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),",
    "  emp_id text NOT NULL, nama text NOT NULL, role text,",
    "  work_date date NOT NULL, status text DEFAULT 'Hadir',",
    "  work_mode text DEFAULT 'WFO', location_note text,",
    "  lat double precision, lng double precision, distance_m integer,",
    "  created_at timestamptz DEFAULT now()",
    ");",
    "CREATE TABLE IF NOT EXISTS public.gio_web_assets (",
    "  name text PRIMARY KEY, content_type text NOT NULL, body text NOT NULL,",
    "  updated_at timestamptz DEFAULT now()",
    ");",
    "CREATE TABLE IF NOT EXISTS public.configurations (",
    "  key text PRIMARY KEY, value jsonb NOT NULL, description text,",
    "  category text DEFAULT 'runtime', is_encrypted boolean DEFAULT false,",
    "  updated_at timestamptz DEFAULT now()",
    ");",
    "CREATE TABLE IF NOT EXISTS public.gio_connectors (",
    "  slug text PRIMARY KEY, name text NOT NULL, category text,",
    "  arena_status text DEFAULT 'on', last_synced_at timestamptz, updated_at timestamptz DEFAULT now()",
    ");"
  ].join("\n");

  const edgeTs = [
    "// GIO910 Supabase Edge Function (gio910-api)",
    "// Deploy: supabase functions deploy gio910-api --no-verify-jwt",
    'import { createClient } from "npm:@supabase/supabase-js@2";',
    "const cors = {",
    '  "Access-Control-Allow-Origin": "*",',
    '  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-gio-session, x-api-key",',
    '  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"',
    "};",
    "Deno.serve(async (req) => {",
    '  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });',
    '  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { autoRefreshToken: false, persistSession: false } });',
    "  const u = new URL(req.url);",
    '  const path = u.pathname.replace(/^\\/functions\\/v1\\/gio910-api/, "") || "/";',
    '  if (path === "/api/health") {',
    '    const { count: connCount } = await supabase.from("gio_connectors").select("*", { count: "exact", head: true }).eq("arena_status", "on");',
    '    return new Response(JSON.stringify({ success: true, status: "healthy", connectorsOn: connCount || 12, stack: "supabase+vercel" }), { headers: { ...cors, "Content-Type": "application/json" } });',
    "  }",
    '  return new Response(JSON.stringify({ ok: true, path, runtime: "supabase-edge" }), { headers: { ...cors, "Content-Type": "application/json" } });',
    "});"
  ].join("\n");

  const vercelToml = [
    "[[headers]]",
    'source = "/sw.js"',
    "  [[headers.headers]]",
    '  key = "Service-Worker-Allowed"',
    '  value = "/"',
    "",
    "[[rewrites]]",
    'source = "/api/connectors/action"',
    'destination = "/api/connectors?sub=action"',
    "[[rewrites]]",
    'source = "/api/copyhub/params"',
    'destination = "/api/connectors?sub=copyhub-params"',
    "[[rewrites]]",
    'source = "/api/health"',
    'destination = "/api/connectors?sub=health"',
    "[[rewrites]]",
    'source = "/copy-hub.html"',
    'destination = "/api/copy-hub"'
  ].join("\n");

  const deployMd = [
    "# Panduan Deploy Resmi GIO910 · Supabase + Vercel + 13 Konektor",
    "",
    `Portal Live: ${baseUrl}`,
    `Supabase API: ${SUPABASE_API}`,
    "",
    "Kita **tidak lagi menggunakan Google Apps Script maupun Cloudflare**.",
    "",
    "## 1. Backend Supabase (`dttclgkjfiwcovvqrckw`)",
    "1. Jalankan `schema.sql` di Supabase Dashboard → SQL Editor.",
    "2. Deploy Edge Function `gio910-api` dengan `--no-verify-jwt`.",
    "3. Simpan secret server di Supabase Edge Secrets (`GOOGLE_SERVICE_ACCOUNT_*`, `LINEAR_API_KEY`, `NOTION_API_KEY`).",
    "",
    "## 2. Frontend & Serverless Vercel",
    "1. Hubungkan repository GitHub ke Vercel (`rootDirectory: github`).",
    "2. Rewrites `vercel.toml` otomatis meneruskan `/api/*` ke Serverless Functions dan `/copy-hub.html` ke Copy Hub Live.",
    "3. Tambahkan custom domain (`.io` / `.biz.id` / `.blog`) langsung di Vercel → Settings → Domains.",
    "",
    "## 3. Hub 13 Konektor Terpadu",
    "- **12 Aktif**: Google Drive, Sheets, Docs, Slides, Calendar, Gmail, Figma, Notion, Linear, WordPress, Supabase, Vercel.",
    "- **1 Nonaktif / Dijeda**: Dropbox (aktifkan kapan saja dari Hub Konektor)."
  ].join("\n");

  return {
    "schema.sql": { type: "text/plain; charset=utf-8", body: schemaSql },
    "gio910-api.ts": { type: "text/plain; charset=utf-8", body: edgeTs },
    "vercel.toml": { type: "text/plain; charset=utf-8", body: vercelToml },
    "DEPLOY_SUPABASE_VERCEL.md": { type: "text/markdown; charset=utf-8", body: deployMd },
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-gio-session, x-api-key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("X-GIO910-Proxy", "vercel-connectors-v4.7");

  if (req.method === "OPTIONS") {
    return res.status(200).send("ok");
  }

  try {
    const q = req.query || {};
    const sub = String(q.sub || "").trim().toLowerCase();
    const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "gio910-jv38.vercel.app").split(",")[0].trim();
    const baseUrl = `${proto}://${host}`;

    if (sub === "asset") {
      const name = String(q.name || "").trim();
      if (!name) return res.status(400).send("Missing asset name");
      const restBase = SUPABASE_API.replace(/\/functions\/v1\/gio910-api$/, "");
      const restUrl = `${restBase}/rest/v1/gio_web_assets?name=eq.${encodeURIComponent(name)}&select=content_type,body`;
      const assetRes = await fetch(restUrl, {
        headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON },
      });
      const rows = await assetRes.json().catch(() => []);
      if (!Array.isArray(rows) || !rows.length) return res.status(404).send("Asset not found: " + name);
      res.setHeader("Content-Type", rows[0].content_type || "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-store, must-revalidate");
      return res.status(200).send(rows[0].body);
    }

    if (sub === "stack-status") {
      const map = buildStackFiles(baseUrl);
      const files = Object.keys(map).map((name) => ({
        name,
        exists: true,
        sizeKb: (Buffer.byteLength(map[name].body, "utf8") / 1024).toFixed(1),
      }));
      return res.status(200).json({ ok: true, stack: "supabase+vercel+connectors", files });
    }

    if (sub === "stack-file") {
      const name = String(q.name || "").trim();
      const map = buildStackFiles(baseUrl);
      const item = map[name];
      if (!item) return res.status(404).send("Stack file not found: " + name);
      res.setHeader("Content-Type", item.type);
      res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
      return res.status(200).send(item.body);
    }

    const routeMap = {
      "": "/api/connectors",
      connectors: "/api/connectors",
      action: "/api/connectors/action",
      webhook: "/api/connectors/webhook",
      config: "/api/config",
      health: "/api/health",
      "system-status": "/api/system-status",
      workspace: "/api/workspace",
      dao: "/api/dao/proposals",
      "dao-vote": "/api/dao/vote",
      seo: "/api/seo/inquiries",
      "copyhub-schedule": "/api/copyhub/schedule",
      "copyhub-params": "/api/copyhub/params",
      "copyhub-config": "/api/copyhub/config",
      "copyhub-blog": "/api/copyhub/blog",
      absen: "/api/absen",
      "attendance-checkin": "/api/attendance/checkin",
      "absen-challenge": "/api/absen/challenge",
      "auth-set-password": "/api/auth/set-password",
      "auth-zip-issue": "/api/auth/zip-issue",
      "auth-login-manual": "/api/auth/login-manual",
      "auth-me": "/api/auth/me",
      "kyc-me": "/api/kyc/me",
      "kyc-enroll-face": "/api/kyc/enroll-face",
      "kyc-enroll-voice": "/api/kyc/enroll-voice",
      "kyc-submit-document": "/api/kyc/submit-document",
      "kyc-list": "/api/kyc/list",
      "kyc-inspect": "/api/kyc/inspect",
      "kyc-review": "/api/kyc/review",
    };
    const targetPath = routeMap[sub];
    if (!targetPath) {
      return res.status(404).json({ error: "Unknown connector proxy subroute: " + sub });
    }
    const fwdParams = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
      if (k !== "sub" && v !== undefined && v !== null) fwdParams.set(k, String(v));
    }
    const qsStr = fwdParams.toString() ? "?" + fwdParams.toString() : "";

    const headers = {
      apikey: SUPABASE_ANON,
      Authorization: "Bearer " + SUPABASE_ANON,
      "Content-Type": "application/json",
    };
    if (req.headers["x-gio-session"]) headers["x-gio-session"] = String(req.headers["x-gio-session"]);
    if (req.headers["x-api-key"]) headers["x-api-key"] = String(req.headers["x-api-key"]);

    const upstreamRes = await fetch(SUPABASE_API + targetPath + qsStr, {
      method: req.method,
      headers,
      body:
        req.method !== "GET" && req.method !== "HEAD" && req.body !== undefined
          ? typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body)
          : undefined,
    });

    const rawText = await upstreamRes.text();
    let payload;
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = { raw: rawText };
    }
    return res.status(upstreamRes.status).json(payload);
  } catch (err) {
    return res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
};
