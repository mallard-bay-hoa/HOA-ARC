import Link from "next/link";
import { redirect } from "next/navigation";
import { getBoardSession } from "@/lib/session";
import { listAllRequests, dueChip, getUnviewedResidentReplyRequestIds } from "@/lib/data/requests";
import { getCategory } from "@/lib/domain/categories";
import { TopBar } from "@/components/TopBar";
import { Card, StatusPill, DueChip } from "@/components/ui";

export default async function BoardDashboardPage() {
  const member = await getBoardSession();
  if (!member) redirect("/board/signin");

  const requests = await listAllRequests();
  const unreadRequestIds = await getUnviewedResidentReplyRequestIds(member.id);

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC — Board" title="ARC Requests" right={<span className="text-sm text-emerald-100">Signed in as {member.name}</span>} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <Card>
          {requests.length === 0 && <p className="text-sm text-slate-500">No requests submitted yet.</p>}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="pb-2 font-medium">Address</th>
                <th scope="col" className="pb-2 font-medium">Category</th>
                <th scope="col" className="pb-2 font-medium">Status</th>
                <th scope="col" className="pb-2 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const due = dueChip(r);
                return (
                  <tr key={r.id} className="relative border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                    <td className="py-3">
                      <span className="inline-flex items-center gap-2">
                        <Link
                          href={`/board/${r.id}`}
                          className="font-medium text-emerald-800 underline after:absolute after:inset-0"
                        >
                          {r.address}
                        </Link>
                        {unreadRequestIds.has(r.id) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                            New reply
                          </span>
                        )}
                      </span>
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
