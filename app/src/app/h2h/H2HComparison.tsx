"use client";

/**
 * Head-to-Head Comparison with real match records.
 * Shows actual W/L record, set scores, match history, and stat comparison.
 *
 * Obsidian Court design system — clean, editorial, data-first.
 */

import { useState, useEffect, useCallback, useRef, memo } from "react";
import Nav from "@/components/Nav";

// ── Types ────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  name: string;
  level: number | null;
  picture: string | null;
  matches: number;
  winRate: number | null;
}

interface Comparison {
  label: string;
  p1: number | null;
  p2: number | null;
  winner: "p1" | "p2" | "tie" | null;
  format: string;
}

interface MutualPlayer {
  id: string;
  name: string;
  level: number | null;
  picture: string | null;
}

interface MatchRecord {
  matchId: string;
  date: string;
  club: string;
  winner: "p1" | "p2";
  sets: { p1: number | null; p2: number | null }[];
  p1Partner: string | null;
  p2Partner: string | null;
  p1PartnerName: string | null;
  p2PartnerName: string | null;
}

interface H2HData {
  p1: {
    id: string;
    name: string;
    level: number | null;
    picture: string | null;
    matches: number;
    winRate: number | null;
    winRateMeaningful: boolean;
    wlRecorded: number;
  };
  p2: {
    id: string;
    name: string;
    level: number | null;
    picture: string | null;
    matches: number;
    winRate: number | null;
    winRateMeaningful: boolean;
    wlRecorded: number;
  };
  h2h: {
    totalMatches: number;
    p1Wins: number;
    p2Wins: number;
    matchHistory: MatchRecord[];
  };
  asPartners: {
    totalMatches: number;
    wins: number;
    losses: number;
  };
  directConnection: {
    weight: number;
    relationship: string;
    lastPlayed: string;
  } | null;
  comparisons: Comparison[];
  score: { p1: number; p2: number };
  mutualConnections: MutualPlayer[];
  mutualCount: number;
  sharedClubs: string[];
  p1TotalConnections: number;
  p2TotalConnections: number;
}

// ── Player Search Input ──────────────────────────────────────────────────

