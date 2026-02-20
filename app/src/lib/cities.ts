/**
 * City configuration for multi-city support.
 * Static config used throughout the app — the Supabase `cities` table
 * mirrors this for the sync cron and dynamic stats.
 */

export interface CityConfig {
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  coordinate: string;
  radius: number;
  timezone: string;
  enabled: boolean;
}

export const CITIES: CityConfig[] = [
  // ── Americas ──
  { slug: "miami", name: "Miami", country: "United States", countryCode: "US", flag: "🇺🇸", coordinate: "25.7617,-80.1918", radius: 80000, timezone: "America/New_York", enabled: true },
  { slug: "new-york", name: "New York", country: "United States", countryCode: "US", flag: "🇺🇸", coordinate: "40.7128,-74.0060", radius: 80000, timezone: "America/New_York", enabled: true },
  { slug: "mexico-city", name: "Mexico City", country: "Mexico", countryCode: "MX", flag: "🇲🇽", coordinate: "19.4326,-99.1332", radius: 60000, timezone: "America/Mexico_City", enabled: true },
  { slug: "buenos-aires", name: "Buenos Aires", country: "Argentina", countryCode: "AR", flag: "🇦🇷", coordinate: "-34.6037,-58.3816", radius: 60000, timezone: "America/Argentina/Buenos_Aires", enabled: false },
  // ── Europe ──
  { slug: "madrid", name: "Madrid", country: "Spain", countryCode: "ES", flag: "🇪🇸", coordinate: "40.4168,-3.7038", radius: 50000, timezone: "Europe/Madrid", enabled: true },
  { slug: "barcelona", name: "Barcelona", country: "Spain", countryCode: "ES", flag: "🇪🇸", coordinate: "41.3874,2.1686", radius: 50000, timezone: "Europe/Madrid", enabled: true },
  { slug: "milan", name: "Milan", country: "Italy", countryCode: "IT", flag: "🇮🇹", coordinate: "45.4642,9.1900", radius: 50000, timezone: "Europe/Rome", enabled: true },
  { slug: "rome", name: "Rome", country: "Italy", countryCode: "IT", flag: "🇮🇹", coordinate: "41.9028,12.4964", radius: 50000, timezone: "Europe/Rome", enabled: false },
  { slug: "lisbon", name: "Lisbon", country: "Portugal", countryCode: "PT", flag: "🇵🇹", coordinate: "38.7223,-9.1393", radius: 50000, timezone: "Europe/Lisbon", enabled: true },
  { slug: "amsterdam", name: "Amsterdam", country: "Netherlands", countryCode: "NL", flag: "🇳🇱", coordinate: "52.3676,4.9041", radius: 50000, timezone: "Europe/Amsterdam", enabled: true },
  { slug: "london", name: "London", country: "United Kingdom", countryCode: "GB", flag: "🇬🇧", coordinate: "51.5074,-0.1278", radius: 80000, timezone: "Europe/London", enabled: true },
  { slug: "paris", name: "Paris", country: "France", countryCode: "FR", flag: "🇫🇷", coordinate: "48.8566,2.3522", radius: 60000, timezone: "Europe/Paris", enabled: false },
  { slug: "stockholm", name: "Stockholm", country: "Sweden", countryCode: "SE", flag: "🇸🇪", coordinate: "59.3293,18.0686", radius: 50000, timezone: "Europe/Stockholm", enabled: false },
  // ── Middle East ──
  { slug: "dubai", name: "Dubai", country: "UAE", countryCode: "AE", flag: "🇦🇪", coordinate: "25.2048,55.2708", radius: 60000, timezone: "Asia/Dubai", enabled: false },
];

/** Top 10 cities enabled for initial sync and routing */
export const ENABLED_CITIES = CITIES.filter((c) => c.enabled);

export function getCityBySlug(slug: string): CityConfig | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function isValidCitySlug(slug: string): boolean {
  return CITIES.some((c) => c.slug === slug && c.enabled);
}

/** Group enabled cities by country for dropdown display */
export function getCitiesByCountry(): { country: string; flag: string; cities: CityConfig[] }[] {
  const groups = new Map<string, { flag: string; cities: CityConfig[] }>();

  for (const city of ENABLED_CITIES) {
    const existing = groups.get(city.country);
    if (existing) {
      existing.cities.push(city);
    } else {
      groups.set(city.country, { flag: city.flag, cities: [city] });
    }
  }

  return Array.from(groups.entries())
    .map(([country, { flag, cities }]) => ({ country, flag, cities }))
    .sort((a, b) => a.country.localeCompare(b.country));
}
