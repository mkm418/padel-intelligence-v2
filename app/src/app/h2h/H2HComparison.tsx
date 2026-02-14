"use client";

/**
 * Head-to-Head Comparison — "Tale of the Tape" for two padel players.
 * Search two players, see stat-by-stat comparison, mutual connections, shared clubs.
 */

import { useState, useEffect, useCallback, useRef } from "react";

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

interface H2HData {
  p1: { id: string; name: string; level: number | null; picture: string | null; clubs: string[] };
  p2: { id: string; name: string; level: number | null; picture: string | null; clubs: string[] };
  directConnection: { weight: number; relationship: string; lastPlayed: string } | null;
  comparisons: Comparison[];
  score: { p1: number; p2: number };
  mutualConnections: MutualPlayer[];
  mutualCount: number;
  sharedClubs: string[];
  p1TotalConnections: number;
  p2TotalConnections: number;
}

// ── Player Search Input ──────────────────────────────────────────────────

function PlayerSearch({
  label,
  onSelect,
  selected,
}: {
  label: string;
  onSelect: (p: SearchResult) => void;
  selected: SearchResult | null;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetch(`/api/players/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => { setResults(d.results ?? []); setOpen(true); });
    }, 250);
    return () => clearTimeout(timeoutRef.current);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-4">
        {selected.picture ? (
          <img
            src={selected.picture.replace("c_limit,w_1280", "c_fill,w_40,h_40")}
            className="h-10 w-10 rounded-full object-cover"
            alt=""
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
            {selected.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{selected.name}</p>
          <p className="text-xs text-white/40">
            Level {selected.level?.toFixed(2) ?? "?"} · {selected.matches} matches
          </p>
        </div>
        <button
          onClick={() => onSelect(null as unknown as SearchResult)}
          className="text-white/30 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search player name..."
        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-cyan-500/50 transition-colors placeholder:text-white/20"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl max-h-64 overflow-auto">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => { onSelect(r); setOpen(false); setQuery(""); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
            >
              {r.picture ? (
                <img
                  src={r.picture.replace("c_limit,w_1280", "c_fill,w_28,h_28")}
                  className="h-7 w-7 rounded-full object-cover"
                  alt=""
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                  {r.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-[10px] text-white/40">
                  Lvl {r.level?.toFixed(2) ?? "?"} · {r.matches} matches{r.winRate != null ? ` · ${r.winRate}% WR` : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export default function H2HComparison() {
  const [p1, setP1] = useState<SearchResult | null>(null);
  const [p2, setP2] = useState<SearchResult | null>(null);
  const [data, setData] = useState<H2HData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchH2H = useCallback(async () => {
    if (!p1 || !p2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/h2h?p1=${p1.id}&p2=${p2.id}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setData(d);
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

  function formatValue(val: number | null, format: string): string {
    if (val == null) return "—";
    if (format === "percent") return `${Math.round(val * 100)}%`;
    return val.toLocaleString();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-lg">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">
              Padel Passport
            </a>
            <span className="text-white/20">/</span>
            <span className="text-sm font-semibold">Head-to-Head</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/network" className="text-xs text-white/40 hover:text-cyan-400 transition-colors">Network</a>
            <a href="/rankings" className="text-xs text-white/40 hover:text-cyan-400 transition-colors">Rankings</a>
            <a href="/chat" className="text-xs text-white/40 hover:text-cyan-400 transition-colors">Coach AI</a>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-5 pt-20 pb-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Head-to-Head</h1>
        <p className="text-white/40 text-sm mb-8">Compare any two players side-by-side</p>

        {/* Player selectors */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <PlayerSearch label="Player 1" selected={p1} onSelect={(r) => setP1(r ?? null)} />
          <PlayerSearch label="Player 2" selected={p2} onSelect={(r) => setP2(r ?? null)} />
        </div>

        {loading && (
          <div className="text-center py-16 text-white/40 animate-pulse">Loading comparison...</div>
        )}

        {data && !loading && (
          <div className="space-y-8">
            {/* Score banner */}
            <div className="rounded-2xl bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 border border-white/10 p-6 text-center">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-4xl font-bold text-cyan-400">{data.score.p1}</p>
                  <p className="text-xs text-white/40 mt-1 truncate max-w-[120px]">{data.p1.name}</p>
                </div>
                <div className="text-2xl font-bold text-white/20">VS</div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-400">{data.score.p2}</p>
                  <p className="text-xs text-white/40 mt-1 truncate max-w-[120px]">{data.p2.name}</p>
                </div>
              </div>
              <p className="text-[10px] text-white/30 mt-2">Categories won</p>

              {data.directConnection && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/60">
                    Played together <strong className="text-white">{data.directConnection.weight}</strong> times
                    <span className="text-white/30"> · {data.directConnection.relationship}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Stat comparisons */}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              {data.comparisons.map((c, i) => (
                <div
                  key={c.label}
                  className={`flex items-center px-5 py-3 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                >
                  <div className="w-24 text-right">
                    <span
                      className={`text-sm font-bold tabular-nums ${c.winner === "p1" ? "text-cyan-400" : "text-white/60"}`}
                    >
                      {formatValue(c.p1, c.format)}
                    </span>
                  </div>

                  <div className="flex-1 px-4">
                    {/* Bar visualization */}
                    <div className="flex items-center gap-1 mb-0.5">
                      <div className="flex-1 flex justify-end">
                        <div
                          className="h-1.5 rounded-l-full bg-cyan-400/60"
                          style={{
                            width: c.p1 != null && c.p2 != null && (c.p1 + c.p2) > 0
                              ? `${(c.p1 / (c.p1 + c.p2)) * 100}%`
                              : "50%",
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div
                          className="h-1.5 rounded-r-full bg-purple-400/60"
                          style={{
                            width: c.p1 != null && c.p2 != null && (c.p1 + c.p2) > 0
                              ? `${(c.p2 / (c.p1 + c.p2)) * 100}%`
                              : "50%",
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-white/40 text-center uppercase tracking-wider">
                      {c.label}
                    </p>
                  </div>

                  <div className="w-24">
                    <span
                      className={`text-sm font-bold tabular-nums ${c.winner === "p2" ? "text-purple-400" : "text-white/60"}`}
                    >
                      {formatValue(c.p2, c.format)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Shared clubs */}
            {data.sharedClubs.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                  Shared Clubs ({data.sharedClubs.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.sharedClubs.map((c) => (
                    <span key={c} className="rounded-full bg-emerald-500/10 text-emerald-400 px-3 py-1 text-xs">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mutual connections */}
            {data.mutualConnections.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                  Mutual Connections ({data.mutualCount})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {data.mutualConnections.map((m) => (
                    <a
                      key={m.id}
                      href={`/player/${m.id}`}
                      className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors"
                    >
                      {m.picture ? (
                        <img
                          src={m.picture.replace("c_limit,w_1280", "c_fill,w_24,h_24")}
                          className="h-6 w-6 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold">
                          {m.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium truncate">{m.name}</p>
                        <p className="text-[9px] text-white/40">
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

        {!p1 && !p2 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">⚔️</p>
            <p className="text-white/40">Search for two players above to compare them</p>
          </div>
        )}
      </div>
    </div>
  );
}
