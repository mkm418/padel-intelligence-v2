/**
 * Exhaustive Miami padel player + network scrape
 *
 * Fetches ALL matches from ALL clubs within 50 mi / 80 km of Miami,
 * extracts every unique player, fetches live levels, and builds a
 * co-occurrence network (who played with whom).
 *
 * Usage:  npx tsx scripts/scrape-miami-network.ts
 * Output: ../output/miami_network/{players,edges,scrape_meta}.json
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API = "https://api.playtomic.io/v1";
const MIAMI = "25.7617,-80.1918";
const RADIUS = 80000; // 80 km ≈ 50 mi
const MATCH_PAGE_SIZE = 200;
const CONCURRENCY_MATCHES = 5;
const CONCURRENCY_LEVELS = 10;
const DELAY_MS = 80; // small delay between batches

const OUT_DIR = join(__dirname, "../../output/miami_network");
const CHECKPOINT_DIR = join(OUT_DIR, "checkpoints");

// Clubs to skip (test/fraud/junk)
const SKIP_PATTERNS = [
  /test/i,
  /fraud/i,
  /\bdeez\b/i,
  /^ale$/i,
  /^real$/i,
  /bowlero/i,
  /NoStrings/i,
  /testasdasd/i,
  /VICTOR MACHIN/i,
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawClub {
  tenant_id: string;
  tenant_name: string;
  playtomic_status: string;
  resources: { sport_id: string }[];
}

interface RawMatch {
  match_id: string;
  start_date: string;
  teams: { players: RawPlayer[] }[];
  tenant: { tenant_id: string; tenant_name: string };
  resource_name?: string;
  game_status?: string;
}

interface RawPlayer {
  user_id: string;
  name: string;
  gender?: string;
  level_value?: number | null;
  level_confidence?: number | null;
  preferred_position?: string | null;
  is_premium?: boolean;
  picture?: string | null;
}

interface PlayerRecord {
  user_id: string;
  name: string;
  gender: string;
  level_value: number | null;
  level_confidence: number | null;
  preferred_position: string | null;
  is_premium: boolean;
  picture: string | null;
  clubs: string[];
  match_count: number;
  first_match: string;
  last_match: string;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
  clubs: string[];
  last_played: string;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchJSON<T>(url: string): Promise<{ data: T; total?: number }> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  const total = res.headers.get("total");
  const data = (await res.json()) as T;
  return { data, total: total ? parseInt(total, 10) : undefined };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Run tasks in batches of `n` with a delay between batches */
async function batchRun<T, R>(
  items: T[],
  n: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += n) {
    const batch = items.slice(i, i + n);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + n < items.length) await sleep(DELAY_MS);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Step 1: Fetch clubs
// ---------------------------------------------------------------------------

async function fetchClubs(): Promise<RawClub[]> {
  const url = `${API}/tenants?coordinate=${MIAMI}&radius=${RADIUS}&sport_id=PADEL&size=100`;
  const { data } = await fetchJSON<RawClub[]>(url);

  // Filter junk clubs
  const filtered = data.filter(
    (c) => !SKIP_PATTERNS.some((p) => p.test(c.tenant_name)),
  );

  console.log(
    `[clubs] ${data.length} total → ${filtered.length} after filtering junk`,
  );
  return filtered;
}

// ---------------------------------------------------------------------------
// Step 2: Paginate all matches for a club
// ---------------------------------------------------------------------------

async function fetchClubMatches(
  club: RawClub,
  clubIdx: number,
  totalClubs: number,
): Promise<RawMatch[]> {
  const tag = `[${clubIdx + 1}/${totalClubs}] ${club.tenant_name}`;
  const checkpointFile = join(CHECKPOINT_DIR, `${club.tenant_id}.json`);

  // Resume: if checkpoint exists, load from disk
  if (existsSync(checkpointFile)) {
    const cached = JSON.parse(
      readFileSync(checkpointFile, "utf-8"),
    ) as RawMatch[];
    console.log(`${tag} — loaded ${cached.length} matches from checkpoint`);
    return cached;
  }

  const allMatches: RawMatch[] = [];
  let page = 0;

  // Paginate until we get a page smaller than MATCH_PAGE_SIZE
  while (true) {
    // Fetch a batch of pages concurrently
    const pageNums = Array.from(
      { length: CONCURRENCY_MATCHES },
      (_, i) => page + i,
    );

    const results = await Promise.all(
      pageNums.map(async (p) => {
        const url = `${API}/matches?tenant_id=${club.tenant_id}&sport_id=PADEL&size=${MATCH_PAGE_SIZE}&page=${p}`;
        try {
          const { data } = await fetchJSON<RawMatch[]>(url);
          return data;
        } catch {
          return [] as RawMatch[];
        }
      }),
    );

    let done = false;
    for (const batch of results) {
      allMatches.push(...batch);
      if (batch.length < MATCH_PAGE_SIZE) {
        done = true;
        break;
      }
    }

    page += CONCURRENCY_MATCHES;

    if (allMatches.length > 0 && page % 20 === 0) {
      console.log(`${tag} — page ${page}, ${allMatches.length} matches so far`);
    }

    if (done) break;
    await sleep(DELAY_MS);
  }

  // Save checkpoint
  if (allMatches.length > 0) {
    writeFileSync(checkpointFile, JSON.stringify(allMatches));
  }
  console.log(`${tag} — ${allMatches.length} matches`);

  return allMatches;
}

