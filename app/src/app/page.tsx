import {
  getMiamiClubs,
  getMiamiEvents,
  padelCourtCount,
  type Tenant,
  type Tournament,
  type PadelClass,
} from "@/lib/playtomic";

// ---------------------------------------------------------------------------
// Page — server component, fetches live Playtomic data
// ---------------------------------------------------------------------------

export default async function Home() {
  // Phase 1: fetch clubs
  const clubs = await getMiamiClubs().catch(() => [] as Tenant[]);

  // Derived stats
  const totalCourts = clubs.reduce((sum, c) => sum + padelCourtCount(c), 0);
  const sortedClubs = [...clubs].sort(
    (a, b) => padelCourtCount(b) - padelCourtCount(a),
  );

  // Phase 2: fetch per-club tournaments + classes (needs clubs list)
  const { tournaments, classes } = await getMiamiEvents(sortedClubs);

  // Upcoming tournaments + classes
  const openTournaments = tournaments.slice(0, 12);
  const upcomingClasses = classes.slice(0, 8);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          <span className="text-sm font-bold uppercase tracking-[0.2em]">
            Padel Passport
          </span>
          <div className="flex items-center gap-4">
            <a
              href="/network"
              className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
            >
              Player Network
            </a>
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
              Miami
            </span>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="pb-12 pt-28 md:pb-20 md:pt-36">
        <div className="mx-auto max-w-7xl px-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Live data
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight md:text-7xl">
            Miami Padel
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
            The pulse of South Florida&apos;s fastest-growing racket sport.
            Real-time courts, open matches, and community stats.
          </p>

          {/* Stat counters */}
          <div className="mt-12 grid grid-cols-3 gap-4 md:gap-6">
            <StatCard value={clubs.length} label="Clubs" />
            <StatCard value={totalCourts} label="Courts" />
            <StatCard value={openTournaments.length} label="Events this week" />
          </div>
        </div>
      </section>

      {/* ── Clubs ──────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="Clubs" subtitle="Sorted by court count" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sortedClubs.slice(0, 12).map((club) => (
              <ClubCard key={club.tenant_id} club={club} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Tournaments ────────────────────────────────────────── */}
      {openTournaments.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-5">
            <SectionHeader
              title="Tournaments & Events"
              subtitle="Registration open — per-club data"
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {openTournaments.map((t) => (
                <TournamentCard key={t.tournament_id} tournament={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Classes & Clinics ──────────────────────────────────── */}
      {upcomingClasses.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-5">
            <SectionHeader
              title="Classes & Clinics"
              subtitle="Coaching sessions at Miami clubs"
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {upcomingClasses.map((c) => (
                <ClassCard key={c.academy_class_id} padelClass={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-10">
        <div className="mx-auto max-w-7xl px-5 text-center text-xs text-muted">
          Data powered by Playtomic&apos;s public API. Updated every 5 minutes.
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Components (co-located for v1)
// ---------------------------------------------------------------------------

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-3xl font-bold tabular-nums tracking-tight md:text-4xl">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

function ClubCard({ club }: { club: Tenant }) {
  const courts = padelCourtCount(club);
  const city = club.address?.city ?? "";
  const img = club.images?.[0];

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent/30">
      {/* Image / placeholder */}
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-800">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={club.tenant_name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl font-bold text-zinc-600">
            {club.tenant_name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold leading-snug">{club.tenant_name}</h3>
        {city && <p className="mt-0.5 text-sm text-muted">{city}</p>}

        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="tabular-nums text-muted">
            {courts} {courts === 1 ? "court" : "courts"}
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-accent text-xs font-medium">Active</span>
        </div>
      </div>
    </div>
  );
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const date = new Date(tournament.start_date);
  const spots =
    tournament.available_places ??
    tournament.registration_info?.available_places;
  const price = tournament.price; // e.g. "54 USD"

  return (
    <div className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent/30">
      <p className="font-medium leading-snug">{tournament.tournament_name}</p>
      <p className="mt-1 text-sm text-muted">
        {tournament.tenant?.tenant_name &&
          `${tournament.tenant.tenant_name} · `}
        {formatDateTime(date)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {price && (
          <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            ${parseFloat(price)}
          </span>
        )}
        {tournament.gender && (
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
            {tournament.gender}
          </span>
        )}
        {tournament.level_description && (
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs tabular-nums text-zinc-300">
            Lvl {tournament.level_description}
          </span>
        )}
        {spots != null && spots > 0 && (
          <span className="whitespace-nowrap text-xs text-muted">
            {spots} spots
          </span>
        )}
      </div>
    </div>
  );
}

function ClassCard({ padelClass }: { padelClass: PadelClass }) {
  const date = new Date(padelClass.start_date);
  const coachName = padelClass.coaches?.[0]?.name;
  const price = padelClass.registration_info?.price; // e.g. "225 USD"
  const courtName = padelClass.resource?.name;
  const courtType = padelClass.resource?.properties?.resource_type;
  const enrolled = padelClass.registration_info?.registrations?.length ?? 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium leading-snug">
            {padelClass.tenant.tenant_name}
          </p>
          <p className="mt-1 text-sm text-muted">
            {coachName && `Coach ${coachName} · `}
            {formatDateTime(date)}
          </p>
        </div>
        {price && (
          <span className="shrink-0 rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            ${parseFloat(price)}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
          {padelClass.type === "PRIVATE" ? "Private" : "Group"}
        </span>
        {courtName && (
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
            {courtName}
            {courtType && ` · ${courtType}`}
          </span>
        )}
        {enrolled > 0 && (
          <span className="text-xs text-muted">
            {enrolled} {enrolled === 1 ? "student" : "students"}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Date formatting helper
// ---------------------------------------------------------------------------

function formatDateTime(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
