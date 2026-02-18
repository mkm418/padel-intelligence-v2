"use client";

/**
 * Player Card. Premium sports card / passport page.
 * Shows player photo, tier, level, real stats, badges, top partners,
 * match history, form streak, partner/opponent analytics, club breakdown,
 * and advanced set/game stats.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

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
    wlRecorded: number;
    winRate: number | null;
    winRateMeaningful: boolean;
    firstMatch: string;
    lastMatch: string;
    uniquePartners: number;
  };
  tier: { tier: string; color: string; gradient: string };
  badges: Badge[];
  topPartners: Partner[];
  percentiles: { matches: number; winRate: number | null };
  totalPlayers: number;
}

// ── Match analytics types ───────────────────────────────────────────────

interface MatchEntry {
  matchId: string;
  date: string;
  club: string;
  result: "WON" | "LOST";
  mode: string | null;
  partner: { id: string | null; name: string | null };
  opponents: { id: string; name: string }[];
  setScores: { my: number | null; opp: number | null }[];
}

interface PartnerStat {
  id: string;
  name: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface OpponentStat {
  id: string;
  name: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface ClubStat {
  name: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface MatchAnalytics {
  history: MatchEntry[];
  totalMatches: number;
  form: {
    last10: string[];
    streak: number;
    streakType: "W" | "L" | null;
    rollingWR: number[];
  };
  partners: {
    best: PartnerStat | null;
    worst: PartnerStat | null;
    all: PartnerStat[];
  };
  opponents: {
    nemesis: OpponentStat | null;
    favorite: OpponentStat | null;
  };
  clubs: ClubStat[];
  advanced: {
    setsWon: number;
    setsLost: number;
    gamesWon: number;
    gamesLost: number;
    gamesRatio: number;
    avgGamesPerSet: number;
    threeSetMatches: number;
    threeSetWins: number;
    threeSetWinRate: number | null;
    bagels: number;
    breadsticks: number;
  };
}

// ── Badge color mapping ──────────────────────────────────────────────────

function badgeClasses(color: string): {
  bg: string;
  text: string;
  border: string;
} {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    "#FBBF24": {
      bg: "bg-amber/5",
      text: "text-amber",
      border: "border-amber/30",
    },
    "#2DD4BF": {
      bg: "bg-teal/5",
      text: "text-teal",
      border: "border-teal/30",
    },
    "#FF6B2C": {
      bg: "bg-accent/5",
      text: "text-accent",
      border: "border-accent/30",
    },
    "#EF4444": {
      bg: "bg-loss/5",
      text: "text-loss",
      border: "border-loss/30",
    },
  };
  return map[color] ?? {
    bg: "bg-accent/5",
    text: "text-accent",
    border: "border-accent/30",
  };
}

// ── Level color ──────────────────────────────────────────────────────────

function levelColor(level: number | null): string {
  if (level == null) return "var(--muted)";
  if (level >= 6) return "var(--teal)";
  if (level >= 5) return "#8b5cf6";
  if (level >= 4) return "var(--amber)";
  if (level >= 3) return "#22c55e";
  if (level >= 2) return "#3b82f6";
  return "var(--muted)";
}

// ── Tier color mapping to tailwind classes ────────────────────────────────

function tierClasses(color: string): {
  text: string;
  border: string;
  bg: string;
} {
  // Map hex tier colors to nearest design-token classes
  const c = color.toUpperCase();
  if (c.includes("2DD4") || c.includes("14B8"))
    return { text: "text-teal", border: "border-teal/30", bg: "bg-teal/5" };
  if (c.includes("8B5C") || c.includes("A78B"))
    return {
      text: "text-[#8b5cf6]",
      border: "border-[#8b5cf6]/30",
      bg: "bg-[#8b5cf6]/5",
    };
  if (c.includes("FBB") || c.includes("F5A"))
    return { text: "text-amber", border: "border-amber/30", bg: "bg-amber/5" };
  if (c.includes("22C5") || c.includes("4ADE"))
    return {
      text: "text-win",
      border: "border-win/30",
      bg: "bg-win/5",
    };
  if (c.includes("3B82") || c.includes("60A5"))
    return {
      text: "text-[#3b82f6]",
      border: "border-[#3b82f6]/30",
      bg: "bg-[#3b82f6]/5",
    };
  // Default: accent
  return {
    text: "text-accent",
    border: "border-accent/30",
    bg: "bg-accent/5",
  };
}

// ── Loading Skeleton ─────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="page-container pt-20 pb-16">
        <div className="card p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="h-6 w-24 animate-pulse rounded-full bg-surface" />
            <div className="h-4 w-32 animate-pulse rounded bg-surface" />
          </div>
          <div className="flex items-start gap-5 mb-8">
            <div className="h-24 w-24 animate-pulse rounded-xl bg-surface" />
            <div className="flex-1 space-y-3">
              <div className="h-7 w-48 animate-pulse rounded bg-surface" />
              <div className="flex gap-2">
                <div className="h-7 w-16 animate-pulse rounded-lg bg-surface" />
                <div className="h-7 w-20 animate-pulse rounded-lg bg-surface" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-surface"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────

export default function PlayerCard({ playerId }: { playerId: string }) {
  const [data, setData] = useState<PlayerData | null>(null);
  const [analytics, setAnalytics] = useState<MatchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch player data and match analytics in parallel
    Promise.all([
      fetch(`/api/player/${playerId}`).then((r) => r.json()),
      fetch(`/api/player/${playerId}/matches`).then((r) => r.json()),
    ])
      .then(([playerData, matchData]) => {
        if (playerData.error) throw new Error(playerData.error);
        setData(playerData);
        if (!matchData.error) setAnalytics(matchData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="card max-w-sm p-8 text-center">
            <p className="font-display text-lg font-semibold text-loss">
              Player not found
            </p>
            <p className="mt-2 text-sm text-muted">
              This player may not exist or data is unavailable.
            </p>
            <a
              href="/network"
              className="btn-primary mt-5 inline-block text-sm"
            >
              Browse all players
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { player, tier, badges, topPartners, percentiles } = data;
  const tc = tierClasses(tier.color);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="page-container pt-20 pb-16">
        {/* ── THE CARD */}
        <div ref={cardRef} className="card overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* ── Tier badge + share button */}
            <div className="mb-6 flex items-center justify-between">
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] font-display ${tc.text} ${tc.border} ${tc.bg}`}
              >
                {tier.tier}
              </span>
              <ShareButton playerName={player.name} playerId={player.id} />
            </div>

            {/* ── Player Header */}
            <div className="flex items-start gap-5 mb-8">
              <div className="relative shrink-0">
                {player.picture ? (
                  <img
                    src={player.picture.replace(
                      "c_limit,w_1280",
                      "c_fill,w_96,h_96"
                    )}
                    alt={player.name}
                    className="h-24 w-24 rounded-xl object-cover border-2 border-border"
                  />
                ) : (
                  <div
                    className="flex h-24 w-24 items-center justify-center rounded-xl font-display text-3xl font-bold border-2 border-border"
                    style={{
                      background: levelColor(player.level) + "15",
                      color: levelColor(player.level),
                    }}
                  >
                    {player.name.charAt(0)}
                  </div>
                )}
                {player.level != null && (
                  <div
                    className="absolute -bottom-2 -right-2 rounded-lg px-2 py-0.5 text-xs font-bold font-display ring-2 ring-background"
                    style={{
                      background: levelColor(player.level),
                      color: "#1a1a1a",
                    }}
                  >
                    {player.level.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground truncate sm:text-3xl">
                  {player.name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {player.position && (
                    <span className="rounded-lg bg-surface border border-border px-2.5 py-1 text-xs font-medium text-muted capitalize">
                      {player.position} side
                    </span>
                  )}
                  {player.isPremium && (
                    <span className="rounded-lg bg-amber/5 border border-amber/30 px-2.5 py-1 text-xs font-medium text-amber">
                      Premium
                    </span>
                  )}
                  <a
                    href={`${PLAYTOMIC_PROFILE}/${player.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-surface border border-border px-2.5 py-1 text-xs font-medium text-accent hover:border-border-hover transition-colors"
                  >
                    Playtomic &rarr;
                  </a>
                </div>

                {badges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {badges.map((b) => {
                      const cls = badgeClasses(b.color);
                      return (
                        <span
                          key={b.label}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls.bg} ${cls.text} ${cls.border}`}
                        >
                          {b.icon} {b.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Stats Grid: 2x3 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <StatBox label="Matches" value={player.matches} />
              <StatBox
                label="Level"
                value={player.level?.toFixed(2) ?? "-"}
              />
              <StatBox label="Clubs" value={player.clubs.length} />
            </div>

            {/* W/L row: only if meaningful */}
            {player.winRate != null && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <StatBox
                  label="Win Rate"
                  value={`${Math.round(player.winRate * 100)}%`}
                  highlight={player.winRate >= 0.6}
                />
                <StatBox
                  label="W / L"
                  value={`${player.wins} / ${player.losses}`}
                />
                <StatBox
                  label="Results Tracked"
                  value={`${player.wlRecorded} of ${player.matches}`}
                />
              </div>
            )}

            {/* If no meaningful W/L, show a single note */}
            {player.winRate == null && player.wlRecorded > 0 && (
              <div className="rounded-lg bg-surface border border-border px-4 py-2.5 mb-4 text-center">
                <p className="text-[11px] text-muted">
                  {player.wlRecorded} W/L results tracked (too few to show win
                  rate reliably)
                </p>
              </div>
            )}

            {/* Partners count */}
            {player.uniquePartners > 0 && (
              <div className="grid grid-cols-1 gap-3 mb-6">
                <StatBox
                  label="Unique Partners"
                  value={player.uniquePartners}
                />
              </div>
            )}

            {/* ── Percentile Bars */}
            <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
              <PercentileBar label="Match Volume" value={percentiles.matches} />
              {percentiles.winRate != null && (
                <PercentileBar label="Win Rate" value={percentiles.winRate} />
              )}
            </div>

            {/* ── Top Partners */}
            {topPartners.length > 0 && (
              <div>
                <h3 className="section-label mb-3">Most Played With</h3>
                <div className="card-flush p-1">
                  <div className="divide-y divide-border">
                    {topPartners.slice(0, 5).map((p) => (
                      <a
                        key={p.id}
                        href={`/player/${p.id}`}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        {p.picture ? (
                          <img
                            src={p.picture.replace(
                              "c_limit,w_1280",
                              "c_fill,w_28,h_28"
                            )}
                            className="h-7 w-7 rounded-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-raised text-[9px] font-bold text-muted">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium text-foreground">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-muted">
                            {p.weight} matches &middot; {p.relationship}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-dim">
              <span>
                Active
                {player.firstMatch &&
                  ` since ${new Date(player.firstMatch).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                {player.lastMatch &&
                  `, last played ${new Date(player.lastMatch).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
              </span>
            </div>
          </div>
        </div>

        {/* ── ANALYTICS SECTIONS ────────────────────────────────────── */}
        {analytics && (
          <>
            {/* ── 1. Form Streak ──────────────────────────────────────── */}
            {analytics.form.last10.length > 0 && (
              <FormStreak form={analytics.form} />
            )}

            {/* ── 2. Match History Feed ───────────────────────────────── */}
            {analytics.history.length > 0 && (
              <MatchHistory matches={analytics.history} />
            )}

            {/* ── 3. Best/Worst Partner + Nemesis ─────────────────────── */}
            <PartnerAnalysis
              partners={analytics.partners}
              opponents={analytics.opponents}
            />

            {/* ── 4. Club Breakdown ───────────────────────────────────── */}
            {analytics.clubs.length > 0 && (
              <ClubBreakdown clubs={analytics.clubs} />
            )}

            {/* ── 5. Advanced Set/Game Stats ──────────────────────────── */}
            <AdvancedStats stats={analytics.advanced} />
          </>
        )}

        {/* ── Claim Your Profile CTA */}
        <ClaimProfile playerId={player.id} playerName={player.name} />
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-surface rounded-lg p-4 text-center">
      <p
        className={`stat-number text-xl font-bold ${highlight ? "text-accent" : "text-foreground"}`}
      >
        {value}
      </p>
      <p className="section-label mt-1">{label}</p>
    </div>
  );
}

function PercentileBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface rounded-lg px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="section-label">{label}</span>
        <span className="stat-number text-xs font-bold text-accent">
          Top {100 - value}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-raised">
        <div
          className="h-full rounded-full bg-accent transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── 1. Form Streak Section ──────────────────────────────────────────────

function FormStreak({
  form,
}: {
  form: MatchAnalytics["form"];
}) {
  const { last10, streak, streakType, rollingWR } = form;

  return (
    <div className="mt-8 card p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-label">Current Form</h3>
        {streak > 0 && streakType && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              streakType === "W"
                ? "bg-win/10 text-win"
                : "bg-loss/10 text-loss"
            }`}
          >
            {streak}{streakType === "W" ? " Win" : " Loss"} Streak
          </span>
        )}
      </div>

      {/* Last 10 result dots */}
      <div className="flex items-center gap-1.5 mb-4">
        {last10.map((r, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                r === "WON"
                  ? "bg-win/15 text-win"
                  : "bg-loss/15 text-loss"
              }`}
            >
              {r === "WON" ? "W" : "L"}
            </div>
          </div>
        ))}
        {last10.length === 0 && (
          <span className="text-xs text-dim">No recent results</span>
        )}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-win inline-block" /> Win
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-loss inline-block" /> Loss
        </span>
        <span className="ml-auto text-dim">Last 10 matches (newest first)</span>
      </div>

      {/* Rolling win rate sparkline */}
      {rollingWR.length >= 3 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="section-label">Win Rate Trend</span>
            <span className="text-[11px] text-dim">10-match rolling</span>
          </div>
          <MiniSparkline data={rollingWR} />
        </div>
      )}
    </div>
  );
}

// ── Mini Sparkline (SVG) ────────────────────────────────────────────────

function MiniSparkline({ data }: { data: number[] }) {
  const w = 300;
  const h = 48;
  const padding = 2;

  if (data.length < 2) return null;

  const xStep = (w - padding * 2) / (data.length - 1);
  const minY = 0;
  const maxY = 1;

  const points = data.map((val, i) => {
    const x = padding + i * xStep;
    const y = h - padding - ((val - minY) / (maxY - minY)) * (h - padding * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

  // 50% line
  const midY = h - padding - (0.5 / (maxY - minY)) * (h - padding * 2);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
      {/* 50% reference line */}
      <line
        x1={padding}
        y1={midY}
        x2={w - padding}
        y2={midY}
        stroke="var(--muted)"
        strokeWidth="0.5"
        strokeDasharray="4 3"
        opacity="0.4"
      />
      {/* Area fill */}
      <path d={areaPath} fill="var(--accent)" opacity="0.08" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Current point */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3.5" fill="var(--accent)" />
    </svg>
  );
}

// ── 2. Match History Feed ───────────────────────────────────────────────

function MatchHistory({ matches }: { matches: MatchEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? matches : matches.slice(0, 5);

  return (
    <div className="mt-8 card p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-label">Match History</h3>
        <span className="text-[11px] text-dim">Last {matches.length} matches</span>
      </div>

      <div className="space-y-2">
        {visible.map((m) => (
          <div
            key={m.matchId}
            className={`rounded-lg border p-3 transition-colors ${
              m.result === "WON"
                ? "border-win/20 bg-win/[0.03]"
                : "border-loss/20 bg-loss/[0.03]"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Result badge */}
              <span
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                  m.result === "WON"
                    ? "bg-win/15 text-win"
                    : "bg-loss/15 text-loss"
                }`}
              >
                {m.result === "WON" ? "W" : "L"}
              </span>

              {/* Match details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs">
                  {/* Set scores */}
                  <div className="flex gap-1 font-mono font-bold text-foreground">
                    {m.setScores.length > 0 ? (
                      m.setScores.map((s, i) => (
                        <span key={i} className={`${
                          s.my != null && s.opp != null && s.my > s.opp
                            ? "text-win"
                            : s.my != null && s.opp != null && s.my < s.opp
                              ? "text-loss"
                              : ""
                        }`}>
                          {s.my ?? "?"}-{s.opp ?? "?"}
                          {i < m.setScores.length - 1 && (
                            <span className="text-muted mx-0.5">/</span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">No scores</span>
                    )}
                  </div>
                </div>

                {/* Partner + opponents */}
                <div className="mt-1 text-[11px] text-muted truncate">
                  {m.partner.name && (
                    <>
                      w/ <span className="text-foreground/70">{m.partner.name}</span>
                    </>
                  )}
                  {m.opponents.length > 0 && (
                    <>
                      {" vs "}
                      <span className="text-foreground/70">
                        {m.opponents.map((o) => o.name).join(" & ")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Date + club */}
              <div className="text-right shrink-0">
                <div className="text-[11px] text-foreground/60">
                  {new Date(m.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="text-[10px] text-dim truncate max-w-[100px]">
                  {m.club}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {matches.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full rounded-lg bg-surface border border-border py-2.5 text-xs font-medium text-muted hover:text-foreground hover:border-border-hover transition-colors"
        >
          {expanded ? "Show less" : `Show all ${matches.length} matches`}
        </button>
      )}
    </div>
  );
}

// ── 3. Partner + Opponent Analysis ──────────────────────────────────────

function PartnerAnalysis({
  partners,
  opponents,
}: {
  partners: MatchAnalytics["partners"];
  opponents: MatchAnalytics["opponents"];
}) {
  const { best, worst, all } = partners;
  const { nemesis, favorite } = opponents;
  const [showAllPartners, setShowAllPartners] = useState(false);

  // Only show if we have data
  const hasData = best || worst || nemesis || favorite || all.length > 0;
  if (!hasData) return null;

  return (
    <div className="mt-8 card p-6 sm:p-8">
      <h3 className="section-label mb-4">Partner & Rival Intelligence</h3>

      {/* Highlight cards row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {best && (
          <HighlightCard
            emoji="🏆"
            title="Best Partner"
            name={best.name}
            stat={`${Math.round(best.winRate * 100)}% WR`}
            sub={`${best.matches} matches`}
            color="win"
            href={`/player/${best.id}`}
          />
        )}
        {worst && (
          <HighlightCard
            emoji="📉"
            title="Worst Partner"
            name={worst.name}
            stat={`${Math.round(worst.winRate * 100)}% WR`}
            sub={`${worst.matches} matches`}
            color="loss"
            href={`/player/${worst.id}`}
          />
        )}
        {nemesis && (
          <HighlightCard
            emoji="😈"
            title="Nemesis"
            name={nemesis.name}
            stat={`${nemesis.losses}L / ${nemesis.wins}W`}
            sub={`${nemesis.matches} meetings`}
            color="loss"
            href={`/player/${nemesis.id}`}
          />
        )}
        {favorite && (
          <HighlightCard
            emoji="🎯"
            title="Favorite Rival"
            name={favorite.name}
            stat={`${favorite.wins}W / ${favorite.losses}L`}
            sub={`${favorite.matches} meetings`}
            color="win"
            href={`/player/${favorite.id}`}
          />
        )}
      </div>

      {/* All partners table */}
      {all.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-dim font-medium uppercase tracking-wider">
              Partner Win Rates
            </span>
          </div>
          <div className="space-y-1.5">
            {(showAllPartners ? all : all.slice(0, 5)).map((p) => (
              <Link
                key={p.id}
                href={`/player/${p.id}`}
                className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2 hover:bg-raised transition-colors"
              >
                <span className="text-xs font-medium text-foreground truncate flex-1">
                  {p.name}
                </span>
                <span className="text-[11px] text-muted">{p.matches} matches</span>
                <span className="text-[11px] text-muted">{p.wins}W-{p.losses}L</span>
                <WinRatePill winRate={p.winRate} />
              </Link>
            ))}
          </div>
          {all.length > 5 && (
            <button
              onClick={() => setShowAllPartners(!showAllPartners)}
              className="mt-2 w-full text-[11px] text-accent font-medium hover:underline"
            >
              {showAllPartners ? "Show less" : `Show all ${all.length} partners`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function HighlightCard({
  emoji,
  title,
  name,
  stat,
  sub,
  color,
  href,
}: {
  emoji: string;
  title: string;
  name: string;
  stat: string;
  sub: string;
  color: "win" | "loss";
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-3 transition-colors hover:border-${color}/40 ${
        color === "win" ? "border-win/20 bg-win/[0.03]" : "border-loss/20 bg-loss/[0.03]"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{emoji}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-dim">{title}</span>
      </div>
      <p className="text-sm font-bold text-foreground truncate">{name}</p>
      <p className={`text-xs font-bold mt-0.5 ${color === "win" ? "text-win" : "text-loss"}`}>
        {stat}
      </p>
      <p className="text-[10px] text-muted">{sub}</p>
    </Link>
  );
}

function WinRatePill({ winRate }: { winRate: number }) {
  const pct = Math.round(winRate * 100);
  const isGood = pct >= 55;
  const isBad = pct < 45;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        isGood
          ? "bg-win/10 text-win"
          : isBad
            ? "bg-loss/10 text-loss"
            : "bg-surface text-muted"
      }`}
    >
      {pct}%
    </span>
  );
}

// ── 4. Club Breakdown ───────────────────────────────────────────────────

function ClubBreakdown({ clubs }: { clubs: ClubStat[] }) {
  const maxMatches = Math.max(...clubs.map((c) => c.matches));

  return (
    <div className="mt-8 card p-6 sm:p-8">
      <h3 className="section-label mb-4">Club Performance</h3>
      <div className="space-y-3">
        {clubs.map((c) => (
          <div key={c.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground truncate max-w-[60%]">
                {c.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted">
                  {c.wins}W-{c.losses}L
                </span>
                <WinRatePill winRate={c.winRate} />
              </div>
            </div>
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-raised">
              <div
                className="h-full bg-win/60 rounded-l-full transition-all"
                style={{ width: `${(c.wins / maxMatches) * 100}%` }}
              />
              <div
                className="h-full bg-loss/60 rounded-r-full transition-all"
                style={{ width: `${(c.losses / maxMatches) * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-dim mt-0.5">
              {c.matches} matches
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 5. Advanced Set/Game Stats ──────────────────────────────────────────

function AdvancedStats({
  stats,
}: {
  stats: MatchAnalytics["advanced"];
}) {
  const hasData = stats.gamesWon > 0 || stats.setsWon > 0;
  if (!hasData) return null;

  return (
    <div className="mt-8 card p-6 sm:p-8">
      <h3 className="section-label mb-4">Deep Dive Stats</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <MiniStat label="Sets Won" value={stats.setsWon} />
        <MiniStat label="Sets Lost" value={stats.setsLost} />
        <MiniStat
          label="Set Win %"
          value={
            stats.setsWon + stats.setsLost > 0
              ? `${Math.round(
                  (stats.setsWon / (stats.setsWon + stats.setsLost)) * 100,
                )}%`
              : "-"
          }
          highlight={
            stats.setsWon + stats.setsLost > 0 &&
            stats.setsWon / (stats.setsWon + stats.setsLost) >= 0.55
          }
        />
        <MiniStat label="Games Won" value={stats.gamesWon} />
        <MiniStat label="Games Lost" value={stats.gamesLost} />
        <MiniStat
          label="Game Ratio"
          value={stats.gamesRatio}
          highlight={stats.gamesRatio >= 1.1}
        />
      </div>

      {/* Special stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.threeSetMatches > 0 && (
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-foreground font-display">
              {stats.threeSetWinRate ?? 0}%
            </p>
            <p className="text-[10px] text-muted mt-0.5">
              3-Set Win Rate
            </p>
            <p className="text-[10px] text-dim">
              ({stats.threeSetWins}/{stats.threeSetMatches})
            </p>
          </div>
        )}
        {stats.bagels > 0 && (
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-win font-display">
              {stats.bagels}
            </p>
            <p className="text-[10px] text-muted mt-0.5">Bagels (6-0)</p>
          </div>
        )}
        {stats.breadsticks > 0 && (
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-foreground font-display">
              {stats.breadsticks}
            </p>
            <p className="text-[10px] text-muted mt-0.5">Breadsticks (6-1)</p>
          </div>
        )}
        {stats.avgGamesPerSet > 0 && (
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-foreground font-display">
              {stats.avgGamesPerSet}
            </p>
            <p className="text-[10px] text-muted mt-0.5">Avg Games/Set</p>
          </div>
        )}
      </div>

      {/* Games balance bar */}
      {stats.gamesWon + stats.gamesLost > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-muted mb-1">
            <span>Games Won ({stats.gamesWon})</span>
            <span>Games Lost ({stats.gamesLost})</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden">
            <div
              className="bg-win/70 transition-all"
              style={{
                width: `${(stats.gamesWon / (stats.gamesWon + stats.gamesLost)) * 100}%`,
              }}
            />
            <div
              className="bg-loss/70 transition-all"
              style={{
                width: `${(stats.gamesLost / (stats.gamesWon + stats.gamesLost)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-surface rounded-lg p-3 text-center">
      <p
        className={`text-base font-bold font-display ${highlight ? "text-accent" : "text-foreground"}`}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted mt-0.5">{label}</p>
    </div>
  );
}

// ── Share Button ────────────────────────────────────────────────────────

function ShareButton({
  playerName,
  playerId,
}: {
  playerName: string;
  playerId: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `https://www.thepadelpassport.com/player/${playerId}`;
    const text = `Check out ${playerName}'s padel stats on Padel Passport`;

    // Use native share on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({ title: `${playerName} - Padel Stats`, text, url });
        return;
      } catch {
        // User cancelled or API failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort: prompt
      window.prompt("Copy this link:", url);
    }
  }, [playerName, playerId]);

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:border-border-hover transition-colors"
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}

// ── Claim Your Profile CTA ──────────────────────────────────────────────

function ClaimProfile({
  playerId,
  playerName,
}: {
  playerId: string;
  playerName: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || state === "loading") return;

      setState("loading");
      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            source: "claim_profile",
            playerId,
            playerName,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setState("done");
        setMessage(data.message || "You're in!");
      } catch (err) {
        setState("error");
        setMessage(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    [email, state, playerId, playerName],
  );

  if (state === "done") {
    return (
      <div className="mt-8 card p-6 text-center border-accent/20">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-foreground">{message}</p>
        <p className="text-xs text-muted mt-1">
          You&apos;ll get weekly rank updates for {playerName.split(" ")[0]}.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 card p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground">
            Is this you?
          </h3>
          <p className="text-sm text-muted mt-1 leading-relaxed">
            Claim this profile to get weekly rank changes, stat updates, and alerts when someone overtakes you.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setState("idle"); }}
            placeholder="your@email.com"
            required
            className="input-field flex-1 sm:w-52 !py-2.5"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="btn-primary whitespace-nowrap !py-2.5 disabled:opacity-50"
          >
            {state === "loading" ? "..." : "Claim"}
          </button>
        </form>
      </div>
      {state === "error" && (
        <p className="mt-2 text-xs text-loss">{message}</p>
      )}
    </div>
  );
}
