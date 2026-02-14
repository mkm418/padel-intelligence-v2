import type { Metadata } from "next";
import PlayerCard from "./PlayerCard";

export const metadata: Metadata = {
  title: "Player Card | Padel Passport",
  description:
    "Your padel stats, badges, and ranking in one shareable card.",
};

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlayerCard playerId={id} />;
}
