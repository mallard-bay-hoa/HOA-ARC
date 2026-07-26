"use server";

import { revalidatePath } from "next/cache";
import { getResidentSession } from "@/lib/session";
import { getRequestById, removeDocument } from "@/lib/data/requests";

export async function removeDocumentAction(requestId: string, documentId: string) {
  const session = await getResidentSession();
  if (!session) throw new Error("Not authenticated");

  const request = await getRequestById(requestId);
  if (!request || request.residentEmail !== session.email) throw new Error("Not found");

  await removeDocument(requestId, documentId);
  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/requests/${requestId}/review`);
}
