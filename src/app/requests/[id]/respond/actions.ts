"use server";

import { redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById, addDocument, addOfficialMessageRaw, resubmitAfterInfoRequest } from "@/lib/data/requests";
import { uploadToDrive, hasAllowedDocumentExtension } from "@/lib/drive";

export async function respondToInfoRequest(
  requestId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(requestId);
  if (!request || request.residentEmail !== session.email) throw new Error("Not found");
  if (request.status !== "info_requested") redirect(`/requests/${requestId}`);

  const body = (formData.get("body") as string | null)?.trim();
  if (!body) return { error: "Enter a response before sending." };

  const file = formData.get("file") as File | null;
  if (file && file.size > 0) {
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
  }

  await addOfficialMessageRaw(requestId, session.email, "general", body);
  await resubmitAfterInfoRequest(requestId);

  redirect(`/requests/${requestId}`);
}
