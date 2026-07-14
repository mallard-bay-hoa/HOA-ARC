import "server-only";
import { randomUUID } from "node:crypto";
import { readDb, writeDb } from "./store";
import { getCategoryModule } from "../domain/registry";
import type {
  Answer,
  ArcRequest,
  BoardComment,
  Document,
  MessageType,
  OfficialMessage,
  RequestFlag,
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

export function createDraftRequest(input: {
  categorySlug: string;
  address: string;
  residentName: string;
  residentEmail: string;
}): ArcRequest {
  const db = readDb();
  const now = new Date().toISOString();
  const request: ArcRequest = {
    id: randomUUID(),
    categorySlug: input.categorySlug,
    address: input.address,
    residentName: input.residentName,
    residentEmail: input.residentEmail,
    status: "draft",
    answers: {},
    flags: [],
    documents: [],
    createdAt: now,
    updatedAt: now,
  };
  db.requests.push(request);
  writeDb(db);
  return request;
}

export function saveAnswers(requestId: string, answers: Record<string, Answer>): ArcRequest {
  const db = readDb();
  const request = db.requests.find((r) => r.id === requestId);
  if (!request) throw new Error("Request not found");
  request.answers = { ...request.answers, ...answers };
  request.flags = evaluateFlags(request.categorySlug, request.answers);
  request.updatedAt = new Date().toISOString();
  writeDb(db);
  return request;
}

export function submitRequest(requestId: string): ArcRequest {
  const db = readDb();
  const request = db.requests.find((r) => r.id === requestId);
  if (!request) throw new Error("Request not found");

  const hasGovViolation = request.flags.some((f) => f.type === "government_violation");
  if (hasGovViolation) {
    throw new Error("Cannot submit while a government requirement is violated.");
  }

  const now = new Date().toISOString();
  // Submission moves a request straight into the board's review queue.
  request.status = "in_review";
  request.submittedAt = now;
  request.lastResubmittedAt = now;
  request.slaDueAt = addDays(now, SLA_DAYS);
  request.failsafeDueAt = addDays(now, FAILSAFE_DAYS);
  request.updatedAt = now;

  db.officialMessages.push({
    id: randomUUID(),
    requestId,
    authorId: "system",
    messageType: "general",
    body: "Request submitted and received.",
    citedSections: [],
    createdAt: now,
  });

  writeDb(db);
  return request;
}

export function getRequestById(id: string): ArcRequest | undefined {
  return readDb().requests.find((r) => r.id === id);
}

export function getRequestsByEmail(email: string): ArcRequest[] {
  return readDb()
    .requests.filter((r) => r.residentEmail.toLowerCase() === email.toLowerCase() && r.status !== "draft")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAllRequests(): ArcRequest[] {
  return readDb()
    .requests.filter((r) => r.status !== "draft")
    .sort((a, b) => (a.slaDueAt ?? "").localeCompare(b.slaDueAt ?? ""));
}

export function addDocument(requestId: string, doc: Omit<Document, "id">): ArcRequest {
  const db = readDb();
  const request = db.requests.find((r) => r.id === requestId);
  if (!request) throw new Error("Request not found");
  request.documents.push({ ...doc, id: randomUUID() });
  request.updatedAt = new Date().toISOString();
  writeDb(db);
  return request;
}

export function addBoardComment(requestId: string, authorId: string, authorName: string, body: string): BoardComment {
  const db = readDb();
  const comment: BoardComment = {
    id: randomUUID(),
    requestId,
    authorId,
    authorName,
    body,
    createdAt: new Date().toISOString(),
  };
  db.boardComments.push(comment);
  writeDb(db);
  return comment;
}

export function getBoardComments(requestId: string): BoardComment[] {
  return readDb().boardComments.filter((c) => c.requestId === requestId);
}

export function getOfficialMessages(requestId: string): OfficialMessage[] {
  return readDb().officialMessages.filter((m) => m.requestId === requestId);
}

export function requestMoreInfo(requestId: string, authorId: string, body: string): ArcRequest {
  const db = readDb();
  const request = db.requests.find((r) => r.id === requestId);
  if (!request) throw new Error("Request not found");
  const now = new Date().toISOString();
  request.status = "info_requested";
  request.updatedAt = now;
  db.officialMessages.push({
    id: randomUUID(),
    requestId,
    authorId,
    messageType: "info_request",
    body,
    citedSections: [],
    createdAt: now,
  });
  writeDb(db);
  return request;
}

/** Resident resubmits after an info-request — this is what resets the 14/28-day clocks (Requirements §7). */
export function resubmitAfterInfoRequest(requestId: string): ArcRequest {
  const db = readDb();
  const request = db.requests.find((r) => r.id === requestId);
  if (!request) throw new Error("Request not found");
  const now = new Date().toISOString();
  request.status = "in_review";
  request.lastResubmittedAt = now;
  request.slaDueAt = addDays(now, SLA_DAYS);
  request.failsafeDueAt = addDays(now, FAILSAFE_DAYS);
  request.updatedAt = now;
  writeDb(db);
  return request;
}

export function getVotes(requestId: string) {
  return readDb().votes.filter((v) => v.requestId === requestId);
}

/**
 * Cast a board vote. Requirements §7 / DESIGN.md §6: 2 matching votes decide
 * a request either way (approve or deny — deny is symmetric, per your
 * decision that anything reaching a vote is a judgment call deserving the
 * same 2-person bar). A board member cannot vote on a request tied to their
 * own address (conflict of interest).
 */
export function castVote(
  requestId: string,
  boardMemberId: string,
  boardMemberAddress: string,
  decision: VoteDecision,
  citedSections: string[]
): ArcRequest {
  const db = readDb();
  const request = db.requests.find((r) => r.id === requestId);
  if (!request) throw new Error("Request not found");

  if (request.address === boardMemberAddress) {
    throw new Error("Board members cannot vote on their own request.");
  }
  if (decision === "deny" && citedSections.length === 0) {
    throw new Error("Denying a request requires citing at least one governing document section.");
  }

  const existing = db.votes.find((v) => v.requestId === requestId && v.boardMemberId === boardMemberId);
  if (existing) {
    existing.decision = decision;
    existing.citedSections = citedSections;
    existing.createdAt = new Date().toISOString();
  } else {
    db.votes.push({
      id: randomUUID(),
      requestId,
      boardMemberId,
      decision,
      citedSections,
      createdAt: new Date().toISOString(),
    });
  }

  const votesForRequest = db.votes.filter((v) => v.requestId === requestId);
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
  if (approveVotes.length >= 2) {
    const allConditions = aggregatedCitations(approveVotes);
    request.status = allConditions.length > 0 ? "approved_conditional" : "approved";
    request.decidedAt = now;
    request.approvalExpiresAt = addDays(now, APPROVAL_EXPIRY_DAYS);
    db.officialMessages.push({
      id: randomUUID(),
      requestId,
      authorId: boardMemberId,
      messageType: request.status,
      body:
        request.status === "approved_conditional"
          ? "Approved with conditions by the Board."
          : "Approved by the Board.",
      citedSections: allConditions,
      createdAt: now,
    });
  } else if (denyVotes.length >= 2) {
    const allCitations = aggregatedCitations(denyVotes);
    if (allCitations.length === 0) {
      throw new Error("A denial requires citing at least one governing document section (Utah HB 217).");
    }
    request.status = "denied";
    request.decidedAt = now;
    db.officialMessages.push({
      id: randomUUID(),
      requestId,
      authorId: boardMemberId,
      messageType: "denied",
      body: "Denied by the Board.",
      citedSections: allCitations,
      createdAt: now,
    });
  }

  request.updatedAt = now;
  writeDb(db);
  return request;
}

export function addOfficialMessageRaw(requestId: string, authorId: string, messageType: MessageType, body: string, citedSections: string[] = []): OfficialMessage {
  const db = readDb();
  const msg: OfficialMessage = {
    id: randomUUID(),
    requestId,
    authorId,
    messageType,
    body,
    citedSections,
    createdAt: new Date().toISOString(),
  };
  db.officialMessages.push(msg);
  writeDb(db);
  return msg;
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

export function boardMembers() {
  return readDb().boardMembers;
}
