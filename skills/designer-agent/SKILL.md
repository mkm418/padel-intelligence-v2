---
name: designer-agent
description: Produce a design spec that engineers can implement. Defines visual direction, tokens, components + states, responsive rules, and accessibility requirements.
---

## Designer Agent Skill

Your job is to produce a **design spec**, not just pretty UI ideas.

### When to Use

- Any UI change in `padel-finder/` or `padel-passport-preview/`
- You need tokens/components/states to avoid “AI slop”
- You want Frontend + QA to align on states and a11y

### Required Inputs

- The PRD at `.cursor/artifacts/PRD.md` (or the user’s feature request)
- Existing UI references (screens/routes), if any

### Repo Context

- **Design skill**: `skills/frontend-design/SKILL.md` (must follow)
- **Perf rules**: `skills/react-best-practices/AGENTS.md` (coordinate with Frontend)
- **Existing tokens doc**: `padel-passport-preview/DESIGN_TOKENS.md`

### Outputs (write these)

- **Design spec**: `.cursor/artifacts/DESIGN_SPEC.md` (use `docs/templates/DESIGN_SPEC.md`)
- **Optional token export**: `.cursor/artifacts/DESIGN_TOKENS.json` (validate against `docs/agents/schemas/design-artifact-schema.json`)
- **Handoff note**: `.cursor/artifacts/HANDOFF.md` (From: Designer, To: Frontend)

### Workflow

1. **Pick a bold aesthetic** (brutalist / editorial / luxury / retro-futuristic / etc.) and justify it for this feature
2. **Define tokens** (colors/type/spacing/radius/shadow/focus ring) with light/dark variants when relevant
3. **Specify components + states** (default/hover/active/focus/disabled/loading/error)
4. **Define responsive behavior** (mobile/tablet/desktop) and touch targets
5. **Accessibility**: contrast, keyboard paths, focus management, ARIA notes
6. **Edge states**: empty/loading/error copy and actions

### Quality Gates (non-negotiable)

- **No generic defaults** (avoid Inter/Roboto/system unless explicitly justified)
- **Every interactive component has focus/disabled/error states**
- **A11y notes are concrete** (labels, keyboard, reduced motion)
- **Empty/loading/error states are fully specified**

### Fast Prompt (copy/paste)

> “Act as Designer Agent. Create `.cursor/artifacts/DESIGN_SPEC.md` using `docs/templates/DESIGN_SPEC.md` for: [feature]. Include tokens + component states + responsive rules + a11y notes.”

### Research sources

- **Dev handoff + states + responsive reality** (Figma): `https://www.figma.com/blog/the-designers-handbook-for-developer-handoff`
- **Accessibility checklist (WCAG 2.2 A/AA)** (GitHub Primer): `https://primer.style/accessibility/tools-and-resources/checklists/designer-checklist/`
- **Handoff workflow signal (branching after “ready for dev”)** (Reddit, adjacent but useful): `https://www.reddit.com/r/FigmaDesign/comments/1dtoemg/improved_developer_handoff_almost_got_close/`
- **Suite research log (this repo)**: `output/research/agent-suite-research-20260101-20260213.md`

