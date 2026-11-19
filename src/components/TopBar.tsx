import Link from "next/link";
import { getResidentSession, getBoardSession } from "@/lib/session";
import { signOut } from "@/app/actions";

export async function TopBar({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  const [resident, board] = await Promise.all([getResidentSession(), getBoardSession()]);
  const signedIn = Boolean(resident || board);
  const isBoardContext = eyebrow.includes("Board");
  const homeHref = isBoardContext ? (board ? "/board" : "/board/signin") : resident ? "/requests" : "/";

  return (
    <header className="border-b border-white/15 bg-emerald-700">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-4">
        <div>
          <Link href={homeHref} className="text-xs font-medium uppercase tracking-wide text-emerald-100">
            {eyebrow}
          </Link>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {right}
          {signedIn && (
            <form action={signOut}>
              <button type="submit" className="whitespace-nowrap text-sm text-emerald-100 hover:text-white hover:underline">
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
