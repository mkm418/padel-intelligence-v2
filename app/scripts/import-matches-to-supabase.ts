/**
 * Extract individual match results from checkpoint files and upload to Supabase.
 * This powers the H2H feature with real head-to-head W/L records.
 *
 * Usage: npx tsx scripts/import-matches-to-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ouvauinbtbfpyhvxwowp.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!SUPABASE_KEY) {
  console.error("Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CHECKPOINT_DIR = join(__dirname, "../../output/miami_network/checkpoints");
const BATCH_SIZE = 500;

// ── Types from checkpoint data ──────────────────────────────────────────

interface RawTeam {
  team_id: string;
  players: { user_id: string; name: string }[];
  team_result?: string | null; // "WON" | "LOST" | null
}

interface RawSetResult {
  name: string;
  scores: { team_id: string; score: number | null }[];
}

interface RawMatch {
  match_id: string;
  start_date: string;
  teams: RawTeam[];
  tenant: { tenant_name: string };
  game_status?: string;
  results?: RawSetResult[];
  competition_mode?: string;
}

// ── Row format for Supabase ─────────────────────────────────────────────

interface MatchRow {
  match_id: string;
  played_at: string;
  club_name: string;
  team1_p1: string;
  team1_p2: string | null;
  team1_result: string;
  team2_p1: string;
  team2_p2: string | null;
  team2_result: string;
  set_scores: { t1: number | null; t2: number | null }[];
  competition_mode: string | null;
}

async function main() {
  const files = readdirSync(CHECKPOINT_DIR).filter((f) => f.endsWith(".json"));
  console.log(`Found ${files.length} checkpoint files`);

  const rows: MatchRow[] = [];
  const seenIds = new Set<string>();

  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(CHECKPOINT_DIR, file), "utf-8"));
    const matches: RawMatch[] = Array.isArray(raw) ? raw : raw.matches ?? [];

    for (const m of matches) {
      // Only PLAYED matches with 2 teams
      if (m.game_status !== "PLAYED") continue;
      if (m.teams.length !== 2) continue;

      const t0 = m.teams[0];
      const t1 = m.teams[1];

      // Both teams must have results
      if (!t0.team_result || !t1.team_result) continue;
      if (!["WON", "LOST"].includes(t0.team_result)) continue;
      if (!["WON", "LOST"].includes(t1.team_result)) continue;

      // Each team needs at least 1 player with a valid user_id
      const t0p1 = t0.players[0]?.user_id;
      const t1p1 = t1.players[0]?.user_id;
      if (!t0p1 || !t1p1) continue;

      // Deduplicate
      if (seenIds.has(m.match_id)) continue;
      seenIds.add(m.match_id);

      // Extract set scores
      const setScores: { t1: number | null; t2: number | null }[] = [];
      if (m.results) {
        for (const s of m.results) {
          const scoreMap = new Map<string, number | null>();
          for (const sc of s.scores) {
            scoreMap.set(sc.team_id, sc.score);
          }
          setScores.push({
            t1: scoreMap.get(t0.team_id) ?? null,
            t2: scoreMap.get(t1.team_id) ?? null,
          });
        }
      }

      rows.push({
        match_id: m.match_id,
        played_at: m.start_date,
        club_name: m.tenant.tenant_name,
        team1_p1: t0p1,
        team1_p2: t0.players[1]?.user_id ?? null,
        team1_result: t0.team_result,
        team2_p1: t1p1,
        team2_p2: t1.players[1]?.user_id ?? null,
        team2_result: t1.team_result,
        set_scores: setScores,
        competition_mode: m.competition_mode ?? null,
      });
    }
  }

  console.log(`Extracted ${rows.length} matches with results`);

  // Upload in batches
  let uploaded = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("matches")
      .upsert(batch, { onConflict: "match_id" });

    if (error) {
      console.error(`Batch ${i}-${i + batch.length} error:`, error.message);
      errors++;
    } else {
      uploaded += batch.length;
    }

    // Progress log every 5 batches
    if ((i / BATCH_SIZE) % 5 === 0) {
      console.log(`  ${uploaded}/${rows.length} uploaded...`);
    }
  }

  console.log(`\nDone! ${uploaded} matches uploaded, ${errors} batch errors`);

  // Verify count
  const { count } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true });
  console.log(`Total matches in Supabase: ${count}`);
}

main().catch(console.error);
