import "server-only";
import type { Listing, ListingType, SearchRequest, SearchResponse, SortKey } from "../types";

const API_BASE = process.env.DOMAIN_API_BASE ?? "https://api.domain.com.au";
const AUTH_URL = "https://auth.domain.com.au/v1/connect/token";

export function domainConfigured(): boolean {
  return Boolean(
    process.env.DOMAIN_API_KEY || (process.env.DOMAIN_CLIENT_ID && process.env.DOMAIN_CLIENT_SECRET),
  );
}

let tokenCache: { token: string; expires: number } | null = null;

async function authHeaders(): Promise<Record<string, string>> {
  if (process.env.DOMAIN_CLIENT_ID && process.env.DOMAIN_CLIENT_SECRET) {
    if (!tokenCache || tokenCache.expires < Date.now() + 30_000) {
      const basic = Buffer.from(
        `${process.env.DOMAIN_CLIENT_ID}:${process.env.DOMAIN_CLIENT_SECRET}`,
      ).toString("base64");
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          scope: process.env.DOMAIN_SCOPES ?? "api_listings_read",
        }),
        cache: "no-store",
      });
      if (!res.ok) throw new DomainError(`Domain auth failed (${res.status})`, res.status);
      const json = (await res.json()) as { access_token: string; expires_in: number };
      tokenCache = { token: json.access_token, expires: Date.now() + json.expires_in * 1000 };
    }
    return { Authorization: `Bearer ${tokenCache.token}` };
  }
  return { "X-Api-Key": process.env.DOMAIN_API_KEY ?? "" };
}

export class DomainError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const SORT_MAP: Record<SortKey, { sortKey: string; direction: "Ascending" | "Descending" }> = {
  featured: { sortKey: "Default", direction: "Descending" },
  newest: { sortKey: "DateListed", direction: "Descending" },
  "price-asc": { sortKey: "Price", direction: "Ascending" },
  "price-desc": { sortKey: "Price", direction: "Descending" },
  inspection: { sortKey: "InspectionTime", direction: "Ascending" },
  auction: { sortKey: "AuctionTime", direction: "Ascending" },
  "beds-desc": { sortKey: "Default", direction: "Descending" },
  "land-desc": { sortKey: "Default", direction: "Descending" },
};

function buildBody(req: SearchRequest) {
  const f = req.filters;
  const { north, south, east, west } = req.bounds;
  const sort = req.filters.listingType === "Sold" && f.sort === "newest"
    ? { sortKey: "SoldDate", direction: "Descending" as const }
    : SORT_MAP[f.sort];

  const listingAttributes: string[] = [];
  if (f.hasFloorplan) listingAttributes.push("HasFloorplan");
  if (f.hasVideo) listingAttributes.push("HasVideo");

  const body: Record<string, unknown> = {
    listingType: f.listingType,
    propertyTypes: f.propertyTypes.length ? f.propertyTypes : undefined,
    propertyFeatures: f.features.length ? f.features : undefined,
    listingAttributes: listingAttributes.length ? listingAttributes : undefined,
    propertyEstablishedType: f.established,
    minBedrooms: f.minBeds ?? undefined,
    maxBedrooms: f.maxBeds ?? undefined,
    minBathrooms: f.minBaths ?? undefined,
    minCarspaces: f.minCars ?? undefined,
    minPrice: f.minPrice ?? undefined,
    maxPrice: f.maxPrice ?? undefined,
    minLandArea: f.minLand ?? undefined,
    maxLandArea: f.maxLand ?? undefined,
    keywords: f.keywords.trim() ? f.keywords.trim().split(/\s*,\s*|\s+/).filter(Boolean) : undefined,
    excludePriceWithheld: f.excludePriceWithheld || undefined,
    excludeDepositTaken: f.excludeUnderOffer || undefined,
    listedSince: f.listedWithinDays
      ? new Date(Date.now() - f.listedWithinDays * 86_400_000).toISOString()
      : undefined,
    sort: {
      ...sort,
      proximityTo: req.center ? { lat: req.center.lat, lon: req.center.lng } : undefined,
    },
    pageNumber: req.page ?? 1,
    pageSize: Math.min(req.pageSize ?? 100, 100),
    geoWindow: req.polygon?.length
      ? { polygon: { points: req.polygon.map(([lng, lat]) => ({ lat, lon: lng })) } }
      : {
          box: {
            topLeft: { lat: north, lon: west },
            bottomRight: { lat: south, lon: east },
          },
        },
  };

  if (f.openHomesOnly) {
    body.inspectionFrom = new Date().toISOString();
    body.inspectionTo = new Date(Date.now() + 14 * 86_400_000).toISOString();
  }
  if (f.auctionsOnly) {
    body.auctionFrom = new Date().toISOString();
    body.auctionTo = new Date(Date.now() + 90 * 86_400_000).toISOString();
  }
  return JSON.parse(JSON.stringify(body));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parsePriceNumber(display: string | undefined): number | null {
  if (!display) return null;
  const m = display.replace(/,/g, "").match(/\$\s?(\d+(?:\.\d+)?)\s*(m|mil|million|k)?/i);
  if (!m) return null;
  let v = parseFloat(m[1]);
  const unit = m[2]?.toLowerCase();
  if (unit?.startsWith("m")) v *= 1_000_000;
  else if (unit === "k") v *= 1000;
  return v;
}

function plainText(html: string | undefined): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;/g, "’")
    .replace(/&quot;/g, '"')
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function titleCase(s: string | undefined): string {
  if (!s) return "";
  return s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : s;
}

