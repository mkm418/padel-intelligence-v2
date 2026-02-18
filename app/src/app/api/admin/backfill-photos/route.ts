/**
 * One-time backfill endpoint to fetch player profile photos
 * from Playtomic /v2/users/{id} and update Supabase.
 *
 * Usage: GET /api/admin/backfill-photos?offset=0&limit=2000
 * Protected by CRON_SECRET.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CONCURRENCY = 20;
const DELAY_MS = 25;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient(url, key) as any;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchUserPicture(userId: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://api.playtomic.io/v2/users/${userId}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.picture || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    const querySecret = req.nextUrl.searchParams.get("secret");
    if (auth !== `Bearer ${cronSecret}` && querySecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "2000");

  const supabase = getSupabase();

  // Get players missing photos
  const { data: players, error } = await supabase
    .from("players")
    .select("user_id")
    .is("picture", null)
    .gte("matches_played", 5)
    .order("matches_played", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!players || players.length === 0) {
    return NextResponse.json({ status: "done", message: "No more players to process" });
  }

  let found = 0;
  let notFound = 0;
  let errors = 0;

  // Process in concurrent batches
  for (let i = 0; i < players.length; i += CONCURRENCY) {
    const batch = players.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (p: { user_id: string }) => {
        const picture = await fetchUserPicture(p.user_id);
        return { user_id: p.user_id, picture };
      }),
    );

    // Batch update players that have pictures
    const updates = results.filter((r) => r.picture);
    for (const u of updates) {
      const { error: updateErr } = await supabase
        .from("players")
        .update({ picture: u.picture })
        .eq("user_id", u.user_id);
      if (updateErr) errors++;
      else found++;
    }
    notFound += results.filter((r) => !r.picture).length;

    if (i + CONCURRENCY < players.length) await sleep(DELAY_MS);
  }

  return NextResponse.json({
    status: "success",
    processed: players.length,
    photos_found: found,
    no_photo: notFound,
    errors,
    next_offset: offset + players.length,
  });
}
