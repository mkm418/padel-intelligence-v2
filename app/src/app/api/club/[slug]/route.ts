import { NextRequest, NextResponse } from "next/server";
import { getClubProfile } from "@/lib/club-profiles";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const club = getClubProfile(slug);

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  return NextResponse.json(club);
}
