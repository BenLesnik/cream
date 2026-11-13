import "server-only";
import type { Listing, SearchRequest, SearchResponse } from "../types";
import { DomainError, domainConfigured, domainListing, domainSearch } from "./domain";
import { demoById, demoSearch } from "./demo";

const TTL = 5 * 60_000;
const cache = new Map<string, { at: number; value: SearchResponse }>();
const listingCache = new Map<string, Listing>();

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

function cacheKey(req: SearchRequest): string {
  const b = req.bounds;
  return JSON.stringify({
    ...req,
    bounds: { n: round(b.north), s: round(b.south), e: round(b.east), w: round(b.west) },
    center: undefined,
  });
}

export async function searchListings(req: SearchRequest): Promise<SearchResponse> {
  if (!domainConfigured()) return demoSearch(req);

  const key = cacheKey(req);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  try {
    const value = await domainSearch(req);
    cache.set(key, { at: Date.now(), value });
    if (cache.size > 500) cache.delete(cache.keys().next().value!);
    for (const l of value.listings) listingCache.set(l.id, l);
    if (listingCache.size > 5000) listingCache.delete(listingCache.keys().next().value!);
    return value;
  } catch (err) {
    const status = err instanceof DomainError ? err.status : 0;
    const reason =
      status === 401 || status === 403
        ? "Domain rejected the API credentials"
        : status === 429
          ? "Domain API rate limit reached"
          : "Domain API request failed";
    console.error("[domain]", err);
    return { ...demoSearch(req), warning: `${reason}${status ? ` (${status})` : ""}. Showing demo listings instead.` };
  }
}

export async function getListing(id: string): Promise<Listing | null> {
  if (id.startsWith("demo-")) return demoById(id);
  if (!domainConfigured()) return null;
  try {
    const full = await domainListing(id);
    const summary = listingCache.get(id);
    if (full && summary) {
      return {
        ...summary,
        ...full,
        description: full.description || summary.description,
        images: full.images.length ? full.images : summary.images,
        agents: full.agents.length ? full.agents : summary.agents,
        inspections: full.inspections.length ? full.inspections : summary.inspections,
      };
    }
    return full ?? summary ?? null;
  } catch (err) {
    console.error("[domain]", err);
    return listingCache.get(id) ?? null;
  }
}