// ---------------------------------------------------------------------------
// Step 3: Extract & deduplicate players from matches
// ---------------------------------------------------------------------------

function extractPlayers(
  allMatches: RawMatch[],
): { players: Map<string, PlayerRecord>; matchPlayers: { matchId: string; playerIds: string[]; club: string; date: string }[] } {
  const players = new Map<string, PlayerRecord>();
  const matchPlayers: { matchId: string; playerIds: string[]; club: string; date: string }[] = [];

  for (const match of allMatches) {
    const ids: string[] = [];
    const clubName = match.tenant?.tenant_name ?? "Unknown";

    for (const team of match.teams) {
      for (const p of team.players) {
        if (!p.user_id) continue;
        ids.push(p.user_id);

        const existing = players.get(p.user_id);
        if (existing) {
          existing.match_count++;
          if (!existing.clubs.includes(clubName)) existing.clubs.push(clubName);
          if (match.start_date < existing.first_match)
            existing.first_match = match.start_date;
          if (match.start_date > existing.last_match)
            existing.last_match = match.start_date;
          // Keep highest level seen
          if (
            p.level_value != null &&
            (existing.level_value == null ||
              p.level_value > existing.level_value)
          ) {
            existing.level_value = p.level_value;
            existing.level_confidence = p.level_confidence ?? null;
          }
          // Update name if current is more complete
          if (p.name && p.name.length > existing.name.length) {
            existing.name = p.name;
          }
          if (p.picture && !existing.picture) existing.picture = p.picture;
          if (p.gender && existing.gender === "UNKNOWN")
            existing.gender = p.gender;
          if (p.preferred_position && !existing.preferred_position)
            existing.preferred_position = p.preferred_position;
          if (p.is_premium) existing.is_premium = true;
        } else {
          players.set(p.user_id, {
            user_id: p.user_id,
            name: p.name ?? "Unknown",
            gender: p.gender ?? "UNKNOWN",
            level_value: p.level_value ?? null,
            level_confidence: p.level_confidence ?? null,
            preferred_position: p.preferred_position ?? null,
            is_premium: p.is_premium ?? false,
            picture: p.picture ?? null,
            clubs: [clubName],
            match_count: 1,
            first_match: match.start_date,
            last_match: match.start_date,
          });
        }
      }
    }

    if (ids.length >= 2) {
      matchPlayers.push({
        matchId: match.match_id,
        playerIds: ids,
        club: clubName,
        date: match.start_date,
      });
    }
  }

  return { players, matchPlayers };
}

// ---------------------------------------------------------------------------
// Step 4: Fetch live levels
// ---------------------------------------------------------------------------

async function fetchLiveLevels(
  players: Map<string, PlayerRecord>,
): Promise<void> {
  const ids = Array.from(players.keys());
  console.log(`[levels] Fetching live levels for ${ids.length} players...`);

  let completed = 0;
  let updated = 0;

  await batchRun(ids, CONCURRENCY_LEVELS, async (userId) => {
    try {
      const url = `${API}/levels?user_id=${userId}`;
      const { data } = await fetchJSON<
        { sport_id: string; level_value: number; level_confidence: number }[]
      >(url);
      const padel = data.find((l) => l.sport_id === "PADEL");
      if (padel) {
        const p = players.get(userId)!;
        p.level_value = padel.level_value;
        p.level_confidence = padel.level_confidence;
        updated++;
      }
    } catch {
      // silently skip — player may not have a level
    }

    completed++;
    if (completed % 500 === 0) {
      console.log(
        `  ${completed}/${ids.length} checked, ${updated} levels updated`,
      );
    }
  });

  console.log(
    `[levels] Done — ${updated}/${ids.length} players have live padel levels`,
  );
}

