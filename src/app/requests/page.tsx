import Link from "next/link";
import { redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { getRequestsByEmail } from "@/lib/data/requests";
import { getCategory } from "@/lib/domain/categories";
import { TopBar } from "@/components/TopBar";
import { Card, StatusPill, Button } from "@/components/ui";

export default async function MyRequestsPage() {
  const session = await getResidentSession();
  if (!session) redirect("/start");

  const requests = await getRequestsByEmail(session.email);

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title={session.address} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Your requests</h2>
          {requests.length === 0 && <p className="mt-4 text-sm text-slate-500">You haven&rsquo;t submitted any requests yet.</p>}
          <div className="mt-2">
            {requests.map((r) => (
              <Link
                key={r.id}
                href={`/requests/${r.id}`}
                className="flex items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-t-0 hover:bg-slate-50"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800">{getCategory(r.categorySlug)?.name}</div>
                  <div className="text-xs text-slate-500">Submitted {new Date(r.submittedAt ?? r.createdAt).toLocaleDateString()}</div>
                </div>
                <StatusPill status={r.status} />
              </Link>
            ))}
          </div>
          <Link href="/requests/new" className="mt-6 block">
            <Button className="w-full sm:w-auto">+ New Request</Button>
          </Link>
        </Card>
      </main>
    </>
  );
}
