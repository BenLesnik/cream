"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { BellPlus, ChevronDown, Heart, Settings2, SlidersHorizontal } from "lucide-react";
import { PROPERTY_TYPE_LABEL } from "@/lib/constants";
import { formatPriceStep } from "@/lib/format";
import type { ListingType, SearchFilters } from "@/lib/types";
import { countActiveFilters } from "@/lib/url-state";
import { useCollections } from "@/store/collections";
import { useSearch } from "@/store/search";
import { useUi } from "@/store/ui";
import { BedsEditor, PriceRange, PropertyTypeEditor } from "../filters/filter-controls";
import { Button, Chip, PopoverClose, PopoverPanel, Segmented, Tooltip } from "../ui/primitives";
import { LocationSearch } from "./location-search";

export function Brand() {
  return (
    <Link href="/" className="flex shrink-0 items-baseline gap-0.5 text-fg" aria-label="Kerb home">
      <span className="font-display text-[27px] leading-none tracking-[-0.01em]">Kerb</span>
      <span className="h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-accent" />
    </Link>
  );
}

const FilterTrigger = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; children: ReactNode }>(
  function FilterTrigger({ active, children, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={clsx(
          "inline-flex h-8 shrink-0 items-center gap-1 rounded-full border pl-3 pr-2 text-[13px] font-medium transition-colors data-[state=open]:border-fg/60",
          active ? "border-fg bg-fg text-bg" : "border-line bg-surface text-fg-2 hover:border-line-strong hover:text-fg",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown size={14} className="opacity-60" />
      </button>
    );
  },
);

function priceLabel(f: SearchFilters) {
  const rent = f.listingType === "Rent";
  if (f.minPrice != null && f.maxPrice != null) return `${formatPriceStep(f.minPrice, false)} – ${formatPriceStep(f.maxPrice, rent)}`;
  if (f.minPrice != null) return `${formatPriceStep(f.minPrice, rent)}+`;
  if (f.maxPrice != null) return `Up to ${formatPriceStep(f.maxPrice, rent)}`;
  return rent ? "Rent" : "Price";
}

function bedsLabel(f: SearchFilters) {
  const b = (n: number) => (n === 0 ? "Studio" : String(n));
  let s = "";
  if (f.minBeds != null && f.maxBeds != null) s = f.minBeds === f.maxBeds ? `${b(f.minBeds)} bed` : `${b(f.minBeds)}–${f.maxBeds} beds`;
  else if (f.minBeds != null) s = `${b(f.minBeds)}+ beds`;
  else if (f.maxBeds != null) s = `Up to ${f.maxBeds} beds`;
  const extras = [f.minBaths != null && `${f.minBaths}+ bath`, f.minCars != null && `${f.minCars}+ car`].filter(Boolean);
  if (!s && !extras.length) return "Beds & baths";
  return [s, ...extras].filter(Boolean).join(", ");
}

function typeLabel(f: SearchFilters) {
  if (!f.propertyTypes.length) return "Property type";
  if (f.propertyTypes.length === 1) return PROPERTY_TYPE_LABEL[f.propertyTypes[0]] ?? f.propertyTypes[0];
  return `${f.propertyTypes.length} types`;
}

function PopoverFooter({ onClear, disabled }: { onClear: () => void; disabled: boolean }) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
      <Button size="sm" variant="ghost" onClick={onClear} disabled={disabled}>
        Clear
      </Button>
      <PopoverClose asChild>
        <Button size="sm" variant="primary">
          Done
        </Button>
      </PopoverClose>
    </div>
  );
}

