import { NextResponse } from "next/server";
import { runDailyTimerSweep } from "@/lib/cron";
import { getSiteUrl } from "@/lib/site-url";

// Triggered daily by Vercel Cron (see vercel.json). Vercel signs cron requests with
// this header automatically, so a hit without the matching secret is rejected —
// nothing else should be able to invoke this endpoint on demand.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = await getSiteUrl();
  const result = await runDailyTimerSweep(siteUrl);
  return NextResponse.json(result);
}
