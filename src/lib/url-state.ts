import { DEFAULT_FILTERS, DEFAULT_VIEW } from "./constants";
import type { EstablishedType, ListingType, LngLat, SearchFilters, SortKey } from "./types";

export interface UrlState {
  filters: SearchFilters;
  view: { lat: number; lng: number; zoom: number };
  polygon: LngLat[] | null;
  label: string | null;
  listing: string | null;
}

const TYPE_TO_PATH: Record<ListingType, string> = { Sale: "buy", Rent: "rent", Sold: "sold" };
const PATH_TO_TYPE: Record<string, ListingType> = { buy: "Sale", rent: "Rent", sold: "Sold" };

const num = (v: string | null) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

export function parseUrl(search: string): UrlState {
  const p = new URLSearchParams(search);
  const filters: SearchFilters = {
    ...DEFAULT_FILTERS,
    listingType: PATH_TO_TYPE[p.get("mode") ?? ""] ?? "Sale",
    propertyTypes: list(p.get("types")),
    minPrice: num(p.get("pmin")),
    maxPrice: num(p.get("pmax")),
    minBeds: num(p.get("bmin")),
    maxBeds: num(p.get("bmax")),
    minBaths: num(p.get("baths")),
    minCars: num(p.get("cars")),
    minLand: num(p.get("lmin")),
    maxLand: num(p.get("lmax")),
    features: list(p.get("features")),
    keywords: p.get("kw") ?? "",
    established: (["Any", "New", "Established"].includes(p.get("est") ?? "") ? p.get("est") : "Any") as EstablishedType,
    excludeUnderOffer: p.get("xuo") === "1",
    excludePriceWithheld: p.get("xpw") === "1",
    openHomesOnly: p.get("open") === "1",
    auctionsOnly: p.get("auction") === "1",
    hasFloorplan: p.get("plan") === "1",
    hasVideo: p.get("video") === "1",
    listedWithinDays: num(p.get("days")),
    sort: (p.get("sort") as SortKey) ?? DEFAULT_FILTERS.sort,
  };
  const lat = num(p.get("lat"));
  const lng = num(p.get("lng"));
  const zoom = num(p.get("z"));
  let polygon: LngLat[] | null = null;
  const poly = p.get("area");
  if (poly) {
    const pts = poly.split(";").map((pair) => pair.split(",").map(Number) as LngLat);
    if (pts.length >= 3 && pts.every((pt) => pt.length === 2 && pt.every(Number.isFinite))) polygon = pts;
  }
  return {
    filters,
    view: lat != null && lng != null ? { lat, lng, zoom: zoom ?? 13 } : DEFAULT_VIEW,
    polygon,
    label: p.get("where"),
    listing: p.get("listing"),
  };
}

export function buildUrl(s: UrlState): string {
  const p = new URLSearchParams();
  const f = s.filters;
  const d = DEFAULT_FILTERS;
  p.set("mode", TYPE_TO_PATH[f.listingType]);
  if (s.label) p.set("where", s.label);
  if (f.propertyTypes.length) p.set("types", f.propertyTypes.join(","));
  if (f.minPrice != null) p.set("pmin", String(f.minPrice));
  if (f.maxPrice != null) p.set("pmax", String(f.maxPrice));
  if (f.minBeds != null) p.set("bmin", String(f.minBeds));
  if (f.maxBeds != null) p.set("bmax", String(f.maxBeds));
  if (f.minBaths != null) p.set("baths", String(f.minBaths));
  if (f.minCars != null) p.set("cars", String(f.minCars));
  if (f.minLand != null) p.set("lmin", String(f.minLand));
  if (f.maxLand != null) p.set("lmax", String(f.maxLand));
  if (f.features.length) p.set("features", f.features.join(","));
  if (f.keywords.trim()) p.set("kw", f.keywords.trim());
  if (f.established !== d.established) p.set("est", f.established);
  if (f.excludeUnderOffer) p.set("xuo", "1");
  if (f.excludePriceWithheld) p.set("xpw", "1");
  if (f.openHomesOnly) p.set("open", "1");
  if (f.auctionsOnly) p.set("auction", "1");
  if (f.hasFloorplan) p.set("plan", "1");
  if (f.hasVideo) p.set("video", "1");
  if (f.listedWithinDays) p.set("days", String(f.listedWithinDays));
  if (f.sort !== d.sort) p.set("sort", f.sort);
  p.set("lat", s.view.lat.toFixed(5));
  p.set("lng", s.view.lng.toFixed(5));
  p.set("z", s.view.zoom.toFixed(2));
  if (s.polygon?.length) p.set("area", s.polygon.map(([x, y]) => `${x.toFixed(5)},${y.toFixed(5)}`).join(";"));
  if (s.listing) p.set("listing", s.listing);
  return `?${p.toString()}`;
}

export function countActiveFilters(f: SearchFilters): number {
  let n = 0;
  if (f.propertyTypes.length) n++;
  if (f.minPrice != null || f.maxPrice != null) n++;
  if (f.minBeds != null || f.maxBeds != null) n++;
  if (f.minBaths != null) n++;
  if (f.minCars != null) n++;
  if (f.minLand != null || f.maxLand != null) n++;
  n += f.features.length;
  if (f.keywords.trim()) n++;
  if (f.established !== "Any") n++;
  if (f.excludeUnderOffer) n++;
  if (f.excludePriceWithheld) n++;
  if (f.openHomesOnly) n++;
  if (f.auctionsOnly) n++;
  if (f.hasFloorplan) n++;
  if (f.hasVideo) n++;
  if (f.listedWithinDays) n++;
  return n;
}
