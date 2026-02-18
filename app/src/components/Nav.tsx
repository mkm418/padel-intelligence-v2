"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/miami", label: "The Pulse" },
  { href: "/clubs", label: "Clubs" },
  { href: "/tournaments", label: "Play" },
  { href: "/network", label: "Network" },
  { href: "/rankings", label: "Rankings" },
  { href: "/h2h", label: "H2H" },
  { href: "/coaches", label: "Coaches" },
  { href: "/chat", label: "AI Coach" },
] as const;

export default function Nav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="page-container flex h-14 items-center justify-between">
          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white font-display text-xs font-bold">P</span>
            <span className="font-display text-[13px] font-bold tracking-[0.06em] uppercase text-foreground">
              Padel Passport
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
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

            {/* Divider */}
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

      {/* Mobile overlay — completely opaque, own stacking context */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden" style={{ background: "var(--background)" }}>
          {/* Top bar mirrors the nav layout */}
          <div className="page-container flex h-14 items-center justify-between border-b border-border">
            <Link href="/" onClick={closeMobile} className="flex items-center gap-2.5">
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

          {/* Nav links */}
          <div className="flex flex-col px-5 pt-6">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
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
              <p className="text-xs text-dim">Miami, FL</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
