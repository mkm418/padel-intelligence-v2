"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { ENABLED_CITIES, getCitiesByCountry, type CityConfig } from "@/lib/cities";

/** Extract city slug from the current URL path (e.g. /madrid/rankings → "madrid") */
function getCityFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "miami";
  const slugs = new Set(ENABLED_CITIES.map((c) => c.slug));
  return slugs.has(segments[0]) ? segments[0] : "miami";
}

/** Build city-scoped nav items based on current city */
function buildNavItems(city: string) {
  return [
    { href: `/${city}`, label: "Home", exact: true },
    { href: "/pulse", label: "The Pulse", exact: false },
    { href: `/${city}/clubs`, label: "Clubs", exact: false },
    { href: `/${city}/tournaments`, label: "Play", exact: false },
    { href: `/${city}/network`, label: "Network", exact: false },
    { href: `/${city}/rankings`, label: "Rankings", exact: false },
    { href: "/h2h", label: "H2H", exact: false },
    { href: "/coaches", label: "Coaches", exact: false },
    { href: "/chat", label: "AI Coach", exact: false },
  ] as const;
}

export default function Nav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const closeMobile = () => setMobileOpen(false);

  const currentCity = getCityFromPath(pathname);
  const currentCityConfig = ENABLED_CITIES.find((c) => c.slug === currentCity) ?? ENABLED_CITIES[0];
  const NAV_ITEMS = buildNavItems(currentCity);
  const cityGroups = getCitiesByCountry();

  // Close city dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
    }
    if (cityOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [cityOpen]);

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="page-container flex h-14 items-center justify-between">
          {/* Wordmark + City Selector */}
          <div className="flex items-center gap-3">
            <Link href={`/${currentCity}`} className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white font-display text-xs font-bold">P</span>
              <span className="font-display text-[13px] font-bold tracking-[0.06em] uppercase text-foreground">
                Padel Passport
              </span>
            </Link>

            {/* City dropdown */}
            <div ref={cityRef} className="relative">
              <button
                onClick={() => setCityOpen(!cityOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-muted hover:text-foreground hover:bg-raised transition-colors border border-border"
              >
                <span>{currentCityConfig.flag}</span>
                <span className="hidden sm:inline">{currentCityConfig.name}</span>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className={`transition-transform ${cityOpen ? "rotate-180" : ""}`}>
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {cityOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 rounded-xl bg-surface border border-border shadow-xl py-2 z-50 max-h-80 overflow-y-auto">
                  {cityGroups.map((group) => (
                    <div key={group.country}>
                      <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-dim">
                        {group.flag} {group.country}
                      </p>
                      {group.cities.map((c: CityConfig) => (
                        <Link
                          key={c.slug}
                          href={`/${c.slug}`}
                          onClick={() => setCityOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors ${
                            c.slug === currentCity
                              ? "text-accent bg-accent-soft"
                              : "text-foreground hover:bg-raised"
                          }`}
                        >
                          <span>{c.name}</span>
                          {c.slug === currentCity && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-accent">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                    active
                      ? "text-accent bg-accent-soft"
                      : "text-muted hover:text-foreground hover:bg-raised"
                  }`}
                >
                  {label}
                </Link>
              );
            })}

            <div className="mx-2 h-5 w-px bg-border" />

            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-raised transition-colors"
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-foreground rounded-lg"
            >
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-foreground rounded-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="16" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden" style={{ background: "var(--background)" }}>
          <div className="page-container flex h-14 items-center justify-between border-b border-border">
            <Link href={`/${currentCity}`} onClick={closeMobile} className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white font-display text-xs font-bold">P</span>
              <span className="font-display text-[13px] font-bold tracking-[0.06em] uppercase text-foreground">
                Padel Passport
              </span>
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeMobile}
              className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-foreground"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Mobile city selector */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-dim mb-2">City</p>
            <div className="flex flex-wrap gap-2">
              {ENABLED_CITIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${c.slug}`}
                  onClick={closeMobile}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    c.slug === currentCity
                      ? "border-accent text-accent bg-accent-soft"
                      : "border-border text-muted hover:text-foreground hover:bg-raised"
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div className="flex flex-col px-5 pt-4">
            {NAV_ITEMS.map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobile}
                  className={`flex items-center px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${
                    active
                      ? "text-accent bg-accent-soft"
                      : "text-foreground hover:bg-raised"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 px-9 pb-8">
            <div className="border-t border-border pt-4">
              <p className="text-xs text-dim">{currentCityConfig.flag} {currentCityConfig.name}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
