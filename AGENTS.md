# Padel Passport — Growth Agent Prompts

Run these in order. Each is a self-contained agent task designed for autonomous execution.

---

## Agent 1: Multi-City Database & Sync Infrastructure

**Priority: HIGHEST — unlocks everything else**

```
Task: Add multi-city support to the Padel Passport platform.

Currently the app is hardcoded to Miami. We need to support 25+ cities using
the same Playtomic API + Supabase stack. The Playtomic API works globally —
you just change the coordinate + radius.

## Current Architecture

Database (Supabase):
- `players` table: 27K rows, has `clubs` text[] column but NO city column
- `matches` table: 17K rows, has `club_name` but NO city column
- `edges` table: 101K rows, links players by source/target
- `signups` table: email captures
- `sync_log` table: tracks cron runs

Sync cron: `app/src/app/api/cron/sync/route.ts`
- Hardcoded: MIAMI = "25.7617,-80.1918", RADIUS = 80000
- Fetches clubs via `https://api.playtomic.io/v1/tenants?coordinate=...&radius=...&sport_id=PADEL`
- Fetches matches per club, upserts to Supabase
- Recomputes player stats + edges via RPCs

## Requirements

### 1. Create `cities` config table in Supabase

Run this SQL via Supabase dashboard or migration:

