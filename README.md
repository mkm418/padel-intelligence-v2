# Padel Intelligence

Data-driven padel rankings, player profiles, and insights.

## Structure

```
padel-intelligence/
├── app/              # Next.js app (TypeScript + Tailwind)
├── .cursor/          # Cursor agent rules & conductor workflow
├── skills/           # AI agent skill files (PM, Design, Backend, Frontend, QA, etc.)
├── tools/            # Research & data collection (Firecrawl, Apify, Semrush, etc.)
├── docs/             # Workflow docs, templates, schemas
├── output/           # Data exports, research, player data (large JSON gitignored)
└── python/           # Python scripts & requirements
```

## Quick Start

```bash
# Install app dependencies
cd app && npm install

# Run dev server
npm run dev

# Build (pass/fail check)
npm run build
```

## Agents

Use `@auto` in Cursor to run the full Conductor workflow, or invoke individually:

`@spec` / `@design` / `@architect` / `@frontend` / `@python` / `@data` / `@seo` / `@review` / `@deploy`

See `.cursor/CONDUCTOR_QUICKSTART.md` for details.
