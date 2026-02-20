/**
 * Fan-out sync: triggers sync for all enabled cities sequentially.
 * Called by Vercel Cron daily. Calls /api/cron/sync?city=X for each city.
 */

import { NextResponse } from "next/server";
import { ENABLED_CITIES } from "@/lib/cities";

export const maxDuration = 300; // 5 min max for fan-out

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow Vercel Cron (sends authorization header) or local dev
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const isVercelCron = request.headers.get("x-vercel-cron") === "true";
    if (!isVercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const baseUrl = new URL(request.url).origin;
  const results: { city: string; status: string; duration_ms?: number; error?: string }[] = [];

  for (const city of ENABLED_CITIES) {
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}/api/cron/sync?city=${city.slug}`, {
        headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
      });
      const data = await res.json();
      results.push({
        city: city.slug,
        status: data.status ?? (res.ok ? "success" : "error"),
        duration_ms: Date.now() - start,
        ...(data.error && { error: data.error }),
      });
    } catch (err) {
      results.push({
        city: city.slug,
        status: "error",
        duration_ms: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const succeeded = results.filter((r) => r.status === "success").length;

  return NextResponse.json({
    status: "complete",
    total: ENABLED_CITIES.length,
    succeeded,
    failed: ENABLED_CITIES.length - succeeded,
    results,
  });
}
