import "server-only";
import { Resend } from "resend";

// STUB — DESIGN.md §7. Real implementation sends via Resend once
// RESEND_API_KEY is set. Until then, notifications are logged to the server
// console so the notification *points* in the flow are still exercised.

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  if (!resend) {
    console.log(`[email stub] to=${to} subject="${subject}"\n${body}`);
    return;
  }
  await resend.emails.send({
    from: "Mallard Bay ARC <arc@mallardbayhoa.org>",
    to,
    subject,
    text: body,
  });
}
