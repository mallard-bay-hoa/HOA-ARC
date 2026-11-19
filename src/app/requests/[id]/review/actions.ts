"use server";

import { redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById, submitRequest, addDocument, boardMembers } from "@/lib/data/requests";
import { verifyUploads, parseUploadedRefs } from "@/lib/storage";
import { getCategory } from "@/lib/domain/categories";
import { sendEmail } from "@/lib/email";
import { signInLink } from "@/lib/data/auth";
import { getSiteUrl } from "@/lib/site-url";

export async function submitAction(
  requestId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(requestId);
  if (!request || !session.addresses.includes(request.address)) throw new Error("Not found");

  let uploads;
  try {
    uploads = await verifyUploads(requestId, parseUploadedRefs(formData));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Your attachments couldn't be verified. Please try again." };
  }

  for (const file of uploads) {
    await addDocument(requestId, {
      name: file.name,
      sizeBytes: file.sizeBytes,
      mimeType: file.mimeType,
      storagePath: file.storagePath,
      uploadedBy: session.email,
      uploadedAt: new Date().toISOString(),
    });
  }

  const submitted = await submitRequest(requestId);

  const category = getCategory(submitted.categorySlug)?.name ?? submitted.categorySlug;
  const members = await boardMembers();
  const siteUrl = await getSiteUrl();
  await Promise.all(
    members.map(async (m) => {
      const link = await signInLink(siteUrl, m.email, "board", `/board/${requestId}`);
      await sendEmail(
        m.email,
        `New ${category} request from ${submitted.address}`,
        `${submitted.address} submitted a ${category} request for the Board to review.\n\nReview it here: ${link}`
      );
    })
  );

  redirect(`/requests/${requestId}`);
}
