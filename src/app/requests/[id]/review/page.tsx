import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById } from "@/lib/data/requests";
import { TopBar } from "@/components/TopBar";
import { Card, Button, FlagRow } from "@/components/ui";
import { submitAction } from "./actions";
import { UploadForm } from "./UploadForm";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(id);
  if (!request || request.residentEmail !== session.email) notFound();

  const hasGovViolation = request.flags.some((f) => f.type === "government_violation");
  const boundSubmit = submitAction.bind(null, request.id);

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title="Before you submit" />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
        <Link href={`/requests/${request.id}/questions`} className="mb-4 inline-block text-sm text-emerald-800 hover:underline">
          &larr; Back to edit answers
        </Link>
        <Card>
          {request.flags.length === 0 ? (
            <p className="text-sm text-slate-600">No issues found &mdash; this request looks ready to submit.</p>
          ) : (
            <div>
              {request.flags.map((flag, i) => (
                <FlagRow key={i} flag={flag} />
              ))}
            </div>
          )}

          <UploadForm requestId={request.id} documents={request.documents} />

          <form action={boundSubmit} className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={hasGovViolation} className="w-full sm:w-auto">
                Submit Request
              </Button>
              {hasGovViolation && (
                <Link href={`/requests/${request.id}/questions`} className="text-sm text-emerald-800 hover:underline">
                  Edit my answers
                </Link>
              )}
            </div>
            {hasGovViolation && (
              <p className="mt-2 text-xs text-rose-700">Resolve the blocked item above before you can submit.</p>
            )}
          </form>
        </Card>
      </main>
    </>
  );
}
