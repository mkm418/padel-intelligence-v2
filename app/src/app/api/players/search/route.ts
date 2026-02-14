/**
 * GET /api/players/search?q=name
 *
 * Fast player name search for autocomplete in H2H and player card features.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 60; // Cache for 1 minute for search

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  }

  const { data, error } = await supabase
    .from("players")
    .select("user_id, name, level_value, picture, matches_played, wins, losses")
    .ilike("name", `%${q}%`)
    .order("matches_played", { ascending: false })
    .limit(15);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    results: (data ?? []).map((p) => ({
      id: p.user_id,
      name: p.name,
      level: p.level_value,
      picture: p.picture,
      matches: p.matches_played,
      winRate: p.wins + p.losses > 0
        ? Math.round((p.wins / (p.wins + p.losses)) * 100)
        : null,
    })),
  }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
