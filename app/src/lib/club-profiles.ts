/**
 * Club profiles: research data + computed stats for every Miami padel club.
 * This is the single source of truth for /clubs and /club/[slug] pages.
 */

export interface ClubProfile {
  slug: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  phone: string;
  website: string;
  image: string; // primary club photo URL (Playtomic CDN), injected at assembly
  courts: { total: number; indoor: number; outdoor: number; singles: number };
  amenities: string[];
  hours: string;
  priceRange: string; // e.g. "$25–$45/hr"
  membershipFrom: string | null; // e.g. "$150/mo"
  founded: string | null;
  indoor: boolean;
  tags: string[]; // e.g. ["premium", "beginner-friendly", "24/7"]
}

/** Club image URLs from Playtomic CDN, keyed by slug */
const CLUB_IMAGES: Record<string, string> = {
  "ultra-padel-miami": "https://res.cloudinary.com/playtomic/image/upload/v1742399087/pro/tenants/2bf2e6ff-7465-403e-8d39-9bfbafb07bfe/1742399086756.jpg",
  "i95-padel-club": "https://res.cloudinary.com/playtomic/image/upload/v1724192537/pro/tenants/760333b0-f111-4e09-8966-683d0c274f07/1724192536774.jpg",
  "padel-x-miami": "https://res.cloudinary.com/playtomic/image/upload/v1770841703/pro/tenants/b4bd28a0-0e17-48ba-9528-c63357077bfa/1770841703133.jpg",
  "real-padel-miami": "https://res.cloudinary.com/playtomic/image/upload/v1662388143/pro/tenants/ae4fee43-980c-4d11-9acc-ffe11f5e7add/1662388141961.jpg",
  "urban-padel-miami": "https://res.cloudinary.com/playtomic/image/upload/v1737053043/pro/tenants/d22bd571-8fa7-43f8-ab25-171d67cf49ce/1737053042660.jpg",
  "open-padel-by-lasaigues": "https://res.cloudinary.com/playtomic/image/upload/v1662211677/pro/tenants/c2a14e38-3af7-4fd2-9fb3-67ebf4926502/1662211676667.jpg",
  "ola-padel-club-by-nox": "https://res.cloudinary.com/playtomic/image/upload/v1766337489/pro/tenants/12c04f0d-ddcc-406d-8b21-4d485031fb42/1766337488673.jpg",
  "area-centre": "https://res.cloudinary.com/playtomic/image/upload/v1757339467/pro/tenants/5d5585a8-c17f-4418-a7cf-f2f51b8d8408/1757339467544.jpg",
  "the-set": "https://res.cloudinary.com/playtomic/image/upload/v1760451147/pro/tenants/54272959-bb84-4aa4-992b-a034868b1083/1760451146452.jpg",
  "pulse-padel-hub": "https://res.cloudinary.com/playtomic/image/upload/v1706719660/pro/tenants/5a61b0b8-a890-4003-a707-465778c4531b/1706719659832.jpg",
  "padel-life-soccer-miami": "https://res.cloudinary.com/playtomic/image/upload/v1747923862/pro/tenants/c1337b93-45af-46ec-9f5c-886994454a85/1747923862260.jpg",
  "smart-padel-house": "https://res.cloudinary.com/playtomic/image/upload/v1770841142/pro/tenants/8e3ec27a-bbe8-447e-9e3c-5581ac78b938/1770841141959.jpg",
  "point-miami-beach": "https://res.cloudinary.com/playtomic/image/upload/v1734114143/pro/tenants/e261a518-91d2-471a-bd98-d435be379e45/1734114142623.jpg",
  "padel-x-boca-raton": "https://res.cloudinary.com/playtomic/image/upload/v1756839605/pro/tenants/d38c03d8-45ea-4447-95f6-bfa909f91df6/1756839604950.jpg",
  "10by20-fort-lauderdale": "https://res.cloudinary.com/playtomic/image/upload/v1717350285/pro/tenants/b94cc3a4-ef96-466b-adbb-44ae3cf4a4f0/1717350285006.jpg",
  "platinum-padel": "https://res.cloudinary.com/playtomic/image/upload/v1761584321/pro/tenants/140fb4da-83d4-4e5f-9e54-a3513f11f6c6/1761584320217.jpg",
  "regency-padel": "https://res.cloudinary.com/playtomic/image/upload/v1741318678/pro/tenants/233180b0-2551-4d98-8e9e-401a08fc1c89/1741318677655.jpg",
  "epic-athletic-club": "https://res.cloudinary.com/playtomic/image/upload/v1753729070/pro/tenants/59fc2f1f-982f-4d1f-8a9f-346903914993/1753729070021.jpg",
  "legio-gp": "https://res.cloudinary.com/playtomic/image/upload/v1766461135/pro/tenants/d0ee1a1d-2eb9-4c09-8be4-ec71ed79c9ce/1766461134450.jpg",
  "ultra-padel-aventura": "https://res.cloudinary.com/playtomic/image/upload/v1745340560/pro/tenants/d294ce0f-3f19-4686-ba7a-e98b403bd615/1745340558943.jpg",
  "one-indoor-club": "https://res.cloudinary.com/playtomic/image/upload/v1740594653/pro/tenants/8afe0bfd-cc0b-418b-8cad-c6c10e04a276/1740594652439.jpg",
  "casas-padel-aventura-mall": "https://res.cloudinary.com/playtomic/image/upload/v1737401579/pro/tenants/3baf565d-6844-4422-b59c-d0846f2668c2/1737401579074.jpg",
  "bistro-padel-miami": "https://res.cloudinary.com/playtomic/image/upload/v1662388143/pro/tenants/ae4fee43-980c-4d11-9acc-ffe11f5e7add/1662388141961.jpg",
};

export interface ClubStats {
  totalPlayers: number;
  avgLevel: number;
  topLevel: number;
  minLevel: number;
  medianLevel: number;
  avgMatches: number;
  totalMatches: number;
  avgWinRate: number;
  advancedPlayers: number;
  intermediatePlayers: number;
  beginnerPlayers: number;
  totalCompetitive: number;
  totalFriendly: number;
  competitiveRatio: number; // competitive / total
  earliestMatch: string;
  latestMatch: string;
}

export interface ClubTopPlayer {
  userId: string;
  name: string;
  level: number;
  matchesPlayed: number;
  wins: number;
  winRate: number | null;
}

export interface ClubCoach {
  coachId: string;
  name: string;
  picture: string | null;
  level: number | null;
  totalClasses: number;
}

export interface ClubVibe {
  label: string;
  icon: string; // emoji
}

export interface FullClubProfile extends ClubProfile {
  stats: ClubStats;
  topPlayers: ClubTopPlayer[];
  coaches: ClubCoach[];
  vibes: ClubVibe[];
  /** 1-10 overall score computed from stats */
  overallScore: number;
  /** Sub-scores 1-10 */
  scores: {
    community: number; // player count + engagement
    competitive: number; // avg level + competitive ratio
    activity: number; // matches per player + recency
    diversity: number; // spread of levels
    facilities: number; // courts + amenities
  };
}

// ────────────────────────────────────────────────────
// Club profiles (research data)
// ────────────────────────────────────────────────────

