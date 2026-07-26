"use server";

import { revalidatePath } from "next/cache";
import { getResidentSession } from "@/lib/session";
import { getRequestById, removeDocument } from "@/lib/data/requests";
import { deleteDocumentFile } from "@/lib/storage";

export async function removeDocumentAction(requestId: string, documentId: string) {
  const session = await getResidentSession();
  if (!session) throw new Error("Not authenticated");

  const request = await getRequestById(requestId);
  if (!request || !session.addresses.includes(request.address)) throw new Error("Not found");

  const doc = request.documents.find((d) => d.id === documentId);
  await removeDocument(requestId, documentId);
  if (doc) await deleteDocumentFile(doc.storagePath);

  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/requests/${requestId}/review`);
}
