# Next.js App Router Frontend Agent Guide (Jan–Feb 2026)

Research-backed guidance for building high-quality Next.js App Router frontends with React 18/19. Focus areas: accessibility, performance, UI state patterns, and design-system tokenization.

---

## 1. Frontend Agent Checklist

Use this checklist when building or reviewing Next.js App Router frontends.

### Accessibility

- [ ] **Semantic HTML** — Use `<button>`, `<h1>`, `<nav>`, `<main>`, etc. instead of non-semantic `<div>` for interactive/structural elements
- [ ] **Form labels** — Every form control has a descriptive label; use `htmlFor` in JSX for label association
- [ ] **ARIA when needed** — Use `aria-label`, `aria-describedby`, `role="alert"` for dynamic content and custom widgets
- [ ] **Keyboard navigation** — All interactive elements operable via keyboard; focus order is logical
- [ ] **Focus management** — Focus is preserved or moved appropriately when views change (e.g., modals, route changes)
- [ ] **Color contrast** — Text meets WCAG contrast requirements (4.5:1 for normal text, 3:1 for large)
- [ ] **ESLint a11y** — `eslint-plugin-jsx-a11y` enabled and passing
- [ ] **Global error/404** — `app/global-error.tsx` and `app/global-not-found.tsx` (or `global-not-found.js`) provide accessible fallbacks

### Performance

- [ ] **Server Components default** — Components are Server Components unless they need `useState`, `useEffect`, or event handlers
- [ ] **`"use client"` placement** — Client boundary pushed as low as possible; avoid adding `"use client"` “just to make it work”
- [ ] **Parallel data fetching** — Independent fetches use `Promise.all()` instead of sequential `await`
- [ ] **No Route Handler from Server Components** — Call data logic directly; avoid `fetch('/api/...')` from Server Components
- [ ] **Suspense + loading.tsx** — Async Server Components wrapped in Suspense; `loading.tsx` used for route-level loading
- [ ] **Explicit cache control** — `cache: "no-store"` for dynamic data; `next: { revalidate: N }` for time-based revalidation
- [ ] **Images** — `next/image` for all images (lazy loading, modern formats)
- [ ] **Fonts** — `next/font` for font optimization and reduced layout shift
- [ ] **Lazy load heavy Client Components** — `dynamic()` with `ssr: false` where appropriate
- [ ] **Bundle hygiene** — Named imports from libraries (e.g., `import { X } from 'lib'`) to enable tree-shaking

### Design System Tokenization

- [ ] **CSS variables for tokens** — Colors, spacing, typography, radii defined as `--token-name` custom properties
- [ ] **Semantic token layers** — Base tokens (e.g., `--color-blue-500`) → semantic tokens (e.g., `--color-primary`) → component tokens
- [ ] **Theme switching** — `[data-theme="dark"]` (or similar) scopes variables for light/dark mode
- [ ] **Token aliasing** — Tokens reference other tokens to form a hierarchy
- [ ] **Design Tokens spec** — Consider W3C Design Tokens Community Group format (Oct 2025) for cross-tool consistency

### UI State Patterns

- [ ] **Server state vs client state** — Server data fetched in Server Components; client state (modals, filters, form drafts) in Client Components
- [ ] **State library choice** — Zustand or Jotai for global UI state; Context reserved for theme, auth, locale
- [ ] **Layout state** — Avoid storing page-specific state in shared layouts; layouts persist across navigation

### Routing & Data

- [ ] **`<Link>` for navigation** — Use Next.js `<Link>` for client-side navigation and prefetching
- [ ] **Revalidation after mutations** — Call `revalidatePath()` or `revalidateTag()` after Server Actions that mutate data
- [ ] **Redirect placement** — `redirect()` outside try/catch; use Server Actions for client-triggered redirects

---

## 2. Performance Pitfalls

Common mistakes that hurt performance and how to avoid them.

### Data Fetching Waterfalls

| Pitfall | Fix |
|--------|-----|
| Sequential `await` chains | Use `Promise.all()` for independent fetches |
| Fetching in Route Handler from Server Component | Call data logic directly in Server Component |
| Same data fetched in multiple layouts | Fetch once at the appropriate level; use `unstable_cache` for non-fetch logic |
| Large JSON payloads with unused fields | Trim responses; use GraphQL or field selection where possible |

**Example — avoid:**
```ts
const user = await getUser();
const settings = await getSettings(user.id);  // waterfall
const recs = await getRecs(settings);         // waterfall
```

**Example — prefer:**
```ts
const [user, settings] = await Promise.all([getUser(), getSettings()]);
const recs = await getRecs(settings);  // only if depends on settings
```

### Client/Server Boundary

