"use client";

import { useState, useEffect, useRef, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";

// ── Types ────────────────────────────────────────────────────────────────

interface Coach {
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

interface CoachesData {
  coaches: Coach[];
  clubs: string[];
}

type SortOption = "classes" | "level" | "name";

// ── Helpers ──────────────────────────────────────────────────────────────

function levelColor(level: number | null): string {
  if (level == null) return "var(--muted)";
  if (level >= 6) return "#06b6d4";
  if (level >= 5) return "#8b5cf6";
  if (level >= 4) return "var(--amber)";
  if (level >= 3) return "var(--teal)";
  if (level >= 2) return "#3b82f6";
  return "var(--muted)";
}

function levelBg(level: number | null): string {
  if (level == null) return "rgba(120,113,108,0.1)";
  if (level >= 6) return "rgba(6,182,212,0.12)";
  if (level >= 5) return "rgba(139,92,246,0.12)";
  if (level >= 4) return "rgba(217,119,6,0.12)";
  if (level >= 3) return "rgba(13,148,136,0.12)";
  if (level >= 2) return "rgba(59,130,246,0.12)";
  return "rgba(120,113,108,0.1)";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Optimize Cloudinary URLs for thumbnails */
function thumbUrl(url: string): string {
  return url.replace("c_limit,w_1280", "c_fill,w_160,h_160,f_auto");
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "classes", label: "Most Active" },
  { value: "level", label: "Highest Level" },
  { value: "name", label: "A-Z" },
];

// ── Main Component ───────────────────────────────────────────────────────

export default function CoachDirectory() {
  const [data, setData] = useState<CoachesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [club, setClub] = useState("");
  const [sort, setSort] = useState<SortOption>("classes");
  const [allClubs, setAllClubs] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const delay = search ? 350 : 200;

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (club) params.set("club", club);
      if (sort) params.set("sort", sort);

      fetch(`/api/coaches?${params}`)
        .then((r) => r.json())
        .then((d: CoachesData) => {
          setData(d);
          if (d.clubs?.length > 0) {
            setAllClubs(d.clubs);
          }
        })
        .catch((e) => {
          setError(e.message ?? "Failed to load coaches");
          setData(null);
        })
        .finally(() => setLoading(false));
    }, delay);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, club, sort]);

  const coachCount = data?.coaches.length ?? 0;
  const clubCount = allClubs.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <div className="page-container pt-20 pb-16">
        {/* ── Header */}
        <header className="mb-10">
          <p className="section-label mb-3">Coaches</p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Find Your Coach
          </h1>
          <p className="mt-2 text-sm text-muted">
            {loading
              ? "Loading coaches..."
              : `${coachCount} coaches across ${clubCount}+ clubs`}
          </p>
        </header>

        {/* ── Filters */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-dim pointer-events-none"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coach..."
              className="input-field w-full pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-foreground"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Club filter */}
          <select
            value={club}
            onChange={(e) => setClub(e.target.value)}
            className="input-field w-full sm:w-56"
          >
            <option value="">All clubs</option>
            {allClubs.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="input-field w-full sm:w-44"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Error */}
        {error && !loading && (
          <div className="card p-8 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* ── Loading skeleton */}
        {loading && <CoachGridSkeleton />}

        {/* ── Coach grid */}
        {data && !loading && (
          <>
            {data.coaches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.coaches.map((coach) => (
                  <CoachCard key={coach.coach_id} coach={coach} />
                ))}
              </div>
            ) : (
              <EmptyState
                message={
                  search
                    ? `No coaches matching "${search}".`
                    : "No coaches match these filters."
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Coach Card ───────────────────────────────────────────────────────────

const CoachCard = memo(function CoachCard({ coach }: { coach: Coach }) {
  const { stats } = coach;
  const primaryClub = coach.clubs[0];
  const extraClubs = coach.clubs.length - 1;

  // Private/Group split percentage
  const privatePercent =
    stats.totalClasses > 0
      ? Math.round((stats.privateClasses / stats.totalClasses) * 100)
      : 0;
  const groupPercent = 100 - privatePercent;

  return (
    <Link
      href={`/coach/${coach.coach_id}`}
      className="card group flex flex-col p-5 transition-all hover:translate-y-[-2px]"
    >
      {/* Top row: photo + name + level */}
      <div className="flex items-start gap-3.5 mb-4">
        {/* Photo / Initials */}
        <div className="relative shrink-0">
          {coach.picture ? (
            <Image
              src={thumbUrl(coach.picture)}
              alt={coach.name}
              width={52}
              height={52}
              className="rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <div
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center ring-1 ring-border text-sm font-bold"
              style={{
                background: levelBg(coach.level),
                color: levelColor(coach.level),
              }}
            >
              {getInitials(coach.name)}
            </div>
          )}
          {coach.is_premium && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber flex items-center justify-center"
              title="Premium Coach"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="white"
                stroke="none"
              >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            </span>
          )}
        </div>

        {/* Name + Club */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate group-hover:text-accent transition-colors">
            {coach.name}
          </h3>
          {primaryClub && (
            <p className="text-xs text-muted truncate mt-0.5">
              {primaryClub.name}
              {extraClubs > 0 && (
                <span className="text-dim"> +{extraClubs} more</span>
              )}
            </p>
          )}
        </div>

        {/* Level badge */}
        <span
          className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold tabular-nums"
          style={{
            background: levelBg(coach.level),
            color: levelColor(coach.level),
          }}
        >
          {coach.level != null ? coach.level.toFixed(1) : "--"}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-3">
        <div>
          <p className="stat-number text-lg font-bold text-foreground">
            {stats.totalClasses}
          </p>
          <p className="text-[11px] text-muted">Classes</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex-1">
          <div className="flex items-center justify-between text-[11px] text-muted mb-1">
            <span>Private {stats.privateClasses}</span>
            <span>Group {stats.groupClasses}</span>
          </div>
          {/* Split bar */}
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden flex">
            {privatePercent > 0 && (
              <div
                className="h-full rounded-l-full"
                style={{
                  width: `${privatePercent}%`,
                  background: "var(--accent)",
                }}
              />
            )}
            {groupPercent > 0 && stats.groupClasses > 0 && (
              <div
                className="h-full rounded-r-full"
                style={{
                  width: `${groupPercent}%`,
                  background: "var(--teal)",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer: View Profile CTA */}
      <div className="mt-auto pt-3 border-t border-border/60">
        <span className="text-xs font-medium text-accent group-hover:underline">
          View Profile
        </span>
      </div>
    </Link>
  );
});

// ── Loading Skeleton ─────────────────────────────────────────────────────

function CoachGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="card p-5 animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-[52px] h-[52px] rounded-full bg-border/40 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 rounded bg-border/40" />
              <div className="h-3 w-36 rounded bg-border/30" />
            </div>
            <div className="h-5 w-10 rounded bg-border/40" />
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="space-y-1">
              <div className="h-5 w-8 rounded bg-border/40" />
              <div className="h-2.5 w-12 rounded bg-border/30" />
            </div>
            <div className="h-8 w-px bg-border/40" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-full rounded bg-border/30" />
              <div className="h-1.5 w-full rounded-full bg-border/40" />
            </div>
          </div>
          <div className="pt-3 border-t border-border/30">
            <div className="h-3 w-20 rounded bg-border/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────

const EmptyState = memo(function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center">
      <p className="text-muted text-sm">{message}</p>
    </div>
  );
});
