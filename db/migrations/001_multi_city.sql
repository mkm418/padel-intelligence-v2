-- Multi-city support migration
-- Run this in Supabase SQL Editor

-- 1. Create cities config table
CREATE TABLE IF NOT EXISTS cities (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  coordinate TEXT NOT NULL,
  radius INTEGER DEFAULT 80000,
  timezone TEXT DEFAULT 'UTC',
  enabled BOOLEAN DEFAULT true,
  player_count INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,
  club_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON cities FOR SELECT USING (true);

-- 2. Add city column to players, matches, edges
ALTER TABLE players ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'miami';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'miami';
ALTER TABLE edges ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'miami';

-- 3. Indexes for city-scoped queries
CREATE INDEX IF NOT EXISTS idx_players_city ON players(city);
CREATE INDEX IF NOT EXISTS idx_matches_city ON matches(city);
CREATE INDEX IF NOT EXISTS idx_edges_city ON edges(city);

-- 4. Backfill existing data
UPDATE players SET city = 'miami' WHERE city IS NULL;
UPDATE matches SET city = 'miami' WHERE city IS NULL;
UPDATE edges SET city = 'miami' WHERE city IS NULL;

-- 5. Seed cities (top 10 enabled + extras disabled)
INSERT INTO cities (slug, name, country, coordinate, radius, timezone, enabled) VALUES
  ('miami', 'Miami', 'US', '25.7617,-80.1918', 80000, 'America/New_York', true),
  ('madrid', 'Madrid', 'ES', '40.4168,-3.7038', 50000, 'Europe/Madrid', true),
  ('barcelona', 'Barcelona', 'ES', '41.3874,2.1686', 50000, 'Europe/Madrid', true),
  ('new-york', 'New York', 'US', '40.7128,-74.0060', 80000, 'America/New_York', true),
  ('mexico-city', 'Mexico City', 'MX', '19.4326,-99.1332', 60000, 'America/Mexico_City', true),
  ('milan', 'Milan', 'IT', '45.4642,9.1900', 50000, 'Europe/Rome', true),
  ('lisbon', 'Lisbon', 'PT', '38.7223,-9.1393', 50000, 'Europe/Lisbon', true),
  ('amsterdam', 'Amsterdam', 'NL', '52.3676,4.9041', 50000, 'Europe/Amsterdam', true),
  ('london', 'London', 'GB', '51.5074,-0.1278', 80000, 'Europe/London', true),
  ('buenos-aires', 'Buenos Aires', 'AR', '-34.6037,-58.3816', 60000, 'America/Argentina/Buenos_Aires', false),
  ('rome', 'Rome', 'IT', '41.9028,12.4964', 50000, 'Europe/Rome', false),
  ('paris', 'Paris', 'FR', '48.8566,2.3522', 60000, 'Europe/Paris', false),
  ('stockholm', 'Stockholm', 'SE', '59.3293,18.0686', 50000, 'Europe/Stockholm', false),
  ('dubai', 'Dubai', 'AE', '25.2048,55.2708', 60000, 'Asia/Dubai', false)
ON CONFLICT (slug) DO NOTHING;

-- 6. Update Miami stats from existing data
UPDATE cities SET
  player_count = (SELECT count(*) FROM players WHERE city = 'miami'),
  match_count = (SELECT count(*) FROM matches WHERE city = 'miami'),
  club_count = (SELECT count(DISTINCT club_name) FROM matches WHERE city = 'miami'),
  last_synced_at = now()
WHERE slug = 'miami';
