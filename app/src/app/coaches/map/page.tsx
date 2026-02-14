import type { Metadata } from "next";
import CoachMap from "./CoachMap";

export const metadata: Metadata = {
  title: "Coach Finder Map | Padel Passport",
  description:
    "Find padel coaches across South Florida on an interactive map. Browse clubs from Miami to West Palm Beach and discover coaches near you.",
};

export default function CoachMapPage() {
  return <CoachMap />;
}
