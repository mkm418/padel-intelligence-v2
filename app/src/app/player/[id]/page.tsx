import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import PlayerCard from "./PlayerCard";

const SITE_URL = "https://www.thepadelpassport.com";

/** Fetch player name + stats for dynamic metadata */
async function getPlayer(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key);
  const { data } = await supabase
    .from("players")
    .select("name, level_value, matches_played, win_rate, wins, losses")
    .eq("user_id", id)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const player = await getPlayer(id);

  if (!player) {
    return {
      title: "Player Profile - Padel Passport",
      description: "View padel player stats, rankings, and match history.",
    };
  }

  const name = player.name;
  const level = player.level_value ? `Level ${player.level_value.toFixed(2)}` : "";
  const matches = player.matches_played ?? 0;
  const wlTotal = (player.wins ?? 0) + (player.losses ?? 0);
  const winRate = wlTotal >= 5 ? Math.round(((player.wins ?? 0) / wlTotal) * 100) : null;

  const statParts = [level, `${matches} matches`, winRate != null ? `${winRate}% win rate` : ""].filter(Boolean);
  const description = `${name}'s padel stats: ${statParts.join(", ")}. View full match history, partner analytics, form streak, and rankings.`;

  return {
    title: `${name} - Padel Stats & Rankings | Padel Passport`,
    description,
    openGraph: {
      title: `${name} - Padel Stats`,
      description,
      type: "profile",
      url: `${SITE_URL}/player/${id}`,
      siteName: "Padel Passport",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} - Padel Stats`,
      description,
    },
    robots: { index: true, follow: true },
    alternates: { canonical: `${SITE_URL}/player/${id}` },
  };
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlayerCard playerId={id} />;
}
