import Link from "next/link";
import { Card, Button } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Mallard Bay Homeowners Association</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Architectural Request Center</h1>
        <p className="mx-auto mt-3 max-w-lg text-slate-600">
          Submit a request for board approval before starting a fence, structure, landscaping, or home
          alteration project.
        </p>
      </div>

      <div className="grid w-full max-w-md gap-4 sm:grid-cols-2">
        <Card className="flex flex-col items-start gap-3">
          <div className="text-sm font-semibold text-slate-800">Residents</div>
          <p className="text-sm text-slate-600">Start or check on an architectural request.</p>
          <Link href="/start" className="w-full">
            <Button className="w-full">Start a Request</Button>
          </Link>
        </Card>
        <Card className="flex flex-col items-start gap-3">
          <div className="text-sm font-semibold text-slate-800">Board Members</div>
          <p className="text-sm text-slate-600">Review, discuss, and vote on submitted requests.</p>
          <Link href="/board/signin" className="w-full">
            <Button variant="ghost" className="w-full">
              Board Sign In
            </Button>
          </Link>
        </Card>
      </div>
    </main>
  );
}
