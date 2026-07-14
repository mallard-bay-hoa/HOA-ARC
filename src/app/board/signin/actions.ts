"use server";

import { redirect } from "next/navigation";
import { setBoardSession } from "@/lib/session";

export async function signInAsBoardMember(memberId: string) {
  await setBoardSession(memberId);
  redirect("/board");
}
