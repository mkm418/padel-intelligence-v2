/**
 * Reprocess existing checkpoint data with corrected logic:
 *
 * 1. Only count PLAYED matches (not CANCELED/PENDING)
 * 2. Only count matches with 2+ real players
 * 3. Extract W/L records and set scores per player
 * 4. Track teammates vs opponents separately
 * 5. Compute deeper per-player stats
 *
 * Usage:  npx tsx scripts/reprocess-network.ts
 * Input:  ../output/miami_network/checkpoints/*.json
 * Output: ../output/miami_network/{players,edges,scrape_meta}.json (overwrite)
 */

import { writeFileSync, readFileSync, readdirSync, mkdirSync } from "fs";
import { join } from "path";

const OUT_DIR = join(__dirname, "../../output/miami_network");
const CHECKPOINT_DIR = join(OUT_DIR, "checkpoints");

// ─── Types ──────────────────────────────────────────────────────────────

interface RawTeam {
  team_id: string;
  players: {
    user_id: string;
    name: string;
    gender?: string;
    level_value?: number | null;
    level_confidence?: number | null;
    preferred_position?: string | null;
    is_premium?: boolean;
    picture?: string | null;
  }[];
  team_result?: string | null; // "WON" | "LOST" | null
}

interface RawSetResult {
  name: string; // "Set-1", "Set-2", "Set-3"
  scores: { team_id: string; score: number | null }[];
}

interface RawMatch {
  match_id: string;
  start_date: string;
  end_date?: string;
  teams: RawTeam[];
  tenant: { tenant_id: string; tenant_name: string };
  resource_name?: string;
  game_status?: string;        // "PLAYED" | "CANCELED" | "PENDING"
  results_status?: string;     // "CONFIRMED" | "NOT_ALLOWED" | etc.
  results?: RawSetResult[];
  visibility?: string;         // "HIDDEN" | "VISIBLE"
  competition_mode?: string;   // "COMPETITIVE" | "FRIENDLY"
  match_type?: string;         // "BOOKING" | "OPEN_MATCH"
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

  // Corrected: only PLAYED matches with 2+ players
  matches_played: number;
  // Original raw count for reference
  total_bookings: number;

  // W/L record (from matches with confirmed results)
  wins: number;
  losses: number;
  win_rate: number | null; // null if no W/L data

  // Set-level stats
  sets_won: number;
  sets_lost: number;
  games_won: number;   // total individual game points
  games_lost: number;

  // Activity
  first_match: string;
  last_match: string;

  // Teammates & opponents
  unique_teammates: number;  // computed after edges
  unique_opponents: number;  // computed after edges

  // Matches by type
  competitive_matches: number;
  friendly_matches: number;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
  clubs: string[];
  last_played: string;
  relationship: "teammate" | "opponent" | "mixed";
}

// ─── Helpers ────────────────────────────────────────────────────────────

function isSystemAccount(name: string): boolean {
  return (
    name.includes("sin Playtomic") ||
    name.includes("Torneo ") ||
    name.startsWith("PBP ") ||
    name.startsWith("JUGADOR ") ||
    name.startsWith("Jugador ") ||
    name.startsWith("guest ") ||
    name.startsWith("Guest ") ||
    name.startsWith("SOMOS ") ||
    name === "Unknown" ||
    /^Player \d+$/i.test(name)
  );
}

// ─── Main ───────────────────────────────────────────────────────────────

