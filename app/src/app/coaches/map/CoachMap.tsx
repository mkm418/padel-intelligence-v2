"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { CLUB_LOCATIONS, type ClubLocation } from "@/data/club-locations";
import { normalizeClubName } from "@/lib/club-aliases";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Coach {
  coach_id: string;
  name: string;
  picture: string | null;
  level: number | null;
  clubs: { name: string; city: string }[];
  stats: { totalClasses: number };
}

interface ClubWithCoaches {
  name: string;
  city: string;
  lat: number;
  lng: number;
  coaches: Coach[];
}

/* ------------------------------------------------------------------ */
/* South Florida bounding box                                          */
/* ------------------------------------------------------------------ */

const BOUNDS = {
  north: 26.78,
  south: 25.70,
  east: -80.03,
  west: -80.42,
};

function toPosition(lat: number, lng: number) {
  const top =
    ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * 100;
  const left =
    ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 100;
  return { top, left };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function buildClubMap(coaches: Coach[]): ClubWithCoaches[] {
  // Build a lookup from normalized club name to location
  const locationMap = new Map<string, ClubLocation>();
  for (const loc of CLUB_LOCATIONS) {
    locationMap.set(loc.name.toLowerCase(), loc);
  }

  // Group coaches by normalized club name
  const clubCoachMap = new Map<
    string,
    { location: ClubLocation; coaches: Set<string>; coachList: Coach[] }
  >();

  for (const coach of coaches) {
    for (const club of coach.clubs) {
      const normalized = normalizeClubName(club.name);
      const key = normalized.toLowerCase();
      const loc = locationMap.get(key);
      if (!loc) continue;

      if (!clubCoachMap.has(key)) {
        clubCoachMap.set(key, {
          location: loc,
          coaches: new Set(),
          coachList: [],
        });
      }

      const entry = clubCoachMap.get(key)!;
      if (!entry.coaches.has(coach.coach_id)) {
        entry.coaches.add(coach.coach_id);
        entry.coachList.push(coach);
      }
    }
  }

  return Array.from(clubCoachMap.values())
    .map((entry) => ({
      name: entry.location.name,
      city: entry.location.city,
      lat: entry.location.lat,
      lng: entry.location.lng,
      coaches: entry.coachList.sort(
        (a, b) => b.stats.totalClasses - a.stats.totalClasses
      ),
    }))
    .sort((a, b) => b.coaches.length - a.coaches.length);
}

/* ------------------------------------------------------------------ */
/* Coastline SVG path (simplified Florida SE coast)                    */
/* ------------------------------------------------------------------ */

const COASTLINE_PATH = `
  M 92,2 
  C 94,8 95,15 94,22
  C 93,30 92,38 90,45
  C 88,52 86,58 84,65
  C 82,72 80,78 78,84
  C 76,88 74,92 72,96
  L 68,100
`;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function CoachMap() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [expandedClub, setExpandedClub] = useState<string | null>(null);
  const [hoveredClub, setHoveredClub] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    fetch("/api/coaches")
      .then((r) => r.json())
      .then((data) => {
        setCoaches(data.coaches ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const clubs = useMemo(() => buildClubMap(coaches), [coaches]);

  const maxCoaches = useMemo(
    () => Math.max(...clubs.map((c) => c.coaches.length), 1),
    [clubs]
  );

  const totalCoachCount = useMemo(() => {
    const ids = new Set<string>();
    for (const club of clubs) {
      for (const c of club.coaches) ids.add(c.coach_id);
    }
    return ids.size;
  }, [clubs]);

  const scrollToClub = useCallback((name: string) => {
    const card = cardRefs.current.get(name);
    if (card && listRef.current) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const handleMarkerClick = useCallback(
    (name: string) => {
      setSelectedClub(name);
      setExpandedClub(name);
      scrollToClub(name);
    },
    [scrollToClub]
  );

  const handleCardClick = useCallback(
    (name: string) => {
      setSelectedClub(name);
      setExpandedClub((prev) => (prev === name ? null : name));
    },
    []
  );

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <>
      <main className="min-h-screen bg-background pt-20 pb-16">
        <div className="page-container">
          {/* Header */}
          <div className="mb-8">
            <p className="section-label mb-2">COACHES</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Coach Finder
            </h1>
            <p className="mt-2 text-muted text-base max-w-xl">
              Find coaches near you across South Florida
            </p>
            {!loading && (
              <div className="mt-4 flex gap-4 text-sm">
                <span className="text-muted">
                  <span className="font-display font-bold text-foreground">
                    {clubs.length}
                  </span>{" "}
                  clubs
                </span>
                <span className="text-dim">|</span>
                <span className="text-muted">
                  <span className="font-display font-bold text-foreground">
                    {totalCoachCount}
                  </span>{" "}
                  coaches
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
              {/* Map Panel (on top on mobile, right on desktop) */}
              <div className="order-1 lg:order-2">
                <div className="sticky top-20">
                  <MapPanel
                    clubs={clubs}
                    maxCoaches={maxCoaches}
                    selectedClub={selectedClub}
                    hoveredClub={hoveredClub}
                    onMarkerClick={handleMarkerClick}
                    onMarkerHover={setHoveredClub}
                  />
                </div>
              </div>

              {/* Club List Panel */}
              <div className="order-2 lg:order-1" ref={listRef}>
                <div className="space-y-3">
                  {clubs.map((club) => (
                    <ClubCard
                      key={club.name}
                      club={club}
                      isSelected={selectedClub === club.name}
                      isExpanded={expandedClub === club.name}
                      onClick={() => handleCardClick(club.name)}
                      onMouseEnter={() => setHoveredClub(club.name)}
                      onMouseLeave={() => setHoveredClub(null)}
                      ref={(el) => {
                        if (el) cardRefs.current.set(club.name, el);
                        else cardRefs.current.delete(club.name);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Map Panel                                                           */
/* ------------------------------------------------------------------ */

function MapPanel({
  clubs,
  maxCoaches,
  selectedClub,
  hoveredClub,
  onMarkerClick,
  onMarkerHover,
}: {
  clubs: ClubWithCoaches[];
  maxCoaches: number;
  selectedClub: string | null;
  hoveredClub: string | null;
  onMarkerClick: (name: string) => void;
  onMarkerHover: (name: string | null) => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Map area */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "4 / 5" }}
      >
        {/* Background with subtle grid */}
        <div className="absolute inset-0 bg-raised">
          {/* Grid pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.04]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="mapGrid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mapGrid)" />
          </svg>

          {/* Coastline hint */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={COASTLINE_PATH}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="0.4"
              opacity="0.15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Ocean side fill */}
            <path
              d={`${COASTLINE_PATH} L 100,100 L 100,0 Z`}
              fill="var(--accent)"
              opacity="0.02"
            />
          </svg>
        </div>

        {/* Region labels */}
        <div className="absolute top-3 left-4 text-[10px] font-display font-bold uppercase tracking-[0.2em] text-dim/60">
          West Palm Beach
        </div>
        <div className="absolute bottom-3 left-4 text-[10px] font-display font-bold uppercase tracking-[0.2em] text-dim/60">
          Miami
        </div>
        <div className="absolute top-3 right-4 text-[10px] font-display uppercase tracking-[0.15em] text-dim/40">
          Atlantic
        </div>

        {/* Club markers */}
        {clubs.map((club) => {
          const pos = toPosition(club.lat, club.lng);
          const isSelected = selectedClub === club.name;
          const isHovered = hoveredClub === club.name;
          const size = 10 + (club.coaches.length / maxCoaches) * 18;

          return (
            <button
              key={club.name}
              className="absolute -translate-x-1/2 -translate-y-1/2 group z-10 focus:outline-none"
              style={{
                top: `${pos.top}%`,
                left: `${pos.left}%`,
              }}
              onClick={() => onMarkerClick(club.name)}
              onMouseEnter={() => onMarkerHover(club.name)}
              onMouseLeave={() => onMarkerHover(null)}
              aria-label={`${club.name} - ${club.coaches.length} ${club.coaches.length === 1 ? "coach" : "coaches"}`}
            >
              {/* Pulse ring for selected */}
              {isSelected && (
                <span
                  className="absolute inset-0 rounded-full bg-accent/20 animate-ping"
                  style={{ width: size + 12, height: size + 12, margin: -6 }}
                />
              )}

              {/* Marker dot */}
              <span
                className="block rounded-full transition-all duration-200"
                style={{
                  width: size,
                  height: size,
                  background: isSelected
                    ? "var(--accent)"
                    : isHovered
                    ? "var(--accent)"
                    : "var(--accent)",
                  opacity: isSelected ? 1 : isHovered ? 0.9 : 0.55,
                  boxShadow: isSelected
                    ? "0 0 0 4px var(--accent-soft), 0 2px 8px rgba(232,90,28,0.3)"
                    : isHovered
                    ? "0 0 0 3px var(--accent-soft)"
                    : "none",
                  transform: isSelected
                    ? "scale(1.3)"
                    : isHovered
                    ? "scale(1.15)"
                    : "scale(1)",
                }}
              />

              {/* Tooltip */}
              {(isHovered || isSelected) && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap">
                  <div className="bg-foreground text-background text-[11px] font-display font-medium px-2.5 py-1.5 rounded-lg shadow-lg">
                    <div>{club.name}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">
                      {club.coaches.length}{" "}
                      {club.coaches.length === 1 ? "coach" : "coaches"}
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div
                      className="w-2 h-2 rotate-45 -mt-1"
                      style={{ background: "var(--foreground)" }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between text-[11px] text-dim">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent opacity-55" />
            Club location
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-accent opacity-55" />
            More coaches
          </span>
        </div>
        <span className="text-dim/60">South Florida</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Club Card                                                           */
/* ------------------------------------------------------------------ */

import { forwardRef } from "react";

const ClubCard = forwardRef<
  HTMLDivElement,
  {
    club: ClubWithCoaches;
    isSelected: boolean;
    isExpanded: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  }
>(function ClubCard(
  { club, isSelected, isExpanded, onClick, onMouseEnter, onMouseLeave },
  ref
) {
  const visibleCoaches = isExpanded ? club.coaches : club.coaches.slice(0, 4);

  return (
    <div
      ref={ref}
      className={`bg-surface border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
        isSelected
          ? "border-accent/40 shadow-[0_0_0_1px_var(--accent-soft)]"
          : "border-border hover:border-border-hover"
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Club header */}
      <div className="px-4 py-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-bold text-foreground truncate">
            {club.name}
          </h3>
          <p className="text-xs text-muted mt-0.5">{club.city}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="badge-accent">
            {club.coaches.length}{" "}
            {club.coaches.length === 1 ? "coach" : "coaches"}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-dim transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Coach avatars row (collapsed preview) */}
      {!isExpanded && club.coaches.length > 0 && (
        <div className="px-4 pb-3 flex items-center gap-1.5">
          <div className="flex -space-x-2">
            {club.coaches.slice(0, 4).map((coach) => (
              <CoachAvatar
                key={coach.coach_id}
                coach={coach}
                size={28}
              />
            ))}
          </div>
          {club.coaches.length > 4 && (
            <span className="text-[11px] text-dim ml-1">
              +{club.coaches.length - 4} more
            </span>
          )}
          <div className="flex-1" />
          <span className="text-[11px] text-dim">Click to expand</span>
        </div>
      )}

      {/* Expanded coach list */}
      {isExpanded && (
        <div className="border-t border-border">
          {visibleCoaches.map((coach, i) => (
            <Link
              key={coach.coach_id}
              href={`/coach/${coach.coach_id}`}
              onClick={(e) => e.stopPropagation()}
              className={`flex items-center gap-3 px-4 py-2.5 hover:bg-raised transition-colors ${
                i > 0 ? "border-t border-border/50" : ""
              }`}
            >
              <CoachAvatar coach={coach} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {coach.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {coach.level != null && (
                    <span className="text-[11px] text-accent font-display font-bold">
                      Lvl {coach.level.toFixed(1)}
                    </span>
                  )}
                  <span className="text-[11px] text-dim">
                    {coach.stats.totalClasses} classes
                  </span>
                </div>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-dim shrink-0"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Coach Avatar                                                        */
/* ------------------------------------------------------------------ */

function CoachAvatar({
  coach,
  size,
}: {
  coach: Coach;
  size: number;
}) {
  const initials = coach.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (coach.picture) {
    return (
      <Image
        src={coach.picture}
        alt={coach.name}
        width={size}
        height={size}
        className="rounded-full object-cover border-2 border-surface shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="rounded-full bg-accent-soft text-accent flex items-center justify-center border-2 border-surface shrink-0 font-display font-bold"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Loading Skeleton                                                    */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
      {/* Map skeleton */}
      <div className="order-1 lg:order-2">
        <div
          className="bg-surface border border-border rounded-xl animate-pulse"
          style={{ aspectRatio: "4 / 5" }}
        />
      </div>
      {/* List skeleton */}
      <div className="order-2 lg:order-1 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl h-20 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
