"use client";

import { useActionState } from "react";
import { saveResidentDetails } from "./actions";
import { Button, Field } from "@/components/ui";

export function ResidentDetailsForm({ knownAddresses }: { knownAddresses: string[] }) {
  const [state, formAction, pending] = useActionState(saveResidentDetails, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Full name">
        <input name="name" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </Field>
      <Field label="Property address">
        <input
          name="address"
          required
          placeholder="123 Mallard Bay Dr"
          list="known-addresses"
          autoComplete="off"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <datalist id="known-addresses">
          {knownAddresses.map((addr) => (
            <option key={addr} value={addr} />
          ))}
        </datalist>
      </Field>
      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
