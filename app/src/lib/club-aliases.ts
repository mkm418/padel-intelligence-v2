/**
 * Club name normalization and alias mapping.
 * Playtomic clubs sometimes appear under multiple names (casing, status tags, etc.).
 * This module maps all variants to a single canonical name.
 */

const ALIAS_MAP: Record<string, string> = {
  // I95 variants
  "i95 Padel Club": "I95 Padel Club",
  "i95 Padel": "I95 Padel Club",
  "i95 Padel Indoor": "I95 Padel Club",

  // Ola Padel variants
  "Ola Padel Club by Nox (COMING SOON!)": "Ola Padel Club by Nox",
  "Ola Padel Club by Nox (NOW OPEN!!)": "Ola Padel Club by Nox",

  // AREA variants
  "AREA CENTRE": "AREA Centre",
  'AREA CENTRE "Coming Soon"': "AREA Centre",
  "AREA centre - NOW OPEN -": "AREA Centre",
  "AREA centre - NOW OPEN - ": "AREA Centre",

  // THE SET variants
  "THE SET Padel & Pickleball": "THE SET",
  "THE SET - COMING SOON": "THE SET",

  // Ultra Padel variants
  "Ultra Padel Miami - Magic City": "Ultra Padel Miami",

  // Urban Padel variants
  "Urban Padel Miami - INDOOR CLUB -": "Urban Padel Miami",

  // Smart Padel variants
  "Smart Padel House ( Miami Padel Federation )": "Smart Padel House",

  // One Indoor variants
  "One Padel Indoor Club": "One Indoor Club",

  // Legio GP variants
  "Legio Gp": "LEGIO GP",
};

/** Normalize a club name to its canonical form */
export function normalizeClubName(name: string): string {
  const trimmed = name.trim();
  return ALIAS_MAP[trimmed] ?? trimmed;
}

/** Normalize an array of club names, deduplicate */
export function normalizeClubs(clubs: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const c of clubs) {
    const norm = normalizeClubName(c);
    if (!seen.has(norm)) {
      seen.add(norm);
      result.push(norm);
    }
  }
  return result.sort();
}

/** Get all canonical club names from a list (for dropdown filters) */
export function getUniqueClubs(allClubs: string[]): string[] {
  return normalizeClubs(allClubs);
}