CREATE TABLE cities (
  slug TEXT PRIMARY KEY,           -- e.g. "miami", "madrid", "new-york"
  name TEXT NOT NULL,              -- "Miami", "Madrid", "New York"
  country TEXT NOT NULL,           -- "US", "ES", "AR"
  coordinate TEXT NOT NULL,        -- "25.7617,-80.1918"
  radius INTEGER DEFAULT 80000,   -- search radius in meters
  timezone TEXT DEFAULT 'UTC',
  enabled BOOLEAN DEFAULT true,
  player_count INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,
  club_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON cities FOR SELECT USING (true);

-- Seed Miami (our existing data)
INSERT INTO cities (slug, name, country, coordinate, radius, timezone)
VALUES ('miami', 'Miami', 'US', '25.7617,-80.1918', 80000, 'America/New_York');

### 2. Add `city` column to players and matches

ALTER TABLE players ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'miami';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'miami';
ALTER TABLE edges ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'miami';

-- Index for city-scoped queries (critical for performance)
CREATE INDEX IF NOT EXISTS idx_players_city ON players(city);
CREATE INDEX IF NOT EXISTS idx_matches_city ON matches(city);
CREATE INDEX IF NOT EXISTS idx_edges_city ON edges(city);

-- Backfill existing data
UPDATE players SET city = 'miami' WHERE city IS NULL;
UPDATE matches SET city = 'miami' WHERE city IS NULL;
UPDATE edges SET city = 'miami' WHERE city IS NULL;

### 3. Refactor sync cron to be city-aware

File: `app/src/app/api/cron/sync/route.ts`

Current hardcoded config:
  const API = "https://api.playtomic.io/v1";
  const MIAMI = "25.7617,-80.1918";
  const RADIUS = 80000;

Change to:
- Accept `?city=miami` query param (or sync all enabled cities if no param)
- Fetch city config from the `cities` table
- Use the city's coordinate + radius for Playtomic API calls
- Tag all upserted matches and players with the city slug
- Update cities.player_count, match_count, club_count, last_synced_at after sync
- Handle players who appear in multiple cities (a player can have multiple city tags)

The sync function should work like this:
1. If `?city=slug` param provided, sync only that city
2. If no param, fetch all enabled cities and sync each sequentially
3. For each city: fetch clubs → fetch matches → upsert matches with city tag →
   recompute stats → recompute edges → update city stats

### 4. Update the RPCs

The Supabase RPCs `recompute_player_stats` and `recompute_edges_for_players`
need to be aware of the city column. When recomputing, the city should be set
based on which clubs the matches were at.

A player's `city` should be set to their most-played city. Or better: keep it
as the city column on matches, and players can appear in multiple cities.
Actually, simplest approach: players already have a `clubs` array. Add a `cities`
text[] array to players (similar pattern). Populated during recompute.

### 5. Create per-city cron endpoints

For Vercel cron, we can't easily pass query params. Create a fan-out approach:

File: `app/src/app/api/cron/sync-all/route.ts`
- Fetches all enabled cities from Supabase
- Calls the sync endpoint for each city sequentially (or via fetch to itself)
- Or: just loop through cities inline

Update `vercel.json` to call this new endpoint instead:
{
  "crons": [{ "path": "/api/cron/sync-all", "schedule": "0 6 * * *" }]
}

### 6. Add city-scoped API routes

All existing API routes need a `?city=miami` filter:

- `app/src/app/api/rankings/route.ts` — Add city filter to Supabase query
- `app/src/app/api/player/[id]/route.ts` — Player data (no change needed, players are global)
- `app/src/app/api/player/[id]/matches/route.ts` — Filter matches by city
- `app/src/app/api/h2h/route.ts` — H2H can be cross-city, no filter needed
- `app/src/app/api/network/route.ts` — Filter edges by city
- `app/src/app/api/clubs/route.ts` — Filter by city
- `app/src/app/api/tournaments/route.ts` — Filter by city coordinate

Pattern for each route:
  const city = request.nextUrl.searchParams.get("city") || "miami";
  // Add .eq("city", city) to Supabase queries

### 7. Seed initial cities

After the infrastructure is built, seed these cities (we'll sync them in Agent 2):

INSERT INTO cities (slug, name, country, coordinate, radius, timezone) VALUES
  ('madrid', 'Madrid', 'ES', '40.4168,-3.7038', 50000, 'Europe/Madrid'),
  ('barcelona', 'Barcelona', 'ES', '41.3874,2.1686', 50000, 'Europe/Madrid'),
  ('new-york', 'New York', 'US', '40.7128,-74.0060', 80000, 'America/New_York'),
  ('los-angeles', 'Los Angeles', 'US', '34.0522,-118.2437', 80000, 'America/Los_Angeles'),
  ('dallas', 'Dallas', 'US', '32.7767,-96.7970', 80000, 'America/Chicago'),
  ('houston', 'Houston', 'US', '29.7604,-95.3698', 80000, 'America/Chicago'),
  ('austin', 'Austin', 'US', '30.2672,-97.7431', 60000, 'America/Chicago'),
  ('chicago', 'Chicago', 'US', '41.8781,-87.6298', 80000, 'America/Chicago'),
  ('buenos-aires', 'Buenos Aires', 'AR', '-34.6037,-58.3816', 60000, 'America/Argentina/Buenos_Aires'),
  ('mexico-city', 'Mexico City', 'MX', '19.4326,-99.1332', 60000, 'America/Mexico_City'),
  ('stockholm', 'Stockholm', 'SE', '59.3293,18.0686', 50000, 'Europe/Stockholm'),
  ('dubai', 'Dubai', 'AE', '25.2048,55.2708', 60000, 'Asia/Dubai'),
  ('milan', 'Milan', 'IT', '45.4642,9.1900', 50000, 'Europe/Rome'),
  ('rome', 'Rome', 'IT', '41.9028,12.4964', 50000, 'Europe/Rome'),
  ('lisbon', 'Lisbon', 'PT', '38.7223,-9.1393', 50000, 'Europe/Lisbon'),
  ('amsterdam', 'Amsterdam', 'NL', '52.3676,4.9041', 50000, 'Europe/Amsterdam'),
  ('london', 'London', 'GB', '51.5074,-0.1278', 80000, 'Europe/London'),
  ('paris', 'Paris', 'FR', '48.8566,2.3522', 60000, 'Europe/Paris'),
  ('sao-paulo', 'São Paulo', 'BR', '-23.5505,-46.6333', 60000, 'America/Sao_Paulo'),
  ('santiago', 'Santiago', 'CL', '-33.4489,-70.6693', 50000, 'America/Santiago'),
  ('riyadh', 'Riyadh', 'SA', '24.7136,46.6753', 60000, 'Asia/Riyadh'),
  ('doha', 'Doha', 'QA', '25.2854,51.5310', 40000, 'Asia/Qatar'),
  ('malmo', 'Malmö', 'SE', '55.6050,13.0038', 40000, 'Europe/Stockholm'),
  ('valencia', 'Valencia', 'ES', '39.4699,-0.3763', 40000, 'Europe/Madrid'),
  ('berlin', 'Berlin', 'DE', '52.5200,13.4050', 60000, 'Europe/Berlin');

## Success Criteria
- [ ] `cities` table exists with Miami + 25 seeded cities
- [ ] `city` column on players, matches, edges with indexes
- [ ] Existing Miami data backfilled with city='miami'
- [ ] Sync cron accepts city parameter and syncs correctly
- [ ] All API routes accept ?city= filter and default to 'miami'
- [ ] `next build` passes with no errors
- [ ] Existing Miami functionality is unchanged (backward compatible)

## Files to modify:
- app/src/app/api/cron/sync/route.ts (major refactor)
- app/src/app/api/rankings/route.ts (add city filter)
- app/src/app/api/clubs/route.ts (add city filter)
- app/src/app/api/network/route.ts (add city filter)
- app/src/app/api/tournaments/route.ts (add city filter)
- app/src/app/api/player/[id]/matches/route.ts (add city filter)
- app/src/lib/supabase.ts (no change needed)
- vercel.json (update cron path)

## Files to create:
- app/src/app/api/cron/sync-all/route.ts (fan-out to all cities)
- app/src/app/api/cities/route.ts (list available cities)
```

---

## Agent 2: City Selector & Frontend Routing

**Priority: HIGH — makes multi-city visible to users**

```
Task: Add a city selector to the Padel Passport frontend so users can switch
between cities. The backend multi-city support (Agent 1) provides a `cities`
table and ?city= query params on all API routes.

## Current Architecture

- Next.js 16 App Router, React 19, Tailwind CSS 4
- Site name: "Padel Passport" (was "Padel Intelligence", now rebranded)
- Nav: `app/src/components/Nav.tsx` — fixed top nav with links
- Layout: `app/src/app/layout.tsx` — root layout with metadata
- Home: `app/src/app/page.tsx` — hardcoded to Miami stats
- All pages hardcoded to Miami data

## Requirements

### 1. City Context Provider

Create `app/src/components/CityProvider.tsx`:
- React context that stores the current city slug
- Persists selection in localStorage
- Defaults to 'miami' (or auto-detect via browser timezone/locale)
- Provides `city`, `setCity`, and `cityInfo` (name, country, etc.)
- Fetches city list from `/api/cities` on mount and caches it

### 2. City Selector in Nav

Update `app/src/components/Nav.tsx`:
- Add a city selector dropdown to the left side of the nav, next to the logo
- Show current city name + country flag emoji
- Dropdown lists all enabled cities grouped by country
- Selecting a city updates the context and reloads page data
- On mobile: city selector should be at the top of the mobile menu
- Keep it compact — just the city name + a small dropdown chevron

Design: match the existing nav style. Dark bg, small text, subtle dropdown.
Use the existing design tokens (--accent, --surface, --border, etc.).
Don't add any new dependencies.

### 3. URL-based city routing (optional but recommended)

Two approaches (pick the simpler one):
A) Query param: all pages read city from context, API calls include ?city=
B) Path prefix: /miami/rankings, /madrid/rankings (requires more routing work)

