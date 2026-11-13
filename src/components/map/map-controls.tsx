"use client";

import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { Marker, type Map as MLMap } from "maplibre-gl";
import { Box, Layers, LocateFixed, Minus, PenLine, Plus, X } from "lucide-react";
import { MAP_STYLES } from "@/lib/constants";
import { useSearch } from "@/store/search";
import { useSettings, type HeatmapMode, type PinMode } from "@/store/settings";
import { useUi } from "@/store/ui";
import { PopoverPanel, Segmented, SectionLabel, Switch, Tooltip } from "../ui/primitives";
import { STYLE_SWATCH } from "./map-styles";

function CtrlButton({
  label,
  onClick,
  active,
  children,
  side = "left",
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  children: ReactNode;
  side?: "left" | "right" | "top" | "bottom";
}) {
  return (
    <Tooltip label={label} side={side}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        className={clsx(
          "grid h-9 w-9 place-items-center transition-colors",
          active ? "bg-fg text-bg" : "text-fg-2 hover:bg-surface-2 hover:text-fg",
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

const Group = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-md">
    {children}
  </div>
);

let locationMarker: Marker | null = null;

export function MapControls({ map }: { map: MLMap }) {
  const settings = useSettings();
  const drawing = useSearch((s) => s.drawing);
  const polygon = useSearch((s) => s.polygon);
  const notify = useUi((s) => s.notify);
  const [locating, setLocating] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) return notify("Location isn't available in this browser");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        locationMarker?.remove();
        const el = document.createElement("div");
        el.className = "h-4 w-4 rounded-full border-2 border-white bg-[#2563eb] shadow-[0_0_0_6px_rgba(37,99,235,0.2)]";
        locationMarker = new Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        useSearch.getState().flyTo({ lat, lng, zoom: 14.5 }, "Near me");
      },
      () => {
        setLocating(false);
        notify("Couldn't get your location");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
      <div className="pointer-events-auto flex flex-col gap-2">
        <Group>
          <PopoverPanel
            align="end"
            className="w-[300px]"
            trigger={
              <button
                aria-label="Map style"
                className="grid h-9 w-9 place-items-center text-fg-2 hover:bg-surface-2 hover:text-fg"
              >
                <span
                  className="h-5 w-5 rounded-md ring-1 ring-line-strong"
                  style={{ background: STYLE_SWATCH[settings.mapStyle] }}
                />
              </button>
            }
          >
            <SectionLabel>Map style</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {MAP_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => settings.set("mapStyle", s.id)}
                  className={clsx(
                    "group rounded-lg border p-1.5 text-left transition-colors",
                    settings.mapStyle === s.id ? "border-fg" : "border-line hover:border-line-strong",
                  )}
                >
                  <span className="block h-12 rounded-md" style={{ background: STYLE_SWATCH[s.id] }} />
                  <span className="mt-1.5 block px-0.5 text-[12.5px] font-medium">{s.label}</span>
                  <span className="block px-0.5 text-[11px] leading-snug text-muted">{s.description}</span>
                </button>
              ))}
            </div>
          </PopoverPanel>
          <PopoverPanel
            align="end"
            className="w-[300px]"
            trigger={
              <button aria-label="Map layers" className="grid h-9 w-9 place-items-center text-fg-2 hover:bg-surface-2 hover:text-fg">
                <Layers size={17} />
              </button>
            }
          >
            <LayersPanel />
          </PopoverPanel>
        </Group>

        <Group>
          <CtrlButton label="Zoom in" onClick={() => map.zoomIn()}>
            <Plus size={17} />
          </CtrlButton>
          <CtrlButton label="Zoom out" onClick={() => map.zoomOut()}>
            <Minus size={17} />
          </CtrlButton>
        </Group>

        <Group>
          <CtrlButton label={locating ? "Locating…" : "Near me"} onClick={locate}>
            <LocateFixed size={17} className={locating ? "animate-pulse" : ""} />
          </CtrlButton>
          <CtrlButton label={settings.tilt ? "Flat view" : "3D tilt"} active={settings.tilt} onClick={() => settings.set("tilt", !settings.tilt)}>
            <Box size={17} />
          </CtrlButton>
        </Group>

        <Group>
          {polygon ? (
            <CtrlButton
              label="Clear drawn area"
              onClick={() => {
                useSearch.getState().setPolygon(null);
                useSearch.getState().setLocationLabel(null);
              }}
            >
              <X size={17} />
            </CtrlButton>
          ) : (
            <CtrlButton
              label={drawing ? "Cancel drawing" : "Draw an area"}
              active={drawing}
              onClick={() => useSearch.getState().setDrawing(!drawing)}
            >
              <PenLine size={17} />
            </CtrlButton>
          )}
        </Group>
      </div>
      {settings.heatmap !== "off" ? <HeatLegend mode={settings.heatmap} /> : null}
    </div>
  );
}

export function LayersPanel() {
  const s = useSettings();
  return (
    <div className="space-y-4">
      <div>
        <SectionLabel>Heatmap</SectionLabel>
        <Segmented<HeatmapMode>
          className="w-full"
          size="sm"
          value={s.heatmap}
          onChange={(v) => s.set("heatmap", v)}
          options={[
            { value: "off", label: "Off" },
            { value: "density", label: "Density" },
            { value: "price", label: "Price" },
          ]}
        />
      </div>
      <div>
        <SectionLabel>Pin labels</SectionLabel>
        <Segmented<PinMode>
          className="w-full"
          size="sm"
          value={s.pinMode}
          onChange={(v) => s.set("pinMode", v)}
          options={[
            { value: "price", label: "Price" },
            { value: "beds", label: "Bedrooms" },
            { value: "dot", label: "Dots" },
          ]}
        />
      </div>
      <div className="space-y-3 border-t border-line pt-4">
        <Row label="Group nearby pins" hint="Cluster pins when zoomed out">
          <Switch checked={s.cluster} onCheckedChange={(v) => s.set("cluster", v)} label="Group nearby pins" />
        </Row>
        <Row label="Fade viewed homes" hint="Grey out pins you've opened">
          <Switch checked={s.dimViewed} onCheckedChange={(v) => s.set("dimViewed", v)} label="Fade viewed homes" />
        </Row>
        <Row label="Search as I move" hint="Refresh results when the map moves">
          <Switch checked={s.searchAsMove} onCheckedChange={(v) => s.set("searchAsMove", v)} label="Search as I move" />
        </Row>
      </div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span>
        <span className="block text-[13px] font-medium">{label}</span>
        {hint ? <span className="block text-[12px] text-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function HeatLegend({ mode }: { mode: HeatmapMode }) {
  return (
    <div className="pointer-events-auto w-40 rounded-lg border border-line bg-surface/95 px-3 py-2 shadow-md backdrop-blur">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {mode === "price" ? "Relative price" : "Listing density"}
      </div>
      <div
        className="h-1.5 rounded-full"
        style={{ background: "linear-gradient(90deg,rgba(44,127,184,.55),#41b6c4,#a1dab4,#fdae61,#d7191c)" }}
      />
      <div className="mt-1 flex justify-between text-[10.5px] text-muted">
        <span>{mode === "price" ? "Lower" : "Fewer"}</span>
        <span>{mode === "price" ? "Higher" : "More"}</span>
      </div>
    </div>
  );
}