export const CLUB_PROFILES: Record<string, Omit<ClubProfile, "image">> = {
  "ultra-padel-miami": {
    slug: "ultra-padel-miami",
    name: "Ultra Padel Miami",
    description:
      "Miami's flagship padel mega-club with 27 courts across indoor and outdoor. The city's largest and most active facility with a massive player community.",
    address: "400 NE 67th St",
    city: "Miami",
    state: "FL",
    zip: "33138",
    lat: 25.8322,
    lng: -80.1856,
    phone: "(305) 384-1053",
    website: "https://ultraclub.me",
    courts: { total: 27, indoor: 11, outdoor: 15, singles: 1 },
    amenities: [
      "Pro shop",
      "Cold plunge",
      "Free parking",
      "Equipment rental",
      "Clinics",
      "Kids courts",
      "Restaurant",
      "Locker rooms",
      "WiFi",
    ],
    hours: "7 AM – 11 PM daily",
    priceRange: "$25–$45/hr",
    membershipFrom: "$150/mo",
    founded: "2022",
    indoor: true,
    tags: ["flagship", "premium", "largest-in-miami", "indoor-outdoor"],
  },

  "real-padel-miami": {
    slug: "real-padel-miami",
    name: "Real Padel Miami",
    description:
      "The first padel club in the USA, founded in 2014. Prime Edgewater location between Downtown and Midtown with the biggest player base in South Florida.",
    address: "1739 NE 2nd Ave",
    city: "Miami",
    state: "FL",
    zip: "33132",
    lat: 25.7959,
    lng: -80.1908,
    phone: "(305) 915-9731",
    website: "https://realpadelmiami.com",
    courts: { total: 4, indoor: 0, outdoor: 4, singles: 0 },
    amenities: [
      "Free parking",
      "Equipment rental",
      "Changing rooms",
      "Lockers",
      "WiFi",
      "Snack bar",
    ],
    hours: "7 AM – 11:30 PM daily",
    priceRange: "$30–$50/hr",
    membershipFrom: null,
    founded: "2014",
    indoor: false,
    tags: ["og-club", "downtown", "beginner-friendly"],
  },

  "padel-x-miami": {
    slug: "padel-x-miami",
    name: "Padel X Miami",
    description:
      "Upscale 10-court facility with FIP-regulation premium courts, video technology, cold plunges, and a central clubhouse bar. Limited to 100 committed members.",
    address: "141 NE 13th Terrace",
    city: "Miami",
    state: "FL",
    zip: "33132",
    lat: 25.7876,
    lng: -80.1925,
    phone: "(305) 515-0956",
    website: "https://padelx.us",
    courts: { total: 10, indoor: 0, outdoor: 10, singles: 0 },
    amenities: [
      "Clubhouse bar",
      "Pro shop",
      "Cold plunge",
      "Private showers",
      "Valet parking",
      "Free parking",
      "Video analysis",
      "Equipment rental",
      "WiFi",
    ],
    hours: "Mon–Sat 7 AM – 11 PM, Sun 7 AM – 10 PM",
    priceRange: "$40–$60/hr",
    membershipFrom: "$481/8-session pack",
    founded: "2022",
    indoor: false,
    tags: ["premium", "exclusive", "video-tech", "fip-regulation"],
  },

  "i95-padel-club": {
    slug: "i95-padel-club",
    name: "I95 Padel Club",
    description:
      "The competitive player's home. Highest average level in Miami with an Argentine BBQ restaurant, podcast studio, and cold plunge. The place to play serious padel.",
    address: "650 NW 105th St",
    city: "Miami",
    state: "FL",
    zip: "33150",
    lat: 25.8573,
    lng: -80.2092,
    phone: "(786) 642-7667",
    website: "https://i95padel.com",
    courts: { total: 6, indoor: 4, outdoor: 2, singles: 0 },
    amenities: [
      "Argentine BBQ restaurant",
      "Pro shop",
      "Cold plunge",
      "Podcast studio",
      "Equipment rental",
      "Free parking",
      "WiFi",
      "Changing rooms",
    ],
    hours: "7 AM – 11 PM daily",
    priceRange: "$30–$45/hr",
    membershipFrom: null,
    founded: "2022",
    indoor: true,
    tags: ["competitive", "highest-level", "indoor-outdoor", "foodie"],
  },

  "smart-padel-house": {
    slug: "smart-padel-house",
    name: "Smart Padel House",
    description:
      "The first fully automated padel facility in the US. Open 24/7 with app/biometric access, air-conditioned indoor court in Doral. Perfect for late-night sessions.",
    address: "8440 NW 64th St, Unit 1",
    city: "Doral",
    state: "FL",
    zip: "33166",
    lat: 25.8133,
    lng: -80.3344,
    phone: "(561) 519-7832",
    website: "https://smartpadelhouse.com",
    courts: { total: 1, indoor: 1, outdoor: 0, singles: 0 },
    amenities: [
      "24/7 access",
      "Biometric entry",
      "Air conditioning",
      "Equipment rental",
      "Free parking",
      "WiFi",
      "Changing rooms",
      "Lockers",
      "Smart gear kiosk",
    ],
    hours: "24/7",
    priceRange: "$25–$40/hr",
    membershipFrom: null,
    founded: "2023",
    indoor: true,
    tags: ["24/7", "automated", "indoor", "doral"],
  },

  "urban-padel-miami": {
    slug: "urban-padel-miami",
    name: "Urban Padel Miami",
    description:
      "12 fully indoor, climate-controlled courts in Doral with panoramic views. Unlimited $299/mo membership makes it the best value for serious players.",
    address: "11601 NW 107th St",
    city: "Doral",
    state: "FL",
    zip: "33178",
    lat: 25.8595,
    lng: -80.3802,
    phone: "",
    website: "https://urbanpadel.us",
    courts: { total: 12, indoor: 12, outdoor: 0, singles: 0 },
    amenities: [
      "Climate controlled",
      "Equipment rental",
      "Free parking",
      "Pro shop",
      "Snack bar",
      "Changing rooms",
      "WiFi",
      "Disabled access",
    ],
    hours: "Mon–Fri 7 AM – 11:30 PM, Sat–Sun 7 AM – 9 PM",
    priceRange: "$30–$50/hr",
    membershipFrom: "$299/mo unlimited",
    founded: "2023",
    indoor: true,
    tags: ["all-indoor", "unlimited-membership", "doral", "best-value"],
  },

  "open-padel-by-lasaigues": {
    slug: "open-padel-by-lasaigues",
    name: "Open Padel by Lasaigues",
    description:
      "5 indoor air-conditioned panoramic glass courts in Miramar led by legendary Argentine player Alejandro Lasaigues. Elite coaching with a pro pedigree.",
    address: "7377 Riviera Blvd",
    city: "Miramar",
    state: "FL",
    zip: "33023",
    lat: 25.9786,
    lng: -80.2324,
    phone: "(754) 284-5578",
    website: "https://openpadel.club",
    courts: { total: 5, indoor: 5, outdoor: 0, singles: 0 },
    amenities: [
      "Air conditioning",
      "Equipment rental",
      "Free parking",
      "Pro shop",
      "Cafeteria",
      "Snack bar",
      "Changing rooms",
      "Lockers",
      "WiFi",
      "Disabled access",
    ],
    hours: "7 AM – 11 PM daily",
    priceRange: "$35–$55/hr",
    membershipFrom: null,
    founded: "2023",
    indoor: true,
    tags: ["pro-coaching", "indoor", "miramar", "elite"],
  },

  "point-miami-beach": {
    slug: "point-miami-beach",
    name: "Point Miami Beach",
    description:
      "Miami Beach's go-to padel club with 5 outdoor courts on Normandy Drive. Great location for beach-side players with a social, welcoming atmosphere.",
    address: "1960 Normandy Dr",
    city: "Miami Beach",
    state: "FL",
    zip: "33141",
    lat: 25.8518,
    lng: -80.1381,
    phone: "(305) 906-5896",
    website: "https://padelpointmiami.com",
    courts: { total: 5, indoor: 0, outdoor: 5, singles: 0 },
    amenities: [
      "Equipment rental",
      "Free parking",
      "Changing rooms",
      "WiFi",
      "Tournaments",
    ],
    hours: "Mon–Thu 7 AM – 11 PM, Fri–Sun 7 AM – 10:30 PM",
    priceRange: "$30–$45/hr",
    membershipFrom: null,
    founded: "2023",
    indoor: false,
    tags: ["miami-beach", "outdoor", "social", "tournaments"],
  },

  "one-indoor-club": {
    slug: "one-indoor-club",
    name: "One Indoor Club",
    description:
      "4 fully covered, air-conditioned padel courts plus 3 pickleball courts in North Miami. Coworking space, gym, and cafe make it a true lifestyle club.",
    address: "300 NE 183rd St",
    city: "Miami",
    state: "FL",
    zip: "33179",
    lat: 25.9468,
    lng: -80.1752,
    phone: "(305) 332-5893",
    website: "https://onepadel.us",
    courts: { total: 4, indoor: 4, outdoor: 0, singles: 0 },
    amenities: [
      "Air conditioning",
      "Gym",
      "Coworking space",
      "Cafe",
      "Pro shop",
      "Showers",
      "Lockers",
      "Free parking",
      "WiFi",
      "Pickleball courts",
    ],
    hours: "7 AM – 11 PM daily",
    priceRange: "$30–$45/hr",
    membershipFrom: null,
    founded: "2023",
    indoor: true,
    tags: ["indoor", "lifestyle", "coworking", "gym", "pickleball"],
  },

  "padel-x-boca-raton": {
    slug: "padel-x-boca-raton",
    name: "Padel X Boca Raton",
    description:
      "28,000 sq ft indoor facility — Boca's first dedicated padel club. 8 climate-controlled courts with sauna, cold plunge, and wellness area.",
    address: "1081 Holland Drive, Suite 3",
    city: "Boca Raton",
    state: "FL",
    zip: "33487",
    lat: 26.3683,
    lng: -80.0942,
    phone: "",
    website: "https://padelx.us",
    courts: { total: 8, indoor: 8, outdoor: 0, singles: 0 },
    amenities: [
      "Climate controlled",
      "Sauna",
      "Cold plunge",
      "Pro shop",
      "Snack bar",
      "Equipment rental",
      "Changing rooms",
      "Lockers",
      "WiFi",
      "Disabled access",
    ],
    hours: "Mon–Sat 7 AM – 10 PM, Sun 7 AM – 9 PM",
    priceRange: "$35–$55/hr",
    membershipFrom: null,
    founded: "2025",
    indoor: true,
    tags: ["indoor", "boca-raton", "wellness", "premium"],
  },

  "the-set": {
    slug: "the-set",
    name: "THE SET",
    description:
      "Doral's membership-focused padel and pickleball destination. 12 outdoor padel courts, premium amenities, weekly tournaments with prize pools, and a wellness-first approach.",
    address: "1800 NW 108th Ave",
    city: "Doral",
    state: "FL",
    zip: "33172",
    lat: 25.7987,
    lng: -80.3768,
    phone: "",
    website: "https://thesetpadel.com",
    courts: { total: 12, indoor: 0, outdoor: 12, singles: 0 },
    amenities: [
      "Cold plunge",
      "Stretch deck",
      "Members-only gym",
      "Studio classes",
      "Juice & coffee bar",
      "Pro shop",
      "WiFi lounge",
      "Free parking",
      "Changing rooms",
      "Lockers",
      "Pickleball courts",
    ],
    hours: "7 AM – 11:30 PM daily",
    priceRange: "$30–$50/hr",
    membershipFrom: "$459/mo",
    founded: "2024",
    indoor: false,
    tags: ["membership", "doral", "premium", "wellness", "tournaments"],
  },

  "ultra-padel-aventura": {
    slug: "ultra-padel-aventura",
    name: "Ultra Padel Aventura",
    description:
      "Ultra's Aventura outpost with 8 outdoor courts, 2 singles courts, and a stadium court. The go-to spot for North Miami / Aventura players.",
    address: "3455 NE 207th St, Building 2",
    city: "Aventura",
    state: "FL",
    zip: "33180",
    lat: 25.9568,
    lng: -80.1376,
    phone: "(305) 384-1053",
    website: "https://ultraclub.me/ultra-padel-aventura",
    courts: { total: 11, indoor: 0, outdoor: 8, singles: 2 },
    amenities: [
      "Stadium court",
      "Equipment rental",
      "Free parking",
      "Snack bar",
      "WiFi",
      "Clinics",
      "Private lessons",
    ],
    hours: "7 AM – 7 PM daily",
    priceRange: "$28–$45/90min",
    membershipFrom: "$150/mo",
    founded: "2024",
    indoor: false,
    tags: ["aventura", "stadium-court", "singles-courts", "outdoor"],
  },

  "10by20-fort-lauderdale": {
    slug: "10by20-fort-lauderdale",
    name: "10by20 Fort Lauderdale",
    description:
      "5 high-ceiling indoor courts in Fort Lauderdale with Phillips floating lights. Conveniently located 2 blocks from I-95 with physiotherapy services on-site.",
    address: "5300 Powerline Rd",
    city: "Fort Lauderdale",
    state: "FL",
    zip: "33309",
    lat: 26.1729,
    lng: -80.1497,
    phone: "(305) 540-5719",
    website: "https://10by20padel.com",
    courts: { total: 5, indoor: 5, outdoor: 0, singles: 0 },
    amenities: [
      "Physiotherapy",
      "Pro shop",
      "Snack bar",
      "Equipment rental",
      "Changing rooms",
      "Showers",
      "Lockers",
      "Free parking",
      "WiFi",
      "Kids activities",
    ],
    hours: "Mon–Fri 8 AM – 11:30 PM, Sat–Sun 8 AM – 10 PM",
    priceRange: "$35–$50/hr",
    membershipFrom: null,
    founded: "2023",
    indoor: true,
    tags: ["indoor", "fort-lauderdale", "physiotherapy", "high-ceiling"],
  },

  "casas-padel-aventura-mall": {
    slug: "casas-padel-aventura-mall",
    name: "Casas Padel Aventura Mall",
    description:
      "4 outdoor crystal-wall courts steps from Aventura Mall. Perfect for a quick game while shopping or a post-brunch padel session.",
    address: "19503 Biscayne Blvd",
    city: "Aventura",
    state: "FL",
    zip: "33180",
    lat: 25.9536,
    lng: -80.1438,
    phone: "(786) 342-9138",
    website: "https://casaspadelclub.com",
    courts: { total: 4, indoor: 0, outdoor: 4, singles: 0 },
    amenities: [
      "Equipment rental",
      "Pro shop",
      "Free parking",
      "WiFi",
      "Coaching",
      "Clinics",
    ],
    hours: "7 AM – 11:30 PM daily",
    priceRange: "$25–$40/hr",
    membershipFrom: null,
    founded: "2023",
    indoor: false,
    tags: ["aventura-mall", "casual", "outdoor", "convenient"],
  },

  "epic-athletic-club": {
    slug: "epic-athletic-club",
    name: "Epic Athletic Club",
    description:
      "Massive 80,000+ sq ft indoor sports complex inside Sawgrass Mills Mall. 7 padel courts, 10 pickleball courts, all climate-controlled with pro coaching.",
    address: "12801 W Sunrise Blvd",
    city: "Sunrise",
    state: "FL",
    zip: "33323",
    lat: 26.1509,
    lng: -80.3235,
    phone: "(305) 882-9651",
    website: "https://epicathleticclub.com",
    courts: { total: 7, indoor: 7, outdoor: 0, singles: 0 },
    amenities: [
      "Climate controlled",
      "Pro coaching",
      "Leagues",
      "Pro shop",
      "Lounge",
      "Pickleball courts",
      "Changing rooms",
      "WiFi",
    ],
    hours: "Mon–Sat 7 AM – 11 PM, Sun 7 AM – 10 PM",
    priceRange: "$30–$50/hr",
    membershipFrom: null,
    founded: "2024",
    indoor: true,
    tags: ["indoor", "mega-facility", "sawgrass-mills", "pickleball"],
  },

  "pulse-padel-hub": {
    slug: "pulse-padel-hub",
    name: "Pulse Padel Hub",
    description:
      "6 outdoor courts in North Miami with glass walls and LED lighting. Community-focused with ball machines, junior programs, and one of the highest match-per-player averages.",
    address: "1355 NW 135th St",
    city: "North Miami",
    state: "FL",
    zip: "33168",
    lat: 25.9068,
    lng: -80.2123,
    phone: "(786) 381-8163",
    website: "https://pulsepadelhub.com",
    courts: { total: 6, indoor: 0, outdoor: 6, singles: 0 },
    amenities: [
      "Ball machines",
      "Pro shop",
      "Equipment rental",
      "Snack bar",
      "Changing rooms",
      "Showers",
      "Lockers",
      "Free parking",
      "WiFi",
      "Disabled access",
    ],
    hours: "Mon–Fri 8 AM – 11:30 PM, Sat–Sun 8 AM – 9 PM",
    priceRange: "$20–$45/hr",
    membershipFrom: null,
    founded: "2023",
    indoor: false,
    tags: ["community", "ball-machines", "junior-programs", "north-miami"],
  },

  "ola-padel-club-by-nox": {
    slug: "ola-padel-club-by-nox",
    name: "Ola Padel Club by Nox",
    description:
      "6 indoor panoramic courts in Doral backed by NOX, one of padel's biggest brands. Restaurant on-site, play park for kids, and the highest matches-per-player in Miami.",
    address: "8135 NW 56 St",
    city: "Doral",
    state: "FL",
    zip: "33166",
    lat: 25.8089,
    lng: -80.3372,
    phone: "",
    website: "https://olapadel.club",
    courts: { total: 6, indoor: 6, outdoor: 0, singles: 0 },
    amenities: [
      "Restaurant",
      "Play park (kids)",
      "Equipment rental",
      "Free parking",
      "Pro shop",
      "Cafeteria",
      "Snack bar",
      "Changing rooms",
      "WiFi",
    ],
    hours: "Mon–Fri 7 AM – 11:30 PM, Sat–Sun 7 AM – 9:30 PM",
    priceRange: "$30–$50/hr",
    membershipFrom: null,
    founded: "2024",
    indoor: true,
    tags: ["nox-brand", "indoor", "doral", "family-friendly", "high-engagement"],
  },

  "regency-padel": {
    slug: "regency-padel",
    name: "Regency Padel",
    description:
      "Community-focused club on the grounds of Regency Miami Airport by Sonesta. Indoor courts with synthetic turf, evening floodlighting, and a welcoming social atmosphere.",
    address: "1000 NW 42nd Ave",
    city: "Miami",
    state: "FL",
    zip: "33126",
    lat: 25.7836,
    lng: -80.2394,
    phone: "(786) 836-0490",
    website: "https://playtomic.com/clubs/regency-padel",
    courts: { total: 4, indoor: 4, outdoor: 0, singles: 0 },
    amenities: [
      "Bar",
      "Equipment rental",
      "Free parking",
      "WiFi",
      "Changing rooms",
      "Lockers",
      "Snack bar",
      "Disabled access",
    ],
    hours: "6 AM – 10:30 PM daily",
    priceRange: "$20–$40/hr",
    membershipFrom: null,
    founded: "2025",
    indoor: true,
    tags: ["airport-area", "social", "beginner-friendly", "indoor"],
  },

  "area-centre": {
    slug: "area-centre",
    name: "AREA Centre",
    description:
      "Doral padel venue with one of the highest match-per-player averages in the region. A hardcore player's court with deep engagement and competitive play.",
    address: "6700 NW 77th Ct, Suite 200",
    city: "Doral",
    state: "FL",
    zip: "33166",
    lat: 25.8167,
    lng: -80.3412,
    phone: "",
    website: "https://playtomic.com/clubs/area-centre",
    courts: { total: 4, indoor: 0, outdoor: 4, singles: 0 },
    amenities: [
      "Equipment rental",
      "Free parking",
      "WiFi",
      "Changing rooms",
    ],
    hours: "7 AM – 11 PM daily",
    priceRange: "$25–$40/hr",
    membershipFrom: null,
    founded: "2023",
    indoor: false,
    tags: ["doral", "competitive", "high-engagement"],
  },

  "platinum-padel": {
    slug: "platinum-padel",
    name: "Platinum Padel",
    description:
      "4 outdoor panoramic courts in North Miami with a pro-led coaching program. Restaurant and cafeteria on-site with a welcoming, all-levels atmosphere.",
    address: "1195 NE 125th St",
    city: "North Miami",
    state: "FL",
    zip: "33161",
    lat: 25.8923,
    lng: -80.1773,
    phone: "(305) 848-2489",
    website: "https://platinumpadelclub.com",
    courts: { total: 4, indoor: 0, outdoor: 4, singles: 0 },
    amenities: [
      "Restaurant",
      "Cafeteria",
      "Equipment rental",
      "Free parking",
      "Changing rooms",
      "WiFi",
      "Disabled access",
      "Tournaments",
    ],
    hours: "7 AM – 11:30 PM daily",
    priceRange: "$25–$45/hr",
    membershipFrom: null,
    founded: "2023",
    indoor: false,
    tags: ["north-miami", "pro-coaching", "all-levels", "outdoor"],
  },

  "padel-life-soccer-miami": {
    slug: "padel-life-soccer-miami",
    name: "Padel Life & Soccer Miami",
    description:
      "Dual-sport facility in Hallandale Beach combining padel and soccer. 3 indoor courts open from 6:30 AM with leagues, tournaments, and free clinics.",
    address: "1000 W Pembroke Rd",
    city: "Hallandale Beach",
    state: "FL",
    zip: "33009",
    lat: 25.9806,
    lng: -80.1506,
    phone: "(754) 210-3913",
    website: "https://padellifemiami.com",
    courts: { total: 3, indoor: 3, outdoor: 0, singles: 0 },
    amenities: [
      "Soccer court",
      "Fitness area",
      "Equipment rental",
      "Free parking",
      "Changing rooms",
      "Lockers",
      "Sports coffee bar",
      "WiFi",
      "Free clinics",
    ],
    hours: "Mon–Fri 6:30 AM – 12 AM, Sat–Sun 7 AM – 9 PM",
    priceRange: "$25–$40/hr",
    membershipFrom: null,
    founded: "2023",
    indoor: true,
    tags: ["dual-sport", "hallandale", "indoor", "leagues", "soccer"],
  },

  "legio-gp": {
    slug: "legio-gp",
    name: "LEGIO GP",
    description:
      "Italian-style padel club in West Boca Raton with 3 outdoor courts. Small but high-level community with strong competitive DNA.",
    address: "9045 Vista del Lago",
    city: "Boca Raton",
    state: "FL",
    zip: "33428",
    lat: 26.3381,
    lng: -80.1927,
    phone: "(561) 884-0456",
    website: "https://legiogpworld.com",
    courts: { total: 3, indoor: 0, outdoor: 3, singles: 0 },
    amenities: ["Equipment rental", "Free parking", "WiFi"],
    hours: "9 AM – 10 PM daily",
    priceRange: "$25–$40/hr",
    membershipFrom: null,
    founded: "2023",
    indoor: false,
    tags: ["boca-raton", "italian-style", "competitive", "boutique"],
  },

  "bistro-padel-miami": {
    slug: "bistro-padel-miami",
    name: "Bistro Padel Miami",
    description:
      "Small boutique padel venue in the Miami area. A newer addition to the scene with a growing player community.",
    address: "Miami, FL",
    city: "Miami",
    state: "FL",
    zip: "33101",
    lat: 25.7617,
    lng: -80.1918,
    phone: "",
    website: "",
    courts: { total: 2, indoor: 0, outdoor: 2, singles: 0 },
    amenities: ["Equipment rental", "Free parking"],
    hours: "7 AM – 10 PM daily",
    priceRange: "$20–$35/hr",
    membershipFrom: null,
    founded: "2024",
    indoor: false,
    tags: ["boutique", "new"],
  },
};

