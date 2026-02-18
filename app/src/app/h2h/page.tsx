import type { Metadata } from "next";
import H2HComparison from "./H2HComparison";

const SITE_URL = "https://www.thepadelpassport.com";

export const metadata: Metadata = {
  title: "Head-to-Head - Compare Padel Players",
  description:
    "Compare any two Miami padel players side by side. Stats, mutual connections, win records, and rivalry tracker powered by real match data.",
  openGraph: {
    title: "Head-to-Head - Compare Padel Players",
    description:
      "Compare any two padel players side by side. Real stats, mutual connections, and rivalry tracker.",
    url: `${SITE_URL}/h2h`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/h2h` },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Padel Head-to-Head Comparison",
  description:
    "Compare any two Miami padel players side by side with real match data, stats, and mutual connections.",
  url: `${SITE_URL}/h2h`,
  applicationCategory: "SportsApplication",
  operatingSystem: "Web",
  isPartOf: { "@type": "WebSite", name: "Padel Passport", url: SITE_URL },
};

export default function H2HPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <H2HComparison />
    </>
  );
}
