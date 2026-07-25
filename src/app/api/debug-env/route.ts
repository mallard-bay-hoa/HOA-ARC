import { NextResponse } from "next/server";
import { connection } from "next/server";

export async function GET() {
  await connection();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return NextResponse.json({
    urlPresent: Boolean(url),
    urlLength: url?.length ?? 0,
    urlValue: url ?? null,
    keyPresent: Boolean(key),
    keyLength: key?.length ?? 0,
  });
}