// ────────────────────────────────────────────────────
// Stats from Supabase (pre-computed)
// ────────────────────────────────────────────────────

export const CLUB_STATS: Record<string, ClubStats> = {
  "ultra-padel-miami": {
    totalPlayers: 5381,
    avgLevel: 3.01,
    topLevel: 7,
    minLevel: 0.5,
    medianLevel: 2.99,
    avgMatches: 19.3,
    totalMatches: 104083,
    avgWinRate: 0.5,
    advancedPlayers: 1189,
    intermediatePlayers: 1493,
    beginnerPlayers: 2699,
    totalCompetitive: 84412,
    totalFriendly: 19671,
    competitiveRatio: 0.81,
    earliestMatch: "2022-08-14",
    latestMatch: "2026-02-14",
  },
  "real-padel-miami": {
    totalPlayers: 5916,
    avgLevel: 2.76,
    topLevel: 7,
    minLevel: 0.4,
    medianLevel: 2.61,
    avgMatches: 18.1,
    totalMatches: 106798,
    avgWinRate: 0.5,
    advancedPlayers: 1089,
    intermediatePlayers: 1335,
    beginnerPlayers: 3492,
    totalCompetitive: 89845,
    totalFriendly: 16953,
    competitiveRatio: 0.84,
    earliestMatch: "2022-08-14",
    latestMatch: "2026-02-14",
  },
  "padel-x-miami": {
    totalPlayers: 4281,
    avgLevel: 3.07,
    topLevel: 7,
    minLevel: 0.5,
    medianLevel: 3.0,
    avgMatches: 20.3,
    totalMatches: 86958,
    avgWinRate: 0.5,
    advancedPlayers: 1035,
    intermediatePlayers: 1190,
    beginnerPlayers: 2056,
    totalCompetitive: 69304,
    totalFriendly: 17654,
    competitiveRatio: 0.8,
    earliestMatch: "2022-08-15",
    latestMatch: "2026-02-14",
  },
  "i95-padel-club": {
    totalPlayers: 2491,
    avgLevel: 3.45,
    topLevel: 7,
    minLevel: 0.5,
    medianLevel: 3.42,
    avgMatches: 32.7,
    totalMatches: 81453,
    avgWinRate: 0.5,
    advancedPlayers: 905,
    intermediatePlayers: 730,
    beginnerPlayers: 856,
    totalCompetitive: 71156,
    totalFriendly: 10297,
    competitiveRatio: 0.87,
    earliestMatch: "2022-08-14",
    latestMatch: "2026-02-14",
  },
  "smart-padel-house": {
    totalPlayers: 2471,
    avgLevel: 2.43,
    topLevel: 6.79,
    minLevel: 0.5,
    medianLevel: 2.1,
    avgMatches: 22.7,
    totalMatches: 55971,
    avgWinRate: 0.5,
    advancedPlayers: 317,
    intermediatePlayers: 414,
    beginnerPlayers: 1740,
    totalCompetitive: 52075,
    totalFriendly: 3896,
    competitiveRatio: 0.93,
    earliestMatch: "2022-08-14",
    latestMatch: "2026-02-14",
  },
  "urban-padel-miami": {
    totalPlayers: 1863,
    avgLevel: 2.9,
    topLevel: 6.81,
    minLevel: 0.5,
    medianLevel: 2.83,
    avgMatches: 32.0,
    totalMatches: 59638,
    avgWinRate: 0.5,
    advancedPlayers: 396,
    intermediatePlayers: 455,
    beginnerPlayers: 1012,
    totalCompetitive: 54614,
    totalFriendly: 5024,
    competitiveRatio: 0.92,
    earliestMatch: "2022-08-14",
    latestMatch: "2026-02-14",
  },
  "open-padel-by-lasaigues": {
    totalPlayers: 1960,
    avgLevel: 2.9,
    topLevel: 7,
    minLevel: 0.5,
    medianLevel: 2.71,
    avgMatches: 26.0,
    totalMatches: 51024,
    avgWinRate: 0.5,
    advancedPlayers: 445,
    intermediatePlayers: 426,
    beginnerPlayers: 1089,
    totalCompetitive: 48287,
    totalFriendly: 2737,
    competitiveRatio: 0.95,
    earliestMatch: "2022-08-14",
    latestMatch: "2026-02-14",
  },
  "point-miami-beach": {
    totalPlayers: 1502,
    avgLevel: 3.03,
    topLevel: 7,
    minLevel: 0.5,
    medianLevel: 3.0,
    avgMatches: 21.7,
    totalMatches: 32665,
    avgWinRate: 0.5,
    advancedPlayers: 331,
    intermediatePlayers: 426,
    beginnerPlayers: 745,
    totalCompetitive: 26022,
    totalFriendly: 6643,
    competitiveRatio: 0.8,
    earliestMatch: "2022-08-16",
    latestMatch: "2026-02-14",
  },
  "one-indoor-club": {
    totalPlayers: 700,
    avgLevel: 2.63,
    topLevel: 6.01,
    minLevel: 0.5,
    medianLevel: 2.64,
    avgMatches: 20.7,
    totalMatches: 14504,
    avgWinRate: 0.5,
    advancedPlayers: 97,
    intermediatePlayers: 160,
    beginnerPlayers: 443,
    totalCompetitive: 12076,
    totalFriendly: 2428,
    competitiveRatio: 0.83,
    earliestMatch: "2022-08-16",
    latestMatch: "2026-02-14",
  },
  "padel-x-boca-raton": {
    totalPlayers: 660,
    avgLevel: 3.02,
    topLevel: 6.82,
    minLevel: 0.5,
    medianLevel: 2.95,
    avgMatches: 14.5,
    totalMatches: 9572,
    avgWinRate: 0.5,
    advancedPlayers: 166,
    intermediatePlayers: 155,
    beginnerPlayers: 339,
    totalCompetitive: 8134,
    totalFriendly: 1438,
    competitiveRatio: 0.85,
    earliestMatch: "2022-08-14",
    latestMatch: "2026-02-14",
  },
  "the-set": {
    totalPlayers: 948,
    avgLevel: 2.66,
    topLevel: 6.69,
    minLevel: 0.5,
    medianLevel: 2.6,
    avgMatches: 35.4,
    totalMatches: 33542,
    avgWinRate: 0.5,
    advancedPlayers: 141,
    intermediatePlayers: 211,
    beginnerPlayers: 596,
    totalCompetitive: 31118,
    totalFriendly: 2424,
    competitiveRatio: 0.93,
    earliestMatch: "2022-08-15",
    latestMatch: "2026-02-14",
  },
  "ultra-padel-aventura": {
    totalPlayers: 725,
    avgLevel: 2.79,
    topLevel: 6,
    minLevel: 0.5,
    medianLevel: 2.77,
    avgMatches: 16.3,
    totalMatches: 11804,
    avgWinRate: 0.5,
    advancedPlayers: 108,
    intermediatePlayers: 190,
    beginnerPlayers: 427,
    totalCompetitive: 10010,
    totalFriendly: 1794,
    competitiveRatio: 0.85,
    earliestMatch: "2022-09-27",
    latestMatch: "2026-02-14",
  },
  "10by20-fort-lauderdale": {
    totalPlayers: 705,
    avgLevel: 2.85,
    topLevel: 7,
    minLevel: 0.5,
    medianLevel: 2.8,
    avgMatches: 22.6,
    totalMatches: 15940,
    avgWinRate: 0.5,
    advancedPlayers: 126,
    intermediatePlayers: 189,
    beginnerPlayers: 390,
    totalCompetitive: 14542,
    totalFriendly: 1398,
    competitiveRatio: 0.91,
    earliestMatch: "2022-08-16",
    latestMatch: "2026-02-14",
  },
  "casas-padel-aventura-mall": {
    totalPlayers: 501,
    avgLevel: 2.58,
    topLevel: 6.5,
    minLevel: 0.5,
    medianLevel: 2.56,
    avgMatches: 13.9,
    totalMatches: 6979,
    avgWinRate: 0.5,
    advancedPlayers: 54,
    intermediatePlayers: 110,
    beginnerPlayers: 337,
    totalCompetitive: 6188,
    totalFriendly: 791,
    competitiveRatio: 0.89,
    earliestMatch: "2022-09-17",
    latestMatch: "2026-02-14",
  },
  "epic-athletic-club": {
    totalPlayers: 310,
    avgLevel: 2.63,
    topLevel: 5.7,
    minLevel: 0.5,
    medianLevel: 2.6,
    avgMatches: 21.8,
    totalMatches: 6773,
    avgWinRate: 0.5,
    advancedPlayers: 40,
    intermediatePlayers: 79,
    beginnerPlayers: 191,
    totalCompetitive: 6209,
    totalFriendly: 564,
    competitiveRatio: 0.92,
    earliestMatch: "2022-08-20",
    latestMatch: "2026-02-14",
  },
  "pulse-padel-hub": {
    totalPlayers: 532,
    avgLevel: 3.05,
    topLevel: 7,
    minLevel: 0.5,
    medianLevel: 2.97,
    avgMatches: 30.5,
    totalMatches: 16219,
    avgWinRate: 0.5,
    advancedPlayers: 143,
    intermediatePlayers: 121,
    beginnerPlayers: 268,
    totalCompetitive: 14462,
    totalFriendly: 1757,
    competitiveRatio: 0.89,
    earliestMatch: "2022-08-16",
    latestMatch: "2026-02-14",
  },
  "ola-padel-club-by-nox": {
    totalPlayers: 480,
    avgLevel: 2.94,
    topLevel: 6.5,
    minLevel: 0.5,
    medianLevel: 2.98,
    avgMatches: 45.0,
    totalMatches: 21621,
    avgWinRate: 0.5,
    advancedPlayers: 102,
    intermediatePlayers: 134,
    beginnerPlayers: 244,
    totalCompetitive: 19510,
    totalFriendly: 2111,
    competitiveRatio: 0.9,
    earliestMatch: "2022-08-14",
    latestMatch: "2026-02-14",
  },
  "regency-padel": {
    totalPlayers: 360,
    avgLevel: 2.89,
    topLevel: 5.52,
    minLevel: 0.5,
    medianLevel: 2.95,
    avgMatches: 26.1,
    totalMatches: 9402,
    avgWinRate: 0.5,
    advancedPlayers: 54,
    intermediatePlayers: 120,
    beginnerPlayers: 186,
    totalCompetitive: 8017,
    totalFriendly: 1385,
    competitiveRatio: 0.85,
    earliestMatch: "2022-08-16",
    latestMatch: "2026-02-14",
  },
  "area-centre": {
    totalPlayers: 403,
    avgLevel: 3.0,
    topLevel: 6.69,
    minLevel: 0.5,
    medianLevel: 2.9,
    avgMatches: 45.4,
    totalMatches: 18283,
    avgWinRate: 0.5,
    advancedPlayers: 96,
    intermediatePlayers: 92,
    beginnerPlayers: 215,
    totalCompetitive: 17202,
    totalFriendly: 1081,
    competitiveRatio: 0.94,
    earliestMatch: "2022-08-16",
    latestMatch: "2026-02-14",
  },
  "platinum-padel": {
    totalPlayers: 344,
    avgLevel: 3.17,
    topLevel: 7,
    minLevel: 0.5,
    medianLevel: 3.0,
    avgMatches: 24.1,
    totalMatches: 8283,
    avgWinRate: 0.5,
    advancedPlayers: 95,
    intermediatePlayers: 83,
    beginnerPlayers: 166,
    totalCompetitive: 6686,
    totalFriendly: 1597,
    competitiveRatio: 0.81,
    earliestMatch: "2022-08-18",
    latestMatch: "2026-02-14",
  },
  "padel-life-soccer-miami": {
    totalPlayers: 178,
    avgLevel: 3.01,
    topLevel: 5.7,
    minLevel: 0.5,
    medianLevel: 3.0,
    avgMatches: 28.7,
    totalMatches: 5112,
    avgWinRate: 0.5,
    advancedPlayers: 32,
    intermediatePlayers: 60,
    beginnerPlayers: 86,
    totalCompetitive: 4908,
    totalFriendly: 204,
    competitiveRatio: 0.96,
    earliestMatch: "2022-09-20",
    latestMatch: "2026-02-14",
  },
  "legio-gp": {
    totalPlayers: 220,
    avgLevel: 3.17,
    topLevel: 6.36,
    minLevel: 0.5,
    medianLevel: 3.06,
    avgMatches: 15.0,
    totalMatches: 3304,
    avgWinRate: 0.5,
    advancedPlayers: 65,
    intermediatePlayers: 52,
    beginnerPlayers: 103,
    totalCompetitive: 2996,
    totalFriendly: 308,
    competitiveRatio: 0.91,
    earliestMatch: "2022-11-24",
    latestMatch: "2026-02-14",
  },
  "bistro-padel-miami": {
    totalPlayers: 100,
    avgLevel: 2.5,
    topLevel: 5.0,
    minLevel: 0.5,
    medianLevel: 2.5,
    avgMatches: 10.0,
    totalMatches: 1000,
    avgWinRate: 0.5,
    advancedPlayers: 10,
    intermediatePlayers: 20,
    beginnerPlayers: 70,
    totalCompetitive: 800,
    totalFriendly: 200,
    competitiveRatio: 0.8,
    earliestMatch: "2024-01-01",
    latestMatch: "2026-02-14",
  },
};

