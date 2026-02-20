/**
 * GET /api/player/:id/matches
 *
 * Returns match history for a player with resolved partner/opponent names,
 * plus computed analytics: form streak, partner win rates, club breakdown,
 * and advanced set/game stats.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const city = req.nextUrl.searchParams.get("city") || "";

  // Fetch all matches involving this player, optionally filtered by city
  let q = supabase
    .from("matches")
    .select("*")
    .or(
      `team1_p1.eq.${id},team1_p2.eq.${id},team2_p1.eq.${id},team2_p2.eq.${id}`,
    )
    .order("played_at", { ascending: false });

  if (city) q = q.eq("city", city);

  const { data: rawMatches, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const matches = rawMatches ?? [];

  // Collect all related player IDs to resolve names
  const relatedIds = new Set<string>();
  for (const m of matches) {
    if (m.team1_p1) relatedIds.add(m.team1_p1);
    if (m.team1_p2) relatedIds.add(m.team1_p2);
    if (m.team2_p1) relatedIds.add(m.team2_p1);
    if (m.team2_p2) relatedIds.add(m.team2_p2);
  }
  relatedIds.delete(id);

  // Fetch names for all related players
  const { data: relatedPlayers } = await supabase
    .from("players")
    .select("user_id, name, level_value")
    .in("user_id", Array.from(relatedIds));

  const nameMap = new Map<string, { name: string; level: number | null }>();
  for (const p of relatedPlayers ?? []) {
    nameMap.set(p.user_id, { name: p.name, level: p.level_value });
  }
  const getName = (uid: string | null) =>
    uid ? nameMap.get(uid)?.name ?? "Unknown" : null;

  // ── Build match history with resolved names ───────────────────────────

  interface MatchEntry {
    matchId: string;
    date: string;
    club: string;
    result: "WON" | "LOST";
    mode: string | null;
    partner: { id: string | null; name: string | null };
    opponents: { id: string; name: string }[];
    setScores: { my: number | null; opp: number | null }[];
  }

  const history: MatchEntry[] = [];
  // Track per-partner stats
  const partnerStats = new Map<
    string,
    { name: string; wins: number; losses: number; matches: number }
  >();
  // Track per-opponent stats
  const opponentStats = new Map<
    string,
    { name: string; wins: number; losses: number; matches: number }
  >();
  // Track per-club stats
  const clubStats = new Map<
    string,
    { wins: number; losses: number; matches: number }
  >();
  // Advanced game stats
  let totalSetsWon = 0,
    totalSetsLost = 0,
    totalGamesWon = 0,
    totalGamesLost = 0;
  let threeSetMatches = 0,
    threeSetWins = 0;
  let bagels = 0, // 6-0 sets won
    breadsticks = 0; // 6-1 sets won

  for (const m of matches) {
    const onTeam1 = m.team1_p1 === id || m.team1_p2 === id;
    const result = onTeam1 ? m.team1_result : m.team2_result;
    if (!result || !["WON", "LOST"].includes(result)) continue;

    // Partner
    const partnerId = onTeam1
      ? m.team1_p1 === id
        ? m.team1_p2
        : m.team1_p1
      : m.team2_p1 === id
        ? m.team2_p2
        : m.team2_p1;

    // Opponents
    const oppIds = onTeam1
      ? [m.team2_p1, m.team2_p2].filter(Boolean)
      : [m.team1_p1, m.team1_p2].filter(Boolean);

    // Set scores from player's perspective
    const setScores: { my: number | null; opp: number | null }[] = [];
    const rawScores = (m.set_scores ?? []) as {
      t1: number | null;
      t2: number | null;
    }[];

    let matchSetsWon = 0,
      matchSetsLost = 0;
    for (const s of rawScores) {
      if (s.t1 == null && s.t2 == null) continue;
      const my = onTeam1 ? s.t1 : s.t2;
      const opp = onTeam1 ? s.t2 : s.t1;
      setScores.push({ my, opp });

      if (my != null && opp != null) {
        totalGamesWon += my;
        totalGamesLost += opp;
        if (my > opp) {
          totalSetsWon++;
          matchSetsWon++;
          if (opp === 0) bagels++;
          if (opp === 1) breadsticks++;
        } else if (opp > my) {
          totalSetsLost++;
          matchSetsLost++;
        }
      }
    }

    // 3-set tracking
    if (matchSetsWon + matchSetsLost >= 3) {
      threeSetMatches++;
      if (result === "WON") threeSetWins++;
    }

    history.push({
      matchId: m.match_id,
      date: m.played_at,
      club: m.club_name,
      result: result as "WON" | "LOST",
      mode: m.competition_mode,
      partner: { id: partnerId, name: getName(partnerId) },
      opponents: oppIds.map((oid: string) => ({
        id: oid,
        name: getName(oid) ?? "Unknown",
      })),
      setScores,
    });

    // Partner stats
    if (partnerId) {
      const ps = partnerStats.get(partnerId) ?? {
        name: getName(partnerId) ?? "Unknown",
        wins: 0,
        losses: 0,
        matches: 0,
      };
      ps.matches++;
      if (result === "WON") ps.wins++;
      else ps.losses++;
      partnerStats.set(partnerId, ps);
    }

    // Opponent stats
    for (const oid of oppIds) {
      const os = opponentStats.get(oid) ?? {
        name: getName(oid) ?? "Unknown",
        wins: 0,
        losses: 0,
        matches: 0,
      };
      os.matches++;
      if (result === "WON") os.wins++;
      else os.losses++;
      opponentStats.set(oid, os);
    }

    // Club stats
    const cs = clubStats.get(m.club_name) ?? {
      wins: 0,
      losses: 0,
      matches: 0,
    };
    cs.matches++;
    if (result === "WON") cs.wins++;
    else cs.losses++;
    clubStats.set(m.club_name, cs);
  }

  // ── Compute form (last 10 results) ────────────────────────────────────

  const last10 = history.slice(0, 10).map((m) => m.result);
  let currentStreak = 0;
  let streakType: "W" | "L" | null = null;
  if (history.length > 0) {
    streakType = history[0].result === "WON" ? "W" : "L";
    for (const m of history) {
      if (
        (streakType === "W" && m.result === "WON") ||
        (streakType === "L" && m.result === "LOST")
      ) {
        currentStreak++;
      } else break;
    }
  }

  // Rolling win rate (10-match windows) for sparkline
  const rollingWR: number[] = [];
  for (let i = 0; i <= history.length - 10; i++) {
    const window = history.slice(i, i + 10);
    const wins = window.filter((m) => m.result === "WON").length;
    rollingWR.push(wins / 10);
  }

  // ── Partner rankings ──────────────────────────────────────────────────

  const partnerArr = Array.from(partnerStats.entries())
    .map(([pid, s]) => ({
      id: pid,
      name: s.name,
      matches: s.matches,
      wins: s.wins,
      losses: s.losses,
      winRate: s.matches > 0 ? s.wins / s.matches : 0,
    }))
    .filter((p) => p.matches >= 2);

  const bestPartner = [...partnerArr]
    .filter((p) => p.matches >= 3)
    .sort((a, b) => b.winRate - a.winRate || b.matches - a.matches)[0] ?? null;
  const worstPartner = [...partnerArr]
    .filter((p) => p.matches >= 3)
    .sort((a, b) => a.winRate - b.winRate || b.matches - a.matches)[0] ?? null;

  // ── Opponent rankings (nemesis + easiest) ─────────────────────────────

  const opponentArr = Array.from(opponentStats.entries())
    .map(([oid, s]) => ({
      id: oid,
      name: s.name,
      matches: s.matches,
      wins: s.wins,
      losses: s.losses,
      winRate: s.matches > 0 ? s.wins / s.matches : 0,
    }))
    .filter((o) => o.matches >= 3);

  // Nemesis: opponent they lose to most
  const nemesis = [...opponentArr]
    .sort(
      (a, b) =>
        a.winRate - b.winRate ||
        b.losses - a.losses ||
        b.matches - a.matches,
    )[0] ?? null;
  // Favorite: opponent they beat most
  const favorite = [...opponentArr]
    .sort(
      (a, b) =>
        b.winRate - a.winRate ||
        b.wins - a.wins ||
        b.matches - a.matches,
    )[0] ?? null;

  // ── Club breakdown ────────────────────────────────────────────────────

  const clubs = Array.from(clubStats.entries())
    .map(([name, s]) => ({
      name,
      matches: s.matches,
      wins: s.wins,
      losses: s.losses,
      winRate: s.matches > 0 ? s.wins / s.matches : 0,
    }))
    .sort((a, b) => b.matches - a.matches);

  // ── Advanced stats ────────────────────────────────────────────────────

  const totalMatches = history.length;
  const gamesRatio =
    totalGamesLost > 0 ? totalGamesWon / totalGamesLost : totalGamesWon;
  const avgGamesPerSet =
    totalSetsWon + totalSetsLost > 0
      ? (totalGamesWon + totalGamesLost) / (totalSetsWon + totalSetsLost)
      : 0;

  return NextResponse.json(
    {
      history: history.slice(0, 20), // Last 20 matches
      totalMatches,
      form: {
        last10,
        streak: currentStreak,
        streakType,
        rollingWR: rollingWR.slice(0, 20).reverse(), // oldest→newest for chart
      },
      partners: {
        best: bestPartner,
        worst: worstPartner,
        all: partnerArr
          .sort((a, b) => b.matches - a.matches)
          .slice(0, 10),
      },
      opponents: {
        nemesis,
        favorite,
      },
      clubs,
      advanced: {
        setsWon: totalSetsWon,
        setsLost: totalSetsLost,
        gamesWon: totalGamesWon,
        gamesLost: totalGamesLost,
        gamesRatio: Math.round(gamesRatio * 100) / 100,
        avgGamesPerSet: Math.round(avgGamesPerSet * 10) / 10,
        threeSetMatches,
        threeSetWins,
        threeSetWinRate:
          threeSetMatches > 0
            ? Math.round((threeSetWins / threeSetMatches) * 100)
            : null,
        bagels,
        breadsticks,
      },
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    },
  );
}
