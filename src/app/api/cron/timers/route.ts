import { NextResponse } from "next/server";
import { runDailyTimerSweep } from "@/lib/cron";

// Triggered daily by Vercel Cron (see vercel.json). Vercel signs cron requests with
// this header automatically, so a hit without the matching secret is rejected —
// nothing else should be able to invoke this endpoint on demand.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyTimerSweep();
  return NextResponse.json(result);
}
