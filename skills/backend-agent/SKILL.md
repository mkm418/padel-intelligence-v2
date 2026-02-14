---
name: backend-agent
description: Backend development for Next.js API routes (padel-finder) and Python data pipelines. Use when building API handlers, JSON data loading, scraping scripts, or ETL workflows.
---

# Backend Agent Skill

Guides backend work: Next.js API route handlers that read JSON files, external API integration, and Python scraping/ETL pipelines.

## When to Use

- **Next.js API routes**: New or modified handlers in `padel-finder/src/app/api/`
- **JSON data loading**: Reading from `public/` or `public/data/` in API routes
- **Python pipelines**: Scraping (Playtomic, Apify), data processing, file splitting, enrichment
- **Data flow**: Pipeline output → JSON files → API consumption

## Workflow

1. **Analyze** — Identify data source (JSON file, Playtomic API, Python output), existing patterns in similar routes, and caching needs
2. **Plan** — Choose sync vs async loading, cache TTL, error handling, and response shape
3. **Implement** — Follow repo patterns (see Quality Gates)
4. **Verify** — Test route manually, validate response shape, check error paths

## Repo-Specific Paths

| Purpose | Path |
|---------|------|
| API routes | `padel-finder/src/app/api/<route>/route.ts` |
| JSON data (static) | `padel-finder/public/clubs.json`, `public/players.json` |
| Pre-computed player data | `padel-finder/public/data/*.json` |
| Player loader (split files) | `padel-finder/src/lib/loadPlayers.ts` |
| Python pipelines | Root: `scrape_*.py`, `split_players.py`, `merge_players.py`, `enrich_*.py` |
| Pipeline output | `output/` or `padel-finder/public/data/` |

## Quality Gates

### Zod validation
- Validate query params and request body with Zod schemas
- Use `schema.parse()` for required validation; `schema.safeParse()` when fallbacks are acceptable
- Return 400 with `{ error: string }` on validation failure

### Error shape
- **400**: `{ error: "descriptive message" }` — missing/invalid params
- **404**: `{ error: "Resource not found" }` — entity not found
- **500**: `{ error: "Failed to fetch" }` or similar — unexpected failures
- Always `NextResponse.json(body, { status })`; never throw uncaught

### Promise.all for parallel I/O
- Use `Promise.all([...])` when loading multiple JSON files or external APIs
- Example: `loadDataFiles()` in `player-insights-v2/route.ts` reads 7 files in parallel
- Use `.catch(() => null)` per file when partial failure is acceptable

### Caching semantics
- **JSON files**: In-memory cache with TTL (e.g. `CACHE_TTL = 3600000`), keyed by `loadedAt`
- **External fetch**: `fetch(url, { next: { revalidate: 600 } })` for ISR (10 min) or `revalidate: 3600` (1 hr)
- Document cache TTL and invalidation in comments

## Checklist

- [ ] Query params validated (Zod or manual checks)
- [ ] Error responses use `{ error: string }` and correct status codes
- [ ] Multiple I/O operations use `Promise.all`
- [ ] JSON loading has in-memory cache with explicit TTL
- [ ] External fetches use `next: { revalidate }` where appropriate
- [ ] Python pipelines write to `output/` or `public/data/` with documented schema
- [ ] Try/catch around async logic; log and return 500 on unexpected errors

## Research sources (Jan 1, 2026 → Feb 13, 2026)

- **Next.js error handling patterns (expected errors vs uncaught; last updated 2026-02-11)**: `https://nextjs.org/docs/app/building-your-application/routing/error-handling`
- **Suite research log (this repo)**: `output/research/agent-suite-research-20260101-20260213.md`
