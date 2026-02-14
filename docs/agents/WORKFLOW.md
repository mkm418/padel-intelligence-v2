## Conductor (Cursor) — How to run the full agent suite

All artifacts live in `.cursor/artifacts/`.

### Tonight’s “ship something powerful” loop

0. **One-shot (recommended if you just want it done)**
   - Run: `@auto Ship: [feature]`
   - Writes/updates: the full set of relevant `.cursor/artifacts/*` + code changes

1. **PM / PRD**
   - Run: `@spec [feature]`
   - Writes: `.cursor/artifacts/SPEC.md` (and you can additionally ask for `PRD.md`)

2. **Design**
   - Run: `@design`
   - Writes: `.cursor/artifacts/DESIGN_SPEC.md`

3. **Backend + pipelines**
   - Run: `@python [scope]` (pipelines) and/or `@integration` (API route handlers)

4. **Frontend**
   - Run: `@frontend [scope]`

5. **Growth / SEO**
   - Run: `@seo`
   - Writes: `.cursor/artifacts/SEO_PLAN.md` (see `docs/templates/SEO_PLAN.md`)

6. **Events tracking**
   - Run: `@data`
   - Writes: `.cursor/artifacts/ANALYTICS_SPEC.md` + instrumentation plan

7. **QA**
   - Run: `@review` and/or ask for `test-cases-agent` explicitly
   - Writes: `.cursor/artifacts/QA_PLAN.md`, `REVIEW_CHECKLIST.md`, adds tests

8. **DevOps / SRE**
   - Run: `@deploy`
   - Writes: runbook + local/CI checks

### Manual role invocation (when you don’t want the full flow)

- “Act as **Backend Agent** …” (see `skills/backend-agent/SKILL.md`)
- “Act as **Frontend Agent** …” (see `skills/frontend-agent/SKILL.md`)
- “Act as **Growth/SEO Agent** …” (see `skills/growth-seo-agent/SKILL.md`)
- “Act as **QA Agent** …” (see `skills/qa-agent/SKILL.md`)
- “Act as **DevOps/SRE Agent** …” (see `skills/devops-sre-agent/SKILL.md`)
- “Act as **Data Engineer Agent** …” (see `skills/data-engineer-events-tracking/SKILL.md`)
- “Act as **PM Agent** …” (see `skills/pm-agent/SKILL.md`)
- “Act as **Designer Agent** …” (see `skills/designer-agent/SKILL.md`)

