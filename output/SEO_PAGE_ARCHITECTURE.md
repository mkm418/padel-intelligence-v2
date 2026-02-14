# SEO Page Architecture: Miami Padel Directory

> Technical SEO blueprint for location-based padel directory pages

---

## Table of Contents

1. [Overview](#overview)
2. [URL Strategy](#url-strategy)
3. [Next.js App Router File Structure](#nextjs-app-router-file-structure)
4. [Page Type 1: City/Neighborhood Landing Pages](#page-type-1-cityneighborhood-landing-pages)
5. [Page Type 2: Club Detail Pages](#page-type-2-club-detail-pages)
6. [Page Type 3: Category Pages](#page-type-3-category-pages)
7. [Page Type 4: Player Discovery Pages](#page-type-4-player-discovery-pages)
8. [Internal Linking Strategy](#internal-linking-strategy)
9. [Technical SEO Requirements](#technical-seo-requirements)
10. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Goals

1. **Capture local search intent**: "padel courts miami beach", "padel lessons brickell"
2. **Build topical authority**: Comprehensive coverage of Miami padel ecosystem
3. **Enable discovery**: Players find courts, players find partners, beginners find lessons
4. **Generate organic traffic**: Long-tail keywords across 10+ neighborhoods

### Target Keywords (Examples)

| Page Type | Primary Keywords | Monthly Search Volume (Est.) |
|-----------|-----------------|------------------------------|
| Location | "padel miami beach", "padel courts [neighborhood]" | 100-500 |
| Club | "[club name] padel", "[club name] courts" | 50-200 |
| Category | "padel lessons miami", "indoor padel miami" | 200-800 |
| Players | "find padel partner miami", "padel players [level]" | 50-150 |

---

## URL Strategy

### URL Hierarchy

```
/                                    # Homepage (Miami hub)
├── /[location]/                     # Neighborhood pages (10 locations)
├── /clubs/                          # All clubs listing
│   └── /clubs/[slug]/               # Individual club pages
├── /[category]/                     # Category pages (6 categories)
├── /players/                        # Player discovery hub
│   ├── /players/level/[level]/      # Players by skill level
│   └── /players/club/[club-slug]/   # Players by home club
└── /tournaments/                    # Tournament listings
```

### URL Conventions

- **Lowercase, hyphenated**: `/miami-beach` not `/Miami_Beach`
- **No trailing slashes**: `/clubs/padel-bay` not `/clubs/padel-bay/`
- **Descriptive slugs**: `/clubs/padel-bay-miami` not `/clubs/123`
- **Canonical URLs**: Self-referencing canonicals on all pages

---

## Next.js App Router File Structure

```
src/app/
├── layout.tsx                              # Root layout with global SEO
├── page.tsx                                # Homepage: Miami padel hub
├── sitemap.ts                              # Dynamic sitemap generation
├── robots.ts                               # Robots.txt configuration
│
├── [location]/                             # Neighborhood pages
│   ├── page.tsx                            # /miami-beach, /brickell, etc.
│   └── opengraph-image.tsx                 # Dynamic OG images
│
├── clubs/
│   ├── page.tsx                            # /clubs (all clubs listing)
│   └── [slug]/
│       ├── page.tsx                        # /clubs/[slug]
│       └── opengraph-image.tsx             # Dynamic OG image
│
├── beginners/
│   └── page.tsx                            # /beginners
├── advanced/
│   └── page.tsx                            # /advanced
├── tournaments/
│   └── page.tsx                            # /tournaments
├── lessons/
│   └── page.tsx                            # /lessons
├── indoor-courts/
│   └── page.tsx                            # /indoor-courts
├── outdoor-courts/
│   └── page.tsx                            # /outdoor-courts
│
├── players/
│   ├── page.tsx                            # /players (discovery hub)
│   ├── level/
│   │   └── [level]/
│   │       └── page.tsx                    # /players/level/[1-5]
│   └── club/
│       └── [clubSlug]/
│           └── page.tsx                    # /players/club/[club-name]
│
└── api/                                    # Existing API routes
    └── ...
```

---

## Page Type 1: City/Neighborhood Landing Pages

### Routes

| Neighborhood | URL | Coordinates (center) |
|--------------|-----|---------------------|
| Miami Beach | `/miami-beach` | 25.7907, -80.1300 |
| Brickell | `/brickell` | 25.7617, -80.1918 |
| Coral Gables | `/coral-gables` | 25.7215, -80.2684 |
| Doral | `/doral` | 25.8195, -80.3553 |
| Wynwood | `/wynwood` | 25.8008, -80.1997 |
| South Beach | `/south-beach` | 25.7825, -80.1341 |
| Downtown Miami | `/downtown-miami` | 25.7751, -80.1947 |
| Aventura | `/aventura` | 25.9564, -80.1392 |
| Hialeah | `/hialeah` | 25.8576, -80.2781 |
| Kendall | `/kendall` | 25.6789, -80.3123 |

### Required Data from Playtomic API

```typescript
interface LocationPageData {
  // From clubs-geo API (filter by coordinates + radius)
  clubs: Array<{
    tenant_id: string;
    name: string;
    slug: string;
    address: string;
    city: string;
    lat: number;
    lon: number;
    padel_courts: number;
    distance: number; // km from center
    url: string;
  }>;
  
  // From club-details API (for each club)
  clubDetails: Array<{
    tenant_id: string;
    indoor_courts: number;
    outdoor_courts: number;
    court_features: string[]; // crystal, panoramic, wall
    is_open_now: boolean;
    today_hours: { opening_time: string; closing_time: string };
  }>;
  
  // From tournaments API (filter by coordinates)
  upcomingTournaments: Array<{
    tournament_id: string;
    name: string;
    start_date: string;
    club_name: string;
    available_places: number;
  }>;
  
  // Aggregated stats
  stats: {
    totalClubs: number;
    totalCourts: number;
    indoorCourts: number;
    outdoorCourts: number;
    upcomingEvents: number;
  };
}
```

### SEO Metadata Template

```typescript
// src/app/[location]/page.tsx

import { Metadata } from 'next';

type LocationConfig = {
  name: string;
  slug: string;
  description: string;
  lat: number;
  lon: number;
  radius: number; // km
};

const LOCATIONS: Record<string, LocationConfig> = {
  'miami-beach': {
    name: 'Miami Beach',
    slug: 'miami-beach',
    description: 'oceanfront',
    lat: 25.7907,
    lon: -80.1300,
    radius: 5,
  },
  // ... other locations
};

export async function generateMetadata({ params }: { params: { location: string } }): Promise<Metadata> {
  const location = LOCATIONS[params.location];
  const data = await getLocationData(location);
  
  const title = `Padel Courts in ${location.name} | ${data.stats.totalCourts} Courts at ${data.stats.totalClubs} Clubs`;
  const description = `Find ${data.stats.totalCourts} padel courts at ${data.stats.totalClubs} clubs in ${location.name}. Book courts, find players, and join ${data.stats.upcomingEvents} upcoming tournaments. Indoor and outdoor courts available.`;
  
  return {
    title,
    description,
    keywords: [
      `padel ${location.name.toLowerCase()}`,
      `padel courts ${location.name.toLowerCase()}`,
      `${location.name.toLowerCase()} padel clubs`,
      'book padel court',
      'padel miami',
    ],
    openGraph: {
      title,
      description,
      url: `https://padelpassport.com/${location.slug}`,
      siteName: 'Padel Passport',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: `https://padelpassport.com/${location.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Padel courts in ${location.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://padelpassport.com/${location.slug}`,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(LOCATIONS).map((location) => ({ location }));
}
```

### Schema.org Structured Data

```typescript
// src/app/[location]/page.tsx

function generateLocationSchema(location: LocationConfig, data: LocationPageData) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      // BreadcrumbList
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Miami Padel',
            item: 'https://padelpassport.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: location.name,
            item: `https://padelpassport.com/${location.slug}`,
          },
        ],
      },
      
      // ItemList of SportsActivityLocations
      {
        '@type': 'ItemList',
        name: `Padel Clubs in ${location.name}`,
        description: `${data.stats.totalClubs} padel clubs with ${data.stats.totalCourts} courts in ${location.name}`,
        numberOfItems: data.stats.totalClubs,
        itemListElement: data.clubs.slice(0, 10).map((club, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'SportsActivityLocation',
            '@id': `https://padelpassport.com/clubs/${club.slug}`,
            name: club.name,
            url: `https://padelpassport.com/clubs/${club.slug}`,
            address: {
              '@type': 'PostalAddress',
              streetAddress: club.address,
              addressLocality: location.name,
              addressRegion: 'FL',
              addressCountry: 'US',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: club.lat,
              longitude: club.lon,
            },
          },
        })),
      },
      
      // FAQPage for featured questions
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `How many padel courts are in ${location.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `There are ${data.stats.totalCourts} padel courts across ${data.stats.totalClubs} clubs in ${location.name}, including ${data.stats.indoorCourts} indoor and ${data.stats.outdoorCourts} outdoor courts.`,
            },
          },
          {
            '@type': 'Question',
            name: `Where can I play padel in ${location.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Popular padel clubs in ${location.name} include ${data.clubs.slice(0, 3).map(c => c.name).join(', ')}. All clubs offer court booking through the Playtomic app.`,
            },
          },
        ],
      },
    ],
  };
}
```

### Page Component Structure

```typescript
// src/app/[location]/page.tsx

export default async function LocationPage({ params }: { params: { location: string } }) {
  const location = LOCATIONS[params.location];
  if (!location) notFound();
  
  const data = await getLocationData(location);
  
  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateLocationSchema(location, data)),
        }}
      />
      
      {/* Hero Section */}
      <section>
        <h1>Padel Courts in {location.name}</h1>
        <p>{data.stats.totalCourts} courts • {data.stats.totalClubs} clubs • {data.stats.upcomingEvents} upcoming events</p>
      </section>
      
      {/* Stats Grid */}
      <section>
        <StatCard label="Total Courts" value={data.stats.totalCourts} />
        <StatCard label="Indoor" value={data.stats.indoorCourts} />
        <StatCard label="Outdoor" value={data.stats.outdoorCourts} />
        <StatCard label="Events This Week" value={data.stats.upcomingEvents} />
      </section>
      
      {/* Clubs List with distance */}
      <section>
        <h2>Padel Clubs in {location.name}</h2>
        <ClubsList clubs={data.clubs} />
      </section>
      
      {/* Map View */}
      <section>
        <h2>Map of {location.name} Padel Courts</h2>
        <MapView clubs={data.clubs} center={{ lat: location.lat, lon: location.lon }} />
      </section>
      
      {/* Upcoming Tournaments */}
      <section>
        <h2>Upcoming Padel Events in {location.name}</h2>
        <TournamentsList tournaments={data.upcomingTournaments} />
      </section>
      
      {/* Internal Links */}
      <section>
        <h2>Explore More in {location.name}</h2>
        <InternalLinks location={location} />
      </section>
      
      {/* FAQ Section (matches schema) */}
      <section>
        <h2>Padel in {location.name}: FAQ</h2>
        <FAQAccordion location={location} data={data} />
      </section>
    </>
  );
}
```

---

## Page Type 2: Club Detail Pages

### Route

```
/clubs/[slug]
```

**Example URLs:**
- `/clubs/padel-bay-miami`
- `/clubs/brickell-padel-club`
- `/clubs/miami-beach-padel-center`

### Required Data from Playtomic API

```typescript
interface ClubDetailPageData {
  // From clubs.json (static)
  basic: {
    tenant_id: string;
    name: string;
    slug: string;
    address: string;
    city: string;
    country: string;
    lat: number;
    lon: number;
    padel_courts: number;
    url: string; // Playtomic booking URL
  };
  
  // From club-details API (dynamic)
  details: {
    images: string[];
    indoor_courts: number;
    outdoor_courts: number;
    court_features: string[]; // crystal, panoramic, wall
    opening_hours: Record<string, { opening_time: string; closing_time: string }>;
    today_hours: { opening_time: string; closing_time: string } | null;
    is_open_now: boolean;
    booking_ahead_days: number | null;
    cancellation_policy: string | null;
    is_partner: boolean;
    currency: string;
  };
  
  // From tournaments API (filter by club_id)
  upcomingEvents: Array<{
    tournament_id: string;
    name: string;
    type: 'AMERICAN' | 'CLASS';
    start_date: string;
    price: string;
    available_places: number;
  }>;
  
  // From players.json (filter by club_name)
  activePlayers: Array<{
    user_id: string;
    name: string;
    level_value: number | null;
    gender: string;
  }>;
  
  // From coaches.json (filter by club)
  coaches: Array<{
    coach_id: string;
    name: string;
    picture: string | null;
    level_value: number | null;
  }>;
  
  // Nearby clubs (from clubs-geo API)
  nearbyClubs: Array<{
    tenant_id: string;
    name: string;
    slug: string;
    distance: number;
    padel_courts: number;
  }>;
}
```

### SEO Metadata Template

```typescript
// src/app/clubs/[slug]/page.tsx

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const club = await getClubBySlug(params.slug);
  if (!club) return { title: 'Club Not Found' };
  
  const data = await getClubDetailData(club.tenant_id);
  
  const courtInfo = [];
  if (data.details.indoor_courts > 0) courtInfo.push(`${data.details.indoor_courts} indoor`);
  if (data.details.outdoor_courts > 0) courtInfo.push(`${data.details.outdoor_courts} outdoor`);
  const courtText = courtInfo.join(' and ') || `${club.padel_courts} total`;
  
  const title = `${club.name} | ${courtText} Padel Courts in ${club.city}`;
  const description = `Book padel courts at ${club.name} in ${club.city}. ${courtText} courts${data.details.court_features.length ? ` with ${data.details.court_features.join(', ')} features` : ''}. ${data.upcomingEvents.length} upcoming events. Open ${data.details.today_hours?.opening_time || 'daily'}.`;
  
  return {
    title,
    description,
    keywords: [
      club.name.toLowerCase(),
      `${club.name.toLowerCase()} padel`,
      `padel ${club.city.toLowerCase()}`,
      'book padel court',
      'padel miami',
    ],
    openGraph: {
      title,
      description,
      url: `https://padelpassport.com/clubs/${params.slug}`,
      siteName: 'Padel Passport',
      locale: 'en_US',
      type: 'place',
      images: data.details.images.length > 0
        ? [{ url: data.details.images[0], width: 1200, height: 630, alt: club.name }]
        : [{ url: `https://padelpassport.com/clubs/${params.slug}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://padelpassport.com/clubs/${params.slug}`,
    },
  };
}
```

### Schema.org Structured Data

```typescript
function generateClubSchema(club: ClubBasic, data: ClubDetailPageData) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      // BreadcrumbList
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Miami Padel',
            item: 'https://padelpassport.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Clubs',
            item: 'https://padelpassport.com/clubs',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: club.name,
            item: `https://padelpassport.com/clubs/${club.slug}`,
          },
        ],
      },
      
      // LocalBusiness + SportsActivityLocation
      {
        '@type': ['LocalBusiness', 'SportsActivityLocation'],
        '@id': `https://padelpassport.com/clubs/${club.slug}`,
        name: club.name,
        description: `Padel club with ${club.padel_courts} courts in ${club.city}`,
        url: `https://padelpassport.com/clubs/${club.slug}`,
        image: data.details.images[0] || null,
        
        address: {
          '@type': 'PostalAddress',
          streetAddress: club.address,
          addressLocality: club.city,
          addressRegion: 'FL',
          addressCountry: 'US',
        },
        
        geo: {
          '@type': 'GeoCoordinates',
          latitude: club.lat,
          longitude: club.lon,
        },
        
        openingHoursSpecification: Object.entries(data.details.opening_hours).map(([day, hours]) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: day.charAt(0) + day.slice(1).toLowerCase(),
          opens: hours.opening_time,
          closes: hours.closing_time,
        })),
        
        amenityFeature: [
          {
            '@type': 'LocationFeatureSpecification',
            name: 'Padel Courts',
            value: club.padel_courts,
          },
          ...(data.details.indoor_courts > 0 ? [{
            '@type': 'LocationFeatureSpecification',
            name: 'Indoor Courts',
            value: data.details.indoor_courts,
          }] : []),
          ...(data.details.outdoor_courts > 0 ? [{
            '@type': 'LocationFeatureSpecification',
            name: 'Outdoor Courts',
            value: data.details.outdoor_courts,
          }] : []),
          ...data.details.court_features.map(feature => ({
            '@type': 'LocationFeatureSpecification',
            name: feature.charAt(0).toUpperCase() + feature.slice(1) + ' Courts',
            value: true,
          })),
        ],
        
        // Link to Playtomic for booking
        potentialAction: {
          '@type': 'ReserveAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: club.url,
            actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'],
          },
          result: {
            '@type': 'Reservation',
            name: 'Padel Court Reservation',
          },
        },
      },
      
      // Events (if any)
      ...data.upcomingEvents.slice(0, 5).map(event => ({
        '@type': 'SportsEvent',
        name: event.name,
        startDate: event.start_date,
        location: {
          '@type': 'SportsActivityLocation',
          name: club.name,
        },
        organizer: {
          '@type': 'Organization',
          name: club.name,
        },
        offers: {
          '@type': 'Offer',
          price: event.price === 'Free' ? '0' : event.price,
          priceCurrency: data.details.currency || 'USD',
          availability: event.available_places > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/SoldOut',
        },
      })),
    ],
  };
}
```

### Page Component Structure

```typescript
// src/app/clubs/[slug]/page.tsx

