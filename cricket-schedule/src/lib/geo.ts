/**
 * Bundled city → coordinates lookup for the map view.
 *
 * Fixtures carry venue/city names but no coordinates, and a static site
 * cannot call a geocoding API per request, so the major cricket host cities
 * are bundled here. Fixtures whose city is not in the table are listed under
 * the map as "not mapped" rather than dropped silently.
 */
import type { Fixture } from "./types";

export interface GeoPoint {
  lat: number;
  lng: number;
}

const CITY_COORDS: Record<string, GeoPoint> = {
  // India
  "ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "alur": { lat: 13.0846, lng: 77.3884 },
  "bengaluru": { lat: 12.9716, lng: 77.5946 },
  "bangalore": { lat: 12.9716, lng: 77.5946 },
  "chandigarh": { lat: 30.7333, lng: 76.7794 },
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "cuttack": { lat: 20.4625, lng: 85.8830 },
  "dehradun": { lat: 30.3165, lng: 78.0322 },
  "delhi": { lat: 28.6139, lng: 77.2090 },
  "new delhi": { lat: 28.6139, lng: 77.2090 },
  "dharamsala": { lat: 32.2190, lng: 76.3234 },
  "guwahati": { lat: 26.1445, lng: 91.7362 },
  "hyderabad": { lat: 17.3850, lng: 78.4867 },
  "indore": { lat: 22.7196, lng: 75.8577 },
  "jaipur": { lat: 26.9124, lng: 75.7873 },
  "kanpur": { lat: 26.4499, lng: 80.3319 },
  "kochi": { lat: 9.9312, lng: 76.2673 },
  "kolkata": { lat: 22.5726, lng: 88.3639 },
  "lucknow": { lat: 26.8467, lng: 80.9462 },
  "mohali": { lat: 30.7046, lng: 76.7179 },
  "mumbai": { lat: 19.0760, lng: 72.8777 },
  "navi mumbai": { lat: 19.0330, lng: 73.0297 },
  "nagpur": { lat: 21.1458, lng: 79.0882 },
  "pune": { lat: 18.5204, lng: 73.8567 },
  "raipur": { lat: 21.2514, lng: 81.6296 },
  "rajkot": { lat: 22.3039, lng: 70.8022 },
  "ranchi": { lat: 23.3441, lng: 85.3096 },
  "thiruvananthapuram": { lat: 8.5241, lng: 76.9366 },
  "vadodara": { lat: 22.3072, lng: 73.1812 },
  "visakhapatnam": { lat: 17.6868, lng: 83.2185 },
  // England & Wales
  "london": { lat: 51.5074, lng: -0.1278 },
  "birmingham": { lat: 52.4862, lng: -1.8904 },
  "manchester": { lat: 53.4808, lng: -2.2426 },
  "leeds": { lat: 53.8008, lng: -1.5491 },
  "nottingham": { lat: 52.9548, lng: -1.1581 },
  "southampton": { lat: 50.9097, lng: -1.4044 },
  "cardiff": { lat: 51.4816, lng: -3.1791 },
  "bristol": { lat: 51.4545, lng: -2.5879 },
  "chester-le-street": { lat: 54.8566, lng: -1.5740 },
  "worcester": { lat: 52.1920, lng: -2.2200 },
  "northampton": { lat: 52.2405, lng: -0.9027 },
  "taunton": { lat: 51.0146, lng: -3.1031 },
  "hove": { lat: 50.8279, lng: -0.1688 },
  "canterbury": { lat: 51.2802, lng: 1.0789 },
  "derby": { lat: 52.9226, lng: -1.4746 },
  "leicester": { lat: 52.6369, lng: -1.1398 },
  // Australia
  "sydney": { lat: -33.8688, lng: 151.2093 },
  "melbourne": { lat: -37.8136, lng: 144.9631 },
  "brisbane": { lat: -27.4698, lng: 153.0251 },
  "perth": { lat: -31.9523, lng: 115.8613 },
  "adelaide": { lat: -34.9285, lng: 138.6007 },
  "hobart": { lat: -42.8821, lng: 147.3272 },
  "canberra": { lat: -35.2809, lng: 149.1300 },
  "mackay": { lat: -21.1411, lng: 149.1860 },
  "cairns": { lat: -16.9186, lng: 145.7781 },
  "darwin": { lat: -12.4634, lng: 130.8456 },
  // New Zealand
  "auckland": { lat: -36.8485, lng: 174.7633 },
  "wellington": { lat: -41.2866, lng: 174.7756 },
  "christchurch": { lat: -43.5321, lng: 172.6362 },
  "hamilton": { lat: -37.7870, lng: 175.2793 },
  "mount maunganui": { lat: -37.6388, lng: 176.1867 },
  "dunedin": { lat: -45.8788, lng: 170.5028 },
  "napier": { lat: -39.4928, lng: 176.9120 },
  // Sri Lanka
  "colombo": { lat: 6.9271, lng: 79.8612 },
  "kandy": { lat: 7.2906, lng: 80.6337 },
  "galle": { lat: 6.0535, lng: 80.2210 },
  "hambantota": { lat: 6.1429, lng: 81.1212 },
  "dambulla": { lat: 7.8742, lng: 80.6511 },
  // Pakistan
  "karachi": { lat: 24.8607, lng: 67.0011 },
  "lahore": { lat: 31.5204, lng: 74.3587 },
  "rawalpindi": { lat: 33.5651, lng: 73.0169 },
  "multan": { lat: 30.1575, lng: 71.5249 },
  // Bangladesh
  "dhaka": { lat: 23.8103, lng: 90.4125 },
  "mirpur": { lat: 23.8042, lng: 90.3667 },
  "chattogram": { lat: 22.3569, lng: 91.7832 },
  "chittagong": { lat: 22.3569, lng: 91.7832 },
  "sylhet": { lat: 24.8949, lng: 91.8687 },
  // UAE
  "dubai": { lat: 25.2048, lng: 55.2708 },
  "sharjah": { lat: 25.3463, lng: 55.4209 },
  "abu dhabi": { lat: 24.4539, lng: 54.3773 },
  // South Africa
  "johannesburg": { lat: -26.2041, lng: 28.0473 },
  "cape town": { lat: -33.9249, lng: 18.4241 },
  "durban": { lat: -29.8587, lng: 31.0218 },
  "centurion": { lat: -25.8603, lng: 28.1894 },
  "gqeberha": { lat: -33.9608, lng: 25.6022 },
  "port elizabeth": { lat: -33.9608, lng: 25.6022 },
  "paarl": { lat: -33.7342, lng: 18.9621 },
  "bloemfontein": { lat: -29.0852, lng: 26.1596 },
  "east london": { lat: -33.0292, lng: 27.8546 },
  "potchefstroom": { lat: -26.7167, lng: 27.1000 },
  "benoni": { lat: -26.1885, lng: 28.3208 },
  // West Indies
  "bridgetown": { lat: 13.0975, lng: -59.6165 },
  "port of spain": { lat: 10.6549, lng: -61.5019 },
  "kingston": { lat: 17.9712, lng: -76.7936 },
  "gros islet": { lat: 14.0726, lng: -60.9490 },
  "providence": { lat: 6.7700, lng: -58.1700 },
  "north sound": { lat: 17.1380, lng: -61.7977 },
  "basseterre": { lat: 17.2955, lng: -62.7261 },
  "tarouba": { lat: 10.2510, lng: -61.4500 },
  // Zimbabwe & others
  "harare": { lat: -17.8252, lng: 31.0335 },
  "bulawayo": { lat: -20.1500, lng: 28.5833 },
  "nairobi": { lat: -1.2921, lng: 36.8219 },
  "kathmandu": { lat: 27.7172, lng: 85.3240 },
  "kirtipur": { lat: 27.6789, lng: 85.2774 },
};

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Resolve a fixture to coordinates via its city, falling back to the segment
 * after the last comma in the venue name (CricAPI style: "Ground, City").
 */
export function locateFixture(f: Fixture): GeoPoint | null {
  if (f.city) {
    const hit = CITY_COORDS[normalize(f.city)];
    if (hit) return hit;
  }
  const parts = f.venue.split(",");
  if (parts.length > 1) {
    const hit = CITY_COORDS[normalize(parts[parts.length - 1])];
    if (hit) return hit;
  }
  return null;
}