// ────────────────────────────────────────────────────
// Top players per club (from Supabase)
// ────────────────────────────────────────────────────

export const CLUB_TOP_PLAYERS: Record<string, ClubTopPlayer[]> = {
  "ultra-padel-miami": [
    { userId: "305851", name: "Guillermo Jimenez Cagigas", level: 7.0, matchesPlayed: 57, wins: 0, winRate: null },
    { userId: "2909501", name: "Jordi Lujan", level: 7.0, matchesPlayed: 54, wins: 0, winRate: null },
    { userId: "9009800", name: "Juan Rosado", level: 7.0, matchesPlayed: 24, wins: 1, winRate: 0.33 },
    { userId: "1184627", name: "Tarek Deham", level: 6.79, matchesPlayed: 153, wins: 14, winRate: 0.48 },
    { userId: "8800167", name: "Thomas CAZALET", level: 6.7, matchesPlayed: 38, wins: 16, winRate: 0.59 },
  ],
  "real-padel-miami": [
    { userId: "2909501", name: "Jordi Lujan", level: 7.0, matchesPlayed: 54, wins: 0, winRate: null },
    { userId: "9009800", name: "Juan Rosado", level: 7.0, matchesPlayed: 24, wins: 1, winRate: 0.33 },
    { userId: "2915441", name: "David Chocarro (Reves)", level: 6.81, matchesPlayed: 34, wins: 21, winRate: 0.81 },
    { userId: "1184627", name: "Tarek Deham", level: 6.79, matchesPlayed: 153, wins: 14, winRate: 0.48 },
    { userId: "8881347", name: "Matias Cardona", level: 6.69, matchesPlayed: 45, wins: 14, winRate: 0.64 },
  ],
  "padel-x-miami": [
    { userId: "9009800", name: "Juan Rosado", level: 7.0, matchesPlayed: 24, wins: 1, winRate: 0.33 },
    { userId: "1184627", name: "Tarek Deham", level: 6.79, matchesPlayed: 153, wins: 14, winRate: 0.48 },
    { userId: "8800167", name: "Thomas CAZALET", level: 6.7, matchesPlayed: 38, wins: 16, winRate: 0.59 },
    { userId: "8881347", name: "Matias Cardona", level: 6.69, matchesPlayed: 45, wins: 14, winRate: 0.64 },
    { userId: "7465678", name: "Jaime Yarza", level: 6.57, matchesPlayed: 7, wins: 2, winRate: 0.67 },
  ],
  "i95-padel-club": [
    { userId: "305851", name: "Guillermo Jimenez Cagigas", level: 7.0, matchesPlayed: 57, wins: 0, winRate: null },
    { userId: "2915441", name: "David Chocarro (Reves)", level: 6.81, matchesPlayed: 34, wins: 21, winRate: 0.81 },
    { userId: "1184627", name: "Tarek Deham", level: 6.79, matchesPlayed: 153, wins: 14, winRate: 0.48 },
    { userId: "8800167", name: "Thomas CAZALET", level: 6.7, matchesPlayed: 38, wins: 16, winRate: 0.59 },
    { userId: "8881347", name: "Matias Cardona", level: 6.69, matchesPlayed: 45, wins: 14, winRate: 0.64 },
  ],
  "smart-padel-house": [
    { userId: "1184627", name: "Tarek Deham", level: 6.79, matchesPlayed: 153, wins: 14, winRate: 0.48 },
    { userId: "2979005", name: "Manuel Ledezma", level: 6.5, matchesPlayed: 186, wins: 34, winRate: 0.44 },
    { userId: "137840", name: "Enrique Vicenti", level: 6.25, matchesPlayed: 41, wins: 3, winRate: 0.6 },
    { userId: "3029069", name: "Natoli Farber", level: 6.23, matchesPlayed: 97, wins: 8, winRate: 0.53 },
    { userId: "350945", name: "David Amaya", level: 6.08, matchesPlayed: 16, wins: 2, winRate: 1.0 },
  ],
  "urban-padel-miami": [
    { userId: "2915441", name: "David Chocarro (Reves)", level: 6.81, matchesPlayed: 34, wins: 21, winRate: 0.81 },
    { userId: "1184627", name: "Tarek Deham", level: 6.79, matchesPlayed: 153, wins: 14, winRate: 0.48 },
    { userId: "5122749", name: "Martin Belmar", level: 6.52, matchesPlayed: 6, wins: 0, winRate: null },
    { userId: "2979005", name: "Manuel Ledezma", level: 6.5, matchesPlayed: 186, wins: 34, winRate: 0.44 },
    { userId: "3029069", name: "Natoli Farber", level: 6.23, matchesPlayed: 97, wins: 8, winRate: 0.53 },
  ],
  "open-padel-by-lasaigues": [
    { userId: "2909501", name: "Jordi Lujan", level: 7.0, matchesPlayed: 54, wins: 0, winRate: null },
    { userId: "2915441", name: "David Chocarro (Reves)", level: 6.81, matchesPlayed: 34, wins: 21, winRate: 0.81 },
    { userId: "1184627", name: "Tarek Deham", level: 6.79, matchesPlayed: 153, wins: 14, winRate: 0.48 },
    { userId: "5122749", name: "Martin Belmar", level: 6.52, matchesPlayed: 6, wins: 0, winRate: null },
    { userId: "2979005", name: "Manuel Ledezma", level: 6.5, matchesPlayed: 186, wins: 34, winRate: 0.44 },
  ],
  "point-miami-beach": [
    { userId: "9009800", name: "Juan Rosado", level: 7.0, matchesPlayed: 24, wins: 1, winRate: 0.33 },
    { userId: "8800167", name: "Thomas CAZALET", level: 6.7, matchesPlayed: 38, wins: 16, winRate: 0.59 },
    { userId: "8881347", name: "Matias Cardona", level: 6.69, matchesPlayed: 45, wins: 14, winRate: 0.64 },
    { userId: "6574193", name: "Carlos San Martin", level: 6.59, matchesPlayed: 30, wins: 15, winRate: 0.94 },
    { userId: "3029704", name: "Marc Winkler", level: 6.37, matchesPlayed: 105, wins: 13, winRate: 0.76 },
  ],
  "one-indoor-club": [
    { userId: "8784854", name: "Vicente Lopez", level: 6.01, matchesPlayed: 69, wins: 11, winRate: 0.69 },
    { userId: "1879106", name: "Marta Morga Alonso", level: 6.0, matchesPlayed: 74, wins: 0, winRate: 0 },
    { userId: "318912", name: "Miguel Briega Ramos", level: 5.74, matchesPlayed: 20, wins: 1, winRate: 1.0 },
    { userId: "9150815", name: "Diego Bonilla", level: 5.7, matchesPlayed: 19, wins: 0, winRate: 0 },
    { userId: "9608411", name: "Isaac Blatt", level: 5.7, matchesPlayed: 6, wins: 1, winRate: 1.0 },
  ],
  "padel-x-boca-raton": [
    { userId: "10027009", name: "Guy Finkelstein", level: 6.82, matchesPlayed: 29, wins: 16, winRate: 0.8 },
    { userId: "11345488", name: "Sebastian Egüez", level: 6.36, matchesPlayed: 22, wins: 8, winRate: 0.8 },
    { userId: "1498746", name: "Nalle Grinda", level: 6.31, matchesPlayed: 100, wins: 1, winRate: 0.5 },
    { userId: "8883117", name: "Sebastien Deridder", level: 6.09, matchesPlayed: 5, wins: 2, winRate: 1.0 },
    { userId: "10903193", name: "Daniil Voit", level: 6.0, matchesPlayed: 76, wins: 17, winRate: 0.74 },
  ],
  "the-set": [
    { userId: "8881347", name: "Matias Cardona", level: 6.69, matchesPlayed: 45, wins: 14, winRate: 0.64 },
    { userId: "2979005", name: "Manuel Ledezma", level: 6.5, matchesPlayed: 186, wins: 34, winRate: 0.44 },
    { userId: "8883711", name: "Vicente Ramirez", level: 5.95, matchesPlayed: 13, wins: 7, winRate: 0.88 },
    { userId: "9031070", name: "IVAN VIKINGO", level: 5.72, matchesPlayed: 28, wins: 7, winRate: 0.7 },
    { userId: "12123774", name: "Rodrigo Maurovich", level: 5.7, matchesPlayed: 7, wins: 1, winRate: 0.33 },
  ],
  "ultra-padel-aventura": [
    { userId: "3199955", name: "Jonatan Sredni", level: 6.0, matchesPlayed: 39, wins: 2, winRate: 0.5 },
    { userId: "5420721", name: "Pierre Marcellin", level: 5.92, matchesPlayed: 44, wins: 19, winRate: 0.59 },
    { userId: "3667015", name: "Jérémy Almouzni", level: 5.7, matchesPlayed: 70, wins: 26, winRate: 0.68 },
    { userId: "7480016", name: "Andres Bruckstein", level: 5.58, matchesPlayed: 21, wins: 2, winRate: 0.67 },
    { userId: "8822541", name: "Steve Millon", level: 5.5, matchesPlayed: 11, wins: 1, winRate: 0.25 },
  ],
  "10by20-fort-lauderdale": [
    { userId: "305851", name: "Guillermo Jimenez Cagigas", level: 7.0, matchesPlayed: 57, wins: 0, winRate: null },
    { userId: "3794792", name: "Flavio Galvan", level: 6.0, matchesPlayed: 107, wins: 12, winRate: 0.55 },
    { userId: "3233614", name: "Fernando Catalán", level: 5.91, matchesPlayed: 58, wins: 9, winRate: 0.69 },
    { userId: "7611842", name: "Mauricio Fadul", level: 5.71, matchesPlayed: 60, wins: 4, winRate: 0.5 },
    { userId: "7773863", name: "Valentin Mussi", level: 5.7, matchesPlayed: 5, wins: 0, winRate: null },
  ],
  "casas-padel-aventura-mall": [
    { userId: "5006024", name: "Gaston Menendez", level: 6.5, matchesPlayed: 47, wins: 0, winRate: 0 },
    { userId: "6121472", name: "Guillermo Pantano", level: 5.43, matchesPlayed: 37, wins: 1, winRate: 0.13 },
    { userId: "11280743", name: "Achot Putulyan", level: 5.35, matchesPlayed: 19, wins: 5, winRate: 0.36 },
    { userId: "7550732", name: "Lucas Chiomenti", level: 5.33, matchesPlayed: 43, wins: 1, winRate: 0.2 },
    { userId: "1459709", name: "Mario Tricarico Rosano", level: 5.31, matchesPlayed: 19, wins: 5, winRate: 0.83 },
  ],
  "epic-athletic-club": [
    { userId: "3667015", name: "Jérémy Almouzni", level: 5.7, matchesPlayed: 70, wins: 26, winRate: 0.68 },
    { userId: "3199372", name: "Ruy Teixeira", level: 5.63, matchesPlayed: 22, wins: 3, winRate: 0.75 },
    { userId: "11914647", name: "Patricio Cardenas Reyes", level: 5.46, matchesPlayed: 9, wins: 1, winRate: 1.0 },
    { userId: "10586353", name: "Francisco Peñafiel", level: 5.31, matchesPlayed: 13, wins: 1, winRate: 0.17 },
    { userId: "10869918", name: "Juanmi Chagra", level: 5.27, matchesPlayed: 49, wins: 10, winRate: 0.59 },
  ],
  "pulse-padel-hub": [
    { userId: "305851", name: "Guillermo Jimenez Cagigas", level: 7.0, matchesPlayed: 57, wins: 0, winRate: null },
    { userId: "2915441", name: "David Chocarro (Reves)", level: 6.81, matchesPlayed: 34, wins: 21, winRate: 0.81 },
    { userId: "1184627", name: "Tarek Deham", level: 6.79, matchesPlayed: 153, wins: 14, winRate: 0.48 },
    { userId: "5122749", name: "Martin Belmar", level: 6.52, matchesPlayed: 6, wins: 0, winRate: null },
    { userId: "4203715", name: "Andres Contreras", level: 6.46, matchesPlayed: 282, wins: 49, winRate: 0.83 },
  ],
  "ola-padel-club-by-nox": [
    { userId: "2979005", name: "Manuel Ledezma", level: 6.5, matchesPlayed: 186, wins: 34, winRate: 0.44 },
    { userId: "8883711", name: "Vicente Ramirez", level: 5.95, matchesPlayed: 13, wins: 7, winRate: 0.88 },
    { userId: "9031070", name: "IVAN VIKINGO", level: 5.72, matchesPlayed: 28, wins: 7, winRate: 0.7 },
    { userId: "12123774", name: "Rodrigo Maurovich", level: 5.7, matchesPlayed: 7, wins: 1, winRate: 0.33 },
    { userId: "9490490", name: "Rene A Toro", level: 5.33, matchesPlayed: 146, wins: 5, winRate: 0.71 },
  ],
  "regency-padel": [
    { userId: "9931294", name: "Daniele Trentin", level: 5.52, matchesPlayed: 13, wins: 4, winRate: 1.0 },
    { userId: "2833895", name: "Lucas Zea", level: 5.45, matchesPlayed: 27, wins: 15, winRate: 0.94 },
    { userId: "7395503", name: "Enrique Azpurua", level: 5.43, matchesPlayed: 7, wins: 0, winRate: 0 },
    { userId: "24469", name: "Pablo Rodriguez", level: 5.33, matchesPlayed: 5, wins: 3, winRate: 1.0 },
    { userId: "10877970", name: "Jared Levi", level: 5.29, matchesPlayed: 21, wins: 9, winRate: 0.9 },
  ],
  "area-centre": [
    { userId: "8881347", name: "Matias Cardona", level: 6.69, matchesPlayed: 45, wins: 14, winRate: 0.64 },
    { userId: "2772172", name: "Gabriel Arraiz", level: 6.2, matchesPlayed: 106, wins: 11, winRate: 0.61 },
    { userId: "3154967", name: "Luis Guzman", level: 5.87, matchesPlayed: 89, wins: 21, winRate: 0.66 },
    { userId: "8433126", name: "Francesc Llanas", level: 5.78, matchesPlayed: 36, wins: 3, winRate: 1.0 },
    { userId: "932188", name: "Alejandro Rodrigo", level: 5.73, matchesPlayed: 43, wins: 31, winRate: 0.82 },
  ],
  "platinum-padel": [
    { userId: "305851", name: "Guillermo Jimenez Cagigas", level: 7.0, matchesPlayed: 57, wins: 0, winRate: null },
    { userId: "766745", name: "Gianlucca Massa", level: 6.5, matchesPlayed: 22, wins: 1, winRate: 0.5 },
    { userId: "9290890", name: "Carles Giner Llebaria", level: 6.01, matchesPlayed: 6, wins: 1, winRate: 1.0 },
    { userId: "1879106", name: "Marta Morga Alonso", level: 6.0, matchesPlayed: 74, wins: 0, winRate: 0 },
    { userId: "9208143", name: "BRIAN SMITH", level: 5.86, matchesPlayed: 33, wins: 14, winRate: 0.82 },
  ],
  "padel-life-soccer-miami": [
    { userId: "3667015", name: "Jérémy Almouzni", level: 5.7, matchesPlayed: 70, wins: 26, winRate: 0.68 },
    { userId: "9608411", name: "Isaac Blatt", level: 5.7, matchesPlayed: 6, wins: 1, winRate: 1.0 },
    { userId: "7480016", name: "Andres Bruckstein", level: 5.58, matchesPlayed: 21, wins: 2, winRate: 0.67 },
    { userId: "616687", name: "Claudio Lopez", level: 5.5, matchesPlayed: 10, wins: 0, winRate: null },
    { userId: "6121472", name: "Guillermo Pantano", level: 5.43, matchesPlayed: 37, wins: 1, winRate: 0.13 },
  ],
  "legio-gp": [
    { userId: "11345488", name: "Sebastian Egüez", level: 6.36, matchesPlayed: 22, wins: 8, winRate: 0.8 },
    { userId: "3378787", name: "Juan Martin Jalif", level: 6.0, matchesPlayed: 6, wins: 1, winRate: 1.0 },
    { userId: "8760169", name: "Diego Marquina", level: 5.87, matchesPlayed: 20, wins: 6, winRate: 0.6 },
    { userId: "11232412", name: "Aryan Parekh", level: 5.82, matchesPlayed: 10, wins: 3, winRate: 0.6 },
    { userId: "12849371", name: "Reese Daly", level: 5.74, matchesPlayed: 7, wins: 1, winRate: 1.0 },
  ],
  "bistro-padel-miami": [],
};

