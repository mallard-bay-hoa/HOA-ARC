"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getResidentSession } from "@/lib/session";
import { getRequestById, submitRequest, addDocument } from "@/lib/data/requests";
import { uploadToDrive, hasAllowedDocumentExtension } from "@/lib/drive";

export async function submitAction(requestId: string) {
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(requestId);
  if (!request || request.residentEmail !== session.email) throw new Error("Not found");

  await submitRequest(requestId);
  redirect(`/requests/${requestId}`);
}

export async function uploadDocumentAction(
  requestId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(requestId);
  if (!request || request.residentEmail !== session.email) throw new Error("Not found");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Choose a file first." };
  if (!hasAllowedDocumentExtension(file.name)) {
    return { error: "Only PDF, Word (.doc/.docx), JPG, or PNG files are allowed." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await uploadToDrive({
    name: file.name,
    bytes,
    mimeType: file.type,
    requestId,
    categorySlug: request.categorySlug,
    address: request.address,
  });

  await addDocument(requestId, {
    name: file.name,
    sizeBytes: file.size,
    uploadedBy: session.email,
    uploadedAt: new Date().toISOString(),
    persistedToDrive: result.persistedToDrive,
  });

  revalidatePath(`/requests/${requestId}/review`);
}