export function normaliseListing(raw: any, fallbackType: ListingType): Listing | null {
  const pd = raw.propertyDetails ?? {};
  const addr = raw.addressParts ?? {};
  const lat = pd.latitude ?? raw.geoLocation?.latitude;
  const lng = pd.longitude ?? raw.geoLocation?.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const priceDetails = raw.priceDetails ?? {};
  const display: string =
    priceDetails.displayPrice ?? raw.saleDetails?.soldDetails?.soldPrice?.toString?.() ?? "Contact agent";
  const soldPrice = raw.saleDetails?.soldDetails?.soldPrice;
  const price =
    priceDetails.price ??
    soldPrice ??
    (priceDetails.priceFrom && priceDetails.priceTo
      ? (priceDetails.priceFrom + priceDetails.priceTo) / 2
      : priceDetails.priceFrom ?? parsePriceNumber(display));

  const media: any[] = raw.media ?? [];
  const images = media
    .filter((m) => (m.category ?? m.type ?? "").toLowerCase() === "image" || /\.(jpe?g|png|webp)/i.test(m.url ?? ""))
    .map((m) => m.url as string);

  const advertiser = raw.advertiser ?? raw.advertiserIdentifiers ?? {};
  const contacts: any[] = advertiser.contacts ?? raw.advertiser?.contacts ?? [];
  const inspections: any[] = raw.inspectionSchedule?.times ?? raw.inspectionDetails?.inspections ?? [];
  const labels: string[] = raw.labels ?? [];
  const listingType: ListingType = raw.listingType === "Rent" ? "Rent" : raw.listingType === "Sold" ? "Sold" : fallbackType;

  const street = [pd.unitNumber && `${pd.unitNumber}/`, pd.streetNumber, pd.street]
    .filter(Boolean)
    .join(" ")
    .replace("/ ", "/");

  return {
    id: String(raw.id),
    listingType,
    headline: plainText(raw.headline),
    description: plainText(raw.description ?? raw.summaryDescription),
    displayPrice: display,
    price: typeof price === "number" && price > 0 ? price : null,
    priceFrom: priceDetails.priceFrom ?? null,
    priceTo: priceDetails.priceTo ?? null,
    address: {
      display: pd.displayableAddress ?? addr.displayAddress ?? street,
      street: street || pd.displayableAddress?.split(",")[0] || "",
      suburb: titleCase(pd.suburb ?? addr.suburb),
      state: pd.state ?? addr.stateAbbreviation?.toUpperCase?.() ?? "",
      postcode: pd.postcode ?? addr.postcode ?? "",
    },
    lat,
    lng,
    propertyType: pd.propertyType ?? raw.propertyTypes?.[0] ?? "House",
    bedrooms: pd.bedrooms ?? raw.bedrooms ?? 0,
    bathrooms: pd.bathrooms ?? raw.bathrooms ?? 0,
    carspaces: pd.carspaces ?? raw.carspaces ?? 0,
    landArea: pd.landArea ?? raw.landAreaSqm ?? null,
    buildingArea: pd.buildingArea ?? raw.buildingAreaSqm ?? null,
    features: pd.features ?? raw.features ?? [],
    images,
    hasFloorplan: Boolean(raw.hasFloorplan),
    hasVideo: Boolean(raw.hasVideo),
    isNew: Boolean(pd.isNew ?? raw.isNewDevelopment),
    underOffer: labels.some((l) => /offer|deposit/i.test(l)) || raw.status === "underOffer",
    labels,
    agency: {
      id: advertiser.id ? String(advertiser.id) : undefined,
      name: advertiser.name ?? "Agency",
      logo: advertiser.logoUrl,
      colour: advertiser.preferredColourHex,
    },
    agents: contacts.map((c) => ({
      name: c.name ?? [c.firstName, c.lastName].filter(Boolean).join(" "),
      photo: c.photoUrl,
      phone: c.phoneNumbers?.[0]?.number ?? c.phone,
      email: c.email,
    })),
    inspections: inspections
      .map((t) => ({ start: t.openingTime ?? t.openingDateTime, end: t.closingTime ?? t.closingDateTime }))
      .filter((t) => t.start),
    auction: raw.auctionSchedule?.time ?? raw.saleDetails?.auctionDetails?.auctionSchedule?.openingDateTime ?? null,
    dateListed: raw.dateListed ?? null,
    soldDate: raw.saleDetails?.soldDetails?.soldDate ?? raw.soldData?.soldDate ?? null,
    url: raw.listingSlug ? `https://www.domain.com.au/${raw.listingSlug}` : raw.seoUrl ?? null,
  };
}

