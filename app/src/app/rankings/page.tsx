import type { Metadata } from "next";
import PowerRankings from "./PowerRankings";

export const metadata: Metadata = {
  title: "Power Rankings — Padel Passport",
  description: "Weekly power rankings for Miami padel players. See who's hot, rising stars, and level brackets.",
};

export default function RankingsPage() {
  return <PowerRankings />;
}
