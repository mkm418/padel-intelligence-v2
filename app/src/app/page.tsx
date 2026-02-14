import {
  getMiamiClubs,
  getMiamiEvents,
  padelCourtCount,
  type Tenant,
} from "@/lib/playtomic";
import Nav from "@/components/Nav";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Page: server component, fetches live Playtomic data
// ---------------------------------------------------------------------------

export default async function Home() {
  const clubs = await getMiamiClubs().catch(() => [] as Tenant[]);

  const totalCourts = clubs.reduce((sum, c) => sum + padelCourtCount(c), 0);
  const sortedClubs = [...clubs].sort(
    (a, b) => padelCourtCount(b) - padelCourtCount(a),
  );

  const { tournaments, classes } = await getMiamiEvents(sortedClubs);
  const openTournaments = tournaments.slice(0, 12);
  const upcomingClasses = classes.slice(0, 8);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* ───── Hero ───── */}
      <section className="hero-glow court-lines pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="page-container relative z-10 text-center">
          {/* Eyebrow badge */}
          <div className="flex justify-center mb-6">
            <span className="badge-accent">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
              </svg>
              Live data from {clubs.length} clubs
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-[1.05]">
            The scoreboard for
            <br />
            <span className="text-gradient-accent">Miami padel</span>
          </h1>

          <p className="mx-auto mt-6 max-w-md text-base text-muted sm:text-lg">
            {totalCourts} courts. Every match tracked. Find your rank,
            compare rivals, plan your week.
          </p>

          {/* Stats strip */}
          <div className="mx-auto mt-12 flex max-w-xl items-center justify-center gap-8 sm:gap-12">
            <StatPill value={clubs.length} label="Clubs" />
            <div className="h-8 w-px bg-border" />
            <StatPill value={totalCourts} label="Courts" />
            <div className="h-8 w-px bg-border" />
            <StatPill value="27K+" label="Players" isString />
            <div className="h-8 w-px bg-border" />
            <StatPill
              value={openTournaments.length + upcomingClasses.length}
              label="Events"
            />
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/network"
              className="btn-primary inline-flex items-center gap-2"
            >
              Explore the network
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10m0 0L9 4m4 4L9 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/rankings"
              className="btn-secondary inline-flex items-center gap-2"
            >
              View rankings
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section className="mt-8 sm:mt-16">
        <div className="page-container">
          <p className="section-label">What you can do</p>

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
              description="27K+ players. See who plays with who."
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
              description="Elo-based. Updated weekly."
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
              description="Real W/L records. Set scores."
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
              title="Coach AI"
              description="Ask anything. Data-backed answers."
            />
          </div>
        </div>
      </section>

      {/* ───── Clubs ───── */}
      <section className="mt-20 sm:mt-28">
        <div className="page-container">
          <div className="flex items-baseline justify-between">
            <p className="section-label">
              {clubs.length} clubs across Miami
            </p>
            <Link href="/tournaments" className="text-sm text-accent font-medium hover:underline">
              View all events
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedClubs.slice(0, 6).map((club) => (
              <ClubCard key={club.tenant_id} club={club} />
            ))}
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="mt-20 pb-8 sm:mt-28">
        <div className="page-container">
          <div className="divider" />
          <div className="mt-6 flex flex-col items-center gap-3 text-sm text-dim sm:flex-row sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} Padel Passport &middot; Data
              from Playtomic
            </p>
            <div className="flex gap-6">
              <Link href="/network" className="transition-colors hover:text-foreground">Network</Link>
              <Link href="/rankings" className="transition-colors hover:text-foreground">Rankings</Link>
              <Link href="/h2h" className="transition-colors hover:text-foreground">H2H</Link>
              <Link href="/chat" className="transition-colors hover:text-foreground">Coach</Link>
            </div>
          </div>
        </div>
      </footer>
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
  // Map color name to CSS variable for the icon background
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
          <path
            d="M3 8h10m0 0L9 4m4 4L9 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}

function ClubCard({ club }: { club: Tenant }) {
  const courts = padelCourtCount(club);
  const city = club.address?.city ?? "";
  const img = club.images?.[0];

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-[16/10] bg-surface">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={club.tenant_name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-accent-soft">
            <span className="text-2xl font-bold text-accent">
              {club.tenant_name.charAt(0)}
            </span>
          </div>
        )}
        {/* Court count pill */}
        <div className="absolute bottom-2 right-2 rounded-full bg-foreground/80 px-2.5 py-0.5 text-xs font-semibold text-background backdrop-blur-sm">
          {courts} {courts === 1 ? "court" : "courts"}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold">{club.tenant_name}</h3>
        {city && <p className="mt-0.5 text-xs text-muted">{city}</p>}
      </div>
    </div>
  );
}
