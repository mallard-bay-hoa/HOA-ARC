import { redirect } from "next/navigation";
import { consumeMagicLink } from "@/lib/data/auth";
import { getResidentByEmail, getBoardMemberByEmail } from "@/lib/data/residents";
import { setResidentSession, setBoardSession } from "@/lib/session";

// A redirect_to came from a link we ourselves generated, but treat it as
// untrusted anyway: only ever forward to a same-site path, never a host
// (an "//evil.com" or "https://evil.com" value would otherwise send a
// freshly-authenticated session off to another site).
function safeRedirect(path: string | null): string | undefined {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return undefined;
  return path;
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await consumeMagicLink(token);

  if (!link) {
    redirect("/start?error=invalid-link");
  }

  const target = safeRedirect(link.redirectTo);

  if (link.purpose === "board") {
    const member = await getBoardMemberByEmail(link.email);
    if (!member) redirect("/board/signin?error=invalid-link");
    await setBoardSession(member.id);
    redirect(target ?? "/board");
  }

  const known = await getResidentByEmail(link.email);
  await setResidentSession({
    email: link.email,
    name: known?.name,
    phone: known?.phone,
    addresses: known?.addresses ?? [],
  });
  redirect(target ?? "/requests");
}
