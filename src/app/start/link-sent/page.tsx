import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { TopBar } from "@/components/TopBar";

export default async function LinkSentPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title="Check your email" />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">We emailed you a link</h2>
          <p className="mt-1 text-sm text-slate-600">
            Click the link in your email to continue. It also works to come back and request a new one any
            time.
          </p>

          {token && (
            <div className="mt-6 rounded-md border border-dashed border-amber-300 bg-amber-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Dev mode</p>
              <p className="mt-1 text-sm text-amber-900">
                Email sending isn&rsquo;t wired up yet (see <code>lib/email.ts</code>). Use this button to
                simulate clicking the link that was &ldquo;emailed&rdquo; to you.
              </p>
              <Link href={`/auth/link/${token}`} className="mt-3 inline-block">
                <Button>Simulate clicking the emailed link</Button>
              </Link>
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
