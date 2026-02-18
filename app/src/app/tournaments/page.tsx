import type { Metadata } from "next";
import TournamentFinder from "./TournamentFinder";

const SITE_URL = "https://www.thepadelpassport.com";

export const metadata: Metadata = {
  title: "Tournaments & Classes - Find Padel Events in Miami",
  description:
    "Browse every upcoming padel tournament and class in Miami. Filter by club, day, level, and type. Plan your week on the court.",
  openGraph: {
    title: "Tournaments & Classes - Find Padel Events in Miami",
    description:
      "Every upcoming padel tournament and class in Miami. Filter by club, day, level, and type.",
    url: `${SITE_URL}/tournaments`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/tournaments` },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Miami Padel Tournaments & Classes",
  description:
    "Complete listing of upcoming padel tournaments and classes across 35+ Miami clubs.",
  url: `${SITE_URL}/tournaments`,
  isPartOf: { "@type": "WebSite", name: "Padel Passport", url: SITE_URL },
  about: {
    "@type": "SportsEvent",
    sport: "Padel",
    location: {
      "@type": "Place",
      name: "Miami, FL",
    },
  },
};

export default function TournamentsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TournamentFinder />
    </>
  );
}
