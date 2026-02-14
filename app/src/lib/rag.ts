/**
 * Padel Knowledge Base - RAG Retrieval Engine
 *
 * Simple but effective keyword + metadata matching.
 * No vector DB needed — uses TF-IDF-style scoring with:
 * - Keyword frequency matching
 * - Metadata tag boosting
 * - Title matching (high signal)
 * - Category filtering
 *
 * For 100 files / ~100k words, this is fast and accurate enough.
 * Upgrade path: swap this for Supabase pgvector when you need embeddings.
 */

import fs from "fs";
import path from "path";

// Knowledge base root (relative to project root)
const KB_ROOT = path.join(process.cwd(), "..", "output", "knowledge_base");

export interface KBDocument {
  filename: string;
  filepath: string;
  title: string;
  category: string;
  subcategory: string;
  difficulty: string;
  tags: string[];
  content: string; // full markdown content (without frontmatter)
  rawContent: string; // everything
}

// In-memory cache — loaded once, stays in memory
let documentCache: KBDocument[] | null = null;

/**
 * Parse YAML-like frontmatter from a markdown file
 */
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

/**
 * Load all knowledge base documents into memory
 */
export async function loadKnowledgeBase(): Promise<KBDocument[]> {
  if (documentCache) return documentCache;

  const docs: KBDocument[] = [];
  const categories = fs.readdirSync(KB_ROOT);

  for (const category of categories) {
    const categoryPath = path.join(KB_ROOT, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const filepath = path.join(categoryPath, file);
      const raw = fs.readFileSync(filepath, "utf-8");
      const { metadata, content } = parseFrontmatter(raw);

      docs.push({
        filename: file,
        filepath,
        title: metadata.title || file.replace(".md", ""),
        category: metadata.category || category,
        subcategory: metadata.subcategory || "",
        difficulty: metadata.difficulty || "Intermediate",
        tags: (metadata.tags || "")
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        content,
        rawContent: raw,
      });
    }
  }

  documentCache = docs;
  console.log(`[RAG] Loaded ${docs.length} knowledge base documents`);
  return docs;
}

/**
 * Tokenize a string into searchable terms
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-záéíóúñü0-9\s]/g, " ") // keep accented chars for padel terms
    .split(/\s+/)
    .filter((t) => t.length > 2); // skip tiny words
}

/**
 * Score a document against a query using keyword matching + metadata boosts
 */
function scoreDocument(query: string, doc: KBDocument): number {
  const queryTokens = tokenize(query);
  const titleTokens = tokenize(doc.title);
  const tagSet = new Set(doc.tags);
  const contentLower = doc.content.toLowerCase();

  let score = 0;

  for (const token of queryTokens) {
    // Title match — highest signal (x5 boost)
    if (titleTokens.includes(token)) {
      score += 5;
    }

    // Tag match — strong signal (x3 boost)
    if (tagSet.has(token)) {
      score += 3;
    }

    // Category/subcategory match (x2 boost)
    if (doc.category.toLowerCase().includes(token)) {
      score += 2;
    }
    if (doc.subcategory.toLowerCase().includes(token)) {
      score += 2;
    }

    // Content match — count occurrences (capped at 10)
    const regex = new RegExp(token, "gi");
    const matches = contentLower.match(regex);
    if (matches) {
      score += Math.min(matches.length, 10) * 0.5;
    }
  }

  // Bonus: exact phrase match in title
  if (doc.title.toLowerCase().includes(query.toLowerCase())) {
    score += 10;
  }

  // Bonus: exact phrase match in content (first 500 chars = intro)
  if (contentLower.slice(0, 500).includes(query.toLowerCase())) {
    score += 3;
  }

  return score;
}

/**
 * Common padel synonyms and related terms to expand queries
 */
const QUERY_EXPANSIONS: Record<string, string[]> = {
  racket: ["racquet", "paddle", "bat", "pala"],
  racquet: ["racket", "paddle", "bat", "pala"],
  paddle: ["racket", "racquet", "pala"],
  beginner: ["starter", "new player", "learning", "first time"],
  smash: ["overhead", "remate", "slam"],
  overhead: ["smash", "remate", "bandeja", "vibora"],
  lob: ["globo", "lob"],
  wall: ["glass", "pared", "cristal"],
  glass: ["wall", "pared", "cristal"],
  serve: ["service", "saque"],
  rules: ["regulations", "scoring", "format"],
  injury: ["pain", "hurt", "injuries", "prevention"],
  fitness: ["training", "exercise", "workout", "conditioning"],
  strategy: ["tactics", "positioning", "formation"],
  shoes: ["footwear", "sneakers", "soles"],
  grip: ["overgrip", "handle"],
  backhand: ["reves", "two-handed", "one-handed"],
  forehand: ["derecha", "drive"],
};

/**
 * Expand query with synonyms for better recall
 */
function expandQuery(query: string): string {
  let expanded = query;
  const lower = query.toLowerCase();

  for (const [term, synonyms] of Object.entries(QUERY_EXPANSIONS)) {
    if (lower.includes(term)) {
      // Add first 2 synonyms to the query
      expanded += " " + synonyms.slice(0, 2).join(" ");
    }
  }

  return expanded;
}

/**
 * Retrieve the most relevant documents for a query
 *
 * @param query - User's question
 * @param topK - Number of documents to return (default 3)
 * @param maxTokenEstimate - Rough max tokens for context window (default ~4000 words)
 */
export async function retrieveDocuments(
  query: string,
  topK: number = 3,
  maxTokenEstimate: number = 4000
): Promise<KBDocument[]> {
  const docs = await loadKnowledgeBase();
  const expandedQuery = expandQuery(query);

  // Score all documents
  const scored = docs
    .map((doc) => ({
      doc,
      score: scoreDocument(expandedQuery, doc),
    }))
    .filter((s) => s.score > 0) // only relevant docs
    .sort((a, b) => b.score - a.score);

  // Take top K, but respect token budget
  const results: KBDocument[] = [];
  let totalWords = 0;

  for (const { doc } of scored.slice(0, topK + 2)) {
    // +2 buffer
    const wordCount = doc.content.split(/\s+/).length;
    if (totalWords + wordCount > maxTokenEstimate && results.length > 0) break;
    results.push(doc);
    totalWords += wordCount;
    if (results.length >= topK) break;
  }

  return results;
}
