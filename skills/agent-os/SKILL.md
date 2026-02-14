---
name: agent-os
description: Shared operating system for running PM/Designer/Backend/Frontend/QA/DevOps/SRE/Data agents in Cursor with strict handoffs and schemas.
---

## Agent OS (for this repo)

This is the shared protocol that makes the agent suite reliable: **same artifacts, same traceability, same quality gates**.

### What You Get

- A **single workflow** (Conductor) for shipping features end-to-end
- Strict **handoff artifacts** in `.cursor/artifacts/`
- **Schemas** for PRDs, design artifacts, and handoff tickets
- A predictable way to run roles in Cursor (manual role calls + orchestrated flow)

### Conductor Workflow (maps to your roles)

| Your Role | Conductor step | Where it lives |
|---|---|---|
| **PM Agent (PRD)** | `@spec` | `.cursor/rules/conductor-spec.mdc` + `skills/pm-agent/` |
| **Designer Agent** | (add) `@design` | `.cursor/rules/conductor-design.mdc` + `skills/designer-agent/` |
| **Backend Agent** | `@integration` + `@python` | `.cursor/rules/conductor-integration.mdc` + `.cursor/rules/conductor-python.mdc` + `skills/backend-agent/` |
| **Frontend Agent** | `@frontend` | `.cursor/rules/conductor-frontend.mdc` + `skills/frontend-agent/` |
| **Data Engineer (events)** | (add) `@data` | `.cursor/rules/conductor-data.mdc` + `skills/data-engineer-events-tracking/` |
| **QA Agent** | `@review` + `test-cases-agent` | `.cursor/rules/conductor-review.mdc` + `.cursor/rules/test-cases-agent.mdc` + `skills/qa-agent/` |
| **DevOps / SRE Agent** | `@deploy` | `.cursor/rules/conductor-deploy.mdc` + `skills/devops-sre-agent/` |

### Canonical Artifacts (always in `.cursor/artifacts/`)

- `PRD.md`
- `DESIGN_SPEC.md`
- `ARCHITECTURE.md` and `API_CONTRACT.json` (when needed)
- `QA_PLAN.md`
- `ANALYTICS_SPEC.md`
- `HANDOFF.md`
- `REVIEW_CHECKLIST.md`
- `tickets/*.json` (optional parallelization)

### Schemas (stable copies)

- PRD schema: `docs/agents/schemas/prd-schema.json`
- Design artifact schema: `docs/agents/schemas/design-artifact-schema.json`
- Handoff ticket schema: `docs/agents/schemas/handoff-ticket-schema.json`

### Non-Negotiable Rules

- **Interview-first** before writing specs (see `.cursor/rules/interview-first.mdc`)
- **Ralph Loop** for execution (see `.cursor/rules/ralph-loop.mdc`)
- **Traceability**: Requirements → Acceptance Criteria → Tests → Artifacts
- **No secrets** in repo, ever

