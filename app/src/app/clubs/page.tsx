import type { Metadata } from "next";
import ClubDirectory from "./ClubDirectory";

const SITE_URL = "https://www.thepadelpassport.com";

export const metadata: Metadata = {
  title: "Club Directory - Every Padel Club in Miami",
  description:
    "Scout reports for every padel club in South Florida. Compare courts, amenities, player levels, pricing, and data-driven scores across 23 clubs.",
  openGraph: {
    title: "Padel Club Directory - Miami & South Florida",
    description:
      "Data-driven scout reports for 23 padel clubs. Player stats, court counts, amenities, pricing, and overall scores.",
    type: "website",
    url: `${SITE_URL}/clubs`,
  },
  alternates: { canonical: `${SITE_URL}/clubs` },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Miami Padel Club Directory",
  description:
    "Data-driven scout reports for every padel club in South Florida.",
  url: `${SITE_URL}/clubs`,
  isPartOf: { "@type": "WebSite", name: "Padel Passport", url: SITE_URL },
};

export default function ClubsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClubDirectory />
    </>
  );
}