Go with approach A (query param via context). It's simpler and doesn't break
existing URLs. The city context handles passing ?city= to all fetch calls.

### 4. Update all page components to use city context

Pages that need updating to pass ?city= to their API calls:
- `app/src/app/rankings/PowerRankings.tsx` (client component, fetches /api/rankings)
- `app/src/app/network/NetworkGraph.tsx` (client component, fetches /api/network)
- `app/src/app/h2h/H2HComparison.tsx` (client component, fetches /api/h2h)
- `app/src/app/clubs/page.tsx` or its client component
- `app/src/app/tournaments/TournamentFinder.tsx`
- `app/src/app/coaches/CoachDirectory.tsx`

Pattern for each: import useCity from context, append ?city= to fetch URLs.

### 5. Update home page

`app/src/app/page.tsx` is a server component that calls getMiamiClubs().
Options:
A) Make it a client component that uses city context (loses SSR)
B) Keep it server-rendered for Miami, but add a client wrapper that re-fetches
   when city changes
C) Use searchParams to get city from URL

Go with B or C. The home page currently shows:
- Hero with stats (27K+ players, 35+ clubs, 100+ courts)
- These should update per city
- Top clubs section should show that city's clubs
- Social proof section can stay global or be per-city

### 6. Dynamic metadata

Update `app/src/app/layout.tsx` to be city-aware in the title/description.
Since layout.tsx can't easily access client state, this can stay generic:
"Padel Passport | Stats, Rankings & Player Network" (drop "Miami" from default).

Individual pages can set city-specific titles if they read searchParams.

### 7. City landing pages (nice to have)

