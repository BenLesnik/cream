"use client";

import { ArrowUpRight, X } from "lucide-react";
import { PROPERTY_TYPE_LABEL } from "@/lib/constants";
import { nextInspection } from "@/lib/format";
import { useCollections } from "@/store/collections";
import { useSearch } from "@/store/search";
import { Carousel, Facts, SaveButton } from "../listing/parts";

export function MapPreviewCard() {
  const previewId = useSearch((s) => s.previewId);
  const listing = useSearch((s) => (s.previewId ? s.results.find((l) => l.id === s.previewId) : undefined));
  if (!previewId || !listing) return null;

  const open = () => {
    useSearch.getState().select(listing.id);
    useCollections.getState().markViewed(listing.id);
  };
  const inspection = nextInspection(listing);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-4">
      <div
        key={listing.id}
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => e.key === "Enter" && open()}
        className="pointer-events-auto flex w-full max-w-[440px] cursor-pointer overflow-hidden rounded-2xl border border-line bg-surface shadow-lg animate-slide-up"
      >
        <div className="relative w-[150px] shrink-0">
          <Carousel images={listing.images} alt={listing.address.display} className="h-full min-h-[132px] w-full" rounded="rounded-none" sizes="sm" />
          <SaveButton listing={listing} className="absolute left-2 top-2" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[16px] font-semibold tracking-tight tabular">{listing.displayPrice}</div>
              <div className="truncate text-[13px] text-fg-2">{listing.address.display}</div>
            </div>
            <button
              type="button"
              aria-label="Close preview"
              onClick={(e) => {
                e.stopPropagation();
                useSearch.getState().preview(null);
              }}
              className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
            >
              <X size={15} />
            </button>
          </div>
          <Facts listing={listing} size="sm" />
          <div className="truncate text-[12px] text-muted">
            {PROPERTY_TYPE_LABEL[listing.propertyType] ?? listing.propertyType}
            {inspection ? ` · Open ${inspection}` : ""}
          </div>
          <div className="mt-auto inline-flex items-center gap-1 text-[12.5px] font-medium text-accent">
            View details <ArrowUpRight size={13} />
          </div>
        </div>
      </div>
    </div>
  );
}
