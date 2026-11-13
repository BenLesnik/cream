import "server-only";
import type { Listing, ListingType, SearchRequest, SearchResponse, LngLat } from "../types";
import { DEMO_SUBURBS, METROS, type DemoSuburb } from "./demo-suburbs";

const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=70`;

const MODERN_EXTERIOR = [
  "1600596542815-ffad4c1539a9", "1600585154340-be6161a56a0c", "1600566753190-17f0baa2a6c3",
  "1600047509807-ba8f99d2cdde", "1564013799919-ab600027ffc6", "1512917774080-9991f1c4c750",
  "1580587771525-78b9dba3b914", "1613490493576-7fde63acd811", "1613977257363-707ba9348227",
  "1602343168117-bb8ffe3e2e9f", "1599809275671-b5942cabc7a2", "1449844908441-8829872d2607",
  "1505843513577-22bb7d21e455", "1595526114035-0d45ed16cfbf", "1600047509358-9dc75507daeb",
];
const CHARACTER_EXTERIOR = [
  "1570129477492-45c003edd2be", "1568605114967-8130f3a36994", "1605276374104-dee2a0ed3cd6",
  "1583608205776-bfd35f0d9f83", "1576941089067-2de3c901e126", "1558036117-15d82a90b9b1",
  "1523217582562-09d0def993a6", "1598228723793-52759bba239c", "1572120360610-d971b9d7767c",
];
const LIVING = [
  "1600607687939-ce8a6c25118c", "1600210492486-724fe5c67fb0", "1600566753086-00f18fb6b3ea",
  "1600573472550-8090b5e0745e", "1502672260266-1c1ef2d93688", "1522708323590-d24dbb6b0267",
  "1493809842364-78817add7ffb", "1560185007-cde436f6a4d0", "1554995207-c18c203602cb",
  "1586023492125-27b2c045efd7", "1600121848594-d8644e57abab", "1617806118233-18e1de247200",
];
const KITCHEN = ["1556912173-3bb406ef7e77", "1560448204-e02f11c3d0e2"];
const BEDROOM = ["1600607687644-c7171b42498f", "1616594039964-ae9021a400a0", "1600563438938-a9a27216b4f5"];
const BATHROOM = ["1600566752355-35792bedcfea"];
const APARTMENT_COVER = [
  "1600585154526-990dced4db0d", "1484154218962-a197022b5858", "1502672260266-1c1ef2d93688",
  "1522708323590-d24dbb6b0267", "1600566753086-00f18fb6b3ea", "1600210492486-724fe5c67fb0",
  "1560185007-cde436f6a4d0", "1554995207-c18c203602cb",
];

const STREETS = [
  "Victoria St", "Albert St", "King St", "Queen St", "George St", "Elizabeth St", "Church St",
  "High St", "Park Rd", "Station St", "William St", "Wattle Ave", "Banksia Cres", "Jacaranda Ave",
  "Grevillea Way", "Waratah St", "Myrtle St", "Hill St", "Oxford St", "Railway Pde", "Beach Rd",
  "Ocean St", "Marine Pde", "Gordon St", "Macquarie St", "Wentworth St", "Nelson St", "Rose St",
  "Bay St", "Cliff St", "Ridge Rd", "Bellevue Rd", "Avoca St", "Ironbark Cl", "Lilly Pilly Ct",
  "Kurrajong Ave", "Melaleuca Dr", "Telopea St", "Boronia St", "Coral Tree Dr", "Flinders St",
  "Hampden Rd", "Darling St", "Union St", "Edward St", "Lawson St", "Brougham St", "Ashby Lane",
];

const AGENCIES = [
  { name: "Harbour & Co.", colour: "#0f3d3e" },
  { name: "Ashby Residential", colour: "#1c1917" },
  { name: "Coastline Property", colour: "#155e75" },
  { name: "Fenwick Estate Agents", colour: "#7c2d12" },
  { name: "Northgate Realty", colour: "#1e3a8a" },
  { name: "Ironbark Property", colour: "#3f3f46" },
  { name: "Laneway Agents", colour: "#9a3412" },
  { name: "Meridian Real Estate", colour: "#14532d" },
  { name: "Saltbush & Stone", colour: "#57534e" },
  { name: "Parkline Partners", colour: "#312e81" },
];
const FIRST = ["Olivia", "Jack", "Charlotte", "Noah", "Amelia", "Liam", "Isla", "Henry", "Mia", "Leo", "Grace", "Oscar", "Chloe", "Lachlan", "Sienna", "Hamish", "Priya", "Daniel", "Mei", "Tom", "Zara", "Marco", "Ella", "Arjun"];
const LAST = ["Nguyen", "Smith", "Williams", "Brown", "Taylor", "Wilson", "Chen", "Patel", "Kelly", "Murphy", "Rossi", "Campbell", "Walsh", "O'Connor", "Singh", "Thompson", "Edwards", "Morgan"];

const HOUSE_FEATURES = ["AirConditioning", "BuiltInWardrobes", "Ensuite", "Floorboards", "GardenCourtyard", "FullyFenced", "Heating", "Dishwasher", "Study", "InternalLaundry", "SwimmingPool", "SolarPanels", "Fireplace", "BalconyDeck", "NorthFacing", "WaterViews", "RainwaterStorageTank", "SolarHotWater", "PetsAllowed", "TennisCourt", "OutdoorSpa", "DoubleGlazedWindows"];
const UNIT_FEATURES = ["AirConditioning", "BuiltInWardrobes", "Ensuite", "BalconyDeck", "SecureParking", "Dishwasher", "InternalLaundry", "Gym", "CityViews", "WaterViews", "NorthFacing", "Heating", "Floorboards", "PetsAllowed", "Furnished", "Study", "DoubleGlazedWindows"];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;
const pick = <T,>(r: Rand, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];
const sample = <T,>(r: Rand, arr: readonly T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(r() * copy.length), 1)[0]);
  return out;
};
const gaussian = (r: Rand) => {
  let u = 0;
  let v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

function roundPrice(v: number, rent: boolean): number {
  if (rent) return Math.round(v / 10) * 10;
  if (v > 3_000_000) return Math.round(v / 50_000) * 50_000;
  if (v > 1_000_000) return Math.round(v / 25_000) * 25_000;
  return Math.round(v / 5_000) * 5_000;
}

const fmt = (n: number) => `$${n.toLocaleString("en-AU")}`;
const fmtShort = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}m` : `$${Math.round(n / 1000)}k`;

