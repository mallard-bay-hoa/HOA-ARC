import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Db } from "../domain/types";

// TEMPORARY dev store, backed by a JSON file instead of Supabase Postgres.
// DESIGN.md picks Supabase for the real database — this exists only so the
// app is fully clickable before that project is provisioned. Every function
// in `requests.ts`/`auth.ts` is written as if it were already talking to
// Postgres, so swapping this file for real Supabase queries later shouldn't
// touch the calling code.

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

function seed(): Db {
  return {
    requests: [],
    boardComments: [],
    officialMessages: [],
    votes: [],
    magicLinks: [],
    boardMembers: [
      { id: "board-1", name: "J. Alvarez", email: "j.alvarez@example.com", address: "456 Teal Ct" },
      { id: "board-2", name: "R. Chen", email: "r.chen@example.com", address: "789 Heron Way" },
      { id: "board-3", name: "S. Whitfield", email: "s.whitfield@example.com", address: "210 Pintail Ln" },
    ],
  };
}

function ensureFile(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed(), null, 2));
  }
}

export function readDb(): Db {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as Db;
}

export function writeDb(db: Db): void {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}
