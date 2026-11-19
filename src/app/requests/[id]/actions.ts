"use server";

import { revalidatePath } from "next/cache";
import { getResidentSession } from "@/lib/session";
import { getRequestById, removeDocument } from "@/lib/data/requests";
import {
  createSignedUploads,
  deleteDocumentFile,
  hasAllowedDocumentExtension,
  MAX_TOTAL_UPLOAD_BYTES,
  type PreparedUpload,
} from "@/lib/storage";

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

/**
 * Step 1 of attaching files: validates the selection and hands back signed
 * upload tokens. Only file names and sizes cross this action — the bytes go
 * from the browser straight to Storage (Vercel caps request bodies at ~4.5MB).
 */
export async function prepareUploadsAction(
  requestId: string,
  files: { name: string; size: number }[]
): Promise<{ error: string } | { uploads: PreparedUpload[] }> {
  const session = await getResidentSession();
  if (!session) return { error: "Your session expired. Please sign in again." };

  const request = await getRequestById(requestId);
  if (!request || !session.addresses.includes(request.address)) return { error: "Request not found." };

  const invalid = files.find((f) => !hasAllowedDocumentExtension(f.name));
  if (invalid) {
    return { error: `"${invalid.name}" isn't an allowed file type. Only PDF, Word (.doc/.docx), JPG, or PNG are allowed.` };
  }
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_UPLOAD_BYTES) {
    return { error: "Those files are over the size limit. Remove one or attach smaller files." };
  }

  return { uploads: await createSignedUploads(requestId, files) };
}