export async function domainSearch(req: SearchRequest): Promise<SearchResponse> {
  const body = buildBody(req);
  const res = await fetch(`${API_BASE}/v1/listings/residential/_search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new DomainError(`Domain search failed (${res.status}) ${text.slice(0, 200)}`, res.status);
  }
  const items = (await res.json()) as any[];
  const listings: Listing[] = [];
  for (const item of items) {
    if (item.type === "Project" && Array.isArray(item.listings)) {
      for (const l of item.listings) {
        const n = normaliseListing(l, req.filters.listingType);
        if (n) listings.push({ ...n, isNew: true });
      }
    } else {
      const n = normaliseListing(item.listing ?? item, req.filters.listingType);
      if (n) listings.push(n);
    }
  }
  const total = Number(res.headers.get("X-Total-Count") ?? listings.length);
  return {
    listings,
    total: Number.isFinite(total) ? total : listings.length,
    page: req.page ?? 1,
    pageSize: body.pageSize,
    source: "domain",
  };
}

export async function domainListing(id: string): Promise<Listing | null> {
  const res = await fetch(`${API_BASE}/v1/listings/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json", ...(await authHeaders()) },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new DomainError(`Domain listing failed (${res.status})`, res.status);
  const raw = await res.json();
  const type: ListingType =
    raw.objective === "rent" || raw.channel === "rent" ? "Rent" : raw.status === "sold" || raw.saleDetails?.soldDetails ? "Sold" : "Sale";
  const fixed = {
    ...raw,
    listingType: type,
    propertyDetails: raw.propertyDetails ?? {
      latitude: raw.geoLocation?.latitude,
      longitude: raw.geoLocation?.longitude,
      displayableAddress: raw.addressParts?.displayAddress,
      suburb: raw.addressParts?.suburb,
      state: raw.addressParts?.stateAbbreviation?.toUpperCase(),
      postcode: raw.addressParts?.postcode,
      streetNumber: raw.addressParts?.streetNumber,
      street: raw.addressParts?.street,
      unitNumber: raw.addressParts?.unitNumber,
      propertyType: raw.propertyTypes?.[0],
    },
    priceDetails: raw.priceDetails ?? { displayPrice: raw.priceDetails?.displayPrice },
  };
  return normaliseListing(fixed, type);
}
