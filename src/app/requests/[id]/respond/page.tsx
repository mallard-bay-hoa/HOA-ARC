import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById, getOfficialMessages } from "@/lib/data/requests";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui";
import { RespondForm } from "./RespondForm";

export default async function RespondPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(id);
  if (!request || request.residentEmail !== session.email) notFound();
  if (request.status !== "info_requested") redirect(`/requests/${id}`);

  const messages = await getOfficialMessages(id);
  const infoRequest = messages
    .filter((m) => m.messageType === "info_request")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title="Respond to the Board" />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
        <Link href={`/requests/${id}`} className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700">
          &larr; Back to request
        </Link>
        <Card>
          {infoRequest && (
            <div className="mb-4 rounded-md bg-amber-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-800">The Board is asking for</p>
              <p className="mt-1 text-sm text-amber-900">{infoRequest.body}</p>
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600">
            Add a response and, if needed, attach a document. This will notify the Board and move your
            request back into review.
          </p>
          <RespondForm requestId={id} />
        </Card>
      </main>
    </>
  );
}
