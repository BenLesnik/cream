"use client";

import { useEffect } from "react";
import { useSearch } from "@/store/search";
import type { SearchRequest, SearchResponse } from "@/lib/types";

const PAGE_SIZE = 100;
let controller: AbortController | null = null;

async function request(page: number, signal: AbortSignal): Promise<SearchResponse> {
  const s = useSearch.getState();
  const bounds = s.polygon?.length
    ? {
        north: Math.max(...s.polygon.map((p) => p[1])),
        south: Math.min(...s.polygon.map((p) => p[1])),
        east: Math.max(...s.polygon.map((p) => p[0])),
        west: Math.min(...s.polygon.map((p) => p[0])),
      }
    : s.bounds!;
  const body: SearchRequest = {
    filters: s.filters,
    bounds,
    polygon: s.polygon,
    center: s.view ? { lat: s.view.lat, lng: s.view.lng } : undefined,
    page,
    pageSize: PAGE_SIZE,
  };
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Search failed (${res.status})`);
  return res.json();
}

export async function loadMore() {
  const s = useSearch.getState();
  if (s.loadingMore || s.results.length >= s.total || !s.bounds) return;
  useSearch.setState({ loadingMore: true });
  const ctrl = new AbortController();
  try {
    const data = await request(s.page + 1, ctrl.signal);
    const seen = new Set(useSearch.getState().results.map((l) => l.id));
    useSearch.setState((st) => ({
      results: [...st.results, ...data.listings.filter((l) => !seen.has(l.id))],
      page: data.page,
      loadingMore: false,
    }));
  } catch {
    useSearch.setState({ loadingMore: false });
  }
}

export function useListingSearch() {
  const filters = useSearch((s) => s.filters);
  const bounds = useSearch((s) => s.bounds);
  const polygon = useSearch((s) => s.polygon);
  const area = polygon ?? bounds;

  useEffect(() => {
    if (!area) return;
    const timer = setTimeout(async () => {
      controller?.abort();
      const ctrl = new AbortController();
      controller = ctrl;
      useSearch.setState({ loading: true, error: null });
      try {
        const data = await request(1, ctrl.signal);
        if (ctrl.signal.aborted) return;
        useSearch.setState({
          results: data.listings,
          total: data.total,
          page: 1,
          loading: false,
          source: data.source,
          warning: data.warning ?? null,
        });
      } catch (err) {
        if (ctrl.signal.aborted) return;
        useSearch.setState({ loading: false, error: err instanceof Error ? err.message : "Search failed" });
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [filters, area]);
}
