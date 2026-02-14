/**
 * GET /api/rankings?club=&minLevel=0&maxLevel=8&period=all
 *
 * Power rankings computed from match data.
 * Factors: win rate (weighted by match volume), level, recent activity, opponent quality.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ── Power score formula ──────────────────────────────────────────────────

function computePowerScore(player: Record<string, unknown>): number {
  const matches = (player.matches_played as number) || 0;
  const winRate = (player.win_rate as number) ?? 0;
  const level = (player.level_value as number) ?? 2;
  const competitive = (player.competitive_matches as number) || 0;
  const uniqueOpp = (player.unique_opponents as number) || 0;
  const lastMatch = player.last_match as string | null;

  // Base: level contributes most (0-8 scale, normalized to 0-40)
  const levelScore = level * 5;

  // Win rate bonus (0-25 points, scaled by confidence from match volume)
  const confidence = Math.min(matches / 50, 1); // caps at 50 matches
  const winScore = winRate * 25 * confidence;

  // Volume bonus (0-15 points, log scale)
  const volumeScore = Math.min(Math.log2(matches + 1) * 2, 15);

  // Competitive bonus (0-10 points)
  const compScore = Math.min(competitive / 10, 10);

  // Opponent diversity bonus (0-5 points)
  const diversityScore = Math.min(uniqueOpp / 20, 5);

  // Recency bonus (0-5 points, decays over 90 days)
  let recencyScore = 0;
  if (lastMatch) {
    const daysAgo = (Date.now() - new Date(lastMatch).getTime()) / 86400000;
    recencyScore = Math.max(0, 5 * (1 - daysAgo / 90));
  }

  return Math.round(
    (levelScore + winScore + volumeScore + compScore + diversityScore + recencyScore) * 10,
  ) / 10;
}

// ── Streak detection ─────────────────────────────────────────────────────

function detectStreak(player: Record<string, unknown>): {
  type: "hot" | "cold" | "new" | "steady";
  label: string;
  color: string;
} {
  const matches = (player.matches_played as number) || 0;
  const winRate = (player.win_rate as number) ?? 0;
  const lastMatch = player.last_match as string | null;
  const firstMatch = player.first_match as string | null;

  if (!lastMatch) return { type: "cold", label: "Inactive", color: "#6b7280" };

  const daysAgo = (Date.now() - new Date(lastMatch).getTime()) / 86400000;

  // New player (first match within last 30 days)
  if (firstMatch) {
    const daysSinceFirst = (Date.now() - new Date(firstMatch).getTime()) / 86400000;
    if (daysSinceFirst <= 30 && matches <= 10) {
      return { type: "new", label: "Rising Star", color: "#a855f7" };
    }
  }

  // Hot streak: active recently + high win rate
  if (daysAgo <= 14 && winRate >= 0.6 && matches >= 10) {
    return { type: "hot", label: "On Fire", color: "#ef4444" };
  }

  // Active and steady
  if (daysAgo <= 30) {
    return { type: "steady", label: "Active", color: "#22c55e" };
  }

  // Inactive
  if (daysAgo > 60) {
    return { type: "cold", label: "Inactive", color: "#6b7280" };
  }

  return { type: "steady", label: "Steady", color: "#3b82f6" };
}

// ── Handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const club = url.searchParams.get("club") ?? "";
  const minLevel = parseFloat(url.searchParams.get("minLevel") ?? "0");
  const maxLevel = parseFloat(url.searchParams.get("maxLevel") ?? "8");
  const minMatches = parseInt(url.searchParams.get("minMatches") ?? "10", 10);

  // Paginate through all matching players
  const PAGE = 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPlayers: any[] = [];
  let from = 0;

  while (true) {
    let q = supabase
      .from("players")
      .select("*")
      .gte("matches_played", minMatches)
      .order("matches_played", { ascending: false })
      .range(from, from + PAGE - 1);

    if (minLevel > 0) q = q.gte("level_value", minLevel);
    if (maxLevel < 8) q = q.lte("level_value", maxLevel);
    if (club) q = q.contains("clubs", [club]);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    allPlayers.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // Compute power scores and streaks
  const ranked = allPlayers
    .filter((p) => !(
      p.name.includes("sin Playtomic") ||
      p.name.includes("Torneo ") ||
      p.name.startsWith("PBP ") ||
      p.name.startsWith("JUGADOR ") ||
      p.name.startsWith("guest ") ||
      p.name.startsWith("Guest ") ||
      p.name === "Unknown" ||
      /^Player \d+$/i.test(p.name)
    ))
    .map((p) => {
      const powerScore = computePowerScore(p);
      const streak = detectStreak(p);
      return {
        id: p.user_id,
        name: p.name,
        level: p.level_value,
        picture: p.picture,
        matches: p.matches_played,
        wins: p.wins,
        losses: p.losses,
        winRate: p.win_rate,
        clubs: p.clubs,
        lastMatch: p.last_match,
        firstMatch: p.first_match,
        uniqueOpponents: p.unique_opponents,
        competitiveMatches: p.competitive_matches,
        powerScore,
        streak,
      };
    })
    .sort((a, b) => b.powerScore - a.powerScore);

  // Add rank
  const withRank = ranked.map((p, i) => ({ ...p, rank: i + 1 }));

  // Category leaderboards
  const hotPlayers = withRank
    .filter((p) => p.streak.type === "hot")
    .slice(0, 20);

  const risingStars = withRank
    .filter((p) => p.streak.type === "new")
    .slice(0, 20);

  const mostImproved = withRank
    .filter((p) => p.matches >= 20 && p.winRate != null && p.winRate >= 0.55)
    .sort((a, b) => {
      // Newer players with high win rate = most improved
      const aRecency = a.firstMatch ? (Date.now() - new Date(a.firstMatch).getTime()) / 86400000 : 9999;
      const bRecency = b.firstMatch ? (Date.now() - new Date(b.firstMatch).getTime()) / 86400000 : 9999;
      return aRecency - bRecency;
    })
    .slice(0, 20);

  // Level bracket rankings
  const brackets: Record<string, typeof withRank> = {};
  for (const p of withRank) {
    if (p.level == null) continue;
    const bracket = `${Math.floor(p.level)}.0-${Math.floor(p.level)}.9`;
    if (!brackets[bracket]) brackets[bracket] = [];
    if (brackets[bracket].length < 10) {
      brackets[bracket].push(p);
    }
  }

  // All clubs for filter
  const clubSet = new Set<string>();
  for (const p of allPlayers) {
    for (const c of p.clubs ?? []) clubSet.add(c);
  }

  return NextResponse.json({
    rankings: withRank.slice(0, 100),
    totalRanked: withRank.length,
    categories: {
      hotPlayers,
      risingStars,
      mostImproved,
    },
    brackets,
    clubs: Array.from(clubSet).sort(),
  });
}
