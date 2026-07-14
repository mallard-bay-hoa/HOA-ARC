import Link from "next/link";
import { redirect } from "next/navigation";
import { getBoardSession } from "@/lib/session";
import { listAllRequests, dueChip } from "@/lib/data/requests";
import { getCategory } from "@/lib/domain/categories";
import { TopBar } from "@/components/TopBar";
import { Card, StatusPill, DueChip } from "@/components/ui";

export default async function BoardDashboardPage() {
  const member = await getBoardSession();
  if (!member) redirect("/board/signin");

  const requests = listAllRequests();

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC — Board" title="ARC Requests" right={<span className="text-sm text-slate-500">Signed in as {member.name}</span>} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <Card>
          {requests.length === 0 && <p className="text-sm text-slate-500">No requests submitted yet.</p>}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 font-medium">Address</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const due = dueChip(r);
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-3">
                      <Link href={`/board/${r.id}`} className="font-medium text-emerald-800 hover:underline">
                        {r.address}
                      </Link>
                    </td>
                    <td className="py-3 text-slate-600">{getCategory(r.categorySlug)?.name}</td>
                    <td className="py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="py-3">
                      <DueChip label={due.label} urgency={due.urgency} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </main>
    </>
  );
}