export default async function ClubPage({ params }: { params: { slug: string } }) {
  const club = await getClubBySlug(params.slug);
  if (!club) notFound();
  
  const data = await getClubDetailData(club.tenant_id);
  
  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateClubSchema(club, data)),
        }}
      />
      
      {/* Hero with images */}
      <section>
        <ImageGallery images={data.details.images} alt={club.name} />
        <h1>{club.name}</h1>
        <p>{club.address}, {club.city}</p>
        <OpenStatus isOpen={data.details.is_open_now} hours={data.details.today_hours} />
      </section>
      
      {/* Quick Stats */}
      <section>
        <StatCard label="Total Courts" value={club.padel_courts} />
        <StatCard label="Indoor" value={data.details.indoor_courts} />
        <StatCard label="Outdoor" value={data.details.outdoor_courts} />
        <StatCard label="Active Players" value={data.activePlayers.length} />
      </section>
      
      {/* Court Features */}
      <section>
        <h2>Court Features</h2>
        <FeaturesList features={data.details.court_features} />
      </section>
      
      {/* Opening Hours */}
      <section>
        <h2>Opening Hours</h2>
        <OpeningHoursTable hours={data.details.opening_hours} />
      </section>
      
      {/* Book CTA */}
      <section>
        <h2>Book a Court</h2>
        <BookingCTA url={club.url} clubName={club.name} />
      </section>
      
      {/* Upcoming Events */}
      {data.upcomingEvents.length > 0 && (
        <section>
          <h2>Upcoming Events at {club.name}</h2>
          <EventsList events={data.upcomingEvents} />
        </section>
      )}
      
      {/* Coaches */}
      {data.coaches.length > 0 && (
        <section>
          <h2>Coaches at {club.name}</h2>
          <CoachesList coaches={data.coaches} />
        </section>
      )}
      
      {/* Active Players */}
      {data.activePlayers.length > 0 && (
        <section>
          <h2>Players at {club.name}</h2>
          <PlayersList players={data.activePlayers.slice(0, 12)} />
          <Link href={`/players/club/${club.slug}`}>View all players →</Link>
        </section>
      )}
      
      {/* Map */}
      <section>
        <h2>Location</h2>
        <MapView clubs={[club]} center={{ lat: club.lat, lon: club.lon }} zoom={15} />
      </section>
      
      {/* Nearby Clubs */}
      <section>
        <h2>Nearby Padel Clubs</h2>
        <NearbyClubsList clubs={data.nearbyClubs} />
      </section>
    </>
  );
}
```

---

## Page Type 3: Category Pages

### Routes

| Category | URL | Description |
|----------|-----|-------------|
| Beginners | `/beginners` | Clubs with lessons, beginner events |
| Advanced | `/advanced` | Competitive players, high-level tournaments |
| Tournaments | `/tournaments` | All upcoming tournaments |
| Lessons | `/lessons` | Clubs with coaches, clinics |
| Indoor Courts | `/indoor-courts` | Clubs with indoor courts |
| Outdoor Courts | `/outdoor-courts` | Clubs with outdoor courts |

### Required Data

```typescript
interface CategoryPageData {
  // Varies by category
  beginners: {
    clubsWithLessons: Club[]; // Clubs with coaches
    beginnerEvents: Tournament[]; // Events marked "All levels"
    coaches: Coach[];
  };
  
