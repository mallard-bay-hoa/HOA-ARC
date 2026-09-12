"use server";

import { redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById, addDocument, addOfficialMessageRaw, resubmitAfterInfoRequest, boardMembers } from "@/lib/data/requests";
import { uploadDocumentFile, hasAllowedDocumentExtension } from "@/lib/storage";
import { getCategory } from "@/lib/domain/categories";
import { sendEmail } from "@/lib/email";

export async function respondToInfoRequest(
  requestId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(requestId);
  if (!request || !session.addresses.includes(request.address)) throw new Error("Not found");
  if (request.status !== "info_requested") redirect(`/requests/${requestId}`);

  const body = (formData.get("body") as string | null)?.trim();
  if (!body) return { error: "Enter a response before sending." };

  const files = (formData.getAll("file") as File[]).filter((f) => f.size > 0);
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

  await addOfficialMessageRaw(requestId, session.email, "general", body);
  await resubmitAfterInfoRequest(requestId);

  const category = getCategory(request.categorySlug)?.name ?? request.categorySlug;
  const members = await boardMembers();
  await Promise.all(
    members.map((m) =>
      sendEmail(
        m.email,
        `${request.address} responded to your info request`,
        `${request.address} replied on their ${category} request:\n\n${body}`
      )
    )
  );

  redirect(`/requests/${requestId}`);
}
