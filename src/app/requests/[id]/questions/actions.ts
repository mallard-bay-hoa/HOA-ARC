"use server";

import { redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById, saveAnswers } from "@/lib/data/requests";
import type { Answer } from "@/lib/domain/types";

export async function saveAnswersAndContinue(requestId: string, answers: Record<string, Answer>) {
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(requestId);
  if (!request || request.residentEmail !== session.email) {
    throw new Error("Not found");
  }

  await saveAnswers(requestId, answers);
  redirect(`/requests/${requestId}/review`);
}
