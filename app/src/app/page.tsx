import {
  getMiamiClubs,
  getMiamiEvents,
  padelCourtCount,
  type Tenant,
} from "@/lib/playtomic";
import { getAllClubProfiles } from "@/lib/club-profiles";
import Link from "next/link";
import HeroSearch from "./HeroSearch";

// ---------------------------------------------------------------------------
// Page: server component, fetches live Playtomic + club profile data
// ---------------------------------------------------------------------------

// Players who represent the community (hand-picked for variety)
const SOCIAL_PROOF = [
  { name: "Eduardo Montolio", level: 4.1, matches: 525 },
  { name: "Dmitry Ivanov", level: 5.4, matches: 496 },
  { name: "Giampaolo Mauti", level: 5.4, matches: 364 },
  { name: "Christian Castano", level: 4.3, matches: 339 },
  { name: "Ramon Turmero", level: 4.7, matches: 285 },
  { name: "Andres Contreras", level: 6.5, matches: 282 },
  { name: "Doris Beitman", level: 4.5, matches: 266 },
  { name: "Nahuel Garbellotti", level: 4.5, matches: 241 },
];

export default async function Home() {
  const clubs = await getMiamiClubs().catch(() => [] as Tenant[]);
  const totalCourts = clubs.reduce((sum, c) => sum + padelCourtCount(c), 0);
  const sortedClubs = [...clubs].sort(
    (a, b) => padelCourtCount(b) - padelCourtCount(a),
  );

  const { tournaments, classes } = await getMiamiEvents(sortedClubs);
  const eventCount = tournaments.length + classes.length;

  // Top clubs from scout reports (sorted by score)
  const topClubs = getAllClubProfiles().slice(0, 6);

  return (
    <div className="bg-background text-foreground">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="hero-glow court-lines pt-10 pb-16 sm:pt-16 sm:pb-24">
        <div className="page-container relative z-10 text-center">
          {/* Eyebrow */}
          <div className="flex justify-center mb-5">
            <span className="badge-accent">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
              </span>
              Tracking {(27371).toLocaleString()} players across {clubs.length} clubs
            </span>
          </div>

          {/* #1: Punchy H1 */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-[1.05]">
            Every padel match in Miami.
            <br />
            <span className="text-gradient-accent">Tracked.</span>
          </h1>

          {/* #2: Single focused subhead */}
          <p className="mx-auto mt-5 max-w-lg text-base text-muted sm:text-lg leading-relaxed">
            Look up any player. See exactly where you rank against {(27371).toLocaleString()} others.
            Powered by real match data from {totalCourts} courts.
          </p>

          {/* #7: Search bar in hero */}
          <div className="mt-8 sm:mt-10">
            <HeroSearch />
            <p className="text-xs text-dim mt-3">
              or <Link href="/rankings" className="text-accent hover:underline font-medium">browse the full rankings</Link>
            </p>
          </div>

          {/* #5: Social proof - real player names */}
          <div className="mt-12 pt-8 border-t border-border/60">
            <p className="text-xs text-dim uppercase tracking-wider font-medium mb-4">
              Players already tracking their game
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
              {SOCIAL_PROOF.map((p) => (
                <div
                  key={p.name}
                  className="inline-flex items-center gap-2 bg-surface border border-border rounded-full pl-1 pr-3 py-1"
                >
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-accent">
                      {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <span className="text-xs text-foreground font-medium">{p.name.split(" ")[0]}</span>
                  <span className="text-[10px] text-muted">{p.level}</span>
                </div>
              ))}
              <div className="inline-flex items-center gap-1 pl-2 pr-3 py-1.5">
                <span className="text-xs text-muted">+ 27K more</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STAT BAR ═══════════════ */}
      <section className="border-y border-border bg-surface/50">
        <div className="page-container py-6">
          <div className="flex items-center justify-center gap-8 sm:gap-16">
            <StatPill value={clubs.length} label="Clubs" />
            <div className="h-8 w-px bg-border" />
            <StatPill value={totalCourts} label="Courts" />
            <div className="h-8 w-px bg-border" />
            <StatPill value="27K+" label="Players" isString />
            <div className="h-8 w-px bg-border" />
            <StatPill value={eventCount} label="Events" />
          </div>
        </div>
      </section>

      {/* ═══════════════ #9: FEATURES (outcome-focused) ═══════════════ */}
      <section className="mt-12 sm:mt-20">
        <div className="page-container">
          <p className="section-label">What you get</p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              href="/network"
              accentColor="accent"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="3" />
                  <circle cx="5" cy="19" r="3" />
                  <circle cx="19" cy="19" r="3" />
                  <path d="M12 8v4m-4.5 3.5L10 13m4 0l2.5 3.5" />
                </svg>
              }
              title="Player Network"
              description="Find opponents near your level. See who anyone has played with."
            />
            <FeatureCard
              href="/rankings"
              accentColor="teal"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 21V11m4 10V7m4 14V3m-8 0h8" />
                </svg>
              }
              title="Power Rankings"
              description="See exactly where you stand out of 27K players. Updated weekly."
            />
            <FeatureCard
              href="/h2h"
              accentColor="amber"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3h5v5M4 20L21 3M8 21H3v-5m18 5L4 4" />
                </svg>
              }
              title="Head to Head"
              description="Settle the debate. Real W/L records with full set scores."
            />
            <FeatureCard
              href="/chat"
              accentColor="accent"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 10h.01M12 10h.01M16 10h.01" />
                </svg>
              }
              title="AI Coach"
              description="Ask anything about padel. Get answers backed by 100+ expert articles."
            />
          </div>
        </div>
      </section>

      {/* ═══════════════ #8: CLUB SCOUT REPORTS ═══════════════ */}
      <section className="mt-20 sm:mt-28">
        <div className="page-container">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="section-label">Top-rated clubs</p>
              <p className="text-sm text-muted mt-1">Data-driven scout reports for every club in Miami</p>
            </div>
            <Link href="/clubs" className="text-sm text-accent font-medium hover:underline">
              View all {topClubs.length > 6 ? "23" : topClubs.length} clubs
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topClubs.map((club) => (
              <Link
                key={club.slug}
                href={`/club/${club.slug}`}
                className="card group overflow-hidden"
              >
                {/* Club image */}
                <div className="relative aspect-[16/9] bg-surface overflow-hidden">
                  {club.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={club.image}
                      alt={club.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-accent-soft">
                      <span className="text-2xl font-bold text-accent">{club.name.charAt(0)}</span>
                    </div>
                  )}
                  {/* Score badge */}
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg backdrop-blur-sm text-sm font-bold ${
                    club.overallScore >= 7 ? "bg-green-500/20 text-green-700 dark:text-green-400" :
                    club.overallScore >= 5 ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" :
                    "bg-red-500/20 text-red-700 dark:text-red-400"
                  }`}>
                    {club.overallScore.toFixed(1)}/10
                  </div>
                  {/* Court count */}
                  <div className="absolute bottom-2 right-2 rounded-full bg-foreground/80 px-2.5 py-0.5 text-xs font-semibold text-background backdrop-blur-sm">
                    {club.courts.total} courts
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold group-hover:text-accent transition-colors">{club.name}</h3>
                  <p className="mt-0.5 text-xs text-muted">{club.city}, {club.state}</p>
                  {/* Quick stats */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                    <span className="font-medium text-foreground">{club.stats.totalPlayers.toLocaleString()}</span> players
                    <span className="text-border">|</span>
                    <span className="font-medium text-foreground">{club.stats.avgLevel.toFixed(1)}</span> avg level
                    {club.vibes[0] && (
                      <>
                        <span className="text-border">|</span>
                        <span>{club.vibes[0].icon} {club.vibes[0].label}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ #10: BOTTOM CTA ═══════════════ */}
      <section className="mt-20 sm:mt-28 mb-8">
        <div className="page-container">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-accent-hover px-6 py-12 sm:px-12 sm:py-16 text-center">
            {/* Decorative grid */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }} />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Ready to see where you rank?
              </h2>
              <p className="mt-3 text-white/80 max-w-md mx-auto">
                Search your name. Check your stats. Compare with anyone in the Miami padel scene.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <Link
                  href="/rankings"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-accent font-semibold text-sm hover:bg-white/90 transition-colors shadow-lg"
                >
                  Find your rank
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link
                  href="/clubs"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-colors backdrop-blur-sm"
                >
                  Explore clubs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function StatPill({
  value,
  label,
  isString = false,
}: {
  value: number | string;
  label: string;
  isString?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="stat-number text-xl font-bold text-foreground sm:text-2xl">
        {isString ? value : (value as number).toLocaleString()}
      </p>
      <p className="mt-0.5 text-xs text-muted font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}

function FeatureCard({
  href,
  icon,
  title,
  description,
  accentColor,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
}) {
  const bgMap: Record<string, string> = {
    accent: "var(--accent-soft)",
    teal: "var(--teal-soft)",
    amber: "rgba(217, 119, 6, 0.08)",
  };
  const colorMap: Record<string, string> = {
    accent: "var(--accent)",
    teal: "var(--teal)",
    amber: "var(--amber)",
  };

  return (
    <Link href={href} className="card group flex flex-col p-5 sm:p-6">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: bgMap[accentColor], color: colorMap[accentColor] }}
      >
        {icon}
      </div>
      <h3 className="mt-4 text-[15px] font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted leading-relaxed">{description}</p>
      <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
        Open
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
