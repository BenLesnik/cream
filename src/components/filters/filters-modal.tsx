"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { FEATURES, LAND_STEPS } from "@/lib/constants";
import { formatArea, pluralise } from "@/lib/format";
import type { EstablishedType } from "@/lib/types";
import { countActiveFilters } from "@/lib/url-state";
import { useSearch } from "@/store/search";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { Button, Modal, Segmented, Switch } from "../ui/primitives";
import { BedsEditor, CheckRow, Field, NativeSelect, NumberChips, PriceRange, PropertyTypeEditor } from "./filter-controls";

function Section({ title, children, description }: { title: string; children: ReactNode; description?: string }) {
  return (
    <section className="border-b border-line px-5 py-5 last:border-0">
      <h3 className="text-[14px] font-semibold tracking-tight">{title}</h3>
      {description ? <p className="mt-0.5 text-[12.5px] text-muted">{description}</p> : null}
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1.5">
      <span>
        <span className="block text-[13.5px] font-medium">{label}</span>
        {hint ? <span className="block text-[12px] text-muted">{hint}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} label={label} />
    </label>
  );
}

function KeywordsInput() {
  const setFilters = useSearch((s) => s.setFilters);
  const [keywords, setKeywords] = useState(() => useSearch.getState().filters.keywords);

  useEffect(() => {
    const t = setTimeout(() => {
      if (keywords !== useSearch.getState().filters.keywords) setFilters({ keywords });
    }, 400);
    return () => clearTimeout(t);
  }, [keywords, setFilters]);

  return (
    <input
      value={keywords}
      onChange={(e) => setKeywords(e.target.value)}
      placeholder="Search listing descriptions"
      className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-[14px] outline-none placeholder:text-muted focus:border-fg/50"
    />
  );
}

export function FiltersModal() {
  const open = useUi((s) => s.panel === "filters");
  const close = useUi((s) => s.close);
  const f = useSearch((s) => s.filters);
  const setFilters = useSearch((s) => s.setFilters);
  const resetFilters = useSearch((s) => s.resetFilters);
  const total = useSearch((s) => s.total);
  const loading = useSearch((s) => s.loading);
  const areaUnit = useSettings((s) => s.areaUnit);

  const featureGroups = [...new Set(FEATURES.map((x) => x.group))];
  const landOpts = [{ value: "", label: "Any" }, ...LAND_STEPS.map((s) => ({ value: String(s), label: formatArea(s, areaUnit)! }))];
  const active = countActiveFilters(f);

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && close()}
      title="Filters"
      description={active ? `${active} active` : "Refine your search"}
      width={680}
      footer={
        <>
          <Button variant="ghost" onClick={() => resetFilters()} disabled={!active}>
            Clear all
          </Button>
          <Button variant="primary" size="lg" onClick={close} className="min-w-[180px]">
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            Show {pluralise(total, "home")}
          </Button>
        </>
      }
    >
      <Section title={f.listingType === "Rent" ? "Weekly rent" : "Price"}>
        <PriceRange />
      </Section>
      <Section title="Property type">
        <PropertyTypeEditor columns={3} />
      </Section>
      <Section title="Rooms">
        <BedsEditor />
      </Section>
      <Section title="Land size">
        <div className="grid grid-cols-2 gap-2">
          <NativeSelect
            ariaLabel="Minimum land size"
            value={f.minLand == null ? "" : String(f.minLand)}
            onChange={(v) => setFilters({ minLand: v ? Number(v) : null })}
            options={landOpts.map((o, i) => (i === 0 ? { ...o, label: "No min" } : o))}
          />
          <NativeSelect
            ariaLabel="Maximum land size"
            value={f.maxLand == null ? "" : String(f.maxLand)}
            onChange={(v) => setFilters({ maxLand: v ? Number(v) : null })}
            options={landOpts.map((o, i) => (i === 0 ? { ...o, label: "No max" } : o))}
          />
        </div>
      </Section>
      <Section title="Features" description="Homes must have every feature you select.">
        <div className="space-y-4">
          {featureGroups.map((g) => (
            <div key={g}>
              <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">{g}</div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {FEATURES.filter((x) => x.group === g).map((x) => (
                  <CheckRow
                    key={x.value}
                    checked={f.features.includes(x.value)}
                    onChange={() =>
                      setFilters({
                        features: f.features.includes(x.value) ? f.features.filter((v) => v !== x.value) : [...f.features, x.value],
                      })
                    }
                  >
                    {x.label}
                  </CheckRow>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Keywords" description="Separate with commas, e.g. “north facing, renovated”.">
        <KeywordsInput />
      </Section>
      <Section title="Listing details">
        <div className="space-y-4">
          <Field label="Construction">
            <Segmented<EstablishedType>
              className="w-full"
              value={f.established}
              onChange={(v) => setFilters({ established: v })}
              options={[
                { value: "Any", label: "Any" },
                { value: "New", label: "New builds" },
                { value: "Established", label: "Established" },
              ]}
            />
          </Field>
          {f.listingType !== "Sold" ? (
            <Field label="Listed within">
              <NumberChips
                ariaLabel="Listed within"
                value={f.listedWithinDays}
                onChange={(v) => setFilters({ listedWithinDays: v })}
                options={[
                  { value: null, label: "Any time" },
                  { value: 1, label: "24h" },
                  { value: 3, label: "3 days" },
                  { value: 7, label: "Week" },
                  { value: 14, label: "2 weeks" },
                  { value: 30, label: "Month" },
                ]}
              />
            </Field>
          ) : null}
          <div className="divide-y divide-line rounded-xl border border-line px-3.5">
            {f.listingType !== "Sold" ? (
              <ToggleRow label="Open homes only" hint="Inspections in the next two weeks" checked={f.openHomesOnly} onChange={(v) => setFilters({ openHomesOnly: v })} />
            ) : null}
            {f.listingType === "Sale" ? (
              <>
                <ToggleRow label="Auctions only" checked={f.auctionsOnly} onChange={(v) => setFilters({ auctionsOnly: v })} />
                <ToggleRow label="Hide under offer" checked={f.excludeUnderOffer} onChange={(v) => setFilters({ excludeUnderOffer: v })} />
              </>
            ) : null}
            <ToggleRow label="Hide listings without a price" checked={f.excludePriceWithheld} onChange={(v) => setFilters({ excludePriceWithheld: v })} />
            <ToggleRow label="Has floorplan" checked={f.hasFloorplan} onChange={(v) => setFilters({ hasFloorplan: v })} />
            <ToggleRow label="Has video tour" checked={f.hasVideo} onChange={(v) => setFilters({ hasVideo: v })} />
          </div>
        </div>
      </Section>
    </Modal>
  );
}
