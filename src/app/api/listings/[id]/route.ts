import { connection } from "next/server";
import { getListing } from "@/lib/server/search";

export async function GET(_req: Request, ctx: RouteContext<"/api/listings/[id]">) {
  await connection();
  const { id } = await ctx.params;
  const listing = await getListing(id);
  if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });
  return Response.json(listing);
}