Consider creating `app/src/app/city/[slug]/page.tsx` — a city overview page
showing that city's stats, top players, clubs, and recent activity.
This would be the landing page when someone selects a new city.

## Design Guidelines
- The city selector should feel native to the existing dark UI
- Flag emojis for countries (🇺🇸 🇪🇸 🇦🇷 🇲🇽 🇸🇪 🇦🇪 etc.)
- Smooth transition when switching cities (loading states)
- The nav currently has: Home, Clubs, Play, Network, Rankings, H2H, Coaches, AI Coach
- City selector goes to the LEFT of these links, near the logo

## Fonts & Design System (from existing code)
- Display font: Space Grotesk (--font-space-grotesk)
- Body font: DM Sans (--font-dm-sans)
- Accent color: var(--accent) — teal/emerald
- Surface: var(--surface), Border: var(--border)
- Use existing CSS classes: page-container, badge-accent, card, etc.

## Success Criteria
- [ ] City dropdown appears in nav, shows all 25 cities
- [ ] Switching city updates all data on the page
- [ ] City persists across page navigation and browser refresh
- [ ] Miami remains the default experience
- [ ] Mobile nav includes city selector
- [ ] No new npm dependencies added
- [ ] `next build` passes
```

---

## Agent 3: First Sync — Launch 5 Pilot Cities

**Priority: HIGH — gets real data flowing**

```
Task: Trigger the first data sync for 5 pilot cities to validate the multi-city
pipeline works. This is a manual/operational task, not a code change.

## Context

After Agent 1 is complete, the sync infrastructure supports any city in the
`cities` table. We need to run the first sync for pilot cities and verify data.

## Steps

### 1. Pick 5 high-value pilot cities

Start with these (high padel activity on Playtomic):
1. Madrid (biggest padel market in the world)
2. Barcelona (second biggest in Spain)
3. Stockholm (huge padel scene in Sweden)
4. New York (biggest US market after Miami)
5. Buenos Aires (Argentina = padel obsessed)

### 2. Verify Playtomic API returns clubs for each

Before syncing, test the API manually for each city:

curl "https://api.playtomic.io/v1/tenants?coordinate=40.4168,-3.7038&radius=50000&sport_id=PADEL&playtomic_status=ACTIVE&size=100"

Expected: Madrid should return 50-100+ clubs. If a city returns < 5 clubs,
increase the radius or skip it.

Document the club count for each pilot city.

### 3. Run sync for each city

Trigger the sync endpoint for each city:

curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.thepadelpassport.com/api/cron/sync?city=madrid"

Or if running locally:
curl "http://localhost:3000/api/cron/sync?city=madrid"

Run them one at a time. Each might take 1-5 minutes depending on club count.

### 4. Verify data landed correctly

After each sync, check:
- SELECT count(*) FROM players WHERE city = 'madrid';
- SELECT count(*) FROM matches WHERE city = 'madrid';
- SELECT count(distinct club_name) FROM matches WHERE city = 'madrid';

### 5. Check the frontend

Navigate to the app, switch to each pilot city in the city selector.
Verify: rankings load, network graph renders, club list appears.

### 6. Document results

For each city, record:
- Club count
- Player count
- Match count
- Any errors or issues
- Playtomic API response time

## Expected Results

| City | Expected Clubs | Expected Players |
|------|---------------|-----------------|
| Madrid | 80-150 | 50K-150K |
| Barcelona | 50-100 | 30K-80K |
| Stockholm | 30-60 | 15K-40K |
| New York | 10-30 | 5K-15K |
| Buenos Aires | 40-80 | 20K-60K |

## Success Criteria
- [ ] All 5 cities have data in the database
- [ ] Rankings page works for each city
- [ ] No sync errors in sync_log table
- [ ] Player counts are reasonable (not 0, not suspiciously low)
```

---

## Agent 4: Freemium Gate + Stripe Integration

**Priority: HIGH — this is how you make money**

```
Task: Add Stripe-powered premium subscriptions to Padel Passport.

The `players` table already has an `is_premium` boolean column (default false).
We need to wire up Stripe Checkout, a subscription model, and feature gates.

## Tech Stack
- Next.js 16 App Router (app/src/app/)
- Supabase for database (app/src/lib/supabase.ts)
- No auth system yet — we'll use email-based identity
- Deploy on Vercel

## Requirements

### 1. Install Stripe

cd app && npm install stripe @stripe/stripe-js

### 2. Create Stripe config

