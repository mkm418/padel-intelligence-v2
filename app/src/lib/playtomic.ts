/**
 * Playtomic public API client
 * Base: https://api.playtomic.io/v1
 * No auth required — plain GET with query params
 */

const API_BASE = "https://api.playtomic.io/v1";
const MIAMI_COORD = "25.7617,-80.1918";
const RADIUS = 100000; // 100km

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Tenant {
  tenant_id: string;
  tenant_name: string;
  tenant_uid: string;
  address: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    country_code?: string;
    coordinate?: { lat: number; lon: number };
    timezone?: string;
  };
  resources: Resource[];
  opening_hours?: Record<
    string,
    { opening_time: string; closing_time: string }
  >;
  images: string[];
  playtomic_status: string;
  is_playtomic_partner: boolean;
  sport_ids: string[];
  properties?: Record<string, unknown>;
}

export interface Resource {
  resource_id: string;
  name: string;
  resource_type?: string; // "indoor" | "outdoor"
  resource_size?: string; // "single" | "double"
  resource_feature?: string; // "panoramic" | "wall" | "crystal"
  sport_id: string;
}

export interface PlaytomicMatch {
  match_id: string;
  start_date: string;
  end_date: string;
  status: string;
  game_status: string;
  teams: { players: Player[] }[];
  tenant: { tenant_id: string; tenant_name: string };
  resource_name?: string;
  visibility: string;
  competition_mode?: string;
  match_type?: string;
  gender?: string;
  registration_info?: {
    available_places?: number;
    registered_players?: number;
    price?: { amount: number; currency: string };
  };
}

export interface Player {
  user_id: string;
  name: string;
  gender?: string;
  level_value?: number;
  level_confidence?: number;
  preferred_position?: string;
  is_premium?: boolean;
  picture?: string;
}

export interface Tournament {
  tournament_id: string;
  tournament_name: string;
  type?: string;
  start_date: string;
  end_date?: string;
  gender?: string;
  level_description?: string;
  tournament_status: string;
  available_places?: number;
  price?: string; // e.g. "54 USD"
  registered_players?: Player[];
  tenant?: { tenant_id: string; tenant_name: string };
  registration_info?: {
    price?: { amount: number; currency: string };
    available_places?: number;
  };
}

export interface PadelClass {
  academy_class_id: string;
  type: string; // "PRIVATE" | "GROUP"
  sport_id: string;
  start_date: string;
  end_date: string;
  is_canceled: boolean;
  tenant: {
    tenant_id: string;
    tenant_name: string;
    address?: Record<string, unknown>;
    images?: string[];
  };
  resource?: { id: string; name: string; properties?: Record<string, string> };
  coaches: {
    user_id: string;
    name: string;
    coach_id: string;
    communications_language?: string;
    is_premium?: boolean;
  }[];
  registration_info?: {
    payment_type?: string;
    number_of_players?: number;
    base_price?: string;
    price?: string;
    registrations?: {
      player: Player;
      price?: string;
    }[];
  };
}

// ---------------------------------------------------------------------------
// Fetch helper — 5-minute server cache via Next.js
// ---------------------------------------------------------------------------

async function fetchAPI<T>(
  path: string,
  params: Record<string, string | number>,
): Promise<T> {
  const url = new URL(`${API_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Playtomic ${path}: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Miami-scoped queries
// ---------------------------------------------------------------------------

/** Active padel clubs within 100 km of Miami */
export function getMiamiClubs() {
  return fetchAPI<Tenant[]>("tenants", {
    coordinate: MIAMI_COORD,
    radius: RADIUS,
    sport_id: "PADEL",
    playtomic_status: "ACTIVE",
    size: 50,
  });
}

/** Open/upcoming matches near Miami */
export function getMiamiMatches() {
  return fetchAPI<PlaytomicMatch[]>("matches", {
    coordinate: MIAMI_COORD,
    sport_id: "PADEL",
    radius: RADIUS,
    size: 50,
  });
}

/** Tournaments for a specific club */
export function getClubTournaments(tenantId: string) {
  return fetchAPI<Tournament[]>("tournaments", {
    tenant_id: tenantId,
    sport_id: "PADEL",
    size: 20,
  });
}

/** Classes/clinics for a specific club */
export function getClubClasses(tenantId: string) {
  return fetchAPI<PadelClass[]>("classes", {
    tenant_id: tenantId,
    sport_id: "PADEL",
    size: 20,
  });
}

/**
 * Fetch tournaments + classes for top N clubs, merged and sorted.
 * Fetches per-club for richer data (names include times, levels, etc.)
 */
export async function getMiamiEvents(clubs: Tenant[], topN = 10) {
  const topClubs = clubs.slice(0, topN);

  // Parallel fetch: tournaments + classes for each club
  const [tournamentResults, classResults] = await Promise.all([
    Promise.all(
      topClubs.map((c) =>
        getClubTournaments(c.tenant_id).catch(() => [] as Tournament[]),
      ),
    ),
    Promise.all(
      topClubs.map((c) =>
        getClubClasses(c.tenant_id).catch(() => [] as PadelClass[]),
      ),
    ),
  ]);

  // Flatten and filter tournaments — only upcoming + open registration
  const now = new Date();
  const tournaments = tournamentResults
    .flat()
    .filter(
      (t) =>
        t.tournament_status === "REGISTRATION_OPEN" &&
        new Date(t.start_date) > now,
    )
    .sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    );

  // Flatten and filter classes — only upcoming + not canceled
  const classes = classResults
    .flat()
    .filter((c) => !c.is_canceled && new Date(c.start_date) > now)
    .sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    );

  return { tournaments, classes };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Count padel courts for a tenant */
export function padelCourtCount(t: Tenant): number {
  return t.resources.filter((r) => r.sport_id === "PADEL").length;
}

/** Average player level in a match */
export function matchAvgLevel(m: PlaytomicMatch): number | null {
  const levels = m.teams
    .flatMap((t) => t.players)
    .map((p) => p.level_value)
    .filter((v): v is number => v != null && v > 0);
  if (levels.length === 0) return null;
  return Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10;
}