// ---------------------------------------------------------------------------
// Step 5: Build network edges
// ---------------------------------------------------------------------------

function buildEdges(
  matchPlayers: { matchId: string; playerIds: string[]; club: string; date: string }[],
): Edge[] {
  console.log(`[edges] Building network from ${matchPlayers.length} matches...`);

  const edgeMap = new Map<string, Edge>();

  for (const { playerIds, club, date } of matchPlayers) {
    // Create edges for all pairs of players in this match
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        // Canonical key: smaller id first
        const [a, b] =
          playerIds[i] < playerIds[j]
            ? [playerIds[i], playerIds[j]]
            : [playerIds[j], playerIds[i]];
        const key = `${a}:${b}`;

        const existing = edgeMap.get(key);
        if (existing) {
          existing.weight++;
          if (!existing.clubs.includes(club)) existing.clubs.push(club);
          if (date > existing.last_played) existing.last_played = date;
        } else {
          edgeMap.set(key, {
            source: a,
            target: b,
            weight: 1,
            clubs: [club],
            last_played: date,
          });
        }
      }
    }
  }

  const edges = Array.from(edgeMap.values());
  console.log(`[edges] ${edges.length} unique connections`);
  return edges;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const t0 = Date.now();
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(CHECKPOINT_DIR, { recursive: true });

  // Step 1: Clubs
  console.log("\n=== STEP 1: FETCH CLUBS ===\n");
  const clubs = await fetchClubs();

  // Step 2: All matches across all clubs
  console.log("\n=== STEP 2: FETCH ALL MATCHES ===\n");
  const allMatches: RawMatch[] = [];
  for (let i = 0; i < clubs.length; i++) {
    const matches = await fetchClubMatches(clubs[i], i, clubs.length);
    allMatches.push(...matches);
  }
  console.log(`\nTotal matches collected: ${allMatches.length.toLocaleString()}`);

  // Step 3: Extract players
  console.log("\n=== STEP 3: EXTRACT & DEDUPLICATE PLAYERS ===\n");
  const { players, matchPlayers } = extractPlayers(allMatches);
  console.log(
    `Unique players: ${players.size.toLocaleString()} from ${matchPlayers.length.toLocaleString()} multi-player matches`,
  );

  // Step 4: Live levels
  console.log("\n=== STEP 4: FETCH LIVE LEVELS ===\n");
  await fetchLiveLevels(players);

  // Step 5: Build edges
  console.log("\n=== STEP 5: BUILD NETWORK EDGES ===\n");
  const edges = buildEdges(matchPlayers);

  // Write output
  console.log("\n=== WRITING OUTPUT ===\n");

  const playersArr = Array.from(players.values()).sort(
    (a, b) => b.match_count - a.match_count,
  );

  writeFileSync(
    join(OUT_DIR, "players.json"),
    JSON.stringify(playersArr, null, 2),
  );
  console.log(`players.json — ${playersArr.length.toLocaleString()} players`);

  writeFileSync(join(OUT_DIR, "edges.json"), JSON.stringify(edges, null, 2));
  console.log(`edges.json — ${edges.length.toLocaleString()} edges`);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const meta = {
    scraped_at: new Date().toISOString(),
    elapsed_seconds: parseFloat(elapsed),
    total_clubs: clubs.length,
    total_matches: allMatches.length,
    unique_players: playersArr.length,
    unique_edges: edges.length,
    players_with_level: playersArr.filter((p) => p.level_value != null).length,
    top_clubs: clubs
      .map((c) => ({
        name: c.tenant_name,
        id: c.tenant_id,
        status: c.playtomic_status,
      }))
      .slice(0, 40),
  };
  writeFileSync(
    join(OUT_DIR, "scrape_meta.json"),
    JSON.stringify(meta, null, 2),
  );
  console.log(`scrape_meta.json written`);

  console.log(`\n✓ Done in ${elapsed}s`);
  console.log(`  ${meta.total_clubs} clubs`);
  console.log(`  ${meta.total_matches.toLocaleString()} matches`);
  console.log(`  ${meta.unique_players.toLocaleString()} players`);
  console.log(`  ${meta.unique_edges.toLocaleString()} connections`);
  console.log(`  ${meta.players_with_level.toLocaleString()} have levels`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