  advanced: {
    topPlayers: Player[]; // Level 4.0+
    competitiveTournaments: Tournament[]; // Level-restricted events
    advancedClubs: Club[]; // Clubs with active competitive players
  };
  
  tournaments: {
    upcoming: Tournament[];
    byType: {
      american: Tournament[];
      clinics: Tournament[];
    };
    byGender: {
      mixed: Tournament[];
      mens: Tournament[];
      womens: Tournament[];
    };
  };
  
  lessons: {
    coaches: Coach[];
    clinics: Tournament[]; // type: 'CLASS'
    clubsWithCoaches: Club[];
  };
  
  indoorCourts: {
    clubs: Club[]; // indoor_courts > 0
    totalIndoorCourts: number;
  };
  
  outdoorCourts: {
    clubs: Club[]; // outdoor_courts > 0
    totalOutdoorCourts: number;
  };
}
```

### SEO Metadata Templates

```typescript
// src/app/beginners/page.tsx

export const metadata: Metadata = {
  title: 'Padel for Beginners in Miami | Lessons, Clinics & Beginner-Friendly Clubs',
  description: 'Start playing padel in Miami. Find beginner lessons, clinics, and welcoming clubs. Expert coaches help you learn the basics. Book your first court today.',
  keywords: ['padel lessons miami', 'learn padel', 'beginner padel', 'padel clinic miami', 'padel coaching'],
  openGraph: {
    title: 'Padel for Beginners in Miami',
    description: 'Start playing padel in Miami. Find beginner lessons, clinics, and welcoming clubs.',
    url: 'https://padelpassport.com/beginners',
    type: 'website',
  },
  alternates: {
    canonical: 'https://padelpassport.com/beginners',
  },
};

