import { redirect } from "next/navigation";
import { consumeMagicLink } from "@/lib/data/auth";
import { setResidentSession } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = consumeMagicLink(token);

  if (!session) {
    redirect("/start?error=invalid-link");
  }

  await setResidentSession(session);
  redirect("/requests");
}
