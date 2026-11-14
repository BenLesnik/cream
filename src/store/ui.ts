"use client";

import { create } from "zustand";

type Panel = "settings" | "collections" | "filters" | "compare" | "save" | "shortcuts" | null;

interface UiStore {
  panel: Panel;
  collectionsTab: "shortlist" | "searches" | "hidden";
  mobileView: "list" | "map";
  toast: { id: number; message: string } | null;
  open: (p: Panel, tab?: UiStore["collectionsTab"]) => void;
  close: () => void;
  setMobileView: (v: "list" | "map") => void;
  notify: (message: string) => void;
}

export const useUi = create<UiStore>()((set) => ({
  panel: null,
  collectionsTab: "shortlist",
  mobileView: "list",
  toast: null,
  open: (panel, tab) => set((s) => ({ panel, collectionsTab: tab ?? s.collectionsTab })),
  close: () => set({ panel: null }),
  setMobileView: (mobileView) => set({ mobileView }),
  notify: (message) => set({ toast: { id: Date.now(), message } }),
}));
