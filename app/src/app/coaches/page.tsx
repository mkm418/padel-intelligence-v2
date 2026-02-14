import type { Metadata } from "next";
import CoachDirectory from "./CoachDirectory";

export const metadata: Metadata = {
  title: "Coach Directory | Padel Passport",
  description:
    "Browse 127 padel coaches across 35+ Miami clubs. Search by name, filter by club, and find your perfect coach.",
};

export default function CoachesPage() {
  return <CoachDirectory />;
}
