/**
 * Bundle knowledge base markdown files into a single JSON import.
 *
 * Usage:  npx tsx scripts/bundle-knowledge-base.ts
 * Output: src/data/knowledge-base.json
 *
 * This file gets imported by the RAG system at build time,
 * so it works on Vercel without file system access.
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const KB_ROOT = join(__dirname, "../../output/knowledge_base");
const OUT_FILE = join(__dirname, "../src/data/knowledge-base.json");

interface KBEntry {
  filename: string;
  category: string;
  title: string;
  subcategory: string;
  difficulty: string;
  tags: string[];
  content: string;
}

function parseFrontmatter(raw: string): {
  metadata: Record<string, string>;
  content: string;
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { metadata: {}, content: raw };

  const metadata: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      metadata[key] = value;
    }
  }
  return { metadata, content: match[2] };
}

const entries: KBEntry[] = [];
const categories = readdirSync(KB_ROOT);

for (const category of categories) {
  const catPath = join(KB_ROOT, category);
  if (!statSync(catPath).isDirectory()) continue;

  const files = readdirSync(catPath).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const raw = readFileSync(join(catPath, file), "utf-8");
    const { metadata, content } = parseFrontmatter(raw);

    entries.push({
      filename: file,
      category: metadata.category || category,
      title: metadata.title || file.replace(".md", ""),
      subcategory: metadata.subcategory || "",
      difficulty: metadata.difficulty || "Intermediate",
      tags: (metadata.tags || "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      content,
    });
  }
}

// Write output
mkdirSync(join(__dirname, "../src/data"), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(entries, null, 0));

console.log(`Bundled ${entries.length} docs into src/data/knowledge-base.json`);
console.log(`Size: ${(readFileSync(OUT_FILE).length / 1024).toFixed(0)} KB`);
