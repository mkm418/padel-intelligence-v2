import type { Metadata } from "next";
import PowerRankings from "./PowerRankings";

const SITE_URL = "https://www.thepadelpassport.com";

export const metadata: Metadata = {
  title: "Power Rankings - Miami Padel Player Leaderboard",
  description:
    "Live power rankings for 9,000+ Miami padel players. Filter by club, level, and streak. See who is on fire, rising stars, and level brackets.",
  openGraph: {
    title: "Power Rankings - Miami Padel Player Leaderboard",
    description:
      "Live power rankings for 9,000+ Miami padel players. Filter by club, level, and streak.",
    url: `${SITE_URL}/rankings`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/rankings` },
};

/* JSON-LD: CollectionPage for rankings */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Miami Padel Power Rankings",
  description:
    "Live leaderboard ranking 9,000+ padel players across 35+ Miami clubs by power score.",
  url: `${SITE_URL}/rankings`,
  isPartOf: { "@type": "WebSite", name: "Padel Passport", url: SITE_URL },
  about: {
    "@type": "SportsOrganization",
    name: "Miami Padel Community",
    sport: "Padel",
  },
};

export default function RankingsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PowerRankings />
    </>
  );
}