// src/app/indoor-courts/page.tsx

export async function generateMetadata(): Promise<Metadata> {
  const data = await getIndoorCourtsData();
  
  return {
    title: `Indoor Padel Courts in Miami | ${data.totalIndoorCourts} Courts at ${data.clubs.length} Clubs`,
    description: `Play padel rain or shine. ${data.totalIndoorCourts} indoor padel courts across ${data.clubs.length} Miami clubs. Climate-controlled courts for year-round play.`,
    keywords: ['indoor padel miami', 'indoor padel courts', 'climate controlled padel', 'padel miami'],
    openGraph: {
      title: `Indoor Padel Courts in Miami`,
      description: `${data.totalIndoorCourts} indoor padel courts across ${data.clubs.length} Miami clubs.`,
      url: 'https://padelpassport.com/indoor-courts',
      type: 'website',
    },
    alternates: {
      canonical: 'https://padelpassport.com/indoor-courts',
    },
  };
}
```

### Schema.org for Category Pages

```typescript
// Example: /lessons

function generateLessonsSchema(data: LessonsPageData) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      // BreadcrumbList
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Miami Padel', item: 'https://padelpassport.com' },
          { '@type': 'ListItem', position: 2, name: 'Padel Lessons', item: 'https://padelpassport.com/lessons' },
        ],
      },
      
      // Service listing
      {
        '@type': 'Service',
        serviceType: 'Padel Lessons',
        areaServed: {
          '@type': 'City',
          name: 'Miami',
          '@id': 'https://www.wikidata.org/wiki/Q8652',
        },
        provider: data.coaches.slice(0, 10).map(coach => ({
          '@type': 'Person',
          name: coach.name,
          image: coach.picture,
          worksFor: coach.clubs[0]?.club_name,
        })),
      },
      
      // ItemList of clinics
      {
        '@type': 'ItemList',
        name: 'Padel Clinics in Miami',
        numberOfItems: data.clinics.length,
        itemListElement: data.clinics.slice(0, 10).map((clinic, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Event',
            name: clinic.name,
            startDate: clinic.start_date,
            location: { '@type': 'Place', name: clinic.club_name },
          },
        })),
      },
    ],
  };
}
```

---

## Page Type 4: Player Discovery Pages

### Routes

| Page | URL | Purpose |
|------|-----|---------|
| Level 1 | `/players/level/1` | Beginners (0.0-1.99) |
| Level 2 | `/players/level/2` | Intermediate (2.0-2.99) |
| Level 3 | `/players/level/3` | Advanced (3.0-3.99) |
| Level 4 | `/players/level/4` | Competitive (4.0-4.99) |
| Level 5 | `/players/level/5` | Expert (5.0+) |
| Club Players | `/players/club/[club-slug]` | Players at specific club |

### Required Data

```typescript
interface PlayerLevelPageData {
  level: number;
  levelRange: { min: number; max: number };
  levelName: string; // "Beginner", "Intermediate", etc.
  players: Array<{
    user_id: string;
    name: string;
    level_value: number;
    level_confidence: number;
    gender: string;
    preferred_position: string | null;
    club_name: string;
    club_city: string;
    last_match_date: string;
  }>;
  totalPlayers: number;
  genderBreakdown: { male: number; female: number; unknown: number };
  topClubs: Array<{ club_name: string; playerCount: number }>;
}

