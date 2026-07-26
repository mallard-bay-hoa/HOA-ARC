"use server";

import { redirect } from "next/navigation";
import { clearResidentSession, clearBoardSession } from "@/lib/session";

export async function signOut() {
  await clearResidentSession();
  await clearBoardSession();
  redirect("/");
}
