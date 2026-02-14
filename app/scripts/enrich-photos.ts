/**
 * Enrich players.json with profile photos from Playtomic v2 user API.
 * Only fetches for players with 5+ matches to keep API calls reasonable.
 *
 * Usage: npx tsx scripts/enrich-photos.ts
 */

import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

const FILE = join(__dirname, "../../output/miami_network/players.json");
const CONCURRENCY = 20;
const DELAY_MS = 30;

interface PlayerRecord {
  user_id: string;
  name: string;
  picture: string | null;
  matches_played: number;
  [key: string]: unknown;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const players: PlayerRecord[] = JSON.parse(readFileSync(FILE, "utf-8"));
  // Only fetch for players with enough matches to be worth it
  const targets = players.filter((p) => p.matches_played >= 5);
  console.log(
    `Fetching photos for ${targets.length.toLocaleString()} players (5+ matches) out of ${players.length.toLocaleString()} total`,
  );

  let completed = 0;
  let found = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async (p) => {
        try {
          const res = await fetch(
            `https://api.playtomic.io/v2/users/${p.user_id}`,
            { headers: { Accept: "application/json" } },
          );
          if (!res.ok) {
            failed++;
            return;
          }
          const data = (await res.json()) as { picture?: string };
          if (data.picture) {
            p.picture = data.picture;
            found++;
          }
        } catch {
          failed++;
        }
      }),
    );

    completed += batch.length;
    if (completed % 500 === 0 || completed === targets.length) {
      console.log(
        `  ${completed}/${targets.length} — ${found} photos found, ${failed} failed`,
      );
    }

    if (i + CONCURRENCY < targets.length) await sleep(DELAY_MS);
  }

  writeFileSync(FILE, JSON.stringify(players, null, 2));
  console.log(
    `\n✓ Done — ${found} photos added, ${failed} failed, written to players.json`,
  );
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
