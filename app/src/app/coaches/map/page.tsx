import type { Metadata } from "next";
import CoachMap from "./CoachMap";

const SITE_URL = "https://www.thepadelpassport.com";

export const metadata: Metadata = {
  title: "Coach Finder Map - Padel Coaches Across South Florida",
  description:
    "Find padel coaches on an interactive map of South Florida. Browse clubs from Miami to West Palm Beach and discover coaches near you.",
  openGraph: {
    title: "Coach Finder Map - Padel Coaches Across South Florida",
    description:
      "Interactive map of padel coaches across South Florida. Find coaches near you.",
    url: `${SITE_URL}/coaches/map`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/coaches/map` },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Padel Coach Finder Map",
  description:
    "Interactive map showing padel coaches at clubs across South Florida, from Miami to West Palm Beach.",
  url: `${SITE_URL}/coaches/map`,
  applicationCategory: "SportsApplication",
  operatingSystem: "Web",
  isPartOf: { "@type": "WebSite", name: "Padel Passport", url: SITE_URL },
};

export default function CoachMapPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CoachMap />
    </>
  );
}
