/**
 * Enrich ALL players in players.json with profile photos.
 * Skips players who already have a photo.
 *
 * Usage: npx tsx scripts/enrich-photos-all.ts
 */

import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

const FILE = join(__dirname, "../../output/miami_network/players.json");
const CONCURRENCY = 25;
const DELAY_MS = 20;
const SAVE_EVERY = 2000;

interface PlayerRecord {
  user_id: string;
  name: string;
  picture: string | null;
  [key: string]: unknown;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const players: PlayerRecord[] = JSON.parse(readFileSync(FILE, "utf-8"));

  // Build a map for quick lookup (targets are indices into players array)
  const targetIndices: number[] = [];
  for (let i = 0; i < players.length; i++) {
    if (!players[i].picture) targetIndices.push(i);
  }

  const alreadyHave = players.length - targetIndices.length;
  console.log(
    `${alreadyHave.toLocaleString()} already have photos, fetching for ${targetIndices.length.toLocaleString()} remaining`,
  );

  let completed = 0;
  let found = 0;
  let failed = 0;

  for (let i = 0; i < targetIndices.length; i += CONCURRENCY) {
    const batchIndices = targetIndices.slice(i, i + CONCURRENCY);

    const results = await Promise.allSettled(
      batchIndices.map(async (idx) => {
        const p = players[idx];
        const res = await fetch(
          `https://api.playtomic.io/v2/users/${p.user_id}`,
          { headers: { Accept: "application/json" } },
        );
        if (!res.ok) return null;
        const data = (await res.json()) as { picture?: string | null };
        return { idx, picture: data.picture || null };
      }),
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        if (r.value.picture) {
          players[r.value.idx].picture = r.value.picture;
          found++;
        }
      } else if (r.status === "rejected") {
        failed++;
      }
    }

    completed += batchIndices.length;
    if (completed % 500 === 0 || completed === targetIndices.length) {
      console.log(
        `  ${completed.toLocaleString()}/${targetIndices.length.toLocaleString()} — ${found.toLocaleString()} new photos, ${failed} failed`,
      );
    }

    // Checkpoint save
    if (completed % SAVE_EVERY === 0) {
      writeFileSync(FILE, JSON.stringify(players, null, 2));
      console.log("  [checkpoint saved]");
    }

    if (i + CONCURRENCY < targetIndices.length) await sleep(DELAY_MS);
  }

  writeFileSync(FILE, JSON.stringify(players, null, 2));
  const totalPhotos = players.filter((p) => p.picture).length;
  console.log(
    `\n✓ Done — ${found.toLocaleString()} new photos (${totalPhotos.toLocaleString()} total of ${players.length.toLocaleString()}), ${failed} failed`,
  );
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