const PlayerSearch = memo(function PlayerSearch({
  label,
  side,
  onSelect,
  selected,
}: {
  label: string;
  side: "left" | "right";
  onSelect: (p: SearchResult) => void;
  selected: SearchResult | null;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetch(`/api/players/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => {
          setResults(d.results ?? []);
          setOpen(true);
        });
    }, 250);
    return () => clearTimeout(timeoutRef.current);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const accentBorder =
    side === "left" ? "border-accent/40" : "border-teal/40";

  if (selected) {
    return (
      <div className={`card flex items-center gap-3 p-3 sm:p-4 min-w-0 ${accentBorder}`}>
        {selected.picture ? (
          <img
            src={selected.picture.replace("c_limit,w_1280", "c_fill,w_44,h_44")}
            className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-full object-cover ring-2 ring-border"
            alt=""
          />
        ) : (
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-surface font-display text-sm font-bold text-muted">
            {selected.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="font-display font-semibold truncate text-foreground text-sm sm:text-base">
            {selected.name}
          </p>
          <p className="text-[11px] sm:text-xs text-muted truncate">
            Level {selected.level?.toFixed(2) ?? "?"} · {selected.matches}{" "}
            matches
            {selected.winRate != null ? ` · ${selected.winRate}% WR` : ""}
          </p>
        </div>
        <button
          onClick={() => onSelect(null as unknown as SearchResult)}
          className="shrink-0 rounded-lg p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition-colors"
          aria-label="Remove player"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative min-w-0">
      <label className="section-label mb-1.5 block">
        {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search player..."
        className="input-field w-full min-w-0"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1.5 left-0 right-0 min-w-0 w-full max-w-[calc(100vw-2rem)] card overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onSelect(r);
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface"
            >
              {r.picture ? (
                <img
                  src={r.picture.replace("c_limit,w_1280", "c_fill,w_28,h_28")}
                  className="h-7 w-7 rounded-full object-cover"
                  alt=""
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-xs font-bold text-muted">
                  {r.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {r.name}
                </p>
                <p className="text-[11px] text-muted">
                  Lvl {r.level?.toFixed(2) ?? "?"} · {r.matches} matches
                  {r.winRate != null ? ` · ${r.winRate}% WR` : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// ── Format helpers ──────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatValue(val: number | null, format: string): string {
  if (val == null) return "-";
  if (format === "percent") return `${Math.round(val * 100)}%`;
  return val.toLocaleString();
}

/** Render set scores as inline text like "6-3, 4-6, 7-5" */
function formatSets(
  sets: { p1: number | null; p2: number | null }[],
  winner: "p1" | "p2",
): React.ReactNode {
  if (sets.length === 0) {
    return <span className="text-xs text-muted">No score data</span>;
  }

  return (
    <span className="text-sm tabular-nums">
      {sets.map((s, i) => {
        const p1Won = s.p1 != null && s.p2 != null && s.p1 > s.p2;
        const p2Won = s.p1 != null && s.p2 != null && s.p2 > s.p1;
        const winnerColor = winner === "p1" ? "text-accent" : "text-teal";
        return (
          <span key={i}>
            <span className={p1Won ? winnerColor : "text-foreground/50"}>
              {s.p1 ?? "-"}
            </span>
            <span className="text-muted">-</span>
            <span className={p2Won ? winnerColor : "text-foreground/50"}>
              {s.p2 ?? "-"}
            </span>
            {i < sets.length - 1 && (
              <span className="text-dim">, </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export default function H2HComparison() {
  const [p1, setP1] = useState<SearchResult | null>(null);
  const [p2, setP2] = useState<SearchResult | null>(null);
  const [data, setData] = useState<H2HData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"rivals" | "partners" | "stats">(
    "rivals",
  );

  const fetchH2H = useCallback(async () => {
    if (!p1 || !p2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/h2h?p1=${p1.id}&p2=${p2.id}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setData(d);
      // Default to best tab based on data
      if (d.h2h?.totalMatches > 0) setActiveTab("rivals");
      else if (d.asPartners?.totalMatches > 0) setActiveTab("partners");
      else setActiveTab("stats");
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [p1, p2]);

  // Auto-fetch when both selected
  useEffect(() => {
    if (p1 && p2) fetchH2H();
    else setData(null);
  }, [p1, p2, fetchH2H]);

  const h2h = data?.h2h;
  const partners = data?.asPartners;

  const tabs = [
    {
      key: "rivals" as const,
      label: "Rivalry",
      count: h2h?.totalMatches ?? 0,
    },
    {
      key: "partners" as const,
      label: "As Partners",
      count: partners?.totalMatches ?? 0,
    },
    { key: "stats" as const, label: "Stats", count: null },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <div className="page-container pt-20 pb-16">
        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <p className="section-label mb-3">Head to Head</p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Settle the Score
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            Pick two players. See their real match record, set scores, and who
            has the edge.
          </p>
        </div>

        {/* ── Player Selectors ────────────────────────────────── */}
        <div className="grid gap-3 sm:gap-4 md:grid-cols-[1fr,auto,1fr] md:items-end mb-10 min-w-0">
          <PlayerSearch
            label="Player 1"
            side="left"
            selected={p1}
            onSelect={(r) => setP1(r ?? null)}
          />

          <div className="hidden md:flex items-center justify-center pb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface">
              <span className="font-display text-xs font-bold text-muted">
                VS
              </span>
            </div>
          </div>

          <PlayerSearch
            label="Player 2"
            side="right"
            selected={p2}
            onSelect={(r) => setP2(r ?? null)}
          />
        </div>

        {/* ── Loading ─────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-4 py-12">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-xl bg-surface"
              />
            ))}
          </div>
        )}

        {/* ── Comparison Results ──────────────────────────────── */}
        {data && !loading && (
          <div className="space-y-10">
            {/* ── Score Banner ─────────────────────────────────── */}
            <div className="card p-5 sm:p-8">
              <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-14">
                {/* P1 Side */}
                <div className="text-center min-w-0 flex-1">
                  {data.p1.picture ? (
                    <img
                      src={data.p1.picture.replace(
                        "c_limit,w_1280",
                        "c_fill,w_56,h_56",
                      )}
                      className="mx-auto mb-2 h-11 w-11 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-accent/30"
                      alt=""
                    />
                  ) : (
                    <div className="mx-auto mb-2 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-accent/10 font-display text-base sm:text-lg font-bold text-accent">
                      {data.p1.name.charAt(0)}
                    </div>
                  )}
                  <p className="stat-number text-3xl sm:text-4xl md:text-5xl font-bold text-accent">
                    {h2h && h2h.totalMatches > 0
                      ? h2h.p1Wins
                      : data.score.p1}
                  </p>
                  <p className="mt-1 max-w-[90px] sm:max-w-[120px] mx-auto truncate text-[11px] sm:text-xs text-muted">
                    {data.p1.name}
                  </p>
                </div>

                {/* Center divider */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="h-5 sm:h-8 w-px bg-border" />
                  <div className="text-center">
                    <span className="font-display text-sm sm:text-base font-bold text-dim">
                      VS
                    </span>
                    {h2h && h2h.totalMatches > 0 && (
                      <p className="text-[11px] uppercase tracking-widest text-dim mt-0.5">
                        {h2h.totalMatches} match
                        {h2h.totalMatches !== 1 && "es"}
                      </p>
                    )}
                  </div>
                  <div className="h-5 sm:h-8 w-px bg-border" />
                </div>

                {/* P2 Side */}
                <div className="text-center min-w-0 flex-1">
                  {data.p2.picture ? (
                    <img
                      src={data.p2.picture.replace(
                        "c_limit,w_1280",
                        "c_fill,w_56,h_56",
                      )}
                      className="mx-auto mb-2 h-11 w-11 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-teal/30"
                      alt=""
                    />
                  ) : (
                    <div className="mx-auto mb-2 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-teal/10 font-display text-base sm:text-lg font-bold text-teal">
                      {data.p2.name.charAt(0)}
                    </div>
                  )}
                  <p className="stat-number text-3xl sm:text-4xl md:text-5xl font-bold text-teal">
                    {h2h && h2h.totalMatches > 0
                      ? h2h.p2Wins
                      : data.score.p2}
                  </p>
                  <p className="mt-1 max-w-[90px] sm:max-w-[120px] mx-auto truncate text-[11px] sm:text-xs text-muted">
                    {data.p2.name}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] uppercase tracking-widest text-dim">
                {h2h && h2h.totalMatches > 0
                  ? "Head-to-head wins"
                  : "Categories won"}
              </p>

              {/* Quick partner stats */}
              {partners && partners.totalMatches > 0 && (
                <div className="mt-5 border-t border-border pt-4 text-center">
                  <p className="text-sm text-muted">
                    As partners:{" "}
                    <strong className="text-foreground">
                      {partners.wins}W - {partners.losses}L
                    </strong>{" "}
                    in {partners.totalMatches} match
                    {partners.totalMatches !== 1 && "es"}
                  </p>
                </div>
              )}
            </div>

            {/* ── Tab Bar (underline style) ────────────────────── */}
            <div className="flex border-b border-border min-w-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`min-h-[44px] px-4 sm:px-5 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? "text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <span className="ml-1.5 text-dim">({tab.count})</span>
                  )}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab: Rivalry (Match History) ─────────────────── */}
            {activeTab === "rivals" && (
              <div>
                {h2h && h2h.totalMatches > 0 ? (
                  <>
                    {/* Win rate bar */}
                    <div className="mb-8 min-w-0">
                      <div className="flex items-center gap-3 mb-2 min-w-0">
                        <span className="text-xs font-semibold text-accent shrink-0">
                          {h2h.p1Wins}W
                        </span>
                        <div className="flex-1 min-w-0 flex h-2.5 rounded-full overflow-hidden bg-surface">
                          <div
                            className="bg-accent transition-all duration-700"
                            style={{
                              width: `${(h2h.p1Wins / h2h.totalMatches) * 100}%`,
                            }}
                          />
                          <div
                            className="bg-teal transition-all duration-700"
                            style={{
                              width: `${(h2h.p2Wins / h2h.totalMatches) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-teal shrink-0">
                          {h2h.p2Wins}W
                        </span>
                      </div>
                    </div>

                    {/* Match history table */}
                    <h2 className="section-label mb-4">Match History</h2>

                    <div className="overflow-x-auto min-w-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-wider text-dim">
                              Date
                            </th>
                            <th className="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-wider text-dim">
                              Score
                            </th>
                            <th className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-dim text-right">
                              Winner
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {h2h.matchHistory.map((m, i) => (
                            <tr
                              key={m.matchId}
                              className={`border-l-2 ${
                                m.winner === "p1"
                                  ? "border-l-accent"
                                  : "border-l-teal"
                              } ${
                                i % 2 === 0 ? "bg-transparent" : "bg-surface/50"
                              }`}
                            >
                              <td className="py-3 pl-3 pr-4">
                                <p className="text-sm text-foreground">
                                  {formatDate(m.date)}
                                </p>
                                <p className="text-[11px] text-dim truncate max-w-[140px]">
                                  {m.club}
                                </p>
                              </td>
                              <td className="py-3 pr-4">
                                {formatSets(m.sets, m.winner)}
                              </td>
                              <td className="py-3 pr-3 text-right">
                                <span
                                  className={`text-sm font-semibold ${
                                    m.winner === "p1"
                                      ? "text-accent"
                                      : "text-teal"
                                  }`}
                                >
                                  {m.winner === "p1"
                                    ? data.p1.name.split(" ")[0]
                                    : data.p2.name.split(" ")[0]}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="card mx-auto max-w-md p-8 text-center">
                    <p className="font-display text-lg font-semibold text-foreground">
                      No rivalry found
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      These players have never been on opposite teams in our
                      records. Check the &ldquo;As Partners&rdquo; or
                      &ldquo;Stats&rdquo; tabs.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: As Partners ─────────────────────────────── */}
            {activeTab === "partners" && (
              <div>
                {partners && partners.totalMatches > 0 ? (
                  <div className="space-y-4">
                    <div className="card p-5 sm:p-8 text-center">
                      <p className="section-label mb-4">Record as a team</p>
                      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
                        <div>
                          <p className="stat-number text-3xl sm:text-4xl font-bold text-win">
                            {partners.wins}
                          </p>
                          <p className="text-[11px] uppercase tracking-wider text-muted mt-1">
                            Wins
                          </p>
                        </div>
                        <div className="hidden sm:block h-10 w-px bg-border" />
                        <div>
                          <p className="stat-number text-3xl sm:text-4xl font-bold text-loss">
                            {partners.losses}
                          </p>
                          <p className="text-[11px] uppercase tracking-wider text-muted mt-1">
                            Losses
                          </p>
                        </div>
                        <div className="hidden sm:block h-10 w-px bg-border" />
                        <div>
                          <p className="stat-number text-3xl sm:text-4xl font-bold text-foreground">
                            {partners.totalMatches > 0
                              ? Math.round(
                                  (partners.wins / partners.totalMatches) * 100,
                                )
                              : 0}
                            %
                          </p>
                          <p className="text-[11px] uppercase tracking-wider text-muted mt-1">
                            Win rate
                          </p>
                        </div>
                      </div>
                      <p className="mt-5 text-xs text-muted">
                        {partners.totalMatches} match
                        {partners.totalMatches !== 1 && "es"} together
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="card mx-auto max-w-md p-8 text-center">
                    <p className="font-display text-lg font-semibold text-foreground">
                      Never partnered up
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      These players have never been on the same team in our
                      records.
                    </p>
                  </div>
                )}

                {data.directConnection && (
                  <div className="mt-4 card p-4 text-center text-sm text-muted">
                    Total interactions:{" "}
                    <strong className="text-foreground">
                      {data.directConnection.weight}
                    </strong>{" "}
                    matches ({data.directConnection.relationship})
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Stats (Tale of the Tape) ───────────────── */}
            {activeTab === "stats" && (
              <div>
                <h2 className="section-label mb-5">Tale of the Tape</h2>

                <div className="space-y-0 min-w-0">
                  {data.comparisons.map((c, i) => {
                    const bothNull = c.p1 == null && c.p2 == null;
                    const total =
                      c.p1 != null && c.p2 != null ? c.p1 + c.p2 : 0;
                    const p1Pct =
                      total > 0 ? (c.p1! / total) * 100 : 50;
                    const p2Pct =
                      total > 0 ? (c.p2! / total) * 100 : 50;

                    return (
                      <div
                        key={c.label}
                        className={`flex items-center gap-2 sm:gap-3 px-3 py-3 sm:px-5 sm:py-3.5 min-w-0 ${
                          i % 2 === 0 ? "bg-transparent" : "bg-surface/50"
                        }`}
                      >
                        {/* P1 Value */}
                        <div className="w-14 sm:w-20 shrink-0 text-right min-w-0">
                          <span
                            className={`stat-number text-sm font-bold block truncate ${
                              c.winner === "p1"
                                ? "text-accent"
                                : "text-foreground/50"
                            }`}
                          >
                            {formatValue(c.p1, c.format)}
                          </span>
                        </div>

                        {/* Bar */}
                        <div className="flex-1 min-w-0 px-2 sm:px-4">
                          <div className="mb-1 flex gap-0.5">
                            {bothNull ? (
                              <div className="h-2 w-full rounded-full bg-surface" />
                            ) : (
                              <>
                                <div className="flex flex-1 justify-end min-w-0">
                                  <div
                                    className={`h-2 rounded-l-full transition-all duration-500 ${
                                      c.winner === "p1"
                                        ? "bg-accent"
                                        : "bg-accent/25"
                                    }`}
                                    style={{ width: `${p1Pct}%` }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div
                                    className={`h-2 rounded-r-full transition-all duration-500 ${
                                      c.winner === "p2"
                                        ? "bg-teal"
                                        : "bg-teal/25"
                                    }`}
                                    style={{ width: `${p2Pct}%` }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                          <p className="text-center text-[11px] font-medium uppercase tracking-wider text-dim truncate">
                            {c.label}
                          </p>
                        </div>

                        {/* P2 Value */}
                        <div className="w-14 sm:w-20 shrink-0 min-w-0">
                          <span
                            className={`stat-number text-sm font-bold block truncate ${
                              c.winner === "p2"
                                ? "text-teal"
                                : "text-foreground/50"
                            }`}
                          >
                            {formatValue(c.p2, c.format)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Shared Clubs ──────────────────────────────────── */}
            {data.sharedClubs.length > 0 && (
              <div>
                <h2 className="section-label mb-3">
                  Shared Clubs ({data.sharedClubs.length})
                </h2>
                <div className="card p-4 sm:p-5">
                  <div className="flex flex-wrap gap-2">
                    {data.sharedClubs.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-teal/10 px-3 py-1.5 text-[11px] sm:text-xs font-medium text-teal"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Mutual Connections ───────────────────────────── */}
            {data.mutualConnections.length > 0 && (
              <div>
                <h2 className="section-label mb-3">
                  Mutual Connections ({data.mutualCount})
                </h2>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {data.mutualConnections.map((m) => (
                    <a
                      key={m.id}
                      href={`/player/${m.id}`}
                      className="card flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:border-border-hover"
                    >
                      {m.picture ? (
                        <img
                          src={m.picture.replace(
                            "c_limit,w_1280",
                            "c_fill,w_28,h_28",
                          )}
                          className="h-7 w-7 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-[11px] font-bold text-muted">
                          {m.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-[11px] sm:text-xs font-medium text-foreground">
                          {m.name}
                        </p>
                        <p className="text-[11px] text-muted">
                          Lvl {m.level?.toFixed(1) ?? "?"}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Empty State ─────────────────────────────────────── */}
        {!p1 && !p2 && !loading && (
          <div className="card mx-auto max-w-md p-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <svg
                className="h-8 w-8 text-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0M12 14.25v3m-3-1.5h6"
                />
              </svg>
            </div>
            <p className="font-display text-lg font-semibold text-foreground">
              Pick your matchup
            </p>
            <p className="mt-2 text-sm text-muted">
              Search for two players above to see their real head-to-head
              record, set scores, and rivalry history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
