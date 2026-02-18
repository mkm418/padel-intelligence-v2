"use client";

/**
 * Hero search bar with autocomplete dropdown.
 * Lets visitors immediately look up any player.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  name: string;
  level: number | null;
  matches: number;
  winRate: number | null;
}

export default function HeroSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Search with debounce
  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results?.slice(0, 6) ?? []);
        setIsOpen(true);
        setSelectedIdx(-1);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const goToPlayer = (id: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/player/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      goToPlayer(results[selectedIdx].id);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg mx-auto">
      <div className="relative">
        {/* Search icon */}
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-dim pointer-events-none"
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search any player by name..."
          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-surface border border-border text-foreground text-base
                     placeholder:text-dim shadow-lg shadow-black/5
                     focus:outline-none focus:border-accent/50 focus:shadow-accent/10
                     transition-all"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {results.map((p, i) => (
            <button
              key={p.id}
              onClick={() => goToPlayer(p.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                ${i === selectedIdx ? "bg-accent-soft" : "hover:bg-raised"}`}
            >
              {/* Initials avatar */}
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-accent">
                  {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted">
                  {p.matches} matches
                  {p.level != null && <span> · Level {p.level.toFixed(1)}</span>}
                  {p.winRate != null && <span> · {p.winRate}% WR</span>}
                </p>
              </div>
              <svg className="w-4 h-4 text-dim flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4l4 4-4 4" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full mt-2 w-full bg-surface border border-border rounded-xl shadow-lg p-4 z-50">
          <p className="text-sm text-muted text-center">No players found for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
