"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getBoardSession } from "@/lib/session";
import { addBoardComment, castVote, getOfficialMessages, requestMoreInfo } from "@/lib/data/requests";
import { getCategory } from "@/lib/domain/categories";
import { sendEmail } from "@/lib/email";
import type { RequestStatus, VoteDecision } from "@/lib/domain/types";

export async function addCommentAction(requestId: string, formData: FormData) {
  const member = await getBoardSession();
  if (!member) redirect("/board/signin");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  addBoardComment(requestId, member.id, member.name, body);
  revalidatePath(`/board/${requestId}`);
}

export async function requestInfoAction(requestId: string, formData: FormData) {
  const member = await getBoardSession();
  if (!member) redirect("/board/signin");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const request = requestMoreInfo(requestId, member.id, body);
  const category = getCategory(request.categorySlug)?.name ?? request.categorySlug;

  await sendEmail(
    request.residentEmail,
    `The Board needs more info on your ${category} request`,
    `${body}\n\nReply by logging back into your request at Mallard Bay ARC.\n\nThe Board`
  );

  revalidatePath(`/board/${requestId}`);
  revalidatePath("/board");
}

const DECISION_LABEL: Partial<Record<RequestStatus, string>> = {
  approved: "approved",
  approved_conditional: "approved with conditions",
  denied: "denied",
};

export async function castVoteAction(requestId: string, decision: VoteDecision, formData: FormData) {
  const member = await getBoardSession();
  if (!member) redirect("/board/signin");

  const citedSections = String(formData.get("citedSections") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const request = castVote(requestId, member.id, member.address, decision, citedSections);

  const label = DECISION_LABEL[request.status];
  if (label) {
    // Read back the actual decision message rather than this vote's own
    // input — the recorded citations are aggregated across every matching
    // vote (see castVote), which can include conditions another board
    // member typed on an earlier vote.
    const decisionMessage = getOfficialMessages(requestId)
      .filter((m) => m.messageType === request.status)
      .at(-1);
    const cited = decisionMessage?.citedSections ?? [];
    const category = getCategory(request.categorySlug)?.name ?? request.categorySlug;
    const conditionsLine = cited.length > 0 ? `\n\n${decision === "deny" ? "Citing" : "Conditions"}: ${cited.join(", ")}` : "";
    await sendEmail(
      request.residentEmail,
      `Your ${category} request has been ${label}`,
      `The Board has ${label} your request.${conditionsLine}\n\nThe Board`
    );
  }

  revalidatePath(`/board/${requestId}`);
  revalidatePath("/board");
}
