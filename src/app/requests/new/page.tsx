import Link from "next/link";
import { redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { CATEGORIES } from "@/lib/domain/categories";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui";
import { startCategory } from "./actions";
import { ResidentDetailsForm } from "./ResidentDetailsForm";

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>;
}) {
  const session = await getResidentSession();
  if (!session) redirect("/start");

  if (!session.name || session.addresses.length === 0) {
    return (
      <>
        <TopBar eyebrow="Mallard Bay ARC" title="A couple more details" />
        <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
          <Card>
            <h2 className="text-base font-semibold text-slate-900">Tell us who you are</h2>
            <p className="mt-1 text-sm text-slate-600">
              We don&rsquo;t have a name or property address on file for this email yet.
            </p>
            <div className="mt-6">
              <ResidentDetailsForm />
            </div>
          </Card>
        </main>
      </>
    );
  }

  const { address: requestedAddress } = await searchParams;
  const address =
    session.addresses.length === 1
      ? session.addresses[0]
      : requestedAddress && session.addresses.includes(requestedAddress)
        ? requestedAddress
        : undefined;

  if (!address) {
    return (
      <>
        <TopBar eyebrow="Mallard Bay ARC" title="Which property is this for?" />
        <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
          <div className="grid gap-3">
            {session.addresses.map((addr) => (
              <Link
                key={addr}
                href={`/requests/new?address=${encodeURIComponent(addr)}`}
                className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:border-emerald-400"
              >
                {addr}
              </Link>
            ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title="What kind of request is this?" right={session.addresses.length > 1 ? <span className="text-sm text-slate-500">{address}</span> : undefined} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div className="grid gap-3 sm:grid-cols-2">
          {CATEGORIES.map((category) => (
            <form key={category.slug} action={startCategory.bind(null, category.slug, address)}>
              <button
                type="submit"
                disabled={!category.enabled}
                className="h-full w-full rounded-lg border border-slate-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-emerald-400 disabled:opacity-50 disabled:hover:border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-800">{category.name}</div>
                  {!category.enabled && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{category.description}</p>
              </button>
            </form>
          ))}
        </div>
      </main>
    </>
  );
}
