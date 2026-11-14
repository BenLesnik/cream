"use client";

import { create } from "zustand";
import { DEFAULT_FILTERS } from "@/lib/constants";
import type { Bounds, Listing, LngLat, SearchFilters } from "@/lib/types";

export interface CameraTarget {
  lat: number;
  lng: number;
  zoom?: number;
  bbox?: [number, number, number, number];
  nonce: number;
}

export interface View {
  lat: number;
  lng: number;
  zoom: number;
}

interface SearchStore {
  filters: SearchFilters;
  bounds: Bounds | null;
  view: View | null;
  /** Bounds the map has moved to but not yet searched (search-as-move off). */
  pendingBounds: Bounds | null;
  polygon: LngLat[] | null;
  drawing: boolean;
  locationLabel: string | null;
  camera: CameraTarget | null;

  results: Listing[];
  total: number;
  page: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  warning: string | null;
  source: "domain" | "demo" | null;

  hoveredId: string | null;
  selectedId: string | null;
  previewId: string | null;

  setFilters: (patch: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setBounds: (b: Bounds, view: View, commit: boolean) => void;
  commitPending: () => void;
  setPolygon: (p: LngLat[] | null) => void;
  setDrawing: (d: boolean) => void;
  flyTo: (t: Omit<CameraTarget, "nonce">, label?: string | null) => void;
  setLocationLabel: (l: string | null) => void;
  setHovered: (id: string | null) => void;
  select: (id: string | null) => void;
  preview: (id: string | null) => void;
}

export const useSearch = create<SearchStore>()((set) => ({
  filters: DEFAULT_FILTERS,
  bounds: null,
  view: null,
  pendingBounds: null,
  polygon: null,
  drawing: false,
  locationLabel: null,
  camera: null,

  results: [],
  total: 0,
  page: 1,
  loading: true,
  loadingMore: false,
  error: null,
  warning: null,
  source: null,

  hoveredId: null,
  selectedId: null,
  previewId: null,

  setFilters: (patch) =>
    set((s) => {
      const next = { ...s.filters, ...patch };
      if (patch.listingType && patch.listingType !== s.filters.listingType) {
        next.minPrice = null;
        next.maxPrice = null;
        if (patch.listingType === "Sold" && (next.sort === "inspection" || next.sort === "auction")) {
          next.sort = "newest";
        }
      }
      return { filters: next };
    }),
  resetFilters: () => set((s) => ({ filters: { ...DEFAULT_FILTERS, listingType: s.filters.listingType } })),
  setBounds: (b, view, commit) =>
    set(commit ? { bounds: b, view, pendingBounds: null } : { pendingBounds: b, view }),
  commitPending: () => set((s) => (s.pendingBounds ? { bounds: s.pendingBounds, pendingBounds: null } : s)),
  setPolygon: (polygon) => set({ polygon, drawing: false }),
  setDrawing: (drawing) => set({ drawing }),
  flyTo: (t, label) =>
    set((s) => ({
      camera: { ...t, nonce: (s.camera?.nonce ?? 0) + 1 },
      polygon: null,
      locationLabel: label === undefined ? s.locationLabel : label,
    })),
  setLocationLabel: (locationLabel) => set({ locationLabel }),
  setHovered: (hoveredId) => set({ hoveredId }),
  select: (selectedId) => set({ selectedId, previewId: null }),
  preview: (previewId) => set({ previewId }),
}));
