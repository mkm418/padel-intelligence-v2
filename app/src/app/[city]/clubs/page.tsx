import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCityBySlug, ENABLED_CITIES } from "@/lib/cities";
import ClubDirectory from "@/app/clubs/ClubDirectory";

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
    title: `Club Directory - Every Padel Club in ${city.name}`,
    description: `Scout reports and stats for padel clubs in ${city.name}.`,
    openGraph: {
      title: `Padel Club Directory - ${city.name}`,
      url: `${SITE_URL}/${slug}/clubs`,
    },
    alternates: { canonical: `${SITE_URL}/${slug}/clubs` },
  };
}

export default async function CityClubsPage({ params }: Props) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  // ClubDirectory currently only has data for Miami (hardcoded profiles)
  // For other cities, it'll show an empty state until club profiles are added
  return <ClubDirectory city={slug} />;
}
