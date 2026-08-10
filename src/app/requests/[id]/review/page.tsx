import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById } from "@/lib/data/requests";
import { TopBar } from "@/components/TopBar";
import { Card, Button } from "@/components/ui";
import { submitAction } from "./actions";
import { UploadForm } from "./UploadForm";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(id);
  if (!request || !session.addresses.includes(request.address)) notFound();

  const description = typeof request.answers.description === "string" ? request.answers.description : "";
  const boundSubmit = submitAction.bind(null, request.id);

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title="Before you submit" />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
        <Link href={`/requests/${request.id}/questions`} className="mb-4 inline-block text-sm text-emerald-800 hover:underline">
          &larr; Back to edit
        </Link>
        <Card>
          <div>
            <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Project Description</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{description}</p>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            You&rsquo;ve certified that you understand and will comply with government and HOA requirements.
          </p>

          <UploadForm requestId={request.id} documents={request.documents} />

          <form action={boundSubmit} className="mt-6">
            <Button type="submit" className="w-full sm:w-auto">
              Submit Request
            </Button>
          </form>
        </Card>
      </main>
    </>
  );
}
