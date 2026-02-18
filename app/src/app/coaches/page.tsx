import type { Metadata } from "next";
import CoachDirectory from "./CoachDirectory";

const SITE_URL = "https://www.thepadelpassport.com";

export const metadata: Metadata = {
  title: "Coach Directory - Find Padel Coaches in Miami",
  description:
    "Browse 127+ padel coaches across 35+ Miami clubs. Search by name, filter by club, compare experience levels, and find your perfect coach.",
  openGraph: {
    title: "Coach Directory - Find Padel Coaches in Miami",
    description:
      "Browse 127+ padel coaches across 35+ Miami clubs. Find your perfect coach.",
    url: `${SITE_URL}/coaches`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/coaches` },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Miami Padel Coach Directory",
  description:
    "Directory of 127+ padel coaches across 35+ Miami clubs with stats and profiles.",
  url: `${SITE_URL}/coaches`,
  isPartOf: { "@type": "WebSite", name: "Padel Passport", url: SITE_URL },
  about: {
    "@type": "SportsOrganization",
    name: "Miami Padel Coaches",
    sport: "Padel",
  },
};

export default function CoachesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CoachDirectory />
    </>
  );
}
