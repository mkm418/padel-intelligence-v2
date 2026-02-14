/**
 * GET /api/network?minMatches=5&minWeight=2&minLevel=0&maxLevel=8&club=&search=
 *
 * Serves filtered player network data from Supabase.
 * Returns { nodes, links, meta, clubs, leaderboard }.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export const revalidate = 300; // Cache for 5 minutes

// ── Helpers ──────────────────────────────────────────────────────────────

/** Paginate through all rows for a Supabase query (bypasses 1000 row limit) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll<T = any>(
  buildQuery: (
    sb: SupabaseClient,
    from: number,
    to: number,
  ) => ReturnType<ReturnType<SupabaseClient["from"]>["select"]>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await buildQuery(supabase, from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < pageSize) break; // last page
    from += pageSize;
  }
  return all;
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

// ── Main handler ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const club = url.searchParams.get("club") ?? "";
  const search = url.searchParams.get("search") ?? "";
  // When searching, include all players so anyone can find themselves
  const defaultMin = search ? 1 : 5;
  const minMatches = parseInt(url.searchParams.get("minMatches") ?? String(defaultMin), 10);
  const minWeight = parseInt(url.searchParams.get("minWeight") ?? "2", 10);
  const minLevel = parseFloat(url.searchParams.get("minLevel") ?? "0");
  const maxLevel = parseFloat(url.searchParams.get("maxLevel") ?? "8");

  // ── Fetch players from Supabase (paginated) ─────────────────────────

  let rawPlayers;
  try {
    rawPlayers = await fetchAll((sb, from, to) => {
      let q = sb
        .from("players")
        .select("*")
        .gte("matches_played", minMatches)
        .order("matches_played", { ascending: false })
        .range(from, to);

      if (minLevel > 0) q = q.gte("level_value", minLevel);
      if (maxLevel < 8) q = q.lte("level_value", maxLevel);
      if (club) q = q.contains("clubs", [club]);
      if (search) q = q.ilike("name", `%${search}%`);

      return q;
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }

  // Filter system accounts client-side (complex regex patterns)
  const players = (rawPlayers ?? []).filter((p) => isRealPlayer(p.name));
  const playerIds = new Set(players.map((p) => p.user_id));

  // Name map for edge lookups
  const nameMap = new Map<string, string>();
  for (const p of players) nameMap.set(p.user_id, p.name);

  // Real player IDs set (for partner filtering)
  const realIds = playerIds;

  // ── Fetch edges ────────────────────────────────────────────────────
  // For large player sets (>3000), query edges directly with weight filter
  // instead of sending a huge player_ids array that exceeds request limits.

  const playerIdArray = Array.from(playerIds);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function paginateRpc(name: string, params: Record<string, any>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const all: any[] = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase
        .rpc(name, params)
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < PAGE) break;
      from += PAGE;
    }
    return all;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let edgesArr: any[] = [];

  try {
    if (playerIdArray.length > 3000) {
      // Broad query: fetch edges by weight threshold directly, then filter
      const allEdges = await fetchAll((sb, from, to) =>
        sb
          .from("edges")
          .select("source, target, weight, relationship")
          .gte("weight", minWeight)
          .range(from, to),
      );
      // Only keep edges where both endpoints are in the player set
      edgesArr = allEdges.filter(
        (e) => playerIds.has(e.source) && playerIds.has(e.target),
      );
    } else {
      // Smaller player set: use the RPC for precise filtering
      const edgesFromRpc = await paginateRpc("get_network_edges", {
        player_ids: playerIdArray,
        min_weight: minWeight,
        filter_club: club || null,
      });
      edgesArr = edgesFromRpc ?? [];
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  // ── Build adjacency from network edges (for top partners) ────────────

  const adjacency = new Map<
    string,
    { partnerId: string; weight: number; relationship: string }[]
  >();

  for (const e of edgesArr) {
    if (!adjacency.has(e.source)) adjacency.set(e.source, []);
    if (!adjacency.has(e.target)) adjacency.set(e.target, []);
    adjacency.get(e.source)!.push({
      partnerId: e.target,
      weight: e.weight,
      relationship: e.relationship,
    });
    adjacency.get(e.target)!.push({
      partnerId: e.source,
      weight: e.weight,
      relationship: e.relationship,
    });
  }

  // ── Degree map ──────────────────────────────────────────────────────

  const degreeMap = new Map<string, number>();
  for (const e of edgesArr) {
    degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1);
    degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1);
  }

  // ── Top partners per player ─────────────────────────────────────────

  const topPartnersMap = new Map<
    string,
    { id: string; name: string; weight: number; relationship: string }[]
  >();

  for (const p of players) {
    const neighbors = adjacency.get(p.user_id) ?? [];
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

  // ── Build nodes ─────────────────────────────────────────────────────

  const nodes = players.map((p) => {
    const wins = (p.wins as number) || 0;
    const losses = (p.losses as number) || 0;
    const wlTotal = wins + losses;
    const matches = p.matches_played as number;
    // Win rate only meaningful if enough results tracked
    const wrMeaningful = wlTotal >= 5 && (matches === 0 || wlTotal / matches >= 0.1);

    return {
      id: p.user_id,
      name: p.name,
      level: p.level_value,
      matchCount: matches,
      clubs: p.clubs,
      picture: p.picture,
      firstMatch: p.first_match,
      lastMatch: p.last_match,
      position: p.preferred_position,
      degree: degreeMap.get(p.user_id) ?? 0,
      topPartners: topPartnersMap.get(p.user_id) ?? [],
      wins,
      losses,
      wlRecorded: wlTotal,
      winRate: wrMeaningful ? p.win_rate : null,
      winRateMeaningful: wrMeaningful,
    };
  });

  const links = edgesArr.map((e) => ({
    source: e.source,
    target: e.target,
    weight: e.weight,
    relationship: e.relationship,
  }));

  // ── Leaderboard ─────────────────────────────────────────────────────

  const playersByMatches = [...nodes]
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 20);

  const playersByConnections = [...nodes]
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 20);

  const playersByWinRate = [...nodes]
    .filter((p) => p.winRateMeaningful && p.winRate != null)
    .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
    .slice(0, 20);

  const topPairs = [...edgesArr]
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

  // All clubs (for filter dropdown) — extract from loaded players
  const allClubsSet = new Set<string>();
  for (const p of rawPlayers) {
    for (const c of p.clubs) allClubsSet.add(c);
  }
  const allClubs = Array.from(allClubsSet).sort();

  // ── Total counts ────────────────────────────────────────────────────

  const { count: totalPlayers } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true });

  const { count: totalEdges } = await supabase
    .from("edges")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({
    nodes,
    links,
    meta: {
      totalPlayers: totalPlayers ?? 0,
      totalEdges: totalEdges ?? 0,
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
  }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