// ────────────────────────────────────────────────────
// Score computation
// ────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Map a value to 1-10 scale */
function scale(value: number, min: number, max: number): number {
  return clamp(Math.round(((value - min) / (max - min)) * 9 + 1), 1, 10);
}

export function computeScores(
  profile: Omit<ClubProfile, "image"> | ClubProfile,
  stats: ClubStats,
): FullClubProfile["scores"] {
  // Community: based on player count (range: 100-6000)
  const community = scale(stats.totalPlayers, 100, 5500);

  // Competitive: avg level (range: 2-4) + competitive ratio
  const levelScore = scale(stats.avgLevel, 2.0, 3.8);
  const compRatioScore = scale(stats.competitiveRatio, 0.75, 0.96);
  const competitive = Math.round((levelScore * 0.6 + compRatioScore * 0.4));

  // Activity: matches per player (range: 10-50) + total matches
  const matchesPerPlayer = scale(stats.avgMatches, 10, 50);
  const totalMatchScore = scale(stats.totalMatches, 1000, 100000);
  const activity = Math.round((matchesPerPlayer * 0.5 + totalMatchScore * 0.5));

  // Diversity: how evenly spread across levels (lower = more diverse)
  const total = stats.advancedPlayers + stats.intermediatePlayers + stats.beginnerPlayers;
  const advPct = stats.advancedPlayers / total;
  const intPct = stats.intermediatePlayers / total;
  const begPct = stats.beginnerPlayers / total;
  // Ideal distribution is ~33% each; measure distance from ideal
  const idealSpread = Math.abs(advPct - 0.33) + Math.abs(intPct - 0.33) + Math.abs(begPct - 0.33);
  const diversity = scale(1 - idealSpread, 0.3, 1.0);

  // Facilities: courts + amenities count
  const courtScore = scale(profile.courts.total, 1, 27);
  const amenityScore = scale(profile.amenities.length, 3, 12);
  const indoorBonus = profile.indoor ? 1 : 0;
  const facilities = clamp(Math.round((courtScore * 0.5 + amenityScore * 0.3 + indoorBonus * 2 * 0.2)), 1, 10);

  return { community, competitive, activity, diversity, facilities };
}

