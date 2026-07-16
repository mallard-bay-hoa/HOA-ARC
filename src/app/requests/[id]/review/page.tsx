import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestById } from "@/lib/data/requests";
import { TopBar } from "@/components/TopBar";
import { Card, Button, FlagRow } from "@/components/ui";
import { submitAction, uploadDocumentAction } from "./actions";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const request = await getRequestById(id);
  if (!request || request.residentEmail !== session.email) notFound();

  const hasGovViolation = request.flags.some((f) => f.type === "government_violation");
  const boundUpload = uploadDocumentAction.bind(null, request.id);
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

          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Attach a file</p>
            <form action={boundUpload} className="flex items-center gap-2">
              <input type="file" name="file" className="text-sm" />
              <Button type="submit" variant="ghost">
                Upload
              </Button>
            </form>
            {request.documents.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {request.documents.map((d) => (
                  <li key={d.id}>
                    {d.name} ({Math.round(d.sizeBytes / 1024)} KB)
                    {!d.persistedToDrive && (
                      <span className="ml-2 text-xs text-amber-700">— not yet saved to Drive (integration not wired up)</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

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
