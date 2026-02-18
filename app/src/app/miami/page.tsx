import type { Metadata } from "next";
import Link from "next/link";
import NewsletterSignup from "./NewsletterSignup";

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
                happening at street level: Ultra Padel just opened the
                largest US padel club in Midtown (11 courts). Ace Padel is
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

      {/* ══════════ NEW CLUBS ══════════ */}
      <section className="border-b border-border">
        <div className="page-container py-10 sm:py-14">
          <p className="section-label mb-2">Court Watch</p>
          <p className="text-sm text-muted mb-6">
            New clubs opening across South Florida. The court count keeps
            climbing.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {NEW_CLUBS.map((club) => (
              <div
                key={club.name}
                className="card p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{club.name}</h3>
                      {club.hot && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {club.neighborhood}
                    </p>
                  </div>
                  {club.courts && (
                    <div className="text-right shrink-0">
                      <p className="stat-number text-lg font-bold">
                        {club.courts}
                      </p>
                      <p className="text-[10px] text-dim uppercase tracking-wider">
                        Courts
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  <span className="font-semibold text-foreground">
                    {club.status}
                  </span>
                  {club.detail ? ` — ${club.detail}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ BY THE NUMBERS ══════════ */}
      <section className="border-b border-border bg-surface/50">
        <div className="page-container py-10 sm:py-14">
          <p className="section-label mb-6">By the Numbers</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PRO_INTEL.map((item) => (
              <div key={item.stat} className="text-center">
                <p className="stat-number text-2xl sm:text-3xl font-bold text-accent">
                  {item.stat}
                </p>
                <p className="mt-1 text-xs text-muted leading-snug max-w-[160px] mx-auto">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ GEAR INTEL ══════════ */}
      <section className="border-b border-border">
        <div className="page-container py-10 sm:py-14">
          <p className="section-label mb-2">Gear Intel</p>
          <p className="text-sm text-muted mb-6">
            What the pros are swinging and what you should know before buying.
          </p>

          {/* Racket grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <GearCard
              name="Nox AT10 Genius 18K"
              player="Agustin Tapia"
              tag="MOST VERSATILE"
              detail="Modular Weight Balance System lets you adjust mid-session. Dual Spin surface with 3D texture. The 2026 trend is customization."
            />
            <GearCard
              name="Bullpadel Hack 04"
              player="Paquito Navarro"
              tag="POWER"
              detail="CustomWeight system + Vibradrive anti-vibration. The weapon of choice for aggressive flat hitters."
            />
            <GearCard
              name="Adidas Metalbone 2026"
              player="Ale Galan"
              tag="CONTROL"
              detail="16K Carbon Aluminized face, Soft Performance EVA core. Octagonal structure for torsion resistance."
            />
            <GearCard
              name="Head Extreme Pro"
              player="Various ATP"
              tag="HEAVY HITTER"
              detail="Auxetic 2.0 + Power Foam. Torsion Control prevents frame twisting on high-velocity exchanges."
            />
            <GearCard
              name="Babolat Viper 3.0 JL"
              player="Juan Lebron"
              tag="EXPLOSIVE"
              detail="3K Carbon face, Hard EVA core. Built for overhead dominance. The Wolf's weapon."
            />
            <GearCard
              name="Wilson Bela Pro V3"
              player="Fernando Belasteguin"
              tag="LEGEND"
              detail="The GOAT's choice. $399. Balanced power-to-control ratio for all-court play."
            />
          </div>

          {/* 2026 trends callout */}
          <div className="mt-6 card p-5 sm:p-6 bg-accent-soft/50 border-accent/10">
            <p className="text-sm font-bold text-foreground mb-2">
              2026 Racket Trends to Watch
            </p>
            <ul className="space-y-1.5 text-xs text-muted">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold mt-px">1.</span>
                <span><strong className="text-foreground">Modular weighting</strong> is the biggest shift. Nox and Adidas let you adjust racket balance between games.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold mt-px">2.</span>
                <span><strong className="text-foreground">30mm extended handles</strong> are now standard (Nox, StarVie, Babolat) for better leverage on two-handed backhands.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold mt-px">3.</span>
                <span><strong className="text-foreground">Torsion control tech</strong> prevents frame twisting during power shots. Head and Bullpadel lead here.</span>
              </li>
            </ul>
          </div>

          {/* Shoe spotlight */}
          <div className="mt-4 card p-5 sm:p-6">
            <p className="text-sm font-bold text-foreground mb-2">
              Shoe Watch: What&apos;s Hot on Court
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="font-semibold text-foreground">Asics Gel Resolution X</p>
                <p className="text-muted mt-0.5">The #1 padel shoe worldwide. Dynawall lateral support, GEL cushioning. ~$160.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Adidas Crazyquick Boost</p>
                <p className="text-muted mt-0.5">Boost energy return for explosive movers. Best men&apos;s shoe of 2026.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Bullpadel Vertex Vibram</p>
                <p className="text-muted mt-0.5">Vibram sole = grip monster. Lightweight mesh. Padel-specific design.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Wilson Bela Tour</p>
                <p className="text-muted mt-0.5">360-degree padel-specific sole. Endofit for locked-in feel. Bela&apos;s pick.</p>
              </div>
            </div>
          </div>

          {/* Where to buy in Miami */}
          <div className="mt-4 card p-5 sm:p-6">
            <p className="text-sm font-bold text-foreground mb-3">
              Where to Buy Gear in Miami
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { name: "Padel Padel", area: "Miami", note: "Alex's shop. Best local service. Bullpadel, Nox, Adidas, Cork. Competitive pricing.", url: "https://padelpadel.us" },
                { name: "Open Padel Club Pro Shop", area: "Miramar", note: "Largest indoor club in USA. All top brands. Coached by 9x world champ Lasaigues.", url: "https://openpadel.club" },
                { name: "Casas Padel", area: "Aventura Mall", note: "Physical store + online. Also builds and installs courts.", url: "https://www.casaspadel.com" },
                { name: "I Am Beach Tennis", area: "NW 2nd Ave, Miami", note: "Padel + beach tennis gear. Authorized dealer for all brands. Local pickup available.", url: "https://iambeachtennis.com" },
                { name: "Wynwood Padel Pro Shop", area: "Wynwood", note: "In-club shop at the 8-court Wynwood facility. Rackets, shoes, apparel, and custom collabs.", url: "https://www.wynwoodpadelmiami.com" },
                { name: "World Tennis / Tennis Plaza", area: "Multiple locations", note: "3x Miami Herald Favorite. Padel section growing. Great for shoes.", url: "https://www.tennisplaza.com" },
              ].map((shop) => (
                <a
                  key={shop.name}
                  href={shop.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold group-hover:text-accent transition-colors">{shop.name}</p>
                    <p className="text-[10px] text-dim uppercase tracking-wider">{shop.area}</p>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">{shop.note}</p>
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
            <p className="text-sm font-bold text-foreground mb-3">
              People to Know in Miami Padel
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-accent">JD</div>
                <div>
                  <p className="text-sm font-semibold">Juan Martin Diaz</p>
                  <p className="text-xs text-muted">Chief Padel Officer at Reserve. 13 consecutive years as world #1. Argentine legend, now based in Miami.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-accent">AL</div>
                <div>
                  <p className="text-sm font-semibold">Alejandro Lasaigues</p>
                  <p className="text-xs text-muted">Head pro at Open Padel Club Miramar. 9x professional world champion. #1 world ranking holder.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-accent">DR</div>
                <div>
                  <p className="text-sm font-semibold">Diego Ramos</p>
                  <p className="text-xs text-muted">Personal coach to Arturo Coello. Former WPT top 30, Uruguay #1. Now available for private lessons at Reserve Miami.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-accent">GM</div>
                <div>
                  <p className="text-sm font-semibold">Gabi Meana</p>
                  <p className="text-xs text-muted">Reserve co-founder and Padel Director. Former tennis pro from Northern Spain, building the premium padel club model in the US.</p>
                </div>
              </div>
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
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <Link
                  href="/rankings"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-accent font-semibold text-sm hover:bg-white/90 transition-colors shadow-lg"
                >
                  Check your ranking
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

function GearCard({
  name,
  player,
  tag,
  detail,
}: {
  name: string;
  player: string;
  tag: string;
  detail: string;
}) {
  return (
    <div className="card p-4 sm:p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 text-accent">
          {tag}
        </span>
      </div>
      <h4 className="text-sm font-bold">{name}</h4>
      <p className="text-[10px] text-dim uppercase tracking-wider">
        Used by {player}
      </p>
      <p className="text-xs text-muted leading-relaxed flex-1">{detail}</p>
    </div>
  );
}
