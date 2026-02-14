# Conductor — Agent Workflow (PM/Design/Backend/Frontend/SEO/QA/SRE/Data)

**Workflow name:** Conductor  
**Why:** Orchestrates 10 specialized agents with clear handoffs. One word, memorable, fits Cursor.

---

## Agent Suite (repo defaults)

| # | Agent | Maps to | Scope | Rule file |
|---|-------|---------|-------|-----------|
| 1 | **Spec** | PM | Requirements, acceptance criteria, PRD-ready spec | `conductor-spec.mdc` |
| 2 | **Design** | Designer | Tokens, components + states, responsive + a11y | `conductor-design.mdc` |
| 3 | **Architect** | Backend/FE alignment | System design, data flow, API contract | `conductor-architect.mdc` |
| 4 | **Python** | Backend | Pipelines, scrapers, ETL, data processing | `conductor-python.mdc` |
| 5 | **Integration** | Backend | API routes, glue between Python ↔ Next.js | `conductor-integration.mdc` |
| 6 | **Frontend** | Frontend | Next.js pages, React components, UI | `conductor-frontend.mdc` |
| 7 | **SEO** | Growth/SEO | Metadata, indexing, structured data, internal linking | `conductor-seo.mdc` |
| 8 | **Data** | Data Engineer | Events tracking, instrumentation, sinks | `conductor-data.mdc` |
| 9 | **Review** | QA | Security, tests, lint, edge cases | `conductor-review.mdc` |
| 10 | **Deploy** | DevOps/SRE | Local/CI checks, env, runbook | `conductor-deploy.mdc` |

---

## Handoff Artifacts

All artifacts live in `.cursor/artifacts/` (gitignored optional).

| Artifact | Written by | Consumed by |
|----------|------------|-------------|
| `SPEC.md` | Spec | Design, Architect, Backend, Frontend |
| `DESIGN_SPEC.md` | Design | Frontend, QA |
| `ARCHITECTURE.md` | Architect | Backend, Frontend, Data |
| `API_CONTRACT.json` | Architect | Integration, Frontend |
| `SEO_PLAN.md` | SEO | Frontend, QA |
| `ANALYTICS_SPEC.md` | Data | Frontend, QA |
| `HANDOFF.md` | Any agent | Next agent, human |
| `QA_PLAN.md` | Review/QA | DevOps/SRE, human |
| `REVIEW_CHECKLIST.md` | Review/QA | Deploy, human |

**HANDOFF.md template:**
```markdown
# Handoff — [Feature/Task Name]
**From:** [agent] | **To:** [next agent] | **Date:** YYYY-MM-DD

## Done
- [ ] Item 1
- [ ] Item 2

## Next steps
1. Step for next agent

## Blockers / Notes
- 
```

---

## Orchestration Flow

```
[User request]
      ↓
   @auto / @ship → routes steps + artifacts + code changes
      ↓
   (optional) run individual steps below if you want to iterate:
   @spec      → SPEC.md
      ↓
   @design    → DESIGN_SPEC.md
      ↓
   @architect → ARCHITECTURE.md, API_CONTRACT.json
      ↓
   @python    → pipeline scripts, output schema
      ↓
   @integration → API routes, server↔pipeline glue
      ↓
   @frontend  → Next.js pages/components
      ↓
   @seo       → SEO_PLAN.md
      ↓
   @data      → ANALYTICS_SPEC.md + instrumentation
      ↓
   @review    → REVIEW_CHECKLIST.md, fixes
      ↓
   @deploy    → CI/CD, env, runbook
```

**Linear flow** — each agent reads prior artifacts, does its work, updates HANDOFF.md.

---

## Minimal Commands (User Types in Cursor Chat)

| Command | What it does |
|---------|--------------|
| `@auto [description]` | Auto-route the full flow; writes all relevant artifacts |
| `@ship [description]` | Alias for `@auto` (ship-oriented defaults) |
| `@spec [brief description]` | Run Spec agent; produce SPEC.md |
| `@seo` | Run SEO agent; produce SEO_PLAN.md |
| `@architect` | Run Architect; read SPEC, produce ARCH + API_CONTRACT |
| `@python [scope]` | Run Python agent; implement/update pipelines |
| `@frontend [scope]` | Run Frontend agent; implement UI |
| `@integration` | Run Integration agent; wire API routes |
| `@review` | Run Review agent; security, tests, lint |
| `@deploy` | Run Deploy agent; CI/CD, env |

**Examples:**
- `@spec Add player comparison feature with head-to-head stats`
- `@architect`
- `@python Implement comparison data pipeline`
- `@frontend Build comparison page and components`
- `@integration Wire /api/compare to pipeline`
- `@review`
- `@deploy`

---

## Rule File Structure (Per Agent)

Each `.cursor/rules/conductor-*.mdc` follows:

```markdown
---
description: Conductor — [Agent Name]
globs: ["**/*"]
alwaysApply: false
---

# Conductor: [Agent Name]

## Role
[1–2 sentences]

## Inputs
- Read: [artifact paths]
- Context: [what to look at]

## Outputs
- Write: [artifact paths]
- Update: HANDOFF.md

## Constraints
- [tech stack, conventions]
- [do / don't]

## On completion
Update HANDOFF.md with done items and next agent.
```

---

## Ship Tonight Checklist

- [ ] Create `.cursor/artifacts/` (add to `.gitignore` if desired)
- [ ] Add 7 rule files: `conductor-spec.mdc` … `conductor-deploy.mdc`
- [ ] Add `CONDUCTOR_QUICKSTART.md` with copy-paste prompts
- [ ] Test one full pass: spec → architect → python (or frontend) → review

---

## Quick Reference: Agent → Artifact Map

```
Spec       → SPEC.md
Architect  → ARCHITECTURE.md, API_CONTRACT.json
Python     → *.py (pipelines), output/*.json schema
Frontend   → app/**/*.tsx, components/**/*.tsx
Integration→ app/api/**/route.ts
Review     → REVIEW_CHECKLIST.md, test/*, lint fixes
Deploy     → .github/workflows/*, Dockerfile, env.example
```
