"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getResidentSession, setResidentSession } from "@/lib/session";
import { createDraftRequest } from "@/lib/data/requests";
import { registerResident } from "@/lib/data/residents";
import { getCategory } from "@/lib/domain/categories";

const detailsSchema = z.object({
  name: z.string().min(1, "Enter your full name"),
  address: z.string().min(1, "Enter your property address"),
});

export async function saveResidentDetails(_prevState: { error?: string } | undefined, formData: FormData) {
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const parsed = detailsSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your answers." };
  }

  // Requirements §12: homeowner verification happens here in a real build —
  // matching `address` against a roster, or routing to an admin-glance queue
  // if unmatched. Neither exists yet, so every request proceeds directly.
  // registerResident links to an existing property (sharing access with anyone
  // already there) or creates a new one if the address isn't on file yet.
  await registerResident({
    email: session.email,
    name: parsed.data.name,
    phone: session.phone,
    address: parsed.data.address,
  });

  const address = parsed.data.address.trim();
  await setResidentSession({
    ...session,
    name: parsed.data.name,
    addresses: session.addresses.includes(address) ? session.addresses : [...session.addresses, address],
  });
  redirect("/requests/new");
}

export async function startCategory(categorySlug: string, address: string) {
  const session = await getResidentSession();
  if (!session) redirect("/start");
  if (!session.name || !session.addresses.includes(address)) redirect("/requests/new");

  const category = getCategory(categorySlug);
  if (!category || !category.enabled) {
    throw new Error("That category isn't available yet.");
  }

  const request = await createDraftRequest({
    categorySlug,
    address,
    residentName: session.name,
    residentEmail: session.email,
  });

  redirect(`/requests/${request.id}/questions`);
}
