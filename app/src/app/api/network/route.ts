/**
 * GET /api/network?minMatches=5&minWeight=2
 *
 * Serves filtered player network data from reprocessed JSON files.
 * Returns { nodes, links, meta, clubs, leaderboard }.
 */

import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync, statSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "../output/miami_network");

// In-memory cache with mtime tracking for auto-invalidation
let rawPlayers: PlayerRaw[] | null = null;
let rawEdges: EdgeRaw[] | null = null;
let adjacency: Map<string, PartnerEdge[]> | null = null;
let cachedMtime: number = 0;

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

interface PartnerEdge {
  partnerId: string;
  weight: number;
  clubs: string[];
  lastPlayed: string;
  relationship: string;
}

function loadData() {
  const pFile = join(DATA_DIR, "players.json");
  const eFile = join(DATA_DIR, "edges.json");
  if (!existsSync(pFile) || !existsSync(eFile)) return false;

  // Check if files changed (invalidate cache on file update)
  const mtime = statSync(pFile).mtimeMs;
  if (!rawPlayers || mtime > cachedMtime) {
    cachedMtime = mtime;
    rawPlayers = JSON.parse(readFileSync(pFile, "utf-8"));
    rawEdges = JSON.parse(readFileSync(eFile, "utf-8"));

    adjacency = new Map();
    for (const e of rawEdges!) {
      if (!adjacency.has(e.source)) adjacency.set(e.source, []);
      if (!adjacency.has(e.target)) adjacency.set(e.target, []);
      adjacency.get(e.source)!.push({
        partnerId: e.target,
        weight: e.weight,
        clubs: e.clubs,
        lastPlayed: e.last_played,
        relationship: e.relationship,
      });
      adjacency.get(e.target)!.push({
        partnerId: e.source,
        weight: e.weight,
        clubs: e.clubs,
        lastPlayed: e.last_played,
        relationship: e.relationship,
      });
    }
  }
  return true;
}

