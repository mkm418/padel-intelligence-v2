import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCityBySlug, ENABLED_CITIES } from "@/lib/cities";
import NetworkGraph from "@/app/network/NetworkGraph";

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
    title: `Player Network - ${city.name} Padel Connection Map`,
    description: `Explore the interactive network graph of ${city.name} padel players. See who plays with whom.`,
    openGraph: {
      title: `Player Network - ${city.name} Padel`,
      url: `${SITE_URL}/${slug}/network`,
    },
    alternates: { canonical: `${SITE_URL}/${slug}/network` },
  };
}

export default async function CityNetworkPage({ params }: Props) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  return <NetworkGraph city={slug} />;
}
