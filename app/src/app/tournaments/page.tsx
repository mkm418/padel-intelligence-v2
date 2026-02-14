import type { Metadata } from "next";
import TournamentFinder from "./TournamentFinder";

export const metadata: Metadata = {
  title: "Find Tournaments and Classes | Padel Passport",
  description:
    "Browse every upcoming padel tournament and class in Miami. Filter by club, day, level, and type. Plan your week on the court.",
};

export default function TournamentsPage() {
  return <TournamentFinder />;
}
