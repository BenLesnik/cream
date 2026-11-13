"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Map as MLMap, Marker, setWorkerUrl, type GeoJSONSource, type MapMouseEvent } from "maplibre-gl";
import Supercluster, { type ClusterProperties } from "supercluster";
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import { DEFAULT_VIEW } from "@/lib/constants";
import { formatMoney, pinLabel } from "@/lib/format";
import type { Listing, LngLat } from "@/lib/types";
import { useCollections } from "@/store/collections";
import { useSearch } from "@/store/search";
import { useSettings } from "@/store/settings";
import { styleFor } from "./map-styles";
import { MapControls } from "./map-controls";
import { MapPreviewCard } from "./map-preview-card";
import { DrawHelper, SearchAreaToggle } from "./map-overlays";

if (typeof window !== "undefined") setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

type PointProps = { id: string; price: number | null };
type ClusterAgg = { sum: number; n: number };
type MarkerEntry = { marker: Marker; el: HTMLDivElement; sig: string; id?: string };

const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };
const WORLD_RING: LngLat[] = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];

function closeRing(p: LngLat[]): LngLat[] {
  return p.length && (p[0][0] !== p[p.length - 1][0] || p[0][1] !== p[p.length - 1][1]) ? [...p, p[0]] : p;
}

function pinText(l: Listing, mode: string): string {
  if (mode === "dot") return "";
  if (mode === "beds") {
    if (l.propertyType === "VacantLand") return "Land";
    return l.bedrooms === 0 ? "Studio" : `${l.bedrooms} bed`;
  }
  return pinLabel(l);
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [map, setMap] = useState<MLMap | null>(null);
  const markersRef = useRef(new Map<string, MarkerEntry>());
  const ghostRef = useRef<Marker | null>(null);
  const indexRef = useRef<Supercluster<PointProps, ClusterAgg> | null>(null);
  const programmaticRef = useRef(false);
  const renderRef = useRef<() => void>(() => {});
  const layersRef = useRef<() => void>(() => {});

  const results = useSearch((s) => s.results);
  const polygon = useSearch((s) => s.polygon);
  const drawing = useSearch((s) => s.drawing);
  const camera = useSearch((s) => s.camera);
  const hidden = useCollections((s) => s.hidden);
  const shortlist = useCollections((s) => s.shortlist);
  const viewed = useCollections((s) => s.viewed);
  const mapStyle = useSettings((s) => s.mapStyle);
  const pinMode = useSettings((s) => s.pinMode);
  const cluster = useSettings((s) => s.cluster);
  const heatmap = useSettings((s) => s.heatmap);
  const tilt = useSettings((s) => s.tilt);
  const dimViewed = useSettings((s) => s.dimViewed);
  const priceFormat = useSettings((s) => s.priceFormat);

  const visible = useMemo(() => {
    const hiddenSet = new Set(hidden);
    return results.filter((l) => !hiddenSet.has(l.id));
  }, [results, hidden]);
  const byId = useMemo(() => new Map(visible.map((l) => [l.id, l])), [visible]);

  const heatData = useMemo<FeatureCollection>(() => {
    const prices = visible.map((l) => l.price).filter((p): p is number => p != null).sort((a, b) => a - b);
    const rank = (p: number | null) => {
      if (p == null || !prices.length) return 0.3;
      let lo = 0;
      let hi = prices.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (prices[mid] < p) lo = mid + 1;
        else hi = mid;
      }
      return 0.05 + (lo / prices.length) * 0.95;
    };
    return {
      type: "FeatureCollection",
      features: visible.map((l) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [l.lng, l.lat] },
        properties: { w: heatmap === "price" ? rank(l.price) : 0.5 },
      })),
    };
  }, [visible, heatmap]);

  // Map construction.
  useEffect(() => {
    if (!containerRef.current) return;
    const s = useSearch.getState();
    const st = useSettings.getState();
    const v = s.view ?? DEFAULT_VIEW;
    const m = new MLMap({
      container: containerRef.current,
      style: styleFor(st.mapStyle),
      center: [v.lng, v.lat],
      zoom: v.zoom,
      pitch: st.tilt ? 55 : 0,
      maxPitch: 70,
      minZoom: 3.5,
      maxBounds: [[90, -56], [180, 8]],
      attributionControl: { compact: true },
      fadeDuration: 150,
    });
    mapRef.current = m;

    const emit = (force?: boolean) => {
      const b = m.getBounds();
      const c = m.getCenter();
      const state = useSearch.getState();
      const commit = force || programmaticRef.current || useSettings.getState().searchAsMove || !state.bounds;
      programmaticRef.current = false;
      state.setBounds(
        { north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() },
        { lat: c.lat, lng: c.lng, zoom: m.getZoom() },
        commit,
      );
    };

    m.on("load", () => {
      setMap(m);
      emit(true);
      const initial = useSearch.getState().polygon;
      if (initial?.length) fitPolygon(m, initial);
    });
    m.on("moveend", () => {
      emit();
      renderRef.current();
    });
    m.on("style.load", () => layersRef.current());
    m.on("click", () => {
      if (!useSearch.getState().drawing) useSearch.getState().preview(null);
    });

    const ro = new ResizeObserver(() => m.resize());
    ro.observe(containerRef.current);
    const markers = markersRef.current;

    return () => {
      ro.disconnect();
      markers.forEach((e) => e.marker.remove());
      markers.clear();
      m.remove();
      mapRef.current = null;
      setMap(null);
    };
  }, []);

  // Sources & layers (re-run whenever the style is replaced).
  layersRef.current = () => {
    const m = mapRef.current;
    if (!m || !m.isStyleLoaded()) return;
    if (!m.getSource("kerb-heat")) m.addSource("kerb-heat", { type: "geojson", data: heatData });
    if (!m.getLayer("kerb-heat")) {
      m.addLayer({
        id: "kerb-heat",
        type: "heatmap",
        source: "kerb-heat",
        layout: { visibility: heatmap === "off" ? "none" : "visible" },
        paint: {
          "heatmap-weight": ["get", "w"],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 15, 1.4],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 8, 12, 12, 26, 16, 52],
          "heatmap-opacity": 0.72,
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.15, "rgba(44,127,184,0.55)",
            0.35, "#41b6c4",
            0.55, "#a1dab4",
            0.75, "#fdae61",
            1, "#d7191c",
          ],
        },
      });
    }
    if (!m.getSource("kerb-area")) m.addSource("kerb-area", { type: "geojson", data: EMPTY_FC });
    if (!m.getLayer("kerb-mask")) {
      m.addLayer({
        id: "kerb-mask",
        type: "fill",
        source: "kerb-area",
        filter: ["==", ["get", "role"], "mask"],
        paint: { "fill-color": "#000", "fill-opacity": 0.18 },
      });
    }
    if (!m.getLayer("kerb-area-line")) {
      m.addLayer({
        id: "kerb-area-line",
        type: "line",
        source: "kerb-area",
        filter: ["==", ["get", "role"], "area"],
        paint: { "line-color": getAccent(), "line-width": 2.5 },
      });
    }
    if (!m.getSource("kerb-draw")) m.addSource("kerb-draw", { type: "geojson", data: EMPTY_FC });
    if (!m.getLayer("kerb-draw-fill")) {
      m.addLayer({
        id: "kerb-draw-fill",
        type: "fill",
        source: "kerb-draw",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": getAccent(), "fill-opacity": 0.12 },
      });
      m.addLayer({
        id: "kerb-draw-line",
        type: "line",
        source: "kerb-draw",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: { "line-color": getAccent(), "line-width": 2, "line-dasharray": [2, 1.5] },
      });
      m.addLayer({
        id: "kerb-draw-pts",
        type: "circle",
        source: "kerb-draw",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": ["case", ["==", ["get", "first"], true], 7, 4.5],
          "circle-color": "#fff",
          "circle-stroke-color": getAccent(),
          "circle-stroke-width": 2,
        },
      });
    }
    updateArea(m, useSearch.getState().polygon);
  };

  // Keep layer data/visibility in sync.
  useEffect(() => {
    if (!map) return;
    layersRef.current();
    (map.getSource("kerb-heat") as GeoJSONSource | undefined)?.setData(heatData);
    if (map.getLayer("kerb-heat")) map.setLayoutProperty("kerb-heat", "visibility", heatmap === "off" ? "none" : "visible");
  }, [map, heatData, heatmap]);

  useEffect(() => {
    if (!map) return;
    updateArea(map, polygon);
  }, [map, polygon]);

  // Style switching.
  const firstStyle = useRef(true);
  useEffect(() => {
    if (!map) return;
    if (firstStyle.current) {
      firstStyle.current = false;
      return;
    }
    map.setStyle(styleFor(mapStyle), { diff: false });
  }, [map, mapStyle]);

  useEffect(() => {
    if (!map) return;
    map.easeTo({ pitch: tilt ? 55 : 0, bearing: tilt ? -14 : 0, duration: 700 });
  }, [map, tilt]);

  // Camera requests from search, saved searches, drawer "show on map".
  useEffect(() => {
    if (!map || !camera) return;
    programmaticRef.current = true;
    if (camera.bbox) {
      const [w, s, e, n] = camera.bbox;
      map.fitBounds([[Math.min(w, e), Math.min(s, n)], [Math.max(w, e), Math.max(s, n)]], { padding: 56, maxZoom: 15.2, duration: 900 });
    } else {
      map.flyTo({ center: [camera.lng, camera.lat], zoom: camera.zoom ?? 14.5, duration: 900, essential: true });
    }
  }, [map, camera]);

  // Clustering index.
  useEffect(() => {
    const idx = new Supercluster<PointProps, ClusterAgg>({
      radius: 46,
      maxZoom: 14,
      map: (p) => ({ sum: p.price ?? 0, n: p.price ? 1 : 0 }),
      reduce: (acc, p) => {
        acc.sum += p.sum;
        acc.n += p.n;
      },
    });
    idx.load(
      visible.map<Feature<Point, PointProps>>((l) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [l.lng, l.lat] },
        properties: { id: l.id, price: l.price },
      })),
    );
    indexRef.current = idx;
  }, [visible]);

  // Marker rendering.
  renderRef.current = () => {
    const m = mapRef.current;
    if (!m) return;
    const markers = markersRef.current;
    const b = m.getBounds();
    const pad = 0.15;
    const dLng = (b.getEast() - b.getWest()) * pad;
    const dLat = (b.getNorth() - b.getSouth()) * pad;
    const bbox: [number, number, number, number] = [b.getWest() - dLng, b.getSouth() - dLat, b.getEast() + dLng, b.getNorth() + dLat];
    const z = Math.floor(m.getZoom());
    const viewedSet = new Set(viewed);
    const state = useSearch.getState();
    const activeId = state.previewId ?? state.hoveredId ?? state.selectedId;
    const next = new Set<string>();

    type Item =
      | { kind: "pin"; key: string; lng: number; lat: number; listing: Listing }
      | { kind: "cluster"; key: string; lng: number; lat: number; count: number; clusterId: number; avg: number | null };
    const items: Item[] = [];

    if (cluster && indexRef.current) {
      for (const f of indexRef.current.getClusters(bbox, z)) {
        const [lng, lat] = f.geometry.coordinates;
        const props = f.properties as Partial<ClusterProperties & ClusterAgg & PointProps>;
        if (props.cluster) {
          items.push({
            kind: "cluster",
            key: `c${props.cluster_id}`,
            lng,
            lat,
            count: props.point_count!,
            clusterId: props.cluster_id!,
            avg: props.n ? props.sum! / props.n : null,
          });
        } else {
          const l = byId.get(props.id!);
          if (l) items.push({ kind: "pin", key: `p${l.id}`, lng, lat, listing: l });
        }
      }
    } else {
      for (const l of visible) {
        if (l.lng < bbox[0] || l.lng > bbox[2] || l.lat < bbox[1] || l.lat > bbox[3]) continue;
        items.push({ kind: "pin", key: `p${l.id}`, lng: l.lng, lat: l.lat, listing: l });
        if (items.length > 600) break;
      }
    }

    for (const item of items) {
      next.add(item.key);
      let sig: string;
      if (item.kind === "pin") {
        const l = item.listing;
        sig = `${pinText(l, pinMode)}|${pinMode}|${dimViewed && viewedSet.has(l.id)}|${Boolean(shortlist[l.id])}|${item.lng},${item.lat}`;
      } else {
        sig = `${item.count}|${pinMode}|${item.avg}|${priceFormat}|${item.lng},${item.lat}`;
      }
      const existing = markers.get(item.key);
      if (existing && existing.sig === sig) continue;
      existing?.marker.remove();

      const el = document.createElement("div");
      if (item.kind === "pin") {
        const l = item.listing;
        el.className = "pin-wrap";
        const pin = document.createElement("div");
        pin.className = "pin";
        pin.dataset.mode = pinMode;
        pin.dataset.viewed = String(dimViewed && viewedSet.has(l.id));
        pin.dataset.saved = String(Boolean(shortlist[l.id]));
        pin.dataset.active = String(activeId === l.id);
        pin.textContent = pinText(l, pinMode);
        pin.setAttribute("role", "button");
        pin.setAttribute("aria-label", `${l.address.display}, ${l.displayPrice}`);
        el.appendChild(pin);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          useSearch.getState().preview(l.id);
        });
        el.addEventListener("mouseenter", () => useSearch.getState().setHovered(l.id));
        el.addEventListener("mouseleave", () => useSearch.getState().setHovered(null));
        const marker = new Marker({ element: el, anchor: pinMode === "dot" ? "center" : "bottom", offset: pinMode === "dot" ? [0, 0] : [0, -4] })
          .setLngLat([item.lng, item.lat])
          .addTo(m);
        markers.set(item.key, { marker, el, sig, id: l.id });
      } else {
        const size = Math.round(Math.min(64, 30 + Math.log2(item.count) * 6));
        el.className = "cluster";
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.fontSize = `${size > 44 ? 13 : 12}px`;
        const showAvg = pinMode === "price" && item.avg && size >= 40;
        el.innerHTML = `<div>${item.count}${showAvg ? `<small>${formatMoney(item.avg!, "compact")}</small>` : ""}</div>`;
        el.title = `${item.count} properties`;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const zoom = indexRef.current?.getClusterExpansionZoom(item.clusterId) ?? m.getZoom() + 2;
          m.easeTo({ center: [item.lng, item.lat], zoom: Math.min(zoom + 0.3, 17), duration: 500 });
        });
        const marker = new Marker({ element: el, anchor: "center" }).setLngLat([item.lng, item.lat]).addTo(m);
        markers.set(item.key, { marker, el, sig });
      }
    }

    for (const [key, entry] of markers) {
      if (!next.has(key)) {
        entry.marker.remove();
        markers.delete(key);
      }
    }
    syncActive();
  };

  function syncActive() {
    const m = mapRef.current;
    if (!m) return;
    const s = useSearch.getState();
    const activeId = s.previewId ?? s.hoveredId ?? s.selectedId;
    let found = false;
    for (const entry of markersRef.current.values()) {
      if (!entry.id) continue;
      const on = entry.id === activeId;
      if (on) found = true;
      const pin = entry.el.firstElementChild as HTMLElement | null;
      if (pin && pin.dataset.active !== String(on)) pin.dataset.active = String(on);
      entry.el.dataset.active = String(on);
    }
    ghostRef.current?.remove();
    ghostRef.current = null;
    const listing = activeId ? byId.get(activeId) : undefined;
    if (!found && listing) {
      const el = document.createElement("div");
      el.className = "pin-wrap";
      el.dataset.active = "true";
      el.style.pointerEvents = "none";
      el.innerHTML = `<div class="pin" data-active="true" data-mode="${pinMode === "dot" ? "dot" : "price"}">${pinMode === "dot" ? "" : pinText(listing, pinMode)}</div>`;
      ghostRef.current = new Marker({ element: el, anchor: pinMode === "dot" ? "center" : "bottom", offset: pinMode === "dot" ? [0, 0] : [0, -4] })
        .setLngLat([listing.lng, listing.lat])
        .addTo(m);
    }
  }

  useEffect(() => {
    if (map) renderRef.current();
  }, [map, visible, cluster, pinMode, dimViewed, viewed, shortlist, priceFormat]);

  useEffect(
    () =>
      useSearch.subscribe((s, prev) => {
        if (s.hoveredId !== prev.hoveredId || s.previewId !== prev.previewId || s.selectedId !== prev.selectedId) {
          syncActive();
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [byId, pinMode],
  );

  // Freehand polygon drawing.
  useEffect(() => {
    if (!map || !drawing) return;
    const pts: LngLat[] = [];
    const canvas = map.getCanvas();
    canvas.style.cursor = "crosshair";
    map.doubleClickZoom.disable();

    const render = (hover?: LngLat) => {
      const line = hover ? [...pts, hover] : pts;
      const features: Feature[] = pts.map((p, i) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: p },
        properties: { first: i === 0 },
      }));
      if (line.length >= 2) {
        features.push({ type: "Feature", geometry: { type: "LineString", coordinates: line }, properties: {} });
      }
      if (line.length >= 3) {
        features.push({ type: "Feature", geometry: { type: "Polygon", coordinates: [closeRing(line)] }, properties: {} });
      }
      (map.getSource("kerb-draw") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features });
    };

    const finish = () => {
      if (pts.length >= 3) {
        useSearch.getState().setPolygon([...pts]);
        useSearch.getState().setLocationLabel("Drawn area");
        fitPolygon(map, pts);
      } else {
        useSearch.getState().setDrawing(false);
      }
    };

    const onClick = (e: MapMouseEvent) => {
      const p: LngLat = [e.lngLat.lng, e.lngLat.lat];
      if (pts.length >= 3) {
        const first = map.project(pts[0]);
        if (Math.hypot(first.x - e.point.x, first.y - e.point.y) < 14) return finish();
      }
      pts.push(p);
      render();
    };
    const onMove = (e: MapMouseEvent) => pts.length && render([e.lngLat.lng, e.lngLat.lat]);
    const onDbl = (e: MapMouseEvent) => {
      e.preventDefault();
      finish();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") useSearch.getState().setDrawing(false);
      if (e.key === "Enter") finish();
      if (e.key === "Backspace" && pts.length) {
        pts.pop();
        render();
      }
    };
    const onFinishEvent = () => finish();

    map.on("click", onClick);
    map.on("mousemove", onMove);
    map.on("dblclick", onDbl);
    window.addEventListener("keydown", onKey);
    window.addEventListener("kerb:finish-draw", onFinishEvent);
    return () => {
      map.off("click", onClick);
      map.off("mousemove", onMove);
      map.off("dblclick", onDbl);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("kerb:finish-draw", onFinishEvent);
      canvas.style.cursor = "";
      setTimeout(() => map.doubleClickZoom.enable(), 0);
      (map.getSource("kerb-draw") as GeoJSONSource | undefined)?.setData(EMPTY_FC);
    };
  }, [map, drawing]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface-2">
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      {map ? (
        <>
          <SearchAreaToggle />
          <MapControls map={map} />
          <DrawHelper />
          <MapPreviewCard />
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-[13px] text-muted">Loading map…</div>
      )}
    </div>
  );
}

function getAccent(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#1f6f5c";
}

function updateArea(m: MLMap, polygon: LngLat[] | null) {
  const src = m.getSource("kerb-area") as GeoJSONSource | undefined;
  if (!src) return;
  if (!polygon?.length) {
    src.setData(EMPTY_FC);
    return;
  }
  const ring = closeRing(polygon);
  const area: Feature<Polygon> = { type: "Feature", geometry: { type: "Polygon", coordinates: [ring] }, properties: { role: "area" } };
  const mask: Feature<Polygon> = {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [WORLD_RING, [...ring].reverse()] },
    properties: { role: "mask" },
  };
  src.setData({ type: "FeatureCollection", features: [mask, area] });
  if (m.getLayer("kerb-area-line")) m.setPaintProperty("kerb-area-line", "line-color", getAccent());
}

function fitPolygon(m: MLMap, pts: LngLat[]) {
  const lngs = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  m.fitBounds(
    [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
    { padding: 64, duration: 700, maxZoom: 16 },
  );
}
