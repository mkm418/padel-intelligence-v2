# AI Designer Spec Template

A concise design spec template for AI Designer agents. Fill each section before implementation.

---

## 1. Visual Direction

| Field | Value |
|-------|-------|
| **Product domain** | e.g., finance, consumer, creator tools |
| **Audience** | Primary user persona(s) |
| **Tone (3 adjectives)** | e.g., precise, calm, confident |
| **Aesthetic direction** | Brutalist / Maximalist / Retro-futuristic / Luxury / Editorial / etc. |
| **Density** | Spacious / Balanced / Dense |
| **Signature motif** | One distinctive detail (corner style, border treatment, highlight shape) |

**Design brief (1–2 sentences):**  
*[What this interface should feel like and why.]*

---

## 2. Design Tokens

### Color
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `background` | | | Page background |
| `surface` | | | Cards, panels |
| `elevated` | | | Modals, dropdowns |
| `text` | | | Primary text |
| `text-muted` | | | Secondary, captions |
| `border` | | | Dividers, outlines |
| `primary` | | | CTAs, links |
| `primary-foreground` | | | Text on primary |
| `accent` | | | Highlights, focus |
| `success` / `warning` / `danger` | | | Feedback states |

### Typography
| Token | Value | Usage |
|-------|-------|-------|
| `font-display` | | Headings |
| `font-body` | | Body, labels |
| `font-mono` | | Code, data |
| `scale` | e.g., 0.75–1.5rem | Size scale |
| `weights` | 400, 500, 600, 700 | Available weights |
| `line-heights` | | Tight / normal / relaxed |

### Layout
| Token | Value | Usage |
|-------|-------|-------|
| `spacing` | e.g., 4px base | 4, 8, 12, 16, 24, 32, 48, 64 |
| `radius` | e.g., 0 / 4 / 8 / 12 / full | Corners |
| `shadow` | sm / md / lg | Elevation |
| `focus-ring` | 2px offset, accent color | Focus state |

---

## 3. Components + States

For each core component, define:

| Component | Default | Hover | Active | Focus | Disabled | Loading | Error |
|-----------|---------|-------|--------|-------|----------|---------|-------|
| Button (primary) | | | | | | | |
| Button (secondary) | | | | | | | |
| Input | | | | | | | |
| Select | | | | | | | |
| Card | | | | | | | |
| *[Add rows]* | | | | | | | |

**Component rules:**
- [ ] Button hierarchy (primary > secondary > ghost)
- [ ] Input borders, focus ring, error/success messaging
- [ ] Card elevation, header pattern, spacing
- [ ] Table density, zebra/hover, sticky headers

---

## 4. Responsive Behavior

| Breakpoint | Width | Layout changes | Component changes |
|------------|-------|----------------|-------------------|
| Mobile | &lt; 640px | | |
| Tablet | 640–1024px | | |
| Desktop | &gt; 1024px | | |

**Notes:** Stacking order, nav collapse, table scroll, touch targets (min 44px).

---

## 5. Accessibility Annotations

| Requirement | Implementation |
|-------------|-----------------|
| **Contrast** | Text ≥ 4.5:1, large text ≥ 3:1 |
| **Focus** | Visible focus ring on all interactive elements |
| **Keyboard** | Full nav, skip links, logical tab order |
| **Screen reader** | ARIA labels, live regions for dynamic content |
| **Reduced motion** | `prefers-reduced-motion` fallbacks |
| **Error messaging** | Inline + `aria-describedby` / `aria-invalid` |

---

## 6. Empty / Loading / Error States

| State | Visual | Copy | Action |
|-------|--------|------|--------|
| **Empty** | Icon + short message | e.g., "No items yet" | CTA to create/add |
| **Loading** | Skeleton / spinner | Optional progress text | — |
| **Error** | Icon + message | Clear cause + next step | Retry / support link |

**Rules:** No lorem; use meaningful, actionable copy.

---

## 7. Handoff Notes

- **Framework / stack:** e.g., Next.js, Tailwind
- **Token format:** CSS vars / Tailwind theme / JSON
- **Component library:** Custom / shadcn / Radix / etc.
- **Assets:** Icons, illustrations, fonts (CDN/local)
- **Out of scope:** [List excluded items]
- **Open questions:** [Items needing clarification]

---

## Checklist (Pre-Implementation)

- [ ] Visual direction and tone defined
- [ ] All token categories filled (color, type, layout)
- [ ] Core components + all states specified
- [ ] Responsive breakpoints and behavior documented
- [ ] Accessibility requirements annotated
- [ ] Empty, loading, error states defined
- [ ] Handoff notes complete
