import { NextResponse } from "next/server";
import { getAllClubProfiles } from "@/lib/club-profiles";

export const revalidate = 3600; // cache for 1 hour

export async function GET() {
  try {
    const clubs = getAllClubProfiles();
    return NextResponse.json({ clubs, total: clubs.length });
  } catch (err) {
    console.error("[clubs] error:", err);
    return NextResponse.json({ error: "Failed to load clubs" }, { status: 500 });
  }
}
