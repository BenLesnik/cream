"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Dialog } from "radix-ui";
import {
  ArrowUpRight,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  GitCompareArrows,
  Grid2x2,
  Link2,
  Mail,
  MapPinned,
  Phone,
  X,
} from "lucide-react";
import { FEATURE_LABEL, PROPERTY_TYPE_LABEL } from "@/lib/constants";
import { formatArea, formatDate, formatInspection, formatMoney, relativeDays } from "@/lib/format";
import type { Listing, TimeSlot } from "@/lib/types";
import { MAX_COMPARE, useCollections } from "@/store/collections";
import { useSearch } from "@/store/search";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { Button, Tooltip } from "../ui/primitives";
import { statusBadges } from "./listing-card";
import { MortgageCalculator, RentCalculator } from "./finance";
import { AgencyMark, Badge, Facts, SaveButton, sizedImage } from "./parts";

function useListing(id: string | null) {
  const fromResults = useSearch((s) => (id ? s.results.find((l) => l.id === id) : undefined));
  const fromShortlist = useCollections((s) => (id ? s.shortlist[id] ?? s.compareCache[id] : undefined));
  const [fetched, setFetched] = useState<{ id: string; listing: Listing | null } | null>(null);

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    fetch(`/api/listings/${encodeURIComponent(id)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((listing) => setFetched({ id, listing }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [id]);

  const base = fromResults ?? fromShortlist;
  const full = fetched?.id === id ? fetched.listing : null;
  if (!base && !full) return { listing: null, loading: !fetched || fetched.id !== id };
  return { listing: { ...(base ?? full!), ...(full ?? {}) } as Listing, loading: false };
}

function icsFor(listing: Listing, slot: TimeSlot, kind: "Inspection" | "Auction") {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(slot.start);
  const end = slot.end ? new Date(slot.end) : new Date(start.getTime() + 30 * 60_000);
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kerb//Property search//EN",
    "BEGIN:VEVENT",
    `UID:${listing.id}-${start.getTime()}@kerb`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${kind}: ${listing.address.street || listing.address.display}`,
    `LOCATION:${listing.address.display.replace(/,/g, "\\,")}`,
    `DESCRIPTION:${listing.displayPrice}${listing.url ? ` — ${listing.url}` : ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([body], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${kind.toLowerCase()}-${listing.address.suburb.toLowerCase().replace(/\s+/g, "-")}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function ListingDrawer() {
  const selectedId = useSearch((s) => s.selectedId);
  const select = useSearch((s) => s.select);
  const { listing, loading } = useListing(selectedId);

  return (
    <Dialog.Root open={Boolean(selectedId)} onOpenChange={(o) => !o && select(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/25 animate-fade-in dark:bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed bottom-0 right-0 top-0 z-[71] flex w-[min(800px,100vw)] flex-col border-l border-line bg-surface text-fg shadow-lg outline-none animate-slide-in-right"
        >
          {listing ? (
            <ListingDetail key={listing.id} listing={listing} />
          ) : (
            <div className="flex h-full flex-col">
              <Dialog.Title className="sr-only">Loading listing</Dialog.Title>
              <div className="flex justify-end p-3">
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Close">
                    <X size={16} />
                  </Button>
                </Dialog.Close>
              </div>
              <div className="grid flex-1 place-items-center text-[13px] text-muted">
                {loading ? "Loading listing…" : "This listing is no longer available."}
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ListingDetail({ listing }: { listing: Listing }) {
  const priceFormat = useSettings((s) => s.priceFormat);
  const inCompare = useCollections((s) => s.compare.includes(listing.id));
  const compareFull = useCollections((s) => s.compare.length >= MAX_COMPARE);
  const toggleCompare = useCollections((s) => s.toggleCompare);
  const hide = useCollections((s) => s.hide);
  const note = useCollections((s) => s.shortlist[listing.id]?.note);
  const saved = useCollections((s) => Boolean(s.shortlist[listing.id]));
  const setNote = useCollections((s) => s.setNote);
  const notify = useUi((s) => s.notify);
  const results = useSearch((s) => s.results);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [now] = useState(() => Date.now());

  const badges = statusBadges(listing);
  const upcoming = listing.inspections.filter((i) => new Date(i.end ?? i.start).getTime() > now);
  const isLand = listing.propertyType === "VacantLand";
  const perSqm = listing.price && listing.listingType !== "Rent" && (listing.landArea || listing.buildingArea)
    ? listing.price / (listing.buildingArea && !listing.landArea ? listing.buildingArea : listing.landArea!)
    : null;

  const similar = useMemo(() => {
    if (!listing.price) return [];
    return results
      .filter((l) => l.id !== listing.id && l.price && Math.abs(l.price - listing.price!) / listing.price! < 0.25)
      .map((l) => ({ l, d: Math.hypot(l.lat - listing.lat, (l.lng - listing.lng) * Math.cos((listing.lat * Math.PI) / 180)) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 4)
      .map((x) => x.l);
  }, [results, listing]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify("Link copied");
    } catch {
      notify("Couldn't copy the link");
    }
  };

  const showOnMap = () => {
    useSearch.getState().select(null);
    useSearch.getState().flyTo({ lat: listing.lat, lng: listing.lng, zoom: 16 });
    setTimeout(() => useSearch.getState().preview(listing.id), 950);
  };

  const images = listing.images;
  const paragraphs = listing.description.split(/\n{2,}|\r\n\r\n/).filter(Boolean);
  const longDescription = listing.description.length > 520;

  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line px-3">
        <div className="flex items-center gap-1">
          <Dialog.Close asChild>
            <Button variant="ghost" size="sm" aria-label="Back to results">
              <ChevronLeft size={16} /> Results
            </Button>
          </Dialog.Close>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip label="Copy link">
            <Button variant="ghost" size="icon-sm" onClick={copyLink} aria-label="Copy link">
              <Link2 size={16} />
            </Button>
          </Tooltip>
          <Tooltip label="Show on map">
            <Button variant="ghost" size="icon-sm" onClick={showOnMap} aria-label="Show on map">
              <MapPinned size={16} />
            </Button>
          </Tooltip>
          <Tooltip label={inCompare ? "Remove from compare" : "Add to compare"}>
            <Button
              variant="ghost"
              size="icon-sm"
              active={inCompare}
              disabled={!inCompare && compareFull}
              onClick={() => toggleCompare(listing)}
              aria-label="Toggle compare"
            >
              <GitCompareArrows size={16} />
            </Button>
          </Tooltip>
          <Tooltip label="Hide from results">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                hide(listing.id);
                useSearch.getState().select(null);
                notify("Listing hidden");
              }}
              aria-label="Hide listing"
            >
              <EyeOff size={16} />
            </Button>
          </Tooltip>
          <SaveButton listing={listing} variant="plain" className="ml-1 h-8 w-8 rounded-lg" />
          <Dialog.Close asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close" className="ml-1">
              <X size={16} />
            </Button>
          </Dialog.Close>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Gallery */}
        <div className="p-3 pb-0">
          {images.length ? (
            <div className={clsx("grid gap-1.5 overflow-hidden rounded-xl", images.length >= 3 ? "grid-cols-[2fr_1fr] grid-rows-2" : "grid-cols-1")} style={{ height: 380 }}>
              {images.slice(0, images.length >= 3 ? 3 : 1).map((src, i) => (
                <button
                  key={src}
                  onClick={() => setLightbox(i)}
                  className={clsx("group relative overflow-hidden bg-surface-2", i === 0 && images.length >= 3 && "row-span-2")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sizedImage(src, i === 0 ? "lg" : "md")}
                    alt={`${listing.address.display} photo ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  {i === 2 && images.length > 3 ? (
                    <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[12.5px] font-medium text-[#1a1917] shadow-sm">
                      <Grid2x2 size={13} /> All {images.length} photos
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid h-[220px] place-items-center rounded-xl bg-surface-2 text-[13px] text-muted">No photos</div>
          )}
        </div>

        <div className="px-6 pb-10 pt-5">
          {/* Heading */}
          {badges.length ? (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <Badge key={b.label} tone={b.tone === "neutral" ? "dark" : b.tone}>
                  {b.label}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="text-[26px] font-semibold leading-tight tracking-[-0.025em] tabular">{listing.displayPrice}</div>
          <Dialog.Title className="mt-1 font-display text-[30px] leading-[1.1] tracking-[-0.01em] text-fg">
            {listing.address.street || listing.address.display}
          </Dialog.Title>
          <div className="mt-0.5 text-[14px] text-muted">
            {[listing.address.suburb, listing.address.state, listing.address.postcode].filter(Boolean).join(" ")}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-line py-4">
            <Facts listing={listing} size="lg" />
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
              <span>{PROPERTY_TYPE_LABEL[listing.propertyType] ?? listing.propertyType}</span>
              {listing.landArea && listing.buildingArea ? <span>{formatArea(listing.buildingArea, "sqm")} internal</span> : null}
              {perSqm ? <span className="tabular">{formatMoney(perSqm, "full")}/m²</span> : null}
              {listing.dateListed && listing.listingType !== "Sold" ? <span>Listed {relativeDays(listing.dateListed)?.toLowerCase()}</span> : null}
            </div>
          </div>

          {/* Key dates */}
          {upcoming.length || listing.auction || listing.soldDate ? (
            <Block title={listing.listingType === "Sold" ? "Sale" : "Inspections & auction"}>
              <div className="grid gap-2 sm:grid-cols-2">
                {listing.soldDate ? (
                  <DateTile label="Sold" value={formatDate(listing.soldDate)} sub={listing.price ? formatMoney(listing.price, priceFormat) : "Price withheld"} />
                ) : null}
                {listing.auction && listing.listingType === "Sale" ? (
                  <DateTile label="Auction" value={formatInspection(listing.auction)} onAdd={() => icsFor(listing, { start: listing.auction! }, "Auction")} />
                ) : null}
                {upcoming.slice(0, 4).map((slot) => (
                  <DateTile key={slot.start} label="Open home" value={formatInspection(slot.start, slot.end)} onAdd={() => icsFor(listing, slot, "Inspection")} />
                ))}
              </div>
            </Block>
          ) : null}

          {/* Description */}
          <Block title={listing.headline || "About this property"}>
            <div className={clsx("relative space-y-3 text-[14.5px] leading-[1.65] text-fg-2", !expanded && longDescription && "max-h-[220px] overflow-hidden")}>
              {paragraphs.length ? paragraphs.map((p, i) => <p key={i}>{p}</p>) : <p className="text-muted">No description provided.</p>}
              {!expanded && longDescription ? <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface to-transparent" /> : null}
            </div>
            {longDescription ? (
              <button onClick={() => setExpanded((e) => !e)} className="mt-2 text-[13.5px] font-medium text-accent hover:underline">
                {expanded ? "Show less" : "Read more"}
              </button>
            ) : null}
          </Block>

          {listing.features.length ? (
            <Block title="Features">
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                {listing.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13.5px] text-fg-2">
                    <span className="h-1 w-1 rounded-full bg-accent" />
                    {FEATURE_LABEL[f] ?? f.replace(/([a-z])([A-Z])/g, "$1 $2")}
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}

          {!isLand && listing.listingType === "Sale" ? (
            <Block title="Repayments & costs">
              <MortgageCalculator listing={listing} />
            </Block>
          ) : listing.listingType === "Rent" ? (
            <Block title="Rent breakdown">
              <RentCalculator listing={listing} />
            </Block>
          ) : null}

          {/* Agent */}
          <Block title="Agent">
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="flex h-12 items-center gap-3 px-4" style={{ background: listing.agency.colour ?? "var(--surface-2)" }}>
                <AgencyMark listing={listing} size={26} />
                <span className={clsx("text-[13.5px] font-semibold", listing.agency.colour ? "text-white" : "text-fg")}>{listing.agency.name}</span>
              </div>
              <div className="divide-y divide-line">
                {(listing.agents.length ? listing.agents : [{ name: listing.agency.name }]).map((a) => (
                  <div key={a.name} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                      {a.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.photo} alt={a.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-3 text-[13px] font-semibold text-fg-2">
                          {a.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                      )}
                      <div className="text-[14px] font-medium">{a.name}</div>
                    </div>
                    <div className="flex gap-1.5">
                      {"phone" in a && a.phone ? (
                        showPhone ? (
                          <a href={`tel:${a.phone.replace(/\s/g, "")}`}>
                            <Button size="sm">
                              <Phone size={14} /> {a.phone}
                            </Button>
                          </a>
                        ) : (
                          <Button size="sm" onClick={() => setShowPhone(true)}>
                            <Phone size={14} /> Call
                          </Button>
                        )
                      ) : null}
                      {"email" in a && a.email ? (
                        <a href={`mailto:${a.email}?subject=${encodeURIComponent(`Enquiry: ${listing.address.display}`)}`}>
                          <Button size="sm" variant="primary">
                            <Mail size={14} /> Enquire
                          </Button>
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {listing.url ? (
              <a href={listing.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-medium text-accent hover:underline">
                View full listing on Domain <ArrowUpRight size={14} />
              </a>
            ) : null}
          </Block>

          {saved ? (
            <Block title="Your notes">
              <textarea
                defaultValue={note ?? ""}
                onBlur={(e) => setNote(listing.id, e.target.value)}
                placeholder="Thoughts after the inspection, questions for the agent…"
                rows={3}
                className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-[14px] outline-none placeholder:text-muted focus:border-fg/50"
              />
            </Block>
          ) : null}

          {similar.length ? (
            <Block title="Similar homes nearby">
              <div className="grid grid-cols-2 gap-3">
                {similar.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      useSearch.getState().select(l.id);
                      useCollections.getState().markViewed(l.id);
                    }}
                    className="group overflow-hidden rounded-xl border border-line text-left hover:border-line-strong"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-surface-2">
                      {l.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sizedImage(l.images[0], "sm")} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : null}
                    </div>
                    <div className="p-2.5">
                      <div className="truncate text-[14px] font-semibold tabular">{l.displayPrice}</div>
                      <div className="truncate text-[12.5px] text-muted">{l.address.street}, {l.address.suburb}</div>
                      <Facts listing={l} size="sm" className="mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </Block>
          ) : null}
        </div>
      </div>

      {lightbox != null ? <Lightbox images={images} index={lightbox} onIndex={setLightbox} alt={listing.address.display} /> : null}
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="mb-3 text-[16px] font-semibold tracking-[-0.01em]">{title}</h3>
      {children}
    </section>
  );
}

function DateTile({ label, value, sub, onAdd }: { label: string; value: string; sub?: string; onAdd?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5">
      <div>
        <div className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
        <div className="text-[14px] font-medium tabular">{value}</div>
        {sub ? <div className="text-[12.5px] text-muted">{sub}</div> : null}
      </div>
      {onAdd ? (
        <Tooltip label="Add to calendar">
          <Button variant="ghost" size="icon-sm" onClick={onAdd} aria-label="Add to calendar">
            <CalendarPlus size={16} />
          </Button>
        </Tooltip>
      ) : null}
    </div>
  );
}

function Lightbox({ images, index, onIndex, alt }: { images: string[]; index: number; onIndex: (i: number | null) => void; alt: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
      if (e.key === "Escape") {
        e.stopPropagation();
        onIndex(null);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [index, images.length, onIndex]);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-[#0b0b0a]/96 text-white animate-fade-in" role="dialog" aria-label="Photo viewer">
      <div className="flex h-14 items-center justify-between px-4">
        <span className="text-[13px] tabular text-white/70">
          {index + 1} / {images.length}
        </span>
        <button onClick={() => onIndex(null)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10" aria-label="Close photos">
          <X size={18} />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={images[index]} src={sizedImage(images[index], "lg")} alt={`${alt} photo ${index + 1}`} className="max-h-full max-w-full rounded-md object-contain animate-fade-in" />
        <button
          onClick={() => onIndex((index - 1 + images.length) % images.length)}
          className="absolute left-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Previous photo"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => onIndex((index + 1) % images.length)}
          className="absolute right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Next photo"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="flex justify-center gap-1.5 overflow-x-auto p-4">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => onIndex(i)}
            className={clsx("h-14 w-20 shrink-0 overflow-hidden rounded-md ring-2 transition-opacity", i === index ? "ring-white" : "opacity-50 ring-transparent hover:opacity-80")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sizedImage(src, "sm")} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
