"use client";

import { useMemo, useState } from "react";
import { Download, MapPinned, Play, Trash2 } from "lucide-react";
import { PROPERTY_TYPE_LABEL } from "@/lib/constants";
import { formatDate, pluralise } from "@/lib/format";
import { countActiveFilters } from "@/lib/url-state";
import { useCollections, type SavedSearch } from "@/store/collections";
import { useSearch } from "@/store/search";
import { useUi } from "@/store/ui";
import { Facts, sizedImage } from "../listing/parts";
import { Button, Segmented, Sheet } from "../ui/primitives";

export function applySavedSearch(s: SavedSearch) {
  const st = useSearch.getState();
  useSearch.setState({ filters: s.filters });
  st.flyTo({ lat: s.view.lat, lng: s.view.lng, zoom: s.view.zoom }, s.locationLabel);
  if (s.polygon) setTimeout(() => useSearch.getState().setPolygon(s.polygon), 0);
}

function toCsv(rows: Record<string, string | number | null>[]) {
  const cols = Object.keys(rows[0] ?? {});
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function CollectionsSheet() {
  const open = useUi((s) => s.panel === "collections");
  const tab = useUi((s) => s.collectionsTab);
  const openPanel = useUi((s) => s.open);
  const close = useUi((s) => s.close);
  const shortlist = useCollections((s) => s.shortlist);
  const saved = useCollections((s) => s.saved);
  const hidden = useCollections((s) => s.hidden);
  const toggleShortlist = useCollections((s) => s.toggleShortlist);
  const removeSearch = useCollections((s) => s.removeSearch);
  const renameSearch = useCollections((s) => s.renameSearch);
  const unhide = useCollections((s) => s.unhide);
  const clearHidden = useCollections((s) => s.clearHidden);
  const results = useSearch((s) => s.results);
  const [sort, setSort] = useState<"recent" | "price">("recent");

  const items = useMemo(() => {
    const arr = Object.values(shortlist);
    return sort === "recent"
      ? arr.sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      : arr.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  }, [shortlist, sort]);

  const hiddenInView = results.filter((l) => hidden.includes(l.id));

  const exportCsv = () => {
    const csv = toCsv(
      items.map((l) => ({
        address: l.address.display,
        price: l.displayPrice,
        type: PROPERTY_TYPE_LABEL[l.propertyType] ?? l.propertyType,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        parking: l.carspaces,
        land_sqm: l.landArea,
        agency: l.agency.name,
        agent: l.agents[0]?.name ?? "",
        note: l.note ?? "",
        link: l.url ?? "",
        saved: l.savedAt,
      })),
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "kerb-shortlist.csv";
    a.click();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()} title="Saved" width={460}>
      <div className="sticky top-0 z-10 border-b border-line bg-surface px-5 py-3">
        <Segmented
          className="w-full"
          value={tab}
          onChange={(v) => openPanel("collections", v)}
          options={[
            { value: "shortlist", label: `Shortlist${items.length ? ` · ${items.length}` : ""}` },
            { value: "searches", label: `Searches${saved.length ? ` · ${saved.length}` : ""}` },
            { value: "hidden", label: `Hidden${hidden.length ? ` · ${hidden.length}` : ""}` },
          ]}
        />
      </div>

      {tab === "shortlist" ? (
        items.length ? (
          <div>
            <div className="flex items-center justify-between px-5 py-3">
              <Segmented
                size="sm"
                value={sort}
                onChange={setSort}
                options={[
                  { value: "recent", label: "Recently saved" },
                  { value: "price", label: "Price" },
                ]}
              />
              <Button size="sm" variant="ghost" onClick={exportCsv}>
                <Download size={14} /> CSV
              </Button>
            </div>
            <ul className="divide-y divide-line border-t border-line">
              {items.map((l) => (
                <li key={l.id} className="group flex gap-3 px-5 py-3.5">
                  <button
                    onClick={() => {
                      close();
                      useSearch.getState().select(l.id);
                    }}
                    className="h-[72px] w-[96px] shrink-0 overflow-hidden rounded-lg bg-surface-2"
                  >
                    {l.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sizedImage(l.images[0], "sm")} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button
                      className="block w-full text-left"
                      onClick={() => {
                        close();
                        useSearch.getState().select(l.id);
                      }}
                    >
                      <div className="truncate text-[14px] font-semibold tabular">{l.displayPrice}</div>
                      <div className="truncate text-[12.5px] text-fg-2">{l.address.display}</div>
                    </button>
                    <Facts listing={l} size="sm" className="mt-1" />
                    {l.note ? <p className="mt-1 line-clamp-2 text-[12px] italic text-muted">{l.note}</p> : null}
                  </div>
                  <div className="flex flex-col gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Show on map"
                      onClick={() => {
                        close();
                        useSearch.getState().flyTo({ lat: l.lat, lng: l.lng, zoom: 16 });
                        setTimeout(() => useSearch.getState().preview(l.id), 950);
                      }}
                    >
                      <MapPinned size={15} />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => toggleShortlist(l)}>
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Empty title="No saved homes yet" body="Tap the heart on any listing to keep it here, add notes and compare later." />
        )
      ) : null}

      {tab === "searches" ? (
        saved.length ? (
          <ul className="divide-y divide-line">
            {saved.map((s) => {
              const n = countActiveFilters(s.filters);
              return (
                <li key={s.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <input
                        defaultValue={s.name}
                        onBlur={(e) => e.target.value.trim() && renameSearch(s.id, e.target.value.trim())}
                        className="w-full truncate bg-transparent text-[14px] font-semibold outline-none focus:underline"
                        aria-label="Search name"
                      />
                      <div className="mt-0.5 text-[12.5px] text-muted">
                        {s.filters.listingType === "Sale" ? "Buy" : s.filters.listingType} · {s.polygon ? "Drawn area" : s.locationLabel ?? "Map area"}
                        {n ? ` · ${pluralise(n, "filter")}` : ""}
                      </div>
                      <div className="text-[11.5px] text-muted">Saved {formatDate(s.createdAt)}</div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          applySavedSearch(s);
                          close();
                        }}
                      >
                        <Play size={13} /> Run
                      </Button>
                      <Button size="icon-sm" variant="ghost" aria-label="Delete search" onClick={() => removeSearch(s.id)}>
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty
            title="No saved searches"
            body="Save the current area and filters to come back to them in one click."
            action={
              <Button variant="primary" onClick={() => openPanel("save")}>
                Save current search
              </Button>
            }
          />
        )
      ) : null}

      {tab === "hidden" ? (
        hidden.length ? (
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-muted">{pluralise(hidden.length, "listing")} hidden from results and the map.</p>
              <Button size="sm" onClick={clearHidden}>
                Unhide all
              </Button>
            </div>
            {hiddenInView.length ? (
              <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                {hiddenInView.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-medium">{l.address.display}</div>
                      <div className="text-[12px] text-muted">{l.displayPrice}</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => unhide(l.id)}>
                      Unhide
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <Empty title="Nothing hidden" body="Hide listings you're not interested in and they'll stay out of your way." />
        )
      ) : null}
    </Sheet>
  );
}

function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="mt-1 max-w-[280px] text-[13px] text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
