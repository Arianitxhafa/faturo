import "server-only";
import { headers } from "next/headers";

/** This request's absolute origin (works behind Vercel's proxy and on localhost) — for links people copy. */
export async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
