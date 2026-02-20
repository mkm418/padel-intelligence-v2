import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCityBySlug, ENABLED_CITIES } from "@/lib/cities";
import PowerRankings from "@/app/rankings/PowerRankings";

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
    title: `Power Rankings - ${city.name} Padel Player Leaderboard`,
    description: `Live power rankings for ${city.name} padel players. Filter by club, level, and streak.`,
    openGraph: {
      title: `Power Rankings - ${city.name} Padel`,
      description: `Live power rankings for ${city.name} padel players.`,
      url: `${SITE_URL}/${slug}/rankings`,
    },
    alternates: { canonical: `${SITE_URL}/${slug}/rankings` },
  };
}

export default async function CityRankingsPage({ params }: Props) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  return <PowerRankings city={slug} />;
}
