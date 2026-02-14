---
name: frontend-agent
description: Frontend development for padel-finder and padel-passport-preview. Covers design direction, performance, accessibility, and project-specific requirements.
---

# Frontend Agent Skill

Guidance for frontend work on **padel-finder** and **padel-passport-preview**. Always apply design, performance, and accessibility standards.

---

## Projects

| Project | Stack |
|---------|-------|
| **padel-finder** | Next.js 16, React 19, Tailwind v4, Leaflet, react-leaflet |
| **padel-passport-preview** | Next.js 14, React 18 |

---

## Design Direction

**Requirement:** Use the Frontend Design skill (`skills/frontend-design/SKILL.md`) for all UI work.

- Commit to a clear aesthetic direction (brutalist, luxury, retro-futuristic, etc.)
- Avoid generic AI aesthetics: no Inter/Roboto, no purple gradients on white
- Use distinctive typography, cohesive color, and intentional motion
- Match complexity to vision: maximalist needs elaboration; minimalist needs precision

---

## Performance

**Requirement:** Follow React Best Practices (`skills/react-best-practices/AGENTS.md`).

**Priority order:**
1. **Eliminate waterfalls** — Use `Promise.all()`, parallel data fetching, defer `await` until needed
2. **Reduce bundle size** — Avoid barrel imports, use `next/dynamic` for Leaflet and heavy components
3. **Server-side** — Parallel RSC fetching, `React.cache()` for deduplication, minimize RSC serialization
4. **Re-renders** — Lazy state init, functional `setState`, `useTransition` for non-urgent updates
5. **Rendering** — `content-visibility` for long lists, Suspense boundaries for streaming

**Project-specific:**
- **padel-finder:** Dynamic-import Leaflet and map components (`ssr: false`); use passive listeners for map/scroll
- **padel-passport-preview:** Prefer Server Components; use `optimizePackageImports` if adding icon/UI libraries

---

## Accessibility

- **WCAG 2.1 AA** as minimum
- **Semantic HTML** — Use `<main>`, `<nav>`, `<article>`, headings in order
- **Keyboard** — All interactive elements focusable; visible focus indicators; no keyboard traps
- **Focus management** — For modals/dialogs: trap focus, restore on close
- **ARIA** — Use when semantics are insufficient; prefer native elements
- **Color** — Sufficient contrast (4.5:1 text, 3:1 large text); don’t rely on color alone
- **Leaflet (padel-finder)** — Ensure map controls and markers are keyboard-accessible; provide text alternatives for map content

---

## Checklist

Before shipping frontend changes:

- [ ] **Design** — Aesthetic direction defined; no generic AI defaults
- [ ] **Waterfalls** — No sequential awaits; parallel fetching where possible
- [ ] **Bundle** — No barrel imports; heavy components dynamically imported
- [ ] **Leaflet** — Map components lazy-loaded with `ssr: false` (padel-finder)
- [ ] **Semantics** — Correct HTML elements; heading hierarchy
- [ ] **Keyboard** — Full keyboard navigation; visible focus
- [ ] **Contrast** — Text and UI meet contrast requirements
- [ ] **Focus** — Modals trap and restore focus
- [ ] **Linter** — No new lint errors

## Research sources (Jan 1, 2026 → Feb 13, 2026)

- **Vercel React Best Practices (published 2026-01-14)**: `https://vercel.com/blog/introducing-react-best-practices`
- **Next.js error handling (last updated 2026-02-11)**: `https://nextjs.org/docs/app/building-your-application/routing/error-handling`
- **Suite research log (this repo)**: `output/research/agent-suite-research-20260101-20260213.md`
