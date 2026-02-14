"use client";

/**
 * Player Card — FIFA Ultimate Team-style shareable card.
 * Shows player photo, tier, level, stats, badges, top partners.
 */

import { useState, useEffect, useRef } from "react";

const PLAYTOMIC_PROFILE = "https://app.playtomic.io/user";

// ── Types ────────────────────────────────────────────────────────────────

interface Badge {
  icon: string;
  label: string;
  color: string;
}

interface Partner {
  id: string;
  name: string;
  level: number | null;
  picture: string | null;
  weight: number;
  relationship: string;
}

interface PlayerData {
  player: {
    id: string;
    name: string;
    level: number | null;
    levelConfidence: number | null;
    picture: string | null;
    gender: string;
    position: string | null;
    isPremium: boolean;
    clubs: string[];
    matches: number;
    wins: number;
    losses: number;
    winRate: number | null;
    setsWon: number;
    setsLost: number;
    gamesWon: number;
    gamesLost: number;
    firstMatch: string;
    lastMatch: string;
    uniqueTeammates: number;
    uniqueOpponents: number;
    competitiveMatches: number;
    friendlyMatches: number;
  };
  tier: { tier: string; color: string; gradient: string };
  badges: Badge[];
  topPartners: Partner[];
  percentiles: { matches: number; winRate: number | null };
  totalPlayers: number;
}

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

export default function PlayerCard({ playerId }: { playerId: string }) {
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/player/${playerId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="animate-pulse text-lg">Loading player card...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Player not found</p>
          <a href="/network" className="text-cyan-400 hover:underline text-sm">
            Browse all players
          </a>
        </div>
      </div>
    );
  }

  const { player, tier, badges, topPartners, percentiles } = data;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-lg">
        <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors"
            >
              Padel Passport
            </a>
            <span className="text-white/20">/</span>
            <span className="text-sm font-semibold">Player Card</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/network" className="text-xs text-white/40 hover:text-cyan-400 transition-colors">
              Network
            </a>
            <a href="/rankings" className="text-xs text-white/40 hover:text-cyan-400 transition-colors">
              Rankings
            </a>
            <a href="/h2h" className="text-xs text-white/40 hover:text-cyan-400 transition-colors">
              H2H
            </a>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-5 pt-20 pb-16">
        {/* ── THE CARD ─────────────────────────────────────────────── */}
        <div
          ref={cardRef}
          className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${tier.gradient} p-[2px]`}
        >
          <div className="rounded-[14px] bg-[#0a0a0a]/95 p-6 md:p-8">
            {/* Tier badge */}
            <div className="flex items-center justify-between mb-6">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.3em] px-3 py-1 rounded-full border"
                style={{ color: tier.color, borderColor: tier.color + "40" }}
              >
                {tier.tier}
              </span>
              <span className="text-[10px] text-white/30 uppercase tracking-wider">
                Padel Passport
              </span>
            </div>

            {/* Player header */}
            <div className="flex items-start gap-5 mb-8">
              {player.picture ? (
                <img
                  src={player.picture.replace("c_limit,w_1280", "c_fill,w_96,h_96")}
                  alt={player.name}
                  className="h-24 w-24 rounded-xl object-cover border-2"
                  style={{ borderColor: tier.color }}
                />
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-xl text-3xl font-bold"
                  style={{ background: levelColor(player.level) + "30", color: levelColor(player.level) }}
                >
                  {player.name.charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight truncate">{player.name}</h1>
                <div className="flex items-center gap-3 mt-1.5">
                  {player.level != null && (
                    <span
                      className="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-bold"
                      style={{ background: levelColor(player.level) + "25", color: levelColor(player.level) }}
                    >
                      {player.level.toFixed(2)}
                    </span>
                  )}
                  {player.position && (
                    <span className="text-xs text-white/40 capitalize">{player.position} side</span>
                  )}
                  <a
                    href={`${PLAYTOMIC_PROFILE}/${player.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Playtomic &rarr;
                  </a>
                </div>

                {/* Badges */}
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {badges.map((b) => (
                      <span
                        key={b.label}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border"
                        style={{ color: b.color, borderColor: b.color + "40", background: b.color + "10" }}
                      >
                        {b.icon} {b.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <StatBox label="Matches" value={player.matches} />
              <StatBox
                label="Win Rate"
                value={player.winRate != null ? `${Math.round(player.winRate * 100)}%` : "—"}
              />
              <StatBox label="W / L" value={`${player.wins} / ${player.losses}`} />
              <StatBox label="Clubs" value={player.clubs.length} />
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
              <StatBox label="Sets W/L" value={`${player.setsWon}/${player.setsLost}`} />
              <StatBox label="Games W/L" value={`${player.gamesWon}/${player.gamesLost}`} />
              <StatBox label="Teammates" value={player.uniqueTeammates} />
              <StatBox label="Opponents" value={player.uniqueOpponents} />
            </div>

            {/* Percentile bars */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <PercentileBar label="Match Volume" value={percentiles.matches} />
              {percentiles.winRate != null && (
                <PercentileBar label="Win Rate" value={percentiles.winRate} />
              )}
            </div>

            {/* Top partners */}
            {topPartners.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                  Most Played With
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {topPartners.slice(0, 5).map((p) => (
                    <a
                      key={p.id}
                      href={`/player/${p.id}`}
                      className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors"
                    >
                      {p.picture ? (
                        <img
                          src={p.picture.replace("c_limit,w_1280", "c_fill,w_24,h_24")}
                          className="h-6 w-6 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium truncate">{p.name}</p>
                        <p className="text-[9px] text-white/40">
                          {p.weight} matches · {p.relationship}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-white/30">
              <span>
                Active {player.firstMatch && `since ${new Date(player.firstMatch).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                {player.lastMatch && ` · Last match ${new Date(player.lastMatch).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
              </span>
              <span>{player.competitiveMatches} competitive · {player.friendlyMatches} friendly</span>
            </div>
          </div>
        </div>

        {/* Clubs list below card */}
        {player.clubs.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
              Clubs ({player.clubs.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {player.clubs.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2.5 text-center">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function PercentileBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-bold text-cyan-400">Top {100 - value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