/** Snap a timestamp to a realistic Saturday/weekday open-home slot. */
function inspectionSlots(r: Rand, base: number): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const n = Math.floor(r() * 3);
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    const offset = i === 0 ? (6 - d.getDay() + 7) % 7 || 7 : Math.floor(r() * 10) + 1;
    d.setDate(d.getDate() + offset + i * 3);
    const hour = pick(r, [9, 10, 10, 11, 11, 12, 13, 14, 17]);
    const minute = pick(r, [0, 0, 15, 30, 45]);
    d.setHours(hour, minute);
    const e = new Date(d.getTime() + pick(r, [15, 20, 30, 30, 45]) * 60_000);
    slots.push({ start: d.toISOString(), end: e.toISOString() });
  }
  return slots.sort((a, b) => a.start.localeCompare(b.start));
}

const COUNTS: Record<ListingType, number> = { Sale: 24, Rent: 20, Sold: 30 };

/** Day bucket so results stay stable within a day but feel live across days. */
const dayBucket = () => Math.floor(Date.now() / 86_400_000);

function generateForSuburb(s: DemoSuburb, type: ListingType): Listing[] {
  const bucket = dayBucket();
  const r = rng(hash(`${s.name}|${s.postcode}|${type}|${Math.floor(bucket / 7)}`));
  const m = METROS[s.metro];
  const count = Math.round(COUNTS[type] * (0.7 + r() * 0.6));
  const radius = s.r ?? 0.007;
  const out: Listing[] = [];
  const now = bucket * 86_400_000;

  for (let i = 0; i < count; i++) {
    const isUnit = r() < s.units;
    const propertyType = isUnit
      ? pick(r, ["ApartmentUnitFlat", "ApartmentUnitFlat", "ApartmentUnitFlat", "Studio", "Penthouse"])
      : pick(r, ["House", "House", "House", "House", "Townhouse", "Townhouse", "Terrace", "SemiDetached", "Villa", "Duplex", "VacantLand"]);
    const isLand = propertyType === "VacantLand";
    const bedrooms = isLand
      ? 0
      : propertyType === "Studio"
        ? 0
        : isUnit
          ? Math.max(1, Math.min(4, Math.round(1.9 + gaussian(r) * 0.8 + (propertyType === "Penthouse" ? 1.2 : 0))))
          : Math.max(2, Math.min(6, Math.round(3.4 + gaussian(r) * 0.9)));
    const bathrooms = isLand ? 0 : Math.max(1, Math.min(bedrooms, Math.round(bedrooms * 0.55 + r() * 0.9)));
    const carspaces = isLand ? 0 : isUnit ? (r() < 0.25 ? 0 : r() < 0.85 ? 1 : 2) : Math.round(1 + r() * 1.6);
    const landArea = isUnit
      ? null
      : Math.round(
          (propertyType === "Terrace" ? 140 : propertyType === "Townhouse" ? 220 : isLand ? 600 : 520) *
            (0.6 + r() * 1.2) /
            Math.sqrt(s.tier),
        );
    const buildingArea = isUnit || isLand ? (isUnit ? Math.round(45 + bedrooms * 28 + r() * 30) : null) : Math.round(110 + bedrooms * 38 + r() * 80);

    const sizeFactor = isLand
      ? 0.55
      : isUnit
        ? 0.55 + bedrooms * 0.24 + (propertyType === "Penthouse" ? 0.9 : 0)
        : 0.6 + bedrooms * 0.13 + (landArea ? Math.min(0.5, landArea / 2000) : 0);
    const noise = Math.exp(gaussian(r) * 0.16);
    const isRent = type === "Rent";
    const base = isRent ? (isUnit ? m.unitRent : m.houseRent) : isUnit ? m.unit : m.house;
    const tierFactor = Math.pow(s.tier, isRent ? 0.55 : isUnit ? 0.7 : 1);
    const price = roundPrice(base * tierFactor * sizeFactor * noise * 0.85, isRent);

    const street = pick(r, STREETS);
    const num = 1 + Math.floor(r() * 180);
    const unitNo = isUnit ? `${1 + Math.floor(r() * 40)}/` : "";
    const ang = r() * Math.PI * 2;
    const dist = Math.sqrt(r()) * radius;
    const lat = s.lat + Math.sin(ang) * dist;
    const lng = s.lng + (Math.cos(ang) * dist) / Math.cos((s.lat * Math.PI) / 180);

    const features = sample(r, isUnit ? UNIT_FEATURES : HOUSE_FEATURES, isLand ? 0 : 3 + Math.floor(r() * 6));
    const cover = isUnit
      ? pick(r, APARTMENT_COVER)
      : pick(r, r() < 0.6 ? MODERN_EXTERIOR : CHARACTER_EXTERIOR);
    const gallery = isLand
      ? [pick(r, CHARACTER_EXTERIOR)]
      : [cover, ...sample(r, LIVING.filter((x) => x !== cover), 2), pick(r, KITCHEN), pick(r, BEDROOM), ...(r() < 0.6 ? BATHROOM : [])];

    const agency = pick(r, AGENCIES);
    const agentCount = r() < 0.4 ? 2 : 1;
    const agents = Array.from({ length: agentCount }, () => {
      const first = pick(r, FIRST);
      const last = pick(r, LAST);
      return {
        name: `${first} ${last}`,
        phone: `04${Math.floor(10 + r() * 89)} ${Math.floor(100 + r() * 899)} ${Math.floor(100 + r() * 899)}`,
        email: `${first.toLowerCase()}.${last.toLowerCase().replace(/'/g, "")}@example.com.au`,
      };
    });

    const listedDaysAgo = type === "Sold" ? 30 + Math.floor(r() * 120) : Math.floor(Math.pow(r(), 1.8) * 75);
    const dateListed = new Date(now - listedDaysAgo * 86_400_000).toISOString();
    const isAuction = type === "Sale" && !isLand && r() < (s.metro === "SYD" || s.metro === "MEL" ? 0.45 : 0.18);
    let auction: string | null = null;
    if (isAuction) {
      const d = new Date(now + (3 + Math.floor(r() * 30)) * 86_400_000);
      d.setHours(pick(r, [10, 11, 13, 14, 17, 18]), pick(r, [0, 30]));
      auction = d.toISOString();
    }
    const inspections = type === "Sold" ? [] : inspectionSlots(r, now);
    const underOffer = type === "Sale" && r() < 0.07;
    const priceStyle = r();
    let displayPrice: string;
    let shownPrice: number | null = price;
    if (type === "Rent") {
      displayPrice = `${fmt(price)} per week`;
    } else if (type === "Sold") {
      const withheld = r() < 0.12;
      displayPrice = withheld ? "Price withheld" : `Sold ${fmt(price)}`;
      if (withheld) shownPrice = null;
    } else if (isAuction) {
      displayPrice = priceStyle < 0.5 ? `Auction · Guide ${fmtShort(price)}` : "Auction";
      if (priceStyle >= 0.5) shownPrice = null;
    } else if (priceStyle < 0.35) {
      const lo = roundPrice(price * 0.95, false);
      const hi = roundPrice(price * 1.04, false);
      displayPrice = `${fmt(lo)} – ${fmt(hi)}`;
    } else if (priceStyle < 0.55) {
      displayPrice = `Offers over ${fmt(roundPrice(price * 0.96, false))}`;
    } else if (priceStyle < 0.62) {
      displayPrice = "Contact agent";
    } else if (priceStyle < 0.7) {
      displayPrice = `Expressions of interest`;
    } else {
      displayPrice = fmt(price);
    }
    const priceWithheld = /Contact agent|Expressions|withheld/.test(displayPrice);

    const soldDate = type === "Sold" ? new Date(now - Math.floor(r() * 180) * 86_400_000).toISOString() : null;
    const isNew = isUnit ? r() < 0.18 : r() < 0.08;
    const typeWord = isLand ? "land" : isUnit ? (propertyType === "Penthouse" ? "penthouse" : propertyType === "Studio" ? "studio" : "apartment") : propertyType === "Terrace" ? "terrace" : propertyType === "Townhouse" ? "townhouse" : "home";

    const headline = pick(r, isLand
      ? [`Build your dream on ${landArea}m² in ${s.name}`, `Rare level block in a blue-ribbon pocket`, `Elevated land with district outlook`]
      : [
          `Light-filled ${typeWord} moments from ${s.name} village`,
          `${bedrooms > 3 ? "Generous family" : "Effortless"} ${typeWord} with ${features.includes("NorthFacing") ? "north-facing" : "private"} living`,
          `Architect-designed ${typeWord} in a tightly held street`,
          `Renovated ${typeWord} with ${features.includes("SwimmingPool") ? "pool and" : ""} entertainer's deck`.replace("  ", " "),
          `${isNew ? "Brand new" : "Character-filled"} ${typeWord}, ready to move in`,
          `Quiet, leafy ${typeWord} close to cafés and transport`,
          features.includes("WaterViews") ? `Water views from a beautifully updated ${typeWord}` : `Calm, considered ${typeWord} with room to grow`,
        ]);

    const description = [
      `${headline}. Set on ${street.replace(/ (St|Rd|Ave|Pde|Cres|Way|Dr|Cl|Ct|Lane)$/, "")} in ${s.name}, this ${typeWord} pairs a practical floorplan with the kind of light you notice the moment you walk in.`,
      isLand
        ? `The block is level and cleared, with services available at the boundary and plenty of scope for a family residence (STCA).`
        : `Living and dining flow together${features.includes("BalconyDeck") ? " out to a sheltered balcony" : features.includes("GardenCourtyard") ? " out to a low-maintenance garden" : ""}, while the kitchen offers stone benchtops, gas cooking and generous storage. ${bedrooms > 0 ? `${bedrooms === 1 ? "The bedroom has" : `All ${bedrooms} bedrooms have`} built-in storage${features.includes("Ensuite") ? ", and the main includes an ensuite" : ""}.` : ""}`,
      `You're a short walk to local cafés, parks and schools, with public transport close by.`,
      type === "Rent" ? "Available now. Apply online after inspection; pets considered on application." : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const id = `demo-${hash(`${s.name}${s.postcode}${type}${i}`).toString(36)}`;
    out.push({
      id,
      listingType: type,
      headline,
      description,
      displayPrice,
      price: priceWithheld ? null : shownPrice,
      address: {
        display: `${unitNo}${num} ${street}, ${s.name} ${s.state} ${s.postcode}`,
        street: `${unitNo}${num} ${street}`,
        suburb: s.name,
        state: s.state,
        postcode: s.postcode,
      },
      lat,
      lng,
      propertyType,
      bedrooms,
      bathrooms,
      carspaces,
      landArea,
      buildingArea,
      features,
      images: gallery.map(IMG),
      hasFloorplan: !isLand && r() < 0.75,
      hasVideo: r() < 0.2,
      isNew,
      underOffer,
      labels: [...(underOffer ? ["Under offer"] : []), ...(isNew ? ["New"] : []), ...(listedDaysAgo < 3 && type !== "Sold" ? ["Just listed"] : [])],
      agency: { name: agency.name, colour: agency.colour },
      agents,
      inspections,
      auction,
      dateListed,
      soldDate,
      url: null,
    });
  }
  return out;
}

const suburbCache = new Map<string, Listing[]>();
function listingsFor(s: DemoSuburb, type: ListingType): Listing[] {
  const key = `${s.name}|${s.postcode}|${type}|${Math.floor(dayBucket() / 7)}`;
  let v = suburbCache.get(key);
  if (!v) {
    v = generateForSuburb(s, type);
    suburbCache.set(key, v);
    if (suburbCache.size > 2000) suburbCache.delete(suburbCache.keys().next().value!);
  }
  return v;
}

function pointInPolygon([x, y]: LngLat, poly: LngLat[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function demoById(id: string): Listing | null {
  for (const s of DEMO_SUBURBS) {
    for (const t of ["Sale", "Rent", "Sold"] as ListingType[]) {
      const hit = listingsFor(s, t).find((l) => l.id === id);
      if (hit) return hit;
    }
  }
  return null;
}

export function demoSearch(req: SearchRequest): SearchResponse {
  const { filters: f, bounds: b } = req;
  const pad = 0.02;
  const suburbs = DEMO_SUBURBS.filter(
    (s) => s.lat <= b.north + pad && s.lat >= b.south - pad && s.lng <= b.east + pad && s.lng >= b.west - pad,
  );
  const now = Date.now();
  const kw = f.keywords.trim().toLowerCase().split(/\s*,\s*|\s+/).filter(Boolean);

  let results = suburbs.flatMap((s) => listingsFor(s, f.listingType)).filter((l) => {
    if (l.lat > b.north || l.lat < b.south || l.lng > b.east || l.lng < b.west) return false;
    if (req.polygon?.length && !pointInPolygon([l.lng, l.lat], req.polygon)) return false;
    if (f.propertyTypes.length && !f.propertyTypes.includes(l.propertyType)) return false;
    if (f.minPrice != null && (l.price == null || l.price < f.minPrice)) return false;
    if (f.maxPrice != null && (l.price == null || l.price > f.maxPrice)) return false;
    if (f.minBeds != null && l.bedrooms < f.minBeds) return false;
    if (f.maxBeds != null && l.bedrooms > f.maxBeds) return false;
    if (f.minBaths != null && l.bathrooms < f.minBaths) return false;
    if (f.minCars != null && l.carspaces < f.minCars) return false;
    if (f.minLand != null && (l.landArea ?? 0) < f.minLand) return false;
    if (f.maxLand != null && (l.landArea ?? Infinity) > f.maxLand) return false;
    if (f.features.length && !f.features.every((x) => l.features.includes(x))) return false;
    if (f.established === "New" && !l.isNew) return false;
    if (f.established === "Established" && l.isNew) return false;
    if (f.excludeUnderOffer && l.underOffer) return false;
    if (f.excludePriceWithheld && l.price == null) return false;
    if (f.openHomesOnly && !l.inspections.some((i) => new Date(i.start).getTime() > now)) return false;
    if (f.auctionsOnly && !l.auction) return false;
    if (f.hasFloorplan && !l.hasFloorplan) return false;
    if (f.hasVideo && !l.hasVideo) return false;
    if (f.listedWithinDays && l.dateListed && now - new Date(l.dateListed).getTime() > f.listedWithinDays * 86_400_000) return false;
    if (kw.length) {
      const hay = `${l.headline} ${l.description} ${l.address.display} ${l.features.join(" ")}`.toLowerCase();
      if (!kw.every((k) => hay.includes(k))) return false;
    }
    return true;
  });

  const time = (s: string | null | undefined) => (s ? new Date(s).getTime() : Infinity);
  const sorters: Record<string, (a: Listing, b: Listing) => number> = {
    featured: (a, b) => hash(a.id) - hash(b.id),
    newest: (a, b) =>
      f.listingType === "Sold" ? time(b.soldDate) - time(a.soldDate) : time(b.dateListed) - time(a.dateListed),
    "price-asc": (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
    "price-desc": (a, b) => (b.price ?? -1) - (a.price ?? -1),
    inspection: (a, b) => time(a.inspections[0]?.start) - time(b.inspections[0]?.start),
    auction: (a, b) => time(a.auction) - time(b.auction),
    "beds-desc": (a, b) => b.bedrooms - a.bedrooms,
    "land-desc": (a, b) => (b.landArea ?? 0) - (a.landArea ?? 0),
  };
  results = results.sort(sorters[f.sort] ?? sorters.featured);

  const pageSize = Math.min(req.pageSize ?? 100, 200);
  const page = req.page ?? 1;
  return {
    listings: results.slice((page - 1) * pageSize, page * pageSize),
    total: results.length,
    page,
    pageSize,
    source: "demo",
  };
}
