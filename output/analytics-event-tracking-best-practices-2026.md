# Product Analytics Event Tracking Best Practices (Jan–Feb 2026)

Research summary for web app analytics: event naming, schema versioning, privacy, sampling, batching, client vs server, deduplication, identity, minimal viable analytics, and pluggable sinks.

---

## 1. Recommended Event Spec + Naming

### 1.1 Naming Convention: `category:object_action`

Use **lowercase**, **snake_case**, **present-tense verbs**:

| Element | Rule | Example |
|---------|------|---------|
| **Category** | Context/flow | `signup_flow`, `account_settings`, `checkout` |
| **Object** | Component or location | `forgot_password_button`, `pricing_page` |
| **Action** | Verb (present tense) | `click`, `submit`, `view`, `create` |

**Examples:**
- `signup_flow:pricing_page_view`
- `account_settings:forgot_password_button_click`
- `checkout:payment_form_submit`

### 1.2 Allowed Verbs (Whitelist)

```
click, submit, create, view, add, invite, update, delete, remove,
start, end, cancel, fail, generate, send
```

### 1.3 Property Naming

| Pattern | Use Case | Example |
|---------|----------|---------|
| `object_adjective` | General | `user_id`, `item_price`, `member_count` |
| `is_` / `has_` | Booleans | `is_subscribed`, `has_seen_upsell` |
| `_date` / `_timestamp` | Temporal | `user_creation_date`, `last_login_timestamp` |

### 1.4 Core Event Schema (v1)

```typescript
interface AnalyticsEvent {
  // Required
  event_id: string;           // UUID for deduplication
  event_name: string;         // category:object_action
  timestamp: string;           // ISO 8601
  schema_version: string;     // e.g. "1.0.0"

  // Identity
  user_id?: string | null;    // Authenticated user ID (null if anonymous)
  anonymous_id: string;       // Device/session UUID (persisted in cookie + localStorage)
  session_id: string;         // Per-session UUID

  // Context (auto-captured)
  source: "client" | "server";
  url?: string;
  referrer?: string;
  user_agent?: string;

  // Custom properties (event-specific)
  properties?: Record<string, unknown>;
}
```

### 1.5 Schema Versioning

- **Patch (1.0.x)**: New optional fields, backward compatible
- **Minor (1.x.0)**: Additive changes consumers can ignore
- **Major (x.0.0)**: Breaking changes; create new event name (e.g. `registration_v2:sign_up_button_click`)

**Rule:** Never overwrite production schemas. Create new versions; deprecate old ones with a fixed window.

---

## 2. Privacy, Sampling, Batching, Client vs Server, Dedupe, Identity

### 2.1 Privacy (GDPR/CCPA)

| Approach | Data Loss | Compliance |
|----------|-----------|------------|
| **Consent-only** | 60–87% rejection (EU) | Strong |
| **Legitimate interest** | ~0% | Requires LIA, DPA |
| **GA4 Consent Mode** | Recovers ~70% via modeling | Anonymous pings when denied |

**Recommendations:**
- Use consent mode / cookieless pings when consent denied
- Add `consent_granted: boolean` to events
- Minimize PII; hash or omit where possible
- Filter internal users (`is_employee`, `is_test_user`)

### 2.2 Sampling

- **High-volume events**: Sample 1–10% server-side before ingestion
- **Critical events** (signup, purchase): Never sample
- Add `sampling_rate: number` (e.g. `0.1`) to sampled events for correct aggregation

### 2.3 Batching

- **Client**: Batch 5–10 events or 30s flush; use `navigator.sendBeacon()` on page unload
- **Server**: Batch per-request or use 100–500 event batches with 5s window
- Reduces network calls and improves reliability

### 2.4 Client vs Server Events

| Use Case | Prefer | Reason |
|----------|--------|--------|
| Signups, purchases, conversions | **Server** | Accuracy, no ad-blocker impact |
| Page views, clicks, scrolls | **Client** | Journey context, partial data OK |
| Feature usage, form submits | **Server** when possible | More reliable |

**Rule:** Prefer backend when accuracy matters; use client for journeys and UX signals.

### 2.5 Deduplication

- **Event ID**: Generate UUID per event; send with every request
- **Window**: 7-day dedup window (industry standard)
- **Retries**: Use same `event_id` on retry; sinks drop duplicates
- **Client + Server**: If both send same action, use same `event_id` or `insert_id`

### 2.6 Session & User Identity

| ID Type | When | Storage |
|---------|------|---------|
| **anonymous_id** | Before login | Cookie + localStorage (fallback) |
| **user_id** | After login | Set via `identify()` |
| **session_id** | Per session | New on tab open or 30min inactivity |

**Best practice:** Call `identify(userId)` after auth; link anonymous_id → user_id for merge. Store IDs in both cookie and localStorage for resilience.

---

## 3. Minimal Viable Analytics (Ship in One Night)

### 3.1 MVP Event Set (5–8 events)

| Event | When | Source |
|-------|------|--------|
| `app:page_view` | Route change | Client |
| `auth:signup_complete` | User created | Server |
| `auth:login_complete` | Session started | Server |
| `app:feature_click` | Key CTA (e.g. upgrade) | Client |
| `app:form_submit` | Critical form | Client or Server |
| `billing:checkout_complete` | Purchase | Server |

