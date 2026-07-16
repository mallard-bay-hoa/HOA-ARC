import "server-only";
import { cookies } from "next/headers";
import { boardMembers } from "./data/requests";
import type { BoardMember } from "./domain/types";

// TEMPORARY dev sessions — plain (unsigned) cookies. DESIGN.md §3 specifies
// Supabase Auth for real sessions (magic link for residents, real accounts
// for board members); this exists only so the app is clickable before that's
// wired up. Do not treat this as secure — it's a placeholder.

const RESIDENT_COOKIE = "arc_resident";
const BOARD_COOKIE = "arc_board";

export interface ResidentSession {
  email: string;
  address: string;
  name: string;
}

export async function getResidentSession(): Promise<ResidentSession | null> {
  const store = await cookies();
  const raw = store.get(RESIDENT_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ResidentSession;
  } catch {
    return null;
  }
}

export async function setResidentSession(session: ResidentSession): Promise<void> {
  const store = await cookies();
  store.set(RESIDENT_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getBoardSession(): Promise<BoardMember | null> {
  const store = await cookies();
  const id = store.get(BOARD_COOKIE)?.value;
  if (!id) return null;
  const members = await boardMembers();
  return members.find((m) => m.id === id) ?? null;
}

export async function setBoardSession(memberId: string): Promise<void> {
  const store = await cookies();
  store.set(BOARD_COOKIE, memberId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
