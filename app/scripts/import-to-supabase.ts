/**
 * Import players.json and edges.json into Supabase.
 * Uses the service role key (or anon key with RLS disabled) for bulk inserts.
 *
 * Usage: npx tsx scripts/import-to-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ouvauinbtbfpyhvxwowp.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!SUPABASE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DATA_DIR = join(__dirname, "../../output/miami_network");
const BATCH_SIZE = 500;

interface PlayerRaw {
  user_id: string;
  name: string;
  gender: string;
  level_value: number | null;
  level_confidence: number | null;
  preferred_position: string | null;
  is_premium: boolean;
  picture: string | null;
  clubs: string[];
  matches_played: number;
  total_bookings: number;
  wins: number;
  losses: number;
  win_rate: number | null;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  first_match: string;
  last_match: string;
  unique_teammates: number;
  unique_opponents: number;
  competitive_matches: number;
  friendly_matches: number;
}

interface EdgeRaw {
  source: string;
  target: string;
  weight: number;
  clubs: string[];
  last_played: string;
  relationship: "teammate" | "opponent" | "mixed";
}

async function importPlayers() {
  const players: PlayerRaw[] = JSON.parse(
    readFileSync(join(DATA_DIR, "players.json"), "utf-8"),
  );
  console.log(`Importing ${players.length.toLocaleString()} players...`);

  let inserted = 0;
  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = players.slice(i, i + BATCH_SIZE).map((p) => ({
      user_id: p.user_id,
      name: p.name,
      gender: p.gender || null,
      level_value: p.level_value,
      level_confidence: p.level_confidence,
      preferred_position: p.preferred_position,
      is_premium: p.is_premium,
      picture: p.picture,
      clubs: p.clubs,
      matches_played: p.matches_played,
      total_bookings: p.total_bookings,
      wins: p.wins,
      losses: p.losses,
      win_rate: p.win_rate,
      sets_won: p.sets_won,
      sets_lost: p.sets_lost,
      games_won: p.games_won,
      games_lost: p.games_lost,
      first_match: p.first_match || null,
      last_match: p.last_match || null,
      unique_teammates: p.unique_teammates,
      unique_opponents: p.unique_opponents,
      competitive_matches: p.competitive_matches,
      friendly_matches: p.friendly_matches,
    }));

    const { error } = await supabase.from("players").upsert(batch, {
      onConflict: "user_id",
    });

    if (error) {
      console.error(`  Batch ${i} error:`, error.message);
    } else {
      inserted += batch.length;
    }

    if (inserted % 5000 === 0 || i + BATCH_SIZE >= players.length) {
      console.log(`  ${inserted.toLocaleString()} / ${players.length.toLocaleString()}`);
    }
  }
  console.log(`✓ Players done: ${inserted.toLocaleString()}`);
}

async function importEdges() {
  const edges: EdgeRaw[] = JSON.parse(
    readFileSync(join(DATA_DIR, "edges.json"), "utf-8"),
  );
  console.log(`Importing ${edges.length.toLocaleString()} edges...`);

  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < edges.length; i += BATCH_SIZE) {
    const batch = edges.slice(i, i + BATCH_SIZE).map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
      clubs: e.clubs,
      last_played: e.last_played || null,
      relationship: e.relationship,
    }));

    const { error } = await supabase.from("edges").upsert(batch, {
      onConflict: "source,target",
    });

    if (error) {
      errors++;
      if (errors <= 3) console.error(`  Batch ${i} error:`, error.message);
    } else {
      inserted += batch.length;
    }

    if (inserted % 10000 === 0 || i + BATCH_SIZE >= edges.length) {
      console.log(`  ${inserted.toLocaleString()} / ${edges.length.toLocaleString()} (${errors} batch errors)`);
    }
  }
  console.log(`✓ Edges done: ${inserted.toLocaleString()}`);
}

async function main() {
  // Disable RLS for bulk import (we'll re-enable after)
  console.log("Starting import...\n");
  await importPlayers();
  console.log("");
  await importEdges();
  console.log("\n✓ All done!");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