export function Header() {
  const f = useSearch((s) => s.filters);
  const setFilters = useSearch((s) => s.setFilters);
  const open = useUi((s) => s.open);
  const shortlistCount = useCollections((s) => Object.keys(s.shortlist).length);
  const active = countActiveFilters(f);

  return (
    <header className="relative z-30 shrink-0 border-b border-line bg-surface">
      <div className="flex h-[60px] items-center gap-3 px-3 md:gap-5 md:px-5">
        <Brand />
        <div className="hidden sm:block">
          <Segmented<ListingType>
            ariaLabel="Listing type"
            value={f.listingType}
            onChange={(v) => setFilters({ listingType: v })}
            options={[
              { value: "Sale", label: "Buy" },
              { value: "Rent", label: "Rent" },
              { value: "Sold", label: "Sold" },
            ]}
          />
        </div>
        <div className="min-w-0 flex-1 md:max-w-[520px]">
          <LocationSearch />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="hidden lg:contents">
            <Tooltip label="Save this search">
              <Button variant="ghost" size="md" onClick={() => open("save")}>
                <BellPlus size={16} /> Save search
              </Button>
            </Tooltip>
          </span>
          <Tooltip label="Shortlist & saved searches">
            <Button variant="ghost" size="md" onClick={() => open("collections", "shortlist")} aria-label="Shortlist">
              <Heart size={16} className={shortlistCount ? "fill-accent text-accent" : ""} />
              <span className="hidden md:inline">Saved</span>
              {shortlistCount ? (
                <span className="rounded-full bg-accent-soft px-1.5 text-[11.5px] font-semibold text-accent tabular">{shortlistCount}</span>
              ) : null}
            </Button>
          </Tooltip>
          <Tooltip label="Customise">
            <Button variant="ghost" size="icon" onClick={() => open("settings")} aria-label="Customise">
              <Settings2 size={17} />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="flex h-12 items-center gap-2 overflow-x-auto border-t border-line px-3 [scrollbar-width:none] md:px-5">
        <div className="shrink-0 sm:hidden">
          <Segmented<ListingType>
            ariaLabel="Listing type"
            size="sm"
            value={f.listingType}
            onChange={(v) => setFilters({ listingType: v })}
            options={[
              { value: "Sale", label: "Buy" },
              { value: "Rent", label: "Rent" },
              { value: "Sold", label: "Sold" },
            ]}
          />
        </div>
        <PopoverPanel
          className="w-[340px]"
          trigger={<FilterTrigger active={f.minPrice != null || f.maxPrice != null}>{priceLabel(f)}</FilterTrigger>}
        >
          <div className="mb-3 text-[14px] font-semibold">{f.listingType === "Rent" ? "Weekly rent" : "Price range"}</div>
          <PriceRange />
          <PopoverFooter onClear={() => setFilters({ minPrice: null, maxPrice: null })} disabled={f.minPrice == null && f.maxPrice == null} />
        </PopoverPanel>
        <PopoverPanel
          className="w-[360px]"
          trigger={
            <FilterTrigger active={f.minBeds != null || f.maxBeds != null || f.minBaths != null || f.minCars != null}>
              {bedsLabel(f)}
            </FilterTrigger>
          }
        >
          <BedsEditor />
          <PopoverFooter
            onClear={() => setFilters({ minBeds: null, maxBeds: null, minBaths: null, minCars: null })}
            disabled={f.minBeds == null && f.maxBeds == null && f.minBaths == null && f.minCars == null}
          />
        </PopoverPanel>
        <PopoverPanel className="w-[380px]" trigger={<FilterTrigger active={f.propertyTypes.length > 0}>{typeLabel(f)}</FilterTrigger>}>
          <PropertyTypeEditor />
          <PopoverFooter onClear={() => setFilters({ propertyTypes: [] })} disabled={!f.propertyTypes.length} />
        </PopoverPanel>

        <span className="mx-1 h-5 w-px shrink-0 bg-line" />

        {f.listingType !== "Sold" ? (
          <Chip active={f.openHomesOnly} onClick={() => setFilters({ openHomesOnly: !f.openHomesOnly })} className="shrink-0">
            Open homes
          </Chip>
        ) : null}
        {f.listingType === "Sale" ? (
          <>
            <Chip active={f.auctionsOnly} onClick={() => setFilters({ auctionsOnly: !f.auctionsOnly })} className="shrink-0">
              Auctions
            </Chip>
            <Chip active={f.excludeUnderOffer} onClick={() => setFilters({ excludeUnderOffer: !f.excludeUnderOffer })} className="shrink-0">
              Hide under offer
            </Chip>
          </>
        ) : null}
        <Chip
          active={f.features.includes("SwimmingPool")}
          onClick={() =>
            setFilters({
              features: f.features.includes("SwimmingPool") ? f.features.filter((x) => x !== "SwimmingPool") : [...f.features, "SwimmingPool"],
            })
          }
          className="shrink-0"
        >
          Pool
        </Chip>
        <Chip
          active={f.features.includes("PetsAllowed")}
          onClick={() =>
            setFilters({
              features: f.features.includes("PetsAllowed") ? f.features.filter((x) => x !== "PetsAllowed") : [...f.features, "PetsAllowed"],
            })
          }
          className="shrink-0"
        >
          Pets allowed
        </Chip>
        <Chip
          active={f.established === "New"}
          onClick={() => setFilters({ established: f.established === "New" ? "Any" : "New" })}
          className="shrink-0"
        >
          New builds
        </Chip>

        <button
          type="button"
          onClick={() => open("filters")}
          className={clsx(
            "ml-1 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
            active ? "border-fg text-fg" : "border-line text-fg-2 hover:border-line-strong hover:text-fg",
          )}
        >
          <SlidersHorizontal size={14} />
          All filters
          {active ? <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-fg px-1 text-[11px] text-bg tabular">{active}</span> : null}
        </button>
      </div>
    </header>
  );
}
