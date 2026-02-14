/**
 * GET /api/player/:id
 *
 * Returns detailed player data + top partners + badges for the player card.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ── Badge computation ────────────────────────────────────────────────────

interface Badge {
  icon: string;
  label: string;
  color: string;
}

function computeBadges(player: Record<string, unknown>, partnerCount: number): Badge[] {
  const badges: Badge[] = [];
  const matches = player.matches_played as number;
  const winRate = player.win_rate as number | null;
  const clubs = (player.clubs as string[]) || [];
  const level = player.level_value as number | null;
  const competitive = player.competitive_matches as number;

  // Volume badges
  if (matches >= 200) badges.push({ icon: "🔥", label: "200 Club", color: "#ef4444" });
  else if (matches >= 100) badges.push({ icon: "⭐", label: "Centurion", color: "#f59e0b" });
  else if (matches >= 50) badges.push({ icon: "🎯", label: "Dedicated", color: "#3b82f6" });

  // Win rate badges (min 20 matches)
  if (matches >= 20 && winRate != null) {
    if (winRate >= 0.75) badges.push({ icon: "👑", label: "Dominant", color: "#eab308" });
    else if (winRate >= 0.6) badges.push({ icon: "💪", label: "Winner", color: "#22c55e" });
  }

  // Explorer badge
  if (clubs.length >= 10) badges.push({ icon: "🗺️", label: "Explorer", color: "#8b5cf6" });
  else if (clubs.length >= 5) badges.push({ icon: "🏟️", label: "Traveler", color: "#6366f1" });

  // Level badges
  if (level != null) {
    if (level >= 6) badges.push({ icon: "💎", label: "Elite", color: "#06b6d4" });
    else if (level >= 4) badges.push({ icon: "🏆", label: "Advanced", color: "#14b8a6" });
  }

  // Social badge
  if (partnerCount >= 50) badges.push({ icon: "🌐", label: "Networker", color: "#ec4899" });
  else if (partnerCount >= 20) badges.push({ icon: "🤝", label: "Social", color: "#f472b6" });

  // Competitive badge
  if (competitive >= 30) badges.push({ icon: "⚔️", label: "Competitor", color: "#dc2626" });

  return badges;
}

// ── Tier computation ─────────────────────────────────────────────────────

function computeTier(level: number | null): { tier: string; color: string; gradient: string } {
  if (level == null) return { tier: "Unranked", color: "#6b7280", gradient: "from-zinc-700 to-zinc-800" };
  if (level >= 6) return { tier: "Diamond", color: "#67e8f9", gradient: "from-cyan-400 to-blue-600" };
  if (level >= 5) return { tier: "Platinum", color: "#e2e8f0", gradient: "from-slate-300 to-slate-500" };
  if (level >= 4) return { tier: "Gold", color: "#fbbf24", gradient: "from-yellow-400 to-amber-600" };
  if (level >= 3) return { tier: "Silver", color: "#94a3b8", gradient: "from-slate-400 to-slate-600" };
  if (level >= 2) return { tier: "Bronze", color: "#d97706", gradient: "from-amber-500 to-orange-700" };
  return { tier: "Iron", color: "#78716c", gradient: "from-stone-500 to-stone-700" };
}

// ── Handler ──────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Fetch player
  const { data: player, error } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", id)
    .single();

  if (error || !player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Fetch top partners (teammates + opponents)
  const { data: partnerEdges } = await supabase
    .from("edges")
    .select("source, target, weight, relationship")
    .or(`source.eq.${id},target.eq.${id}`)
    .order("weight", { ascending: false })
    .limit(50);

  // Resolve partner names
  const partnerIds = new Set<string>();
  for (const e of partnerEdges ?? []) {
    partnerIds.add(e.source === id ? e.target : e.source);
  }

  const { data: partnerPlayers } = await supabase
    .from("players")
    .select("user_id, name, level_value, picture")
    .in("user_id", Array.from(partnerIds));

  const partnerMap = new Map<string, { name: string; level: number | null; picture: string | null }>();
  for (const p of partnerPlayers ?? []) {
    partnerMap.set(p.user_id, { name: p.name, level: p.level_value, picture: p.picture });
  }

  const topPartners = (partnerEdges ?? []).slice(0, 10).map((e) => {
    const partnerId = e.source === id ? e.target : e.source;
    const info = partnerMap.get(partnerId);
    return {
      id: partnerId,
      name: info?.name ?? "Unknown",
      level: info?.level,
      picture: info?.picture,
      weight: e.weight,
      relationship: e.relationship,
    };
  });

  // Compute badges and tier
  const badges = computeBadges(player, partnerIds.size);
  const tier = computeTier(player.level_value);

  // Percentile ranks (how this player compares)
  const { count: totalPlayers } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true });

  const { count: belowMatches } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .lt("matches_played", player.matches_played);

  const { count: belowWinRate } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .lt("win_rate", player.win_rate ?? 0)
    .not("win_rate", "is", null);

  const total = totalPlayers ?? 1;
  const matchPercentile = Math.round(((belowMatches ?? 0) / total) * 100);
  const winRatePercentile = player.win_rate != null
    ? Math.round(((belowWinRate ?? 0) / total) * 100)
    : null;

  return NextResponse.json({
    player: {
      id: player.user_id,
      name: player.name,
      level: player.level_value,
      levelConfidence: player.level_confidence,
      picture: player.picture,
      gender: player.gender,
      position: player.preferred_position,
      isPremium: player.is_premium,
      clubs: player.clubs,
      matches: player.matches_played,
      wins: player.wins,
      losses: player.losses,
      winRate: player.win_rate,
      setsWon: player.sets_won,
      setsLost: player.sets_lost,
      gamesWon: player.games_won,
      gamesLost: player.games_lost,
      firstMatch: player.first_match,
      lastMatch: player.last_match,
      uniqueTeammates: player.unique_teammates,
      uniqueOpponents: player.unique_opponents,
      competitiveMatches: player.competitive_matches,
      friendlyMatches: player.friendly_matches,
    },
    tier,
    badges,
    topPartners,
    percentiles: {
      matches: matchPercentile,
      winRate: winRatePercentile,
    },
    totalPlayers: total,
  });
}