interface PlayerClubPageData {
  club: {
    tenant_id: string;
    name: string;
    slug: string;
    city: string;
  };
  players: Player[];
  totalPlayers: number;
  levelDistribution: Record<number, number>; // { 1: 5, 2: 12, 3: 8, ... }
  genderBreakdown: { male: number; female: number };
}
```

### SEO Metadata Templates

```typescript
// src/app/players/level/[level]/page.tsx

const LEVEL_CONFIG: Record<string, { name: string; min: number; max: number; description: string }> = {
  '1': { name: 'Beginner', min: 0, max: 1.99, description: 'Just starting their padel journey' },
  '2': { name: 'Intermediate', min: 2.0, max: 2.99, description: 'Developing consistent rallies and basic tactics' },
  '3': { name: 'Advanced', min: 3.0, max: 3.99, description: 'Strong technical skills and match awareness' },
  '4': { name: 'Competitive', min: 4.0, max: 4.99, description: 'Tournament-ready players with advanced tactics' },
  '5': { name: 'Expert', min: 5.0, max: 10, description: 'Elite players with professional-level skills' },
};

export async function generateMetadata({ params }: { params: { level: string } }): Promise<Metadata> {
  const config = LEVEL_CONFIG[params.level];
  if (!config) return { title: 'Level Not Found' };
  
  const data = await getPlayersByLevel(config.min, config.max);
  
  const title = `${config.name} Padel Players in Miami | Level ${params.level} (${config.min}-${config.max})`;
  const description = `Find ${data.totalPlayers} ${config.name.toLowerCase()} padel players in Miami. ${config.description}. Connect with players at your skill level.`;
  
  return {
    title,
    description,
    keywords: [
      `level ${params.level} padel`,
      `${config.name.toLowerCase()} padel players`,
      'find padel partner miami',
      'padel matchmaking',
    ],
    openGraph: {
      title,
      description,
      url: `https://padelpassport.com/players/level/${params.level}`,
      type: 'website',
    },
    alternates: {
      canonical: `https://padelpassport.com/players/level/${params.level}`,
    },
  };
}

