import { boardMembers } from "@/lib/data/requests";
import { TopBar } from "@/components/TopBar";
import { Card, Button } from "@/components/ui";
import { signInAsBoardMember } from "./actions";

export default async function BoardSignInPage() {
  const members = await boardMembers();

  return (
    <>
      <TopBar eyebrow="Mallard Bay ARC" title="Board Sign In" />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
        <Card>
          <p className="mb-4 text-sm text-slate-600">
            Real board accounts (password or SSO via Supabase Auth) aren&rsquo;t wired up yet — pick a seeded
            board member to continue.
          </p>
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <form key={m.id} action={signInAsBoardMember.bind(null, m.id)}>
                <Button type="submit" variant="ghost" className="w-full">
                  <span className="flex w-full items-center justify-between">
                    <span>{m.name}</span>
                    <span className="text-xs text-slate-400">{m.address}</span>
                  </span>
                </Button>
              </form>
            ))}
          </div>
        </Card>
      </main>
    </>
  );
}
