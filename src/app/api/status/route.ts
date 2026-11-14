import { connection } from "next/server";
import { domainConfigured } from "@/lib/server/domain";

export async function GET() {
  await connection();
  return Response.json({ source: domainConfigured() ? "domain" : "demo" });
}
