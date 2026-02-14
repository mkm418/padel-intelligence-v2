/**
 * Refresh all player levels from the live Playtomic API.
 * Reads players.json, fetches current level for each, writes back.
 *
 * Usage:  npx tsx scripts/refresh-levels.ts
 */

import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

const API = "https://api.playtomic.io/v1";
const FILE = join(__dirname, "../../output/miami_network/players.json");
const CONCURRENCY = 15;
const DELAY_MS = 50;

interface PlayerRecord {
  user_id: string;
  name: string;
  level_value: number | null;
  level_confidence: number | null;
  [key: string]: unknown;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const players: PlayerRecord[] = JSON.parse(readFileSync(FILE, "utf-8"));
  console.log(`Loaded ${players.length.toLocaleString()} players`);

  let completed = 0;
  let updated = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < players.length; i += CONCURRENCY) {
    const batch = players.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async (p) => {
        try {
          const res = await fetch(`${API}/levels?user_id=${p.user_id}`, {
            headers: { Accept: "application/json" },
          });
          if (!res.ok) {
            failed++;
            return;
          }
          const data = (await res.json()) as {
            sport_id: string;
            level_value: number;
            level_confidence: number;
          }[];
          const padel = data.find((l) => l.sport_id === "PADEL");
          if (padel) {
            if (p.level_value !== padel.level_value) updated++;
            p.level_value = padel.level_value;
            p.level_confidence = padel.level_confidence;
          } else {
            // Player has no padel level on record
            p.level_value = null;
            p.level_confidence = null;
          }
        } catch {
          failed++;
        }
      }),
    );

    completed += batch.length;
    if (completed % 500 === 0 || completed === players.length) {
      console.log(
        `  ${completed}/${players.length} — ${updated} updated, ${failed} failed`,
      );
    }

    if (i + CONCURRENCY < players.length) await sleep(DELAY_MS);
  }

  // Write back
  writeFileSync(FILE, JSON.stringify(players, null, 2));
  console.log(
    `\n✓ Done — ${updated} levels changed, ${failed} failed, written to players.json`,
  );
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
