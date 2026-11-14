"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import clsx from "clsx";
import { Bath, BedDouble, Car, ChevronLeft, ChevronRight, Heart, ImageOff, LandPlot } from "lucide-react";
import { formatArea } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { useCollections } from "@/store/collections";
import { useSettings } from "@/store/settings";

export function Facts({ listing, size = "md", className }: { listing: Listing; size?: "sm" | "md" | "lg"; className?: string }) {
  const areaUnit = useSettings((s) => s.areaUnit);
  const iconSize = size === "lg" ? 18 : size === "md" ? 15 : 13;
  const isLand = listing.propertyType === "VacantLand";
  const area = formatArea(listing.landArea ?? (listing.buildingArea ?? null), areaUnit);
  const items = [
    !isLand && { icon: BedDouble, value: listing.bedrooms === 0 ? "Studio" : listing.bedrooms, label: "bedrooms" },
    !isLand && { icon: Bath, value: listing.bathrooms, label: "bathrooms" },
    !isLand && { icon: Car, value: listing.carspaces, label: "parking spaces" },
    area && { icon: LandPlot, value: area, label: listing.landArea ? "land size" : "internal area" },
  ].filter(Boolean) as { icon: typeof Bath; value: string | number; label: string }[];

  return (
    <ul
      className={clsx(
        "flex flex-wrap items-center text-fg-2 tabular",
        size === "lg" ? "gap-x-5 gap-y-2 text-[15px]" : size === "md" ? "gap-x-3.5 gap-y-1 text-[13.5px]" : "gap-x-3 text-[12.5px]",
        className,
      )}
    >
      {items.map(({ icon: Icon, value, label }) => (
        <li key={label} className="inline-flex items-center gap-1.5" title={`${value} ${label}`}>
          <Icon size={iconSize} strokeWidth={1.75} className="text-muted" />
          <span className="font-medium text-fg">{value}</span>
          <span className="sr-only">{label}</span>
        </li>
      ))}
    </ul>
  );
}

export function SaveButton({ listing, className, variant = "overlay" }: { listing: Listing; className?: string; variant?: "overlay" | "plain" }) {
  const saved = useCollections((s) => Boolean(s.shortlist[listing.id]));
  const toggle = useCollections((s) => s.toggleShortlist);
  const [burst, setBurst] = useState(false);
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
      aria-pressed={saved}
      onClick={(e: MouseEvent) => {
        e.stopPropagation();
        toggle(listing);
        if (!saved) {
          setBurst(true);
          setTimeout(() => setBurst(false), 300);
        }
      }}
      className={clsx(
        "grid place-items-center rounded-full transition-all",
        variant === "overlay"
          ? "h-8 w-8 bg-black/25 text-white backdrop-blur-sm hover:bg-black/40"
          : "h-9 w-9 border border-line bg-surface text-fg hover:bg-surface-2",
        burst && "scale-110",
        className,
      )}
    >
      <Heart
        size={16}
        strokeWidth={2}
        className={clsx(saved && (variant === "overlay" ? "fill-white" : "fill-accent text-accent"))}
      />
    </button>
  );
}

export function Carousel({
  images,
  alt,
  className,
  sizes,
  rounded = "rounded-lg",
  autoplay = false,
}: {
  images: string[];
  alt: string;
  className?: string;
  sizes?: string;
  rounded?: string;
  autoplay?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [failed, setFailed] = useState(false);
  const hover = useRef(false);
  const count = images.length;

  useEffect(() => {
    if (!autoplay || count < 2) return;
    const t = setInterval(() => {
      if (hover.current) setIndex((i) => (i + 1) % count);
    }, 1400);
    return () => clearInterval(t);
  }, [autoplay, count]);

  const go = (e: MouseEvent, d: number) => {
    e.stopPropagation();
    setIndex((i) => (i + d + count) % count);
  };

  if (!count || failed) {
    return (
      <div className={clsx("grid place-items-center bg-surface-2 text-muted", rounded, className)}>
        <ImageOff size={20} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div
      className={clsx("group/carousel relative overflow-hidden bg-surface-2", rounded, className)}
      onMouseEnter={() => (hover.current = true)}
      onMouseLeave={() => (hover.current = false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={images[index]}
        src={sizedImage(images[index], sizes)}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={() => setLoaded((l) => ({ ...l, [index]: true }))}
        onError={() => (index === 0 ? setFailed(true) : setIndex(0))}
        className={clsx(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          loaded[index] ? "opacity-100" : "opacity-0",
        )}
      />
      {!loaded[index] ? <div className="skeleton absolute inset-0" /> : null}
      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => go(e, -1)}
            className="absolute left-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#1a1917] opacity-0 shadow-sm transition-opacity group-hover/carousel:opacity-100"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => go(e, 1)}
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#1a1917] opacity-0 shadow-sm transition-opacity group-hover/carousel:opacity-100"
          >
            <ChevronRight size={16} />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
            {images.slice(0, 7).map((_, i) => (
              <span
                key={i}
                className={clsx("h-1.5 rounded-full bg-white transition-all", i === index ? "w-3.5 opacity-100" : "w-1.5 opacity-60")}
              />
            ))}
          </div>
        </>
      ) : null}
      {/* preload next */}
      {count > 1 ? <link rel="prefetch" href={sizedImage(images[(index + 1) % count], sizes)} /> : null}
    </div>
  );
}

/** Ask the image CDN for an appropriately sized rendition when we know how. */
export function sizedImage(url: string, size?: string): string {
  const w = size === "lg" ? 1400 : size === "sm" ? 360 : 720;
  if (url.includes("images.unsplash.com")) return url.replace(/w=\d+/, `w=${w}`);
  return url;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "dark" | "warn" }) {
  return (
    <span
      className={clsx(
        "inline-flex h-[22px] items-center rounded-md px-1.5 text-[11.5px] font-semibold tracking-tight",
        {
          neutral: "bg-white/95 text-[#1a1917] shadow-sm",
          accent: "bg-accent text-accent-ink",
          dark: "bg-[#1a1917]/85 text-white backdrop-blur-sm",
          warn: "bg-[#fef3c7] text-[#92400e]",
        }[tone],
      )}
    >
      {children}
    </span>
  );
}

export function AgencyMark({ listing, size = 28 }: { listing: Listing; size?: number }) {
  const name = listing.agency.name;
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  if (listing.agency.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={listing.agency.logo}
        alt={name}
        className="h-full max-h-7 w-auto max-w-[110px] object-contain"
        loading="lazy"
      />
    );
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-md text-[10.5px] font-bold tracking-wide text-white"
      style={{ width: size, height: size, background: listing.agency.colour ?? "#3f3f46" }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