function main() {
  const t0 = Date.now();
  mkdirSync(OUT_DIR, { recursive: true });

  // Load all checkpoints
  console.log("=== LOADING CHECKPOINTS ===\n");
  const files = readdirSync(CHECKPOINT_DIR).filter((f) => f.endsWith(".json"));
  console.log(`Found ${files.length} checkpoint files`);

  let totalRaw = 0;
  let totalPlayed = 0;
  let totalCanceled = 0;
  let totalPending = 0;
  let totalWith2Plus = 0;
  let totalWithResults = 0;
  let totalWithScores = 0;

  const players = new Map<string, PlayerRecord>();

  // Track per-match team membership for edge building
  const matchRecords: {
    matchId: string;
    team0: string[];  // player IDs on team 0
    team1: string[];  // player IDs on team 1
    club: string;
    date: string;
    team0Result: string | null;
    team1Result: string | null;
  }[] = [];

  for (const file of files) {
    const matches: RawMatch[] = JSON.parse(
      readFileSync(join(CHECKPOINT_DIR, file), "utf-8"),
    );

    for (const match of matches) {
      totalRaw++;

      // ── Filter: only PLAYED matches ──
      if (match.game_status !== "PLAYED") {
        if (match.game_status === "CANCELED") totalCanceled++;
        else totalPending++;
        continue;
      }
      totalPlayed++;

      // ── Collect all player IDs in this match ──
      const allPlayerIds: string[] = [];
      for (const team of match.teams) {
        for (const p of team.players) {
          if (p.user_id) allPlayerIds.push(p.user_id);
        }
      }

      const clubName = match.tenant?.tenant_name ?? "Unknown";
      const isCompetitive = match.competition_mode === "COMPETITIVE";

      // ── Extract W/L and scores ──
      const team0Result = match.teams[0]?.team_result ?? null;
      const team1Result = match.teams[1]?.team_result ?? null;
      const hasResult = team0Result === "WON" || team0Result === "LOST";

      // Parse set scores
      let setScores: { team0: number; team1: number }[] = [];
      if (match.results) {
        for (const set of match.results) {
          if (set.scores.length >= 2) {
            const s0 = set.scores.find((s) => s.team_id === "0")?.score;
            const s1 = set.scores.find((s) => s.team_id === "1")?.score;
            if (s0 != null && s1 != null) {
              setScores.push({ team0: s0, team1: s1 });
            }
          }
        }
      }

      // Track quality metrics
      if (allPlayerIds.length >= 2) totalWith2Plus++;
      if (hasResult) totalWithResults++;
      if (setScores.length > 0) totalWithScores++;

      // ── Accumulate per-player stats for ALL played matches ──
      for (const team of match.teams) {
        const teamIdx = team.team_id; // "0" or "1"
        const teamResult = teamIdx === "0" ? team0Result : team1Result;

        for (const p of team.players) {
          if (!p.user_id) continue;

          const existing = players.get(p.user_id);
          if (existing) {
            // Count ALL played matches (not just 2+ player ones)
            existing.matches_played++;
            existing.total_bookings++;
            if (!existing.clubs.includes(clubName))
              existing.clubs.push(clubName);
            if (match.start_date < existing.first_match)
              existing.first_match = match.start_date;
            if (match.start_date > existing.last_match)
              existing.last_match = match.start_date;

            if (teamResult === "WON") existing.wins++;
            if (teamResult === "LOST") existing.losses++;
            if (isCompetitive) existing.competitive_matches++;
            else existing.friendly_matches++;

            // Set/game stats
            for (const ss of setScores) {
              const myGames = teamIdx === "0" ? ss.team0 : ss.team1;
              const oppGames = teamIdx === "0" ? ss.team1 : ss.team0;
              existing.games_won += myGames;
              existing.games_lost += oppGames;
              if (myGames > oppGames) existing.sets_won++;
              else if (oppGames > myGames) existing.sets_lost++;
            }

            // Update best data
            if (
              p.level_value != null &&
              (existing.level_value == null ||
                p.level_value > existing.level_value)
            ) {
              existing.level_value = p.level_value;
              existing.level_confidence = p.level_confidence ?? null;
            }
            if (p.name && p.name.length > existing.name.length)
              existing.name = p.name;
            if (p.picture && !existing.picture) existing.picture = p.picture;
            if (p.gender && existing.gender === "UNKNOWN")
              existing.gender = p.gender;
            if (p.preferred_position && !existing.preferred_position)
              existing.preferred_position = p.preferred_position;
            if (p.is_premium) existing.is_premium = true;
          } else {
            const isWin = teamResult === "WON" ? 1 : 0;
            const isLoss = teamResult === "LOST" ? 1 : 0;

            let setsW = 0,
              setsL = 0,
              gamesW = 0,
              gamesL = 0;
            for (const ss of setScores) {
              const myGames = teamIdx === "0" ? ss.team0 : ss.team1;
              const oppGames = teamIdx === "0" ? ss.team1 : ss.team0;
              gamesW += myGames;
              gamesL += oppGames;
              if (myGames > oppGames) setsW++;
              else if (oppGames > myGames) setsL++;
            }

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
              matches_played: 1,
              total_bookings: 1,
              wins: isWin,
              losses: isLoss,
              win_rate: null,
              sets_won: setsW,
              sets_lost: setsL,
              games_won: gamesW,
              games_lost: gamesL,
              first_match: match.start_date,
              last_match: match.start_date,
              unique_teammates: 0,
              unique_opponents: 0,
              competitive_matches: isCompetitive ? 1 : 0,
              friendly_matches: isCompetitive ? 0 : 1,
            });
          }
        }
      }

      // ── Record team membership for edges ──
      const team0Ids = (match.teams[0]?.players ?? [])
        .filter((p) => p.user_id)
        .map((p) => p.user_id);
      const team1Ids = (match.teams[1]?.players ?? [])
        .filter((p) => p.user_id)
        .map((p) => p.user_id);

      if (team0Ids.length + team1Ids.length >= 2) {
        matchRecords.push({
          matchId: match.match_id,
          team0: team0Ids,
          team1: team1Ids,
          club: clubName,
          date: match.start_date,
          team0Result: team0Result,
          team1Result: team1Result,
        });
      }
    }
  }

  // Compute win rates
  for (const p of players.values()) {
    const totalWL = p.wins + p.losses;
    p.win_rate = totalWL > 0 ? p.wins / totalWL : null;
  }

  console.log(`\n=== DATA QUALITY REPORT ===\n`);
  console.log(`Total raw records:     ${totalRaw.toLocaleString()}`);
  console.log(`  PLAYED:              ${totalPlayed.toLocaleString()} (${(100 * totalPlayed / totalRaw).toFixed(1)}%)`);
  console.log(`  CANCELED:            ${totalCanceled.toLocaleString()} (${(100 * totalCanceled / totalRaw).toFixed(1)}%)`);
  console.log(`  PENDING/other:       ${totalPending.toLocaleString()} (${(100 * totalPending / totalRaw).toFixed(1)}%)`);
  console.log(`  PLAYED w/ 2+ players:${totalWith2Plus.toLocaleString()} (${(100 * totalWith2Plus / totalRaw).toFixed(1)}%)`);
  console.log(`  With W/L results:    ${totalWithResults.toLocaleString()} (${(100 * totalWithResults / totalPlayed).toFixed(1)}% of played)`);
  console.log(`  With set scores:     ${totalWithScores.toLocaleString()} (${(100 * totalWithScores / totalPlayed).toFixed(1)}% of played)`);
  console.log(`  Unique players:      ${players.size.toLocaleString()}`);

  // ── Build edges with teammate/opponent distinction ──
  console.log(`\n=== BUILDING EDGES ===\n`);

  const edgeMap = new Map<string, Edge>();
  // Track teammate vs opponent per player
  const teammateSet = new Map<string, Set<string>>();
  const opponentSet = new Map<string, Set<string>>();

  for (const rec of matchRecords) {
    // Teammates: players on the same team
    for (const teamIds of [rec.team0, rec.team1]) {
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          const [a, b] =
            teamIds[i] < teamIds[j]
              ? [teamIds[i], teamIds[j]]
              : [teamIds[j], teamIds[i]];
          const key = `${a}:${b}`;

          if (!teammateSet.has(a)) teammateSet.set(a, new Set());
          if (!teammateSet.has(b)) teammateSet.set(b, new Set());
          teammateSet.get(a)!.add(b);
          teammateSet.get(b)!.add(a);

          const existing = edgeMap.get(key);
          if (existing) {
            existing.weight++;
            if (!existing.clubs.includes(rec.club))
              existing.clubs.push(rec.club);
            if (rec.date > existing.last_played)
              existing.last_played = rec.date;
            if (existing.relationship === "opponent")
              existing.relationship = "mixed";
            else if (existing.relationship !== "mixed")
              existing.relationship = "teammate";
          } else {
            edgeMap.set(key, {
              source: a,
              target: b,
              weight: 1,
              clubs: [rec.club],
              last_played: rec.date,
              relationship: "teammate",
            });
          }
        }
      }
    }

    // Opponents: players on opposite teams
    for (const aId of rec.team0) {
      for (const bId of rec.team1) {
        const [a, b] = aId < bId ? [aId, bId] : [bId, aId];
        const key = `${a}:${b}`;

        if (!opponentSet.has(aId)) opponentSet.set(aId, new Set());
        if (!opponentSet.has(bId)) opponentSet.set(bId, new Set());
        opponentSet.get(aId)!.add(bId);
        opponentSet.get(bId)!.add(aId);

        const existing = edgeMap.get(key);
        if (existing) {
          existing.weight++;
          if (!existing.clubs.includes(rec.club))
            existing.clubs.push(rec.club);
          if (rec.date > existing.last_played)
            existing.last_played = rec.date;
          if (existing.relationship === "teammate")
            existing.relationship = "mixed";
          else if (existing.relationship !== "mixed")
            existing.relationship = "opponent";
        } else {
          edgeMap.set(key, {
            source: a,
            target: b,
            weight: 1,
            clubs: [rec.club],
            last_played: rec.date,
            relationship: "opponent",
          });
        }
      }
    }
  }

  // Update teammate/opponent counts on players
  for (const p of players.values()) {
    p.unique_teammates = teammateSet.get(p.user_id)?.size ?? 0;
    p.unique_opponents = opponentSet.get(p.user_id)?.size ?? 0;
  }

  const edges = Array.from(edgeMap.values());
  const tmEdges = edges.filter((e) => e.relationship === "teammate").length;
  const opEdges = edges.filter((e) => e.relationship === "opponent").length;
  const mxEdges = edges.filter((e) => e.relationship === "mixed").length;

  console.log(`Total edges:    ${edges.length.toLocaleString()}`);
  console.log(`  Teammate:     ${tmEdges.toLocaleString()}`);
  console.log(`  Opponent:     ${opEdges.toLocaleString()}`);
  console.log(`  Mixed:        ${mxEdges.toLocaleString()}`);

  // ── Write output ──
  console.log(`\n=== WRITING OUTPUT ===\n`);

  const playersArr = Array.from(players.values())
    .filter((p) => !isSystemAccount(p.name))
    .sort((a, b) => b.matches_played - a.matches_played);

  writeFileSync(
    join(OUT_DIR, "players.json"),
    JSON.stringify(playersArr, null, 2),
  );
  console.log(`players.json — ${playersArr.length.toLocaleString()} players`);

  writeFileSync(join(OUT_DIR, "edges.json"), JSON.stringify(edges, null, 2));
  console.log(`edges.json — ${edges.length.toLocaleString()} edges`);

  const withWL = playersArr.filter((p) => p.wins + p.losses > 0);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  const meta = {
    reprocessed_at: new Date().toISOString(),
    elapsed_seconds: parseFloat(elapsed),
    data_quality: {
      total_raw_records: totalRaw,
      played_matches: totalPlayed,
      canceled: totalCanceled,
      pending_other: totalPending,
      played_with_2_plus_players: totalWith2Plus,
      with_wl_results: totalWithResults,
      with_set_scores: totalWithScores,
    },
    unique_players: playersArr.length,
    unique_edges: edges.length,
    players_with_level: playersArr.filter((p) => p.level_value != null).length,
    players_with_wl: withWL.length,
    edge_types: { teammate: tmEdges, opponent: opEdges, mixed: mxEdges },
  };
  writeFileSync(
    join(OUT_DIR, "scrape_meta.json"),
    JSON.stringify(meta, null, 2),
  );
  console.log(`scrape_meta.json written`);

  console.log(`\n✓ Done in ${elapsed}s`);
  console.log(`  ${playersArr.length.toLocaleString()} real players`);
  console.log(`  ${withWL.length.toLocaleString()} have W/L records`);
  console.log(`  ${edges.length.toLocaleString()} connections`);
}

main();
