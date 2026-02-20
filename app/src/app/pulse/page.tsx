import type { Metadata } from "next";
import Link from "next/link";
import NewsletterSignup from "./NewsletterSignup";
import { getAllClubProfiles } from "@/lib/club-profiles";
import { coaches } from "@/data/coaches";

export const metadata: Metadata = {
  title: "The Miami Pulse | Your Weekly Padel Intel",
  description:
    "Everything happening in Miami padel this week. Pro tours, new clubs, local events, and the numbers that matter. No fluff.",
  keywords: [
    "Miami padel news",
    "padel newsletter",
    "Miami padel events",
    "Premier Padel Miami",
    "padel clubs Miami",
    "padel tournaments South Florida",
  ],
};

// ---------------------------------------------------------------------------
// Data: Feb 2026 Miami Padel Intel
// In production this would come from a CMS or Perplexity API call.
// ---------------------------------------------------------------------------

const ISSUE = {
  number: 1,
  date: "Feb 18, 2026",
  headline: "Miami is about to become the padel capital of America.",
};

const THIS_WEEK = [
  {
    date: "Feb 20",
    tag: "NETWORKING",
    title: "PadelX Boca Tournament",
    venue: "Padel X Boca Raton",
    detail: "Networking + padel mixer. $50-65/person. Limited spots.",
    url: "https://www.faccmiami.com/events/upcoming-events/e/event/tournament-padelx-boca-raton-1.html",
  },
  {
    date: "Feb 21",
    tag: "CHARITY",
    title: "Padel for a Purpose Pro-Am",
    venue: "Reserve Padel Miami",
    detail:
      "Pro players, celebrity matchups, open bar, live DJ. All proceeds to the Brady Hunter Foundation.",
    url: "https://www.eventbrite.com/e/padel-for-a-purpose-pro-am-charity-tournament-tickets-1982517185269",
  },
];

const COMING_SOON = [
  {
    date: "Mar 11",
    tag: "NETWORKING",
    title: "ACG South Florida Padel Classico",
    venue: "Reserve Padel Miami",
    detail: "3rd annual M&A community mixer. Cocktails, appetizers, DJ.",
  },
  {
    date: "Mar 22-29",
    tag: "PRO TOUR",
    title: "Miami Premier Padel P1",
    venue: "Miami Beach Convention Center",
    detail:
      "The biggest padel tournament in the US. 40 men's pairs, 28 women's. Tapia, Coello, Galan, Lebron. Tickets from $55.",
    url: "https://www.miamipremierpadel.com",
    hot: true,
  },
  {
    date: "Dec 3-6",
    tag: "LEAGUE",
    title: "Pro Padel League City's Cup Finals",
    venue: "Miami, FL",
    detail:
      "The PPL season finale comes to Miami for the first time. Five-event season ends here.",
  },
];

const NEW_CLUBS = [
  {
    name: "Ultra Padel Midtown",
    courts: 11,
    status: "Open now, permanent 8-court club under construction",
    neighborhood: "Midtown",
    hot: true,
  },
  {
    name: "Ace Padel",
    courts: 5,
    status: "Opening Q2 2026",
    neighborhood: "Coconut Grove",
    detail: "Playtomic-powered. Hybrid membership + pay-to-play.",
  },
  {
    name: "Smash Padel Courts",
    courts: 7,
    status: "Permit pending",
    neighborhood: "Doral",
    detail: "Converting a 36K sq ft warehouse into courts.",
  },
  {
    name: "Ultra Padel expansions",
    courts: null,
    status: "Announced",
    neighborhood: "South Beach + Brickell",
  },
];

const PRO_INTEL = [
  {
    stat: "770+",
    label: "padel courts in the US (and growing fast)",
  },
  {
    stat: "26",
    label: "Premier Padel tournaments across 18 countries in 2026",
  },
  {
    stat: "$2B+",
    label: "projected global padel market by end of 2026 (Deloitte)",
  },
  {
    stat: "25M+",
    label: "people play padel worldwide across 90 countries",
  },
];

