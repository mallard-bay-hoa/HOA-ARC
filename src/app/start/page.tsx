import { Card } from "@/components/ui";
import { TopBar } from "@/components/TopBar";
import { StartForm } from "./StartForm";

export default function StartPage() {
  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title="Start a Request" />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Start an Architectural Request</h2>
          <p className="mt-1 text-sm text-slate-600">We&rsquo;ll email you a private link &mdash; no password needed.</p>
          <div className="mt-6">
            <StartForm />
          </div>
        </Card>
      </main>
    </>
  );
}
