# QA Strategy: Ship Tonight

**Scope:** Minimal, high-impact tests for padel-finder, API routes, and Python pipelines.  
**Target:** Realistic to implement and run in one evening.

---

## 1. E2E Playwright Flows (5 tests) — padel-finder

**Setup:** Install Playwright in padel-finder (Next.js 16, React 19).

```bash
cd padel-finder && npm install -D @playwright/test && npx playwright install chromium
```

**Base URL:** `http://localhost:3000` (run `npm run dev` before tests).

| # | Flow | Assertions | Why Critical |
|---|------|------------|--------------|
| 1 | **Homepage loads** | Page renders, map placeholder or clubs visible, no 500 | First impression; catches build/runtime errors |
| 2 | **Leaderboards → level** | Navigate to `/leaderboards/level`, table/cards render, at least one player | Core data-driven page; validates JSON load |
| 3 | **Search** | Go to `/search`, type "Miami", results appear | Search API + clubs.json; high-traffic path |
| 4 | **Player profile** | Navigate to `/player/[id]` with known ID (e.g. from `players.json`), profile loads | Player detail + match-history API |
| 5 | **Clubs** | Go to `/clubs`, map or list renders | Clubs geo + JSON; critical for discovery |

**Test file:** `padel-finder/e2e/critical.spec.ts`

**Notes:**
- Use a known player ID from `public/players.json` for flow 4.
- Keep tests fast: no heavy waits; use `page.waitForSelector` for key elements.
- Skip padel-passport-preview for tonight; focus on padel-finder.

---

## 2. Unit/Integration Tests (10 tests) — API Routes

**Framework:** Vitest (or Jest) — minimal setup, fits Next.js 16.

**Target:** Routes that read JSON files and validate params. Mock external APIs (Playtomic) where needed.

| # | Route | Test | Focus |
|---|-------|------|-------|
| 1 | `GET /api/leaderboards` | Returns 200, `leaderboard` array, `stats` object | File I/O (players.json), type/level filters |
| 2 | `GET /api/leaderboards?type=level&gender=M` | Valid structure, gender filter applied | Query param validation |
| 3 | `GET /api/search` | Query "Miami" returns clubs with `count` | clubs.json, search logic |
| 4 | `GET /api/search` (empty) | `q` and `country` both empty → `clubs: []` | Edge case |
| 5 | `GET /api/clubs-geo` | Missing `lat`/`lon` → 400 | Required params |
| 6 | `GET /api/clubs-geo?lat=25.7&lon=-80.2` | Returns clubs with `distance`, `center` | Haversine, radius filter |
| 7 | `GET /api/players` | Returns `players` array, `total`, `hasMore` | players.json + player_pictures.json |
| 8 | `GET /api/players?get_clubs=true` | Returns `clubs` array | Alternate response shape |
| 9 | `GET /api/match-history` | Missing `user_id` → 400 | Required params |
| 10 | `GET /api/compare` | Missing `player1` or `player2` → 400 | Required params |

**Test file:** `padel-finder/src/app/api/__tests__/routes.test.ts`

**Approach:**
- Use `NextRequest` with `searchParams` to call route handlers directly.
- For routes that read JSON at build time (import), no mocking needed.
- For `match-history` and `compare`, mock `fetch` if testing live API; or test only precomputed path with `mode=precomputed`.

---

## 3. Pytest Tests (5 tests) — Pipelines

**Setup:** `pytest` in `requirements.txt` (already common; add if missing).

**Target:** Pure logic, file I/O, validation — no Apify/Playtomic API calls in tests.

| # | Module | Test | Focus |
|---|--------|------|-------|
| 1 | `merge_players.is_valid_player` | Filter placeholder names, empty names, valid names | Validation logic |
| 2 | `merge_players.load_players_from_file` | Missing file → empty list; valid JSON → players | File I/O, error handling |
| 3 | `merge_players.merge_players` | Dedupe by `user_id`, sort by level | Integration with small fixture |
| 4 | `process_enriched_data.split_by_state` | Courts grouped by state, state slug correct | State split logic |
| 5 | `process_enriched_data` (or scrape) | JSON schema validation | Output has required keys (`courts`, `metadata`) |

**Test file:** `tests/test_pipelines.py`

**Fixtures:**
- `tests/fixtures/players_sample.json` — 5–10 players for merge tests.
- `tests/fixtures/courts_sample.json` — 3–5 courts with `state` for split tests.

**Notes:**
- Refactor `merge_players` and `process_enriched_data` to accept paths as args for testability.
- Or use `tmp_path` and copy fixtures into temp dirs.

---

## Execution Order

1. **Pytest** (fastest): `pytest tests/ -v`
2. **API tests**: `cd padel-finder && npm run test` (or `npx vitest run`)
3. **E2E**: `cd padel-finder && npm run dev` (in background), then `npx playwright test`

**Total time estimate:** 2–3 hours to implement + ~10 min to run.

---

## Out of Scope (Tonight)

- padel-passport-preview
- Full coverage of all 22 API routes
- Visual regression tests
- API routes that call external APIs (club-details, compare live) — only param validation
- Scrapers that run Apify (mock or skip)

---

## File Structure

```
padel-finder/
├── e2e/
│   └── critical.spec.ts
├── src/app/api/
│   └── __tests__/
│       └── routes.test.ts
└── package.json  # add test scripts

tests/
├── fixtures/
│   ├── players_sample.json
│   └── courts_sample.json
└── test_pipelines.py
```

---

## Checklist Before Ship

- [ ] All 5 E2E tests pass
- [ ] All 10 API tests pass
- [ ] All 5 pytest tests pass
- [ ] `npm run build` succeeds
- [ ] No new linter errors
