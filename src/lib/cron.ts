import "server-only";
import { supabase } from "./data/supabase";
import { listAllRequests, getOfficialMessages, addOfficialMessageRaw, boardMembers } from "./data/requests";
import { getCategory } from "./domain/categories";
import { sendEmail } from "./email";

// DESIGN.md §6 — the daily timer sweep. A single Vercel Cron job hits the route that
// calls this, which also doubles as the Supabase keep-alive ping (§1a): the free tier
// pauses a project after 7 days with zero API activity, and this runs daily regardless
// of whether any request actually needs action.

const APPROVAL_EXPIRY_DAYS = 90; // Rule 9.5
const APPROVAL_WARNING_DAYS_BEFORE = 15; // warn ~75 days in, once, before the 90-day expiry

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function categoryName(slug: string): string {
  return getCategory(slug)?.name ?? slug;
}

export interface TimerSweepResult {
  slaReminders: number;
  failsafeAutoApproved: number;
  failsafeEscalated: number;
  expiryWarnings: number;
  expired: number;
}

export async function runDailyTimerSweep(): Promise<TimerSweepResult> {
  const requests = await listAllRequests();
  const members = await boardMembers();
  const boardEmails = members.map((m) => m.email);
  const now = Date.now();

  const result: TimerSweepResult = { slaReminders: 0, failsafeAutoApproved: 0, failsafeEscalated: 0, expiryWarnings: 0, expired: 0 };

  // 1. 14-day SLA check — a nudge only, never changes status.
  const overdueSla = requests.filter(
    (r) => ["in_review", "info_requested"].includes(r.status) && r.slaDueAt && new Date(r.slaDueAt).getTime() < now
  );
  if (overdueSla.length > 0 && boardEmails.length > 0) {
    const lines = overdueSla.map(
      (r) => `- ${r.address} (${categoryName(r.categorySlug)}) — due ${new Date(r.slaDueAt!).toLocaleDateString()}`
    );
    const body = `The following requests are past the Board's 14-day response target:\n\n${lines.join("\n")}`;
    await Promise.all(boardEmails.map((email) => sendEmail(email, `${overdueSla.length} ARC request(s) past the 14-day SLA`, body)));
    result.slaReminders = overdueSla.length;
  }

  // 2. 28-day failsafe check.
  const pastFailsafe = requests.filter(
    (r) => ["in_review", "info_requested"].includes(r.status) && r.failsafeDueAt && new Date(r.failsafeDueAt).getTime() < now
  );
  for (const r of pastFailsafe) {
    const hasGovViolation = r.flags.some((f) => f.type === "government_violation");
    if (hasGovViolation) {
      // Requirements §7 — a government-code violation blocks auto-approval; escalate instead.
      const body = `${r.address} (${categoryName(r.categorySlug)}) has passed its 28-day failsafe deadline but cannot be auto-approved because it has an unresolved government-code flag. It needs the Board's immediate attention.`;
      await Promise.all(boardEmails.map((email) => sendEmail(email, `URGENT: ${r.address} needs an immediate decision`, body)));
      result.failsafeEscalated++;
    } else {
      const decidedAt = new Date().toISOString();
      await supabase
        .from("requests")
        .update({ status: "auto_approved", decided_at: decidedAt, approval_expires_at: addDays(decidedAt, APPROVAL_EXPIRY_DAYS), updated_at: decidedAt })
        .eq("id", r.id);
      await addOfficialMessageRaw(r.id, "system", "auto_approved", "Approved automatically because the Board did not respond within the required timeframe.");
      await sendEmail(
        r.residentEmail,
        `Your ${categoryName(r.categorySlug)} request was automatically approved`,
        `The Board did not respond within 28 days, so your request has been automatically approved per HOA policy.`
      );
      await Promise.all(
        boardEmails.map((email) =>
          sendEmail(email, `${r.address} auto-approved (28-day failsafe)`, `This request passed the 28-day failsafe deadline without a board decision and was auto-approved.`)
        )
      );
      result.failsafeAutoApproved++;
    }
  }

  // 3. 90-day approval expiry (Rule 9.5) — warn once around 75 days, expire at 90.
  const approved = requests.filter((r) => ["approved", "approved_conditional"].includes(r.status) && r.approvalExpiresAt);
  for (const r of approved) {
    const expiresAt = new Date(r.approvalExpiresAt!).getTime();

    if (expiresAt < now) {
      await supabase.from("requests").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", r.id);
      await addOfficialMessageRaw(r.id, "system", "expired", "Your approval has expired because work had not started within 90 days, per Rule 9.5. Please contact the Board to re-apply.");
      await sendEmail(
        r.residentEmail,
        `Your ${categoryName(r.categorySlug)} approval has expired`,
        `Your approval expired because work hadn't started within 90 days (Rule 9.5). Please contact the Board if you'd still like to proceed — you may need to re-apply.`
      );
      result.expired++;
    } else if (now >= expiresAt - APPROVAL_WARNING_DAYS_BEFORE * 24 * 60 * 60 * 1000) {
      const messages = await getOfficialMessages(r.id);
      const alreadyWarned = messages.some((m) => m.messageType === "expiry_warning");
      if (!alreadyWarned) {
        const dueDate = new Date(r.approvalExpiresAt!).toLocaleDateString();
        await addOfficialMessageRaw(r.id, "system", "expiry_warning", `Your approval will expire on ${dueDate} if work hasn't started (Rule 9.5).`);
        await sendEmail(
          r.residentEmail,
          `Reminder: your ${categoryName(r.categorySlug)} approval expires soon`,
          `Your approval will expire on ${dueDate} unless work has started, per Rule 9.5.`
        );
        result.expiryWarnings++;
      }
    }
  }

  return result;
}
