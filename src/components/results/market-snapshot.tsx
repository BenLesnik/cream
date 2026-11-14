"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { formatMoney } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { useSettings } from "@/store/settings";

function quantile(sorted: number[], q: number) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function MarketSnapshot({ listings, type }: { listings: Listing[]; type: "Sale" | "Rent" | "Sold" }) {
  const priceFormat = useSettings((s) => s.priceFormat);
  const [open, setOpen] = useState(true);
  const [now] = useState(() => Date.now());

  const stats = useMemo(() => {
    const prices = listings.map((l) => l.price).filter((p): p is number => p != null).sort((a, b) => a - b);
    const houses = listings.filter((l) => !["ApartmentUnitFlat", "Studio", "Penthouse"].includes(l.propertyType) && l.price);
    const units = listings.filter((l) => ["ApartmentUnitFlat", "Studio", "Penthouse"].includes(l.propertyType) && l.price);
    const med = (arr: Listing[]) => quantile(arr.map((l) => l.price!).sort((a, b) => a - b), 0.5);
    const days = listings
      .map((l) => (l.dateListed ? (now - new Date(l.dateListed).getTime()) / 86_400_000 : null))
      .filter((d): d is number => d != null)
      .sort((a, b) => a - b);
    const weekAhead = now + 7 * 86_400_000;
    const openThisWeek = listings.filter((l) => l.inspections.some((i) => {
      const t = new Date(i.start).getTime();
      return t > now && t < weekAhead;
    })).length;
    const auctions = listings.filter((l) => l.auction).length;
    const newThisWeek = listings.filter((l) => l.dateListed && now - new Date(l.dateListed).getTime() < 7 * 86_400_000).length;

    const buckets = 24;
    const lo = quantile(prices, 0.02) ?? 0;
    const hi = quantile(prices, 0.98) ?? 1;
    const hist = new Array(buckets).fill(0);
    for (const p of prices) {
      const i = Math.min(buckets - 1, Math.max(0, Math.floor(((p - lo) / Math.max(1, hi - lo)) * buckets)));
      hist[i]++;
    }
    const peak = Math.max(1, ...hist);
    return {
      median: quantile(prices, 0.5),
      p10: quantile(prices, 0.1),
      p90: quantile(prices, 0.9),
      houseMedian: med(houses),
      unitMedian: med(units),
      medianDays: quantile(days, 0.5),
      openThisWeek,
      auctions,
      newThisWeek,
      priced: prices.length,
      hist: hist.map((h) => h / peak),
      lo,
      hi,
    };
  }, [listings, now]);

  if (listings.length < 3 || stats.median == null) return null;

  const money = (v: number | null) => {
    if (v == null) return "–";
    return type === "Rent" ? `$${Math.round(v)}` : formatMoney(v, priceFormat === "full" ? "compact" : priceFormat);
  };
  const unit = type === "Rent" ? " pw" : "";

  const tiles = [
    { label: type === "Sold" ? "Median sold" : type === "Rent" ? "Median rent" : "Median asking", value: money(stats.median) + unit },
    { label: "Houses", value: stats.houseMedian ? money(stats.houseMedian) + unit : "–" },
    { label: "Units", value: stats.unitMedian ? money(stats.unitMedian) + unit : "–" },
    type === "Sold"
      ? { label: "Price spread", value: `${money(stats.p10)}–${money(stats.p90)}` }
      : { label: "Open this week", value: String(stats.openThisWeek) },
    type === "Sale"
      ? { label: "Going to auction", value: `${Math.round((stats.auctions / listings.length) * 100)}%` }
      : type === "Rent"
        ? { label: "New this week", value: String(stats.newThisWeek) }
        : { label: "Sales shown", value: String(listings.length) },
    type !== "Sold" ? { label: "Median days listed", value: stats.medianDays != null ? `${Math.round(stats.medianDays)}` : "–" } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <section className="rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Market in view</span>
        <span className="flex items-center gap-2 text-[12px] text-muted">
          {!open ? <span className="font-medium text-fg tabular">{money(stats.median)}{unit} median</span> : `Based on ${stats.priced} priced listings`}
          <ChevronDown size={14} className={clsx("transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open ? (
        <div className="border-t border-line px-3.5 pb-3.5 pt-3">
          <dl className="grid grid-cols-3 gap-x-3 gap-y-3">
            {tiles.map((t) => (
              <div key={t.label} className="min-w-0">
                <dt className="truncate text-[11.5px] text-muted">{t.label}</dt>
                <dd className="truncate text-[15px] font-semibold tracking-tight tabular">{t.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3.5">
            <div className="flex h-9 items-end gap-[2px]" aria-hidden>
              {stats.hist.map((h, i) => (
                <div key={i} className="flex-1 rounded-t-[2px] bg-accent/60" style={{ height: `${Math.max(5, h * 100)}%` }} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-muted tabular">
              <span>{money(stats.lo)}</span>
              <span>Price distribution</span>
              <span>{money(stats.hi)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
