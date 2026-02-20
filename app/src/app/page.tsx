import Link from "next/link";
import { ENABLED_CITIES } from "@/lib/cities";
import HeroSearch from "./HeroSearch";

export default function Home() {
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
              Now tracking {ENABLED_CITIES.length} cities worldwide
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-[1.05]">
            Every padel match.
            <br />
            <span className="text-gradient-accent">Every city. Tracked.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base text-muted sm:text-lg leading-relaxed">
            Stats, rankings, and player networks for padel players worldwide.
            Powered by real match data from Playtomic.
          </p>

          <div className="mt-8 sm:mt-10">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* City grid */}
      <section className="mt-12 sm:mt-20 mb-20">
        <div className="page-container">
          <p className="section-label mb-2">Choose your city</p>
          <p className="text-sm text-muted mb-8">
            Select a city to see local rankings, player networks, and club data.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ENABLED_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/${city.slug}`}
                className="card group p-5 flex flex-col items-start gap-3 hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-2xl">{city.flag}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold group-hover:text-accent transition-colors truncate">
                      {city.name}
                    </h3>
                    <p className="text-[11px] text-muted">{city.country}</p>
                  </div>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
