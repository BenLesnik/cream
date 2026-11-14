import { DEFAULT_FILTERS } from "@/lib/constants";
import { searchListings } from "@/lib/server/search";
import type { SearchRequest } from "@/lib/types";

export async function POST(request: Request) {
  let body: SearchRequest;
  try {
    body = (await request.json()) as SearchRequest;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body?.bounds;
  if (!b || [b.north, b.south, b.east, b.west].some((v) => typeof v !== "number" || !Number.isFinite(v))) {
    return Response.json({ error: "bounds are required" }, { status: 400 });
  }
  const result = await searchListings({
    ...body,
    filters: { ...DEFAULT_FILTERS, ...body.filters },
    page: Math.max(1, Math.floor(body.page ?? 1)),
  });
  return Response.json(result);
}
