import type { Listing } from "./types";

export type PriceFormat = "compact" | "full";
export type AreaUnit = "sqm" | "ha" | "acres";

export function formatMoney(value: number, format: PriceFormat = "compact"): string {
  if (format === "full" || value < 10_000) {
    return `$${Math.round(value).toLocaleString("en-AU")}`;
  }
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `$${m >= 10 ? m.toFixed(1).replace(/\.0$/, "") : m.toFixed(2).replace(/\.?0+$/, "")}m`;
  }
  return `$${Math.round(value / 1000)}k`;
}

export function formatPriceStep(value: number, isRent: boolean): string {
  if (isRent) return `$${value.toLocaleString("en-AU")} pw`;
  return formatMoney(value, "compact");
}

/** Short label used on map pins. */
export function pinLabel(listing: Listing): string {
  if (listing.price == null) {
    if (listing.auction) return "Auction";
    return listing.listingType === "Rent" ? "Contact" : "EOI";
  }
  if (listing.listingType === "Rent") return `$${Math.round(listing.price)}`;
  return formatMoney(listing.price, "compact");
}

export function formatArea(sqm: number | null | undefined, unit: AreaUnit = "sqm"): string | null {
  if (!sqm) return null;
  if (unit === "ha" || (unit === "sqm" && sqm >= 20_000)) {
    return `${(sqm / 10_000).toFixed(sqm >= 100_000 ? 0 : 2).replace(/\.?0+$/, "")} ha`;
  }
  if (unit === "acres") return `${(sqm / 4046.86).toFixed(2).replace(/\.?0+$/, "")} ac`;
  return `${Math.round(sqm).toLocaleString("en-AU")} m²`;
}

const dayFmt = new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit" });

export function formatInspection(start: string, end?: string): string {
  const s = new Date(start);
  const day = dayFmt.format(s);
  const t1 = timeFmt.format(s).replace(" ", "").toLowerCase();
  if (!end) return `${day}, ${t1}`;
  const t2 = timeFmt.format(new Date(end)).replace(" ", "").toLowerCase();
  return `${day}, ${t1} – ${t2}`;
}

export function formatShortDate(iso: string): string {
  return dayFmt.format(new Date(iso)).replace(",", "");
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

export function relativeDays(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function nextInspection(listing: Listing): string | null {
  const now = Date.now();
  const upcoming = listing.inspections.find((i) => new Date(i.end ?? i.start).getTime() > now);
  return upcoming ? formatInspection(upcoming.start, upcoming.end) : null;
}

export function pluralise(n: number, word: string, plural = `${word}s`): string {
  return `${n.toLocaleString("en-AU")} ${n === 1 ? word : plural}`;
}

export function monthlyRepayment(principal: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** NSW-style general stamp duty approximation; good enough for a ballpark figure. */
export function stampDutyEstimate(price: number, state: string): number {
  const brackets: Record<string, [number, number, number][]> = {
    NSW: [[0, 0, 0.0125], [17_000, 212, 0.015], [36_000, 497, 0.0175], [97_000, 1564, 0.035], [364_000, 10_909, 0.045], [1_212_000, 49_069, 0.055]],
    VIC: [[0, 0, 0.014], [25_000, 350, 0.024], [130_000, 2870, 0.06], [960_000, 0, 0.055], [2_000_000, 110_000, 0.065]],
    QLD: [[0, 0, 0], [5_000, 0, 0.015], [75_000, 1050, 0.035], [540_000, 17_325, 0.045], [1_000_000, 38_025, 0.0575]],
    WA: [[0, 0, 0.019], [120_000, 2280, 0.0285], [150_000, 3135, 0.038], [360_000, 11_115, 0.0475], [725_000, 28_453, 0.0515]],
    SA: [[0, 0, 0.01], [12_000, 120, 0.02], [30_000, 480, 0.03], [50_000, 1080, 0.035], [100_000, 2830, 0.04], [200_000, 6830, 0.0425], [250_000, 8955, 0.0475], [300_000, 11_330, 0.05], [500_000, 21_330, 0.055]],
  };
  const table = brackets[state] ?? brackets.NSW;
  let bracket = table[0];
  for (const b of table) if (price > b[0]) bracket = b;
  const [threshold, base, rate] = bracket;
  if (state === "VIC" && price > 960_000 && price <= 2_000_000) return price * 0.055;
  return base + (price - threshold) * rate;
}