File: `app/src/lib/stripe.ts`
- Server-side Stripe client using STRIPE_SECRET_KEY env var
- Export helper functions: createCheckoutSession, createPortalSession

### 3. Create pricing

One plan: "Padel Passport Pro"
- $9.99/month or $79.99/year (save 33%)
- Create these as Stripe Products/Prices (or document what to create in Stripe dashboard)

### 4. API routes

Create `app/src/app/api/stripe/checkout/route.ts`:
- POST: creates Stripe Checkout session
- Accepts: { email, playerId?, priceId, city? }
- success_url: /pro/success?session_id={CHECKOUT_SESSION_ID}
- cancel_url: /pro

Create `app/src/app/api/stripe/webhook/route.ts`:
- POST: handles Stripe webhook events
- On checkout.session.completed: set is_premium = true for the player
- On customer.subscription.deleted: set is_premium = false
- On customer.subscription.updated: handle plan changes
- Verify webhook signature using STRIPE_WEBHOOK_SECRET

Create `app/src/app/api/stripe/portal/route.ts`:
- POST: creates Stripe Customer Portal session for managing subscription
- Accepts: { email }
- Returns: portal URL

### 5. Premium upgrade page

Create `app/src/app/pro/page.tsx`:
- Beautiful pricing page showing free vs pro comparison
- Two pricing cards: monthly ($9.99) and yearly ($79.99)
- Feature comparison table
- CTA buttons that trigger Stripe Checkout
- Match the existing design system (Space Grotesk, dark theme, teal accent)

Free tier features:
- Basic rankings (top 100 only)
- Limited player profiles (5 per day)
- Basic H2H comparison
- AI Coach (3 questions per day)

Pro tier features:
- Full rankings (all players)
- Unlimited player profiles
- Advanced H2H with scouting reports
- Partner Finder (AI-powered)
- Weekly performance email digest
- Match predictions
- Unlimited AI Coach
- Profile badge (⭐ Pro)
- Priority data updates

### 6. Feature gating middleware

Create `app/src/lib/premium.ts`:
- Function to check if a user is premium based on their email or player ID
- Queries Supabase: SELECT is_premium FROM players WHERE user_id = ? OR email = ?
- Used by API routes to gate premium features

### 7. Gate specific features

In API routes, add premium checks:

Rankings (`app/src/app/api/rankings/route.ts`):
- Free: return only top 100 players
- Pro: return all players

Player profile (`app/src/app/api/player/[id]/route.ts`):
- Free: basic stats only
- Pro: full stats + advanced analytics

AI Coach (`app/src/app/api/chat/route.ts`):
- Free: 3 messages per day (track in localStorage + API)
- Pro: unlimited

### 8. Pro badge on player profiles

When displaying a premium player's profile, show a ⭐ Pro badge.
File: `app/src/app/player/[id]/PlayerCard.tsx`
The player data already includes is_premium boolean — just render a badge.

### 9. Upgrade CTAs

Add subtle upgrade prompts in:
- Rankings page: "See all 27K players →" when hitting the free limit
- Player profile: "Unlock advanced stats" on gated sections
- AI Coach: "You've used 3/3 free questions today. Go Pro for unlimited."
- Nav: small "Pro" link or star icon

### 10. Success page

Create `app/src/app/pro/success/page.tsx`:
- Thank you page after successful checkout
- "Welcome to Padel Passport Pro! 🎾"
- Link back to rankings, profile, etc.

## Environment Variables Needed
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY (client-side, prefix with NEXT_PUBLIC_)
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRO_MONTHLY_PRICE_ID
- STRIPE_PRO_YEARLY_PRICE_ID

## Database Changes

ALTER TABLE players ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
-- subscription_status: 'free' | 'pro_monthly' | 'pro_yearly' | 'cancelled'

CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_players_stripe ON players(stripe_customer_id);

## Success Criteria
- [ ] Stripe Checkout flow works end-to-end
- [ ] Webhook correctly updates is_premium on subscription events
- [ ] Free users see gated content with upgrade CTAs
- [ ] Pro users see all content + badge
- [ ] Pricing page looks great and converts
- [ ] Customer portal link works for managing subscription
- [ ] `next build` passes with no errors
```

---

## Agent 5: Weekly Email Digest (Retention Engine)

**Priority: MEDIUM — drives retention + virality**

```
Task: Build a weekly email digest that sends personalized stats to players.
This is the #1 retention mechanism. Players who get "You moved up 15 spots"
emails come back every week.

