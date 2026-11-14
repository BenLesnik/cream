"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MapStyleId } from "@/lib/constants";
import type { AreaUnit, PriceFormat } from "@/lib/format";

export type Theme = "light" | "dark" | "system";
export type PinMode = "price" | "beds" | "dot";
export type HeatmapMode = "off" | "density" | "price";
export type Layout = "split" | "map" | "list";
export type CardStyle = "list" | "grid";
export type Density = "comfortable" | "compact";

export interface Settings {
  theme: Theme;
  accent: string;
  mapStyle: MapStyleId;
  pinMode: PinMode;
  cluster: boolean;
  heatmap: HeatmapMode;
  tilt: boolean;
  layout: Layout;
  cardStyle: CardStyle;
  density: Density;
  priceFormat: PriceFormat;
  areaUnit: AreaUnit;
  panelSide: "left" | "right";
  panelWidth: number;
  searchAsMove: boolean;
  dimViewed: boolean;
  showSnapshot: boolean;
  showSuburbOnCards: boolean;
  autoplayGallery: boolean;
  depositPct: number;
  interestRate: number;
  loanTerm: number;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  accent: "eucalypt",
  mapStyle: "positron",
  pinMode: "price",
  cluster: true,
  heatmap: "off",
  tilt: false,
  layout: "split",
  cardStyle: "list",
  density: "comfortable",
  priceFormat: "compact",
  areaUnit: "sqm",
  panelSide: "left",
  panelWidth: 520,
  searchAsMove: true,
  dimViewed: true,
  showSnapshot: true,
  showSuburbOnCards: true,
  autoplayGallery: false,
  depositPct: 20,
  interestRate: 6.1,
  loanTerm: 30,
};

interface SettingsStore extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (key, value) => set({ [key]: value } as Partial<Settings>),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    { name: "kerb.settings", version: 1 },
  ),
);
