import type { StyleSpecification } from "maplibre-gl";
import type { MapStyleId } from "@/lib/constants";

const satellite: StyleSpecification = {
  version: 8,
  sources: {
    imagery: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    },
    labels: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [
    { id: "imagery", type: "raster", source: "imagery" },
    { id: "labels", type: "raster", source: "labels", paint: { "raster-opacity": 0.9 } },
  ],
};

export function styleFor(id: MapStyleId): string | StyleSpecification {
  switch (id) {
    case "voyager":
      return "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
    case "dark":
      return "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
    case "liberty":
      return "https://tiles.openfreemap.org/styles/liberty";
    case "satellite":
      return satellite;
    case "positron":
    default:
      return "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
  }
}

export const STYLE_SWATCH: Record<MapStyleId, string> = {
  positron: "linear-gradient(135deg,#f3f3f1 0 55%,#dfe6ea 55% 70%,#f3f3f1 70%)",
  voyager: "linear-gradient(135deg,#f5f1e8 0 40%,#cfe3c2 40% 58%,#aad3ea 58% 72%,#f5f1e8 72%)",
  liberty: "linear-gradient(135deg,#efe9e1 0 35%,#d8d0c5 35% 50%,#b9dcf0 50% 66%,#efe9e1 66%)",
  dark: "linear-gradient(135deg,#1c1d20 0 55%,#2c3540 55% 70%,#1c1d20 70%)",
  satellite: "linear-gradient(135deg,#2f4a2c 0 35%,#5b6b3a 35% 52%,#1f3d55 52% 70%,#3e4a35 70%)",
};
