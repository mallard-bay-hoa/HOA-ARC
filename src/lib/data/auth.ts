import "server-only";
import { randomUUID } from "node:crypto";
import { readDb, writeDb } from "./store";

// TEMPORARY dev auth. DESIGN.md §3 specifies Supabase Auth's built-in
// passwordless magic-link sign-in for this exact "no password to remember"
// flow. Until that project is provisioned, this issues our own token and
// simulates the emailed link with a page you click through in the browser —
// same shape (token proves email ownership, not homeowner status), so
// swapping in real Supabase Auth later shouldn't change callers.

const RESIDENT_COOKIE = "arc_resident";
const BOARD_COOKIE = "arc_board";

export interface ResidentSession {
  email: string;
  address: string;
  name: string;
}

export function issueMagicLink(email: string, address: string, name: string): string {
  const db = readDb();
  const token = randomUUID();
  db.magicLinks.push({ token, email, address, name, createdAt: new Date().toISOString() });
  writeDb(db);
  return token;
}

export function consumeMagicLink(token: string): ResidentSession | null {
  const db = readDb();
  const link = db.magicLinks.find((l) => l.token === token);
  if (!link) return null;
  link.usedAt = new Date().toISOString();
  writeDb(db);
  return { email: link.email, address: link.address, name: link.name };
}

export { RESIDENT_COOKIE, BOARD_COOKIE };
