import { getBoardMemberCandidates } from "@/lib/data/residents";
import { TopBar } from "@/components/TopBar";
import { Card, Button } from "@/components/ui";
import { requestBoardMagicLink } from "./actions";

export default async function BoardSignInPage() {
  const members = await getBoardMemberCandidates();

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title="Board Sign In" />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
        <Card>
          <p className="mb-4 text-sm text-slate-600">
            Pick your name — we&rsquo;ll email a private sign-in link to the address on file for you. No
            password to remember, and only you can complete it.
          </p>
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <form key={m.id} action={requestBoardMagicLink.bind(null, m.id)}>
                <Button type="submit" variant="ghost" className="w-full">
                  {m.name}
                </Button>
              </form>
            ))}
          </div>
        </Card>
      </main>
    </>
  );
}
