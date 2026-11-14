"use client";

import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Check, Monitor, Moon, PanelLeft, PanelRight, Sun } from "lucide-react";
import { ACCENTS, MAP_STYLES } from "@/lib/constants";
import type { AreaUnit, PriceFormat } from "@/lib/format";
import { useCollections } from "@/store/collections";
import { useSettings, type CardStyle, type Density, type HeatmapMode, type Layout, type PinMode, type Theme } from "@/store/settings";
import { useUi } from "@/store/ui";
import { STYLE_SWATCH } from "../map/map-styles";
import { Button, Kbd, Segmented, Sheet, Switch } from "../ui/primitives";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-5 last:border-0">
      <h3 className="mb-4 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Item({ label, hint, children, stacked }: { label: string; hint?: string; children: ReactNode; stacked?: boolean }) {
  return (
    <div className={clsx(stacked ? "space-y-2" : "flex items-center justify-between gap-4")}>
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium">{label}</div>
        {hint ? <div className="text-[12px] text-muted">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function SettingsSheet() {
  const open = useUi((s) => s.panel === "settings");
  const close = useUi((s) => s.close);
  const openPanel = useUi((s) => s.open);
  const s = useSettings();
  const clearHidden = useCollections((c) => c.clearHidden);
  const hiddenCount = useCollections((c) => c.hidden.length);
  const viewedCount = useCollections((c) => c.viewed.length);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    if (!open || source) return;
    fetch("/api/status")
      .then((r) => r.json())
      .then((j) => setSource(j.source))
      .catch(() => setSource("unknown"));
  }, [open, source]);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && close()}
      title="Customise"
      description="Make the search work the way you do. Changes save automatically."
      width={420}
      footer={
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => openPanel("shortcuts")}>
            Keyboard shortcuts
          </Button>
          <Button variant="ghost" size="sm" onClick={s.reset}>
            Reset to defaults
          </Button>
        </div>
      }
    >
      <Group title="Appearance">
        <Item label="Theme" stacked>
          <Segmented<Theme>
            className="w-full"
            value={s.theme}
            onChange={(v) => s.set("theme", v)}
            options={[
              { value: "light", label: <><Sun size={14} /> Light</> },
              { value: "dark", label: <><Moon size={14} /> Dark</> },
              { value: "system", label: <><Monitor size={14} /> System</> },
            ]}
          />
        </Item>
        <Item label="Accent colour" stacked>
          <div className="flex gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                title={a.label}
                aria-label={a.label}
                aria-pressed={s.accent === a.id}
                onClick={() => s.set("accent", a.id)}
                className={clsx(
                  "grid h-8 w-8 place-items-center rounded-full ring-offset-2 ring-offset-surface transition-shadow",
                  s.accent === a.id ? "ring-2 ring-fg" : "ring-1 ring-line hover:ring-line-strong",
                )}
                style={{ background: a.value }}
              >
                {s.accent === a.id ? <Check size={14} color={a.ink} strokeWidth={3} /> : null}
              </button>
            ))}
          </div>
        </Item>
        <Item label="Layout" stacked>
          <Segmented<Layout>
            className="w-full"
            value={s.layout}
            onChange={(v) => s.set("layout", v)}
            options={[
              { value: "split", label: "List + map" },
              { value: "list", label: "List only" },
              { value: "map", label: "Map only" },
            ]}
          />
        </Item>
        <Item label="List position">
          <Segmented<"left" | "right">
            size="sm"
            value={s.panelSide}
            onChange={(v) => s.set("panelSide", v)}
            options={[
              { value: "left", label: <><PanelLeft size={14} /> Left</> },
              { value: "right", label: <><PanelRight size={14} /> Right</> },
            ]}
          />
        </Item>
        <Item label="Cards">
          <Segmented<CardStyle>
            size="sm"
            value={s.cardStyle}
            onChange={(v) => s.set("cardStyle", v)}
            options={[
              { value: "list", label: "Rows" },
              { value: "grid", label: "Grid" },
            ]}
          />
        </Item>
        <Item label="Density">
          <Segmented<Density>
            size="sm"
            value={s.density}
            onChange={(v) => s.set("density", v)}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
        </Item>
        <Item label="Market snapshot" hint="Median prices and spread for the area in view">
          <Switch checked={s.showSnapshot} onCheckedChange={(v) => s.set("showSnapshot", v)} label="Market snapshot" />
        </Item>
        <Item label="Suburb on cards">
          <Switch checked={s.showSuburbOnCards} onCheckedChange={(v) => s.set("showSuburbOnCards", v)} label="Suburb on cards" />
        </Item>
        <Item label="Preview photos on hover" hint="Cycle through photos while hovering a card">
          <Switch checked={s.autoplayGallery} onCheckedChange={(v) => s.set("autoplayGallery", v)} label="Preview photos on hover" />
        </Item>
      </Group>

      <Group title="Map">
        <Item label="Base map" stacked>
          <div className="grid grid-cols-5 gap-1.5">
            {MAP_STYLES.map((m) => (
              <button
                key={m.id}
                onClick={() => s.set("mapStyle", m.id)}
                aria-pressed={s.mapStyle === m.id}
                className={clsx("rounded-lg border p-1 text-center", s.mapStyle === m.id ? "border-fg" : "border-line hover:border-line-strong")}
              >
                <span className="block h-9 rounded-md" style={{ background: STYLE_SWATCH[m.id] }} />
                <span className="mt-1 block text-[11px] font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </Item>
        <Item label="Pin labels">
          <Segmented<PinMode>
            size="sm"
            value={s.pinMode}
            onChange={(v) => s.set("pinMode", v)}
            options={[
              { value: "price", label: "Price" },
              { value: "beds", label: "Beds" },
              { value: "dot", label: "Dots" },
            ]}
          />
        </Item>
        <Item label="Heatmap">
          <Segmented<HeatmapMode>
            size="sm"
            value={s.heatmap}
            onChange={(v) => s.set("heatmap", v)}
            options={[
              { value: "off", label: "Off" },
              { value: "density", label: "Density" },
              { value: "price", label: "Price" },
            ]}
          />
        </Item>
        <Item label="Group nearby pins">
          <Switch checked={s.cluster} onCheckedChange={(v) => s.set("cluster", v)} label="Group nearby pins" />
        </Item>
        <Item label="3D tilt" hint="Best with the Detailed base map">
          <Switch checked={s.tilt} onCheckedChange={(v) => s.set("tilt", v)} label="3D tilt" />
        </Item>
        <Item label="Search as I move the map">
          <Switch checked={s.searchAsMove} onCheckedChange={(v) => s.set("searchAsMove", v)} label="Search as I move the map" />
        </Item>
        <Item label="Fade viewed homes">
          <Switch checked={s.dimViewed} onCheckedChange={(v) => s.set("dimViewed", v)} label="Fade viewed homes" />
        </Item>
      </Group>

      <Group title="Units & formatting">
        <Item label="Prices">
          <Segmented<PriceFormat>
            size="sm"
            value={s.priceFormat}
            onChange={(v) => s.set("priceFormat", v)}
            options={[
              { value: "compact", label: "$1.25m" },
              { value: "full", label: "$1,250,000" },
            ]}
          />
        </Item>
        <Item label="Land area">
          <Segmented<AreaUnit>
            size="sm"
            value={s.areaUnit}
            onChange={(v) => s.set("areaUnit", v)}
            options={[
              { value: "sqm", label: "m²" },
              { value: "ha", label: "ha" },
              { value: "acres", label: "acres" },
            ]}
          />
        </Item>
      </Group>

      <Group title="Finance defaults">
        <div className="grid grid-cols-3 gap-2">
          <NumberSetting label="Deposit %" value={s.depositPct} onChange={(v) => s.set("depositPct", v)} />
          <NumberSetting label="Rate %" value={s.interestRate} step={0.05} onChange={(v) => s.set("interestRate", v)} />
          <NumberSetting label="Term (yrs)" value={s.loanTerm} onChange={(v) => s.set("loanTerm", v)} />
        </div>
      </Group>

      <Group title="Data">
        <Item
          label="Listing source"
          hint={source === "domain" ? "Live listings from the Domain API" : source === "demo" ? "Demo data, no Domain credentials configured" : "Checking…"}
        >
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-[11.5px] font-semibold",
              source === "domain" ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted ring-1 ring-line",
            )}
          >
            {source === "domain" ? "Domain" : source === "demo" ? "Demo" : "…"}
          </span>
        </Item>
        <Item label="Hidden listings" hint={`${hiddenCount} hidden from results`}>
          <Button size="sm" onClick={clearHidden} disabled={!hiddenCount}>
            Unhide all
          </Button>
        </Item>
        <Item label="Viewed history" hint={`${viewedCount} homes viewed`}>
          <Button size="sm" onClick={() => useCollections.setState({ viewed: [] })} disabled={!viewedCount}>
            Clear
          </Button>
        </Item>
      </Group>
    </Sheet>
  );
}

function NumberSetting({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-muted">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-[13.5px] tabular outline-none focus:border-fg/50"
      />
    </label>
  );
}

export function ShortcutsModalContent() {
  const rows: [string, string][] = [
    ["/", "Search for a location"],
    ["F", "Open all filters"],
    ["B / R / S", "Buy, rent or sold"],
    ["L", "Cycle layout (list + map, list, map)"],
    ["D", "Draw a search area"],
    ["H", "Toggle heatmap"],
    ["T", "Toggle light / dark"],
    [",", "Open customise panel"],
    ["Esc", "Close panels"],
  ];
  return (
    <ul className="divide-y divide-line px-5 py-2">
      {rows.map(([k, d]) => (
        <li key={k} className="flex items-center justify-between py-2.5 text-[13.5px]">
          <span className="text-fg-2">{d}</span>
          <span className="flex gap-1">
            {k.split(" / ").map((x) => (
              <Kbd key={x}>{x}</Kbd>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}
