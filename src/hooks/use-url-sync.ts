"use client";

import { useEffect } from "react";
import { buildUrl } from "@/lib/url-state";
import { useSearch } from "@/store/search";

export function useUrlSync() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const write = () => {
      const s = useSearch.getState();
      if (!s.view) return;
      const url = buildUrl({
        filters: s.filters,
        view: s.view,
        polygon: s.polygon,
        label: s.locationLabel,
        listing: s.selectedId,
      });
      if (url !== window.location.search) window.history.replaceState(null, "", url);
    };
    const unsub = useSearch.subscribe((s, prev) => {
      if (
        s.filters === prev.filters &&
        s.view === prev.view &&
        s.polygon === prev.polygon &&
        s.locationLabel === prev.locationLabel &&
        s.selectedId === prev.selectedId
      ) {
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(write, 300);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, []);
}