| Pitfall | Fix |
|--------|-----|
| Adding `"use client"` to fix hydration/import errors | Move client logic into a leaf component; keep parent as Server Component |
| Context providers in Server Components | Create a Client Component provider that wraps `children`; use in layout |
| Error boundaries without `"use client"` | `error.tsx` must be a Client Component |

### Caching

| Pitfall | Fix |
|--------|-----|
| `fetch` cached when data should be dynamic | Use `cache: "no-store"` or `next: { revalidate: 0 }` |
| Route Handlers prerendered when dynamic | Add `export const dynamic = 'force-dynamic'` or use Dynamic APIs |
| Stale data after mutations | Call `revalidatePath()` or `revalidateTag()` in Server Action |

### Suspense & Loading

| Pitfall | Fix |
|--------|-----|
| Suspense inside async component | Place Suspense *above* the async component that fetches |
| Whole route blocked by one slow fetch | Wrap slow parts in Suspense; use `loading.tsx` for route-level fallback |
| No loading UI for async pages | Add `loading.tsx` in route segment |

### Bundle Size

| Pitfall | Fix |
|--------|-----|
| Full library imports | Use named imports: `import { X } from 'lib'` |
| Heavy deps in Client Components | Lazy load with `dynamic()`; consider server-side alternatives |
| CSS-in-JS runtime overhead | Prefer CSS Modules or Tailwind; evaluate CSS-in-JS bundle impact |

### Dynamic APIs

| Pitfall | Fix |
|--------|-----|
| `cookies()` or `searchParams` in root layout | Wraps entire app in dynamic rendering; move to specific routes or wrap in boundaries |
| `useSearchParams` in Client when server has it | Use `searchParams` prop in Server Component page |

---

## 3. Testing Strategy

### Unit & Integration (Vitest + React Testing Library)

**Setup:** Vitest for fast unit/integration tests; React Testing Library for component tests.

**Query priority (Testing Library):**
1. `getByRole` / `findByRole` — preferred; encourages accessible markup
2. `getByLabelText` — forms
3. `getByPlaceholderText` — when no label
4. `getByText` — non-interactive content
5. `getByTestId` — last resort; use semantic queries when possible

**Best practices:**
- Test from the user’s perspective, not implementation details
- Prefer `userEvent` over `fireEvent` for interactions
- Use `findBy*` for async elements (built-in waiting)
- Use `waitFor` / `waitForElementToBeRemoved` for async behavior
- Centralize test IDs in a constants file with hierarchical naming (e.g., `auth.login-form.email-input`)

**What to unit test:**
- Client Components (forms, modals, interactive UI)
- Utility functions and hooks
- Server Actions (via `@testing-library/react` or direct invocation)

**What to avoid in unit tests:**
- Testing Server Components in isolation (they expect server context)
- Mocking implementation details; mock at boundaries (API, DB)

### E2E (Playwright)

**Setup:** `npx create-next-app@latest --example with-playwright` or `npm init playwright`.

**Why Playwright for Next.js:**
- Exercises full stack: SSR, hydration, API routes
- Works with App Router, Server Components, and Client Components
- Multi-browser (Chromium, Firefox, WebKit)
- Built-in mobile emulation

**Best practices:**
- Run against production build: `npm run build && npm run start`
- Or use `webServer` in Playwright config to start dev server
- Test user-visible behavior, not implementation
- Isolate tests: fresh storage, cookies, and data per test (`beforeEach`)
- Use Playwright locators (auto-wait, retries)
- Mock third-party APIs via `page.route()` instead of testing real external services

**E2E coverage:**
- Critical user flows (signup, checkout, core features)
- Navigation and routing
- Form submission and validation
- Error states (404, error boundaries)
- Accessibility (e.g., `@axe-core/playwright`)

### Testing Pyramid

```
        /\
       /  \     E2E (Playwright) — few, critical paths
      /----\
     /      \   Integration — key flows, Server + Client
    /--------\
   /          \ Unit (Vitest + RTL) — components, hooks, utils
  /------------\
```

### Quick Commands

```bash
# Unit tests
npm run test          # Vitest

# E2E tests
npx playwright test   # Headless
npx playwright test --headed  # With browser
npx playwright test --ui      # Playwright UI
```

---

## References

- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist) (Feb 2026)
- [Next.js Data Fetching Patterns](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Vercel: Common App Router Mistakes](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)
- [Next.js Playwright Testing Guide](https://nextjs.org/docs/app/guides/testing/playwright)
- [Design Tokens Technical Reports 2025.10](https://www.designtokens.org/TR/2025.10/)
- [React Accessibility](https://react.dev/learn/accessibility)
- [Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro/)