## Context

- Supabase `signups` table has email + player_id + player_name
- Players table has stats: matches_played, wins, losses, level_value, last_match
- We need to track week-over-week changes
- Use Resend (already referenced in codebase) for sending emails

## Requirements

### 1. Install Resend

cd app && npm install resend

### 2. Player stats snapshot table

We need to store weekly snapshots to compute deltas.

CREATE TABLE player_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES players(user_id),
  city TEXT DEFAULT 'miami',
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ranking_position INTEGER,
  power_score REAL,
  matches_played INTEGER,
  wins INTEGER,
  losses INTEGER,
  level_value REAL,
  win_rate REAL,
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_snapshots_date ON player_snapshots(snapshot_date);
CREATE INDEX idx_snapshots_user ON player_snapshots(user_id);

### 3. Weekly snapshot cron

Create `app/src/app/api/cron/snapshot/route.ts`:
- Runs weekly (Sunday night)
- Computes power rankings for all cities
- Inserts a snapshot row for every player with their current ranking position
- This gives us week-over-week ranking movement data

Add to vercel.json:
{ "path": "/api/cron/snapshot", "schedule": "0 2 * * 0" }

### 4. Weekly digest cron

Create `app/src/app/api/cron/digest/route.ts`:
- Runs Monday morning (after snapshot)
- Fetches all subscribers from `signups` who have a player_id
- For each subscriber:
  - Get current stats + last week's snapshot
  - Compute: ranking change, matches this week, win rate this week, streak
  - Send personalized email via Resend

Add to vercel.json:
{ "path": "/api/cron/digest", "schedule": "0 14 * * 1" }
(2pm UTC = 9am EST Monday)

### 5. Email template

The email should be clean, mobile-friendly HTML. Include:

Subject line variations:
- "You climbed 23 spots this week 📈"
- "3 wins, 1 loss — your week in padel"
- "New personal best: Level 4.5 🎾"
- If no activity: "Your rivals played 12 matches this week 👀"

Content:
- Player name + city
- Ranking: #847 → #824 (▲23)
- This week: 3 matches, 2W-1L
- Level: 4.2 (↑0.1)
- Power Score: 42.5 (↑3.2)
- "Your Top Partners This Week" (if applicable)
- CTA: "View Full Profile" → links to /player/[id]
- CTA: "See Rankings" → links to /rankings
- If premium: show advanced stats
- If free: "Go Pro for match predictions + partner finder"
- Unsubscribe link

### 6. Subscribe flow improvements

Current subscribe endpoint: `app/src/app/api/subscribe/route.ts`
- Already saves email + player_id to signups table
- Add: save city preference
- Add: send welcome email immediately via Resend

### 7. Digest preferences

Add column to signups:
ALTER TABLE signups ADD COLUMN IF NOT EXISTS digest_enabled BOOLEAN DEFAULT true;
ALTER TABLE signups ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'miami';
ALTER TABLE signups ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

## Environment Variables
- RESEND_API_KEY (for sending emails)
- RESEND_FROM_EMAIL (e.g. "rankings@thepadelpassport.com")

## Success Criteria
- [ ] Snapshot cron creates weekly ranking snapshots
- [ ] Digest cron sends personalized emails to subscribers
- [ ] Email renders well on mobile and desktop
- [ ] Ranking movement (↑↓) is calculated correctly
- [ ] Unsubscribe link works
- [ ] Free vs Pro differentiation in email content
- [ ] `next build` passes
```

---

## Agent 6: Claim Your Profile (User Acquisition Loop)

**Priority: MEDIUM — turns passive data into active users**

```
Task: Build a "Claim Your Profile" flow that lets players verify ownership
of their Playtomic account and become registered users of Padel Passport.

This is the core user acquisition loop: 27K players (soon 1M) exist in the
database but don't know about us. When they discover their profile, they
should be able to claim it, subscribe to updates, and eventually upgrade to Pro.

## Context

- Players are identified by Playtomic user_id (UUID)
- No auth system exists yet
- Players table has: user_id, name, email (nullable), is_premium
- We want the lightest possible friction — NOT full auth (no passwords)

## Requirements

### 1. Magic link auth via email

Flow:
1. Player finds their profile on the site (via search or direct link)
2. Clicks "Claim This Profile" button on /player/[id]
3. Modal asks for their email
4. We send a magic link email (via Resend)
5. Clicking the link verifies them → links email to player_id
6. They're now "claimed" — can receive digests, upgrade to Pro

