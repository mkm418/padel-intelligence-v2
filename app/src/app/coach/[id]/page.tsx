import type { Metadata } from "next";
import CoachProfile from "./CoachProfile";

export const metadata: Metadata = {
  title: "Coach Profile | Padel Passport",
  description: "Coach stats, clubs, and teaching activity.",
};

export default async function CoachPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CoachProfile coachId={id} />;
}
