"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { AlertTriangle, LayoutGrid, Loader2, Rows3, SearchX, X } from "lucide-react";
import { FEATURE_LABEL, PROPERTY_TYPE_LABEL, SORT_OPTIONS } from "@/lib/constants";
import { formatArea, formatPriceStep, pluralise } from "@/lib/format";
import type { SearchFilters, SortKey } from "@/lib/types";
import { loadMore } from "@/hooks/use-listing-search";
import { useCollections } from "@/store/collections";
import { useSearch } from "@/store/search";
import { useSettings, type CardStyle } from "@/store/settings";
import { useUi } from "@/store/ui";
import { ListingCard } from "../listing/listing-card";
import { NativeSelect } from "../filters/filter-controls";
import { Button, Segmented } from "../ui/primitives";
import { MarketSnapshot } from "./market-snapshot";

const TYPE_NOUN = { Sale: "for sale", Rent: "for rent", Sold: "sold" } as const;

function activePills(f: SearchFilters, areaUnit: "sqm" | "ha" | "acres") {
  const pills: { key: string; label: string; clear: Partial<SearchFilters> }[] = [];
  const rent = f.listingType === "Rent";
  if (f.minPrice != null || f.maxPrice != null) {
    pills.push({
      key: "price",
      label:
        f.minPrice != null && f.maxPrice != null
          ? `${formatPriceStep(f.minPrice, false)}–${formatPriceStep(f.maxPrice, rent)}`
          : f.minPrice != null
            ? `${formatPriceStep(f.minPrice, rent)}+`
            : `≤ ${formatPriceStep(f.maxPrice!, rent)}`,
      clear: { minPrice: null, maxPrice: null },
    });
  }
  for (const t of f.propertyTypes) {
    pills.push({ key: `t${t}`, label: PROPERTY_TYPE_LABEL[t] ?? t, clear: { propertyTypes: f.propertyTypes.filter((x) => x !== t) } });
  }
  if (f.minBeds != null || f.maxBeds != null) {
    pills.push({
      key: "beds",
      label: f.minBeds != null && f.maxBeds != null ? `${f.minBeds}–${f.maxBeds} bed` : f.minBeds != null ? `${f.minBeds}+ bed` : `≤ ${f.maxBeds} bed`,
      clear: { minBeds: null, maxBeds: null },
    });
  }
  if (f.minBaths != null) pills.push({ key: "baths", label: `${f.minBaths}+ bath`, clear: { minBaths: null } });
  if (f.minCars != null) pills.push({ key: "cars", label: `${f.minCars}+ car`, clear: { minCars: null } });
  if (f.minLand != null || f.maxLand != null) {
    pills.push({
      key: "land",
      label: `Land ${f.minLand ? formatArea(f.minLand, areaUnit) : "0"}–${f.maxLand ? formatArea(f.maxLand, areaUnit) : "any"}`,
      clear: { minLand: null, maxLand: null },
    });
  }
  for (const x of f.features) {
    pills.push({ key: `f${x}`, label: FEATURE_LABEL[x] ?? x, clear: { features: f.features.filter((y) => y !== x) } });
  }
  if (f.keywords.trim()) pills.push({ key: "kw", label: `“${f.keywords.trim()}”`, clear: { keywords: "" } });
  if (f.established !== "Any") pills.push({ key: "est", label: f.established === "New" ? "New builds" : "Established", clear: { established: "Any" } });
  if (f.openHomesOnly) pills.push({ key: "open", label: "Open homes", clear: { openHomesOnly: false } });
  if (f.auctionsOnly) pills.push({ key: "auc", label: "Auctions", clear: { auctionsOnly: false } });
  if (f.excludeUnderOffer) pills.push({ key: "xuo", label: "No under offer", clear: { excludeUnderOffer: false } });
  if (f.excludePriceWithheld) pills.push({ key: "xpw", label: "Priced only", clear: { excludePriceWithheld: false } });
  if (f.hasFloorplan) pills.push({ key: "fp", label: "Floorplan", clear: { hasFloorplan: false } });
  if (f.hasVideo) pills.push({ key: "vid", label: "Video", clear: { hasVideo: false } });
  if (f.listedWithinDays) pills.push({ key: "days", label: `Listed ≤ ${f.listedWithinDays}d`, clear: { listedWithinDays: null } });
  return pills;
}

