import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClubProfile, getAllClubProfiles } from "@/lib/club-profiles";
import ClubScoutReport from "./ClubScoutReport";

const SITE_URL = "https://www.thepadelpassport.com";

/** Pre-generate all club pages at build time */
export function generateStaticParams() {
  return getAllClubProfiles().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const club = getClubProfile(slug);
  if (!club) return { title: "Club Not Found" };

  return {
    title: `${club.name} - Scout Report & Stats`,
    description: `${club.name} scout report: ${club.stats.totalPlayers} players, avg level ${club.stats.avgLevel}, ${club.courts.total} courts. ${club.description}`,
    openGraph: {
      title: `${club.name} - Padel Club Scout Report`,
      description: `${club.stats.totalPlayers} players · Avg level ${club.stats.avgLevel} · ${club.courts.total} courts · ${club.city}, ${club.state}`,
      type: "article",
      url: `${SITE_URL}/club/${slug}`,
    },
    alternates: { canonical: `${SITE_URL}/club/${slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function ClubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = getClubProfile(slug);
  if (!club) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: club.name,
    description: club.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: club.address,
      addressLocality: club.city,
      addressRegion: club.state,
      postalCode: club.zip,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: club.lat,
      longitude: club.lng,
    },
    telephone: club.phone || undefined,
    url: club.website || `${SITE_URL}/club/${slug}`,
    sport: "Padel",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClubScoutReport club={club} />
    </>
  );
}
