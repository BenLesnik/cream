"use client";

import { useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import { PROPERTY_TYPES, RENT_PRICE_STEPS, SALE_PRICE_STEPS } from "@/lib/constants";
import { formatPriceStep } from "@/lib/format";
import { useSearch } from "@/store/search";
import { RangeSlider } from "../ui/primitives";

export function NativeSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className={clsx("relative", className)}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface pl-3 pr-8 text-[13.5px] text-fg outline-none transition-colors hover:border-line-strong focus:border-fg/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function priceSteps(isRent: boolean) {
  return isRent ? RENT_PRICE_STEPS : SALE_PRICE_STEPS;
}

/** Price range editor with a histogram of the prices currently on the map. */
export function PriceRange() {
  const filters = useSearch((s) => s.filters);
  const setFilters = useSearch((s) => s.setFilters);
  const results = useSearch((s) => s.results);
  const isRent = filters.listingType === "Rent";
  const steps = priceSteps(isRent);
  const maxIdx = steps.length;

  const toIdx = (v: number | null, fallback: number) => {
    if (v == null) return fallback;
    const i = steps.findIndex((s) => s >= v);
    return i === -1 ? maxIdx : i;
  };
  const committed: [number, number] = [
    filters.minPrice == null ? 0 : toIdx(filters.minPrice, 0) + 1,
    filters.maxPrice == null ? maxIdx + 1 : toIdx(filters.maxPrice, maxIdx) + 1,
  ];
  const [draft, setDraft] = useState<[number, number] | null>(null);
  const range = draft ?? committed;

  const histogram = useMemo(() => {
    const buckets = new Array(maxIdx + 2).fill(0);
    for (const l of results) {
      if (l.price == null) continue;
      const i = steps.findIndex((s) => s >= l.price!);
      buckets[i === -1 ? maxIdx + 1 : i + 1]++;
    }
    const peak = Math.max(1, ...buckets);
    return buckets.map((b) => b / peak);
  }, [results, steps, maxIdx]);

  const commit = ([lo, hi]: [number, number]) => {
    setDraft(null);
    setFilters({
      minPrice: lo <= 0 ? null : steps[lo - 1],
      maxPrice: hi > maxIdx ? null : steps[hi - 1],
    });
  };

  const opts = [
    { value: "", label: "Any" },
    ...steps.map((s) => ({ value: String(s), label: formatPriceStep(s, isRent) })),
  ];

  return (
    <div>
      <div className="mb-1 flex h-12 items-end gap-[2px] px-[9px]" aria-hidden>
        {histogram.map((h, i) => (
          <div
            key={i}
            className={clsx(
              "flex-1 rounded-t-[2px] transition-colors",
              i >= range[0] && i <= range[1] ? "bg-accent/70" : "bg-surface-3",
            )}
            style={{ height: `${Math.max(4, h * 100)}%` }}
          />
        ))}
      </div>
      <RangeSlider
        min={0}
        max={maxIdx + 1}
        value={range}
        onValueChange={setDraft}
        onValueCommit={commit}
      />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <NativeSelect
          ariaLabel="Minimum price"
          value={filters.minPrice == null ? "" : String(filters.minPrice)}
          onChange={(v) => setFilters({ minPrice: v ? Number(v) : null })}
          options={[{ value: "", label: "No min" }, ...opts.slice(1)]}
        />
        <NativeSelect
          ariaLabel="Maximum price"
          value={filters.maxPrice == null ? "" : String(filters.maxPrice)}
          onChange={(v) => setFilters({ maxPrice: v ? Number(v) : null })}
          options={[{ value: "", label: "No max" }, ...opts.slice(1)]}
        />
      </div>
      {isRent ? <p className="mt-2 text-[12px] text-muted">Rent is shown per week.</p> : null}
    </div>
  );
}

export function NumberChips({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  options: { value: number | null; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex overflow-hidden rounded-lg border border-line">
      {options.map((o, i) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "h-9 flex-1 px-2 text-[13px] font-medium tabular transition-colors",
            i > 0 && "border-l border-line",
            value === o.value ? "bg-fg text-bg" : "bg-surface text-fg-2 hover:bg-surface-2",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const BED_OPTIONS = [
  { value: null, label: "Any" },
  { value: 0, label: "Studio" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5+" },
];
export const PLUS_OPTIONS = [
  { value: null, label: "Any" },
  { value: 1, label: "1+" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
];

export function BedsEditor() {
  const f = useSearch((s) => s.filters);
  const setFilters = useSearch((s) => s.setFilters);
  return (
    <div className="space-y-4">
      <Field label="Bedrooms (min)">
        <NumberChips
          ariaLabel="Minimum bedrooms"
          value={f.minBeds}
          onChange={(v) => setFilters({ minBeds: v, maxBeds: f.maxBeds != null && v != null && f.maxBeds < v ? null : f.maxBeds })}
          options={BED_OPTIONS}
        />
      </Field>
      <Field label="Bedrooms (max)">
        <NumberChips
          ariaLabel="Maximum bedrooms"
          value={f.maxBeds}
          onChange={(v) => setFilters({ maxBeds: v, minBeds: f.minBeds != null && v != null && f.minBeds > v ? null : f.minBeds })}
          options={BED_OPTIONS.map((o) => (o.value === 5 ? { ...o, label: "5" } : o))}
        />
      </Field>
      <Field label="Bathrooms">
        <NumberChips ariaLabel="Minimum bathrooms" value={f.minBaths} onChange={(v) => setFilters({ minBaths: v })} options={PLUS_OPTIONS} />
      </Field>
      <Field label="Parking">
        <NumberChips ariaLabel="Minimum parking" value={f.minCars} onChange={(v) => setFilters({ minCars: v })} options={PLUS_OPTIONS} />
      </Field>
    </div>
  );
}

export function PropertyTypeEditor({ columns = 2 }: { columns?: number }) {
  const types = useSearch((s) => s.filters.propertyTypes);
  const setFilters = useSearch((s) => s.setFilters);
  const groups = [...new Set(PROPERTY_TYPES.map((t) => t.group))];
  const toggle = (v: string) =>
    setFilters({ propertyTypes: types.includes(v) ? types.filter((t) => t !== v) : [...types, v] });
  const toggleGroup = (g: string) => {
    const vals = PROPERTY_TYPES.filter((t) => t.group === g).map((t) => t.value);
    const all = vals.every((v) => types.includes(v));
    setFilters({ propertyTypes: all ? types.filter((t) => !vals.includes(t)) : [...new Set([...types, ...vals])] });
  };
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g}>
          <button onClick={() => toggleGroup(g)} className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted hover:text-fg">
            {g}
          </button>
          <div className={clsx("grid gap-1.5", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
            {PROPERTY_TYPES.filter((t) => t.group === g).map((t) => (
              <CheckRow key={t.value} checked={types.includes(t.value)} onChange={() => toggle(t.value)}>
                {t.label}
              </CheckRow>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={clsx(
        "flex h-9 items-center gap-2.5 rounded-lg border px-2.5 text-left text-[13px] transition-colors",
        checked ? "border-fg/60 bg-surface-2 text-fg" : "border-line text-fg-2 hover:border-line-strong",
      )}
    >
      <span
        className={clsx(
          "grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border transition-colors",
          checked ? "border-accent bg-accent text-accent-ink" : "border-line-strong bg-surface",
        )}
      >
        {checked ? <Check size={11} strokeWidth={3} /> : null}
      </span>
      <span className="truncate">{children}</span>
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-fg">{label}</span>
        {hint ? <span className="text-[12px] text-muted">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
