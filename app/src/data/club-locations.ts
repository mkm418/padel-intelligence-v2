/**
 * Known club locations in the Miami / South Florida area.
 * Coordinates are approximate center points for each venue.
 */
export interface ClubLocation {
  name: string;
  city: string;
  lat: number;
  lng: number;
}

export const CLUB_LOCATIONS: ClubLocation[] = [
  { name: "AREA Centre", city: "Miami", lat: 25.7617, lng: -80.1918 },
  { name: "Area Center Doral", city: "Doral", lat: 25.8195, lng: -80.3553 },
  { name: "Bistro Padel Miami", city: "Miami", lat: 25.7742, lng: -80.1936 },
  { name: "Casas Padel Aventura Mall", city: "Aventura", lat: 25.9565, lng: -80.1422 },
  { name: "Epic Athletic Club", city: "Sunrise", lat: 26.1590, lng: -80.2956 },
  { name: "I95 Padel Club", city: "Miami", lat: 25.8525, lng: -80.1866 },
  { name: "LEGIO GP", city: "Boca Raton", lat: 26.3683, lng: -80.1289 },
  { name: "National Padel League", city: "Miami", lat: 25.7617, lng: -80.2100 },
  { name: "Ola Padel Club by Nox", city: "Doral", lat: 25.8126, lng: -80.3384 },
  { name: "One Indoor Club", city: "Miami", lat: 25.7850, lng: -80.2101 },
  { name: "Open Padel by Lasaigues", city: "Miramar", lat: 25.9773, lng: -80.2810 },
  { name: "Padel Life & Soccer Miami", city: "Hallandale Beach", lat: 25.9812, lng: -80.1484 },
  { name: "Padel X", city: "Miami", lat: 25.7550, lng: -80.2500 },
  { name: "Padel X Boca Raton", city: "Boca Raton", lat: 26.3585, lng: -80.0831 },
  { name: "Padel X Miami", city: "Miami", lat: 25.7550, lng: -80.2600 },
  { name: "Platinum Padel", city: "North Miami", lat: 25.8901, lng: -80.1746 },
  { name: "Point Miami Beach", city: "Miami Beach", lat: 25.8003, lng: -80.1300 },
  { name: "Pulse Padel Hub", city: "North Miami", lat: 25.9001, lng: -80.1867 },
  { name: "Real Padel Miami", city: "Miami", lat: 25.7700, lng: -80.2200 },
  { name: "Regency Padel", city: "Miami", lat: 25.7500, lng: -80.2300 },
  { name: "Smart Padel House", city: "Miami", lat: 25.7816, lng: -80.2271 },
  { name: "Stadio Soccer", city: "Miami", lat: 25.7730, lng: -80.2100 },
  { name: "THE SET", city: "Doral", lat: 25.8221, lng: -80.3428 },
  { name: "Ultra Padel Aventura", city: "Aventura", lat: 25.9500, lng: -80.1400 },
  { name: "Ultra Padel Miami", city: "Miami", lat: 25.7867, lng: -80.2153 },
  { name: "Urban Padel Miami", city: "Doral", lat: 25.8150, lng: -80.3500 },
  { name: "10by20 Fort Lauderdale", city: "Fort Lauderdale", lat: 26.1224, lng: -80.1373 },
  { name: "Palm Beach Padel", city: "West Palm Beach", lat: 26.7153, lng: -80.0534 },
  { name: "Xcel Padel", city: "West Palm Beach", lat: 26.6880, lng: -80.0900 },
  { name: "Miami Padel Federation", city: "Miami", lat: 25.7820, lng: -80.2275 },
];

/** Look up coordinates for a club name (after normalization) */
export function findClubLocation(name: string): ClubLocation | undefined {
  return CLUB_LOCATIONS.find(
    (cl) => cl.name.toLowerCase() === name.toLowerCase(),
  );
}
