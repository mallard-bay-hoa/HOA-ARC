"use client";

import { useActionState } from "react";
import { sendMagicLink } from "./actions";
import { Button, Field } from "@/components/ui";

export function StartForm() {
  const [state, formAction, pending] = useActionState(sendMagicLink, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Full name">
        <input name="name" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </Field>
      <Field label="Property address">
        <input name="address" required placeholder="123 Mallard Bay Dr" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </Field>
      <Field label="Email address">
        <input name="email" type="email" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </Field>
      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send me a link"}
      </Button>
    </form>
  );
}
