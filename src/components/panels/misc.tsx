"use client";

import { useEffect, useState } from "react";
import { GitCompareArrows, X } from "lucide-react";
import { FEATURE_LABEL, PROPERTY_TYPE_LABEL } from "@/lib/constants";
import { formatArea, formatMoney, nextInspection, pluralise } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { countActiveFilters } from "@/lib/url-state";
import { MAX_COMPARE, useCollections } from "@/store/collections";
import { useSearch } from "@/store/search";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { sizedImage } from "../listing/parts";
import { Button, Modal } from "../ui/primitives";
import { ShortcutsModalContent } from "./settings-sheet";

export function SaveSearchModal() {
  const open = useUi((s) => s.panel === "save");
  return <SaveSearchDialog key={open ? "open" : "closed"} open={open} />;
}

function defaultSearchName() {
  const s = useSearch.getState();
  const mode = s.filters.listingType === "Sale" ? "Buy" : s.filters.listingType;
  return `${s.locationLabel ?? (s.polygon ? "Drawn area" : "Map area")} · ${mode}`;
}

function SaveSearchDialog({ open }: { open: boolean }) {
  const close = useUi((s) => s.close);
  const notify = useUi((s) => s.notify);
  const saveSearch = useCollections((s) => s.saveSearch);
  const filters = useSearch((s) => s.filters);
  const view = useSearch((s) => s.view);
  const polygon = useSearch((s) => s.polygon);
  const locationLabel = useSearch((s) => s.locationLabel);
  const total = useSearch((s) => s.total);
  const [name, setName] = useState(defaultSearchName);

  const n = countActiveFilters(filters);
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && close()}
      title="Save this search"
      width={440}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!name.trim() || !view}
            onClick={() => {
              saveSearch({ name: name.trim(), filters, view: view!, polygon, locationLabel, lastCount: total });
              notify("Search saved");
              close();
            }}
          >
            Save search
          </Button>
        </>
      }
    >
      <div className="space-y-4 px-5 py-5">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-[14px] outline-none focus:border-fg/50"
          />
        </label>
        <div className="rounded-xl bg-surface-2 px-3.5 py-3 text-[13px] text-fg-2">
          {pluralise(total, "home")} right now · {n ? pluralise(n, "filter") : "no filters"} · {polygon ? "custom drawn area" : "current map area"}
        </div>
      </div>
    </Modal>
  );
}

export function ShortcutsModal() {
  const open = useUi((s) => s.panel === "shortcuts");
  const close = useUi((s) => s.close);
  return (
    <Modal open={open} onOpenChange={(o) => !o && close()} title="Keyboard shortcuts" width={420}>
      <ShortcutsModalContent />
    </Modal>
  );
}

export function CompareTray() {
  const compare = useCollections((s) => s.compare);
  const cache = useCollections((s) => s.compareCache);
  const toggle = useCollections((s) => s.toggleCompare);
  const clear = useCollections((s) => s.clearCompare);
  const open = useUi((s) => s.open);
  if (!compare.length) return null;
  const items = compare.map((id) => cache[id]).filter(Boolean);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line bg-surface p-2 pl-3 shadow-lg animate-slide-up">
        <GitCompareArrows size={16} className="text-muted" />
        <div className="flex gap-1.5">
          {items.map((l) => (
            <div key={l.id} className="group relative h-10 w-14 overflow-hidden rounded-md bg-surface-2">
              {l.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sizedImage(l.images[0], "sm")} alt={l.address.street} className="h-full w-full object-cover" />
              ) : null}
              <button
                aria-label="Remove from compare"
                onClick={() => toggle(l)}
                className="absolute inset-0 grid place-items-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {Array.from({ length: MAX_COMPARE - items.length }, (_, i) => (
            <div key={i} className="h-10 w-14 rounded-md border border-dashed border-line-strong" />
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear
        </Button>
        <Button variant="primary" size="sm" disabled={items.length < 2} onClick={() => open("compare")}>
          Compare {items.length}
        </Button>
      </div>
    </div>
  );
}

