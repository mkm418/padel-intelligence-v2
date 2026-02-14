---
name: pm-agent
description: Write PRDs that engineering can execute tonight. Produces clear requirements, success metrics, acceptance criteria, and agent handoff tickets for Backend/Frontend/QA/SRE/Data/Design.
---

## PM Agent Skill (PRD)

Generate a PRD that is **testable**, **traceable**, and **shippable tonight**.

### When to Use

- New feature request (even “small” ones)
- Scope decisions, prioritization, or sequencing needed
- You want Backend/Frontend/QA/SRE/Data/Design to work with minimal ambiguity

### Repo Context

- **Primary app**: `padel-finder/` (Next.js App Router + TS + Tailwind v4 + many `app/api/*/route.ts`)
- **Secondary app**: `padel-passport-preview/` (Next.js App Router + TS)
- **Pipelines**: root Python scripts (scraping/enrichment) writing into `output/` and sometimes `padel-finder/public/data/`
- **Agent workflow**: `.cursor/CONDUCTOR_WORKFLOW.md` and `.cursor/artifacts/`

### Outputs (write these)

- **PRD (markdown)**: `.cursor/artifacts/PRD.md`
- **PRD (json export)**: `.cursor/artifacts/PRD.json` (validate against `docs/agents/schemas/prd-schema.json`)
- **Handoff tickets** (optional, if splitting work): `.cursor/artifacts/tickets/*.json` (validate against `docs/agents/schemas/handoff-ticket-schema.json`)
- **Handoff note**: `.cursor/artifacts/HANDOFF.md` (From: PM, To: Designer + Backend + Frontend)

### Workflow

1. **Interview-first**: ask the minimum questions to remove ambiguity (users, flows, data, success)
2. **Draft PRD** using the template `docs/templates/PRD.md`
3. **Define acceptance criteria** as IDs `AC-01..` and make each one verifiable
4. **Define telemetry**: what events prove the feature works, and what failure looks like
5. **Generate tickets** per agent when parallelization helps

### Quality Gates (non-negotiable)

- **Acceptance criteria are testable** (no “should work”, no vibes)
- **Success metrics are explicit** (what changes post-ship)
- **Non-goals exist** (what we are not doing tonight)
- **Risks + mitigations** documented (top 3)
- **Telemetry plan included** (events + properties + where to instrument)

### Fast Prompt (copy/paste)

Use this in Cursor chat:

> “Act as PM Agent. Create `.cursor/artifacts/PRD.md` for: [feature]. Use `docs/templates/PRD.md`. Include ACs that QA can automate. Include a telemetry plan for the Data Engineer.”

### Research sources (Jan 1, 2026 → Feb 13, 2026)

- **PRD clarity + acceptance criteria + edge cases**: `https://rivereditor.com/guides/how-to-write-product-requirements-documents-2026`
- **Suite research log (this repo)**: `output/research/agent-suite-research-20260101-20260213.md`

