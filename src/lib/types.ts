export type ListingType = "Sale" | "Rent" | "Sold";

export type SortKey =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "inspection"
  | "auction"
  | "beds-desc"
  | "land-desc";

export type EstablishedType = "Any" | "New" | "Established";

export interface SearchFilters {
  listingType: ListingType;
  propertyTypes: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minBeds: number | null;
  maxBeds: number | null;
  minBaths: number | null;
  minCars: number | null;
  minLand: number | null;
  maxLand: number | null;
  features: string[];
  keywords: string;
  established: EstablishedType;
  excludeUnderOffer: boolean;
  excludePriceWithheld: boolean;
  openHomesOnly: boolean;
  auctionsOnly: boolean;
  hasFloorplan: boolean;
  hasVideo: boolean;
  listedWithinDays: number | null;
  sort: SortKey;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export type LngLat = [number, number];

export interface SearchRequest {
  filters: SearchFilters;
  bounds: Bounds;
  polygon?: LngLat[] | null;
  center?: { lat: number; lng: number };
  page?: number;
  pageSize?: number;
}

export interface Agent {
  name: string;
  photo?: string;
  phone?: string;
  email?: string;
}

export interface Agency {
  id?: string;
  name: string;
  logo?: string;
  colour?: string;
}

export interface TimeSlot {
  start: string;
  end?: string;
}

export interface Listing {
  id: string;
  listingType: ListingType;
  headline: string;
  description: string;
  displayPrice: string;
  price: number | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  address: {
    display: string;
    street: string;
    suburb: string;
    state: string;
    postcode: string;
  };
  lat: number;
  lng: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  carspaces: number;
  landArea: number | null;
  buildingArea: number | null;
  features: string[];
  images: string[];
  hasFloorplan: boolean;
  hasVideo: boolean;
  isNew: boolean;
  underOffer: boolean;
  labels: string[];
  agency: Agency;
  agents: Agent[];
  inspections: TimeSlot[];
  auction: string | null;
  dateListed: string | null;
  soldDate: string | null;
  url: string | null;
}

export interface SearchResponse {
  listings: Listing[];
  total: number;
  page: number;
  pageSize: number;
  source: "domain" | "demo";
  warning?: string;
}

export interface GeocodeResult {
  id: string;
  name: string;
  context: string;
  kind: "suburb" | "city" | "region" | "postcode" | "street" | "place";
  lat: number;
  lng: number;
  bbox?: [number, number, number, number];
}
