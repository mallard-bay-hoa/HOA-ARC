export type RequestStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "info_requested"
  | "approved"
  | "approved_conditional"
  | "denied"
  | "auto_approved";

export type FlagType = "hoa_conflict" | "government_violation" | "permit_reminder";

export interface RequestFlag {
  type: FlagType;
  citation: string;
  description: string;
}

export type InputType = "text" | "textarea" | "number" | "boolean" | "select" | "multiselect";

export interface Question {
  id: string;
  categorySlug: string;
  prompt: string;
  helper?: string;
  inputType: InputType;
  options?: { value: string; label: string }[];
  /** id of the question whose answer gates whether this one shows */
  parentId?: string;
  /**
   * This question only shows if the parent's answer matches this value.
   * When the parent is a `multiselect`, this checks that its answer array
   * *includes* this value rather than an exact match.
   */
  showsIfAnswer?: unknown;
  /** if true, this question doesn't block "Continue" when left blank */
  optional?: boolean;
  order: number;
}

export type Answer = string | number | boolean | string[];

export interface Category {
  slug: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface BoardMember {
  id: string;
  name: string;
  email: string;
  address: string; // board members are also residents (Requirements §2)
}

export interface Document {
  id: string;
  name: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
  /** true once real Google Drive upload is wired up; for now these are metadata-only stubs */
  persistedToDrive: boolean;
}

export interface BoardComment {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export type MessageType = "info_request" | "approved" | "denied" | "approved_conditional" | "general";

export interface OfficialMessage {
  id: string;
  requestId: string;
  authorId: string; // logged, never shown to the resident (Requirements §9)
  messageType: MessageType;
  body: string;
  citedSections: string[]; // required for denied / approved_conditional (Utah HB 217)
  createdAt: string;
}

export type VoteDecision = "approve" | "deny";

export interface Vote {
  id: string;
  requestId: string;
  boardMemberId: string;
  decision: VoteDecision;
  /** this voter's own conditions (if approving) or required citation (if denying) */
  citedSections: string[];
  createdAt: string;
}

export interface ArcRequest {
  id: string;
  categorySlug: string;
  address: string;
  residentName: string;
  residentEmail: string;
  status: RequestStatus;
  answers: Record<string, Answer>;
  flags: RequestFlag[];
  documents: Document[];
  submittedAt?: string;
  lastResubmittedAt?: string;
  slaDueAt?: string;
  failsafeDueAt?: string;
  decidedAt?: string;
  approvalExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MagicLinkToken {
  token: string;
  email: string;
  address: string;
  name: string;
  createdAt: string;
  usedAt?: string;
}

export interface Db {
  requests: ArcRequest[];
  boardComments: BoardComment[];
  officialMessages: OfficialMessage[];
  votes: Vote[];
  magicLinks: MagicLinkToken[];
  boardMembers: BoardMember[];
}
