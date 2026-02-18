"use client";

import { useState, useEffect, useMemo, memo } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Trophy,
  GraduationCap,
  Filter,
  ExternalLink,
  ChevronDown,
  X,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────── */

interface Club {
  id: string;
  name: string;
  city: string;
  image?: string;
  courts: number;
}

interface EventItem {
  id: string;
  type: "tournament" | "class";
  name: string;
  startDate: string;
  endDate?: string;
  dayOfWeek: string;
  time: string;
  club: Club;
  gender?: string;
  level?: string;
  price?: number;
  currency?: string;
  spots?: number;
  status: string;
  classType?: string;
  coach?: string;
  enrolled?: number;
  playtomicUrl: string;
}

interface ApiResponse {
  events: EventItem[];
  clubs: Club[];
  meta: {
    totalClubs: number;
    totalEvents: number;
    tournaments: number;
    classes: number;
  };
  error?: string;
}

/* ── Constants ──────────────────────────────────────────────── */

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const EVENT_TYPES = [
  { value: "all", label: "All Events" },
  { value: "tournament", label: "Tournaments" },
  { value: "class", label: "Classes" },
] as const;

/* ── Main Component ─────────────────────────────────────────── */

export default function TournamentFinder() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [selectedClub, setSelectedClub] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // View mode
  const [view, setView] = useState<"week" | "list">("week");

  /* ── Fetch data ───────────────────────────────────────────── */
  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  /* ── Filtered events ──────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!data?.events) return [];
    return data.events.filter((e) => {
      if (selectedDays.size > 0 && !selectedDays.has(e.dayOfWeek)) return false;
      if (selectedClub !== "all" && e.club.id !== selectedClub) return false;
      if (eventType !== "all" && e.type !== eventType) return false;
      return true;
    });
  }, [data, selectedDays, selectedClub, eventType]);

  /* ── Group by day for week view ───────────────────────────── */
  const byDay = useMemo(() => {
    const groups: Record<string, EventItem[]> = {};
    for (const day of DAYS) groups[day] = [];
    for (const e of filtered) {
      if (groups[e.dayOfWeek]) groups[e.dayOfWeek].push(e);
    }
    return groups;
  }, [filtered]);

  /* ── Day helpers ──────────────────────────────────────────── */
  const toggleDay = (day: string) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedDays(new Set());
    setSelectedClub("all");
    setEventType("all");
  };

  const activeFilterCount =
    selectedDays.size +
    (selectedClub !== "all" ? 1 : 0) +
    (eventType !== "all" ? 1 : 0);

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pt-20 pb-16">
        <div className="page-container">
          {/* ── Header ──────────────────────────────────────── */}
          <div className="mb-10">
            <p className="section-label">Tournaments &amp; Classes</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Tournaments and Classes
            </h1>
            {data?.meta && (
              <p className="mt-3 text-sm text-muted">
                {data.meta.tournaments} tournaments and {data.meta.classes}{" "}
                classes across {data.meta.totalClubs} clubs
              </p>
            )}

            {/* View toggle + mobile filter */}
            <div className="mt-6 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setView("week")}
                  className={`pb-2.5 text-sm font-medium transition-colors ${
                    view === "week"
                      ? "border-b-2 border-accent text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`pb-2.5 text-sm font-medium transition-colors ${
                    view === "list"
                      ? "border-b-2 border-accent text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  List
                </button>
              </div>

              {/* Filter toggle (mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 pb-2.5 text-sm font-medium transition-colors sm:hidden ${
                  activeFilterCount > 0
                    ? "text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── Content: filters + main ────────────────────── */}
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* ── Filters sidebar ───────────────────────────── */}
            <aside
              className={`w-full min-w-0 shrink-0 lg:w-56 ${
                showFilters ? "block" : "hidden lg:block"
              }`}
            >
              <div className="sticky top-20 space-y-6">
                {/* Filter header */}
                <div className="flex items-center justify-between">
                  <p className="section-label">Filters</p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-[11px] font-medium text-accent hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Event type */}
                <div>
                  <p className="section-label mb-2">Event Type</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EVENT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setEventType(t.value)}
                        className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                          eventType === t.value
                            ? "bg-raised text-foreground"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Days of the week */}
                <div>
                  <p className="section-label mb-2">Day</p>
                  <div className="flex flex-wrap gap-1.5 lg:grid lg:grid-cols-2">
                    {DAYS.map((day) => {
                      const count = data
                        ? data.events.filter(
                            (e) =>
                              e.dayOfWeek === day &&
                              (eventType === "all" || e.type === eventType) &&
                              (selectedClub === "all" ||
                                e.club.id === selectedClub),
                          ).length
                        : 0;
                      const selected = selectedDays.has(day);

                      return (
                        <button
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-[12px] font-medium transition-colors ${
                            selected
                              ? "border-accent bg-accent text-white"
                              : "border-border bg-surface text-muted hover:text-foreground"
                          }`}
                        >
                          <span>{day.slice(0, 3)}</span>
                          <span
                            className={`tabular-nums ${
                              selected
                                ? "text-white/70"
                                : count > 0
                                  ? "text-foreground"
                                  : "text-dim"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Club filter */}
                <div className="w-full min-w-0">
                  <p className="section-label mb-2">Club</p>
                  <div className="relative w-full min-w-0">
                    <select
                      value={selectedClub}
                      onChange={(e) => setSelectedClub(e.target.value)}
                      className="input-field w-full min-w-0 appearance-none pr-8 text-sm"
                    >
                      <option value="all">All Clubs</option>
                      {data?.clubs.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                  </div>
                </div>

                {/* Active filters chips (mobile) */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-1.5 lg:hidden">
                    {Array.from(selectedDays).map((day) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-white"
                      >
                        {day.slice(0, 3)}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* ── Main content ───────────────────────────────── */}
            <main className="min-w-0 flex-1">
              {loading && <LoadingSkeleton />}
              {error && <ErrorState message={error} />}

              {!loading && !error && filtered.length === 0 && (
                <EmptyState onClear={clearFilters} hasFilters={activeFilterCount > 0} />
              )}

              {!loading && !error && filtered.length > 0 && (
                <>
                  {/* Results count */}
                  <p className="mb-4 text-[12px] text-muted">
                    Showing {filtered.length}{" "}
                    {filtered.length === 1 ? "event" : "events"}
                    {activeFilterCount > 0 && " (filtered)"}
                  </p>

                  {view === "week" ? (
                    <WeekView byDay={byDay} />
                  ) : (
                    <ListView events={filtered} />
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Week View ──────────────────────────────────────────────── */

const WeekView = memo(function WeekView({ byDay }: { byDay: Record<string, EventItem[]> }) {
  const todayName = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "America/New_York",
  });

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden">
      {DAYS.map((day) => {
        const events = byDay[day];
        const isToday = day === todayName;

        return (
          <div key={day}>
            {/* Day header */}
            <div className="mb-3 flex items-center gap-3">
              <span
                className={`section-label ${isToday ? "!text-accent" : ""}`}
              >
                {day}
                {isToday && (
                  <span className="ml-2 text-[11px] font-bold uppercase tracking-wider text-accent">
                    Today
                  </span>
                )}
              </span>
              <div className="h-px flex-1 bg-border" />
              <span className="text-[12px] tabular-nums text-dim">
                {events.length}
              </span>
            </div>

            {events.length === 0 ? (
              <p className="py-4 text-center text-[12px] text-dim">
                Nothing scheduled
              </p>
            ) : (
              <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

/* ── List View ──────────────────────────────────────────────── */

const ListView = memo(function ListView({ events }: { events: EventItem[] }) {
  return (
    <div className="space-y-2">
      {events.map((event) => (
        <EventRow key={event.id} event={event} />
      ))}
    </div>
  );
});

/* ── Event Card (Week View) ─────────────────────────────────── */

const EventCard = memo(function EventCard({ event }: { event: EventItem }) {
  const isTournament = event.type === "tournament";
  const dateStr = formatDate(event.startDate);

  return (
    <a
      href={event.playtomicUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="card group block w-full min-w-0 p-4 transition-all hover:border-border-hover"
    >
      {/* Type label + external link */}
      <div className="flex items-start justify-between">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wide ${
            isTournament ? "text-accent" : "text-teal"
          }`}
        >
          {isTournament ? "Tournament" : "Class"}
        </span>
        <ExternalLink className="h-3.5 w-3.5 text-dim opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Name */}
      <h4 className="mt-2 text-sm font-semibold leading-snug text-foreground">
        {event.name}
      </h4>

      {/* Club */}
      <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">{event.club.name}</span>
      </div>

      {/* Date + time */}
      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
        <Clock className="h-3 w-3 shrink-0" />
        <span>
          {dateStr} at {event.time}
        </span>
      </div>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        {event.price != null && (
          <span className="font-semibold text-accent">${event.price}</span>
        )}
        {event.gender && (
          <span className="text-muted">{event.gender}</span>
        )}
        {event.level && (
          <span className="tabular-nums text-muted">Lvl {event.level}</span>
        )}
        {event.coach && (
          <span className="text-muted">Coach {event.coach}</span>
        )}
        {event.spots != null && event.spots > 0 && (
          <span className="font-medium text-teal">
            {event.spots} spots
          </span>
        )}
      </div>
    </a>
  );
});

/* ── Event Row (List View) ──────────────────────────────────── */

const EventRow = memo(function EventRow({ event }: { event: EventItem }) {
  const isTournament = event.type === "tournament";
  const dateStr = formatDate(event.startDate);

  return (
    <a
      href={event.playtomicUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="card group flex w-full min-w-0 items-center gap-4 p-3 transition-all hover:border-border-hover sm:p-4"
    >
      {/* Type label */}
      <span
        className={`w-16 shrink-0 text-[11px] font-semibold uppercase tracking-wide ${
          isTournament ? "text-accent" : "text-teal"
        }`}
      >
        {isTournament ? "Tourn." : "Class"}
      </span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold text-foreground">
          {event.name}
        </h4>
        <p className="mt-0.5 truncate text-[12px] text-muted">
          {event.club.name}
          {event.club.city ? `, ${event.club.city}` : ""}
        </p>
      </div>

      {/* Date/time */}
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-[12px] font-medium text-foreground">{dateStr}</p>
        <p className="text-[12px] text-muted">{event.time}</p>
      </div>

      {/* Price + spots */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        {event.price != null && (
          <span className="text-[11px] font-semibold text-accent">
            ${event.price}
          </span>
        )}
        {event.spots != null && event.spots > 0 && (
          <span className="text-[11px] text-teal">{event.spots} spots</span>
        )}
      </div>

      {/* Arrow */}
      <ExternalLink className="h-4 w-4 shrink-0 text-dim transition-colors group-hover:text-accent" />
    </a>
  );
});

/* ── Loading skeleton ───────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="mb-3 flex items-center gap-3">
            <div className="h-3 w-20 animate-pulse rounded bg-raised" />
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="card p-4"
                style={{ animationDelay: `${(i * 3 + j) * 100}ms` }}
              >
                <div className="h-3 w-16 animate-pulse rounded bg-surface" />
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-surface" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-surface" />
                <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-surface" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────────── */

const EmptyState = memo(function EmptyState({
  onClear,
  hasFilters,
}: {
  onClear: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-20 text-center">
      <h3 className="text-lg font-semibold text-foreground">
        No events found
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted">
        {hasFilters
          ? "Try adjusting your filters to see more results."
          : "No upcoming tournaments or classes right now. Check back soon."}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="btn-primary mt-5">
          Clear filters
        </button>
      )}
    </div>
  );
});

/* ── Error state ────────────────────────────────────────────── */

const ErrorState = memo(function ErrorState({ message }: { message: string }) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <p className="text-lg font-semibold text-loss">
        Something went wrong
      </p>
      <p className="mt-2 text-sm text-muted">{message}</p>
    </div>
  );
});

/* ── Date helper ────────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}
