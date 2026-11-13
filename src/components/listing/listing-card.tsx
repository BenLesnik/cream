"use client";

import { memo } from "react";
import clsx from "clsx";
import { CalendarClock, EyeOff, Gavel, GitCompareArrows, Video } from "lucide-react";
import { PROPERTY_TYPE_LABEL } from "@/lib/constants";
import { formatDate, formatInspection, formatShortDate, nextInspection, relativeDays } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { MAX_COMPARE, useCollections } from "@/store/collections";
import { useSearch } from "@/store/search";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { Tooltip } from "../ui/primitives";
import { AgencyMark, Badge, Carousel, Facts, SaveButton } from "./parts";

export function statusBadges(l: Listing) {
  const out: { label: string; tone: "neutral" | "accent" | "dark" | "warn" }[] = [];
  if (l.listingType === "Sold" && l.soldDate) out.push({ label: `Sold ${formatDate(l.soldDate)}`, tone: "dark" });
  if (l.underOffer) out.push({ label: "Under offer", tone: "warn" });
  if (l.labels.includes("Just listed")) out.push({ label: "Just listed", tone: "accent" });
  else if (l.isNew) out.push({ label: "New build", tone: "neutral" });
  if (l.auction && l.listingType === "Sale") {
    out.push({ label: `Auction ${formatShortDate(l.auction)}`, tone: "neutral" });
  }
  return out.slice(0, 2);
}

function ListingCardImpl({ listing, layout }: { listing: Listing; layout: "row" | "stack" }) {
  const density = useSettings((s) => s.density);
  const showSuburb = useSettings((s) => s.showSuburbOnCards);
  const autoplay = useSettings((s) => s.autoplayGallery);
  const dimViewed = useSettings((s) => s.dimViewed);
  const isActive = useSearch((s) => s.hoveredId === listing.id || s.previewId === listing.id);
  const viewed = useCollections((s) => s.viewed.includes(listing.id));
  const inCompare = useCollections((s) => s.compare.includes(listing.id));
  const compareFull = useCollections((s) => s.compare.length >= MAX_COMPARE);
  const toggleCompare = useCollections((s) => s.toggleCompare);
  const hide = useCollections((s) => s.hide);
  const notify = useUi((s) => s.notify);

  const open = () => {
    useSearch.getState().select(listing.id);
    useCollections.getState().markViewed(listing.id);
  };
  const inspection = nextInspection(listing);
  const listed = relativeDays(listing.dateListed);
  const badges = statusBadges(listing);
  const compact = density === "compact";
  const row = layout === "row";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open())}
      onMouseEnter={() => useSearch.getState().setHovered(listing.id)}
      onMouseLeave={() => useSearch.getState().setHovered(null)}
      className={clsx(
        "group relative cursor-pointer rounded-xl border bg-surface text-left outline-none transition-[border-color,box-shadow] duration-150",
        isActive ? "border-fg/40 shadow-md" : "border-line hover:border-line-strong hover:shadow-sm",
        "focus-visible:border-accent",
        row ? "flex gap-0" : "flex flex-col",
      )}
    >
      <div
        className={clsx(
          "relative shrink-0",
          row ? (compact ? "w-[38%] min-w-[150px]" : "w-[44%] min-w-[180px]") : compact ? "aspect-[16/9]" : "aspect-[3/2]",
        )}
      >
        <Carousel
          images={listing.images}
          alt={listing.address.display}
          className={row ? "h-full min-h-[148px] w-full" : "h-full w-full"}
          rounded={row ? "rounded-l-[11px]" : "rounded-t-[11px]"}
          sizes={compact ? "sm" : "md"}
          autoplay={autoplay}
        />
        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
          {badges.map((b) => (
            <Badge key={b.label} tone={b.tone}>
              {b.label}
            </Badge>
          ))}
        </div>
        <SaveButton listing={listing} className="absolute right-2 top-2" />
        {listing.hasVideo ? (
          <span className="pointer-events-none absolute bottom-2 left-2 grid h-6 w-6 place-items-center rounded-md bg-black/45 text-white">
            <Video size={13} />
          </span>
        ) : null}
      </div>

      <div className={clsx("flex min-w-0 flex-1 flex-col", compact ? "gap-1.5 p-3" : "gap-2 p-3.5")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div
              className={clsx(
                "truncate font-semibold tracking-[-0.015em] tabular text-fg",
                compact ? "text-[15px]" : "text-[17px]",
              )}
            >
              {listing.displayPrice}
            </div>
            <div className={clsx("truncate text-fg-2", compact ? "text-[13px]" : "text-[13.5px]")}>
              {listing.address.street || listing.address.display}
              {showSuburb && listing.address.suburb ? (
                <span className="text-muted">
                  {listing.address.street ? ", " : ""}
                  {listing.address.suburb}
                </span>
              ) : null}
            </div>
          </div>
          {viewed && dimViewed ? (
            <span className="mt-1 shrink-0 text-[11px] font-medium uppercase tracking-wider text-muted">Viewed</span>
          ) : null}
        </div>

        <Facts listing={listing} size={compact ? "sm" : "md"} />

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
          <span>{PROPERTY_TYPE_LABEL[listing.propertyType] ?? listing.propertyType}</span>
          {inspection && listing.listingType !== "Sold" ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 text-fg-2">
                <CalendarClock size={12.5} /> Open {inspection}
              </span>
            </>
          ) : listing.auction && listing.listingType === "Sale" ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 text-fg-2">
                <Gavel size={12.5} /> {formatInspection(listing.auction)}
              </span>
            </>
          ) : listed && listing.listingType !== "Sold" ? (
            <>
              <span aria-hidden>·</span>
              <span>Listed {listed.toLowerCase()}</span>
            </>
          ) : null}
        </div>

        {!compact || !row ? (
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <AgencyMark listing={listing} size={22} />
              <span className="truncate text-[12.5px] text-fg-2">
                {listing.agents[0]?.name ? `${listing.agents[0].name} · ` : ""}
                <span className="text-muted">{listing.agency.name}</span>
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
              <Tooltip label={inCompare ? "Remove from compare" : compareFull ? `Compare up to ${MAX_COMPARE}` : "Add to compare"}>
                <button
                  type="button"
                  aria-label="Toggle compare"
                  aria-pressed={inCompare}
                  disabled={!inCompare && compareFull}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCompare(listing);
                  }}
                  className={clsx(
                    "grid h-7 w-7 place-items-center rounded-md transition-colors disabled:opacity-40",
                    inCompare ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <GitCompareArrows size={14} />
                </button>
              </Tooltip>
              <Tooltip label="Hide this listing">
                <button
                  type="button"
                  aria-label="Hide listing"
                  onClick={(e) => {
                    e.stopPropagation();
                    hide(listing.id);
                    notify("Listing hidden. Manage hidden homes in Saved.");
                  }}
                  className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  <EyeOff size={14} />
                </button>
              </Tooltip>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export const ListingCard = memo(ListingCardImpl);
