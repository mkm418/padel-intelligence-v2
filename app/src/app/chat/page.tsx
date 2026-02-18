import type { Metadata } from "next";
import ChatUI from "./ChatUI";

const SITE_URL = "https://www.thepadelpassport.com";

export const metadata: Metadata = {
  title: "AI Coach - Ask Anything About Padel",
  description:
    "AI-powered padel coach grounded in 100 expert articles. Ask about technique, strategy, rules, equipment, and more. Get instant answers.",
  openGraph: {
    title: "AI Coach - Ask Anything About Padel",
    description:
      "AI-powered padel coach. Ask about technique, strategy, rules, and more.",
    url: `${SITE_URL}/chat`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/chat` },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Padel AI Coach",
  description:
    "AI-powered padel coaching assistant grounded in 100 expert articles about technique, strategy, rules, and equipment.",
  url: `${SITE_URL}/chat`,
  applicationCategory: "SportsApplication",
  operatingSystem: "Web",
  isPartOf: { "@type": "WebSite", name: "Padel Passport", url: SITE_URL },
};

export default function ChatPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ChatUI />
    </>
  );
}
