"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getResidentSession } from "@/lib/session";
import { getRequestById, submitRequest, addDocument } from "@/lib/data/requests";
import { uploadDocumentFile, hasAllowedDocumentExtension } from "@/lib/storage";

export async function submitAction(requestId: string) {
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(requestId);
  if (!request || !session.addresses.includes(request.address)) throw new Error("Not found");

  await submitRequest(requestId);
  redirect(`/requests/${requestId}`);
}

export async function uploadDocumentAction(
  requestId: string,
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | undefined> {
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(requestId);
  if (!request || !session.addresses.includes(request.address)) throw new Error("Not found");

  const files = (formData.getAll("file") as File[]).filter((f) => f.size > 0);
  if (files.length === 0) return { error: "Choose at least one file first." };

  const invalid = files.find((f) => !hasAllowedDocumentExtension(f.name));
  if (invalid) {
    return { error: `"${invalid.name}" isn't an allowed file type. Only PDF, Word (.doc/.docx), JPG, or PNG are allowed.` };
  }

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await uploadDocumentFile({ name: file.name, bytes, mimeType: file.type, requestId });

    await addDocument(requestId, {
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
      storagePath: result.storagePath,
      uploadedBy: session.email,
      uploadedAt: new Date().toISOString(),
    });
  }

  revalidatePath(`/requests/${requestId}/review`);
  return { success: true };
}
