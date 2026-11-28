const SUPABASE_URL = (
  process.env.KAI_SUPABASE_URL || "https://dttclgkjfiwcovvqrckw.supabase.co"
).replace(/\/+$/, "");

const SUPABASE_ANON =
  process.env.KAI_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dGNsZ2tqZml3Y292dnFyY2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2NTkzNzQsImV4cCI6MjExMTIzNTM3NH0.ozBfRkrgcVUBMfWTmOGhQprvoFLYcIzHr30-AGnlijE";

module.exports = async function handler(req, res) {
  try {
    const assetUrl = `${SUPABASE_URL}/rest/v1/gio_web_assets?name=eq.copy-hub-v46.html&select=content_type,body`;
    const r = await fetch(assetUrl, {
      headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON },
    });
    const rows = await r.json().catch(() => []);
    if (!r.ok || !Array.isArray(rows) || !rows.length) {
      res.status(502).send("Copy Hub v46 asset belum tersedia di Supabase gio_web_assets.");
      return;
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, must-revalidate");
    let html = String(rows[0].body || "");
    if (!html.includes("kai-kyc-v47.js")) {
      html = html.replace(
        /(<script[^>]*kai-security-v46\.js[^>]*><\/script>)/i,
        '$1\n    <script src="assets/kai-kyc-v47.js?v=20261128v47"></script>'
      );
    }
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send("Kesalahan memuat copy-hub: " + (err && err.message ? err.message : String(err)));
  }
};
