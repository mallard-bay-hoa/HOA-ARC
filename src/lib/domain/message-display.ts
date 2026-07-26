import type { MessageType } from "./types";

const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  info_request: "Info Requested",
  approved: "Approved",
  denied: "Denied",
  approved_conditional: "Approved (Conditions)",
  general: "Update",
  auto_approved: "Auto-Approved",
  expiry_warning: "Approval Expiring Soon",
  expired: "Approval Expired",
};

/** Display label for an official message's type — distinguishes a resident's own reply from Board updates. */
export function messageTypeLabel(messageType: MessageType, isFromResident: boolean): string {
  if (isFromResident) return "From Resident";
  return MESSAGE_TYPE_LABELS[messageType];
}

/**
 * Whether a message was authored by a resident rather than the Board/system. With shared
 * property access, any resident linked to the address (not just the original submitter) may
 * have authored it, so this checks "not a known board member and not the system", rather than
 * comparing against one specific email.
 */
export function isResidentAuthor(authorId: string, boardMemberIds: ReadonlySet<string>): boolean {
  return authorId !== "system" && !boardMemberIds.has(authorId);
}
