import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById, getOfficialMessages, boardMembers } from "@/lib/data/requests";
import { getCategory } from "@/lib/domain/categories";
import { isResidentAuthor } from "@/lib/domain/message-display";
import { TopBar } from "@/components/TopBar";
import { Card, StatusPill, Button } from "@/components/ui";
import { DocumentLinks } from "@/components/DocumentLinks";
import { removeDocumentAction } from "./actions";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(id);
  if (!request || !session.addresses.includes(request.address)) notFound();

  if (request.status === "draft") redirect(`/requests/${id}/questions`);

  const messages = (await getOfficialMessages(id)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const category = getCategory(request.categorySlug);
  const boardMemberIds = new Set((await boardMembers()).map((m) => m.id));

  return (
    <>
      <TopBar
        eyebrow="Mallard Bay ARC"
        title={`${category?.name} Request`}
        right={<StatusPill status={request.status} />}
      />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
        <Link href="/requests" className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700">
          &larr; Back to My Requests
        </Link>
        {request.slaDueAt && ["in_review", "info_requested"].includes(request.status) && (
          <p className="mb-4 text-sm text-slate-500">
            Board response due by {new Date(request.slaDueAt).toLocaleDateString()}
          </p>
        )}

        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Messages from the Board</h2>
          {messages.map((m) => {
            const isSelf = m.authorId === session.email;
            const isFromResident = isResidentAuthor(m.authorId, boardMemberIds);
            const authorLabel = isSelf ? "You" : isFromResident ? "Household" : "The Board";
            return (
              <div
                key={m.id}
                className={`border-t border-slate-100 py-3 first:border-t-0 ${isFromResident ? "ml-4 border-l-2 border-emerald-200 pl-3" : ""}`}
              >
                <div className="text-xs font-mono uppercase tracking-wide text-slate-500">
                  {`${new Date(m.createdAt).toLocaleDateString()} — ${authorLabel}`}
                </div>
                <div className="mt-1 text-sm text-slate-700">{m.body}</div>
                {m.citedSections.length > 0 && (
                  <div className="mt-1 text-xs text-slate-500">
                    {m.messageType === "approved_conditional" ? "Conditions" : "Citing"}: {m.citedSections.join(", ")}
                  </div>
                )}
              </div>
            );
          })}

          {request.status === "info_requested" && (
            <div className="mt-4 rounded-md bg-amber-50 p-3">
              <p className="text-sm text-amber-900">The Board has requested more information.</p>
              <Link href={`/requests/${request.id}/respond`} className="mt-2 inline-block">
                <Button>Respond</Button>
              </Link>
            </div>
          )}
        </Card>

        {request.documents.length > 0 && (
          <Card className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">Documents</h2>
            <ul className="space-y-1 text-sm text-slate-600">
              {request.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  <span>{d.name}</span>
                  <span className="flex shrink-0 items-center gap-3">
                    <DocumentLinks requestId={request.id} documentId={d.id} />
                    <form action={removeDocumentAction.bind(null, request.id, d.id)}>
                      <button type="submit" className="text-xs text-rose-700 hover:underline">
                        Remove
                      </button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </>
  );
}
