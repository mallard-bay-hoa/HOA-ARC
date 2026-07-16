import "server-only";
import { randomUUID } from "node:crypto";
import { supabase } from "./supabase";
import { getCategoryModule } from "../domain/registry";
import type {
  Answer,
  ArcRequest,
  BoardComment,
  BoardMember,
  Document,
  MessageType,
  OfficialMessage,
  RequestFlag,
  Vote,
  VoteDecision,
} from "../domain/types";

const SLA_DAYS = 14; // Requirements §7 — board's target response time
const FAILSAFE_DAYS = 28; // Requirements §7 — hard auto-approval deadline
const APPROVAL_EXPIRY_DAYS = 90; // Rule 9.5 — approval lapses if work hasn't started

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function evaluateFlags(categorySlug: string, answers: Record<string, Answer>): RequestFlag[] {
  return getCategoryModule(categorySlug)?.evaluate(answers) ?? [];
}

interface RequestRow {
  id: string;
  category_slug: string;
  address: string;
  resident_name: string;
  resident_email: string;
  status: ArcRequest["status"];
  answers: Record<string, Answer>;
  flags: RequestFlag[];
  documents: Document[];
  submitted_at: string | null;
  last_resubmitted_at: string | null;
  sla_due_at: string | null;
  failsafe_due_at: string | null;
  decided_at: string | null;
  approval_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToRequest(row: RequestRow): ArcRequest {
  return {
    id: row.id,
    categorySlug: row.category_slug,
    address: row.address,
    residentName: row.resident_name,
    residentEmail: row.resident_email,
    status: row.status,
    answers: row.answers ?? {},
    flags: row.flags ?? [],
    documents: row.documents ?? [],
    submittedAt: row.submitted_at ?? undefined,
    lastResubmittedAt: row.last_resubmitted_at ?? undefined,
    slaDueAt: row.sla_due_at ?? undefined,
    failsafeDueAt: row.failsafe_due_at ?? undefined,
    decidedAt: row.decided_at ?? undefined,
    approvalExpiresAt: row.approval_expires_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface BoardCommentRow {
  id: string;
  request_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

function rowToBoardComment(row: BoardCommentRow): BoardComment {
  return {
    id: row.id,
    requestId: row.request_id,
    authorId: row.author_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

interface OfficialMessageRow {
  id: string;
  request_id: string;
  author_id: string;
  message_type: MessageType;
  body: string;
  cited_sections: string[];
  created_at: string;
}

function rowToOfficialMessage(row: OfficialMessageRow): OfficialMessage {
  return {
    id: row.id,
    requestId: row.request_id,
    authorId: row.author_id,
    messageType: row.message_type,
    body: row.body,
    citedSections: row.cited_sections ?? [],
    createdAt: row.created_at,
  };
}

interface VoteRow {
  id: string;
  request_id: string;
  board_member_id: string;
  decision: VoteDecision;
  cited_sections: string[];
  created_at: string;
}

function rowToVote(row: VoteRow): Vote {
  return {
    id: row.id,
    requestId: row.request_id,
    boardMemberId: row.board_member_id,
    decision: row.decision,
    citedSections: row.cited_sections ?? [],
    createdAt: row.created_at,
  };
}

async function fetchRequest(requestId: string): Promise<ArcRequest> {
  const { data, error } = await supabase.from("requests").select("*").eq("id", requestId).single();
  if (error || !data) throw new Error("Request not found");
  return rowToRequest(data as RequestRow);
}

export async function createDraftRequest(input: {
  categorySlug: string;
  address: string;
  residentName: string;
  residentEmail: string;
}): Promise<ArcRequest> {
  const { data, error } = await supabase
    .from("requests")
    .insert({
      category_slug: input.categorySlug,
      address: input.address,
      resident_name: input.residentName,
      resident_email: input.residentEmail,
      status: "draft",
      answers: {},
      flags: [],
      documents: [],
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create request");
  return rowToRequest(data as RequestRow);
}

export async function saveAnswers(requestId: string, answers: Record<string, Answer>): Promise<ArcRequest> {
  const request = await fetchRequest(requestId);
  const mergedAnswers = { ...request.answers, ...answers };
  const flags = evaluateFlags(request.categorySlug, mergedAnswers);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("requests")
    .update({ answers: mergedAnswers, flags, updated_at: now })
    .eq("id", requestId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to save answers");
  return rowToRequest(data as RequestRow);
}

export async function submitRequest(requestId: string): Promise<ArcRequest> {
  const request = await fetchRequest(requestId);

  const hasGovViolation = request.flags.some((f) => f.type === "government_violation");
  if (hasGovViolation) {
    throw new Error("Cannot submit while a government requirement is violated.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("requests")
    .update({
      status: "in_review",
      submitted_at: now,
      last_resubmitted_at: now,
      sla_due_at: addDays(now, SLA_DAYS),
      failsafe_due_at: addDays(now, FAILSAFE_DAYS),
      updated_at: now,
    })
    .eq("id", requestId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to submit request");

  await supabase.from("official_messages").insert({
    request_id: requestId,
    author_id: "system",
    message_type: "general",
    body: "Request submitted and received.",
    cited_sections: [],
  });

  return rowToRequest(data as RequestRow);
}

export async function getRequestById(id: string): Promise<ArcRequest | undefined> {
  const { data, error } = await supabase.from("requests").select("*").eq("id", id).single();
  if (error || !data) return undefined;
  return rowToRequest(data as RequestRow);
}

export async function getRequestsByEmail(email: string): Promise<ArcRequest[]> {
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .ilike("resident_email", email)
    .neq("status", "draft");
  if (error || !data) return [];
  return (data as RequestRow[]).map(rowToRequest).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllRequests(): Promise<ArcRequest[]> {
  const { data, error } = await supabase.from("requests").select("*").neq("status", "draft");
  if (error || !data) return [];
  return (data as RequestRow[])
    .map(rowToRequest)
    .sort((a, b) => (a.slaDueAt ?? "").localeCompare(b.slaDueAt ?? ""));
}

export async function addDocument(requestId: string, doc: Omit<Document, "id">): Promise<ArcRequest> {
  const request = await fetchRequest(requestId);
  const documents = [...request.documents, { ...doc, id: randomUUID() }];
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("requests")
    .update({ documents, updated_at: now })
    .eq("id", requestId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to add document");
  return rowToRequest(data as RequestRow);
}

export async function addBoardComment(
  requestId: string,
  authorId: string,
  authorName: string,
  body: string
): Promise<BoardComment> {
  const { data, error } = await supabase
    .from("board_comments")
    .insert({ request_id: requestId, author_id: authorId, author_name: authorName, body })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to add comment");
  return rowToBoardComment(data as BoardCommentRow);
}

export async function getBoardComments(requestId: string): Promise<BoardComment[]> {
  const { data, error } = await supabase.from("board_comments").select("*").eq("request_id", requestId);
  if (error || !data) return [];
  return (data as BoardCommentRow[]).map(rowToBoardComment);
}

export async function getOfficialMessages(requestId: string): Promise<OfficialMessage[]> {
  const { data, error } = await supabase.from("official_messages").select("*").eq("request_id", requestId);
  if (error || !data) return [];
  return (data as OfficialMessageRow[]).map(rowToOfficialMessage);
}

export async function requestMoreInfo(requestId: string, authorId: string, body: string): Promise<ArcRequest> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("requests")
    .update({ status: "info_requested", updated_at: now })
    .eq("id", requestId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Request not found");

  await supabase.from("official_messages").insert({
    request_id: requestId,
    author_id: authorId,
    message_type: "info_request",
    body,
    cited_sections: [],
  });

  return rowToRequest(data as RequestRow);
}

/** Resident resubmits after an info-request — this is what resets the 14/28-day clocks (Requirements §7). */
export async function resubmitAfterInfoRequest(requestId: string): Promise<ArcRequest> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("requests")
    .update({
      status: "in_review",
      last_resubmitted_at: now,
      sla_due_at: addDays(now, SLA_DAYS),
      failsafe_due_at: addDays(now, FAILSAFE_DAYS),
      updated_at: now,
    })
    .eq("id", requestId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Request not found");
  return rowToRequest(data as RequestRow);
}

export async function getVotes(requestId: string): Promise<Vote[]> {
  const { data, error } = await supabase.from("votes").select("*").eq("request_id", requestId);
  if (error || !data) return [];
  return (data as VoteRow[]).map(rowToVote);
}

/**
 * Cast a board vote. Requirements §7 / DESIGN.md §6: 2 matching votes decide
 * a request either way (approve or deny — deny is symmetric, per your
 * decision that anything reaching a vote is a judgment call deserving the
 * same 2-person bar). A board member cannot vote on a request tied to their
 * own address (conflict of interest).
 */
export async function castVote(
  requestId: string,
  boardMemberId: string,
  boardMemberAddress: string,
  decision: VoteDecision,
  citedSections: string[]
): Promise<ArcRequest> {
  const request = await fetchRequest(requestId);

  if (request.address === boardMemberAddress) {
    throw new Error("Board members cannot vote on their own request.");
  }
  if (decision === "deny" && citedSections.length === 0) {
    throw new Error("Denying a request requires citing at least one governing document section.");
  }

  const { error: upsertError } = await supabase
    .from("votes")
    .upsert(
      {
        request_id: requestId,
        board_member_id: boardMemberId,
        decision,
        cited_sections: citedSections,
        created_at: new Date().toISOString(),
      },
      { onConflict: "request_id,board_member_id" }
    );
  if (upsertError) throw new Error(upsertError.message);

  const votesForRequest = await getVotes(requestId);
  const approveVotes = votesForRequest.filter((v) => v.decision === "approve");
  const denyVotes = votesForRequest.filter((v) => v.decision === "deny");

  // Conditions/citations are collected per-vote, but the decision is made by
  // the *pair* of matching votes — so the final message aggregates every
  // matching voter's citations, not just whichever vote happened to cross
  // the 2-vote threshold. Otherwise a condition one board member typed can
  // silently vanish if the second (deciding) voter left the field blank.
  function aggregatedCitations(votes: typeof votesForRequest): string[] {
    return Array.from(new Set(votes.flatMap((v) => v.citedSections)));
  }

  const now = new Date().toISOString();
  let update: Record<string, unknown> | null = null;

  if (approveVotes.length >= 2) {
    const allConditions = aggregatedCitations(approveVotes);
    const status = allConditions.length > 0 ? "approved_conditional" : "approved";
    update = { status, decided_at: now, approval_expires_at: addDays(now, APPROVAL_EXPIRY_DAYS), updated_at: now };
    await supabase.from("official_messages").insert({
      request_id: requestId,
      author_id: boardMemberId,
      message_type: status,
      body: status === "approved_conditional" ? "Approved with conditions by the Board." : "Approved by the Board.",
      cited_sections: allConditions,
    });
  } else if (denyVotes.length >= 2) {
    const allCitations = aggregatedCitations(denyVotes);
    if (allCitations.length === 0) {
      throw new Error("A denial requires citing at least one governing document section (Utah HB 217).");
    }
    update = { status: "denied", decided_at: now, updated_at: now };
    await supabase.from("official_messages").insert({
      request_id: requestId,
      author_id: boardMemberId,
      message_type: "denied",
      body: "Denied by the Board.",
      cited_sections: allCitations,
    });
  } else {
    update = { updated_at: now };
  }

  const { data, error } = await supabase.from("requests").update(update).eq("id", requestId).select("*").single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update request");
  return rowToRequest(data as RequestRow);
}

export async function addOfficialMessageRaw(
  requestId: string,
  authorId: string,
  messageType: MessageType,
  body: string,
  citedSections: string[] = []
): Promise<OfficialMessage> {
  const { data, error } = await supabase
    .from("official_messages")
    .insert({ request_id: requestId, author_id: authorId, message_type: messageType, body, cited_sections: citedSections })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to add message");
  return rowToOfficialMessage(data as OfficialMessageRow);
}

export type DueUrgency = "ok" | "warn" | "bad" | "none";

export function dueChip(request: ArcRequest): { label: string; urgency: DueUrgency } {
  if (!["in_review", "info_requested"].includes(request.status)) return { label: "—", urgency: "none" };
  if (!request.slaDueAt) return { label: "—", urgency: "none" };
  const due = new Date(request.slaDueAt).getTime();
  const now = Date.now();
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Overdue ${Math.abs(diffDays)}d`, urgency: "bad" };
  if (diffDays <= 3) return { label: `Due ${diffDays}d`, urgency: "warn" };
  return { label: `Due ${diffDays}d`, urgency: "ok" };
}

export async function boardMembers(): Promise<BoardMember[]> {
  const { data, error } = await supabase.from("board_members").select("*");
  if (error || !data) return [];
  return data as BoardMember[];
}