export function computeOverallScore(scores: FullClubProfile["scores"]): number {
  // Weighted average
  const raw =
    scores.community * 0.25 +
    scores.competitive * 0.2 +
    scores.activity * 0.2 +
    scores.diversity * 0.15 +
    scores.facilities * 0.2;
  return clamp(Math.round(raw * 10) / 10, 1, 10);
}

// ────────────────────────────────────────────────────
// Vibe tags (editorial, data-driven)
// ────────────────────────────────────────────────────

function computeVibes(profile: Omit<ClubProfile, "image"> | ClubProfile, stats: ClubStats): ClubVibe[] {
  const vibes: ClubVibe[] = [];

  // Data-driven vibes
  if (stats.avgLevel >= 3.3) vibes.push({ label: "Competitive Scene", icon: "🔥" });
  if (stats.avgLevel < 2.7) vibes.push({ label: "Great for Beginners", icon: "🌱" });
  if (stats.avgMatches >= 35) vibes.push({ label: "High Engagement", icon: "⚡" });
  if (stats.totalPlayers >= 3000) vibes.push({ label: "Massive Community", icon: "👥" });
  if (stats.competitiveRatio >= 0.92) vibes.push({ label: "Serious Players", icon: "🎯" });
  if (stats.competitiveRatio < 0.82) vibes.push({ label: "Social & Fun", icon: "🎉" });

  // Facility-driven vibes
  if (profile.courts.total >= 10) vibes.push({ label: "Mega Facility", icon: "🏟️" });
  if (profile.indoor && profile.courts.indoor >= 4) vibes.push({ label: "Climate Controlled", icon: "❄️" });
  if (profile.amenities.some(a => a.toLowerCase().includes("cold plunge"))) vibes.push({ label: "Wellness", icon: "🧊" });
  if (profile.amenities.some(a => a.toLowerCase().includes("restaurant") || a.toLowerCase().includes("bbq"))) vibes.push({ label: "Great Food", icon: "🍽️" });
  if (profile.amenities.some(a => a.toLowerCase().includes("gym"))) vibes.push({ label: "Full Gym", icon: "💪" });
  if (profile.hours.includes("24/7")) vibes.push({ label: "24/7 Access", icon: "🌙" });
  if (profile.membershipFrom) vibes.push({ label: "Membership Available", icon: "💳" });
  if (profile.amenities.some(a => a.toLowerCase().includes("pickleball"))) vibes.push({ label: "Pickleball Too", icon: "🏓" });

  return vibes.slice(0, 6); // Cap at 6
}

