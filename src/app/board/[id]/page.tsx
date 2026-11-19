import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getBoardSession } from "@/lib/session";
import { getRequestById, getBoardComments, getOfficialMessages, getVotes, boardMembers, markRequestViewed } from "@/lib/data/requests";
import { getCategory } from "@/lib/domain/categories";
import { messageTypeLabel, isResidentAuthor } from "@/lib/domain/message-display";
import { TopBar } from "@/components/TopBar";
import { Card, StatusPill, Button } from "@/components/ui";
import { DocumentLinks } from "@/components/DocumentLinks";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { VoteForm } from "./VoteForm";
import { addCommentAction, requestInfoAction, castVoteAction } from "./actions";

export default async function BoardRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getBoardSession();
  if (!member) redirect("/board/signin");

  const request = await getRequestById(id);
  if (!request) notFound();

  await markRequestViewed(id, member.id);

  const comments = await getBoardComments(id);
  const messages = (await getOfficialMessages(id)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const votes = await getVotes(id);
  const category = getCategory(request.categorySlug);
  const boardMemberIds = new Set((await boardMembers()).map((m) => m.id));

  const isOwnRequest = member.addresses.includes(request.address);
  const myVote = votes.find((v) => v.boardMemberId === member.id);
  const approveCount = votes.filter((v) => v.decision === "approve").length;
  const denyCount = votes.filter((v) => v.decision === "deny").length;
  const decided = ["approved", "approved_conditional", "denied", "auto_approved", "expired"].includes(request.status);

  const boundApprove = castVoteAction.bind(null, id, "approve");
  const boundDeny = castVoteAction.bind(null, id, "deny");
  const boundComment = addCommentAction.bind(null, id);
  const boundInfoRequest = requestInfoAction.bind(null, id);

  const description = request.answers.description;

  return (
    <>
      <TopBar
        eyebrow="Mallard Bay ARC — Board"
        title={`${request.address} — ${category?.name}`}
        right={<StatusPill status={request.status} />}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <Link href="/board" className="mb-4 inline-block text-sm text-emerald-100 hover:text-white">
          &larr; Back to All Requests
        </Link>
        <Card>
          <div className="space-y-12">
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Resident</h3>
                <p className="text-sm text-slate-800">
                  {request.residentName} &middot; {request.residentEmail}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Project Description</h3>
                <p className="whitespace-pre-wrap text-sm text-slate-800">
                  {typeof description === "string" && description.trim() ? description : "—"}
                </p>
              </div>
              {/* Attachments read as part of the description, so no heading of their own. */}
              <div id="documents">
                {request.documents.length === 0 ? (
                  <p className="text-sm text-slate-500">No documents attached.</p>
                ) : (
                  <ul className="space-y-1 text-sm text-slate-700">
                    {request.documents.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-3">
                        <span>
                          {d.name} ({Math.round(d.sizeBytes / 1024)} KB)
                        </span>
                        <DocumentLinks requestId={request.id} documentId={d.id} documentName={d.name} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="border-t border-slate-300 pt-12">
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-900">Vote &amp; Decide</h3>
              <p className="mb-3 text-xs text-slate-500">
                2 matching votes required, either way &middot; {approveCount} approve / {denyCount} deny so far
              </p>

              {isOwnRequest ? (
                <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-600">
                  This request is tied to your own address — you cannot vote on it.
                </p>
              ) : decided ? (
                <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                  Decision recorded: <StatusPill status={request.status} />
                </p>
              ) : (
                <div>
                  {myVote && (
                    <p className="mb-2 text-xs text-slate-500">
                      {`You voted to ${myVote.decision} — submit again below to change it.`}
                    </p>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <VoteForm
                      action={boundApprove}
                      decision="approve"
                      id="approve-message"
                      label="Message for approval, optional"
                      placeholder="Message (optional)"
                    />
                    <VoteForm
                      action={boundDeny}
                      decision="deny"
                      id="deny-message"
                      label="Message for denial, required"
                      placeholder="Message"
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="border-t border-slate-300 pt-12">
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-900">Internal Communication</h3>
              <p className="mb-3 text-xs text-slate-600">Never visible to the resident.</p>
              <div className="space-y-2">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-md bg-slate-100 px-3 py-2 text-sm">
                    <div className="text-xs font-mono uppercase tracking-wide text-slate-500">{c.authorName}</div>
                    <div className="text-slate-700">{c.body}</div>
                  </div>
                ))}
              </div>
              <form action={boundComment} className="mt-3 flex items-end gap-2">
                <label htmlFor="board-comment-body" className="sr-only">
                  Add a comment for the Board only
                </label>
                <AutoGrowTextarea
                  id="board-comment-body"
                  name="body"
                  placeholder="Add a comment for the Board only…"
                  className="flex-1 rounded-md border border-slate-500 px-3 py-2 text-sm"
                />
                <Button type="submit" variant="ghost">
                  Post
                </Button>
              </form>
            </section>

            <section className="border-t border-slate-300 pt-12">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-900">Resident Requested Info</h3>
              <div className="space-y-2">
                {messages.map((m) => {
                  const isFromResident = isResidentAuthor(m.authorId, boardMemberIds);
                  return (
                    <div
                      key={m.id}
                      className={`border-t border-slate-100 pt-2 text-sm ${isFromResident ? "ml-4 border-l-2 border-emerald-200 pl-3" : ""}`}
                    >
                      <div className="text-xs font-mono uppercase tracking-wide text-slate-500">
                        {`${new Date(m.createdAt).toLocaleDateString()} — ${messageTypeLabel(m.messageType, isFromResident)}`}
                      </div>
                      <div className="text-slate-700">{m.body}</div>
                      {m.citedSections.length > 0 && (
                        <div className="mt-1 text-xs text-slate-500">
                          {m.messageType === "approved_conditional" ? "Conditions" : "Reason"}: {m.citedSections.join(", ")}
                        </div>
                      )}
                      {m.documentIds.length > 0 && (
                        <div className="mt-1 text-xs text-slate-500">
                          {m.documentIds.length === 1 ? "Document" : `${m.documentIds.length} documents`} uploaded — see the{" "}
                          <a href="#documents" className="text-emerald-800 underline hover:text-emerald-900">
                            attached documents
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {!decided && (
                <form action={boundInfoRequest} className="mt-3 flex items-end gap-2">
                  <label htmlFor="info-request-body" className="sr-only">
                    Request more info from the resident
                  </label>
                  <AutoGrowTextarea
                    id="info-request-body"
                    name="body"
                    placeholder="Request more info from the resident…"
                    className="flex-1 rounded-md border border-slate-500 px-3 py-2 text-sm"
                  />
                  <Button type="submit" variant="ghost">
                    Send
                  </Button>
                </form>
              )}
            </section>
          </div>
        </Card>
      </main>
    </>
  );
}
