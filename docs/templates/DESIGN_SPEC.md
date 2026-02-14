# Design Spec

Use this as the canonical design handoff. Keep it implementable.

## 1. Visual Direction

| Field | Value |
|---|---|
| **Product domain** | |
| **Audience** | |
| **Tone (3 adjectives)** | |
| **Aesthetic direction** | Brutalist / Editorial / Luxury / Retro-futuristic / etc. |
| **Density** | Spacious / Balanced / Dense |
| **Signature motif** | One memorable detail |

**Design brief (1-2 sentences):**

## 2. Design Tokens

### Color

| Token | Light | Dark | Usage |
|---|---|---|---|
| `background` | | | |
| `surface` | | | |
| `text` | | | |
| `text_muted` | | | |
| `border` | | | |
| `primary` | | | |
| `primary_foreground` | | | |
| `accent` | | | |
| `success` | | | |
| `warning` | | | |
| `danger` | | | |

### Typography

| Token | Value | Usage |
|---|---|---|
| `font_display` | | headings |
| `font_body` | | body |
| `font_mono` | | data/code |
| `scale` | | sizes |
| `weights` | | 400/500/600/700 |

### Layout

| Token | Value | Usage |
|---|---|---|
| `spacing` | | 4/8/12/16/24/32/48/64 |
| `radius` | | |
| `shadow` | | |
| `focus_ring` | | |

## 3. Components + States

For each component, specify all states. No missing states.

| Component | Default | Hover | Active | Focus | Disabled | Loading | Error |
|---|---|---|---|---|---|---|---|
| Button (primary) | | | | | | | |
| Button (secondary) | | | | | | | |
| Input | | | | | | | |
| Select | | | | | | | |
| Card | | | | | | | |

## 4. Responsive Behavior

| Breakpoint | Width | Layout changes | Component changes |
|---|---:|---|---|
| Mobile | < 640px | | |
| Tablet | 640-1024px | | |
| Desktop | > 1024px | | |

## 5. Accessibility

- **Contrast**: text >= 4.5:1, large text >= 3:1
- **Keyboard**: full navigation, logical tab order, no traps
- **Focus**: visible focus ring on all interactive elements
- **Screen reader**: labels, ARIA notes for custom widgets
- **Reduced motion**: `prefers-reduced-motion` fallbacks
- **Errors**: inline error copy + `aria-describedby` + `aria-invalid`

## 6. Empty / Loading / Error States

| State | Visual | Copy | Action |
|---|---|---|---|
| Empty | | | |
| Loading | | | |
| Error | | | |

## 7. Handoff Notes

- **Target app**: `padel-finder` / `padel-passport-preview`
- **Implementation notes**:
- **Out of scope**:
- **Open questions**:

