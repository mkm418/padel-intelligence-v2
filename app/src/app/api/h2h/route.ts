/**
 * GET /api/h2h?p1=userId1&p2=userId2
 *
 * Head-to-head comparison between two players.
 * Returns stats, mutual connections, overlapping clubs, and direct connection info.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const p1Id = req.nextUrl.searchParams.get("p1");
  const p2Id = req.nextUrl.searchParams.get("p2");

  if (!p1Id || !p2Id) {
    return NextResponse.json({ error: "Both p1 and p2 required" }, { status: 400 });
  }

  // Fetch both players
  const { data: players, error } = await supabase
    .from("players")
    .select("*")
    .in("user_id", [p1Id, p2Id]);

  if (error || !players || players.length < 2) {
    return NextResponse.json({ error: "One or both players not found" }, { status: 404 });
  }

  const p1 = players.find((p) => p.user_id === p1Id)!;
  const p2 = players.find((p) => p.user_id === p2Id)!;

  // Direct connection between them
  const { data: directEdge } = await supabase
    .from("edges")
    .select("*")
    .or(
      `and(source.eq.${p1Id},target.eq.${p2Id}),and(source.eq.${p2Id},target.eq.${p1Id})`,
    )
    .limit(1)
    .maybeSingle();

  // Get connections for both players
  const { data: p1Edges } = await supabase
    .from("edges")
    .select("source, target, weight, relationship")
    .or(`source.eq.${p1Id},target.eq.${p1Id}`)
    .order("weight", { ascending: false })
    .limit(500);

  const { data: p2Edges } = await supabase
    .from("edges")
    .select("source, target, weight, relationship")
    .or(`source.eq.${p2Id},target.eq.${p2Id}`)
    .order("weight", { ascending: false })
    .limit(500);

  // Build connection sets
  const p1Connections = new Set<string>();
  for (const e of p1Edges ?? []) {
    p1Connections.add(e.source === p1Id ? e.target : e.source);
  }

  const p2Connections = new Set<string>();
  for (const e of p2Edges ?? []) {
    p2Connections.add(e.source === p2Id ? e.target : e.source);
  }

  // Mutual connections (people who played with both)
  const mutualIds = [...p1Connections].filter((id) => p2Connections.has(id));

  // Resolve mutual connection names
  let mutualPlayers: { id: string; name: string; level: number | null; picture: string | null }[] = [];
  if (mutualIds.length > 0) {
    const { data: mutuals } = await supabase
      .from("players")
      .select("user_id, name, level_value, picture")
      .in("user_id", mutualIds.slice(0, 20));

    mutualPlayers = (mutuals ?? []).map((m) => ({
      id: m.user_id,
      name: m.name,
      level: m.level_value,
      picture: m.picture,
    }));
  }

  // Overlapping clubs
  const p1Clubs = new Set(p1.clubs ?? []);
  const p2Clubs = new Set(p2.clubs ?? []);
  const sharedClubs = [...p1Clubs].filter((c) => p2Clubs.has(c));

  // Stat comparison helper
  function compare(label: string, v1: number | null, v2: number | null, format?: string) {
    return {
      label,
      p1: v1,
      p2: v2,
      winner: v1 == null || v2 == null ? null : v1 > v2 ? "p1" : v1 < v2 ? "p2" : "tie",
      format: format ?? "number",
    };
  }

  const comparisons = [
    compare("Level", p1.level_value, p2.level_value),
    compare("Matches Played", p1.matches_played, p2.matches_played),
    compare("Win Rate", p1.win_rate, p2.win_rate, "percent"),
    compare("Wins", p1.wins, p2.wins),
    compare("Losses", p1.losses, p2.losses),
    compare("Sets Won", p1.sets_won, p2.sets_won),
    compare("Games Won", p1.games_won, p2.games_won),
    compare("Unique Teammates", p1.unique_teammates, p2.unique_teammates),
    compare("Unique Opponents", p1.unique_opponents, p2.unique_opponents),
    compare("Competitive Matches", p1.competitive_matches, p2.competitive_matches),
    compare("Clubs Played At", p1.clubs?.length ?? 0, p2.clubs?.length ?? 0),
  ];

  // Who "wins" more categories
  let p1Wins = 0;
  let p2Wins = 0;
  for (const c of comparisons) {
    if (c.winner === "p1") p1Wins++;
    if (c.winner === "p2") p2Wins++;
  }

  return NextResponse.json({
    p1: {
      id: p1.user_id,
      name: p1.name,
      level: p1.level_value,
      picture: p1.picture,
      clubs: p1.clubs,
    },
    p2: {
      id: p2.user_id,
      name: p2.name,
      level: p2.level_value,
      picture: p2.picture,
      clubs: p2.clubs,
    },
    directConnection: directEdge
      ? {
          weight: directEdge.weight,
          relationship: directEdge.relationship,
          lastPlayed: directEdge.last_played,
        }
      : null,
    comparisons,
    score: { p1: p1Wins, p2: p2Wins },
    mutualConnections: mutualPlayers,
    mutualCount: mutualIds.length,
    sharedClubs,
    p1TotalConnections: p1Connections.size,
    p2TotalConnections: p2Connections.size,
  });
}
