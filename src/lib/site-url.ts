import "server-only";
import { headers } from "next/headers";

/** Absolute origin for building links in outbound emails — derived from the request, not hardcoded. */
export async function getSiteUrl(): Promise<string> {
  const store = await headers();
  const host = store.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
