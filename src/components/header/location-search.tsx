"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { Building2, Clock, Hash, Loader2, MapPin, Search, Signpost, X } from "lucide-react";
import type { GeocodeResult } from "@/lib/types";
import { useSearch } from "@/store/search";
import { Kbd } from "../ui/primitives";

const POPULAR: (Omit<GeocodeResult, "id" | "kind"> & { zoom: number })[] = [
  { name: "Sydney", context: "NSW", lat: -33.8708, lng: 151.2073, zoom: 12.3 },
  { name: "Melbourne", context: "VIC", lat: -37.8136, lng: 144.9831, zoom: 12.2 },
  { name: "Brisbane", context: "QLD", lat: -27.4698, lng: 153.0251, zoom: 12.6 },
  { name: "Perth", context: "WA", lat: -31.9523, lng: 115.8413, zoom: 12.2 },
  { name: "Adelaide", context: "SA", lat: -34.9285, lng: 138.6007, zoom: 12.6 },
  { name: "Gold Coast", context: "QLD", lat: -28.03, lng: 153.42, zoom: 12.2 },
  { name: "Canberra", context: "ACT", lat: -35.2809, lng: 149.13, zoom: 12.4 },
  { name: "Hobart", context: "TAS", lat: -42.8821, lng: 147.3272, zoom: 13.2 },
];

const RECENT_KEY = "kerb.recent-locations";

function loadRecent(): GeocodeResult[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

const KIND_ICON = { suburb: MapPin, city: Building2, region: Building2, postcode: Hash, street: Signpost, place: MapPin };

export function LocationSearch() {
  const label = useSearch((s) => s.locationLabel);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<GeocodeResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(target.tagName) && !target.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const json = (await res.json()) as { results: GeocodeResult[] };
        setResults(json.results);
        setActive(0);
      } catch {
        /* aborted */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const choose = (r: GeocodeResult | (typeof POPULAR)[number]) => {
    const isGeo = "kind" in r;
    const display = isGeo && r.kind === "postcode" ? r.name : r.name;
    if (isGeo) {
      const next = [r, ...loadRecent().filter((x) => x.id !== r.id)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    }
    const zoom = "zoom" in r ? r.zoom : r.kind === "street" ? 16 : r.kind === "city" ? 11.5 : r.kind === "region" ? 9 : 14;
    useSearch.getState().flyTo(
      isGeo && r.bbox && r.kind !== "street" ? { lat: r.lat, lng: r.lng, bbox: r.bbox } : { lat: r.lat, lng: r.lng, zoom },
      display,
    );
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.blur();
  };

  const q = query.trim();
  const showResults = q.length >= 2;
  const options: (GeocodeResult | (typeof POPULAR)[number])[] = showResults ? results : recent;

  return (
    <div className="relative w-full min-w-0">
      <div
        className={clsx(
          "flex h-10 items-center gap-2 rounded-xl border bg-surface pl-3 pr-1.5 transition-colors",
          open ? "border-fg/50 shadow-sm" : "border-line hover:border-line-strong",
        )}
      >
        {loading ? <Loader2 size={16} className="shrink-0 animate-spin text-muted" /> : <Search size={16} className="shrink-0 text-muted" />}
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={open ? query : query || label || ""}
          placeholder={label ?? "Search suburb, postcode or address"}
          onFocus={() => {
            setOpen(true);
            setRecent(loadRecent());
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length < 2) setResults([]);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && options[active]) {
              e.preventDefault();
              choose(options[active]);
            } else if (e.key === "Escape") {
              inputRef.current?.blur();
            }
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-muted"
        />
        {label && !open ? (
          <button
            type="button"
            aria-label="Clear location"
            onClick={() => useSearch.getState().setLocationLabel(null)}
            className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
          >
            <X size={14} />
          </button>
        ) : (
          <span className="hidden pr-1 lg:block">
            <Kbd>/</Kbd>
          </span>
        )}
      </div>

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[65] overflow-hidden rounded-xl border border-line bg-surface shadow-lg animate-pop-in"
          onMouseDown={(e) => e.preventDefault()}
        >
          {showResults ? (
            results.length ? (
              <ul className="py-1.5">
                {results.map((r, i) => {
                  const Icon = KIND_ICON[r.kind];
                  return (
                    <li key={r.id + r.name}>
                      <button
                        role="option"
                        aria-selected={i === active}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(r)}
                        className={clsx("flex w-full items-center gap-3 px-3 py-2 text-left", i === active && "bg-surface-2")}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted ring-1 ring-line">
                          <Icon size={15} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-medium">{r.name}</span>
                          <span className="block truncate text-[12px] text-muted">
                            {r.kind[0].toUpperCase() + r.kind.slice(1)}
                            {r.context ? ` · ${r.context}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-6 text-center text-[13px] text-muted">
                {loading ? "Searching…" : `No places match “${q}”`}
              </div>
            )
          ) : (
            <div className="p-3">
              {recent.length ? (
                <div className="mb-3">
                  <div className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Recent</div>
                  {recent.map((r, i) => (
                    <button
                      key={r.id}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(r)}
                      className={clsx("flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13.5px]", i === active && "bg-surface-2")}
                    >
                      <Clock size={14} className="text-muted" />
                      <span className="font-medium">{r.name}</span>
                      <span className="truncate text-[12px] text-muted">{r.context}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Jump to a city</div>
              <div className="flex flex-wrap gap-1.5 px-1">
                {POPULAR.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => choose(p)}
                    className="h-7 rounded-full border border-line px-2.5 text-[12.5px] font-medium text-fg-2 hover:border-line-strong hover:text-fg"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
