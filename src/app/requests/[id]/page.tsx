import { notFound, redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById, getOfficialMessages } from "@/lib/data/requests";
import { getCategory } from "@/lib/domain/categories";
import { TopBar } from "@/components/TopBar";
import { Card, StatusPill } from "@/components/ui";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = getRequestById(id);
  if (!request || request.residentEmail !== session.email) notFound();

  if (request.status === "draft") redirect(`/requests/${id}/questions`);

  const messages = getOfficialMessages(id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const category = getCategory(request.categorySlug);

  return (
    <>
      <TopBar
        eyebrow="Mallard Bay ARC"
        title={`${category?.name} Request`}
        right={<StatusPill status={request.status} />}
      />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
        {request.slaDueAt && ["in_review", "info_requested"].includes(request.status) && (
          <p className="mb-4 text-sm text-slate-500">
            Board response due by {new Date(request.slaDueAt).toLocaleDateString()}
          </p>
        )}

        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Messages from the Board</h2>
          {messages.map((m) => (
            <div key={m.id} className="border-t border-slate-100 py-3 first:border-t-0">
              <div className="text-xs font-mono uppercase tracking-wide text-slate-500">
                {`${new Date(m.createdAt).toLocaleDateString()} — The Board`}
              </div>
              <div className="mt-1 text-sm text-slate-700">{m.body}</div>
              {m.citedSections.length > 0 && (
                <div className="mt-1 text-xs text-slate-500">
                  {m.messageType === "approved_conditional" ? "Conditions" : "Citing"}: {m.citedSections.join(", ")}
                </div>
              )}
            </div>
          ))}

          {request.status === "info_requested" && (
            <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              The Board has requested more information. Reply by adding a document or contacting the Board
              directly &mdash; a reply flow will be added here next.
            </p>
          )}
        </Card>

        {request.documents.length > 0 && (
          <Card className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">Documents</h2>
            <ul className="space-y-1 text-sm text-slate-600">
              {request.documents.map((d) => (
                <li key={d.id}>{d.name}</li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </>
  );
}
