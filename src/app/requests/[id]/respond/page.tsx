import { notFound, redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById } from "@/lib/data/requests";
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

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title="Respond to the Board" />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
        <Card>
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