function isRealPlayer(name: string): boolean {
  return !(
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

export async function GET(req: NextRequest) {
  if (!loadData()) {
    return NextResponse.json(
      { error: "Network data not found. Run the scrape script first." },
      { status: 404 },
    );
  }

  const url = req.nextUrl;
  const minMatches = parseInt(url.searchParams.get("minMatches") ?? "5", 10);
  const minWeight = parseInt(url.searchParams.get("minWeight") ?? "2", 10);
  const club = url.searchParams.get("club") ?? "";
  const search = url.searchParams.get("search") ?? "";
  const minLevel = parseFloat(url.searchParams.get("minLevel") ?? "0");
  const maxLevel = parseFloat(url.searchParams.get("maxLevel") ?? "8");

  // Name lookup
  const nameMap = new Map<string, string>();
  for (const p of rawPlayers!) nameMap.set(p.user_id, p.name);

  // Set of real players for partner filter
  const realIds = new Set<string>();
  for (const p of rawPlayers!) {
    if (isRealPlayer(p.name)) realIds.add(p.user_id);
  }

  // Filter players
  let players = rawPlayers!.filter((p) => {
    if (p.matches_played < minMatches) return false;
    if (club && !p.clubs.includes(club)) return false;
    if (!isRealPlayer(p.name)) return false;
    // Level filter: if player has a level, it must be in range.
    // Players with no level pass if range starts at 0 (include unknowns).
    if (p.level_value != null) {
      if (p.level_value < minLevel || p.level_value > maxLevel) return false;
    } else if (minLevel > 0) {
      return false; // Exclude unknown levels when min is raised
    }
    return true;
  });

  if (search) {
    const lc = search.toLowerCase();
    players = players.filter((p) => p.name.toLowerCase().includes(lc));
  }

  const ids = new Set(players.map((p) => p.user_id));

  // Filter edges
  const edges = rawEdges!.filter(
    (e) =>
      e.weight >= minWeight &&
      ids.has(e.source) &&
      ids.has(e.target) &&
      (!club || e.clubs.includes(club)),
  );

  // Degree map
  const degreeMap = new Map<string, number>();
  for (const e of edges) {
    degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1);
    degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1);
  }

  // Top partners per player
  const topPartnersMap = new Map<
    string,
    { id: string; name: string; weight: number; relationship: string }[]
  >();
  for (const p of players) {
    const neighbors = adjacency!.get(p.user_id) ?? [];
    const sorted = [...neighbors]
      .filter((n) => realIds.has(n.partnerId))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8);
    topPartnersMap.set(
      p.user_id,
      sorted.map((n) => ({
        id: n.partnerId,
        name: nameMap.get(n.partnerId) ?? "Unknown",
        weight: n.weight,
        relationship: n.relationship,
      })),
    );
  }

  // Nodes
  const nodes = players.map((p) => ({
    id: p.user_id,
    name: p.name,
    level: p.level_value,
    levelConfidence: p.level_confidence,
    matchCount: p.matches_played,
    totalBookings: p.total_bookings,
    clubs: p.clubs,
    gender: p.gender,
    picture: p.picture,
    firstMatch: p.first_match,
    lastMatch: p.last_match,
    position: p.preferred_position,
    isPremium: p.is_premium,
    degree: degreeMap.get(p.user_id) ?? 0,
    topPartners: topPartnersMap.get(p.user_id) ?? [],
    // W/L
    wins: p.wins,
    losses: p.losses,
    winRate: p.win_rate,
    // Sets/games
    setsWon: p.sets_won,
    setsLost: p.sets_lost,
    gamesWon: p.games_won,
    gamesLost: p.games_lost,
    // Social
    uniqueTeammates: p.unique_teammates,
    uniqueOpponents: p.unique_opponents,
    // Match types
    competitiveMatches: p.competitive_matches,
    friendlyMatches: p.friendly_matches,
  }));

  const links = edges.map((e) => ({
    source: e.source,
    target: e.target,
    weight: e.weight,
    relationship: e.relationship,
  }));

  // ── Leaderboard ──
  const playersByMatches = [...nodes]
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 20);
  const playersByConnections = [...nodes]
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 20);

  // Best win rate (min 10 W/L matches)
  const playersByWinRate = [...nodes]
    .filter((p) => p.wins + p.losses >= 10)
    .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
    .slice(0, 20);

  // Top partner pairs
  const topPairs = [...edges]
    .filter(
      (e) => realIds.has(e.source) && realIds.has(e.target),
    )
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 20)
    .map((e) => ({
      source: { id: e.source, name: nameMap.get(e.source) ?? "?" },
      target: { id: e.target, name: nameMap.get(e.target) ?? "?" },
      weight: e.weight,
      relationship: e.relationship,
    }));

  // Club breakdown
  const clubCounts = new Map<string, number>();
  for (const p of players) {
    for (const c of p.clubs) {
      clubCounts.set(c, (clubCounts.get(c) ?? 0) + 1);
    }
  }
  const clubBreakdown = Array.from(clubCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Level distribution
  const levelBuckets: Record<string, number> = {};
  for (const p of players) {
    if (p.level_value == null) {
      levelBuckets["Unknown"] = (levelBuckets["Unknown"] ?? 0) + 1;
    } else {
      const bucket = `${Math.floor(p.level_value)}-${Math.floor(p.level_value) + 1}`;
      levelBuckets[bucket] = (levelBuckets[bucket] ?? 0) + 1;
    }
  }

  const allClubs = Array.from(
    new Set(rawPlayers!.flatMap((p) => p.clubs)),
  ).sort();

  return NextResponse.json({
    nodes,
    links,
    meta: {
      totalPlayers: rawPlayers!.length,
      totalEdges: rawEdges!.length,
      filteredPlayers: nodes.length,
      filteredEdges: links.length,
    },
    clubs: allClubs,
    leaderboard: {
      mostActive: playersByMatches.map((p) => ({
        id: p.id,
        name: p.name,
        value: p.matchCount,
        level: p.level,
      })),
      mostConnected: playersByConnections.map((p) => ({
        id: p.id,
        name: p.name,
        value: p.degree,
        level: p.level,
      })),
      bestWinRate: playersByWinRate.map((p) => ({
        id: p.id,
        name: p.name,
        value: Math.round((p.winRate ?? 0) * 100),
        level: p.level,
        extra: `${p.wins}W-${p.losses}L`,
      })),
      topPairs,
      clubBreakdown: clubBreakdown.slice(0, 25),
      levelDistribution: levelBuckets,
    },
  });
}
