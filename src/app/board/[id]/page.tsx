import { notFound, redirect } from "next/navigation";
import { getBoardSession } from "@/lib/session";
import { getRequestById, getBoardComments, getOfficialMessages, getVotes } from "@/lib/data/requests";
import { getCategory } from "@/lib/domain/categories";
import { TopBar } from "@/components/TopBar";
import { Card, StatusPill, FlagRow, Button } from "@/components/ui";
import { BoardTabs } from "./BoardTabs";
import { addCommentAction, requestInfoAction, castVoteAction } from "./actions";

export default async function BoardRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getBoardSession();
  if (!member) redirect("/board/signin");

  const request = await getRequestById(id);
  if (!request) notFound();

  const comments = await getBoardComments(id);
  const messages = (await getOfficialMessages(id)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const votes = await getVotes(id);
  const category = getCategory(request.categorySlug);

  const isOwnRequest = request.address === member.address;
  const myVote = votes.find((v) => v.boardMemberId === member.id);
  const approveCount = votes.filter((v) => v.decision === "approve").length;
  const denyCount = votes.filter((v) => v.decision === "deny").length;
  const decided = ["approved", "approved_conditional", "denied", "auto_approved"].includes(request.status);

  const boundApprove = castVoteAction.bind(null, id, "approve");
  const boundDeny = castVoteAction.bind(null, id, "deny");
  const boundComment = addCommentAction.bind(null, id);
  const boundInfoRequest = requestInfoAction.bind(null, id);

  const details = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Resident</p>
        <p className="text-sm text-slate-800">
          {request.residentName} &middot; {request.residentEmail}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Answers</p>
        <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {Object.entries(request.answers).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-slate-800">{Array.isArray(v) ? v.join(", ") : String(v)}</dd>
            </div>
          ))}
        </dl>
      </div>
      {request.flags.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Flags from intake</p>
          {request.flags.map((f, i) => (
            <FlagRow key={i} flag={f} />
          ))}
        </div>
      )}
    </div>
  );

  const documents = (
    <div>
      {request.documents.length === 0 ? (
        <p className="text-sm text-slate-500">No documents attached.</p>
      ) : (
        <ul className="space-y-1 text-sm text-slate-700">
          {request.documents.map((d) => (
            <li key={d.id}>
              {d.name} ({Math.round(d.sizeBytes / 1024)} KB)
              {!d.persistedToDrive && <span className="ml-2 text-xs text-amber-700">— not yet saved to Drive</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const discussion = (
    <div>
      <p className="mb-3 text-xs text-slate-400">Never visible to the resident.</p>
      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="rounded-md bg-slate-100 px-3 py-2 text-sm">
            <div className="text-xs font-mono uppercase tracking-wide text-slate-500">{c.authorName}</div>
            <div className="text-slate-700">{c.body}</div>
          </div>
        ))}
      </div>
      <form action={boundComment} className="mt-3 flex gap-2">
        <input name="body" placeholder="Add a comment for the Board only…" className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <Button type="submit" variant="ghost">
          Post
        </Button>
      </form>
    </div>
  );

  const communication = (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Messages to the resident</p>
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="border-t border-slate-100 pt-2 text-sm">
              <div className="text-xs font-mono uppercase tracking-wide text-slate-500">
                {`${new Date(m.createdAt).toLocaleDateString()} — ${m.messageType}`}
              </div>
              <div className="text-slate-700">{m.body}</div>
              {m.citedSections.length > 0 && (
                <div className="mt-1 text-xs text-slate-500">
                  {m.messageType === "approved_conditional" ? "Conditions" : "Citing"}: {m.citedSections.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
        {!decided && (
          <form action={boundInfoRequest} className="mt-3 flex gap-2">
            <input name="body" placeholder="Request more info from the resident…" className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <Button type="submit" variant="ghost">
              Send
            </Button>
          </form>
        )}
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Vote &amp; Decide</p>
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
            <form action={boundApprove} className="flex-1 space-y-2">
              <input
                name="citedSections"
                placeholder="Optional: conditions, comma-separated"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              />
              <Button type="submit" className="w-full">
                Approve
              </Button>
            </form>
            <form action={boundDeny} className="flex-1 space-y-2">
              <input
                name="citedSections"
                placeholder="Cite section(s), e.g. HOA Rule 4, comma-separated"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              />
              <Button type="submit" variant="danger" className="w-full">
                Deny
              </Button>
              <p className="text-xs text-slate-500">Required to deny — cites the specific rule the plan doesn&rsquo;t conform to (Utah HB 217).</p>
            </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <TopBar
        eyebrow="Mallard Bay ARC — Board"
        title={`${request.address} — ${category?.name}`}
        right={<StatusPill status={request.status} />}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <Card>
          <BoardTabs details={details} documents={documents} discussion={discussion} communication={communication} />
        </Card>
      </main>
    </>
  );
}
