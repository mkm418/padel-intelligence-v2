import type { Metadata } from "next";
import NetworkGraph from "./NetworkGraph";

const SITE_URL = "https://www.thepadelpassport.com";

export const metadata: Metadata = {
  title: "Player Network - Interactive Padel Connection Map",
  description:
    "Explore the interactive network graph of 27,000+ Miami padel players. See who plays with whom across 35+ clubs. Filter by club and skill level.",
  openGraph: {
    title: "Player Network - Interactive Padel Connection Map",
    description:
      "Interactive network graph of 27,000+ Miami padel players across 35+ clubs.",
    url: `${SITE_URL}/network`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/network` },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Padel Player Network",
  description:
    "Interactive force-directed graph visualizing 27,000+ Miami padel player connections across 35+ clubs.",
  url: `${SITE_URL}/network`,
  applicationCategory: "SportsApplication",
  operatingSystem: "Web",
  isPartOf: { "@type": "WebSite", name: "Padel Passport", url: SITE_URL },
};

export default function NetworkPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NetworkGraph />
    </>
  );
}
