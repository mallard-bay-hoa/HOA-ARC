"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getBoardSession } from "@/lib/session";
import { addBoardComment, castVote, getOfficialMessages, requestMoreInfo } from "@/lib/data/requests";
import { getCategory } from "@/lib/domain/categories";
import { sendEmail } from "@/lib/email";
import { signInLink } from "@/lib/data/auth";
import { getSiteUrl } from "@/lib/site-url";
import type { RequestStatus, VoteDecision } from "@/lib/domain/types";

export async function addCommentAction(requestId: string, formData: FormData) {
  const member = await getBoardSession();
  if (!member) redirect("/board/signin");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await addBoardComment(requestId, member.id, member.name, body);
  revalidatePath(`/board/${requestId}`);
}

export async function requestInfoAction(requestId: string, formData: FormData) {
  const member = await getBoardSession();
  if (!member) redirect("/board/signin");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const request = await requestMoreInfo(requestId, member.id, body);
  const category = getCategory(request.categorySlug)?.name ?? request.categorySlug;

  const siteUrl = await getSiteUrl();
  const link = await signInLink(siteUrl, request.residentEmail, "resident", `/requests/${requestId}`);
  await sendEmail(
    request.residentEmail,
    `The Board needs more info on your ${category} request`,
    `${body}\n\nRespond here: ${link}\n\nThe Board`
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

  const request = await castVote(requestId, member.id, member.addresses, decision, citedSections);

  const label = DECISION_LABEL[request.status];
  if (label) {
    // Read back the actual decision message rather than this vote's own
    // input — the recorded citations are aggregated across every matching
    // vote (see castVote), which can include conditions another board
    // member typed on an earlier vote.
    const messages = await getOfficialMessages(requestId);
    const decisionMessage = messages
      .filter((m) => m.messageType === request.status)
      .at(-1);
    const cited = decisionMessage?.citedSections ?? [];
    const category = getCategory(request.categorySlug)?.name ?? request.categorySlug;
    const conditionsLine = cited.length > 0 ? `\n\n${decision === "deny" ? "Citing" : "Conditions"}: ${cited.join(", ")}` : "";
    const siteUrl = await getSiteUrl();
    const link = await signInLink(siteUrl, request.residentEmail, "resident", `/requests/${requestId}`);
    await sendEmail(
      request.residentEmail,
      `Your ${category} request has been ${label}`,
      `The Board has ${label} your request.${conditionsLine}\n\nView your request: ${link}\n\nThe Board`
    );
  }

  revalidatePath(`/board/${requestId}`);
  revalidatePath("/board");
}
