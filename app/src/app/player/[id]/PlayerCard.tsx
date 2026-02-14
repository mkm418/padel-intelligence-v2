"use client";

/**
 * Player Card. Premium sports card / passport page.
 * Shows player photo, tier, level, real stats, badges, top partners.
 * Win rate only shown when W/L sample size is meaningful.
 */

import { useState, useEffect, useRef } from "react";
import Nav from "@/components/Nav";

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
      <Nav />
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

  if (loading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
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
      <Nav />

      <div className="page-container pt-20 pb-16">
        {/* ── THE CARD */}
        <div ref={cardRef} className="card overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* ── Tier badge + passport label */}
            <div className="mb-6 flex items-center justify-between">
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] font-display ${tc.text} ${tc.border} ${tc.bg}`}
              >
                {tier.tier}
              </span>
              <span className="section-label">Padel Passport</span>
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

        {/* ── Clubs list below card */}
        {player.clubs.length > 0 && (
          <div className="mt-8">
            <h3 className="section-label mb-3">
              Clubs ({player.clubs.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {player.clubs.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-surface border border-border px-3.5 py-1.5 text-xs font-medium text-muted"
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