export function CompareModal() {
  const open = useUi((s) => s.panel === "compare");
  const close = useUi((s) => s.close);
  const compare = useCollections((s) => s.compare);
  const cache = useCollections((s) => s.compareCache);
  const areaUnit = useSettings((s) => s.areaUnit);
  const items = compare.map((id) => cache[id]).filter(Boolean);

  const best = (fn: (l: Listing) => number | null, dir: "min" | "max") => {
    const vals = items.map(fn).filter((v): v is number => v != null && v > 0);
    if (vals.length < 2) return null;
    return dir === "min" ? Math.min(...vals) : Math.max(...vals);
  };
  const perSqm = (l: Listing) => (l.price && (l.landArea || l.buildingArea) ? l.price / (l.landArea || l.buildingArea!) : null);

  const rows: { label: string; get: (l: Listing) => React.ReactNode; num?: (l: Listing) => number | null; dir?: "min" | "max" }[] = [
    { label: "Price", get: (l) => l.displayPrice, num: (l) => l.price, dir: "min" },
    { label: "Type", get: (l) => PROPERTY_TYPE_LABEL[l.propertyType] ?? l.propertyType },
    { label: "Bedrooms", get: (l) => l.bedrooms, num: (l) => l.bedrooms, dir: "max" },
    { label: "Bathrooms", get: (l) => l.bathrooms, num: (l) => l.bathrooms, dir: "max" },
    { label: "Parking", get: (l) => l.carspaces, num: (l) => l.carspaces, dir: "max" },
    { label: "Land", get: (l) => formatArea(l.landArea, areaUnit) ?? "–", num: (l) => l.landArea, dir: "max" },
    { label: "Internal", get: (l) => formatArea(l.buildingArea, "sqm") ?? "–", num: (l) => l.buildingArea, dir: "max" },
    { label: "Price per m²", get: (l) => (perSqm(l) ? formatMoney(perSqm(l)!, "full") : "–"), num: perSqm, dir: "min" },
    { label: "Next open", get: (l) => nextInspection(l) ?? "–" },
    { label: "Agency", get: (l) => l.agency.name },
    {
      label: "Features",
      get: (l) => (
        <span className="text-[12.5px] text-fg-2">{l.features.slice(0, 8).map((f) => FEATURE_LABEL[f] ?? f).join(", ") || "–"}</span>
      ),
    },
  ];

  return (
    <Modal open={open} onOpenChange={(o) => !o && close()} title="Compare homes" width={Math.max(640, 220 + items.length * 220)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr>
              <th className="w-[150px]" />
              {items.map((l) => (
                <th key={l.id} className="min-w-[200px] p-3 text-left align-top font-normal">
                  <button
                    className="block w-full text-left"
                    onClick={() => {
                      close();
                      useSearch.getState().select(l.id);
                    }}
                  >
                    <div className="aspect-[16/10] overflow-hidden rounded-lg bg-surface-2">
                      {l.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sizedImage(l.images[0], "sm")} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="mt-2 text-[13.5px] font-semibold leading-snug">{l.address.street}</div>
                    <div className="text-[12px] text-muted">{l.address.suburb}</div>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const target = r.num && r.dir ? best(r.num, r.dir) : null;
              return (
                <tr key={r.label} className="border-t border-line">
                  <th className="px-4 py-2.5 text-left text-[12.5px] font-medium text-muted">{r.label}</th>
                  {items.map((l) => {
                    const isBest = target != null && r.num?.(l) === target;
                    return (
                      <td key={l.id} className="px-3 py-2.5 tabular">
                        <span className={isBest ? "rounded bg-accent-soft px-1.5 py-0.5 font-semibold text-accent" : ""}>{r.get(l)}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export function Toast() {
  const toast = useUi((s) => s.toast);
  if (!toast) return null;
  return <ToastItem key={toast.id} message={toast.message} />;
}

function ToastItem({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[124px] z-[100] flex justify-center px-4" role="status" aria-live="polite">
      <div className="rounded-full bg-fg px-4 py-2 text-[13px] font-medium text-bg shadow-lg animate-pop-in">{message}</div>
    </div>
  );
}
