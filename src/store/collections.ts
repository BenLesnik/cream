"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Listing, LngLat, SearchFilters } from "@/lib/types";

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  view: { lat: number; lng: number; zoom: number };
  polygon: LngLat[] | null;
  locationLabel: string | null;
  createdAt: string;
  lastCount?: number;
}

interface CollectionsStore {
  shortlist: Record<string, Listing & { savedAt: string; note?: string }>;
  hidden: string[];
  viewed: string[];
  compare: string[];
  compareCache: Record<string, Listing>;
  saved: SavedSearch[];
  toggleShortlist: (listing: Listing) => void;
  setNote: (id: string, note: string) => void;
  hide: (id: string) => void;
  unhide: (id: string) => void;
  clearHidden: () => void;
  markViewed: (id: string) => void;
  toggleCompare: (listing: Listing) => void;
  clearCompare: () => void;
  saveSearch: (s: Omit<SavedSearch, "id" | "createdAt">) => void;
  removeSearch: (id: string) => void;
  renameSearch: (id: string, name: string) => void;
}

export const MAX_COMPARE = 4;

export const useCollections = create<CollectionsStore>()(
  persist(
    (set) => ({
      shortlist: {},
      hidden: [],
      viewed: [],
      compare: [],
      compareCache: {},
      saved: [],
      toggleShortlist: (listing) =>
        set((s) => {
          const next = { ...s.shortlist };
          if (next[listing.id]) delete next[listing.id];
          else next[listing.id] = { ...listing, savedAt: new Date().toISOString() };
          return { shortlist: next };
        }),
      setNote: (id, note) =>
        set((s) => (s.shortlist[id] ? { shortlist: { ...s.shortlist, [id]: { ...s.shortlist[id], note } } } : s)),
      hide: (id) => set((s) => ({ hidden: s.hidden.includes(id) ? s.hidden : [...s.hidden, id] })),
      unhide: (id) => set((s) => ({ hidden: s.hidden.filter((x) => x !== id) })),
      clearHidden: () => set({ hidden: [] }),
      markViewed: (id) =>
        set((s) => (s.viewed.includes(id) ? s : { viewed: [...s.viewed.slice(-499), id] })),
      toggleCompare: (listing) =>
        set((s) => {
          if (s.compare.includes(listing.id)) {
            return { compare: s.compare.filter((x) => x !== listing.id) };
          }
          if (s.compare.length >= MAX_COMPARE) return s;
          return {
            compare: [...s.compare, listing.id],
            compareCache: { ...s.compareCache, [listing.id]: listing },
          };
        }),
      clearCompare: () => set({ compare: [], compareCache: {} }),
      saveSearch: (search) =>
        set((s) => ({
          saved: [
            { ...search, id: Math.random().toString(36).slice(2, 10), createdAt: new Date().toISOString() },
            ...s.saved,
          ].slice(0, 30),
        })),
      removeSearch: (id) => set((s) => ({ saved: s.saved.filter((x) => x.id !== id) })),
      renameSearch: (id, name) =>
        set((s) => ({ saved: s.saved.map((x) => (x.id === id ? { ...x, name } : x)) })),
    }),
    { name: "kerb.collections", version: 1 },
  ),
);
