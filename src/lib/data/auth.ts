import "server-only";
import { supabase } from "./supabase";

// Own magic-link token issuance/consumption (not Supabase Auth's built-in
// flow — DESIGN.md §3 describes that as a later step). The token proves
// email ownership, not homeowner status; `magic_links` is a plain table
// backed by real Postgres now instead of a JSON file.

const RESIDENT_COOKIE = "arc_resident";
const BOARD_COOKIE = "arc_board";

export interface ResidentSession {
  email: string;
  address: string;
  name: string;
}

export async function issueMagicLink(email: string, address: string, name: string): Promise<string> {
  const { data, error } = await supabase
    .from("magic_links")
    .insert({ email, address, name })
    .select("token")
    .single();
  if (error) throw new Error(error.message);
  return data.token as string;
}

export async function consumeMagicLink(token: string): Promise<ResidentSession | null> {
  const { data: link, error } = await supabase
    .from("magic_links")
    .select("email, address, name")
    .eq("token", token)
    .single();
  if (error || !link) return null;
  await supabase.from("magic_links").update({ used_at: new Date().toISOString() }).eq("token", token);
  return { email: link.email, address: link.address, name: link.name };
}

export { RESIDENT_COOKIE, BOARD_COOKIE };
