import type { SearchFilters, SortKey } from "./types";

export const PROPERTY_TYPES: { value: string; label: string; group: string }[] = [
  { value: "House", label: "House", group: "Houses" },
  { value: "Townhouse", label: "Townhouse", group: "Houses" },
  { value: "Villa", label: "Villa", group: "Houses" },
  { value: "SemiDetached", label: "Semi-detached", group: "Houses" },
  { value: "Terrace", label: "Terrace", group: "Houses" },
  { value: "Duplex", label: "Duplex", group: "Houses" },
  { value: "ApartmentUnitFlat", label: "Apartment / Unit", group: "Apartments" },
  { value: "Studio", label: "Studio", group: "Apartments" },
  { value: "Penthouse", label: "Penthouse", group: "Apartments" },
  { value: "BlockOfUnits", label: "Block of units", group: "Apartments" },
  { value: "VacantLand", label: "Land", group: "Land & rural" },
  { value: "AcreageSemiRural", label: "Acreage", group: "Land & rural" },
  { value: "Rural", label: "Rural", group: "Land & rural" },
  { value: "Retirement", label: "Retirement living", group: "Other" },
];

export const PROPERTY_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPES.map((t) => [t.value, t.label]),
);

export const FEATURES: { value: string; label: string; group: string }[] = [
  { value: "SwimmingPool", label: "Pool", group: "Outdoor" },
  { value: "GardenCourtyard", label: "Garden / courtyard", group: "Outdoor" },
  { value: "BalconyDeck", label: "Balcony / deck", group: "Outdoor" },
  { value: "FullyFenced", label: "Fully fenced", group: "Outdoor" },
  { value: "TennisCourt", label: "Tennis court", group: "Outdoor" },
  { value: "OutdoorSpa", label: "Outdoor spa", group: "Outdoor" },
  { value: "SecureParking", label: "Secure parking", group: "Outdoor" },
  { value: "AirConditioning", label: "Air conditioning", group: "Indoor" },
  { value: "Heating", label: "Heating", group: "Indoor" },
  { value: "Ensuite", label: "Ensuite", group: "Indoor" },
  { value: "Study", label: "Study", group: "Indoor" },
  { value: "BuiltInWardrobes", label: "Built-in wardrobes", group: "Indoor" },
  { value: "Floorboards", label: "Floorboards", group: "Indoor" },
  { value: "Fireplace", label: "Fireplace", group: "Indoor" },
  { value: "Dishwasher", label: "Dishwasher", group: "Indoor" },
  { value: "InternalLaundry", label: "Internal laundry", group: "Indoor" },
  { value: "Gym", label: "Gym", group: "Indoor" },
  { value: "Furnished", label: "Furnished", group: "Indoor" },
  { value: "PetsAllowed", label: "Pets allowed", group: "Lifestyle" },
  { value: "WaterViews", label: "Water views", group: "Lifestyle" },
  { value: "CityViews", label: "City views", group: "Lifestyle" },
  { value: "NorthFacing", label: "North facing", group: "Lifestyle" },
  { value: "SolarPanels", label: "Solar panels", group: "Eco" },
  { value: "SolarHotWater", label: "Solar hot water", group: "Eco" },
  { value: "RainwaterStorageTank", label: "Water tank", group: "Eco" },
  { value: "DoubleGlazedWindows", label: "Double glazing", group: "Eco" },
];

export const FEATURE_LABEL: Record<string, string> = Object.fromEntries(
  FEATURES.map((f) => [f.value, f.label]),
);

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price (low to high)" },
  { value: "price-desc", label: "Price (high to low)" },
  { value: "inspection", label: "Next open home" },
  { value: "auction", label: "Auction date" },
  { value: "beds-desc", label: "Most bedrooms" },
  { value: "land-desc", label: "Largest land" },
];

export const SALE_PRICE_STEPS = [
  50_000, 100_000, 200_000, 300_000, 400_000, 500_000, 600_000, 700_000, 800_000,
  900_000, 1_000_000, 1_250_000, 1_500_000, 1_750_000, 2_000_000, 2_500_000, 3_000_000,
  4_000_000, 5_000_000, 7_500_000, 10_000_000, 15_000_000,
];

export const RENT_PRICE_STEPS = [
  150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 700, 800, 900, 1000, 1250, 1500, 2000,
  2500, 3000, 5000,
];

export const LAND_STEPS = [100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 4000, 10000, 40000, 100000];

export const DEFAULT_FILTERS: SearchFilters = {
  listingType: "Sale",
  propertyTypes: [],
  minPrice: null,
  maxPrice: null,
  minBeds: null,
  maxBeds: null,
  minBaths: null,
  minCars: null,
  minLand: null,
  maxLand: null,
  features: [],
  keywords: "",
  established: "Any",
  excludeUnderOffer: false,
  excludePriceWithheld: false,
  openHomesOnly: false,
  auctionsOnly: false,
  hasFloorplan: false,
  hasVideo: false,
  listedWithinDays: null,
  sort: "featured",
};

export type MapStyleId = "positron" | "voyager" | "liberty" | "dark" | "satellite";

export const MAP_STYLES: { id: MapStyleId; label: string; description: string; dark: boolean }[] = [
  { id: "positron", label: "Light", description: "Quiet base that lets pins lead", dark: false },
  { id: "voyager", label: "Streets", description: "Colour roads, parks and water", dark: false },
  { id: "liberty", label: "Detailed", description: "3D buildings when tilted", dark: false },
  { id: "dark", label: "Dark", description: "Low glare for night browsing", dark: true },
  { id: "satellite", label: "Satellite", description: "Aerial imagery with labels", dark: true },
];

export const ACCENTS: { id: string; label: string; value: string; ink: string }[] = [
  { id: "eucalypt", label: "Eucalypt", value: "#1f6f5c", ink: "#ffffff" },
  { id: "harbour", label: "Harbour", value: "#1d4ed8", ink: "#ffffff" },
  { id: "terracotta", label: "Terracotta", value: "#c2410c", ink: "#ffffff" },
  { id: "wattle", label: "Wattle", value: "#ca8a04", ink: "#1c1917" },
  { id: "jacaranda", label: "Jacaranda", value: "#6d28d9", ink: "#ffffff" },
  { id: "ink", label: "Ink", value: "#1c1917", ink: "#ffffff" },
];

export const AUSTRALIA_BOUNDS: [number, number, number, number] = [112.5, -44.5, 154.5, -9.5];

export const DEFAULT_VIEW = { lng: 151.2093, lat: -33.8688, zoom: 12.2 };
