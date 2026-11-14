import "server-only";

export interface DemoSuburb {
  name: string;
  state: string;
  postcode: string;
  lat: number;
  lng: number;
  /** Multiplier on the metro's median prices. */
  tier: number;
  /** Share of stock that is apartments. */
  units: number;
  /** Jitter radius in degrees. */
  r?: number;
  metro: keyof typeof METROS;
}

export const METROS = {
  SYD: { house: 1_650_000, unit: 860_000, houseRent: 820, unitRent: 700 },
  MEL: { house: 980_000, unit: 610_000, houseRent: 610, unitRent: 540 },
  BNE: { house: 1_020_000, unit: 680_000, houseRent: 720, unitRent: 620 },
  GC: { house: 1_250_000, unit: 860_000, houseRent: 850, unitRent: 720 },
  PER: { house: 880_000, unit: 520_000, houseRent: 740, unitRent: 640 },
  ADL: { house: 860_000, unit: 540_000, houseRent: 630, unitRent: 530 },
  HBA: { house: 720_000, unit: 540_000, houseRent: 570, unitRent: 490 },
  CBR: { house: 1_020_000, unit: 590_000, houseRent: 730, unitRent: 610 },
  DRW: { house: 640_000, unit: 400_000, houseRent: 680, unitRent: 560 },
  REG: { house: 950_000, unit: 650_000, houseRent: 640, unitRent: 540 },
} as const;

