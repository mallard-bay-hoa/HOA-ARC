"use server";

import { redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { createDraftRequest } from "@/lib/data/requests";
import { getCategory } from "@/lib/domain/categories";

export async function startCategory(categorySlug: string) {
  const session = await getResidentSession();
  if (!session) redirect("/start");

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
