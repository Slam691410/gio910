/**
 * dao-hybrid-sync.ts — Sinkronisasi Hybrid DAO untuk Supabase Edge / Cron (Pengganti dao_hybrid_bridge.gs)
 * Mengambil proposal dari Snapshot GraphQL (Space ENS: gio910gerai.eth),
 * menyimpannya ke tabel public.dao_proposals di Supabase Postgres,
 * serta meneruskannya ke Google Sheets (tab DAO_Proposals) melalui Hub Konektor.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const SNAPSHOT_HUB = "https://hub.snapshot.org/graphql";

export async function syncSnapshotToSupabase(opts?: {
  space?: string;
  supabaseUrl?: string;
  serviceRoleKey?: string;
}) {
  const space = opts?.space || Deno.env.get("DAO_ENS_SPACE") || "gio910gerai.eth";
  const url = opts?.supabaseUrl || Deno.env.get("SUPABASE_URL") || "";
  const key = opts?.serviceRoleKey || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi.");

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const query = `
    query ($space: String!) {
      proposals(first: 20, skip: 0, where: { space_in: [$space] }, orderBy: "created", orderDirection: desc) {
        id title body choices scores scores_total state start end author
      }
    }
  `;

  const res = await fetch(SNAPSHOT_HUB, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { space } }),
  });
  const json = await res.json();
  const proposals = json?.data?.proposals || [];

  for (const p of proposals) {
    await supabase.from("dao_proposals").upsert(
      {
        proposal_code: `SNAP-${String(p.id).slice(0, 8).toUpperCase()}`,
        mode: "hybrid",
        space_or_contract: space,
        title: p.title,
        description: String(p.body || "").slice(0, 2000),
        state: p.state || "active",
        for_votes: Number(p.scores?.[0] || 0),
        against_votes: Number(p.scores?.[1] || 0),
        abstain_votes: Number(p.scores?.[2] || 0),
        snapshot_id: p.id,
      },
      { onConflict: "proposal_code" }
    );
  }

  await supabase.from("gio_connector_events").insert({
    connector_slug: "google_sheets",
    direction: "supabase->connector",
    action: "dao.snapshot.sync",
    status: "applied",
    payload: { space, syncedCount: proposals.length },
    actor_name: "DAO Hybrid Sync",
  });

  return { ok: true, space, syncedCount: proposals.length };
}
