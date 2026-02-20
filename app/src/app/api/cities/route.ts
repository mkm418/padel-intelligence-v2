/**
 * GET /api/cities
 * Returns all enabled cities with optional stats from the database.
 */

import { NextResponse } from "next/server";
import { ENABLED_CITIES } from "@/lib/cities";
import { supabase } from "@/lib/supabase";

export const revalidate = 3600; // 1 hour cache

export async function GET() {
  // Try to enrich with live stats from the cities table
  const { data: dbCities } = await supabase
    .from("cities")
    .select("slug, player_count, match_count, club_count, last_synced_at")
    .eq("enabled", true);

  const statsMap = new Map(
    (dbCities ?? []).map((c: { slug: string; player_count: number; match_count: number; club_count: number; last_synced_at: string }) => [c.slug, c]),
  );

  const cities = ENABLED_CITIES.map((c) => {
    const stats = statsMap.get(c.slug);
    return {
      slug: c.slug,
      name: c.name,
      country: c.country,
      countryCode: c.countryCode,
      flag: c.flag,
      timezone: c.timezone,
      playerCount: stats?.player_count ?? 0,
      matchCount: stats?.match_count ?? 0,
      clubCount: stats?.club_count ?? 0,
      lastSyncedAt: stats?.last_synced_at ?? null,
    };
  });

  return NextResponse.json({ cities });
}
