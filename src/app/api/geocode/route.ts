import type { GeocodeResult } from "@/lib/types";

const STATE_ABBR: Record<string, string> = {
  "New South Wales": "NSW",
  Victoria: "VIC",
  Queensland: "QLD",
  "Western Australia": "WA",
  "South Australia": "SA",
  Tasmania: "TAS",
  "Australian Capital Territory": "ACT",
  "Northern Territory": "NT",
};

const cache = new Map<string, { at: number; results: GeocodeResult[] }>();

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id: number;
    osm_value: string;
    type: string;
    name: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
    postcode?: string;
    countrycode?: string;
    extent?: [number, number, number, number];
  };
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ results: [] });

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 3_600_000) return Response.json({ results: hit.results });

  const params = new URLSearchParams({ q, limit: "12", lang: "en", bbox: "112.5,-44.5,154.5,-9.5" });
  for (const layer of ["city", "district", "locality", "county", "state", "other", "street"]) {
    params.append("layer", layer);
  }
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    headers: { "User-Agent": "Atlas property search (+https://github.com)" },
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return Response.json({ results: [] }, { status: 200 });

  const json = (await res.json()) as { features: PhotonFeature[] };
  const seen = new Set<string>();
  const results: GeocodeResult[] = [];
  for (const f of json.features) {
    const p = f.properties;
    if (p.countrycode !== "AU") continue;
    const state = p.state ? (STATE_ABBR[p.state] ?? p.state) : "";
    const isPostcode = p.osm_value === "postcode";
    const kind: GeocodeResult["kind"] = isPostcode
      ? "postcode"
      : p.type === "street"
        ? "street"
        : p.type === "city"
          ? "city"
          : p.type === "state" || p.type === "county"
            ? "region"
            : p.type === "district" || p.type === "locality"
              ? "suburb"
              : "place";
    const name = isPostcode && p.district ? `${p.district} ${p.name}` : p.name;
    const context = [kind === "street" ? p.district : p.city !== p.name ? p.city : null, state, !isPostcode ? p.postcode : null]
      .filter(Boolean)
      .join(" · ");
    const dedupe = `${name}|${state}|${kind}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const [lng, lat] = f.geometry.coordinates;
    results.push({
      id: `${p.osm_id}`,
      name,
      context,
      kind,
      lat,
      lng,
      bbox: p.extent,
    });
    if (results.length >= 7) break;
  }
  const rank: Record<string, number> = { suburb: 0, postcode: 0, city: 1, region: 2, street: 3, place: 4 };
  results.sort((a, b) => rank[a.kind] - rank[b.kind]);

  cache.set(key, { at: Date.now(), results });
  if (cache.size > 1000) cache.delete(cache.keys().next().value!);
  return Response.json({ results });
}