export const DEMO_SUBURBS: DemoSuburb[] = [
  // Sydney
  { name: "Sydney", state: "NSW", postcode: "2000", lat: -33.8708, lng: 151.2073, tier: 1.4, units: 0.96, r: 0.005, metro: "SYD" },
  { name: "Surry Hills", state: "NSW", postcode: "2010", lat: -33.8861, lng: 151.2111, tier: 1.05, units: 0.7, metro: "SYD" },
  { name: "Darlinghurst", state: "NSW", postcode: "2010", lat: -33.879, lng: 151.219, tier: 1.0, units: 0.8, r: 0.004, metro: "SYD" },
  { name: "Paddington", state: "NSW", postcode: "2021", lat: -33.8848, lng: 151.2275, tier: 1.75, units: 0.35, r: 0.005, metro: "SYD" },
  { name: "Bondi Beach", state: "NSW", postcode: "2026", lat: -33.8882, lng: 151.2716, tier: 2.0, units: 0.65, r: 0.005, metro: "SYD" },
  { name: "Bondi Junction", state: "NSW", postcode: "2022", lat: -33.8932, lng: 151.2477, tier: 1.5, units: 0.72, r: 0.005, metro: "SYD" },
  { name: "Coogee", state: "NSW", postcode: "2034", lat: -33.9196, lng: 151.2505, tier: 1.85, units: 0.62, r: 0.005, metro: "SYD" },
  { name: "Randwick", state: "NSW", postcode: "2031", lat: -33.9145, lng: 151.2416, tier: 1.55, units: 0.55, metro: "SYD" },
  { name: "Maroubra", state: "NSW", postcode: "2035", lat: -33.9475, lng: 151.2385, tier: 1.35, units: 0.5, metro: "SYD" },
  { name: "Newtown", state: "NSW", postcode: "2042", lat: -33.897, lng: 151.1793, tier: 1.05, units: 0.45, r: 0.005, metro: "SYD" },
  { name: "Glebe", state: "NSW", postcode: "2037", lat: -33.8796, lng: 151.1856, tier: 1.05, units: 0.55, r: 0.004, metro: "SYD" },
  { name: "Balmain", state: "NSW", postcode: "2041", lat: -33.8589, lng: 151.1793, tier: 1.45, units: 0.35, r: 0.004, metro: "SYD" },
  { name: "Leichhardt", state: "NSW", postcode: "2040", lat: -33.8836, lng: 151.1567, tier: 1.2, units: 0.35, metro: "SYD" },
  { name: "Marrickville", state: "NSW", postcode: "2204", lat: -33.911, lng: 151.155, tier: 1.0, units: 0.45, metro: "SYD" },
  { name: "Mosman", state: "NSW", postcode: "2088", lat: -33.829, lng: 151.244, tier: 2.6, units: 0.45, r: 0.006, metro: "SYD" },
  { name: "Neutral Bay", state: "NSW", postcode: "2089", lat: -33.838, lng: 151.219, tier: 1.7, units: 0.75, r: 0.004, metro: "SYD" },
  { name: "North Sydney", state: "NSW", postcode: "2060", lat: -33.839, lng: 151.207, tier: 1.35, units: 0.85, r: 0.004, metro: "SYD" },
  { name: "Chatswood", state: "NSW", postcode: "2067", lat: -33.7969, lng: 151.1803, tier: 1.5, units: 0.6, metro: "SYD" },
  { name: "Manly", state: "NSW", postcode: "2095", lat: -33.7975, lng: 151.2805, tier: 2.2, units: 0.6, r: 0.005, metro: "SYD" },
  { name: "Dee Why", state: "NSW", postcode: "2099", lat: -33.753, lng: 151.283, tier: 1.15, units: 0.6, r: 0.005, metro: "SYD" },
  { name: "Parramatta", state: "NSW", postcode: "2150", lat: -33.815, lng: 151.0011, tier: 0.75, units: 0.8, metro: "SYD" },
  { name: "Strathfield", state: "NSW", postcode: "2135", lat: -33.879, lng: 151.082, tier: 1.45, units: 0.5, metro: "SYD" },
  { name: "Burwood", state: "NSW", postcode: "2134", lat: -33.877, lng: 151.104, tier: 1.25, units: 0.6, metro: "SYD" },
  { name: "Ryde", state: "NSW", postcode: "2112", lat: -33.815, lng: 151.104, tier: 1.05, units: 0.45, metro: "SYD" },
  { name: "Hornsby", state: "NSW", postcode: "2077", lat: -33.703, lng: 151.099, tier: 0.9, units: 0.45, metro: "SYD" },
  { name: "Wahroonga", state: "NSW", postcode: "2076", lat: -33.718, lng: 151.117, tier: 1.6, units: 0.2, metro: "SYD" },
  { name: "Castle Hill", state: "NSW", postcode: "2154", lat: -33.729, lng: 151.004, tier: 1.05, units: 0.2, metro: "SYD" },
  { name: "Cronulla", state: "NSW", postcode: "2230", lat: -34.0545, lng: 151.149, tier: 1.4, units: 0.6, r: 0.005, metro: "SYD" },
  { name: "Hurstville", state: "NSW", postcode: "2220", lat: -33.967, lng: 151.102, tier: 0.9, units: 0.6, metro: "SYD" },
  { name: "Liverpool", state: "NSW", postcode: "2170", lat: -33.92, lng: 150.923, tier: 0.6, units: 0.45, metro: "SYD" },
  { name: "Blacktown", state: "NSW", postcode: "2148", lat: -33.771, lng: 150.906, tier: 0.58, units: 0.3, metro: "SYD" },
  { name: "Penrith", state: "NSW", postcode: "2750", lat: -33.751, lng: 150.694, tier: 0.55, units: 0.3, metro: "SYD" },
  { name: "Rose Bay", state: "NSW", postcode: "2029", lat: -33.8735, lng: 151.267, tier: 2.7, units: 0.55, r: 0.004, metro: "SYD" },
  { name: "Double Bay", state: "NSW", postcode: "2028", lat: -33.8785, lng: 151.2425, tier: 2.4, units: 0.7, r: 0.003, metro: "SYD" },
  // Melbourne
  { name: "Melbourne", state: "VIC", postcode: "3000", lat: -37.8136, lng: 144.9631, tier: 1.0, units: 0.97, r: 0.005, metro: "MEL" },
  { name: "Southbank", state: "VIC", postcode: "3006", lat: -37.825, lng: 144.962, tier: 1.0, units: 0.97, r: 0.004, metro: "MEL" },
  { name: "Fitzroy", state: "VIC", postcode: "3065", lat: -37.798, lng: 144.978, tier: 1.35, units: 0.5, r: 0.004, metro: "MEL" },
  { name: "Carlton", state: "VIC", postcode: "3053", lat: -37.8, lng: 144.967, tier: 1.3, units: 0.65, r: 0.004, metro: "MEL" },
  { name: "Richmond", state: "VIC", postcode: "3121", lat: -37.823, lng: 144.998, tier: 1.35, units: 0.5, metro: "MEL" },
  { name: "South Yarra", state: "VIC", postcode: "3141", lat: -37.838, lng: 144.993, tier: 1.6, units: 0.75, metro: "MEL" },
  { name: "Toorak", state: "VIC", postcode: "3142", lat: -37.841, lng: 145.015, tier: 3.6, units: 0.4, metro: "MEL" },
  { name: "St Kilda", state: "VIC", postcode: "3182", lat: -37.862, lng: 144.986, tier: 1.3, units: 0.72, r: 0.005, metro: "MEL" },
  { name: "Elwood", state: "VIC", postcode: "3184", lat: -37.882, lng: 144.99, tier: 1.65, units: 0.62, r: 0.004, metro: "MEL" },
  { name: "Brighton", state: "VIC", postcode: "3186", lat: -37.907, lng: 145.005, tier: 2.6, units: 0.3, metro: "MEL" },
  { name: "Brunswick", state: "VIC", postcode: "3056", lat: -37.767, lng: 144.96, tier: 1.15, units: 0.5, metro: "MEL" },
  { name: "Northcote", state: "VIC", postcode: "3070", lat: -37.77, lng: 145.0, tier: 1.4, units: 0.35, metro: "MEL" },
  { name: "Preston", state: "VIC", postcode: "3072", lat: -37.742, lng: 145.005, tier: 1.05, units: 0.35, metro: "MEL" },
  { name: "Hawthorn", state: "VIC", postcode: "3122", lat: -37.822, lng: 145.035, tier: 2.2, units: 0.55, metro: "MEL" },
  { name: "Kew", state: "VIC", postcode: "3101", lat: -37.806, lng: 145.03, tier: 2.4, units: 0.35, metro: "MEL" },
  { name: "Camberwell", state: "VIC", postcode: "3124", lat: -37.842, lng: 145.07, tier: 2.3, units: 0.3, metro: "MEL" },
  { name: "Box Hill", state: "VIC", postcode: "3128", lat: -37.819, lng: 145.122, tier: 1.5, units: 0.6, metro: "MEL" },
  { name: "Glen Waverley", state: "VIC", postcode: "3150", lat: -37.879, lng: 145.165, tier: 1.5, units: 0.25, metro: "MEL" },
  { name: "Footscray", state: "VIC", postcode: "3011", lat: -37.8, lng: 144.9, tier: 0.95, units: 0.6, metro: "MEL" },
  { name: "Williamstown", state: "VIC", postcode: "3016", lat: -37.857, lng: 144.894, tier: 1.4, units: 0.3, r: 0.004, metro: "MEL" },
  { name: "Werribee", state: "VIC", postcode: "3030", lat: -37.9, lng: 144.66, tier: 0.62, units: 0.15, metro: "MEL" },
  { name: "Frankston", state: "VIC", postcode: "3199", lat: -38.144, lng: 145.13, tier: 0.75, units: 0.3, metro: "MEL" },
  { name: "Geelong", state: "VIC", postcode: "3220", lat: -38.1499, lng: 144.3617, tier: 0.75, units: 0.3, metro: "MEL" },
  // Brisbane
  { name: "Brisbane City", state: "QLD", postcode: "4000", lat: -27.4698, lng: 153.0251, tier: 0.95, units: 0.97, r: 0.004, metro: "BNE" },
  { name: "South Brisbane", state: "QLD", postcode: "4101", lat: -27.4805, lng: 153.0165, tier: 1.05, units: 0.9, r: 0.004, metro: "BNE" },
  { name: "Fortitude Valley", state: "QLD", postcode: "4006", lat: -27.457, lng: 153.034, tier: 0.95, units: 0.9, r: 0.004, metro: "BNE" },
  { name: "New Farm", state: "QLD", postcode: "4005", lat: -27.467, lng: 153.046, tier: 1.9, units: 0.65, r: 0.004, metro: "BNE" },
  { name: "Paddington", state: "QLD", postcode: "4064", lat: -27.46, lng: 152.999, tier: 1.6, units: 0.25, metro: "BNE" },
  { name: "West End", state: "QLD", postcode: "4101", lat: -27.483, lng: 153.006, tier: 1.4, units: 0.6, r: 0.004, metro: "BNE" },
  { name: "Bulimba", state: "QLD", postcode: "4171", lat: -27.453, lng: 153.06, tier: 1.7, units: 0.35, r: 0.004, metro: "BNE" },
  { name: "Ascot", state: "QLD", postcode: "4007", lat: -27.431, lng: 153.062, tier: 2.0, units: 0.35, metro: "BNE" },
  { name: "Toowong", state: "QLD", postcode: "4066", lat: -27.485, lng: 152.99, tier: 1.4, units: 0.65, metro: "BNE" },
  { name: "Indooroopilly", state: "QLD", postcode: "4068", lat: -27.499, lng: 152.973, tier: 1.35, units: 0.4, metro: "BNE" },
  { name: "Chermside", state: "QLD", postcode: "4032", lat: -27.385, lng: 153.031, tier: 0.9, units: 0.5, metro: "BNE" },
  { name: "Carindale", state: "QLD", postcode: "4152", lat: -27.503, lng: 153.102, tier: 1.2, units: 0.25, metro: "BNE" },
  // Gold Coast & Sunshine Coast
  { name: "Surfers Paradise", state: "QLD", postcode: "4217", lat: -28.0, lng: 153.427, tier: 1.0, units: 0.92, r: 0.004, metro: "GC" },
  { name: "Broadbeach", state: "QLD", postcode: "4218", lat: -28.031, lng: 153.428, tier: 1.15, units: 0.85, r: 0.004, metro: "GC" },
  { name: "Burleigh Heads", state: "QLD", postcode: "4220", lat: -28.093, lng: 153.445, tier: 1.4, units: 0.6, r: 0.005, metro: "GC" },
  { name: "Southport", state: "QLD", postcode: "4215", lat: -27.97, lng: 153.4, tier: 0.75, units: 0.65, metro: "GC" },
  { name: "Coolangatta", state: "QLD", postcode: "4225", lat: -28.17, lng: 153.532, tier: 1.1, units: 0.75, r: 0.003, metro: "GC" },
  { name: "Noosa Heads", state: "QLD", postcode: "4567", lat: -26.398, lng: 153.085, tier: 1.9, units: 0.6, r: 0.005, metro: "GC" },
  { name: "Mooloolaba", state: "QLD", postcode: "4557", lat: -26.684, lng: 153.115, tier: 1.15, units: 0.7, r: 0.004, metro: "GC" },
  // Perth
  { name: "Perth", state: "WA", postcode: "6000", lat: -31.9523, lng: 115.8613, tier: 0.95, units: 0.97, r: 0.004, metro: "PER" },
  { name: "Subiaco", state: "WA", postcode: "6008", lat: -31.949, lng: 115.827, tier: 1.7, units: 0.4, metro: "PER" },
  { name: "Claremont", state: "WA", postcode: "6010", lat: -31.98, lng: 115.782, tier: 2.1, units: 0.35, metro: "PER" },
  { name: "Cottesloe", state: "WA", postcode: "6011", lat: -31.996, lng: 115.765, tier: 2.9, units: 0.35, r: 0.004, metro: "PER" },
  { name: "Fremantle", state: "WA", postcode: "6160", lat: -32.054, lng: 115.752, tier: 1.3, units: 0.5, r: 0.005, metro: "PER" },
  { name: "Scarborough", state: "WA", postcode: "6019", lat: -31.894, lng: 115.765, tier: 1.25, units: 0.45, r: 0.005, metro: "PER" },
  { name: "Mount Lawley", state: "WA", postcode: "6050", lat: -31.934, lng: 115.871, tier: 1.35, units: 0.4, metro: "PER" },
  { name: "Victoria Park", state: "WA", postcode: "6100", lat: -31.976, lng: 115.905, tier: 1.0, units: 0.45, metro: "PER" },
  { name: "Applecross", state: "WA", postcode: "6153", lat: -32.013, lng: 115.84, tier: 2.0, units: 0.35, r: 0.005, metro: "PER" },
  { name: "Joondalup", state: "WA", postcode: "6027", lat: -31.745, lng: 115.766, tier: 0.8, units: 0.35, metro: "PER" },
  // Adelaide
  { name: "Adelaide", state: "SA", postcode: "5000", lat: -34.9285, lng: 138.6007, tier: 0.95, units: 0.92, r: 0.005, metro: "ADL" },
  { name: "North Adelaide", state: "SA", postcode: "5006", lat: -34.907, lng: 138.593, tier: 1.9, units: 0.5, r: 0.005, metro: "ADL" },
  { name: "Norwood", state: "SA", postcode: "5067", lat: -34.921, lng: 138.632, tier: 1.5, units: 0.4, metro: "ADL" },
  { name: "Unley", state: "SA", postcode: "5061", lat: -34.95, lng: 138.607, tier: 1.65, units: 0.3, metro: "ADL" },
  { name: "Prospect", state: "SA", postcode: "5082", lat: -34.884, lng: 138.595, tier: 1.2, units: 0.3, metro: "ADL" },
  { name: "Glenelg", state: "SA", postcode: "5045", lat: -34.98, lng: 138.522, tier: 1.4, units: 0.6, r: 0.004, metro: "ADL" },
  { name: "Henley Beach", state: "SA", postcode: "5022", lat: -34.92, lng: 138.503, tier: 1.35, units: 0.35, r: 0.004, metro: "ADL" },
  // Hobart
  { name: "Hobart", state: "TAS", postcode: "7000", lat: -42.8821, lng: 147.3272, tier: 1.1, units: 0.75, r: 0.004, metro: "HBA" },
  { name: "Sandy Bay", state: "TAS", postcode: "7005", lat: -42.9, lng: 147.322, tier: 1.5, units: 0.45, r: 0.005, metro: "HBA" },
  { name: "Battery Point", state: "TAS", postcode: "7004", lat: -42.8895, lng: 147.329, tier: 1.8, units: 0.4, r: 0.002, metro: "HBA" },
  { name: "New Town", state: "TAS", postcode: "7008", lat: -42.858, lng: 147.308, tier: 1.15, units: 0.3, metro: "HBA" },
  // Canberra
  { name: "Canberra", state: "ACT", postcode: "2601", lat: -35.2809, lng: 149.13, tier: 0.9, units: 0.95, r: 0.004, metro: "CBR" },
  { name: "Braddon", state: "ACT", postcode: "2612", lat: -35.272, lng: 149.135, tier: 1.2, units: 0.85, r: 0.004, metro: "CBR" },
  { name: "Kingston", state: "ACT", postcode: "2604", lat: -35.314, lng: 149.143, tier: 1.15, units: 0.8, r: 0.004, metro: "CBR" },
  { name: "Belconnen", state: "ACT", postcode: "2617", lat: -35.238, lng: 149.066, tier: 0.85, units: 0.6, metro: "CBR" },
  { name: "Phillip", state: "ACT", postcode: "2606", lat: -35.345, lng: 149.088, tier: 0.9, units: 0.7, metro: "CBR" },
  { name: "Gungahlin", state: "ACT", postcode: "2912", lat: -35.184, lng: 149.133, tier: 0.85, units: 0.55, metro: "CBR" },
  // Darwin
  { name: "Darwin City", state: "NT", postcode: "0800", lat: -12.4634, lng: 130.8456, tier: 0.95, units: 0.95, r: 0.004, metro: "DRW" },
  { name: "Fannie Bay", state: "NT", postcode: "0820", lat: -12.425, lng: 130.84, tier: 1.4, units: 0.4, r: 0.004, metro: "DRW" },
  // Regional
  { name: "Newcastle", state: "NSW", postcode: "2300", lat: -32.9283, lng: 151.7717, tier: 1.0, units: 0.75, r: 0.004, metro: "REG" },
  { name: "Merewether", state: "NSW", postcode: "2291", lat: -32.945, lng: 151.748, tier: 1.5, units: 0.3, r: 0.004, metro: "REG" },
  { name: "Wollongong", state: "NSW", postcode: "2500", lat: -34.425, lng: 150.888, tier: 1.0, units: 0.55, r: 0.004, metro: "REG" },
  { name: "Byron Bay", state: "NSW", postcode: "2481", lat: -28.648, lng: 153.608, tier: 2.2, units: 0.35, r: 0.005, metro: "REG" },
];
