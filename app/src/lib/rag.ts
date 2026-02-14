/**
 * Padel Knowledge Base - RAG Retrieval Engine
 *
 * Uses a pre-bundled JSON knowledge base (built by scripts/bundle-knowledge-base.ts).
 * No file system access needed, works on Vercel serverless.
 *
 * Scoring: TF-IDF-style with keyword frequency, metadata boosts, and title matching.
 */

import kbData from "@/data/knowledge-base.json";

/* ── Types ──────────────────────────────────────────────────── */

export interface KBDocument {
  filename: string;
  category: string;
  title: string;
  subcategory: string;
  difficulty: string;
  tags: string[];
  content: string;
}

/* ── Load bundled knowledge base ────────────────────────────── */

let documentCache: KBDocument[] | null = null;

export async function loadKnowledgeBase(): Promise<KBDocument[]> {
  if (documentCache) return documentCache;

  documentCache = kbData as KBDocument[];
  console.log(`[RAG] Loaded ${documentCache.length} knowledge base documents (bundled)`);
  return documentCache;
}

/* ── Tokenizer ──────────────────────────────────────────────── */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-záéíóúñü0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/* ── Scorer ─────────────────────────────────────────────────── */

function scoreDocument(query: string, doc: KBDocument): number {
  const queryTokens = tokenize(query);
  const titleTokens = tokenize(doc.title);
  const tagSet = new Set(doc.tags);
  const contentLower = doc.content.toLowerCase();

  let score = 0;

  for (const token of queryTokens) {
    // Title match (x5)
    if (titleTokens.includes(token)) score += 5;

    // Tag match (x3)
    if (tagSet.has(token)) score += 3;

    // Category/subcategory match (x2)
    if (doc.category.toLowerCase().includes(token)) score += 2;
    if (doc.subcategory.toLowerCase().includes(token)) score += 2;

    // Content frequency (capped at 10 hits)
    const regex = new RegExp(token, "gi");
    const matches = contentLower.match(regex);
    if (matches) score += Math.min(matches.length, 10) * 0.5;
  }

  // Exact phrase match in title
  if (doc.title.toLowerCase().includes(query.toLowerCase())) score += 10;

  // Exact phrase in intro (first 500 chars)
  if (contentLower.slice(0, 500).includes(query.toLowerCase())) score += 3;

  return score;
}

/* ── Query expansion ────────────────────────────────────────── */

const QUERY_EXPANSIONS: Record<string, string[]> = {
  racket: ["racquet", "paddle", "pala"],
  racquet: ["racket", "paddle", "pala"],
  paddle: ["racket", "racquet", "pala"],
  beginner: ["starter", "new player", "learning"],
  smash: ["overhead", "remate"],
  overhead: ["smash", "remate", "bandeja", "vibora"],
  lob: ["globo"],
  wall: ["glass", "pared", "cristal"],
  glass: ["wall", "pared"],
  serve: ["service", "saque"],
  rules: ["regulations", "scoring", "format"],
  injury: ["pain", "hurt", "prevention"],
  fitness: ["training", "exercise", "workout"],
  strategy: ["tactics", "positioning", "formation"],
  shoes: ["footwear", "sneakers"],
  grip: ["overgrip", "handle"],
  backhand: ["reves"],
  forehand: ["derecha", "drive"],
};

function expandQuery(query: string): string {
  let expanded = query;
  const lower = query.toLowerCase();

  for (const [term, synonyms] of Object.entries(QUERY_EXPANSIONS)) {
    if (lower.includes(term)) {
      expanded += " " + synonyms.slice(0, 2).join(" ");
    }
  }
  return expanded;
}

/* ── Retrieval ──────────────────────────────────────────────── */

export async function retrieveDocuments(
  query: string,
  topK: number = 3,
  maxTokenEstimate: number = 4000,
): Promise<KBDocument[]> {
  const docs = await loadKnowledgeBase();
  const expandedQuery = expandQuery(query);

  const scored = docs
    .map((doc) => ({ doc, score: scoreDocument(expandedQuery, doc) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const results: KBDocument[] = [];
  let totalWords = 0;

  for (const { doc } of scored.slice(0, topK + 2)) {
    const wordCount = doc.content.split(/\s+/).length;
    if (totalWords + wordCount > maxTokenEstimate && results.length > 0) break;
    results.push(doc);
    totalWords += wordCount;
    if (results.length >= topK) break;
  }

  return results;
}
