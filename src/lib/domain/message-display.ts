import type { MessageType } from "./types";

const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  info_request: "Info Requested",
  approved: "Approved",
  denied: "Denied",
  approved_conditional: "Approved (Conditions)",
  general: "Update",
};

/** Display label for an official message's type — distinguishes a resident's own reply from Board updates. */
export function messageTypeLabel(messageType: MessageType, isFromResident: boolean): string {
  if (isFromResident) return "From Resident";
  return MESSAGE_TYPE_LABELS[messageType];
}
