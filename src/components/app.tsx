"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { List, Map as MapIcon, PanelLeftOpen } from "lucide-react";
import { useListingSearch } from "@/hooks/use-listing-search";
import { useUrlSync } from "@/hooks/use-url-sync";
import { parseUrl } from "@/lib/url-state";
import { useSearch } from "@/store/search";
import { useSettings, type Layout } from "@/store/settings";
import { useUi } from "@/store/ui";
import { FiltersModal } from "./filters/filters-modal";
import { Header } from "./header/header";
import { ListingDrawer } from "./listing/listing-drawer";
import { MapView } from "./map/map-view";
import { CollectionsSheet } from "./panels/collections-sheet";
import { CompareModal, CompareTray, SaveSearchModal, ShortcutsModal, Toast } from "./panels/misc";
import { SettingsSheet } from "./panels/settings-sheet";
import { ResultsPanel } from "./results/results-panel";
import { ThemeController, useResolvedTheme } from "./theme-controller";
import { Button, TooltipProvider } from "./ui/primitives";

let hydrated = false;
function hydrateFromUrl() {
  if (hydrated) return;
  hydrated = true;
  const state = parseUrl(window.location.search);
  const hasView = new URLSearchParams(window.location.search).has("lat");
  useSearch.setState({
    filters: state.filters,
    view: state.view,
    polygon: state.polygon,
    locationLabel: state.label ?? (hasView ? null : "Sydney"),
    selectedId: state.listing,
  });
}

const LAYOUTS: Layout[] = ["split", "list", "map"];

function useShortcuts() {
  const resolved = useResolvedTheme();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable) return;
      if (useUi.getState().panel || useSearch.getState().selectedId) return;
      const ui = useUi.getState();
      const search = useSearch.getState();
      const settings = useSettings.getState();
      switch (e.key.toLowerCase()) {
        case "f":
          ui.open("filters");
          break;
        case "b":
          search.setFilters({ listingType: "Sale" });
          break;
        case "r":
          search.setFilters({ listingType: "Rent" });
          break;
        case "s":
          search.setFilters({ listingType: "Sold" });
          break;
        case "l":
          settings.set("layout", LAYOUTS[(LAYOUTS.indexOf(settings.layout) + 1) % LAYOUTS.length]);
          break;
        case "d":
          search.setDrawing(!search.drawing);
          break;
        case "h":
          settings.set("heatmap", settings.heatmap === "off" ? "density" : settings.heatmap === "density" ? "price" : "off");
          break;
        case "t":
          settings.set("theme", resolved === "dark" ? "light" : "dark");
          break;
        case ",":
          ui.open("settings");
          break;
        case "?":
          ui.open("shortcuts");
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resolved]);
}

function Resizer({ side }: { side: "left" | "right" }) {
  const set = useSettings((s) => s.set);

  const beginDrag = useCallback(
    (startX: number) => {
      const startW = useSettings.getState().panelWidth;
      const onMove = (e: PointerEvent) => {
        const dx = e.clientX - startX;
        const w = startW + (side === "left" ? dx : -dx);
        set("panelWidth", Math.round(Math.min(Math.max(360, w), window.innerWidth * 0.68)));
      };
      const onUp = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [set, side],
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize results panel"
      tabIndex={0}
      onKeyDown={(e) => {
        const w = useSettings.getState().panelWidth;
        const dir = side === "left" ? 1 : -1;
        if (e.key === "ArrowLeft") set("panelWidth", Math.max(360, w - 40 * dir));
        if (e.key === "ArrowRight") set("panelWidth", Math.max(360, w + 40 * dir));
      }}
      onPointerDown={(e) => beginDrag(e.clientX)}
      onDoubleClick={() => set("panelWidth", 520)}
      className="group relative z-10 hidden w-0 cursor-col-resize md:block"
    >
      <div className="absolute inset-y-0 -left-1.5 w-3" />
      <div className="absolute inset-y-0 -left-px w-px bg-line transition-colors group-hover:bg-accent group-active:bg-accent" />
    </div>
  );
}

export default function App() {
  useState(() => {
    hydrateFromUrl();
    return true;
  });
  useListingSearch();
  useUrlSync();
  useShortcuts();

  const layout = useSettings((s) => s.layout);
  const panelSide = useSettings((s) => s.panelSide);
  const panelWidth = useSettings((s) => s.panelWidth);
  const set = useSettings((s) => s.set);
  const mobileView = useUi((s) => s.mobileView);
  const setMobileView = useUi((s) => s.setMobileView);
  const total = useSearch((s) => s.total);

  const showList = layout !== "map";
  const showMap = layout !== "list";

  const list = showList ? (
    <aside
      key="list"
      style={{ ["--panel-w" as string]: `${panelWidth}px` }}
      className={clsx(
        "min-h-0 shrink-0 bg-bg",
        showMap ? "w-full md:w-[var(--panel-w)]" : "w-full",
        mobileView === "map" && showMap && "max-md:hidden",
      )}
    >
      <ResultsPanel />
    </aside>
  ) : null;

  const map = showMap ? (
    <section key="map" className={clsx("relative min-h-0 min-w-0 flex-1", mobileView === "list" && showList && "max-md:hidden")}>
      <MapView />
      {!showList ? (
        <Button className="absolute left-3 top-3 z-10 shadow-md" onClick={() => set("layout", "split")}>
          <PanelLeftOpen size={15} /> Show list
        </Button>
      ) : null}
    </section>
  ) : null;

  const resizer = showList && showMap ? <Resizer key="resizer" side={panelSide} /> : null;
  const children = panelSide === "left" ? [list, resizer, map] : [map, resizer, list];

  return (
    <TooltipProvider>
      <ThemeController />
      <div className="flex h-dvh flex-col">
        <Header />
        <main className="flex min-h-0 flex-1">{children}</main>
      </div>

      {showList && showMap ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center md:hidden">
          <Button
            variant="primary"
            size="lg"
            className="pointer-events-auto rounded-full shadow-lg"
            onClick={() => setMobileView(mobileView === "list" ? "map" : "list")}
          >
            {mobileView === "list" ? (
              <>
                <MapIcon size={16} /> Map
              </>
            ) : (
              <>
                <List size={16} /> List · {total.toLocaleString("en-AU")}
              </>
            )}
          </Button>
        </div>
      ) : null}

      <ListingDrawer />
      <FiltersModal />
      <SettingsSheet />
      <CollectionsSheet />
      <SaveSearchModal />
      <ShortcutsModal />
      <CompareTray />
      <CompareModal />
      <Toast />
    </TooltipProvider>
  );
}
