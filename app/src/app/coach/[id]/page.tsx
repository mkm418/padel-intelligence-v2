import type { Metadata } from "next";
import CoachProfile from "./CoachProfile";

const SITE_URL = "https://www.thepadelpassport.com";

export const metadata: Metadata = {
  title: "Coach Profile - Stats, Clubs & Teaching Activity",
  description:
    "View padel coach stats, clubs, class breakdown, and teaching activity. Find the right coach for your level.",
  openGraph: {
    title: "Coach Profile - Stats, Clubs & Teaching Activity",
    description:
      "Padel coach profile with stats, clubs, and teaching activity breakdown.",
    type: "profile",
  },
  robots: { index: true, follow: true },
};

export default async function CoachPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CoachProfile coachId={id} />;
}
