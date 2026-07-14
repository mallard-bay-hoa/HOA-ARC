import { redirect } from "next/navigation";
import { getResidentSession } from "@/lib/session";
import { CATEGORIES } from "@/lib/domain/categories";
import { TopBar } from "@/components/TopBar";
import { startCategory } from "./actions";

export default async function NewRequestPage() {
  const session = await getResidentSession();
  if (!session) redirect("/start");

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title="What kind of request is this?" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div className="grid gap-3 sm:grid-cols-2">
          {CATEGORIES.map((category) => (
            <form key={category.slug} action={startCategory.bind(null, category.slug)}>
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
