/**
 * GET /api/coach/:id
 *
 * Returns coach profile data with normalized club names.
 */

import { NextRequest, NextResponse } from "next/server";
import { coaches } from "@/data/coaches";
import { normalizeClubName } from "@/lib/club-aliases";

export const revalidate = 3600;

interface ClubEntry {
  name: string;
  city: string;
}

interface CoachRaw {
  coach_id: string;
  name: string;
  picture: string | null;
  level: number | null;
  is_premium: boolean;
  language: string | null;
  clubs: ClubEntry[];
  stats: {
    totalClasses: number;
    privateClasses: number;
    groupClasses: number;
    firstClass: string | null;
    lastClass: string | null;
  };
  classClubs: string[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const coach = (coaches as unknown as CoachRaw[]).find((c) => c.coach_id === id);

  if (!coach) {
    return NextResponse.json({ error: "Coach not found" }, { status: 404 });
  }

  // Normalize club names and deduplicate
  const seenClubs = new Set<string>();
  const normalizedClubs: { name: string; city: string }[] = [];
  for (const club of coach.clubs) {
    const norm = normalizeClubName(club.name);
    if (!seenClubs.has(norm)) {
      seenClubs.add(norm);
      normalizedClubs.push({ name: norm, city: club.city });
    }
  }

  const normalizedClassClubs = [
    ...new Set(coach.classClubs.map((c) => normalizeClubName(c))),
  ].sort();

  return NextResponse.json(
    {
      coach_id: coach.coach_id,
      name: coach.name,
      picture: coach.picture,
      level: coach.level,
      is_premium: coach.is_premium,
      language: coach.language,
      clubs: normalizedClubs,
      stats: coach.stats,
      classClubs: normalizedClassClubs,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    },
  );
}
