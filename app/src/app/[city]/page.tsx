import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCityBySlug, ENABLED_CITIES } from "@/lib/cities";
import { supabase } from "@/lib/supabase";
import HeroSearch from "@/app/HeroSearch";

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return ENABLED_CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return {};

  const SITE_URL = "https://www.thepadelpassport.com";
  return {
    title: `${city.name} Padel Stats, Rankings & Player Network`,
    description: `Track padel stats, compare players, and climb the power rankings in ${city.name}. Powered by real match data.`,
    openGraph: {
      title: `Padel Passport ${city.name}`,
      description: `The scoreboard for ${city.name} padel.`,
      url: `${SITE_URL}/${city.slug}`,
    },
    alternates: { canonical: `${SITE_URL}/${city.slug}` },
  };
}

export default async function CityPage({ params }: Props) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  // Fetch city stats from Supabase
  const [{ count: playerCount }, { count: matchCount }, { data: clubData }] = await Promise.all([
    supabase.from("players").select("*", { count: "exact", head: true }).eq("city", slug),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("city", slug),
    supabase.from("matches").select("club_name").eq("city", slug),
  ]);

  const uniqueClubs = new Set((clubData ?? []).map((r: { club_name: string }) => r.club_name));
  const players = playerCount ?? 0;
  const matches = matchCount ?? 0;
  const clubs = uniqueClubs.size;

  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="hero-glow court-lines pt-10 pb-16 sm:pt-16 sm:pb-24">
        <div className="page-container relative z-10 text-center">
          <div className="flex justify-center mb-5">
            <span className="badge-accent">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
              </span>
              {players > 0 ? `Tracking ${players.toLocaleString()} players across ${clubs} clubs` : `Coming soon to ${city.name}`}
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-[1.05]">
            Every padel match in {city.name}.
            <br />
            <span className="text-gradient-accent">Tracked.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base text-muted sm:text-lg leading-relaxed">
            {players > 0
              ? `Look up any player. See exactly where you rank against ${players.toLocaleString()} others.`
              : `We're syncing ${city.name} padel data. Check back soon for full rankings and stats.`}
          </p>

          {players > 0 && (
            <div className="mt-8 sm:mt-10">
              <HeroSearch />
              <p className="text-xs text-dim mt-3">
                or <Link href={`/${slug}/rankings`} className="text-accent hover:underline font-medium">browse the full rankings</Link>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Stat bar */}
      <section className="border-y border-border bg-surface/50">
        <div className="page-container py-6">
          <div className="flex items-center justify-center gap-8 sm:gap-16">
            <StatPill value={clubs} label="Clubs" />
            <div className="h-8 w-px bg-border" />
            <StatPill value={players > 1000 ? `${Math.round(players / 1000)}K+` : String(players)} label="Players" isString />
            <div className="h-8 w-px bg-border" />
            <StatPill value={matches > 1000 ? `${Math.round(matches / 1000)}K+` : String(matches)} label="Matches" isString />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mt-12 sm:mt-20">
        <div className="page-container">
          <p className="section-label">What you get</p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard href={`/${slug}/network`} title="Player Network" description={`See who plays with whom across ${city.name} clubs.`} />
            <FeatureCard href={`/${slug}/rankings`} title="Power Rankings" description={`See where you stand among ${players.toLocaleString()} players.`} />
            <FeatureCard href="/h2h" title="Head to Head" description="Real W/L records with full set scores." />
            <FeatureCard href="/chat" title="AI Coach" description="Ask anything about padel. Expert-backed answers." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20 sm:mt-28 mb-8">
        <div className="page-container">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-accent-hover px-6 py-12 sm:px-12 sm:py-16 text-center">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }} />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Ready to see where you rank?
              </h2>
              <p className="mt-3 text-white/80 max-w-md mx-auto">
                Search your name. Check your stats. Compare with anyone in {city.name}.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <Link
                  href={`/${slug}/rankings`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-accent font-semibold text-sm hover:bg-white/90 transition-colors shadow-lg"
                >
                  Find your rank
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link
                  href={`/${slug}/clubs`}
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

function StatPill({ value, label, isString = false }: { value: number | string; label: string; isString?: boolean }) {
  return (
    <div className="text-center">
      <p className="stat-number text-xl font-bold text-foreground sm:text-2xl">
        {isString ? value : (value as number).toLocaleString()}
      </p>
      <p className="mt-0.5 text-xs text-muted font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}

function FeatureCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="card group flex flex-col p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold">{title}</h3>
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
