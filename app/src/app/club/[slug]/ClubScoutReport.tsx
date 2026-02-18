"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import RadarChart from "@/components/RadarChart";
import { getMiamiAverages, type FullClubProfile } from "@/lib/club-profiles";

// ── Helpers ──────────────────────────────────────────────
function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}
function scoreColor(s: number) {
  if (s >= 8) return "text-win";
  if (s >= 6) return "text-accent";
  if (s >= 4) return "text-amber";
  return "text-muted";
}
function scoreBg(s: number) {
  if (s >= 8) return "bg-win/10";
  if (s >= 6) return "bg-accent/10";
  if (s >= 4) return "bg-amber/10";
  return "bg-muted/10";
}
function scoreLabel(s: number) {
  if (s >= 9) return "Elite";
  if (s >= 8) return "Excellent";
  if (s >= 7) return "Great";
  if (s >= 6) return "Good";
  if (s >= 5) return "Solid";
  if (s >= 4) return "Average";
  return "Developing";
}
function deltaArrow(val: number, avg: number) {
  if (val > avg * 1.05) return { icon: "↑", color: "text-win" };
  if (val < avg * 0.95) return { icon: "↓", color: "text-loss" };
  return { icon: "→", color: "text-muted" };
}

export default function ClubScoutReport({ club }: { club: FullClubProfile }) {
  const { stats, scores, topPlayers, coaches, vibes } = club;
  const miamiAvg = useMemo(() => getMiamiAverages(), []);

  return (
    <section className="page-container py-8 md:py-12 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-xs text-muted">
        <Link href="/clubs" className="hover:text-accent transition-colors">Clubs</Link>
        <span>/</span>
        <span className="text-foreground">{club.name}</span>
      </div>

      {/* ── Hero with Map ────────────────── */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
        {/* Hero image / map fallback */}
        <div className="h-48 md:h-64 relative overflow-hidden">
          {club.image ? (
            <img
              src={club.image}
              alt={club.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${club.lng - 0.012},${club.lat - 0.006},${club.lng + 0.012},${club.lat + 0.006}&layer=mapnik&marker=${club.lat},${club.lng}`}
              className="absolute inset-0 w-full h-full border-0 pointer-events-none"
              loading="lazy"
              title={`${club.name} location map`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />

          {/* Score badge floating */}
          <div className={`absolute top-4 right-4 flex flex-col items-center px-4 py-3 rounded-2xl ${scoreBg(club.overallScore)} backdrop-blur-sm`}>
            <span className={`text-3xl font-display font-bold ${scoreColor(club.overallScore)}`}>
              {club.overallScore.toFixed(1)}
            </span>
            <span className="text-[10px] text-muted font-medium">{scoreLabel(club.overallScore)}</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-6 md:p-8 -mt-8 relative">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {club.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {club.address}, {club.city}, {club.state} {club.zip}
            </span>
            {club.phone && (
              <a href={`tel:${club.phone}`} className="flex items-center gap-1.5 hover:text-accent">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                {club.phone}
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {club.hours}
            </span>
          </div>

          <p className="text-sm text-muted leading-relaxed mt-3">{club.description}</p>

          {/* Vibes */}
          {vibes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {vibes.map((v) => (
                <span key={v.label} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-raised border border-border text-muted">
                  <span>{v.icon}</span> {v.label}
                </span>
              ))}
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 mt-5">
            {club.website && (
              <a href={club.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors">
                Visit Website
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              </a>
            )}
            <a href={`https://maps.google.com/?q=${encodeURIComponent(`${club.address}, ${club.city}, ${club.state} ${club.zip}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-raised border border-border text-foreground text-sm font-medium hover:border-accent/40 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              Directions
            </a>
            <Link href="/tournaments"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-raised border border-border text-foreground text-sm font-medium hover:border-accent/40 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              Book / Events
            </Link>
          </div>
        </div>
      </div>

      {/* ── Score Radar + Breakdown ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center justify-center">
          <h2 className="font-display text-lg font-bold text-foreground mb-2 self-start">Score Radar</h2>
          <RadarChart
            scores={[
              { label: "Community", value: scores.community },
              { label: "Competitive", value: scores.competitive },
              { label: "Activity", value: scores.activity },
              { label: "Diversity", value: scores.diversity },
              { label: "Facilities", value: scores.facilities },
            ]}
            size={240}
          />
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Score Breakdown</h2>
          <div className="space-y-3">
            {(
              [
                ["Community", scores.community, "Player count & engagement"],
                ["Competitive", scores.competitive, "Avg level & competition ratio"],
                ["Activity", scores.activity, "Matches per player & volume"],
                ["Diversity", scores.diversity, "Level spread across players"],
                ["Facilities", scores.facilities, "Courts, amenities & indoor"],
              ] as [string, number, string][]
            ).map(([label, score, desc]) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className={`text-sm font-display font-bold ${scoreColor(score)}`}>{score}/10</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${score * 10}%` }} />
                </div>
                <p className="text-[10px] text-dim mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Key Stats ──────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Players", value: fmt(stats.totalPlayers), sub: "unique players", cmp: { val: stats.totalPlayers, avg: miamiAvg.avgPlayers } },
          { label: "Avg Level", value: stats.avgLevel.toFixed(2), sub: `Median ${stats.medianLevel.toFixed(2)}`, cmp: { val: stats.avgLevel, avg: miamiAvg.avgLevel } },
          { label: "Top Level", value: stats.topLevel.toFixed(1), sub: `Min ${stats.minLevel.toFixed(1)}`, cmp: null },
          { label: "Total Matches", value: fmt(stats.totalMatches), sub: `${stats.avgMatches.toFixed(0)} avg/player`, cmp: { val: stats.avgMatches, avg: miamiAvg.avgMatches } },
          { label: "Competitive", value: fmt(stats.totalCompetitive), sub: `${(stats.competitiveRatio * 100).toFixed(0)}% of matches`, cmp: { val: stats.competitiveRatio, avg: miamiAvg.avgCompetitiveRatio } },
          { label: "Friendly", value: fmt(stats.totalFriendly), sub: `${((1 - stats.competitiveRatio) * 100).toFixed(0)}% of matches`, cmp: null },
          { label: "Advanced (4+)", value: fmt(stats.advancedPlayers), sub: `${((stats.advancedPlayers / stats.totalPlayers) * 100).toFixed(0)}% of players`, cmp: null },
          { label: "Tracking Since", value: stats.earliestMatch.split("-").slice(0, 2).join("-"), sub: `Through ${stats.latestMatch.split("-").slice(0, 2).join("-")}`, cmp: null },
        ].map(({ label, value, sub, cmp }) => {
          const delta = cmp ? deltaArrow(cmp.val, cmp.avg) : null;
          return (
            <div key={label} className="bg-surface border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-display font-bold text-foreground">{value}</span>
                {delta && <span className={`text-xs ${delta.color}`}>{delta.icon} vs avg</span>}
              </div>
              <div className="text-xs text-muted">{label}</div>
              <div className="text-[10px] text-dim mt-0.5">{sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Level Distribution ─────────────── */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-display text-lg font-bold text-foreground mb-4">Player Level Distribution</h2>
        <div className="flex items-end gap-4 h-32">
          {[
            { label: "Beginner", sub: "< 3.0", count: stats.beginnerPlayers, color: "bg-teal" },
            { label: "Intermediate", sub: "3.0 – 4.0", count: stats.intermediatePlayers, color: "bg-amber" },
            { label: "Advanced", sub: "4.0+", count: stats.advancedPlayers, color: "bg-accent" },
          ].map(({ label, sub, count, color }) => {
            const pct = (count / stats.totalPlayers) * 100;
            return (
              <div key={label} className="flex-1 flex flex-col items-center">
                <div className={`w-full ${color} rounded-t-xl transition-all`} style={{ height: `${Math.max(pct, 6)}%` }} />
                <div className="text-sm font-bold text-foreground mt-2">{pct.toFixed(0)}%</div>
                <div className="text-xs text-muted">{label}</div>
                <div className="text-[10px] text-dim">{sub} · {count}</div>
              </div>
            );
          })}
        </div>

        {/* Players Like You */}
        <PlayersLikeYou stats={stats} />
      </div>

      {/* ── Activity Split ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-3">Match Type Split</h2>
          <div className="flex gap-3">
            <div className="flex-1 text-center p-3 rounded-xl bg-accent/5">
              <div className="text-2xl font-display font-bold text-accent">{(stats.competitiveRatio * 100).toFixed(0)}%</div>
              <div className="text-xs text-muted">Competitive</div>
              <div className="text-[10px] text-dim">{fmt(stats.totalCompetitive)} matches</div>
            </div>
            <div className="flex-1 text-center p-3 rounded-xl bg-teal/5">
              <div className="text-2xl font-display font-bold text-teal">{((1 - stats.competitiveRatio) * 100).toFixed(0)}%</div>
              <div className="text-xs text-muted">Friendly</div>
              <div className="text-[10px] text-dim">{fmt(stats.totalFriendly)} matches</div>
            </div>
          </div>
        </div>

        {/* Club vs Miami Average */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-3">vs Miami Average</h2>
          <div className="space-y-2">
            {[
              { label: "Avg Level", club: stats.avgLevel, avg: miamiAvg.avgLevel, fmt: (v: number) => v.toFixed(2) },
              { label: "Matches/Player", club: stats.avgMatches, avg: miamiAvg.avgMatches, fmt: (v: number) => v.toFixed(0) },
              { label: "Competitive %", club: stats.competitiveRatio * 100, avg: miamiAvg.avgCompetitiveRatio * 100, fmt: (v: number) => `${v.toFixed(0)}%` },
              { label: "Players", club: stats.totalPlayers, avg: miamiAvg.avgPlayers, fmt: (v: number) => fmt(v) },
            ].map(({ label, club: val, avg, fmt: f }) => {
              const diff = val - avg;
              const pct = avg > 0 ? ((diff / avg) * 100).toFixed(0) : "0";
              const positive = diff > 0;
              return (
                <div key={label} className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{f(val)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${positive ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}>
                      {positive ? "+" : ""}{pct}%
                    </span>
                    <span className="text-[10px] text-dim">(avg: {f(avg)})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Facilities ─────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-display text-lg font-bold text-foreground mb-4">Facilities & Info</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: "Total Courts", value: String(club.courts.total), accent: true },
            { label: "Indoor", value: String(club.courts.indoor) },
            { label: "Outdoor", value: String(club.courts.outdoor) },
            { label: "Price Range", value: club.priceRange, small: true },
          ].map(({ label, value, accent, small }) => (
            <div key={label}>
              <div className={`${small ? "text-sm" : "text-2xl"} font-display font-bold ${accent ? "text-accent" : "text-foreground"}`}>
                {value}
              </div>
              <div className="text-xs text-muted">{label}</div>
            </div>
          ))}
        </div>

        {club.membershipFrom && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-accent-soft border border-accent/20 text-sm">
            <span className="font-medium text-accent">Membership from </span>
            <span className="text-foreground font-bold">{club.membershipFrom}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {club.amenities.map((a) => (
            <span key={a} className="px-2.5 py-1 rounded-lg text-xs bg-raised border border-border text-muted">
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* ── Coaches at this Club ────────────── */}
      {coaches.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">
            Coaches at {club.name}
            <span className="text-sm text-muted font-normal ml-2">({coaches.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coaches.slice(0, 8).map((c) => (
              <Link
                key={c.coachId}
                href={`/coach/${c.coachId}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-raised hover:bg-raised/80 border border-transparent hover:border-accent/20 transition-all"
              >
                {/* Avatar */}
                {c.picture ? (
                  <img src={c.picture} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-display font-bold text-sm">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                  <div className="text-xs text-muted">
                    {c.totalClasses} classes
                    {c.level ? ` · Level ${c.level.toFixed(1)}` : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {coaches.length > 8 && (
            <Link href="/coaches" className="block mt-3 text-center text-xs text-accent hover:underline">
              View all {coaches.length} coaches →
            </Link>
          )}
        </div>
      )}

      {/* ── Top Players ────────────────────── */}
      {topPlayers.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Top Rated Players</h2>
          <div className="space-y-2">
            {topPlayers.map((p, i) => (
              <Link
                key={p.userId}
                href={`/player/${p.userId}`}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-raised hover:bg-raised/80 border border-transparent hover:border-accent/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-dim w-5">#{i + 1}</span>
                  <div>
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <span className="text-xs text-muted ml-2">{p.matchesPlayed} matches</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {p.winRate !== null && (
                    <span className="text-xs text-muted">{(p.winRate * 100).toFixed(0)}% WR</span>
                  )}
                  <span className="text-sm font-display font-bold text-accent">{p.level.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Back ───────────────────────────── */}
      <div className="text-center">
        <Link href="/clubs" className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to all clubs
        </Link>
      </div>
    </section>
  );
}

// ── Players Like You Interactive Slider ──────────────────

function PlayersLikeYou({ stats }: { stats: FullClubProfile["stats"] }) {
  const [level, setLevel] = useState(3.0);

  const count = useMemo(() => {
    // Estimate players at this level using distribution
    const total = stats.totalPlayers;
    if (level < 3.0) {
      // Beginner range (0.5-3.0): spread across 2.5 levels
      const pct = stats.beginnerPlayers / total;
      return Math.round(pct * total * 0.4); // rough band
    } else if (level < 4.0) {
      const pct = stats.intermediatePlayers / total;
      return Math.round(pct * total * 0.5);
    } else {
      const pct = stats.advancedPlayers / total;
      return Math.round(pct * total * 0.3);
    }
  }, [level, stats]);

  return (
    <div className="mt-6 p-4 rounded-xl bg-raised border border-border">
      <h3 className="text-sm font-medium text-foreground mb-3">
        Players Like You
      </h3>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min="1.0"
          max="7.0"
          step="0.5"
          value={level}
          onChange={(e) => setLevel(parseFloat(e.target.value))}
          className="flex-1 accent-accent"
        />
        <div className="text-right min-w-[120px]">
          <span className="text-lg font-display font-bold text-accent">{level.toFixed(1)}</span>
          <span className="text-xs text-muted ml-1">level</span>
        </div>
      </div>
      <p className="text-sm text-muted mt-2">
        Approximately <span className="text-foreground font-semibold">{count}</span> players
        are around your level at this club.
        {level >= 4.0 && " Advanced competition awaits!"}
        {level < 2.5 && " Great spot to learn and grow!"}
        {level >= 2.5 && level < 4.0 && " Plenty of match options for you."}
      </p>
    </div>
  );
}
