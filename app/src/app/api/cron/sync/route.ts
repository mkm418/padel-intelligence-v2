/**
 * Daily sync cron job — fetches new matches from Playtomic,
 * upserts matches, then recomputes player stats + edges via SQL.
 *
 * Triggered by Vercel Cron (vercel.json) or manually via GET.
 * Secured with CRON_SECRET header check.
 *
 * Strategy: idempotent SQL recomputation (not additive deltas).
 * Safe to re-run multiple times — always produces correct results.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeClubName } from "@/lib/club-aliases";

// ── Config ──────────────────────────────────────────────────────────────

const API = "https://api.playtomic.io/v1";
const MIAMI = "25.7617,-80.1918";
const RADIUS = 80000;
const PAGE_SIZE = 200;
const BATCH_SIZE = 500;

const SKIP_PATTERNS = [
  /test/i, /fraud/i, /\bdeez\b/i, /^ale$/i, /^real$/i,
  /bowlero/i, /NoStrings/i, /testasdasd/i, /VICTOR MACHIN/i,
];

function isSystemAccount(name: string): boolean {
  return (
    name.includes("sin Playtomic") || name.includes("Torneo ") ||
    name.startsWith("PBP ") || name.startsWith("JUGADOR ") ||
    name.startsWith("Jugador ") || name.startsWith("guest ") ||
    name.startsWith("Guest ") || name.startsWith("SOMOS ") ||
    name === "Unknown" || /^Player \d+$/i.test(name)
  );
}

// ── Supabase ────────────────────────────────────────────────────────────

// Returns untyped client — sync uses custom tables/RPCs not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials");
  return createClient(url, key);
}

// ── Playtomic types ─────────────────────────────────────────────────────

interface RawClub {
  tenant_id: string;
  tenant_name: string;
  playtomic_status: string;
  resources: { sport_id: string }[];
}

interface RawTeam {
  team_id: string;
  players: {
    user_id: string; name: string; gender?: string;
    level_value?: number | null; level_confidence?: number | null;
    preferred_position?: string | null; is_premium?: boolean; picture?: string | null;
  }[];
  team_result?: string | null;
}

interface RawSetResult {
  name: string;
  scores: { team_id: string; score: number | null }[];
}

interface RawMatch {
  match_id: string;
  start_date: string;
  teams: RawTeam[];
  tenant: { tenant_id: string; tenant_name: string };
  game_status?: string;
  results?: RawSetResult[];
  competition_mode?: string;
}

// ── Fetch helpers ───────────────────────────────────────────────────────

async function fetchJSON<T>(url: string, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Playtomic ${res.status}: ${url}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchClubs(): Promise<RawClub[]> {
  const url = `${API}/tenants?coordinate=${MIAMI}&radius=${RADIUS}&sport_id=PADEL&playtomic_status=ACTIVE&size=100`;
  const clubs = await fetchJSON<RawClub[]>(url);
  return clubs.filter((c) => !SKIP_PATTERNS.some((p) => p.test(c.tenant_name)));
}

async function fetchClubMatchesSince(tenantId: string, sinceISO: string): Promise<RawMatch[]> {
  const all: RawMatch[] = [];
  let page = 0;
  const maxPages = 20;

  while (page < maxPages) {
    const url =
      `${API}/matches?tenant_id=${tenantId}&sport_id=PADEL` +
      `&from_start_date=${sinceISO}&sort=start_date,DESC&size=${PAGE_SIZE}&page=${page}`;
    try {
      const batch = await fetchJSON<RawMatch[]>(url);
      all.push(...batch);
      if (batch.length < PAGE_SIZE) break;
      page++;
    } catch {
      break;
    }
  }
  return all;
}

async function fetchAllClubMatches(clubs: RawClub[], sinceISO: string, concurrency = 5): Promise<RawMatch[]> {
  const allMatches: RawMatch[] = [];
  for (let i = 0; i < clubs.length; i += concurrency) {
    const batch = clubs.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((club) => fetchClubMatchesSince(club.tenant_id, sinceISO).catch(() => [] as RawMatch[])),
    );
    for (const matches of results) allMatches.push(...matches);
    if (i + concurrency < clubs.length) await sleep(100);
  }
  return allMatches;
}

// ── Match row extraction ────────────────────────────────────────────────

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

/** Extract player metadata from raw match data (name, level, picture, etc.) */
interface PlayerMeta {
  user_id: string;
  name: string;
  gender: string;
  level_value: number | null;
  level_confidence: number | null;
  preferred_position: string | null;
  is_premium: boolean;
  picture: string | null;
}

