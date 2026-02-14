"use client";

/**
 * Coach Profile — full page view for an individual coach.
 * Displays hero, stats, clubs, teaching activity, and quick facts.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";

// ── Types ────────────────────────────────────────────────────────────────

interface CoachData {
  coach_id: string;
  name: string;
  picture: string | null;
  level: number | null;
  is_premium: boolean;
  language: string | null;
  clubs: { name: string; city: string }[];
  stats: {
    totalClasses: number;
    privateClasses: number;
    groupClasses: number;
    firstClass: string | null;
    lastClass: string | null;
  };
  classClubs: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

function levelColor(level: number | null): string {
  if (level == null) return "var(--muted)";
  if (level >= 6) return "var(--teal)";
  if (level >= 5) return "#8b5cf6";
  if (level >= 4) return "var(--amber)";
  if (level >= 3) return "#22c55e";
  if (level >= 2) return "#3b82f6";
  return "var(--muted)";
}

function levelLabel(level: number | null): {
  label: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
} {
  if (level == null)
    return {
      label: "Unrated",
      textClass: "text-muted",
      bgClass: "bg-surface",
      borderClass: "border-border",
    };
  if (level >= 6)
    return {
      label: "Elite",
      textClass: "text-teal",
      bgClass: "bg-teal/5",
      borderClass: "border-teal/30",
    };
  if (level >= 5)
    return {
      label: "Advanced+",
      textClass: "text-[#8b5cf6]",
      bgClass: "bg-[#8b5cf6]/5",
      borderClass: "border-[#8b5cf6]/30",
    };
  if (level >= 4)
    return {
      label: "Advanced",
      textClass: "text-amber",
      bgClass: "bg-amber/5",
      borderClass: "border-amber/30",
    };
  if (level >= 3)
    return {
      label: "Intermediate",
      textClass: "text-win",
      bgClass: "bg-win/5",
      borderClass: "border-win/30",
    };
  if (level >= 2)
    return {
      label: "Developing",
      textClass: "text-[#3b82f6]",
      bgClass: "bg-[#3b82f6]/5",
      borderClass: "border-[#3b82f6]/30",
    };
  return {
    label: "Beginner",
    textClass: "text-muted",
    bgClass: "bg-surface",
    borderClass: "border-border",
  };
}

function formatLanguage(lang: string | null): string {
  if (!lang) return "Not specified";
  const map: Record<string, string> = {
    en: "English",
    en_US: "English",
    en_GB: "English",
    en_ES: "English / Spanish",
    en_MA: "English / Arabic",
    en_MX: "English / Spanish",
    en_CL: "English / Spanish",
    es: "Spanish",
    es_ES: "Spanish",
    es_US: "Spanish / English",
    es_AR: "Spanish",
    es_MX: "Spanish",
    es_419: "Spanish",
    fr_FR: "French",
    fr_US: "French / English",
  };
  return map[lang] ?? lang.split("_")[0].charAt(0).toUpperCase() + lang.split("_")[0].slice(1);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthYear(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.charAt(0).toUpperCase();
}

// ── Loading Skeleton ─────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <div className="page-container pt-20 pb-16">
        <div className="mb-6">
          <div className="h-4 w-32 animate-pulse rounded bg-surface" />
        </div>
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="h-[200px] w-[200px] animate-pulse rounded-full bg-surface" />
          <div className="h-8 w-56 animate-pulse rounded bg-surface" />
          <div className="flex gap-2">
            <div className="h-7 w-20 animate-pulse rounded-full bg-surface" />
            <div className="h-7 w-24 animate-pulse rounded-full bg-surface" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export default function CoachProfile({ coachId }: { coachId: string }) {
  const [data, setData] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/coach/${coachId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [coachId]);

  if (loading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="card max-w-sm p-8 text-center">
            <p className="font-display text-lg font-semibold text-loss">
              Coach not found
            </p>
            <p className="mt-2 text-sm text-muted">
              This coach may not exist or data is unavailable.
            </p>
            <Link
              href="/coaches"
              className="btn-primary mt-5 inline-block text-sm"
            >
              Browse all coaches
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { stats } = data;
  const ll = levelLabel(data.level);
  const privatePercent =
    stats.totalClasses > 0
      ? Math.round((stats.privateClasses / stats.totalClasses) * 100)
      : 0;
  const groupPercent = 100 - privatePercent;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <div className="page-container pt-20 pb-16">
        {/* ── Back link */}
        <div className="mb-6">
          <Link
            href="/coaches"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-accent transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Coaches
          </Link>
        </div>

        {/* ── Hero Section */}
        <div className="card overflow-hidden">
          <div className="hero-glow relative p-6 sm:p-8">
            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Photo */}
              <div className="relative mb-5">
                {data.picture ? (
                  <Image
                    src={data.picture.replace("c_limit,w_1280", "c_fill,w_200,h_200")}
                    alt={data.name}
                    width={200}
                    height={200}
                    className="rounded-full border-4 border-border object-cover"
                    style={{ width: 200, height: 200 }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center rounded-full border-4 border-border font-display text-5xl font-bold"
                    style={{
                      width: 200,
                      height: 200,
                      background: levelColor(data.level) + "15",
                      color: levelColor(data.level),
                    }}
                  >
                    {getInitials(data.name)}
                  </div>
                )}

                {/* Level overlay */}
                {data.level != null && (
                  <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-lg px-3 py-1 text-sm font-bold font-display ring-2 ring-background"
                    style={{
                      background: levelColor(data.level),
                      color: "#1a1a1a",
                    }}
                  >
                    {data.level.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Name */}
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {data.name}
              </h1>

              {/* Badges */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] font-display ${ll.textClass} ${ll.bgClass} ${ll.borderClass}`}
                >
                  {ll.label}
                </span>
                {data.is_premium && (
                  <span className="rounded-full border border-amber/30 bg-amber/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] font-display text-amber">
                    Premium
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Row */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Classes" value={stats.totalClasses} />
          <StatCard label="Private Lessons" value={stats.privateClasses} />
          <StatCard label="Group Classes" value={stats.groupClasses} />
          <StatCard
            label="Teaching Since"
            value={formatMonthYear(stats.firstClass)}
          />
        </div>

        {/* ── Clubs Section */}
        {data.clubs.length > 0 && (
          <div className="mt-10">
            <h2 className="section-label mb-4">Where They Teach</h2>
            <div className="flex flex-wrap gap-2">
              {data.clubs.map((club) => (
                <span
                  key={`${club.name}-${club.city}`}
                  className="rounded-full bg-surface border border-border px-4 py-2 text-sm font-medium text-foreground"
                >
                  {club.name}
                  <span className="ml-1.5 text-muted">{club.city}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Teaching Activity Section */}
        <div className="mt-10">
          <h2 className="section-label mb-4">Teaching Activity</h2>
          <div className="card p-5 sm:p-6">
            {/* Date range */}
            <div className="mb-5 flex items-center justify-between text-sm">
              <span className="text-muted">
                {stats.firstClass ? formatDate(stats.firstClass) : "-"}
              </span>
              <span className="mx-3 h-px flex-1 bg-border" />
              <span className="text-muted">
                {stats.lastClass ? formatDate(stats.lastClass) : "-"}
              </span>
            </div>

            {/* Stacked bar */}
            {stats.totalClasses > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-accent">
                    Private {privatePercent}%
                  </span>
                  <span className="font-medium text-teal">
                    Group {groupPercent}%
                  </span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-raised">
                  {privatePercent > 0 && (
                    <div
                      className="h-full bg-accent transition-all duration-700"
                      style={{ width: `${privatePercent}%` }}
                    />
                  )}
                  {groupPercent > 0 && (
                    <div
                      className="h-full bg-teal transition-all duration-700"
                      style={{ width: `${groupPercent}%` }}
                    />
                  )}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                    {stats.privateClasses} private
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-teal" />
                    {stats.groupClasses} group
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Facts */}
        <div className="mt-10">
          <h2 className="section-label mb-4">Quick Facts</h2>
          <div className="card divide-y divide-border">
            <FactRow label="Language" value={formatLanguage(data.language)} />
            <FactRow label="Last Active" value={formatDate(stats.lastClass)} />
            <FactRow
              label="Clubs"
              value={`${data.clubs.length} location${data.clubs.length !== 1 ? "s" : ""}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="card p-4 text-center">
      <p className="stat-number text-2xl font-bold text-foreground">{value}</p>
      <p className="section-label mt-1">{label}</p>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
