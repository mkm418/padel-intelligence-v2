"use client";

/**
 * Power Rankings — ELO-style leaderboard with streaks, level brackets, categories.
 */

import { useState, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────────────

interface Streak {
  type: "hot" | "cold" | "new" | "steady";
  label: string;
  color: string;
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
  winRate: number | null;
  clubs: string[];
  lastMatch: string;
  powerScore: number;
  streak: Streak;
  uniqueOpponents: number;
  competitiveMatches: number;
}

interface RankingsData {
  rankings: RankedPlayer[];
  totalRanked: number;
  categories: {
    hotPlayers: RankedPlayer[];
    risingStars: RankedPlayer[];
    mostImproved: RankedPlayer[];
  };
  brackets: Record<string, RankedPlayer[]>;
  clubs: string[];
}

type Tab = "overall" | "hot" | "rising" | "brackets";

// ── Level color ──────────────────────────────────────────────────────────

function levelColor(level: number | null): string {
  if (level == null) return "#6b7280";
  if (level >= 6) return "#06b6d4";
  if (level >= 5) return "#8b5cf6";
  if (level >= 4) return "#eab308";
  if (level >= 3) return "#22c55e";
  if (level >= 2) return "#3b82f6";
  return "#94a3b8";
}

// ── Component ────────────────────────────────────────────────────────────

export default function PowerRankings() {
  const [data, setData] = useState<RankingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overall");
  const [club, setClub] = useState("");
  const [levelRange, setLevelRange] = useState<[number, number]>([0, 8]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      minMatches: "10",
      minLevel: String(levelRange[0]),
      maxLevel: String(levelRange[1]),
    });
    if (club) params.set("club", club);

    fetch(`/api/rankings?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [club, levelRange]);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "overall", label: "Overall", icon: "🏆" },
    { id: "hot", label: "On Fire", icon: "🔥" },
    { id: "rising", label: "Rising Stars", icon: "⭐" },
    { id: "brackets", label: "By Level", icon: "📊" },
  ];

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
            <span className="text-sm font-semibold">Power Rankings</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/network" className="text-xs text-white/40 hover:text-cyan-400 transition-colors">Network</a>
            <a href="/h2h" className="text-xs text-white/40 hover:text-cyan-400 transition-colors">H2H</a>
            <a href="/chat" className="text-xs text-white/40 hover:text-cyan-400 transition-colors">Coach AI</a>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-5 pt-20 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Power Rankings</h1>
            <p className="text-white/40 text-sm mt-1">
              {data ? `${data.totalRanked.toLocaleString()} players ranked` : "Loading..."}
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            {data && data.clubs.length > 0 && (
              <select
                value={club}
                onChange={(e) => setClub(e.target.value)}
                className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs outline-none"
              >
                <option value="">All clubs</option>
                {data.clubs.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/40">Lvl</span>
              <input
                type="number"
                min={0}
                max={8}
                step={0.5}
                value={levelRange[0]}
                onChange={(e) => setLevelRange([parseFloat(e.target.value), levelRange[1]])}
                className="w-12 rounded bg-white/5 border border-white/10 px-2 py-1 text-center outline-none"
              />
              <span className="text-white/20">-</span>
              <input
                type="number"
                min={0}
                max={8}
                step={0.5}
                value={levelRange[1]}
                onChange={(e) => setLevelRange([levelRange[0], parseFloat(e.target.value)])}
                className="w-12 rounded bg-white/5 border border-white/10 px-2 py-1 text-center outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 rounded-xl bg-white/5 p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === t.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="py-20 text-center text-white/40 animate-pulse">
            Computing power rankings...
          </div>
        )}

        {data && !loading && (
          <>
            {/* Overall rankings */}
            {tab === "overall" && (
              <RankingTable players={data.rankings} showRank />
            )}

            {/* Hot players */}
            {tab === "hot" && (
              <div>
                <p className="text-xs text-white/40 mb-4">
                  Players with 60%+ win rate who played in the last 2 weeks
                </p>
                {data.categories.hotPlayers.length > 0 ? (
                  <RankingTable players={data.categories.hotPlayers} showRank />
                ) : (
                  <p className="text-white/30 py-12 text-center">No hot players with current filters</p>
                )}
              </div>
            )}

            {/* Rising stars */}
            {tab === "rising" && (
              <div>
                <p className="text-xs text-white/40 mb-4">
                  New players who started within the last 30 days
                </p>
                {data.categories.risingStars.length > 0 ? (
                  <RankingTable players={data.categories.risingStars} showRank={false} />
                ) : (
                  <p className="text-white/30 py-12 text-center">No rising stars with current filters</p>
                )}
              </div>
            )}

            {/* Level brackets */}
            {tab === "brackets" && (
              <div className="space-y-8">
                {Object.entries(data.brackets)
                  .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                  .map(([bracket, players]) => (
                    <div key={bracket}>
                      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ background: levelColor(parseFloat(bracket)) }}
                        />
                        Level {bracket}
                        <span className="text-white/30 font-normal text-xs">({players.length} players)</span>
                      </h3>
                      <RankingTable players={players} showRank={false} />
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Ranking Table ────────────────────────────────────────────────────────

function RankingTable({
  players,
  showRank,
}: {
  players: RankedPlayer[];
  showRank: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/30 border-b border-white/5">
        {showRank && <div className="w-10 text-center">#</div>}
        <div className="flex-1">Player</div>
        <div className="w-16 text-center">Power</div>
        <div className="w-14 text-center">Level</div>
        <div className="w-16 text-center">W/L</div>
        <div className="w-14 text-center">WR%</div>
        <div className="w-20 text-center">Status</div>
      </div>

      {players.map((p, i) => (
        <a
          key={p.id}
          href={`/player/${p.id}`}
          className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
            i % 2 === 0 ? "bg-white/[0.01]" : ""
          }`}
        >
          {showRank && (
            <div className="w-10 text-center">
              {p.rank <= 3 ? (
                <span className="text-lg">
                  {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : "🥉"}
                </span>
              ) : (
                <span className="text-sm font-bold text-white/30 tabular-nums">{p.rank}</span>
              )}
            </div>
          )}

          <div className="flex-1 flex items-center gap-3 min-w-0">
            {p.picture ? (
              <img
                src={p.picture.replace("c_limit,w_1280", "c_fill,w_32,h_32")}
                className="h-8 w-8 rounded-full object-cover"
                alt=""
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                {p.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-[10px] text-white/30">{p.matches} matches · {p.clubs.length} clubs</p>
            </div>
          </div>

          <div className="w-16 text-center">
            <span className="text-sm font-bold text-cyan-400 tabular-nums">{p.powerScore}</span>
          </div>

          <div className="w-14 text-center">
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: levelColor(p.level) }}
            >
              {p.level?.toFixed(1) ?? "?"}
            </span>
          </div>

          <div className="w-16 text-center text-xs text-white/60 tabular-nums">
            {p.wins}-{p.losses}
          </div>

          <div className="w-14 text-center text-xs text-white/60 tabular-nums">
            {p.winRate != null ? `${Math.round(p.winRate * 100)}%` : "—"}
          </div>

          <div className="w-20 text-center">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ color: p.streak.color, background: p.streak.color + "15" }}
            >
              {p.streak.label}
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
