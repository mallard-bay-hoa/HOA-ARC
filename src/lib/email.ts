import "server-only";
import { Resend } from "resend";

// Sends via Resend using the now-verified mallardbayhoa.org domain. Falls
// back to a console log if RESEND_API_KEY isn't set (e.g. local dev),
// so the notification *points* in the flow still get exercised without
// actually sending mail.

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// mallardbayhoa.org is verified in Resend for sending, but replies should
// land in the board's actual inbox rather than an unmonitored address.
const REPLY_TO = "mallardbayhoaboard@gmail.com";

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  if (!resend) {
    console.log(`[email stub] to=${to} subject="${subject}"\n${body}`);
    return;
  }
  await resend.emails.send({
    from: "Mallard Bay ARC <arc@mallardbayhoa.org>",
    to,
    replyTo: REPLY_TO,
    subject,
    text: body,
  });
}
