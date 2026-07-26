"use server";

import { redirect } from "next/navigation";
import { issueMagicLink } from "@/lib/data/auth";
import { getBoardMemberById } from "@/lib/data/residents";
import { sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";

export async function requestBoardMagicLink(memberId: string) {
  const member = await getBoardMemberById(memberId);
  if (!member) redirect("/board/signin");

  const token = await issueMagicLink(member.email, "board");
  const siteUrl = await getSiteUrl();

  await sendEmail(
    member.email,
    "Your Mallard Bay ARC board sign-in link",
    `Use this link to sign in to the Board dashboard:\n${siteUrl}/auth/link/${token}\n\nMallard Bay ARC`
  );

  redirect(`/start/link-sent?token=${token}`);
}
