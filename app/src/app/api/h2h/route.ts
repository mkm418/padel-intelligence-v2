/**
 * GET /api/h2h?p1=userId1&p2=userId2
 *
 * Head-to-head comparison between two players.
 * Now includes real match history when they've faced each other.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

/** Check if win rate data is reliable enough to display */
function isWinRateMeaningful(wins: number, losses: number, matches: number): boolean {
  const wlTotal = wins + losses;
  return wlTotal >= 5 && (matches === 0 || wlTotal / matches >= 0.1);
}

export async function GET(req: NextRequest) {
  const p1Id = req.nextUrl.searchParams.get("p1");
  const p2Id = req.nextUrl.searchParams.get("p2");

  if (!p1Id || !p2Id) {
    return NextResponse.json({ error: "Both p1 and p2 required" }, { status: 400 });
  }

  // ── Fetch player data + edges + H2H matches in parallel ─────────────

  const [playersResult, directEdgeResult, p1EdgesResult, p2EdgesResult, h2hMatchesResult] =
    await Promise.all([
      // Both players
      supabase.from("players").select("*").in("user_id", [p1Id, p2Id]),

      // Direct edge between them
      supabase
        .from("edges")
        .select("*")
        .or(
          `and(source.eq.${p1Id},target.eq.${p2Id}),and(source.eq.${p2Id},target.eq.${p1Id})`,
        )
        .limit(1)
        .maybeSingle(),

      // P1's edges
      supabase
        .from("edges")
        .select("source, target, weight, relationship")
        .or(`source.eq.${p1Id},target.eq.${p1Id}`)
        .order("weight", { ascending: false })
        .limit(500),

      // P2's edges
      supabase
        .from("edges")
        .select("source, target, weight, relationship")
        .or(`source.eq.${p2Id},target.eq.${p2Id}`)
        .order("weight", { ascending: false })
        .limit(500),

      // All matches where these two players were on OPPOSITE teams
      // p1 on team1 & p2 on team2, OR p1 on team2 & p2 on team1
      supabase
        .from("matches")
        .select("match_id, played_at, club_name, team1_p1, team1_p2, team1_result, team2_p1, team2_p2, team2_result, set_scores")
        .or(
          [
            // p1 on team1, p2 on team2
            `and(team1_p1.eq.${p1Id},team2_p1.eq.${p2Id})`,
            `and(team1_p1.eq.${p1Id},team2_p2.eq.${p2Id})`,
            `and(team1_p2.eq.${p1Id},team2_p1.eq.${p2Id})`,
            `and(team1_p2.eq.${p1Id},team2_p2.eq.${p2Id})`,
            // p2 on team1, p1 on team2
            `and(team1_p1.eq.${p2Id},team2_p1.eq.${p1Id})`,
            `and(team1_p1.eq.${p2Id},team2_p2.eq.${p1Id})`,
            `and(team1_p2.eq.${p2Id},team2_p1.eq.${p1Id})`,
            `and(team1_p2.eq.${p2Id},team2_p2.eq.${p1Id})`,
          ].join(","),
        )
        .order("played_at", { ascending: false })
        .limit(50),
    ]);

  const { data: players, error } = playersResult;
  if (error || !players || players.length < 2) {
    return NextResponse.json({ error: "One or both players not found" }, { status: 404 });
  }

  const p1 = players.find((p) => p.user_id === p1Id)!;
  const p2 = players.find((p) => p.user_id === p2Id)!;

  const { data: directEdge } = directEdgeResult;
  const { data: p1Edges } = p1EdgesResult;
  const { data: p2Edges } = p2EdgesResult;
  const { data: h2hMatches } = h2hMatchesResult;

  // ── Also fetch matches where they were on the SAME team ─────────────

  const { data: partnerMatches } = await supabase
    .from("matches")
    .select("match_id, played_at, club_name, team1_p1, team1_p2, team1_result, team2_p1, team2_p2, team2_result, set_scores")
    .or(
      [
        // Both on team1
        `and(team1_p1.eq.${p1Id},team1_p2.eq.${p2Id})`,
        `and(team1_p1.eq.${p2Id},team1_p2.eq.${p1Id})`,
        // Both on team2
        `and(team2_p1.eq.${p1Id},team2_p2.eq.${p2Id})`,
        `and(team2_p1.eq.${p2Id},team2_p2.eq.${p1Id})`,
      ].join(","),
    )
    .order("played_at", { ascending: false })
    .limit(50);

  // ── Process H2H match records ───────────────────────────────────────

  let p1Wins = 0;
  let p2Wins = 0;
  const matchHistory: {
    matchId: string;
    date: string;
    club: string;
    winner: "p1" | "p2";
    // Set scores from p1's perspective
    sets: { p1: number | null; p2: number | null }[];
    // Partners in the match
    p1Partner: string | null;
    p2Partner: string | null;
  }[] = [];

  for (const m of h2hMatches ?? []) {
    // Figure out which team p1 is on
    const p1OnTeam1 =
      m.team1_p1 === p1Id || m.team1_p2 === p1Id;

    const p1TeamResult = p1OnTeam1 ? m.team1_result : m.team2_result;

    if (p1TeamResult === "WON") p1Wins++;
    else p2Wins++;

    // Get set scores from p1's perspective
    const rawSets = (m.set_scores ?? []) as { t1: number | null; t2: number | null }[];
    const sets = rawSets
      .filter((s) => s.t1 != null && s.t2 != null)
      .map((s) =>
        p1OnTeam1
          ? { p1: s.t1, p2: s.t2 }
          : { p1: s.t2, p2: s.t1 },
      );

    // Get partners
    const p1Partner = p1OnTeam1
      ? (m.team1_p1 === p1Id ? m.team1_p2 : m.team1_p1)
      : (m.team2_p1 === p1Id ? m.team2_p2 : m.team2_p1);
    const p2Partner = p1OnTeam1
      ? (m.team2_p1 === p2Id ? m.team2_p2 : m.team2_p1)
      : (m.team1_p1 === p2Id ? m.team1_p2 : m.team1_p1);

    matchHistory.push({
      matchId: m.match_id,
      date: m.played_at,
      club: m.club_name,
      winner: p1TeamResult === "WON" ? "p1" : "p2",
      sets,
      p1Partner,
      p2Partner,
    });
  }

  // ── Process partner match records ───────────────────────────────────

  let partnerWins = 0;
  let partnerLosses = 0;
  for (const m of partnerMatches ?? []) {
    const bothOnTeam1 =
      (m.team1_p1 === p1Id || m.team1_p2 === p1Id) &&
      (m.team1_p1 === p2Id || m.team1_p2 === p2Id);
    const teamResult = bothOnTeam1 ? m.team1_result : m.team2_result;
    if (teamResult === "WON") partnerWins++;
    else partnerLosses++;
  }

  // ── Resolve partner names from player IDs ──────────────────────────

  const partnerIds = new Set<string>();
  for (const mh of matchHistory) {
    if (mh.p1Partner) partnerIds.add(mh.p1Partner);
    if (mh.p2Partner) partnerIds.add(mh.p2Partner);
  }

  const partnerNameMap = new Map<string, string>();
  if (partnerIds.size > 0) {
    const { data: partnerPlayers } = await supabase
      .from("players")
      .select("user_id, name")
      .in("user_id", [...partnerIds]);
    for (const pp of partnerPlayers ?? []) {
      partnerNameMap.set(pp.user_id, pp.name);
    }
  }

  // Add names to match history
  const matchHistoryWithNames = matchHistory.map((mh) => ({
    ...mh,
    p1PartnerName: mh.p1Partner ? (partnerNameMap.get(mh.p1Partner) ?? null) : null,
    p2PartnerName: mh.p2Partner ? (partnerNameMap.get(mh.p2Partner) ?? null) : null,
  }));

  // ── Build connection sets ──────────────────────────────────────────

  const p1Connections = new Set<string>();
  for (const e of p1Edges ?? []) {
    p1Connections.add(e.source === p1Id ? e.target : e.source);
  }

  const p2Connections = new Set<string>();
  for (const e of p2Edges ?? []) {
    p2Connections.add(e.source === p2Id ? e.target : e.source);
  }

  // Mutual connections
  const mutualIds = [...p1Connections].filter((id) => p2Connections.has(id));

  let mutualPlayers: { id: string; name: string; level: number | null; picture: string | null }[] = [];
  if (mutualIds.length > 0) {
    const { data: mutuals } = await supabase
      .from("players")
      .select("user_id, name, level_value, picture")
      .in("user_id", mutualIds.slice(0, 20));

    mutualPlayers = (mutuals ?? []).map((m) => ({
      id: m.user_id,
      name: m.name,
      level: m.level_value,
      picture: m.picture,
    }));
  }

  // Overlapping clubs
  const p1Clubs = new Set((p1.clubs ?? []).map((c: string) => c.trim()));
  const p2Clubs = new Set((p2.clubs ?? []).map((c: string) => c.trim()));
  const sharedClubs = [...p1Clubs].filter((c) => p2Clubs.has(c));

  // ── W/L validation for overall stats ───────────────────────────────

  const p1OWins = (p1.wins as number) || 0;
  const p1OLosses = (p1.losses as number) || 0;
  const p2OWins = (p2.wins as number) || 0;
  const p2OLosses = (p2.losses as number) || 0;
  const p1WRMeaningful = isWinRateMeaningful(p1OWins, p1OLosses, p1.matches_played);
  const p2WRMeaningful = isWinRateMeaningful(p2OWins, p2OLosses, p2.matches_played);
  const bothHaveWR = p1WRMeaningful && p2WRMeaningful;

  // ── Stat comparisons ──────────────────────────────────────────────

  function compare(
    label: string,
    v1: number | null,
    v2: number | null,
    format?: string,
    higherIsBetter = true,
  ) {
    const valid = v1 != null && v2 != null;
    let winner: "p1" | "p2" | "tie" | null = null;
    if (valid) {
      if (higherIsBetter) {
        winner = v1! > v2! ? "p1" : v1! < v2! ? "p2" : "tie";
      } else {
        winner = v1! < v2! ? "p1" : v1! > v2! ? "p2" : "tie";
      }
    }
    return { label, p1: v1, p2: v2, winner, format: format ?? "number" };
  }

  const comparisons = [
    compare("Level", p1.level_value, p2.level_value),
    compare("Matches Played", p1.matches_played, p2.matches_played),
  ];

  if (bothHaveWR) {
    comparisons.push(compare("Win Rate", p1.win_rate, p2.win_rate, "percent"));
    comparisons.push(compare("Wins", p1OWins, p2OWins));
  }

  comparisons.push(
    compare("Clubs Played At", p1.clubs?.length ?? 0, p2.clubs?.length ?? 0),
    compare("Partners", p1Connections.size, p2Connections.size),
  );

  // Category score
  let p1Score = 0;
  let p2Score = 0;
  for (const c of comparisons) {
    if (c.winner === "p1") p1Score++;
    if (c.winner === "p2") p2Score++;
  }

  return NextResponse.json(
    {
      p1: {
        id: p1.user_id,
        name: p1.name,
        level: p1.level_value,
        picture: p1.picture,
        matches: p1.matches_played,
        winRate: p1WRMeaningful ? p1.win_rate : null,
        winRateMeaningful: p1WRMeaningful,
        wlRecorded: p1OWins + p1OLosses,
      },
      p2: {
        id: p2.user_id,
        name: p2.name,
        level: p2.level_value,
        picture: p2.picture,
        matches: p2.matches_played,
        winRate: p2WRMeaningful ? p2.win_rate : null,
        winRateMeaningful: p2WRMeaningful,
        wlRecorded: p2OWins + p2OLosses,
      },
      // Real H2H data from match records
      h2h: {
        totalMatches: (h2hMatches ?? []).length,
        p1Wins,
        p2Wins,
        matchHistory: matchHistoryWithNames,
      },
      // Partner data (times they played together)
      asPartners: {
        totalMatches: (partnerMatches ?? []).length,
        wins: partnerWins,
        losses: partnerLosses,
      },
      directConnection: directEdge
        ? {
            weight: directEdge.weight,
            relationship: directEdge.relationship,
            lastPlayed: directEdge.last_played,
          }
        : null,
      comparisons,
      score: { p1: p1Score, p2: p2Score },
      mutualConnections: mutualPlayers,
      mutualCount: mutualIds.length,
      sharedClubs,
      p1TotalConnections: p1Connections.size,
      p2TotalConnections: p2Connections.size,
    },
    {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    },
  );
}