// src/app/players/club/[clubSlug]/page.tsx

export async function generateMetadata({ params }: { params: { clubSlug: string } }): Promise<Metadata> {
  const club = await getClubBySlug(params.clubSlug);
  if (!club) return { title: 'Club Not Found' };
  
  const data = await getPlayersByClub(club.name);
  
  const title = `Players at ${club.name} | ${data.totalPlayers} Active Padel Players`;
  const description = `Meet ${data.totalPlayers} padel players at ${club.name} in ${club.city}. Find partners at your level and join the community.`;
  
  return {
    title,
    description,
    keywords: [
      `${club.name.toLowerCase()} players`,
      `padel ${club.city.toLowerCase()}`,
      'find padel partner',
    ],
    openGraph: {
      title,
      description,
      url: `https://padelpassport.com/players/club/${params.clubSlug}`,
      type: 'website',
    },
    alternates: {
      canonical: `https://padelpassport.com/players/club/${params.clubSlug}`,
    },
  };
}
```

### Schema.org for Player Pages

```typescript
function generatePlayerLevelSchema(level: string, data: PlayerLevelPageData) {
  const config = LEVEL_CONFIG[level];
  
  return {
    '@context': 'https://schema.org',
    '@graph': [
      // BreadcrumbList
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Miami Padel', item: 'https://padelpassport.com' },
          { '@type': 'ListItem', position: 2, name: 'Players', item: 'https://padelpassport.com/players' },
          { '@type': 'ListItem', position: 3, name: `Level ${level}`, item: `https://padelpassport.com/players/level/${level}` },
        ],
      },
      
      // ItemList of players
      {
        '@type': 'ItemList',
        name: `${config.name} Padel Players in Miami`,
        description: `${data.totalPlayers} players at skill level ${level} (${config.min}-${config.max})`,
        numberOfItems: data.totalPlayers,
        // Note: Don't include actual player data in schema for privacy
      },
    ],
  };
}
```

---

## Internal Linking Strategy

### Hub-and-Spoke Model

```
Homepage (Hub)
├── Location Pages (Spokes)
│   └── Link to: Clubs in area, Category pages, Player discovery
├── Club Pages (Spokes)
│   └── Link to: Location page, Nearby clubs, Players at club, Category pages
├── Category Pages (Spokes)
│   └── Link to: Relevant clubs, Location pages, Player levels
└── Player Pages (Spokes)
    └── Link to: Club page, Level page, Location page
