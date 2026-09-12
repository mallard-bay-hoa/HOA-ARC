import "server-only";
import { supabase } from "./supabase";

// Own magic-link token issuance/consumption (not Supabase Auth's built-in
// flow — DESIGN.md §3 describes that as a later step). The token proves
// email ownership, not homeowner status; `magic_links` is a plain table
// backed by real Postgres now instead of a JSON file.

const RESIDENT_COOKIE = "arc_resident";
const BOARD_COOKIE = "arc_board";

// Long enough that a recipient who doesn't check email daily still finds
// the link works when they get to it — notification emails now carry one
// of these instead of just prose, so it needs to survive that gap.
const MAGIC_LINK_TTL_DAYS = 30;

export type MagicLinkPurpose = "resident" | "board";

export async function issueMagicLink(
  email: string,
  purpose: MagicLinkPurpose = "resident",
  redirectTo?: string
): Promise<string> {
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("magic_links")
    .insert({ email, purpose, redirect_to: redirectTo ?? null, expires_at: expiresAt })
    .select("token")
    .single();
  if (error) throw new Error(error.message);
  return data.token as string;
}

export async function consumeMagicLink(
  token: string
): Promise<{ email: string; purpose: MagicLinkPurpose; redirectTo: string | null } | null> {
  const { data: link, error } = await supabase
    .from("magic_links")
    .select("email, purpose, redirect_to, expires_at")
    .eq("token", token)
    .single();
  if (error || !link) return null;
  if (new Date(link.expires_at).getTime() < Date.now()) return null;

  await supabase.from("magic_links").update({ used_at: new Date().toISOString() }).eq("token", token);
  return { email: link.email, purpose: link.purpose as MagicLinkPurpose, redirectTo: link.redirect_to };
}

/** Issues a magic link and returns the full sign-in URL, ready to drop into an email body. */
export async function signInLink(
  siteUrl: string,
  email: string,
  purpose: MagicLinkPurpose,
  redirectTo?: string
): Promise<string> {
  const token = await issueMagicLink(email, purpose, redirectTo);
  return `${siteUrl}/auth/link/${token}`;
}

export { RESIDENT_COOKIE, BOARD_COOKIE };
