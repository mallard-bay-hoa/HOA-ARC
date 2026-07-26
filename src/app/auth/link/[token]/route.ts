import { redirect } from "next/navigation";
import { consumeMagicLink } from "@/lib/data/auth";
import { getResidentByEmail, getBoardMemberByEmail } from "@/lib/data/residents";
import { setResidentSession, setBoardSession } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await consumeMagicLink(token);

  if (!link) {
    redirect("/start?error=invalid-link");
  }

  if (link.purpose === "board") {
    const member = await getBoardMemberByEmail(link.email);
    if (!member) redirect("/board/signin?error=invalid-link");
    await setBoardSession(member.id);
    redirect("/board");
  }

  const known = await getResidentByEmail(link.email);
  await setResidentSession({
    email: link.email,
    name: known?.name,
    phone: known?.phone,
    addresses: known?.addresses ?? [],
  });
  redirect("/requests");
}