export function ResultsPanel() {
  const results = useSearch((s) => s.results);
  const total = useSearch((s) => s.total);
  const loading = useSearch((s) => s.loading);
  const loadingMore = useSearch((s) => s.loadingMore);
  const error = useSearch((s) => s.error);
  const warning = useSearch((s) => s.warning);
  const source = useSearch((s) => s.source);
  const filters = useSearch((s) => s.filters);
  const setFilters = useSearch((s) => s.setFilters);
  const resetFilters = useSearch((s) => s.resetFilters);
  const label = useSearch((s) => s.locationLabel);
  const polygon = useSearch((s) => s.polygon);
  const hidden = useCollections((s) => s.hidden);
  const cardStyle = useSettings((s) => s.cardStyle);
  const setSetting = useSettings((s) => s.set);
  const showSnapshot = useSettings((s) => s.showSnapshot);
  const areaUnit = useSettings((s) => s.areaUnit);
  const panelWidth = useSettings((s) => s.panelWidth);
  const layout = useSettings((s) => s.layout);
  const openPanel = useUi((s) => s.open);

  const visible = useMemo(() => {
    const h = new Set(hidden);
    return results.filter((l) => !h.has(l.id));
  }, [results, hidden]);
  const hiddenCount = results.length - visible.length;
  const pills = activePills(filters, areaUnit);
  const wide = layout === "list" || panelWidth >= 720;
  const grid = cardStyle === "grid";
  const cardLayout = grid ? "stack" : "row";

  const sortOptions = SORT_OPTIONS.filter((o) => !(filters.listingType === "Sold" && (o.value === "inspection" || o.value === "auction")))
    .filter((o) => !(filters.listingType === "Rent" && o.value === "auction"))
    .map((o) => ({ value: o.value, label: o.value === "newest" && filters.listingType === "Sold" ? "Recently sold" : o.label }));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-line bg-bg/80 px-4 pb-3 pt-3.5 backdrop-blur md:px-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-[19px] font-semibold tracking-[-0.02em]">
              {loading && !results.length ? (
                <span className="text-muted">Searching…</span>
              ) : (
                <>
                  <span className="tabular">{total.toLocaleString("en-AU")}</span> {total === 1 ? "home" : "homes"} {TYPE_NOUN[filters.listingType]}
                </>
              )}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted">
              {loading ? <Loader2 size={12} className="animate-spin" /> : null}
              {polygon ? "In your drawn area" : label ? `In and around ${label}` : "In the current map area"}
              {hiddenCount ? (
                <button className="underline decoration-line-strong underline-offset-2 hover:text-fg" onClick={() => openPanel("collections", "hidden")}>
                  · {hiddenCount} hidden
                </button>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NativeSelect
              ariaLabel="Sort results"
              className="w-[172px]"
              value={filters.sort}
              onChange={(v) => setFilters({ sort: v as SortKey })}
              options={sortOptions}
            />
            <Segmented<CardStyle>
              ariaLabel="Card layout"
              size="sm"
              value={cardStyle}
              onChange={(v) => setSetting("cardStyle", v)}
              options={[
                { value: "list", label: <Rows3 size={14} />, title: "List" },
                { value: "grid", label: <LayoutGrid size={14} />, title: "Grid" },
              ]}
            />
          </div>
        </div>
        {pills.length ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {pills.map((p) => (
              <button
                key={p.key}
                onClick={() => setFilters(p.clear)}
                className="group inline-flex h-6 items-center gap-1 rounded-md bg-surface-2 pl-2 pr-1 text-[12px] font-medium text-fg-2 ring-1 ring-inset ring-line hover:text-fg"
              >
                {p.label}
                <X size={12} className="text-muted group-hover:text-fg" />
              </button>
            ))}
            {pills.length > 1 ? (
              <button onClick={resetFilters} className="h-6 px-1.5 text-[12px] font-medium text-muted hover:text-fg">
                Clear all
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
        {warning ? (
          <Notice tone="warn">{warning}</Notice>
        ) : source === "demo" ? (
          <Notice tone="info">
            <strong className="font-semibold text-fg">Demo listings.</strong> Add <code className="rounded bg-surface-3 px-1 font-mono text-[11.5px]">DOMAIN_API_KEY</code> or OAuth
            client credentials to load live properties from the Domain API.
          </Notice>
        ) : null}
        {error ? <Notice tone="warn">{error}</Notice> : null}

        {showSnapshot && visible.length ? (
          <div className="mb-4">
            <MarketSnapshot listings={visible} type={filters.listingType} />
          </div>
        ) : null}

        {loading && !results.length ? (
          <div className={clsx("grid gap-3", grid && (wide ? "grid-cols-2 xl:grid-cols-3" : "grid-cols-2"))}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={clsx("overflow-hidden rounded-xl border border-line bg-surface", grid ? "" : "flex")}>
                <div className={clsx("skeleton", grid ? "aspect-[3/2]" : "h-[160px] w-[44%]")} />
                <div className="flex-1 space-y-2 p-3.5">
                  <div className="skeleton h-5 w-2/5 rounded" />
                  <div className="skeleton h-4 w-4/5 rounded" />
                  <div className="skeleton h-4 w-3/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length ? (
          <>
            <div
              className={clsx(
                "grid gap-3 transition-opacity",
                loading && "opacity-60",
                grid ? (wide ? "grid-cols-2 xl:grid-cols-3" : "grid-cols-1 sm:grid-cols-2") : wide ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1",
              )}
            >
              {visible.map((l) => (
                <ListingCard key={l.id} listing={l} layout={cardLayout} />
              ))}
            </div>
            <div className="py-6 text-center">
              {results.length < total ? (
                <Button onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
                  Show more ({Math.min(100, total - results.length)} of {(total - results.length).toLocaleString("en-AU")} remaining)
                </Button>
              ) : (
                <p className="text-[12.5px] text-muted">
                  That&rsquo;s everything in this area. Zoom out or move the map to see more.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="mx-auto flex max-w-sm flex-col items-center py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted ring-1 ring-line">
              <SearchX size={20} />
            </span>
            <h2 className="mt-4 text-[16px] font-semibold">No homes match here</h2>
            <p className="mt-1 text-[13.5px] text-muted">
              Try zooming out, moving the map, or loosening a filter{pills.length ? ` — you have ${pluralise(pills.length, "filter")} on` : ""}.
            </p>
            {pills.length ? (
              <Button className="mt-4" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function Notice({ tone, children }: { tone: "info" | "warn"; children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        "mb-4 flex gap-2.5 rounded-xl border px-3.5 py-2.5 text-[12.5px] leading-relaxed",
        tone === "warn" ? "border-[#f5d08a] bg-[#fffaeb] text-[#7a4b06] dark:border-[#5c4512] dark:bg-[#2a2210] dark:text-[#f5d08a]" : "border-line bg-surface text-fg-2",
      )}
    >
      {tone === "warn" ? <AlertTriangle size={15} className="mt-0.5 shrink-0" /> : null}
      <div>{children}</div>
    </div>
  );
}
