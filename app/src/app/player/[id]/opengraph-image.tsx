/**
 * Dynamic OG image for player profile pages.
 * Generates a 1200x630 card with player name, level, tier, stats, and form.
 * Uses Next.js ImageResponse (Satori under the hood) for edge rendering.
 */

import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const alt = "Player Stats Card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Tier colors and labels
function getTier(level: number | null): {
  tier: string;
  color: string;
  bg: string;
} {
  if (level == null)
    return { tier: "Unranked", color: "#6b7280", bg: "#1f1f23" };
  if (level >= 6)
    return { tier: "Diamond", color: "#67e8f9", bg: "#0e2a3a" };
  if (level >= 5)
    return { tier: "Platinum", color: "#e2e8f0", bg: "#1e2330" };
  if (level >= 4) return { tier: "Gold", color: "#fbbf24", bg: "#2a2010" };
  if (level >= 3)
    return { tier: "Silver", color: "#94a3b8", bg: "#1c1f26" };
  if (level >= 2)
    return { tier: "Bronze", color: "#d97706", bg: "#2a1c0a" };
  return { tier: "Iron", color: "#78716c", bg: "#1c1a18" };
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch player data directly from Supabase at the edge
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  const { data: player } = await supabase
    .from("players")
    .select(
      "name, level_value, picture, matches_played, wins, losses, win_rate, clubs, first_match, last_match",
    )
    .eq("user_id", id)
    .single();

  if (!player) {
    // Fallback: generic card
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: "#111114",
            color: "#fff",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 48, fontWeight: 700 }}>Padel Passport</div>
            <div style={{ fontSize: 24, color: "#888", marginTop: 8 }}>
              Player not found
            </div>
          </div>
        </div>
      ),
      { ...size },
    );
  }

  const level = player.level_value;
  const tier = getTier(level);
  const matches = player.matches_played ?? 0;
  const wins = player.wins ?? 0;
  const losses = player.losses ?? 0;
  const wlTotal = wins + losses;
  const winRate =
    wlTotal >= 5 ? Math.round((wins / wlTotal) * 100) : null;
  const clubs = (player.clubs as string[]) ?? [];
  const name = player.name ?? "Unknown Player";
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#111114",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${tier.color}, ${tier.color}88, transparent)`,
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "48px 56px",
            flexDirection: "row",
            alignItems: "center",
            gap: 48,
          }}
        >
          {/* Left: Avatar + name */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              minWidth: 240,
            }}
          >
            {/* Avatar */}
            {player.picture ? (
              <img
                src={player.picture.replace("c_limit,w_1280", "c_fill,w_180,h_180")}
                width={160}
                height={160}
                style={{
                  borderRadius: 24,
                  border: `3px solid ${tier.color}44`,
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 24,
                  background: `${tier.color}15`,
                  border: `3px solid ${tier.color}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 56,
                  fontWeight: 700,
                  color: tier.color,
                }}
              >
                {initials}
              </div>
            )}

            {/* Tier badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 20,
                padding: "6px 16px",
                border: `1.5px solid ${tier.color}44`,
                background: `${tier.color}10`,
                fontSize: 14,
                fontWeight: 700,
                color: tier.color,
                letterSpacing: 2,
                textTransform: "uppercase" as const,
              }}
            >
              {tier.tier}
            </div>
          </div>

          {/* Right: Stats */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 24,
            }}
          >
            {/* Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 700,
                  color: "#ffffff",
                  lineHeight: 1.1,
                  letterSpacing: -1,
                }}
              >
                {name}
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: "#888",
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {clubs.length > 0 && (
                  <span>
                    {clubs.length} club{clubs.length !== 1 ? "s" : ""}
                  </span>
                )}
                {player.last_match && (
                  <span>
                    Last played{" "}
                    {new Date(player.last_match).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 20 }}>
              {/* Level */}
              {level != null && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    background: "#1a1a1f",
                    borderRadius: 16,
                    padding: "16px 28px",
                    border: "1px solid #2a2a30",
                    minWidth: 100,
                  }}
                >
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: tier.color,
                    }}
                  >
                    {level.toFixed(2)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#666",
                      textTransform: "uppercase" as const,
                      letterSpacing: 1.5,
                      marginTop: 2,
                    }}
                  >
                    Level
                  </div>
                </div>
              )}

              {/* Matches */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "#1a1a1f",
                  borderRadius: 16,
                  padding: "16px 28px",
                  border: "1px solid #2a2a30",
                  minWidth: 100,
                }}
              >
                <div
                  style={{ fontSize: 36, fontWeight: 700, color: "#ffffff" }}
                >
                  {matches}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#666",
                    textTransform: "uppercase" as const,
                    letterSpacing: 1.5,
                    marginTop: 2,
                  }}
                >
                  Matches
                </div>
              </div>

              {/* Win Rate */}
              {winRate != null && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    background: "#1a1a1f",
                    borderRadius: 16,
                    padding: "16px 28px",
                    border: "1px solid #2a2a30",
                    minWidth: 100,
                  }}
                >
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: winRate >= 55 ? "#4ade80" : "#ffffff",
                    }}
                  >
                    {winRate}%
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#666",
                      textTransform: "uppercase" as const,
                      letterSpacing: 1.5,
                      marginTop: 2,
                    }}
                  >
                    Win Rate
                  </div>
                </div>
              )}

              {/* W/L */}
              {wlTotal >= 5 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    background: "#1a1a1f",
                    borderRadius: 16,
                    padding: "16px 28px",
                    border: "1px solid #2a2a30",
                    minWidth: 100,
                  }}
                >
                  <div
                    style={{ fontSize: 36, fontWeight: 700, color: "#ffffff" }}
                  >
                    {wins}-{losses}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#666",
                      textTransform: "uppercase" as const,
                      letterSpacing: 1.5,
                      marginTop: 2,
                    }}
                  >
                    W / L
                  </div>
                </div>
              )}
            </div>

            {/* Branding footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: "#FF6B2C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                P
              </div>
              <span style={{ fontSize: 16, color: "#555", fontWeight: 600 }}>
                thepadelpassport.com
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
