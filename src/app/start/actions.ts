"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { issueMagicLink } from "@/lib/data/auth";
import { sendEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().min(1, "Enter your full name"),
  address: z.string().min(1, "Enter your property address"),
  email: z.string().email("Enter a valid email address"),
});

export async function sendMagicLink(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your answers." };
  }

  const { name, address, email } = parsed.data;

  // Requirements §12: homeowner verification happens here in a real build —
  // matching `address` against a roster, or routing to an admin-glance queue
  // if unmatched. Neither exists yet, so every request proceeds directly.
  const token = await issueMagicLink(email, address, name);

  await sendEmail(
    email,
    "Your Mallard Bay ARC sign-in link",
    `Hi ${name},\n\nUse this link to access your architectural request:\nhttp://localhost:3000/auth/link/${token}\n\nThe Board`
  );

  redirect(`/start/link-sent?token=${token}`);
}
