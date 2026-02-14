/**
 * GET /api/tournaments
 *
 * Fetches all upcoming tournaments and classes from every Miami club.
 * Returns combined, sorted list with club metadata attached.
 */

import { NextResponse } from "next/server";
import {
  getMiamiClubs,
  getClubTournaments,
  getClubClasses,
  padelCourtCount,
  type Tenant,
  type Tournament,
  type PadelClass,
} from "@/lib/playtomic";

export const revalidate = 300; // cache 5 min

/* ── Types for the response ─────────────────────────────────── */

interface EventItem {
  id: string;
  type: "tournament" | "class";
  name: string;
  startDate: string;
  endDate?: string;
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  time: string; // "6:00 PM"
  club: {
    id: string;
    name: string;
    city: string;
    image?: string;
    courts: number;
    lat?: number;
    lon?: number;
  };
  gender?: string;
  level?: string;
  price?: number;
  currency?: string;
  spots?: number;
  status: string;
  classType?: string; // "PRIVATE" | "GROUP"
  coach?: string;
  enrolled?: number;
  playtomicUrl: string;
}

/* ── Helpers ─────────────────────────────────────────────────── */

function buildClubMeta(club: Tenant) {
  return {
    id: club.tenant_id,
    name: club.tenant_name,
    city: club.address?.city ?? "",
    image: club.images?.[0],
    courts: padelCourtCount(club),
    lat: club.address?.coordinate?.lat,
    lon: club.address?.coordinate?.lon,
  };
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });
}

function getDayOfWeek(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "America/New_York",
  });
}

function tournamentToEvent(t: Tournament, club: Tenant): EventItem {
  const price =
    t.registration_info?.price?.amount ?? (t.price ? parseFloat(t.price) : undefined);
  const currency = t.registration_info?.price?.currency ?? (t.price?.includes("USD") ? "USD" : undefined);

  return {
    id: t.tournament_id,
    type: "tournament",
    name: t.tournament_name,
    startDate: t.start_date,
    endDate: t.end_date,
    dayOfWeek: getDayOfWeek(t.start_date),
    time: formatTime(t.start_date),
    club: buildClubMeta(club),
    gender: t.gender,
    level: t.level_description,
    price,
    currency,
    spots: t.available_places ?? t.registration_info?.available_places,
    status: t.tournament_status,
    enrolled: t.registered_players?.length,
    playtomicUrl: `https://playtomic.io/tournament/${t.tournament_id}`,
  };
}

function classToEvent(c: PadelClass, club: Tenant): EventItem {
  const priceStr = c.registration_info?.price ?? c.registration_info?.base_price;
  const price = priceStr ? parseFloat(priceStr) : undefined;

  return {
    id: c.academy_class_id,
    type: "class",
    name: `${c.type === "PRIVATE" ? "Private" : "Group"} Class`,
    startDate: c.start_date,
    endDate: c.end_date,
    dayOfWeek: getDayOfWeek(c.start_date),
    time: formatTime(c.start_date),
    club: buildClubMeta(club),
    price,
    currency: "USD",
    classType: c.type,
    coach: c.coaches?.[0]?.name,
    enrolled: c.registration_info?.registrations?.length ?? 0,
    spots: c.registration_info?.number_of_players,
    status: c.is_canceled ? "CANCELED" : "OPEN",
    playtomicUrl: `https://playtomic.io/tenant/${club.tenant_id}`,
  };
}

/* ── Handler ─────────────────────────────────────────────────── */

export async function GET() {
  try {
    // Fetch all clubs
    const clubs = await getMiamiClubs().catch(() => [] as Tenant[]);
    if (clubs.length === 0) {
      return NextResponse.json({ events: [], clubs: [] });
    }

    // Fetch tournaments + classes from ALL clubs in parallel
    const [tournamentResults, classResults] = await Promise.all([
      Promise.all(
        clubs.map((c) =>
          getClubTournaments(c.tenant_id)
            .then((ts) => ts.map((t) => tournamentToEvent(t, c)))
            .catch(() => [] as EventItem[]),
        ),
      ),
      Promise.all(
        clubs.map((c) =>
          getClubClasses(c.tenant_id)
            .then((cs) => cs.map((cl) => classToEvent(cl, c)))
            .catch(() => [] as EventItem[]),
        ),
      ),
    ]);

    const now = new Date();
    const allEvents = [...tournamentResults.flat(), ...classResults.flat()]
      .filter((e) => new Date(e.startDate) > now && e.status !== "CANCELED")
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );

    // Unique clubs that have events
    const clubsWithEvents = Array.from(
      new Map(allEvents.map((e) => [e.club.id, e.club])).values(),
    ).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      events: allEvents,
      clubs: clubsWithEvents,
      meta: {
        totalClubs: clubs.length,
        totalEvents: allEvents.length,
        tournaments: allEvents.filter((e) => e.type === "tournament").length,
        classes: allEvents.filter((e) => e.type === "class").length,
      },
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("[Tournaments API]", error);
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 },
    );
  }
}
