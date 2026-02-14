import { NextRequest, NextResponse } from "next/server";
import coachesRaw from "@/data/coaches.json";
import { normalizeClubName, normalizeClubs } from "@/lib/club-aliases";

export const revalidate = 3600;

interface RawCoach {
  coach_id: string;
  name: string;
  picture: string | null;
  level: number | null;
  is_premium: boolean;
  language: string | null;
  clubs: { name: string; city: string }[];
  stats: {
    totalClasses: number;
    privateClasses: number;
    groupClasses: number;
    firstClass: string | null;
    lastClass: string | null;
  };
  classClubs: string[];
}

/** Normalize coach data: deduplicate clubs, normalize names */
function normalizeCoach(raw: RawCoach) {
  const normalizedClubs = raw.clubs.map((c) => ({
    name: normalizeClubName(c.name),
    city: c.city,
  }));

  // Deduplicate clubs by name
  const seen = new Set<string>();
  const dedupedClubs = normalizedClubs.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  const normalizedClassClubs = normalizeClubs(raw.classClubs);

  return {
    ...raw,
    clubs: dedupedClubs,
    classClubs: normalizedClassClubs,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const clubFilter = searchParams.get("club") ?? "";
  const sort = searchParams.get("sort") ?? "classes";

  // Normalize all coaches
  const coaches = (coachesRaw as RawCoach[]).map(normalizeCoach);

  // Collect all unique club names for the filter dropdown
  const allClubNames = new Set<string>();
  for (const c of coaches) {
    for (const club of c.clubs) {
      allClubNames.add(club.name);
    }
    for (const cn of c.classClubs) {
      allClubNames.add(cn);
    }
  }
  const clubs = Array.from(allClubNames).sort();

  // Filter
  let filtered = coaches;

  if (search) {
    filtered = filtered.filter((c) => c.name.toLowerCase().includes(search));
  }

  if (clubFilter) {
    filtered = filtered.filter(
      (c) =>
        c.clubs.some((cl) => cl.name === clubFilter) ||
        c.classClubs.includes(clubFilter)
    );
  }

  // Sort
  switch (sort) {
    case "level":
      filtered.sort((a, b) => {
        if (a.level == null && b.level == null) return 0;
        if (a.level == null) return 1;
        if (b.level == null) return -1;
        return b.level - a.level;
      });
      break;
    case "name":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "classes":
    default:
      filtered.sort((a, b) => b.stats.totalClasses - a.stats.totalClasses);
      break;
  }

  return NextResponse.json({ coaches: filtered, clubs });
}
