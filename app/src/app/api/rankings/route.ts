/**
 * GET /api/rankings?club=&minLevel=0&maxLevel=8&minMatches=5
 *
 * Power rankings computed from match data.
 * Only shows meaningful stats. Win rate hidden when sample is too small.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { normalizeClubs } from "@/lib/club-aliases";

export const revalidate = 300; // Cache for 5 minutes

/* ── Power score formula ──────────────────────────────────────── */

function computePowerScore(player: Record<string, unknown>): number {
  const matches = (player.matches_played as number) || 0;
  const wins = (player.wins as number) || 0;
  const losses = (player.losses as number) || 0;
  const wlTotal = wins + losses;
  const level = (player.level_value as number) ?? 0;
  const lastMatch = player.last_match as string | null;

  // Level is the strongest signal (0-40 points)
  const levelScore = level * 5;

  // Match volume (0-20 points, log scale)
  const volumeScore = Math.min(Math.log2(matches + 1) * 2.5, 20);

  // Win rate bonus, only if enough W/L results (0-20 points)
  let winScore = 0;
  if (wlTotal >= 5) {
    const winRate = wins / wlTotal;
    const confidence = Math.min(wlTotal / 30, 1);
    winScore = winRate * 20 * confidence;
  }

  // Recency bonus (0-10 points, decays over 60 days)
  let recencyScore = 0;
  if (lastMatch) {
    const daysAgo = (Date.now() - new Date(lastMatch).getTime()) / 86400000;
    recencyScore = Math.max(0, 10 * (1 - daysAgo / 60));
  }

  return Math.round(
    (levelScore + volumeScore + winScore + recencyScore) * 10,
  ) / 10;
}

/* ── Streak detection ─────────────────────────────────────────── */

function detectStreak(player: Record<string, unknown>): {
  type: "hot" | "cold" | "new" | "steady";
  label: string;
} {
  const matches = (player.matches_played as number) || 0;
  const wins = (player.wins as number) || 0;
  const losses = (player.losses as number) || 0;
  const wlTotal = wins + losses;
  const lastMatch = player.last_match as string | null;
  const firstMatch = player.first_match as string | null;

  if (!lastMatch) return { type: "cold", label: "Inactive" };

  const daysAgo = (Date.now() - new Date(lastMatch).getTime()) / 86400000;

  // New player (first match within last 45 days, fewer than 15 matches)
  if (firstMatch) {
    const daysSinceFirst = (Date.now() - new Date(firstMatch).getTime()) / 86400000;
    if (daysSinceFirst <= 45 && matches <= 15) {
      return { type: "new", label: "New Player" };
    }
  }

  // Hot: active last 14 days + decent win record (if W/L data exists)
  if (daysAgo <= 14 && matches >= 10) {
    if (wlTotal >= 5 && wins / wlTotal >= 0.55) {
      return { type: "hot", label: "On Fire" };
    }
    // Active with high volume, even without W/L
    if (matches >= 30) {
      return { type: "hot", label: "On Fire" };
    }
  }

  // Active in last 30 days
  if (daysAgo <= 30) {
    return { type: "steady", label: "Active" };
  }

  // Inactive
  if (daysAgo > 60) {
    return { type: "cold", label: "Inactive" };
  }

  return { type: "steady", label: "Steady" };
}

/* ── Determine if win rate is trustworthy ─────────────────────── */

function isWinRateMeaningful(player: Record<string, unknown>): boolean {
  const wins = (player.wins as number) || 0;
  const losses = (player.losses as number) || 0;
  const matches = (player.matches_played as number) || 0;
  const wlTotal = wins + losses;
  // Need at least 5 recorded results AND results must be >= 10% of total matches
  return wlTotal >= 5 && (matches === 0 || wlTotal / matches >= 0.1);
}

/* ── Trim club name for display (keep raw value for filtering) ─ */

function trimClub(name: string): string {
  return name.trim();
}

/* ── Handler ──────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
  const url = req.nextUrl;
  const club = url.searchParams.get("club") ?? "";
  const search = url.searchParams.get("search") ?? "";
  const minLevel = parseFloat(url.searchParams.get("minLevel") ?? "0");
  const maxLevel = parseFloat(url.searchParams.get("maxLevel") ?? "8");
  // When searching, include ALL players (even 1 match) so anyone can find themselves.
  // Default leaderboard view still requires 5+ matches for a clean ranking.
  const defaultMin = search ? 1 : 5;
  const minMatches = parseInt(url.searchParams.get("minMatches") ?? String(defaultMin), 10);

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
    if (search) q = q.ilike("name", `%${search}%`);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    allPlayers.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // Filter junk accounts and compute rankings
  const ranked = allPlayers
    .filter((p) => !(
      !p.name ||
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
      const wins = p.wins || 0;
      const losses = p.losses || 0;
      const wlTotal = wins + losses;
      const meaningful = isWinRateMeaningful(p);

      return {
        id: p.user_id,
        name: p.name,
        level: p.level_value,
        picture: p.picture,
        matches: p.matches_played,
        wins,
        losses,
        wlRecorded: wlTotal,
        // Only show win rate if we have enough data
        winRate: meaningful ? p.win_rate : null,
        winRateMeaningful: meaningful,
        clubs: normalizeClubs(p.clubs ?? []),
        lastMatch: p.last_match,
        firstMatch: p.first_match,
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
    .slice(0, 25);

  const risingStars = withRank
    .filter((p) => p.streak.type === "new")
    .slice(0, 25);

  // Level bracket rankings
  const brackets: Record<string, typeof withRank> = {};
  for (const p of withRank) {
    if (p.level == null) continue;
    const bracket = `${Math.floor(p.level)}.0-${Math.floor(p.level)}.9`;
    if (!brackets[bracket]) brackets[bracket] = [];
    if (brackets[bracket].length < 15) {
      brackets[bracket].push(p);
    }
  }

  // Always fetch full club list from DB (independent of current filters)
  // so the dropdown never collapses
  const { data: clubRows } = await supabase.rpc("get_distinct_clubs");
  let allClubNames: string[] = [];
  if (clubRows && Array.isArray(clubRows)) {
    allClubNames = normalizeClubs(clubRows.map((r: { club_name: string }) => r.club_name));
  } else {
    // Fallback: extract from current result set
    const rawClubs: string[] = [];
    for (const p of allPlayers) {
      for (const c of p.clubs ?? []) rawClubs.push(c);
    }
    allClubNames = normalizeClubs(rawClubs);
  }

  // When searching, return all matches (up to 200). Default: top 100.
  const resultLimit = search ? 200 : 100;

  return NextResponse.json({
    rankings: withRank.slice(0, resultLimit),
    totalRanked: withRank.length,
    categories: {
      hotPlayers,
      risingStars,
    },
    brackets,
    clubs: allClubNames,
  }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
  } catch (err) {
    console.error("[rankings] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 },
    );
  }
}
