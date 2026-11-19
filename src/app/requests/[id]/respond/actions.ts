"use server";

import { redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById, addDocument, addOfficialMessageRaw, resubmitAfterInfoRequest, boardMembers } from "@/lib/data/requests";
import { verifyUploads, parseUploadedRefs } from "@/lib/storage";
import { getCategory } from "@/lib/domain/categories";
import { sendEmail } from "@/lib/email";
import { signInLink } from "@/lib/data/auth";
import { getSiteUrl } from "@/lib/site-url";

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

  let uploads;
  try {
    uploads = await verifyUploads(requestId, parseUploadedRefs(formData));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Your attachments couldn't be verified. Please try again." };
  }

  const uploadedDocumentIds: string[] = [];
  for (const file of uploads) {
    const updated = await addDocument(requestId, {
      name: file.name,
      sizeBytes: file.sizeBytes,
      mimeType: file.mimeType,
      storagePath: file.storagePath,
      uploadedBy: session.email,
      uploadedAt: new Date().toISOString(),
    });
    uploadedDocumentIds.push(updated.documents.at(-1)!.id);
  }

  await addOfficialMessageRaw(requestId, session.email, "general", body, [], uploadedDocumentIds);
  await resubmitAfterInfoRequest(requestId);

  const category = getCategory(request.categorySlug)?.name ?? request.categorySlug;
  const members = await boardMembers();
  const siteUrl = await getSiteUrl();
  await Promise.all(
    members.map(async (m) => {
      const link = await signInLink(siteUrl, m.email, "board", `/board/${requestId}?tab=communication`);
      await sendEmail(
        m.email,
        `${request.address} responded to your info request`,
        `${request.address} replied on their ${category} request:\n\n${body}\n\nView it here: ${link}`
      );
    })
  );

  redirect(`/requests/${requestId}`);
}
