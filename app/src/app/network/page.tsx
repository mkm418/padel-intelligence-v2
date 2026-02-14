import type { Metadata } from "next";
import NetworkGraph from "./NetworkGraph";

export const metadata: Metadata = {
  title: "Player Network | Padel Passport",
  description:
    "Interactive map of every padel player in Miami. See who plays with whom across 40+ clubs.",
};

/**
 * /network: full-screen interactive force-directed graph of the Miami
 * padel player network. Data sourced from exhaustive Playtomic scrape.
 */
export default function NetworkPage() {
  return <NetworkGraph />;
}