### 3.2 MVP Properties (Always Include)

- `user_id`, `anonymous_id`, `session_id`
- `url`, `referrer`
- `event_id` (UUID)
- `schema_version`

---

## 4. Pluggable Sink Architecture

### 4.1 Abstraction Layer

```
App → AnalyticsClient.track(event) → [PostHog Sink, GA4 Sink, Supabase Sink]
```

Single instrumentation; multiple backends via adapter pattern.

### 4.2 Sink Adapters

| Sink | Method | Notes |
|------|--------|-------|
| **PostHog** | `posthog.capture()` or HTTP `/capture` | Reverse proxy recommended for ad-blocker bypass |
| **GA4** | `gtag('event', ...)` or Measurement Protocol | Server: Measurement Protocol API |
| **Supabase** | `INSERT INTO analytics_events` | Custom table; full control |

### 4.3 Supabase Table Schema

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,  -- Dedup key
  event_name TEXT NOT NULL,
  schema_version TEXT NOT NULL DEFAULT '1.0.0',
  user_id TEXT,
  anonymous_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('client', 'server')),
  url TEXT,
  referrer TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
```

---

## 5. Minimal Implementation Steps for Next.js

### Step 1: Create Analytics Client (30 min)

```typescript
// lib/analytics.ts
import { v4 as uuidv4 } from 'uuid';

type Sink = (event: AnalyticsEvent) => Promise<void>;

interface AnalyticsEvent {
  event_id: string;
  event_name: string;
  timestamp: string;
  schema_version: string;
  user_id?: string | null;
  anonymous_id: string;
  session_id: string;
  source: 'client' | 'server';
  url?: string;
  properties?: Record<string, unknown>;
}

const sinks: Sink[] = [];

export function addSink(sink: Sink) {
  sinks.push(sink);
}

export async function track(
  eventName: string,
  properties?: Record<string, unknown>,
  source: 'client' | 'server' = 'client'
) {
  const event: AnalyticsEvent = {
    event_id: uuidv4(),
    event_name: eventName,
    timestamp: new Date().toISOString(),
    schema_version: '1.0.0',
    anonymous_id: getAnonymousId(),
    session_id: getSessionId(),
    source,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    properties,
  };
  await Promise.allSettled(sinks.map((s) => sink(event)));
}
```

### Step 2: Implement Sinks (45 min)

- **PostHog**: `posthog.capture(event_name, properties)` or `/capture` API
- **GA4**: `gtag('event', event_name, properties)` (client) or Measurement Protocol (server)
- **Supabase**: `supabase.from('analytics_events').insert({...})`

### Step 3: Next.js Integration (30 min)

- **Client**: `instrumentation-client.ts` to init analytics; `useEffect` in layout for session ID
- **Server**: API route or Server Action that calls `track(..., 'server')`
- **Router**: `onRouterTransitionStart` in instrumentation for `app:page_view`

### Step 4: Batching (Optional, 20 min)

- Use a queue (e.g. 10 events or 5s) before flushing to sinks
- `navigator.sendBeacon()` for unload events

### Step 5: Filter Internal Users (15 min)

- Add `is_employee` / `is_test_user` from env or user metadata
- Filter in each sink before sending

---

## 6. Validation / QA Plan

### 6.1 Pre-Production

| Check | Method |
|-------|--------|
| **Event naming** | Lint against `category:object_action` regex |
| **Schema validation** | Zod/Joi schema for `AnalyticsEvent` |
| **Required fields** | Unit tests for missing `event_id`, `anonymous_id`, etc. |

### 6.2 QA Checklist

- [ ] Events fire in dev/staging (verify in PostHog/GA4/Supabase)
- [ ] `event_id` is unique per event
- [ ] Same `event_id` on retry does not create duplicates
- [ ] Internal users filtered (localhost, test emails)
- [ ] Consent respected (no PII when denied)
- [ ] Page views on client-side navigation
- [ ] Server events for signup/login/purchase

### 6.3 Golden Baseline (Recommended)

1. Define expected events + properties per key flow
2. Run E2E tests; capture actual events
3. Diff against baseline; fail on mismatch
4. Use tools like Trackingplan for automated QA

### 6.4 Monitoring

- **Volume**: Event count by `event_name` (alert on sudden drop)
- **Latency**: P95 for sink delivery
- **Errors**: Failed sink calls (log + retry)
- **Dedup rate**: Duplicate `event_id` count (should be 0 after dedup)

---

## References

- [PostHog Product Analytics Best Practices](https://posthog.com/docs/product-analytics/best-practices)
- [Amplitude Event Tracking Guide](https://amplitude.com/explore/analytics/event-tracking-guide)
- [Amplitude Deduplication at Scale](https://amplitude.engineering/dedupe-events-at-scale-f9e416e46ca9)
- [Next.js Analytics Guide](https://nextjs.org/docs/app/guides/analytics)
- [GA4 Consent Mode 2025](https://sranalytics.io/blog/ga4-consent-mode/)
- [Schema Versioning Best Practices](https://warpdriven.ai/en/blog/industry-1/schema-versioning-best-practices-analytics-deprecate-without-chaos-109)
- [Segment Identity Best Practices](https://segment.com/docs/connections/spec/best-practices-identify/)
