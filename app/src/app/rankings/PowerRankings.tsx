"use client";

/**
 * Power Rankings: Who's Running Miami
 * Leaderboard with level brackets, activity streaks, and club filters.
 * Only shows verified data. Win rate hidden when sample is too small.
 */

import { useState, useEffect, useRef, memo } from "react";
import Nav from "@/components/Nav";

// ── Types ────────────────────────────────────────────────────────────────

interface Streak {
  type: "hot" | "cold" | "new" | "steady";
  label: string;
}

interface RankedPlayer {
  rank: number;
  id: string;
  name: string;
  level: number | null;
  picture: string | null;
  matches: number;
  wins: number;
  losses: number;
  wlRecorded: number;
  winRate: number | null;
  winRateMeaningful: boolean;
  clubs: string[];
  lastMatch: string;
  powerScore: number;
  streak: Streak;
}

interface RankingsData {
  rankings: RankedPlayer[];
  totalRanked: number;
  categories: {
    hotPlayers: RankedPlayer[];
    risingStars: RankedPlayer[];
  };
  brackets: Record<string, RankedPlayer[]>;
  clubs: string[];
}

type Tab = "overall" | "hot" | "rising" | "brackets";

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

function streakDotColor(type: string): string {
  switch (type) {
    case "hot":
      return "var(--amber)";
    case "new":
      return "var(--teal)";
    case "steady":
      return "var(--accent)";
    case "cold":
    default:
      return "var(--dim)";
  }
}

/** Format win rate only when meaningful */
function formatWR(p: RankedPlayer): string {
  if (p.winRate == null) return "-";
  return `${Math.round(p.winRate * 100)}%`;
}

/** Client-side name filter — instant, no API call needed */
function filterBySearch(players: RankedPlayer[], query: string): RankedPlayer[] {
  if (!query.trim()) return players;
  const q = query.toLowerCase().trim();
  return players.filter((p) => p.name.toLowerCase().includes(q));
}

const TABS: { id: Tab; label: string }[] = [
  { id: "overall", label: "Overall" },
  { id: "hot", label: "On Fire" },
  { id: "rising", label: "New Players" },
  { id: "brackets", label: "By Level" },
];

// ── Main component ───────────────────────────────────────────────────────

