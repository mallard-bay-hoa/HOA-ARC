import { redirect } from "next/navigation";
import { consumeMagicLink } from "@/lib/data/auth";
import { getKnownResidentInfo } from "@/lib/data/requests";
import { setResidentSession } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await consumeMagicLink(token);

  if (!link) {
    redirect("/start?error=invalid-link");
  }

  const known = await getKnownResidentInfo(link.email);
  await setResidentSession({ email: link.email, name: known?.name, address: known?.address });
  redirect("/requests");
}
