---
name: qa-agent
description: QA/Test agent for this repo. Generates test plans and tests across Vitest/Jest (API + UI units), Playwright E2E, and Pytest pipelines. Focuses on catching regressions like “selector/filter broken”.
---

## QA Agent Skill

This skill turns product requirements into **repeatable tests** and **regression protection**.

### When to Use

- Before shipping any feature or refactor
- When a bug escaped to prod and you want to prevent repeats
- When you add or change API routes under `padel-finder/src/app/api/`
- When changing critical UI selectors/filters on `/search`, `/clubs`, `/compare`, `/player/[id]`

### Repo Context

- **Test case generator**: `skills/test-cases-agent/` (use it for structured test planning and grading)
- **Tonight’s scope**: `docs/QA_STRATEGY_SHIP_TONIGHT.md` (minimal, high-impact)
- **E2E target**: `padel-finder/` (Next.js 16 + React 19)
- **Pipelines**: root Python scripts (Pytest for pure logic + fixtures)

### Outputs (write these)

- `.cursor/artifacts/QA_PLAN.md` (what we will test + why)
- Test files in the codebase (Vitest/Jest, Playwright, Pytest as appropriate)
- `.cursor/artifacts/HANDOFF.md` (From: QA, To: DevOps/SRE or Done)

### Workflow

1. **Read the PRD + Design spec** (if present): `.cursor/artifacts/PRD.md`, `DESIGN_SPEC.md`
2. **Generate a test plan** (unit/integration/e2e/pipeline) with explicit coverage targets
3. **Implement tests** in the right layer (test pyramid)
4. **Run tests** repeatedly enough to detect flake (especially E2E)
5. **Add “bug-signal” assertions**: intent + outcome (e.g., filter change → results updated)

### Quality Gates

- Prefer **stable locators** for E2E: role → label → placeholder → alt text → test id
- Avoid brittle CSS/XPath selectors unless no alternative
- Assertions must be programmatic and specific (no “should work”)
- For selector/filter bugs: assert **UI output changes** (counts, list contents) after selection changes

### Fast Prompt (copy/paste)

> “Act as QA Agent. Use `docs/QA_STRATEGY_SHIP_TONIGHT.md` and `skills/test-cases-agent/SKILL.md`. Create `.cursor/artifacts/QA_PLAN.md` and implement the tests for: [feature/change].”

### Research sources

- **Playwright best practices (resilient tests, isolation, web-first asserts)**: `https://playwright.dev/docs/best-practices`
- **Playwright locators (preferred locator strategy)**: `https://playwright.dev/docs/locators`
- **Suite research log (this repo)**: `output/research/agent-suite-research-20260101-20260213.md`