export default function PowerRankings() {
  const [data, setData] = useState<RankingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overall");
  const [club, setClub] = useState("");
  const [levelRange, setLevelRange] = useState<[number, number]>([0, 8]);
  const [search, setSearch] = useState("");
  const [allClubs, setAllClubs] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        minMatches: "5",
        minLevel: String(levelRange[0]),
        maxLevel: String(levelRange[1]),
      });
      if (club) params.set("club", club);

      fetch(`/api/rankings?${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) throw new Error(d.error);
          setData(d);
          // API now always returns the full club list (fetched independently)
          if (d.clubs?.length > 0) {
            setAllClubs(d.clubs);
          }
        })
        .catch((e) => {
          setError(e.message ?? "Failed to load");
          setData(null);
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [club, levelRange]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <div className="page-container pt-20 pb-16">
        {/* ── Header */}
        <header className="mb-10">
          <p className="section-label mb-3">Rankings</p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Who&rsquo;s Running Miami
          </h1>
          <p className="mt-2 text-sm text-muted">
            {data
              ? `${data.totalRanked.toLocaleString()} players ranked by power score`
              : loading
                ? "Loading rankings\u2026"
                : "No data available"}
          </p>
        </header>

        {/* ── Tab bar — simple underline style */}
        <div className="mb-6 border-b border-border">
          <div className="flex gap-6 overflow-x-auto no-scrollbar -mb-px">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap pb-3 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "text-foreground border-b-2 border-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Filters — single row desktop, stacked mobile */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Player search */}
          <div className="relative w-full sm:w-64">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-dim pointer-events-none"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player..."
              className="input-field w-full pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-foreground"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

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

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Lvl</span>
            <input
              type="number"
              min={0}
              max={8}
              step={0.5}
              value={levelRange[0]}
              onChange={(e) =>
                setLevelRange([parseFloat(e.target.value), levelRange[1]])
              }
              className="input-field w-16 text-center !py-2.5 sm:!py-2"
            />
            <span className="text-dim">&ndash;</span>
            <input
              type="number"
              min={0}
              max={8}
              step={0.5}
              value={levelRange[1]}
              onChange={(e) =>
                setLevelRange([levelRange[0], parseFloat(e.target.value)])
              }
              className="input-field w-16 text-center !py-2.5 sm:!py-2"
            />
          </div>
        </div>

        {/* ── Error state */}
        {error && !loading && (
          <div className="card p-8 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* ── Loading skeleton */}
        {loading && <LoadingSkeleton />}

        {/* ── Content */}
        {data && !loading && (
          <>
            {/* Overall rankings */}
            {tab === "overall" && (
              <>
                {filterBySearch(data.rankings, search).length > 0 ? (
                  <RankingTable
                    players={filterBySearch(data.rankings, search)}
                    showRank
                    highlightTop={search ? 0 : 3}
                  />
                ) : (
                  <EmptyState message={search ? `No players matching "${search}".` : "No players match these filters."} />
                )}
              </>
            )}

            {/* Hot players */}
            {tab === "hot" && (
              <div>
                <p className="text-sm text-muted mb-5">
                  Most active players in the last 2 weeks with strong results.
                </p>
                {filterBySearch(data.categories.hotPlayers, search).length > 0 ? (
                  <RankingTable
                    players={filterBySearch(data.categories.hotPlayers, search)}
                    showRank
                  />
                ) : (
                  <EmptyState message={search ? `No players matching "${search}".` : "No hot players with current filters."} />
                )}
              </div>
            )}

            {/* Rising stars */}
            {tab === "rising" && (
              <div>
                <p className="text-sm text-muted mb-5">
                  Players who started playing in the last 45 days.
                </p>
                {filterBySearch(data.categories.risingStars, search).length > 0 ? (
                  <RankingTable
                    players={filterBySearch(data.categories.risingStars, search)}
                    showRank={false}
                  />
                ) : (
                  <EmptyState message={search ? `No players matching "${search}".` : "No new players with current filters."} />
                )}
              </div>
            )}

            {/* Level brackets */}
            {tab === "brackets" && (
              <div className="space-y-10">
                {Object.entries(data.brackets).length > 0 ? (
                  Object.entries(data.brackets)
                    .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                    .filter(([, players]) => filterBySearch(players, search).length > 0)
                    .map(([bracket, players]) => {
                      const filtered = filterBySearch(players, search);
                      return (
                        <div key={bracket}>
                          <h3 className="text-base font-bold mb-4 flex items-center gap-2.5">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full"
                              style={{
                                background: levelColor(parseFloat(bracket)),
                              }}
                            />
                            Level {bracket}
                            <span className="text-muted font-normal text-sm">
                              ({filtered.length})
                            </span>
                          </h3>
                          <RankingTable players={filtered} showRank={false} />
                        </div>
                      );
                    })
                ) : (
                  <EmptyState message="No level data available with current filters." />
                )}
                {Object.entries(data.brackets).length > 0 &&
                  Object.entries(data.brackets).filter(([, players]) => filterBySearch(players, search).length > 0).length === 0 && (
                    <EmptyState message={`No players matching "${search}".`} />
                  )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Ranking Table ────────────────────────────────────────────────────────

const RankingTable = memo(function RankingTable({
  players,
  showRank,
  highlightTop = 0,
}: {
  players: RankedPlayer[];
  showRank: boolean;
  highlightTop?: number;
}) {
  return (
    <div className="card overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 section-label border-b border-border">
        {showRank && <div className="w-8 sm:w-10 shrink-0 text-center">#</div>}
        <div className="flex-1 min-w-0">Player</div>
        <div className="hidden sm:block w-14 shrink-0 text-center">Level</div>
        <div className="hidden sm:block w-16 shrink-0 text-center">Matches</div>
        <div className="w-16 shrink-0 text-center">Score</div>
        <div className="w-14 shrink-0 text-center">Win %</div>
        <div className="w-10 shrink-0 text-center hidden sm:block">Form</div>
      </div>

      {players.map((p, i) => {
        const isTop = showRank && p.rank <= highlightTop;

        return (
          <a
            key={p.id}
            href={`/player/${p.id}`}
            className={`group flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 transition-colors duration-150 border-b border-border/40 last:border-0 ${
              isTop
                ? "bg-accent/5 border-l-2 border-l-accent"
                : i % 2 === 0
                  ? "bg-transparent"
                  : "bg-surface"
            } hover:bg-raised`}
          >
            {/* Rank */}
            {showRank && (
              <div className="w-8 sm:w-10 shrink-0 text-center">
                {p.rank <= 3 ? (
                  <span className="stat-number text-sm font-bold text-accent">
                    {p.rank}
                  </span>
                ) : (
                  <span className="stat-number text-sm text-muted">
                    {p.rank}
                  </span>
                )}
              </div>
            )}

            {/* Player — photo + name + club */}
            <div className="flex-1 flex items-center gap-2.5 min-w-0 overflow-hidden">
              {p.picture ? (
                <img
                  src={p.picture.replace(
                    "c_limit,w_1280",
                    "c_fill,w_36,h_36"
                  )}
                  className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border"
                  alt=""
                />
              ) : (
                <div className="h-8 w-8 shrink-0 rounded-full bg-surface flex items-center justify-center text-xs font-bold text-muted ring-1 ring-border">
                  {p.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                  {p.name}
                </p>
                <p className="text-xs text-dim truncate">
                  {p.clubs.length > 0 ? p.clubs[0] : ""}
                  {p.clubs.length > 1 && ` +${p.clubs.length - 1}`}
                </p>
              </div>
            </div>

            {/* Level — hidden below 640px */}
            <div className="hidden sm:block w-14 shrink-0 text-center">
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: levelColor(p.level) }}
              >
                {p.level?.toFixed(1) ?? "-"}
              </span>
            </div>

            {/* Matches */}
            <div className="hidden sm:block w-16 shrink-0 text-center">
              <span className="text-sm text-foreground tabular-nums">
                {p.matches}
              </span>
            </div>

            {/* Power Score */}
            <div className="w-16 shrink-0 text-center">
              <span className="stat-number text-sm font-bold text-accent">
                {p.powerScore}
              </span>
            </div>

            {/* Win % */}
            <div className="w-14 shrink-0 text-center">
              {p.winRate != null ? (
                <span className="text-sm tabular-nums text-foreground">
                  {formatWR(p)}
                </span>
              ) : (
                <span className="text-sm text-dim">-</span>
              )}
            </div>

            {/* Streak — simplified dot */}
            <div className="w-10 shrink-0 text-center hidden sm:flex items-center justify-center">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: streakDotColor(p.streak.type) }}
                title={p.streak.label}
              />
            </div>
          </a>
        );
      })}
    </div>
  );
});

// ── Loading skeleton ─────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-border animate-pulse">
        <div className="h-3 w-full rounded bg-border/40" />
      </div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-5 py-3 border-b border-border/40 last:border-0 animate-pulse ${
            i % 2 === 0 ? "bg-transparent" : "bg-surface"
          }`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="w-10 flex justify-center">
            <div className="h-4 w-6 rounded bg-border/40" />
          </div>
          <div className="flex items-center gap-2.5 flex-1">
            <div className="h-8 w-8 rounded-full bg-border/40" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-border/40" />
              <div className="h-2.5 w-20 rounded bg-border/30" />
            </div>
          </div>
          <div className="hidden sm:flex w-14 justify-center">
            <div className="h-4 w-8 rounded bg-border/40" />
          </div>
          <div className="hidden sm:flex w-16 justify-center">
            <div className="h-4 w-10 rounded bg-border/40" />
          </div>
          <div className="w-16 flex justify-center">
            <div className="h-4 w-10 rounded bg-border/40" />
          </div>
          <div className="w-14 flex justify-center">
            <div className="h-4 w-8 rounded bg-border/40" />
          </div>
          <div className="hidden sm:flex w-10 justify-center">
            <div className="h-2 w-2 rounded-full bg-border/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────

const EmptyState = memo(function EmptyState({ message }: { message: string }) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center">
      <p className="text-muted text-sm">{message}</p>
    </div>
  );
});