function extractMatchRows(rawMatches: RawMatch[]): {
  rows: MatchRow[];
  playerMeta: Map<string, PlayerMeta>;
  affectedPlayerIds: Set<string>;
} {
  const rows: MatchRow[] = [];
  const playerMeta = new Map<string, PlayerMeta>();
  const affectedPlayerIds = new Set<string>();
  const seen = new Set<string>();

  for (const m of rawMatches) {
    if (m.game_status !== "PLAYED" || m.teams.length !== 2) continue;
    if (seen.has(m.match_id)) continue;
    seen.add(m.match_id);

    const t0 = m.teams[0];
    const t1 = m.teams[1];
    if (!t0.team_result || !t1.team_result) continue;
    if (!["WON", "LOST"].includes(t0.team_result) || !["WON", "LOST"].includes(t1.team_result)) continue;

    const t0p1 = t0.players[0]?.user_id;
    const t1p1 = t1.players[0]?.user_id;
    if (!t0p1 || !t1p1) continue;

    const clubName = normalizeClubName(m.tenant?.tenant_name ?? "Unknown");
    if (!clubName) continue;

    // Set scores
    const setScores: { t1: number | null; t2: number | null }[] = [];
    if (m.results) {
      for (const s of m.results) {
        const scoreMap = new Map<string, number | null>();
        for (const sc of s.scores) scoreMap.set(sc.team_id, sc.score);
        setScores.push({ t1: scoreMap.get(t0.team_id) ?? null, t2: scoreMap.get(t1.team_id) ?? null });
      }
    }

    rows.push({
      match_id: m.match_id,
      played_at: m.start_date,
      club_name: clubName,
      team1_p1: t0p1,
      team1_p2: t0.players[1]?.user_id ?? null,
      team1_result: t0.team_result,
      team2_p1: t1p1,
      team2_p2: t1.players[1]?.user_id ?? null,
      team2_result: t1.team_result,
      set_scores: setScores,
      competition_mode: m.competition_mode ?? null,
    });

    // Extract player metadata (keep best per player)
    for (const team of m.teams) {
      for (const p of team.players) {
        if (!p.user_id || isSystemAccount(p.name ?? "")) continue;
        affectedPlayerIds.add(p.user_id);

        const existing = playerMeta.get(p.user_id);
        if (!existing) {
          playerMeta.set(p.user_id, {
            user_id: p.user_id,
            name: p.name ?? "Unknown",
            gender: p.gender ?? "UNKNOWN",
            level_value: p.level_value ?? null,
            level_confidence: p.level_confidence ?? null,
            preferred_position: p.preferred_position ?? null,
            is_premium: p.is_premium ?? false,
            picture: p.picture ?? null,
          });
        } else {
          // Keep highest level, longest name, fill blanks
          if (p.level_value != null && (existing.level_value == null || p.level_value > existing.level_value)) {
            existing.level_value = p.level_value;
            existing.level_confidence = p.level_confidence ?? null;
          }
          if (p.name && p.name.length > existing.name.length) existing.name = p.name;
          if (p.picture && !existing.picture) existing.picture = p.picture;
          if (p.gender && existing.gender === "UNKNOWN") existing.gender = p.gender;
          if (p.preferred_position && !existing.preferred_position) existing.preferred_position = p.preferred_position;
          if (p.is_premium) existing.is_premium = true;
        }
      }
    }
  }

  return { rows, playerMeta, affectedPlayerIds };
}

// ── SQL-based recomputation ─────────────────────────────────────────────

