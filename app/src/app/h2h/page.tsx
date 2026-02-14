import type { Metadata } from "next";
import H2HComparison from "./H2HComparison";

export const metadata: Metadata = {
  title: "Settle the Score | Head-to-Head | Padel Passport",
  description:
    "Compare any two padel players side by side. Stats, mutual connections, and rivalry tracker.",
};

export default function H2HPage() {
  return <H2HComparison />;
}
