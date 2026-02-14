## Agent Suite Research (Jan 1, 2026 → Feb 13, 2026)

This file is the “evidence base” behind the agent suite rules in `skills/*/SKILL.md` and `.cursor/rules/conductor-*.mdc`.

### Notes on Reddit coverage

- I searched for **role-specific** Reddit threads in the Jan–Feb 2026 window. For several topics (PRDs, analytics naming, Playwright selectors), Reddit didn’t have high-signal, easily indexable posts in that narrow window.
- Where Reddit was sparse, I used **official docs + reputable vendor engineering posts** (which are usually the highest-signal and most stable).
- I included a small number of relevant Reddit threads where available, even when adjacent to the time window, and I clearly label them.

---

## QA Agent (Tests)

### Primary sources

- **Playwright Best Practices** (official): `https://playwright.dev/docs/best-practices`
  - Core takeaways: test user-visible behavior, isolate tests, avoid third-party deps, prefer resilient locators, use “web-first assertions”.
- **Playwright Locators** (official): `https://playwright.dev/docs/locators`
  - Core takeaways: prefer `getByRole()`/user-facing attributes; keep selectors resilient; leverage codegen for good locators.

### How we baked this into the repo

- Locator rule in QA agent: role → label → placeholder → alt → testid; avoid brittle CSS/XPath.
- E2E “intent + outcome” assertions for filters/selectors to catch regressions.

---

## Data Engineer Agent (Events Tracking)

### Primary sources (within window)

- **Next.js `instrumentation-client.ts`** (official; last updated 2026-02-11): `https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client`
  - Core takeaways: run analytics initialization **before hydration**, keep it lightweight (warns if >16ms), use `onRouterTransitionStart` to track navigations.

### Primary sources (schema + naming)

- **PostHog naming conventions + versioning**: `https://posthog.com/questions/best-practices-naming-convention-for-event-names-and-properties`
  - Core takeaways: maintain a verb whitelist; snake_case; present tense; `category:object_action`; version events with `_v2` for breaking flow changes; prefer backend tracking when accuracy matters.
- **PostHog schema management**: `https://posthog.com/docs/product-analytics/schema-management`
  - Core takeaways: define events upfront; event names can’t be changed; typed property groups; generate and commit types for consistency.

### How we baked this into the repo

- `category:object_action` naming + verb whitelist.
- Instrumentation anchored on `instrumentation-client.ts` for early-init and route transitions.
- Sink-agnostic design (PostHog/GA4/Supabase later).

---

## Frontend Agent

### Primary sources (within window)

- **Vercel: Introducing React Best Practices** (published 2026-01-14): `https://vercel.com/blog/introducing-react-best-practices`
  - Core takeaways: the two biggest levers are **eliminating waterfalls** and **reducing bundle size**; rule ordering matters; avoid optimizing “too low”.

### How we baked this into the repo

- Frontend agent requires following `skills/react-best-practices/AGENTS.md` and the design skill.
- Performance priorities baked into the agent checklist (waterfalls → bundle → server → re-renders → rendering).

---

## DevOps / SRE Agent

### Primary sources (within window)

- **OneUptime: How to Create Effective Runbooks** (published 2026-02-02): `https://oneuptime.com/blog/post/2026-02-02-effective-runbooks/view`
  - Core takeaways: runbooks need metadata, trigger conditions, prerequisites, copy-paste-ready steps, expected outputs, verification and rollback, and an explicit escalation path.

### How we baked this into the repo

- DevOps/SRE skill includes a runbook template aligned to this structure.
- Conductor `@deploy` step is “local-first” tonight: install → lint → typecheck → test → build deterministically.

---

## PM Agent (PRD)

### Primary sources (within window)

- **River: PRDs engineering teams love (2026)**: `https://rivereditor.com/guides/how-to-write-product-requirements-documents-2026`
  - Core takeaways: “why before what”; acceptance criteria must be testable; document edge cases; prioritize ruthlessly (P0/P1/P2); avoid over-prescribing implementation details.

### How we baked this into the repo

- PRD template forces: problem, goals, non-goals, edge cases, acceptance criteria, telemetry plan.
- PRD → QA automation traceability is a first-class constraint.

---

## Designer Agent

### Primary sources (reputable; adjacent window)

- **Figma: The designer’s handbook for developer handoff** (2025-04-01): `https://www.figma.com/blog/the-designers-handbook-for-developer-handoff`
  - Core takeaways: align early with dev; design responsive behavior beyond breakpoints; document “invisible states”; annotate for Dev Mode; shared language and component mapping matter.
- **GitHub Primer: Designer accessibility checklist (WCAG 2.2 A/AA)**: `https://primer.style/accessibility/tools-and-resources/checklists/designer-checklist/`
  - Core takeaways: contrast targets; heading/landmark hierarchy; form labels; touch targets; keyboard focus order; avoid disabled buttons; error states must be designed.

### Reddit signal (adjacent, but high-signal)

- `r/FigmaDesign` discussion about handoff status/versioning and using branches after “ready for dev”: `https://www.reddit.com/r/FigmaDesign/comments/1dtoemg/improved_developer_handoff_almost_got_close/`

### How we baked this into the repo

- Design template forces tokens + component states + responsive rules + a11y annotations + empty/loading/error states.
- “Ready-for-dev” implies “don’t mutate”; if changes continue, branch the design (mirrors the Reddit feedback pattern).

---

## Cross-cutting Agent Ops (token usage + reliability)

### Reddit signal (in-window)

- Cursor token usage tactics (context files, plan-first, avoid unnecessary model switching): `https://old.reddit.com/r/cursor/comments/1qs5csh/what_strategies_do_you_follow_to_optimise_token_usage/`

### How we baked this into the repo

- Conductor externalizes state into `.cursor/artifacts/*` to reduce repeated context injection.
- Interview-first + Ralph Loop reduce rework cycles (and token burn) by forcing clarity and verification.

---

## Growth / SEO Agent

### Primary sources (within window)

- **Next.js `generateMetadata`** (official; last updated 2026-02-11): `https://nextjs.org/docs/app/api-reference/functions/generate-metadata`
  - Core takeaways: use `metadata` for static fields; use `generateMetadata` for dynamic; fetches inside are memoized; metadata can stream; file-based metadata overrides exports.
- **Next.js metadata file conventions** (official; last updated 2026-02-11): `https://nextjs.org/docs/app/api-reference/file-conventions/metadata`
  - Core takeaways: special files like `sitemap.ts`, `robots.ts`, `opengraph-image.*` are cached by default and auto-wired to head tags.
- **Next.js production checklist** (official; last updated 2026-02-11): `https://nextjs.org/docs/app/guides/production-checklist`
  - Core takeaways: treat metadata/SEO as part of production readiness; avoid accidental dynamic rendering; prioritize CWV and avoid waterfalls.

### Structured data validation

- **Google Rich Results Test** (official help): `https://support.google.com/webmasters/answer/7445569`
  - Core takeaways: validate structured data via URL/snippet; JSON-LD comments are ignored by the tool but are not standard — remove comments before shipping.

### How we baked this into the repo

- Added `@seo` Conductor step + `skills/growth-seo-agent/` with explicit indexing policy, metadata rules, structured-data validation, and a measurable `SEO_PLAN.md` artifact.