// ────────────────────────────────────────────────────
// Coach cross-reference
// ────────────────────────────────────────────────────

import { coaches } from "@/data/coaches";
import { normalizeClubName } from "./club-aliases";

/** Build a map of club slug -> coaches */
function getCoachesForClub(clubName: string): ClubCoach[] {
  const seen = new Set<string>();
  const result: ClubCoach[] = [];

  for (const coach of coaches) {
    // Check both clubs array and classClubs
    const allClubNames = [
      ...coach.clubs.map(c => c.name),
      ...coach.classClubs,
    ];

    const normalized = allClubNames.map(n => normalizeClubName(n));
    if (normalized.some(n => n === clubName)) {
      // Deduplicate by coach name (some coaches have duplicate entries)
      if (seen.has(coach.name.toLowerCase().trim())) continue;
      seen.add(coach.name.toLowerCase().trim());

      result.push({
        coachId: coach.coach_id,
        name: coach.name,
        picture: coach.picture ?? null,
        level: coach.level ?? null,
        totalClasses: coach.stats.totalClasses,
      });
    }
  }

  return result.sort((a, b) => b.totalClasses - a.totalClasses);
}

// ────────────────────────────────────────────────────
// Miami averages (for comparison)
// ────────────────────────────────────────────────────

export function getMiamiAverages(): {
  avgLevel: number;
  avgMatches: number;
  avgPlayers: number;
  avgCompetitiveRatio: number;
} {
  const slugs = Object.keys(CLUB_STATS);
  const stats = slugs.map(s => CLUB_STATS[s]);
  return {
    avgLevel: +(stats.reduce((s, c) => s + c.avgLevel, 0) / stats.length).toFixed(2),
    avgMatches: +(stats.reduce((s, c) => s + c.avgMatches, 0) / stats.length).toFixed(1),
    avgPlayers: Math.round(stats.reduce((s, c) => s + c.totalPlayers, 0) / stats.length),
    avgCompetitiveRatio: +(stats.reduce((s, c) => s + c.competitiveRatio, 0) / stats.length).toFixed(2),
  };
}