### 2. Database changes

ALTER TABLE players ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE players ADD COLUMN IF NOT EXISTS claim_token TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS claim_token_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_players_claim_token ON players(claim_token);

### 3. API routes

Create `app/src/app/api/claim/request/route.ts`:
- POST: { playerId, email }
- Generates a random token (crypto.randomUUID())
- Stores token + expiry (24h) on the player row
- Sends magic link email: /api/claim/verify?token=xxx
- Rate limit: max 3 requests per email per hour

Create `app/src/app/api/claim/verify/route.ts`:
- GET: ?token=xxx
- Looks up player by claim_token where claim_token_expires > now()
- Sets email on player, sets claimed_at, clears token
- Auto-subscribes to weekly digest (insert into signups if not exists)
- Redirects to /player/[id]?claimed=true with a success toast

### 4. UI: Claim button on player profile

File: `app/src/app/player/[id]/PlayerCard.tsx`

Add a "Claim This Profile" button if the player is NOT yet claimed
(claimed_at IS NULL). When claimed, show a ✓ Verified badge instead.

The claim modal should be simple:
- "Is this you? Claim your profile to track your stats."
- Email input
- Submit button
- "We'll send a verification link to your email"

### 5. Claimed player benefits

After claiming, the player gets:
- ✓ Verified badge on their profile
- Auto-enrolled in weekly digest
- Can upgrade to Pro
- Can set profile preferences (later)

### 6. Claim CTA on search results

When a player appears in search results or rankings, show a subtle
"Is this you?" link next to unclaimed profiles. This drives discovery.

## Success Criteria
- [ ] Claim flow works end-to-end (request → email → verify → claimed)
- [ ] Magic link email sends and renders correctly
- [ ] Token expires after 24 hours
- [ ] Claimed profiles show verified badge
- [ ] Auto-subscribes to weekly digest on claim
- [ ] Rate limiting prevents abuse
- [ ] `next build` passes
```

---

## Agent 7: Partner Finder (Killer Premium Feature)

**Priority: MEDIUM — strongest reason to go Pro**

```
Task: Build an AI-powered Partner Finder that recommends ideal playing partners
based on level, play style, schedule compatibility, and win rate data.

This is the premium feature that justifies $9.99/mo. Every padel player
constantly asks "who should I play with?"

## Context

We have rich data for partner matching:
- `edges` table: 101K+ relationships with weight (times played together)
- `players` table: level, win_rate, clubs, matches_played, preferred_position
- `matches` table: who played with whom, results, when, where

## Requirements

### 1. Partner matching algorithm

Create `app/src/lib/partner-matcher.ts`:

Scoring factors for a potential partner:
- **Level compatibility** (40%): Closest level to the user. Sweet spot is ±0.5.
- **Complementary position** (15%): Right-side players pair with left-side players.
- **Win rate together** (20%): If they've played together before, how did they do?
- **Club overlap** (10%): Play at the same clubs = easier to schedule.
- **Activity recency** (15%): Partner should be actively playing (last match < 30 days).

Scoring formula:
  levelScore = max(0, 1 - abs(myLevel - theirLevel) / 2) * 40
  positionScore = (complementary ? 15 : 5)
  winRateScore = (if played together: jointWinRate * 20, else: theirWinRate * 10)
  clubScore = (sharedClubs / max(myClubs, 1)) * 10
  recencyScore = max(0, 1 - daysSinceLastMatch / 60) * 15

### 2. API route

Create `app/src/app/api/partners/route.ts`:
- GET: ?playerId=xxx&city=miami&limit=20
- Premium-only endpoint (check is_premium or return top 3 for free users)
- Fetches the player's data
- Queries all active players in the same city
- Scores each potential partner
- Returns top N sorted by match score
- Includes: why they're a good match (level match, complementary position, etc.)

### 3. Partner Finder page

Create `app/src/app/partners/page.tsx` and `app/src/app/partners/PartnerFinder.tsx`:

UI:
- Search for yourself (or auto-fill if claimed/logged in)
- Shows "Your Ideal Partners" with match percentage
- Each partner card shows:
  - Name, level, photo
  - Match score (e.g., "94% match")
  - Why: "Same level (4.2), plays left side, 3 shared clubs"
  - "You've played together 5 times, won 4" (if applicable)
  - CTA: "View Profile"
