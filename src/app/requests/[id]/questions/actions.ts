"use server";

import { redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById, saveAnswers } from "@/lib/data/requests";

export async function saveCertificationAndContinue(
  requestId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(requestId);
  if (!request || !session.addresses.includes(request.address)) {
    throw new Error("Not found");
  }

  const description = String(formData.get("description") ?? "").trim();
  const certified = formData.get("certifiedCompliance") === "on";

  if (!description) {
    return { error: "Please describe your project." };
  }
  if (!certified) {
    return { error: "You must certify that you understand and will comply with the requirements above." };
  }

  await saveAnswers(requestId, { description, certifiedCompliance: true });
  redirect(`/requests/${requestId}/review`);
}