```

### Contextual Link Blocks

#### Location Page Links

```tsx
// On every location page
<section className="internal-links">
  <h3>Explore {location.name} Padel</h3>
  
  {/* Category links */}
  <div>
    <Link href="/beginners">Beginner-Friendly Clubs</Link>
    <Link href="/lessons">Padel Lessons</Link>
    <Link href="/indoor-courts">Indoor Courts</Link>
    <Link href="/tournaments">Upcoming Tournaments</Link>
  </div>
  
  {/* Nearby location links */}
  <div>
    <h4>Nearby Areas</h4>
    {nearbyLocations.map(loc => (
      <Link href={`/${loc.slug}`} key={loc.slug}>
        Padel in {loc.name}
      </Link>
    ))}
  </div>
  
  {/* Top clubs in area */}
  <div>
    <h4>Top Clubs in {location.name}</h4>
    {topClubs.map(club => (
      <Link href={`/clubs/${club.slug}`} key={club.slug}>
        {club.name}
      </Link>
    ))}
  </div>
</section>
```

#### Club Page Links

```tsx
// On every club page
<section className="internal-links">
  {/* Location context */}
  <Link href={`/${club.locationSlug}`}>
    ← All Padel in {club.locationName}
  </Link>
  
  {/* Category context */}
  {club.hasIndoorCourts && <Link href="/indoor-courts">Indoor Courts in Miami</Link>}
  {club.hasCoaches && <Link href="/lessons">Padel Lessons</Link>}
  
  {/* Player discovery */}
  <Link href={`/players/club/${club.slug}`}>
    View all {playerCount} players at {club.name}
  </Link>
  
  {/* Nearby clubs */}
  <div>
    <h4>Nearby Clubs</h4>
    {nearbyClubs.map(c => (
      <Link href={`/clubs/${c.slug}`} key={c.slug}>
        {c.name} ({c.distance}km)
      </Link>
    ))}
  </div>
</section>
```

#### Player Page Links

```tsx
// On player level pages
<section className="internal-links">
  {/* Level navigation */}
  <div>
    <h4>Browse by Level</h4>
    {[1, 2, 3, 4, 5].map(level => (
      <Link 
        href={`/players/level/${level}`} 
        key={level}
        className={currentLevel === level ? 'active' : ''}
      >
        Level {level}
      </Link>
    ))}
  </div>
  
  {/* Top clubs for this level */}
  <div>
    <h4>Popular Clubs for Level {level}</h4>
    {topClubsForLevel.map(club => (
      <Link href={`/clubs/${club.slug}`} key={club.slug}>
        {club.name} ({club.playerCount} players)
      </Link>
    ))}
  </div>
</section>
```

### Footer Navigation (All Pages)

```tsx
<footer>
  <nav>
    <div>
      <h4>Miami Neighborhoods</h4>
      {LOCATIONS.map(loc => (
        <Link href={`/${loc.slug}`}>{loc.name}</Link>
      ))}
    </div>
    
    <div>
      <h4>Play Padel</h4>
      <Link href="/clubs">All Clubs</Link>
      <Link href="/indoor-courts">Indoor Courts</Link>
      <Link href="/outdoor-courts">Outdoor Courts</Link>
      <Link href="/tournaments">Tournaments</Link>
    </div>
    
    <div>
      <h4>Learn Padel</h4>
      <Link href="/beginners">For Beginners</Link>
      <Link href="/lessons">Lessons & Clinics</Link>
      <Link href="/advanced">Advanced Play</Link>
    </div>
    
    <div>
      <h4>Find Players</h4>
      <Link href="/players">Player Directory</Link>
      {[1, 2, 3, 4, 5].map(level => (
        <Link href={`/players/level/${level}`}>Level {level}</Link>
      ))}
    </div>
  </nav>
</footer>
```

---

## Technical SEO Requirements

### 1. Sitemap Generation

```typescript
// src/app/sitemap.ts

