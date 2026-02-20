import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

/* ── Typography ─────────────────────────────────────────────── */
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/* ── Site-wide constants ────────────────────────────────────── */
const SITE_NAME = "Padel Passport";
const SITE_URL = "https://www.thepadelpassport.com";
const SITE_DESCRIPTION =
  "The global padel scoreboard. Track stats, compare players head-to-head, explore player networks, and climb the power rankings across cities worldwide.";

/* ── Metadata ───────────────────────────────────────────────── */
export const metadata: Metadata = {
  /* Title template: pages set their own title, appended with " | Padel Passport" */
  title: {
    default: "Padel Passport | Global Padel Stats, Rankings & Player Network",
    template: "%s | Padel Passport",
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),

  /* Favicons & icons */
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",

  /* Open Graph */
  openGraph: {
    title: "Padel Passport",
    description: "The global padel scoreboard. Stats, rankings, and player networks worldwide.",
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Padel Passport - The scoreboard for Miami padel",
      },
    ],
  },

  /* Twitter / X */
  twitter: {
    card: "summary_large_image",
    title: "Padel Passport",
    description: "The global padel scoreboard. Stats, rankings, and player networks worldwide.",
    images: ["/og-image.svg"],
  },

  /* SEO */
  keywords: [
    "padel Miami",
    "padel rankings",
    "padel stats",
    "Miami padel clubs",
    "padel player network",
    "padel head to head",
    "padel tournaments Miami",
    "padel coaches Miami",
    "padel league",
    "padel scores",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  /* Robots */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  /* Alternates */
  alternates: {
    canonical: SITE_URL,
  },

  /* Other */
  category: "sports",
};

/* ── JSON-LD: WebSite schema (site-wide) ────────────────────── */
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon-512.png`,
      width: 512,
      height: 512,
    },
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/rankings?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

/* ── Root Layout ────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#E85A1C" />
        {/* Prevent flash of wrong theme on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        {/* Site-wide JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${dmSans.variable} antialiased`}
      >
        <ThemeProvider>
          <Nav />
          {/* Spacer for fixed nav */}
          <div className="h-14" />
          <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
