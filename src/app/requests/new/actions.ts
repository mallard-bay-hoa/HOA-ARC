"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getResidentSession, setResidentSession } from "@/lib/session";
import { createDraftRequest } from "@/lib/data/requests";
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
  await setResidentSession({ ...session, ...parsed.data });
  redirect("/requests/new");
}

export async function startCategory(categorySlug: string) {
  const session = await getResidentSession();
  if (!session) redirect("/start");
  if (!session.name || !session.address) redirect("/requests/new");

  const category = getCategory(categorySlug);
  if (!category || !category.enabled) {
    throw new Error("That category isn't available yet.");
  }

  const request = await createDraftRequest({
    categorySlug,
    address: session.address,
    residentName: session.name,
    residentEmail: session.email,
  });

  redirect(`/requests/${request.id}/questions`);
}