const TAG_COLORS: Record<string, string> = {
  "PRO TOUR":
    "bg-accent/10 text-accent",
  CHARITY: "bg-teal/10 text-teal",
  NETWORKING: "bg-amber/10 text-amber",
  LEAGUE: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  NEW: "bg-accent/10 text-accent",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MiamiPulsePage() {
  const clubProfiles = getAllClubProfiles().slice(0, 8);

  // Top Miami coaches by class count (deduplicated by name)
  const seenCoachNames = new Set<string>();
  const topCoaches = coaches
    .filter((c) => {
      const isMiami = c.clubs.some((club) =>
        ["Miami", "Doral", "Miramar", "Aventura", "North Miami", "Miami Beach", "Hallandale Beach"].includes(club.city)
      );
      if (!isMiami || seenCoachNames.has(c.name)) return false;
      seenCoachNames.add(c.name);
      return true;
    })
    .sort((a, b) => b.stats.totalClasses - a.stats.totalClasses)
    .slice(0, 6);

  return (
    <div className="bg-background text-foreground">
      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Gradient wash */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, var(--accent-soft) 0%, transparent 70%)",
          }}
        />
        <div className="page-container relative z-10 pt-12 pb-14 sm:pt-20 sm:pb-20">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-6">
              <span className="badge-accent">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                </span>
                Issue #{ISSUE.number}
              </span>
              <span className="text-xs text-dim font-medium">
                {ISSUE.date}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
              The Miami{" "}
              <span className="text-gradient-accent">Pulse</span>
            </h1>
            <p className="mt-3 text-lg sm:text-xl text-muted max-w-lg leading-relaxed">
              Your weekly padel intel. No fluff. Just the events, the numbers,
              and the moves that matter.
            </p>

            {/* Subscribe inline */}
            <div className="mt-8">
              <NewsletterSignup />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ OPENING NOTE (Sam Parr style) ══════════ */}
      <section className="border-b border-border">
        <div className="page-container py-10 sm:py-14">
          <div className="max-w-2xl">
            <p className="section-label mb-4">The Big Picture</p>
            <div className="prose-editorial space-y-4 text-[15px] sm:text-base leading-relaxed text-foreground">
              <p>
                <strong>
                  {ISSUE.headline}
                </strong>
              </p>
              <p className="text-muted">
                Here&apos;s what most people miss: the Reserve Cup just brought
                Tapia, Coello, Galan, and Chingotto to a pop-up court on
                MacArthur Causeway. Night sessions. Water views. Sold out in
                hours.
              </p>
              <p className="text-muted">
                Next month, the Premier Padel P1 returns to Miami Beach
                Convention Center for year two. 68 pairs. 5 courts. The
                biggest padel tournament on American soil.
              </p>
              <p className="text-muted">
                And while the pros battle it out, the real story is what&apos;s
                happening at street level: <Link href="/club/ultra-padel-miami" className="text-accent hover:underline">Ultra Padel</Link> just
                opened the largest US padel club in Midtown (11 courts). Ace Padel is
                launching in Coconut Grove this spring. Doral is converting a
                36,000 sq ft warehouse into courts.
              </p>
              <p>
                <strong>
                  The sport grew 40% in the US last year. Miami is ground zero.
                </strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ THIS WEEK ══════════ */}
      <section className="border-b border-border">
        <div className="page-container py-10 sm:py-14">
          <p className="section-label mb-6">This Week in Miami Padel</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {THIS_WEEK.map((event) => (
              <EventCard key={event.title} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ COMING SOON ══════════ */}
      <section className="border-b border-border">
        <div className="page-container py-10 sm:py-14">
          <p className="section-label mb-2">On the Radar</p>
          <p className="text-sm text-muted mb-6">
            Mark your calendar. These are the dates that matter.
          </p>
          <div className="space-y-3">
            {COMING_SOON.map((event) => (
              <TimelineCard key={event.title} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CLUBS FROM OUR DATA ══════════ */}
      <section className="border-b border-border">
        <div className="page-container py-10 sm:py-14">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="section-label mb-2">Club Intel</p>
              <p className="text-sm text-muted">
                Scout reports on every Miami club. Data from 27K+ players.
              </p>
            </div>
            <Link href="/miami/clubs" className="text-sm text-accent font-medium hover:underline">
              All clubs
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {clubProfiles.map((club) => (
              <Link
                key={club.slug}
                href={`/club/${club.slug}`}
                className="card group overflow-hidden"
              >
                <div className="relative aspect-[16/10] bg-surface overflow-hidden">
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
                      <span className="text-xl font-bold text-accent">{club.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg backdrop-blur-sm text-xs font-bold ${
                    club.overallScore >= 7 ? "bg-green-500/20 text-green-700 dark:text-green-400" :
                    club.overallScore >= 5 ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" :
                    "bg-red-500/20 text-red-700 dark:text-red-400"
                  }`}>
                    {club.overallScore.toFixed(1)}/10
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-bold group-hover:text-accent transition-colors">{club.name}</h3>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                    <span className="font-medium text-foreground">{club.courts.total}</span> courts
                    <span className="text-border">|</span>
                    <span className="font-medium text-foreground">{club.stats.totalPlayers.toLocaleString()}</span> players
                    <span className="text-border">|</span>
                    <span>{club.stats.avgLevel.toFixed(1)} avg</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* New openings callout */}
          <div className="mt-6">
            <p className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-accent">Opening Soon</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {NEW_CLUBS.map((club) => (
                <div key={club.name} className="card p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{club.name}</h3>
                      {club.hot && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded">New</span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{club.neighborhood}</p>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      <span className="font-semibold text-foreground">{club.status}</span>
                      {club.detail ? ` — ${club.detail}` : ""}
                    </p>
                  </div>
                  {club.courts && (
                    <div className="text-right shrink-0">
                      <p className="stat-number text-lg font-bold">{club.courts}</p>
                      <p className="text-[10px] text-dim uppercase tracking-wider">Courts</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ TOP COACHES ══════════ */}
      <section className="border-b border-border">
        <div className="page-container py-10 sm:py-14">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="section-label mb-2">Coach Spotlight</p>
              <p className="text-sm text-muted">
                The most active coaches in Miami, ranked by classes taught.
              </p>
            </div>
            <Link href="/coaches" className="text-sm text-accent font-medium hover:underline">
              All coaches
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topCoaches.map((coach, i) => (
              <Link
                key={coach.coach_id}
                href={`/coach/${coach.coach_id}`}
                className="card p-4 group flex items-start gap-3"
              >
                <div className="relative shrink-0">
                  {coach.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coach.picture}
                      alt={coach.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                      {coach.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold group-hover:text-accent transition-colors truncate">{coach.name}</h3>
                  <p className="text-[10px] text-muted mt-0.5 truncate">
                    {coach.clubs.map((c) => c.name).join(", ")}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-[10px]">
                    <span className="font-semibold text-foreground">{coach.stats.totalClasses}</span>
                    <span className="text-muted">classes</span>
                    {coach.level && (
                      <>
                        <span className="text-border">|</span>
                        <span className="font-semibold text-foreground">{coach.level}</span>
                        <span className="text-muted">level</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOT TAKE ══════════ */}
      <section className="border-b border-border">
        <div className="page-container py-8 sm:py-10">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-6 sm:p-8">
            <div className="absolute top-3 right-4 text-6xl sm:text-8xl opacity-10 select-none">
              🔥
            </div>
            <div className="relative z-10 max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 mb-2">Hot Take</p>
              <p className="text-lg sm:text-xl font-bold text-white leading-snug">
                If you&apos;re still playing pickleball in Miami, you&apos;re missing the wave.
              </p>
              <p className="mt-3 text-sm text-white/60 leading-relaxed">
                Padel courts in the US crossed 770 this year. Miami alone added 30+ courts in the last 12 months. 
                The Premier Padel P1 is bringing Tapia, Coello, and Galan to Miami Beach next month.
                Pickleball doesn&apos;t have that. <Link href="/miami/rankings" className="text-amber-400 hover:underline">Check where you rank</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ BY THE NUMBERS ══════════ */}
      <section className="border-b border-border bg-surface/50">
        <div className="page-container py-10 sm:py-14">
          <p className="section-label mb-6">By the Numbers</p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {PRO_INTEL.map((item) => (
              <div key={item.stat} className="text-center">
                <p className="stat-number text-3xl sm:text-4xl font-bold text-accent">
                  {item.stat}
                </p>
                <p className="mt-1.5 text-xs text-muted leading-snug max-w-[160px] mx-auto">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {/* Countdown to Premier Padel P1 */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-accent/10 border border-accent/20">
              <span className="text-2xl">🏆</span>
              <div className="text-left">
                <p className="text-xs font-bold text-accent uppercase tracking-wider">Premier Padel P1 Miami</p>
                <p className="text-sm text-foreground font-semibold">March 22-29 at Miami Beach Convention Center</p>
              </div>
              <a
                href="https://www.miamipremierpadel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary !py-2 !px-4 !text-xs"
              >
                Get Tickets
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ GEAR INTEL ══════════ */}
      <section className="border-b border-border">
        <div className="page-container py-10 sm:py-14">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="section-label mb-2">Gear Intel</p>
              <p className="text-sm text-muted">
                What the pros swing. What you should buy. Links to every product.
              </p>
            </div>
            <a href="https://padelusa.com" target="_blank" rel="noopener noreferrer" className="text-xs text-accent font-medium hover:underline">
              Shop all gear
            </a>
          </div>

          {/* Racket grid with buy links */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Nox AT10 Genius 18K", player: "Agustin Tapia", tag: "EDITOR'S PICK", price: "$299", detail: "Modular Weight Balance System. Dual Spin 3D texture. The racket that defined 2026.", url: "https://padelusa.com/collections/nox", accent: "from-orange-500/20 to-red-500/10" },
              { name: "Bullpadel Hack 04", player: "Paquito Navarro", tag: "POWER", price: "$345", detail: "CustomWeight + Vibradrive anti-vibration. For aggressive flat hitters who want to end points fast.", url: "https://padelusa.com/collections/bullpadel", accent: "from-blue-500/20 to-indigo-500/10" },
              { name: "Adidas Metalbone 2026", player: "Ale Galan", tag: "CONTROL", price: "$435", detail: "16K Carbon Aluminized face. Octagonal structure for zero frame twist. Galan's weapon.", url: "https://padelusa.com/collections/adidas", accent: "from-slate-500/20 to-gray-500/10" },
              { name: "Head Extreme Pro", player: "Arturo Coello", tag: "HEAVY HITTER", price: "$374", detail: "Auxetic 2.0 + Power Foam. Torsion Control tech. The frame that won Riyadh P1.", url: "https://padelusa.com/collections/head", accent: "from-green-500/20 to-emerald-500/10" },
              { name: "Babolat Viper 3.0 JL", player: "Juan Lebron", tag: "EXPLOSIVE", price: "$369", detail: "3K Carbon face, Hard EVA core. Built for overhead dominance. The Wolf's signature.", url: "https://padelusa.com/collections/babolat", accent: "from-yellow-500/20 to-amber-500/10" },
              { name: "Wilson Bela Pro V3", player: "Fernando Belasteguin", tag: "THE GOAT'S PICK", price: "$399", detail: "The most decorated player in history chose this. Balanced power-to-control for all-court mastery.", url: "https://padelusa.com/collections/wilson", accent: "from-red-500/20 to-rose-500/10" },
            ].map((racket) => (
              <a
                key={racket.name}
                href={racket.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card group overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${racket.accent}`} />
                <div className="p-4 sm:p-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 text-accent">
                      {racket.tag}
                    </span>
                    <span className="text-sm font-bold text-foreground">{racket.price}</span>
                  </div>
                  <h4 className="text-sm font-bold group-hover:text-accent transition-colors">{racket.name}</h4>
                  <p className="text-[10px] text-dim uppercase tracking-wider">
                    {racket.player}&apos;s choice
                  </p>
                  <p className="text-xs text-muted leading-relaxed flex-1">{racket.detail}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    Shop now
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* 2026 trends callout */}
          <div className="mt-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] p-5 sm:p-6">
            <div className="absolute top-2 right-4 text-5xl opacity-10 select-none">🏓</div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-400 mb-3">
              2026 Racket Trends
            </p>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">1.</span>
                <span><strong className="text-white">Modular weighting</strong> is the biggest shift. Nox and Adidas let you adjust racket balance between games.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">2.</span>
                <span><strong className="text-white">30mm extended handles</strong> are now standard for better two-handed backhand leverage.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">3.</span>
                <span><strong className="text-white">Torsion control</strong> prevents frame twisting on power shots. Head and Bullpadel lead here.</span>
              </li>
            </ul>
          </div>

          {/* Shoe grid with buy links */}
          <div className="mt-6">
            <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              👟 Shoe Watch
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "Asics Gel Resolution X", price: "~$160", detail: "#1 padel shoe worldwide. Dynawall lateral support.", url: "https://padelusa.com/collections/padel-shoes" },
                { name: "Adidas Crazyquick Boost", price: "~$140", detail: "Boost energy return. Best men's shoe of 2026.", url: "https://padelusa.com/collections/padel-shoes" },
                { name: "Bullpadel Vertex Vibram", price: "~$130", detail: "Vibram sole grip monster. Padel-specific design.", url: "https://padelusa.com/collections/padel-shoes" },
                { name: "Wilson Bela Tour", price: "~$160", detail: "360-degree padel sole. Endofit for locked-in feel.", url: "https://padelusa.com/collections/padel-shoes" },
              ].map((shoe) => (
                <a
                  key={shoe.name}
                  href={shoe.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card p-3 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-xs text-foreground group-hover:text-accent transition-colors">{shoe.name}</p>
                  </div>
                  <p className="text-sm font-bold text-accent">{shoe.price}</p>
                  <p className="text-[11px] text-muted mt-1 leading-relaxed">{shoe.detail}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Where to buy in Miami */}
          <div className="mt-6">
            <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              🛒 Buy Gear in Miami
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { name: "Padel Padel", area: "Miami", note: "Best local service. All major brands.", url: "https://padelpadel.us" },
                { name: "Casas Padel", area: "Aventura Mall", note: "Walk-in store + online. Also installs courts.", url: "https://www.casaspadel.com" },
                { name: "Padel USA", area: "Online", note: "#1 US online store. Free shipping $99+.", url: "https://padelusa.com" },
                { name: "Wynwood Padel Shop", area: "Wynwood", note: "In-club. Rackets, shoes, apparel.", url: "https://www.wynwoodpadelmiami.com" },
                { name: "Tennis Plaza", area: "Multiple locations", note: "3x Miami Herald Favorite. Padel growing.", url: "https://www.tennisplaza.com" },
                { name: "I Am Beach Tennis", area: "NW 2nd Ave", note: "All brands. Local pickup available.", url: "https://iambeachtennis.com" },
              ].map((shop) => (
                <a
                  key={shop.name}
                  href={shop.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface border border-transparent hover:border-border transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold group-hover:text-accent transition-colors">{shop.name}</p>
                    <p className="text-[10px] text-muted">{shop.area} · {shop.note}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ COMMUNITY ══════════ */}
      <section className="border-b border-border">
        <div className="page-container py-10 sm:py-14">
          <p className="section-label mb-2">The Scene</p>
          <p className="text-sm text-muted mb-6">
            Where Miami&apos;s padel community actually lives online and off.
          </p>

          {/* Leagues & organized play */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-bold text-foreground">Leagues & Organized Play</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <a href="https://www.themiamipadelleague.com" target="_blank" rel="noopener noreferrer" className="card p-4 group">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 text-accent">
                    HOT
                  </span>
                  <h4 className="text-sm font-bold group-hover:text-accent transition-colors">Miami Padel League</h4>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  8-week league, all levels, all across Miami. Play on YOUR schedule. Divisions from beginner (0-2) to pro (6.5-7). WhatsApp community, league events, partner matching. $99-149/person.
                </p>
              </a>
              <a href="https://www.nationalpadelleague.us" target="_blank" rel="noopener noreferrer" className="card p-4 group">
                <h4 className="text-sm font-bold group-hover:text-accent transition-colors mb-2">National Padel League (NPL)</h4>
                <p className="text-xs text-muted leading-relaxed">
                  USA Team League, Corporate League, and Padel Concierge. National championship finals in Miami this December. Corporate team-building events available.
                </p>
              </a>
              <a href="https://propadelleague.com" target="_blank" rel="noopener noreferrer" className="card p-4 group">
                <h4 className="text-sm font-bold group-hover:text-accent transition-colors mb-2">Pro Padel League (PPL)</h4>
                <p className="text-xs text-muted leading-relaxed">
                  Pro circuit with 5 events in 2026: NYC, LA, Playa del Carmen, Guadalajara, and the City&apos;s Cup Finals in Miami (Dec 3-6). Top pros competing.
                </p>
              </a>
              <a href="https://padelteamleague.com" target="_blank" rel="noopener noreferrer" className="card p-4 group">
                <h4 className="text-sm font-bold group-hover:text-accent transition-colors mb-2">Padel Team League</h4>
                <p className="text-xs text-muted leading-relaxed">
                  Team-based padel competition. Growing presence in South Florida with regular seasons and playoffs.
                </p>
              </a>
            </div>
          </div>

          {/* Online communities */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-bold text-foreground">Where to Follow Online</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { platform: "Reddit", handle: "r/padel", note: "150K+ members. Game threads, gear reviews, city-specific pickup games.", url: "https://reddit.com/r/padel" },
                { platform: "Reddit", handle: "r/padelUSA", note: "US-focused. Club reviews, league info, gear questions.", url: "https://reddit.com/r/padelUSA" },
                { platform: "Instagram", handle: "@reservepadel", note: "Reserve Padel. Miami's premium club. Pro visits, event coverage.", url: "https://instagram.com/reservepadel" },
                { platform: "Instagram", handle: "@ultrapadelclub", note: "Ultra Padel. AI camera highlights, new clubs, events.", url: "https://instagram.com/ultrapadelclub" },
                { platform: "Instagram", handle: "@padwithissa", note: "Ysabella Affatato. Padel content creator, lessons, competitions.", url: "https://instagram.com/padwithissa" },
                { platform: "YouTube", handle: "The Bandeja", note: "US padel media. Gear reviews, tournament coverage, interviews.", url: "https://thebandeja.com" },
              ].map((item) => (
                <a
                  key={item.handle}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-teal">{item.platform.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold group-hover:text-accent transition-colors">{item.handle}</p>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">{item.note}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Notable figures */}
          <div className="card p-5 sm:p-6">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-sm font-bold text-foreground">
                People to Know in Miami Padel
              </p>
              <Link href="/coaches" className="text-xs text-accent font-medium hover:underline">
                All coaches
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-accent">JD</div>
                <div>
                  <p className="text-sm font-semibold">Juan Martin Diaz</p>
                  <p className="text-xs text-muted">Chief Padel Officer at Reserve. 13 consecutive years as world #1. Now based in Miami. <Link href="/club/open-padel-by-lasaigues" className="text-accent hover:underline">See his club</Link></p>
                </div>
              </div>
              <Link href="/coach/799330" className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-accent">MM</div>
                <div>
                  <p className="text-sm font-semibold group-hover:text-accent transition-colors">Mauricio Munoz</p>
                  <p className="text-xs text-muted">159 classes at <Link href="/club/open-padel-by-lasaigues" className="text-accent hover:underline">Open Padel by Lasaigues</Link>. One of Miami&apos;s most experienced padel coaches.</p>
                </div>
              </Link>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-accent">DR</div>
                <div>
                  <p className="text-sm font-semibold">Diego Ramos</p>
                  <p className="text-xs text-muted">Personal coach to Arturo Coello. Former WPT top 30, Uruguay #1. Private lessons at Reserve Miami.</p>
                </div>
              </div>
              <Link href="/coach/1879106" className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-accent">MM</div>
                <div>
                  <p className="text-sm font-semibold group-hover:text-accent transition-colors">Marta Morga Alonso</p>
                  <p className="text-xs text-muted">Level 6.0 coach at <Link href="/club/the-set" className="text-accent hover:underline">THE SET Doral</Link>. 69 classes, mix of private and group. Rising star.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PRO TOUR TICKER ══════════ */}
      <section className="border-b border-border">
        <div className="page-container py-10 sm:py-14">
          <p className="section-label mb-2">Pro Tour Intel</p>
          <p className="text-sm text-muted mb-6">
            What happened on the Premier Padel circuit this week.
          </p>

          <div className="card p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  Riyadh P1: Coello & Tapia Start 2026 with a Title
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  The world&apos;s #1 pair picked up right where they left off.
                  Arturo Coello and Agustin Tapia won the season opener in
                  Riyadh (Feb 9-14), the first event to use the new &quot;Star
                  Point&quot; scoring system. Max 3 deuces per game, then a
                  golden point decides it. Faster matches. More drama.
                </p>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--teal)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  2026 Tour: 26 Tournaments, 18 Countries
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  The full Premier Padel calendar dropped. New stops in London
                  and Pretoria. 75% of events will be indoors. Miami P1 is
                  March 22-29. Gijon P2 next up (Mar 2-8), then Cancun P2
                  (Mar 16-22) right before Miami.
                </p>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--amber)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  Reserve Cup Recap: Tapia & Coello Shine in Miami
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Jan 22-24 at the Seaplane Base. Night sessions on the water.
                  Team Jeter vs Team Butler format. Galan/Sanz beat
                  Chingotto/Leal in a super tiebreak thriller (6-7, 7-5,
                  10-6). Coello/Stupaczuk cruised past Tapia/Yanguas 6-4,
                  6-3. The event doesn&apos;t count for rankings, but it
                  confirmed Miami is a must-stop for the world&apos;s best.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ BOTTOM CTA ══════════ */}
      <section className="py-14 sm:py-20">
        <div className="page-container">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-accent-hover px-6 py-12 sm:px-12 sm:py-16 text-center">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Don&apos;t miss the next issue.
              </h2>
              <p className="mt-3 text-white/80 max-w-md mx-auto">
                Every Tuesday. The events, the openings, the pro results, and
                the local scene intel. Straight to your inbox.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/miami/rankings"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-accent font-semibold text-sm hover:bg-white/90 transition-colors shadow-lg"
                >
                  Check your ranking
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="/miami/clubs" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-colors backdrop-blur-sm">
                  Explore clubs
                </Link>
                <Link href="/coaches" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-colors backdrop-blur-sm">
                  Find a coach
                </Link>
                <Link href="/h2h" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-colors backdrop-blur-sm">
                  H2H matchups
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

function EventCard({
  event,
}: {
  event: {
    date: string;
    tag: string;
    title: string;
    venue: string;
    detail: string;
    url?: string;
    hot?: boolean;
  };
}) {
  const inner = (
    <div className="card p-5 sm:p-6 h-full flex flex-col group">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${TAG_COLORS[event.tag] || "bg-surface text-muted"}`}
        >
          {event.tag}
        </span>
        <span className="text-xs text-dim">{event.date}</span>
        {event.hot && (
          <span className="ml-auto text-[10px] font-bold text-accent">
            HOT
          </span>
        )}
      </div>
      <h3 className="text-base font-bold group-hover:text-accent transition-colors">
        {event.title}
      </h3>
      <p className="text-xs text-muted mt-1">{event.venue}</p>
      <p className="text-sm text-muted mt-3 leading-relaxed flex-1">
        {event.detail}
      </p>
      {event.url && (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent">
          Details
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8h10m0 0L9 4m4 4L9 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </div>
  );

  if (event.url) {
    return (
      <a href={event.url} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return inner;
}

function TimelineCard({
  event,
}: {
  event: {
    date: string;
    tag: string;
    title: string;
    venue: string;
    detail: string;
    url?: string;
    hot?: boolean;
  };
}) {
  const content = (
    <div
      className={`card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 group ${event.hot ? "border-accent/30" : ""}`}
    >
      {/* Date pill */}
      <div className="shrink-0 sm:w-24 sm:text-center">
        <span className="stat-number text-sm font-bold text-foreground">
          {event.date}
        </span>
      </div>

      <div className="h-px sm:h-8 sm:w-px bg-border shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${TAG_COLORS[event.tag] || "bg-surface text-muted"}`}
          >
            {event.tag}
          </span>
          <h3 className="text-sm font-bold group-hover:text-accent transition-colors truncate">
            {event.title}
          </h3>
          {event.hot && (
            <span className="text-[10px] font-bold text-accent animate-pulse">
              MUST SEE
            </span>
          )}
        </div>
        <p className="text-xs text-muted mt-1">{event.venue}</p>
        <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">
          {event.detail}
        </p>
      </div>

      {/* Arrow */}
      {event.url && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 text-dim group-hover:text-accent transition-colors hidden sm:block"
        >
          <path
            d="M3 8h10m0 0L9 4m4 4L9 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );

  if (event.url) {
    return (
      <a href={event.url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return content;
}

