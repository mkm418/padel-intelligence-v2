/**
 * POST /api/subscribe
 *
 * Stores an email signup in Supabase. Optionally sends a welcome email via
 * Resend when RESEND_API_KEY is configured.
 *
 * Body: { email, source, playerId?, playerName? }
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/* ── Simple email validation ─────────────────────────────────── */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── Resend welcome email (skipped if no API key) ────────────── */
async function sendWelcomeEmail(email: string, playerName?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[subscribe] RESEND_API_KEY not set, skipping welcome email");
    return;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "Padel Passport <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: playerName
          ? `Welcome to Padel Passport, ${playerName.split(" ")[0]}!`
          : "Welcome to Padel Passport!",
        html: buildWelcomeHtml(playerName),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[subscribe] Resend error:", err);
    }
  } catch (e) {
    console.error("[subscribe] Failed to send welcome email:", e);
  }
}

/* ── Welcome email HTML ──────────────────────────────────────── */
function buildWelcomeHtml(playerName?: string): string {
  const greeting = playerName
    ? `Hey ${playerName.split(" ")[0]},`
    : "Hey there,";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0c0c0c;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:48px;height:48px;background:#E85A1C;border-radius:12px;line-height:48px;text-align:center;">
        <span style="color:white;font-weight:bold;font-size:24px;">P</span>
      </div>
    </div>
    
    <!-- Body -->
    <div style="background:#161616;border:1px solid #262626;border-radius:12px;padding:32px 24px;">
      <p style="color:#f5f5f5;font-size:16px;line-height:1.6;margin:0 0 16px;">
        ${greeting}
      </p>
      <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 16px;">
        ${playerName
          ? "You've claimed your profile on Padel Passport. You'll now get weekly rank updates and stat changes straight to your inbox."
          : "You're signed up for weekly Miami padel rankings and updates. Every Monday, you'll get the top movers, hot streaks, and your rank changes."
        }
      </p>
      <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 24px;">
        In the meantime, check out the live rankings:
      </p>
      <div style="text-align:center;">
        <a href="https://www.thepadelpassport.com/rankings" 
           style="display:inline-block;background:#E85A1C;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
          View Rankings
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <p style="color:#525252;font-size:12px;text-align:center;margin-top:24px;">
      Padel Passport &middot; The scoreboard for Miami padel
    </p>
  </div>
</body>
</html>`.trim();
}

/* ── POST handler ────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source, playerId, playerName } = body as {
      email?: string;
      source?: string;
      playerId?: string;
      playerName?: string;
    };

    // Validate
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (!source) {
      return NextResponse.json({ error: "Source required" }, { status: 400 });
    }

    // Insert into Supabase (upsert-like: ignore conflicts)
    const { error } = await supabase.from("signups").insert({
      email: email.toLowerCase().trim(),
      source,
      player_id: playerId || null,
      player_name: playerName || null,
    });

    // Handle duplicate gracefully
    if (error) {
      if (error.code === "23505") {
        // Already signed up
        return NextResponse.json({ ok: true, message: "Already subscribed!" });
      }
      console.error("[subscribe] DB error:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail(email, playerName);

    return NextResponse.json({ ok: true, message: "You're in!" });
  } catch (err) {
    console.error("[subscribe] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
