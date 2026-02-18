"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { getAllClubProfiles, getMiamiAverages, type FullClubProfile } from "@/lib/club-profiles";

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
function tierStripe(s: number) {
  if (s >= 8) return "bg-win";
  if (s >= 6) return "bg-accent";
  if (s >= 4) return "bg-amber";
  return "bg-muted";
}

type SortKey = "score" | "players" | "level" | "matches" | "courts";
type BestFor = "all" | "beginners" | "competitive" | "value" | "indoor" | "amenities" | "social";

const BEST_FOR_OPTIONS: { key: BestFor; label: string; icon: string }[] = [
  { key: "all", label: "All Clubs", icon: "🏟️" },
  { key: "beginners", label: "Beginners", icon: "🌱" },
  { key: "competitive", label: "Competitive", icon: "🔥" },
  { key: "value", label: "Best Value", icon: "💰" },
  { key: "indoor", label: "Indoor", icon: "❄️" },
  { key: "amenities", label: "Best Amenities", icon: "✨" },
  { key: "social", label: "Social & Fun", icon: "🎉" },
];

export default function ClubDirectory() {
  const allClubs = useMemo(() => getAllClubProfiles(), []);
  const miamiAvg = useMemo(() => getMiamiAverages(), []);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("score");
  const [bestFor, setBestFor] = useState<BestFor>("all");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const toggleCompare = useCallback((slug: string) => {
    setCompareIds((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length < 3 ? [...prev, slug] : prev,
    );
  }, []);

  const filtered = useMemo(() => {
    let list = allClubs;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.tags.some((t) => t.includes(q)) ||
          c.vibes.some((v) => v.label.toLowerCase().includes(q)),
      );
    }

    // Best-for filter
    switch (bestFor) {
      case "beginners":
        list = list.filter((c) => c.stats.avgLevel < 3.0);
        break;
      case "competitive":
        list = list.filter((c) => c.stats.avgLevel >= 3.0 && c.stats.competitiveRatio >= 0.85);
        break;
      case "value":
        list = [...list].sort((a, b) => a.courts.total === 0 ? 1 : b.courts.total === 0 ? -1 : 0);
        break;
      case "indoor":
        list = list.filter((c) => c.indoor);
        break;
      case "amenities":
        list = [...list].sort((a, b) => b.amenities.length - a.amenities.length);
        break;
      case "social":
        list = list.filter((c) => c.stats.competitiveRatio < 0.88);
        break;
    }

    // Sort
    if (bestFor === "all" || bestFor === "beginners" || bestFor === "competitive" || bestFor === "indoor" || bestFor === "social") {
      list = [...list].sort((a, b) => {
        switch (sort) {
          case "score": return b.overallScore - a.overallScore;
          case "players": return b.stats.totalPlayers - a.stats.totalPlayers;
          case "level": return b.stats.avgLevel - a.stats.avgLevel;
          case "matches": return b.stats.totalMatches - a.stats.totalMatches;
          case "courts": return b.courts.total - a.courts.total;
        }
      });
    }

    return list;
  }, [allClubs, search, sort, bestFor]);

  const compareClubs = useMemo(
    () => allClubs.filter((c) => compareIds.includes(c.slug)),
    [allClubs, compareIds],
  );

  return (
    <section className="page-container py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Club Directory
        </h1>
        <p className="mt-2 text-muted text-sm md:text-base max-w-2xl">
          Data-driven scout reports for every padel club in South Florida.
          Scores computed from{" "}
          <span className="text-foreground font-semibold">
            {fmt(allClubs.reduce((s, c) => s + c.stats.totalMatches, 0))}
          </span>{" "}
          real matches across{" "}
          <span className="text-foreground font-semibold">{allClubs.length}</span> clubs.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Clubs", value: allClubs.length, icon: "🏟️" },
          { label: "Players", value: fmt(allClubs.reduce((s, c) => s + c.stats.totalPlayers, 0)), icon: "👥" },
          { label: "Courts", value: allClubs.reduce((s, c) => s + c.courts.total, 0), icon: "🎾" },
          { label: "Matches", value: fmt(allClubs.reduce((s, c) => s + c.stats.totalMatches, 0)), icon: "📊" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-surface border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-base">{icon}</span>
              <div className="text-lg md:text-xl font-display font-bold text-foreground">{value}</div>
            </div>
            <div className="text-xs text-muted mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Best-for quick filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {BEST_FOR_OPTIONS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setBestFor(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              bestFor === key
                ? "bg-accent text-white shadow-sm"
                : "bg-surface border border-border text-muted hover:text-foreground hover:border-accent/30"
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Search + Sort + View toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search clubs, cities, vibes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-dim focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 w-full sm:w-64"
        />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted">Sort:</span>
          {(
            [["score", "Score"], ["players", "Players"], ["level", "Level"], ["matches", "Matches"], ["courts", "Courts"]] as [SortKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                sort === key ? "bg-accent text-white" : "bg-raised text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden ml-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "grid" ? "bg-accent text-white" : "bg-surface text-muted"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "map" ? "bg-accent text-white" : "bg-surface text-muted"
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Comparison bar */}
      {compareIds.length > 0 && (
        <div className="mb-6 p-4 bg-accent-soft border border-accent/20 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">
              Comparing {compareIds.length} club{compareIds.length > 1 ? "s" : ""} (max 3)
            </span>
            <button
              onClick={() => setCompareIds([])}
              className="text-xs text-muted hover:text-accent"
            >
              Clear
            </button>
          </div>
          {compareIds.length >= 2 && <CompareTable clubs={compareClubs} avg={miamiAvg} />}
        </div>
      )}

      {/* Map View */}
      {viewMode === "map" ? (
        <ClubMap clubs={filtered} />
      ) : (
        /* Club grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((club, i) => (
            <ClubCard
              key={club.slug}
              club={club}
              rank={i + 1}
              isComparing={compareIds.includes(club.slug)}
              onToggleCompare={() => toggleCompare(club.slug)}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-muted py-16 text-sm">No clubs match your filters.</p>
      )}
    </section>
  );
}

// ── Club Card (redesigned with stripe + vibes + coaches + map preview) ──

function ClubCard({
  club,
  rank,
  isComparing,
  onToggleCompare,
}: {
  club: FullClubProfile;
  rank: number;
  isComparing: boolean;
  onToggleCompare: () => void;
}) {
  return (
    <div className="group relative bg-surface border border-border rounded-2xl overflow-hidden hover:border-accent/40 hover:shadow-md transition-all">
      {/* Score tier accent stripe */}
      <div className={`h-1 ${tierStripe(club.overallScore)}`} />

      {/* Styled header with club photo */}
      <div className="h-32 relative overflow-hidden">
        {club.image ? (
          <img
            src={club.image}
            alt={club.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${club.lng - 0.008},${club.lat - 0.004},${club.lng + 0.008},${club.lat + 0.004}&layer=mapnik&marker=${club.lat},${club.lng}`}
            className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-60"
            loading="lazy"
            title={`${club.name} map`}
          />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface/90 to-transparent" />

        {/* Score badge */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg ${scoreBg(club.overallScore)} backdrop-blur-sm`}>
          <span className={`text-lg font-display font-bold ${scoreColor(club.overallScore)}`}>
            {club.overallScore.toFixed(1)}
          </span>
          <span className="text-[10px] text-muted">/10</span>
        </div>

        {/* Rank */}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-surface/80 backdrop-blur-sm text-xs font-mono text-muted">
          #{rank}
        </div>

        {/* Compare toggle */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleCompare(); }}
          className={`absolute bottom-2 right-3 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
            isComparing
              ? "bg-accent text-white"
              : "bg-surface/80 backdrop-blur-sm text-muted hover:text-accent"
          }`}
        >
          {isComparing ? "✓ Comparing" : "+ Compare"}
        </button>
      </div>

      <Link href={`/club/${club.slug}`} className="block p-5 pt-3">
        {/* Name + location */}
        <h2 className="font-display text-base font-bold text-foreground group-hover:text-accent transition-colors leading-tight mb-1">
          {club.name}
        </h2>
        <div className="flex items-center gap-2 mb-2 text-xs text-muted">
          <span>{club.city}, {club.state}</span>
          <span className="text-dim">·</span>
          <span>{club.courts.total} courts{club.indoor ? " · Indoor" : ""}</span>
          {club.coaches.length > 0 && (
            <>
              <span className="text-dim">·</span>
              <span>{club.coaches.length} coach{club.coaches.length > 1 ? "es" : ""}</span>
            </>
          )}
        </div>

        {/* Vibes */}
        {club.vibes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {club.vibes.slice(0, 4).map((v) => (
              <span key={v.label} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-raised border border-border text-muted">
                <span className="text-[10px]">{v.icon}</span>
                {v.label}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: "Players", value: fmt(club.stats.totalPlayers) },
            { label: "Avg Level", value: club.stats.avgLevel.toFixed(2) },
            { label: "Matches", value: fmt(club.stats.totalMatches) },
            { label: "Avg/Player", value: club.stats.avgMatches.toFixed(0) },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-sm font-display font-bold text-foreground">{value}</div>
              <div className="text-[10px] text-dim">{label}</div>
            </div>
          ))}
        </div>

        {/* Level distribution bar */}
        <div className="mb-3">
          <div className="flex h-2 rounded-full overflow-hidden">
            {[
              { pct: club.stats.beginnerPlayers / club.stats.totalPlayers, color: "bg-teal" },
              { pct: club.stats.intermediatePlayers / club.stats.totalPlayers, color: "bg-amber" },
              { pct: club.stats.advancedPlayers / club.stats.totalPlayers, color: "bg-accent" },
            ].map(({ pct, color }, i) => (
              <div
                key={i}
                className={`${color} transition-all`}
                style={{ width: `${pct * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-dim">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal inline-block" />
              Beg {((club.stats.beginnerPlayers / club.stats.totalPlayers) * 100).toFixed(0)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" />
              Int {((club.stats.intermediatePlayers / club.stats.totalPlayers) * 100).toFixed(0)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              Adv {((club.stats.advancedPlayers / club.stats.totalPlayers) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Sub-scores mini bars */}
        <div className="flex items-center gap-1">
          {(
            [
              ["Comm", club.scores.community],
              ["Comp", club.scores.competitive],
              ["Act", club.scores.activity],
              ["Div", club.scores.diversity],
              ["Fac", club.scores.facilities],
            ] as [string, number][]
          ).map(([label, score]) => (
            <div key={label} className="flex-1" title={`${label}: ${score}/10`}>
              <div className="h-1 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${score * 10}%` }}
                />
              </div>
              <div className="text-[8px] text-dim text-center mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Price range */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted">{club.priceRange}</span>
          {club.membershipFrom && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-accent-soft text-accent font-medium">
              From {club.membershipFrom}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

// ── Club Map ─────────────────────────────────────────────

function ClubMap({ clubs }: { clubs: FullClubProfile[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  // Simple relative positioning map
  const lats = clubs.map((c) => c.lat);
  const lngs = clubs.map((c) => c.lng);
  const minLat = Math.min(...lats) - 0.02;
  const maxLat = Math.max(...lats) + 0.02;
  const minLng = Math.min(...lngs) - 0.02;
  const maxLng = Math.max(...lngs) + 0.02;

  function getPos(lat: number, lng: number) {
    return {
      left: `${((lng - minLng) / (maxLng - minLng)) * 100}%`,
      top: `${(1 - (lat - minLat) / (maxLat - minLat)) * 100}%`,
    };
  }

  const selectedClub = clubs.find((c) => c.slug === selected);

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 md:p-6">
      <div className="relative w-full" style={{ paddingBottom: "60%" }}>
        {/* Background gradient to simulate map */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal/5 via-raised to-accent/5 border border-border overflow-hidden">
          {/* Grid lines */}
          {[20, 40, 60, 80].map((p) => (
            <div key={`h${p}`}>
              <div className="absolute left-0 right-0 border-t border-border/30" style={{ top: `${p}%` }} />
              <div className="absolute top-0 bottom-0 border-l border-border/30" style={{ left: `${p}%` }} />
            </div>
          ))}

          {/* Pins */}
          {clubs.map((club) => {
            const pos = getPos(club.lat, club.lng);
            const isSelected = selected === club.slug;
            return (
              <button
                key={club.slug}
                onClick={() => setSelected(isSelected ? null : club.slug)}
                className={`absolute transform -translate-x-1/2 -translate-y-full transition-all z-10 ${
                  isSelected ? "z-20 scale-125" : "hover:scale-110"
                }`}
                style={pos}
                title={club.name}
              >
                {/* Pin */}
                <div className={`flex flex-col items-center ${isSelected ? "" : "opacity-80 hover:opacity-100"}`}>
                  <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap mb-0.5 ${
                    isSelected
                      ? "bg-accent text-white shadow-lg"
                      : `${tierStripe(club.overallScore)} text-white`
                  }`}>
                    {club.overallScore.toFixed(1)}
                  </div>
                  <div className={`w-3 h-3 rounded-full border-2 border-white shadow ${tierStripe(club.overallScore)}`} />
                  <div className={`w-0.5 h-2 ${tierStripe(club.overallScore)}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected club popup */}
      {selectedClub && (
        <Link
          href={`/club/${selectedClub.slug}`}
          className="block mt-4 p-4 bg-raised border border-accent/20 rounded-xl hover:border-accent/40 transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-foreground">
                {selectedClub.name}
              </h3>
              <p className="text-xs text-muted mt-1">
                {selectedClub.city}, {selectedClub.state} · {selectedClub.courts.total} courts · {fmt(selectedClub.stats.totalPlayers)} players
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedClub.vibes.slice(0, 3).map((v) => (
                  <span key={v.label} className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted">
                    {v.icon} {v.label}
                  </span>
                ))}
              </div>
            </div>
            <div className={`px-3 py-2 rounded-xl ${scoreBg(selectedClub.overallScore)}`}>
              <span className={`text-xl font-display font-bold ${scoreColor(selectedClub.overallScore)}`}>
                {selectedClub.overallScore.toFixed(1)}
              </span>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}

// ── Comparison Table ─────────────────────────────────────

function CompareTable({
  clubs,
  avg,
}: {
  clubs: FullClubProfile[];
  avg: { avgLevel: number; avgMatches: number; avgPlayers: number; avgCompetitiveRatio: number };
}) {
  const rows = [
    { label: "Overall Score", fn: (c: FullClubProfile) => c.overallScore.toFixed(1), miamiAvg: "-" },
    { label: "Players", fn: (c: FullClubProfile) => fmt(c.stats.totalPlayers), miamiAvg: fmt(avg.avgPlayers) },
    { label: "Avg Level", fn: (c: FullClubProfile) => c.stats.avgLevel.toFixed(2), miamiAvg: String(avg.avgLevel) },
    { label: "Courts", fn: (c: FullClubProfile) => String(c.courts.total), miamiAvg: "-" },
    { label: "Indoor", fn: (c: FullClubProfile) => c.indoor ? "Yes" : "No", miamiAvg: "-" },
    { label: "Matches/Player", fn: (c: FullClubProfile) => c.stats.avgMatches.toFixed(0), miamiAvg: String(avg.avgMatches) },
    { label: "Competitive %", fn: (c: FullClubProfile) => `${(c.stats.competitiveRatio * 100).toFixed(0)}%`, miamiAvg: `${(avg.avgCompetitiveRatio * 100).toFixed(0)}%` },
    { label: "Coaches", fn: (c: FullClubProfile) => String(c.coaches.length), miamiAvg: "-" },
    { label: "Price Range", fn: (c: FullClubProfile) => c.priceRange, miamiAvg: "-" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 text-muted font-medium">Metric</th>
            {clubs.map((c) => (
              <th key={c.slug} className="text-center py-2 px-2 text-foreground font-bold">
                <Link href={`/club/${c.slug}`} className="hover:text-accent">{c.name}</Link>
              </th>
            ))}
            <th className="text-center py-2 px-2 text-dim font-medium">Miami Avg</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border/50">
              <td className="py-2 pr-4 text-muted">{row.label}</td>
              {clubs.map((c) => (
                <td key={c.slug} className="text-center py-2 px-2 font-medium text-foreground">
                  {row.fn(c)}
                </td>
              ))}
              <td className="text-center py-2 px-2 text-dim">{row.miamiAvg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
