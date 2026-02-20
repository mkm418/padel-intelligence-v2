import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCityBySlug, ENABLED_CITIES } from "@/lib/cities";
import TournamentFinder from "@/app/tournaments/TournamentFinder";

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
    title: `Tournaments & Classes - Padel Events in ${city.name}`,
    description: `Browse upcoming padel tournaments and classes in ${city.name}.`,
    openGraph: {
      title: `Tournaments & Classes - ${city.name} Padel`,
      url: `${SITE_URL}/${slug}/tournaments`,
    },
    alternates: { canonical: `${SITE_URL}/${slug}/tournaments` },
  };
}

export default async function CityTournamentsPage({ params }: Props) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  return <TournamentFinder city={slug} />;
}
