"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { issueMagicLink } from "@/lib/data/auth";
import { sendEmail, emailIsStubbed } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export async function sendMagicLink(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your answers." };
  }

  const { email } = parsed.data;

  const token = await issueMagicLink(email, "resident");
  const siteUrl = await getSiteUrl();

  await sendEmail(
    email,
    "Your Mallard Bay ARC sign-in link",
    `Use this link to access your architectural requests:\n${siteUrl}/auth/link/${token}\n\nThe Board`
  );

  // The token only belongs in the URL when email is stubbed (so the dev
  // "simulate clicking" bypass has something to link to) — once real email
  // sends, leaking the token into the URL/history would let anyone who
  // sees this page skip verifying the address entirely.
  redirect(emailIsStubbed ? `/start/link-sent?token=${token}` : "/start/link-sent");
}
