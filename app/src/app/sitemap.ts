/**
 * Dynamic sitemap for Google/Bing crawling.
 * Fetches all players with 5+ matches (paginated) and all club slugs.
 * Regenerates every 24h via revalidate.
 */

import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 86400; // Regenerate daily

const SITE_URL = "https://www.thepadelpassport.com";
const PAGE_SIZE = 1000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/rankings`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/clubs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/network`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/h2h`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/coaches`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/tournaments`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/chat`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  if (!url || !key) return staticPages;

  const supabase = createClient(url, key);

  // Paginate through ALL players with 5+ matches
  const allPlayers: { user_id: string; last_match: string | null }[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from("players")
      .select("user_id, last_match")
      .gte("matches_played", 5)
      .order("matches_played", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (data && data.length > 0) {
      allPlayers.push(...data);
      offset += data.length;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  const playerPages: MetadataRoute.Sitemap = allPlayers.map((p) => ({
    url: `${SITE_URL}/player/${p.user_id}`,
    lastModified: p.last_match ? new Date(p.last_match) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Club slugs from club-profiles (distinct clubs already tracked)
  const { data: clubRows } = await supabase
    .from("players")
    .select("clubs")
    .not("clubs", "is", null)
    .limit(1000);

  const clubSet = new Set<string>();
  for (const row of clubRows ?? []) {
    for (const c of (row.clubs as string[]) ?? []) {
      clubSet.add(c.trim());
    }
  }

  const clubPages: MetadataRoute.Sitemap = Array.from(clubSet).map((name) => ({
    url: `${SITE_URL}/club/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...clubPages, ...playerPages];
}
