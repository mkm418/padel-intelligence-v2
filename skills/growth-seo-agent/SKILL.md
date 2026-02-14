---
name: growth-seo-agent
description: Growth/SEO agent for Next.js apps in this repo. Owns metadata, indexing, structured data, internal linking, programmatic SEO pages, and measurement plan.
---

## Growth / SEO Agent Skill

Build **crawlable, indexable, shareable** pages and measure what matters.

### When to Use

- You ship new pages/routes and want them to rank
- You change titles/descriptions/canonical, OG, sitemaps/robots
- You add programmatic pages (cities, clubs, player profiles, comparisons)
- You want structured data (JSON-LD) and rich results eligibility

### Repo Context

- **Main app**: `padel-finder/` (Next.js App Router, TypeScript)
- **Secondary**: `padel-passport-preview/`
- Existing SEO-ish work: `padel-finder/src/components/StructuredData.tsx` (JSON-LD patterns)

### Outputs (write these)

- `.cursor/artifacts/SEO_PLAN.md`
- `.cursor/artifacts/SEO_TODO.md` (optional)
- `.cursor/artifacts/HANDOFF.md` (From: SEO, To: Frontend)

### Workflow (the only way this works)

1. **Inventory** what pages exist + which should index
2. **Decide indexing policy** per route segment (index/noindex)
3. **Implement metadata** using Next.js Metadata API (`metadata` / `generateMetadata`)
4. **Implement structured data** (JSON-LD) where it helps (breadcrumbs, profiles, events)
5. **Make pages internally discoverable** (links, pagination, hub pages)
6. **Measure**: define KPIs + baselines (GSC, impressions, CTR, CWV)

### Quality Gates (non-negotiable)

- **Noindex** low-value/faceted pages (e.g., heavy filter states) if they create crawl traps
- **Canonical** is correct on programmatic pages (avoid duplicates)
- **Titles/Descriptions** are unique and non-spammy (no template duplicates across 1000 pages)
- **Structured data** validates (Rich Results Test) and contains no comments
- **Performance** doesn’t regress (CWV is an SEO tie-breaker; also improves UX)

### Next.js Implementation Rules (App Router)

- **Prefer static `metadata`** when possible; use `generateMetadata` only when dynamic is needed
- **Always set `metadataBase`** at root so OG/Twitter image URLs resolve correctly
- Use file-based metadata where helpful (e.g. `opengraph-image.*`, icons) to avoid drift
- Avoid calling Route Handlers from Server Components for SEO-critical pages (extra server hop)

### “Programmatic SEO” playbook (for this repo)

High-leverage page types you already have or can add:

- **/search** (usually noindex unless it’s a curated landing page)
- **/clubs** and **/clubs/[city]** hub pages with internal links
- **/player/[id]** profile pages (index if stable + valuable)
- **/compare** pages (index only if canonicalized and not infinite combinations)
- **/leaderboards/** pages (great for SEO if titles and internal links are clean)

Rule: If a route can generate near-infinite combinations (filters, compare pairs), either:
- constrain to a curated subset, or
- enforce `noindex` and canonicalize to the closest hub.

### Research sources (2025–2026)

- Next.js `generateMetadata` (last updated 2026-02-11): `https://nextjs.org/docs/app/api-reference/functions/generate-metadata`
- Next.js metadata file conventions (last updated 2026-02-11): `https://nextjs.org/docs/app/api-reference/file-conventions/metadata`
- Next.js production checklist (SEO + performance, last updated 2026-02-11): `https://nextjs.org/docs/app/guides/production-checklist`
- Google Rich Results Test (structured data validation): `https://support.google.com/webmasters/answer/7445569`
- Repo research log: `output/research/agent-suite-research-20260101-20260213.md`