import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://padelpassport.com';
  
  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/clubs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/beginners`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/advanced`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tournaments`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/lessons`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/indoor-courts`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/outdoor-courts`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/players`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];
  
  // Location pages
  const locationPages = LOCATIONS.map(loc => ({
    url: `${baseUrl}/${loc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));
  
  // Club pages
  const clubs = await getAllClubs();
  const clubPages = clubs.map(club => ({
    url: `${baseUrl}/clubs/${club.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));
  
  // Player level pages
  const levelPages = [1, 2, 3, 4, 5].map(level => ({
    url: `${baseUrl}/players/level/${level}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  // Player club pages
  const playerClubPages = clubs.map(club => ({
    url: `${baseUrl}/players/club/${club.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));
  
  return [
    ...staticPages,
    ...locationPages,
    ...clubPages,
    ...levelPages,
    ...playerClubPages,
  ];
}
```

### 2. Robots.txt

```typescript
// src/app/robots.ts

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/'],
      },
    ],
    sitemap: 'https://padelpassport.com/sitemap.xml',
  };
}
```

### 3. Canonical URL Strategy

| Scenario | Canonical URL |
|----------|--------------|
| Location page | Self-referencing: `/miami-beach` |
| Club page | Self-referencing: `/clubs/padel-bay-miami` |
| Category page | Self-referencing: `/indoor-courts` |
| Player level page | Self-referencing: `/players/level/3` |
| Paginated pages | Point to page 1: `/players?page=2` → canonical: `/players` |
| Query params | Ignore params: `/clubs?sort=name` → canonical: `/clubs` |

### 4. Open Graph Images (Dynamic)

```typescript
// src/app/[location]/opengraph-image.tsx

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Padel courts in Miami';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { location: string } }) {
  const location = LOCATIONS[params.location];
  const data = await getLocationData(location);
  
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 'bold', color: 'white' }}>
          Padel in {location.name}
        </div>
        <div style={{ fontSize: 36, color: '#94a3b8', marginTop: 20 }}>
          {data.stats.totalCourts} courts • {data.stats.totalClubs} clubs
        </div>
        <div style={{ fontSize: 24, color: '#64748b', marginTop: 40 }}>
          padelpassport.com
        </div>
      </div>
    ),
    { ...size }
  );
}
```

### 5. Performance Optimization

```typescript
// Data fetching with caching

// For static data (clubs list)
export async function getClubs() {
  return clubsData; // Import from JSON file
}

// For semi-dynamic data (club details)
export async function getClubDetails(tenantId: string) {
  const res = await fetch(`https://api.playtomic.io/v1/tenants/${tenantId}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  return res.json();
}

// For dynamic data (tournaments)
export async function getTournaments() {
  const res = await fetch('https://api.playtomic.io/v1/tournaments...', {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });
  return res.json();
}
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] Set up Next.js App Router file structure
- [ ] Create location configuration with coordinates
- [ ] Create club slug mapping utility
- [ ] Set up sitemap.ts and robots.ts
- [ ] Configure canonical URL handling

### Phase 2: Location Pages

- [ ] Create `/[location]/page.tsx` with dynamic routes
- [ ] Implement location data fetching (clubs in radius)
- [ ] Add SEO metadata generation
- [ ] Add Schema.org structured data (SportsActivityLocation, BreadcrumbList)
- [ ] Build internal linking components
- [ ] Create OG image generation

### Phase 3: Club Pages

- [ ] Create `/clubs/[slug]/page.tsx`
- [ ] Implement club detail data fetching
- [ ] Add SEO metadata with court details
- [ ] Add Schema.org (LocalBusiness + SportsActivityLocation)
- [ ] Build image gallery, hours table, booking CTA
- [ ] Add nearby clubs section

### Phase 4: Category Pages

- [ ] Create `/beginners/page.tsx` with relevant clubs/events
- [ ] Create `/advanced/page.tsx` with competitive content
- [ ] Create `/tournaments/page.tsx` with live data
- [ ] Create `/lessons/page.tsx` with coaches and clinics
- [ ] Create `/indoor-courts/page.tsx` and `/outdoor-courts/page.tsx`
- [ ] Add appropriate Schema.org for each category

### Phase 5: Player Discovery

- [ ] Create `/players/page.tsx` as discovery hub
- [ ] Create `/players/level/[level]/page.tsx`
- [ ] Create `/players/club/[clubSlug]/page.tsx`
- [ ] Add privacy-conscious Schema.org
- [ ] Build filtering and pagination

### Phase 6: Internal Linking

- [ ] Implement footer navigation on all pages
- [ ] Add contextual link blocks to each page type
- [ ] Add breadcrumb navigation
- [ ] Ensure all clubs link to their location page
- [ ] Ensure all location pages link to clubs and categories

### Phase 7: Testing & Validation

- [ ] Validate Schema.org with Google's Rich Results Test
- [ ] Test all pages with Lighthouse
- [ ] Verify sitemap includes all URLs
- [ ] Check canonical URLs are correct
- [ ] Test OG images render correctly
- [ ] Verify mobile responsiveness

---

## Summary

This architecture creates a comprehensive SEO-optimized structure for the Miami padel directory:

- **10 location pages** targeting neighborhood-specific searches
- **Dynamic club pages** with rich structured data and booking CTAs
- **6 category pages** capturing intent-based searches
- **Player discovery pages** enabling community building
- **Strong internal linking** distributing PageRank throughout the site
- **Proper technical SEO** with sitemaps, canonicals, and Schema.org

Estimated total indexable pages: **50-100+** (depending on number of clubs)

Target organic traffic potential: **5,000-15,000 monthly sessions** (based on keyword volumes)