// ────────────────────────────────────────────────────
// Assemble full profiles
// ────────────────────────────────────────────────────

/** Get optimized Cloudinary URL for a club image */
function getClubImage(slug: string, width = 800): string {
  const raw = CLUB_IMAGES[slug];
  if (!raw) return "";
  // Use Cloudinary transforms for optimal sizing
  return raw.replace("/upload/", `/upload/c_fill,w_${width},h_${Math.round(width * 0.5)},q_auto,f_auto/`);
}

export function getAllClubProfiles(): FullClubProfile[] {
  return Object.keys(CLUB_PROFILES)
    .map((slug) => {
      const profile = { ...CLUB_PROFILES[slug], image: getClubImage(slug, 600) };
      const stats = CLUB_STATS[slug];
      const topPlayers = CLUB_TOP_PLAYERS[slug] ?? [];
      if (!stats) return null;
      const scores = computeScores(profile, stats);
      const overallScore = computeOverallScore(scores);
      const coachList = getCoachesForClub(profile.name);
      const vibes = computeVibes(profile, stats);
      return { ...profile, stats, topPlayers, coaches: coachList, vibes, scores, overallScore };
    })
    .filter(Boolean)
    .sort((a, b) => b!.overallScore - a!.overallScore) as FullClubProfile[];
}

export function getClubProfile(slug: string): FullClubProfile | null {
  const profile = CLUB_PROFILES[slug];
  const stats = CLUB_STATS[slug];
  if (!profile || !stats) return null;
  const enriched = { ...profile, image: getClubImage(slug, 1000) };
  const topPlayers = CLUB_TOP_PLAYERS[slug] ?? [];
  const scores = computeScores(enriched, stats);
  const overallScore = computeOverallScore(scores);
  const coachList = getCoachesForClub(enriched.name);
  const vibes = computeVibes(enriched, stats);
  return { ...enriched, stats, topPlayers, coaches: coachList, vibes, scores, overallScore };
}

/** Convert club name to slug */
export function clubNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
