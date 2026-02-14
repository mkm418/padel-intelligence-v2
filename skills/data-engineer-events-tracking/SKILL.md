# Data Engineer — Events Tracking

> Implement and maintain event tracking for padel-finder: analytics, schema, identity, sinks, and QA validation.

## When to Use This Skill

- User asks to add event tracking, analytics instrumentation, or telemetry
- User wants to implement or extend the analytics schema
- User needs to configure sinks (PostHog, GA4, Supabase) or add new ones
- User asks to validate events, fix QA failures, or audit event coverage

---

## 1. Event Naming

**Convention:** `category:object_action` — lowercase, snake_case, present-tense verb.

| Element | Rule | Example |
|---------|------|---------|
| **Category** | Context/flow | `search_flow`, `clubs_page`, `compare` |
| **Object** | Component or location | `search_input`, `player_card`, `club_row` |
| **Action** | Verb (whitelist) | `click`, `submit`, `view`, `select`, `change` |

**Allowed verbs:** `click`, `submit`, `view`, `select`, `change`, `add`, `remove`, `start`, `end`, `fail`, `create`, `update`, `delete`, `send`.

**Property naming:** `object_adjective` (e.g. `player_id`), `is_` / `has_` for booleans, `_date` / `_timestamp` for temporal.

---

## 2. Schema Versioning

- **Patch (1.0.x):** New optional fields; backward compatible.
- **Minor (1.x.0):** Additive changes; consumers can ignore.
- **Major (x.0.0):** Breaking changes; create new event name (e.g. `search_v2:player_result_click`).

**Rule:** Never overwrite production schemas. Deprecate old events with a fixed window.

---

## 3. Identity / Session / Anonymous ID

| ID Type | When | Storage |
|---------|------|---------|
| **anonymous_id** | Before login | Cookie + localStorage fallback |
| **user_id** | After login | Set via `identify()` |
| **session_id** | Per session | New on tab open or 30min inactivity |

**Best practice:** Call `identify(userId)` after auth; link `anonymous_id` → `user_id` for merge. Store IDs in both cookie and localStorage for resilience.

---

## 4. Pluggable Sinks

**Architecture:** `App → AnalyticsClient.track(event) → [PostHog, GA4, Supabase, …]`

- Single instrumentation; multiple backends via adapter pattern.
- `addSink(sink)` registers a sink; `track()` fans out to all sinks.
- Use `Promise.allSettled()` so one sink failure does not block others.

**Sink adapters:** PostHog (`posthog.capture` or HTTP `/capture`), GA4 (`gtag` or Measurement Protocol), Supabase (`INSERT INTO analytics_events`).

---

## 5. Next.js Instrumentation

**Client-side:** `instrumentation-client.ts` at project root:

- Initialize analytics on load.
- Set `anonymous_id` from cookie/localStorage; generate `session_id` if missing.
- Use `onRouterTransitionStart` (or equivalent) for `app:page_view` on client-side navigation.

**Server-side:** API routes or Server Actions call `track(eventName, properties, 'server')` for critical events (signup, purchase).

**Batching:** Queue 5–10 events or 30s flush; use `navigator.sendBeacon()` on page unload.

### Research sources (Jan 1, 2026 → Feb 13, 2026)

- **Next.js `instrumentation-client.ts` (before hydration; last updated 2026-02-11)**: `https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client`
- **PostHog naming + versioning + backend-vs-frontend tracking**: `https://posthog.com/questions/best-practices-naming-convention-for-event-names-and-properties`
- **PostHog schema management (typed property groups; event names immutable)**: `https://posthog.com/docs/product-analytics/schema-management`
- **Suite research log (this repo)**: `output/research/agent-suite-research-20260101-20260213.md`

---

## 6. QA Validation

| Check | Method |
|-------|--------|
| **Event naming** | Lint against `category:object_action` regex |
| **Schema validation** | Zod/Joi schema for `AnalyticsEvent` |
| **Required fields** | Unit tests for `event_id`, `anonymous_id`, `session_id` |
| **Deduplication** | Same `event_id` on retry does not create duplicates |
| **Golden baseline** | E2E: define expected events per flow; diff against baseline; fail on mismatch |

**Monitoring:** Event volume by `event_name`, P95 latency, failed sink calls, dedup rate.

---

## 7. Padel-Finder Event Map

### Search (`/search`)

| Event | When | Properties |
|-------|------|------------|
| `search_flow:search_page_view` | Page mounts | `country_filter`, `tier_filter` |
| `search_flow:search_input_change` | User types in search | `query_length`, `has_results` |
| `search_flow:player_result_click` | User selects player from results | `player_id`, `player_name`, `tier` |
| `search_flow:recent_search_click` | User clicks recent search | `query` |
| `search_flow:tier_filter_change` | User changes tier filter | `tier` |
| `search_flow:country_filter_change` | User changes country filter | `country` |

### Clubs (`/leaderboards/clubs`)

| Event | When | Properties |
|-------|------|------------|
| `clubs_page:clubs_page_view` | Page mounts | `club_count` |
| `clubs_page:club_row_click` | User clicks club row | `club_name`, `city`, `player_count` |
| `clubs_page:sort_change` | User changes sort | `sort_by` |
| `clubs_page:city_filter_change` | User filters by city | `city` |

### Compare (`/compare`)

| Event | When | Properties |
|-------|------|------------|
| `compare:compare_page_view` | Page mounts | `player1_id`, `player2_id` (if from URL) |
| `compare:player_select` | User selects player from dropdown | `slot` (1 or 2), `player_id`, `player_name` |
| `compare:share_click` | User clicks share | `player1_id`, `player2_id` |
| `compare:clear_click` | User clears selection | `slot` |

### Player (`/player/[id]`)

| Event | When | Properties |
|-------|------|------------|
| `player_profile:player_profile_view` | Page mounts | `player_id`, `player_name`, `tier` |
| `player_profile:compare_click` | User clicks "Compare" CTA | `player_id` |
| `player_profile:club_card_click` | User clicks club link | `club_name`, `city` |
| `player_profile:badge_click` | User clicks badge | `badge_type` |

---

## Core Event Schema (v1)

```typescript
interface AnalyticsEvent {
  event_id: string;           // UUID for deduplication
  event_name: string;         // category:object_action
  timestamp: string;          // ISO 8601
  schema_version: string;     // e.g. "1.0.0"
  user_id?: string | null;
  anonymous_id: string;
  session_id: string;
  source: "client" | "server";
  url?: string;
  referrer?: string;
  properties?: Record<string, unknown>;
}
```

---

## References

- `output/analytics-event-tracking-best-practices-2026.md` — Full spec
- `padel-finder/src/app/search/page.tsx` — Search page
- `padel-finder/src/app/leaderboards/clubs/page.tsx` — Clubs page
- `padel-finder/src/app/compare/page.tsx` — Compare page
- `padel-finder/src/app/player/[id]/page.tsx` — Player profile
