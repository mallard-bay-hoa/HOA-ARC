import "server-only";
import { supabase } from "./supabase";
import type { BoardMember } from "../domain/types";

export interface ResidentInfo {
  name: string;
  phone: string | null;
  addresses: string[];
}

async function getAddressesForResidentId(residentId: string): Promise<string[]> {
  const { data: links } = await supabase
    .from("resident_properties")
    .select("properties(address)")
    .eq("resident_id", residentId);

  return (links ?? [])
    .map((l) => (l as unknown as { properties: { address: string } | null }).properties?.address)
    .filter((a): a is string => typeof a === "string");
}

/** Looks up a resident by email and every property they're linked to (a resident can be linked to more than one). */
export async function getResidentByEmail(email: string): Promise<ResidentInfo | null> {
  const { data: resident, error } = await supabase
    .from("residents")
    .select("id, name, phone")
    .ilike("email", email)
    .maybeSingle();
  if (error || !resident) return null;

  const addresses = await getAddressesForResidentId(resident.id);
  return { name: resident.name, phone: resident.phone, addresses };
}

/** Residents flagged as board members — just their id/name, for the sign-in page's list of names. */
export async function getBoardMemberCandidates(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from("residents").select("id, name").eq("is_board_member", true).order("name");
  if (error || !data) return [];
  return data;
}

/** A single board member's full info (email included, for sending their magic link) — never exposed to the sign-in page directly. */
export async function getBoardMemberById(id: string): Promise<BoardMember | null> {
  const { data: resident, error } = await supabase
    .from("residents")
    .select("id, name, email")
    .eq("id", id)
    .eq("is_board_member", true)
    .maybeSingle();
  if (error || !resident) return null;

  const addresses = await getAddressesForResidentId(resident.id);
  return { id: resident.id, name: resident.name, email: resident.email, addresses };
}

/** Looks up a board member by email — used when consuming a board magic link to grant the right session. */
export async function getBoardMemberByEmail(email: string): Promise<BoardMember | null> {
  const { data: resident, error } = await supabase
    .from("residents")
    .select("id, name, email")
    .ilike("email", email)
    .eq("is_board_member", true)
    .maybeSingle();
  if (error || !resident) return null;

  const addresses = await getAddressesForResidentId(resident.id);
  return { id: resident.id, name: resident.name, email: resident.email, addresses };
}

/** Every board member — used to attribute messages/comments to "the Board" vs a household. */
export async function getAllBoardMembers(): Promise<BoardMember[]> {
  const { data, error } = await supabase.from("residents").select("id, name, email").eq("is_board_member", true).order("name");
  if (error || !data) return [];

  return Promise.all(
    data.map(async (r) => ({ id: r.id, name: r.name, email: r.email, addresses: await getAddressesForResidentId(r.id) }))
  );
}

async function getOrCreatePropertyId(address: string): Promise<string> {
  const normalized = address.trim();
  const { data: existing } = await supabase.from("properties").select("id").ilike("address", normalized).maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("properties")
    .insert({ address: normalized })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Failed to create property");
  return created.id;
}

/**
 * Registers a resident's name/phone against a property, creating the property if it's new
 * and linking to it if the resident already exists (rather than always inserting fresh) —
 * this is what makes a second family member at an already-known address share access
 * automatically instead of creating a duplicate, disconnected record.
 */
export async function registerResident(input: { email: string; name: string; phone?: string | null; address: string }): Promise<void> {
  const propertyId = await getOrCreatePropertyId(input.address);

  const { data: resident, error } = await supabase
    .from("residents")
    .upsert({ email: input.email.toLowerCase(), name: input.name, phone: input.phone ?? null }, { onConflict: "email" })
    .select("id")
    .single();
  if (error || !resident) throw new Error(error?.message ?? "Failed to register resident");

  const { error: linkError } = await supabase
    .from("resident_properties")
    .upsert({ resident_id: resident.id, property_id: propertyId }, { onConflict: "resident_id,property_id" });
  if (linkError) throw new Error(linkError.message);
}