- Free users: see top 3 partners, blurred rest with "Go Pro to see all"
- Pro users: see all 20 partners + advanced filters

### 4. Add to nav

Update `app/src/components/Nav.tsx`:
Add "Partners" to NAV_ITEMS (between Rankings and H2H, or after Coaches).

### 5. Filters (Pro only)

- Filter by club preference
- Filter by level range
- Filter by position (left/right/no preference)
- Filter by availability (played in last 7/30/90 days)

## Success Criteria
- [ ] Partner matching algorithm produces sensible results
- [ ] API returns top partners with match scores
- [ ] Partner Finder page renders with good UX
- [ ] Free tier shows 3 partners, rest gated
- [ ] Pro tier shows all partners with filters
- [ ] Added to navigation
- [ ] `next build` passes
```

---

## Agent 8: Social Share Cards (Viral Growth)

**Priority: LOW — but high leverage for free distribution**

```
Task: Generate beautiful social share images (OG images) for player profiles,
H2H comparisons, and rankings that players will share on Instagram/WhatsApp.

## Context

There's already a dynamic OG image at:
`app/src/app/player/[id]/opengraph-image.tsx`

We need to expand this to be shareable beyond just link previews.

## Requirements

### 1. Shareable player stat card

Create `app/src/app/api/share/player/[id]/route.tsx`:
- Generates a 1200x630 PNG image using Next.js ImageResponse (already available)
- Content:
  - Player name + photo (if available)
  - Level + tier badge (Diamond/Platinum/Gold/etc.)
  - Key stats: matches, W-L, win rate, power rank
  - City + top club
  - "Padel Passport" branding in corner
  - Beautiful dark gradient background matching site aesthetic

### 2. Shareable H2H card

Create `app/src/app/api/share/h2h/route.tsx`:
- Generates 1200x630 PNG for H2H comparisons
- Content:
  - Player 1 vs Player 2 (photos, names, levels)
  - H2H record: "3-1"
  - Key stat comparison bars
  - "Who's better? Check the stats on Padel Passport"

### 3. Share buttons on player profiles

Update `app/src/app/player/[id]/PlayerCard.tsx`:
- Add a "Share" button (share icon from Lucide)
- On click: use Web Share API if available, fallback to copy-link
- Share URL includes the OG image for rich previews

### 4. Share button on H2H page

Update `app/src/app/h2h/H2HComparison.tsx`:
- "Share This Matchup" button
- Generates a shareable link with both player IDs

### 5. Instagram-ready story format

Create `app/src/app/api/share/story/[id]/route.tsx`:
- 1080x1920 PNG (Instagram story format)
- Vertical layout with player stats
- "See my full stats at thepadelpassport.com"
- QR code pointing to the player's profile (optional, use a simple QR library)

## Design
- Dark background (#0a0a0a to #1a1a1a gradient)
- Teal accent color matching the site
- Space Grotesk font for headings
- Clean, minimal, premium feel
- The cards should look good enough that people WANT to share them

## Success Criteria
- [ ] Player share card generates correct PNG
- [ ] H2H share card generates correct PNG
- [ ] Share buttons work on player profiles and H2H
- [ ] Web Share API used when available
- [ ] Cards look great on Twitter/iMessage/WhatsApp previews
- [ ] `next build` passes
```

---

## Execution Order

| Order | Agent | Estimated Effort | Revenue Impact |
|-------|-------|-----------------|---------------|
| 1 | Multi-City DB & Sync | 2-3 hours | Unlocks all growth |
| 2 | City Selector Frontend | 1-2 hours | Makes multi-city usable |
| 3 | First Sync (5 cities) | 30 min | Real data flowing |
| 4 | Freemium + Stripe | 2-3 hours | Direct revenue |
| 5 | Weekly Email Digest | 1-2 hours | Retention engine |
| 6 | Claim Your Profile | 1-2 hours | User acquisition |
| 7 | Partner Finder | 2-3 hours | Premium conversion driver |
| 8 | Social Share Cards | 1-2 hours | Viral growth |

**Total: ~12-18 hours of agent work to go from Miami-only free tool to global freemium platform.**

---

## Environment Variables Checklist

After running these agents, you'll need these env vars in Vercel:

```bash
# Existing
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=...
OPENROUTER_API_KEY=...

# New — Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...

# New — Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=rankings@thepadelpassport.com
```