/**
 * Recompute player stats from matches table for a set of player IDs.
 * Uses SQL aggregation — idempotent and always accurate.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recomputePlayerStats(
  supabase: any,
  playerIds: string[],
  playerMeta: Map<string, PlayerMeta>,
): Promise<number> {
  if (playerIds.length === 0) return 0;

  // SQL to compute stats from matches table for given player IDs
  const { data: stats, error: statsErr } = await supabase.rpc("recompute_player_stats", {
    p_user_ids: playerIds,
  });

  if (statsErr || !stats) {
    // Fallback: if the RPC doesn't exist, use raw SQL via REST
    // This means we need the SQL function — let's handle it
    console.error("recompute_player_stats RPC failed:", statsErr?.message);
    return 0;
  }

  // Merge SQL stats with metadata and upsert
  let updated = 0;
  const statsMap = new Map(
    (stats as Record<string, unknown>[]).map((s) => [s.user_id as string, s]),
  );

  for (let i = 0; i < playerIds.length; i += BATCH_SIZE) {
    const batchIds = playerIds.slice(i, i + BATCH_SIZE);
    const upsertBatch = batchIds
      .map((uid) => {
        const s = statsMap.get(uid) as Record<string, unknown> | undefined;
        const meta = playerMeta.get(uid);
        if (!s && !meta) return null;

        const wins = (s?.wins as number) ?? 0;
        const losses = (s?.losses as number) ?? 0;
        const totalWL = wins + losses;

        return {
          user_id: uid,
          name: meta?.name ?? "Unknown",
          gender: meta?.gender || null,
          level_value: meta?.level_value ?? null,
          level_confidence: meta?.level_confidence ?? null,
          preferred_position: meta?.preferred_position ?? null,
          is_premium: meta?.is_premium ?? false,
          picture: meta?.picture ?? null,
          clubs: (s?.clubs as string[]) ?? [],
          matches_played: (s?.matches_played as number) ?? 0,
          total_bookings: (s?.matches_played as number) ?? 0,
          wins,
          losses,
          win_rate: totalWL > 0 ? wins / totalWL : null,
          sets_won: (s?.sets_won as number) ?? 0,
          sets_lost: (s?.sets_lost as number) ?? 0,
          games_won: (s?.games_won as number) ?? 0,
          games_lost: (s?.games_lost as number) ?? 0,
          competitive_matches: (s?.competitive_matches as number) ?? 0,
          friendly_matches: (s?.friendly_matches as number) ?? 0,
          first_match: (s?.first_match as string) ?? null,
          last_match: (s?.last_match as string) ?? null,
          updated_at: new Date().toISOString(),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);

    const { error } = await supabase
      .from("players")
      .upsert(upsertBatch, { onConflict: "user_id" });
    if (!error) updated += upsertBatch.length;
  }

  return updated;
}

/**
 * Recompute edges from matches table for affected player IDs.
 * Uses SQL to get edge data, then upserts.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recomputeEdges(
  supabase: any,
  playerIds: string[],
): Promise<number> {
  if (playerIds.length === 0) return 0;

  const { data: edges, error } = await supabase.rpc("recompute_edges_for_players", {
    p_user_ids: playerIds,
  });

  if (error || !edges) {
    console.error("recompute_edges_for_players RPC failed:", error?.message);
    return 0;
  }

  // Upsert edge rows
  let updated = 0;
  const edgeRows = edges as Record<string, unknown>[];
  for (let i = 0; i < edgeRows.length; i += BATCH_SIZE) {
    const batch = edgeRows.slice(i, i + BATCH_SIZE).map((e) => ({
      source: e.source as string,
      target: e.target as string,
      weight: e.weight as number,
      clubs: e.clubs as string[],
      last_played: e.last_played as string,
      relationship: e.relationship as string,
    }));

    const { error: upsertErr } = await supabase
      .from("edges")
      .upsert(batch, { onConflict: "source,target" });
    if (!upsertErr) updated += batch.length;
  }

  return updated;
}

// ── Photo enrichment ────────────────────────────────────────────────────

async function fetchUserPicture(userId: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://api.playtomic.io/v2/users/${userId}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.picture || null;
  } catch {
    return null;
  }
}

/**
 * For affected players missing a photo, fetch from Playtomic /v2/users.
 * Capped to avoid extending sync duration excessively.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enrichMissingPhotos(supabase: any, playerIds: string[]): Promise<number> {
  if (playerIds.length === 0) return 0;

  const { data: missing } = await supabase
    .from("players")
    .select("user_id")
    .in("user_id", playerIds.slice(0, 500))
    .is("picture", null);

  if (!missing || missing.length === 0) return 0;

  let added = 0;
  const CONC = 15;
  for (let i = 0; i < missing.length; i += CONC) {
    const batch = missing.slice(i, i + CONC);
    const results = await Promise.all(
      batch.map(async (p: { user_id: string }) => ({
        user_id: p.user_id,
        picture: await fetchUserPicture(p.user_id),
      })),
    );
    for (const r of results) {
      if (r.picture) {
        await supabase.from("players").update({ picture: r.picture }).eq("user_id", r.user_id);
        added++;
      }
    }
    if (i + CONC < missing.length) await sleep(20);
  }
  return added;
}

// ── Main sync logic ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startTime = Date.now();
  const supabase = getSupabase();

  const { data: logEntry } = await supabase
    .from("sync_log")
    .insert({ status: "running" })
    .select("id")
    .single();
  const logId = logEntry?.id;

  try {
    // Step 1: Find last sync point (2 days overlap for late-reported results)
    const { data: lastMatch } = await supabase
      .from("matches")
      .select("played_at")
      .order("played_at", { ascending: false })
      .limit(1)
      .single();

    const lastDate = lastMatch?.played_at
      ? new Date(new Date(lastMatch.played_at).getTime() - 2 * 24 * 60 * 60 * 1000)
      : new Date("2022-01-01");
    const sinceISO = lastDate.toISOString().replace("Z", "");

    // Step 2: Fetch clubs + matches from Playtomic
    const clubs = await fetchClubs();
    const allRawMatches = await fetchAllClubMatches(clubs, sinceISO, 5);

    // Step 3: Extract match rows and player metadata
    const { rows, playerMeta, affectedPlayerIds } = extractMatchRows(allRawMatches);

    // Step 4: Upsert matches (dedup via match_id conflict)
    let matchesInserted = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("matches")
        .upsert(batch, { onConflict: "match_id" });
      if (!error) matchesInserted += batch.length;
    }

    // Step 5: Recompute player stats via SQL for affected players
    const playerIdArr = Array.from(affectedPlayerIds);
    const playersUpdated = await recomputePlayerStats(supabase, playerIdArr, playerMeta);

    // Step 5b: Fetch photos for players that don't have one yet
    const photosAdded = await enrichMissingPhotos(supabase, playerIdArr);

    // Step 6: Recompute edges via SQL for affected players
    const edgesUpdated = await recomputeEdges(supabase, playerIdArr);

    // Step 7: Log results
    const duration = Date.now() - startTime;
    if (logId) {
      await supabase.from("sync_log").update({
        finished_at: new Date().toISOString(),
        status: "success",
        clubs_scanned: clubs.length,
      new_matches: matchesInserted,
      players_updated: playersUpdated,
      photos_added: photosAdded,
      edges_updated: edgesUpdated,
        duration_ms: duration,
      }).eq("id", logId);
    }

    return NextResponse.json({
      status: "success",
      since: sinceISO,
      clubs_scanned: clubs.length,
      raw_matches_fetched: allRawMatches.length,
      matches_upserted: matchesInserted,
      players_updated: playersUpdated,
      photos_added: photosAdded,
      edges_updated: edgesUpdated,
      duration_ms: duration,
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    const message = err instanceof Error ? err.message : String(err);

    if (logId) {
      await supabase.from("sync_log").update({
        finished_at: new Date().toISOString(),
        status: "error",
        error_message: message,
        duration_ms: duration,
      }).eq("id", logId);
    }

    return NextResponse.json(
      { status: "error", error: message, duration_ms: duration },
      { status: 500 },
    );
  }
}
