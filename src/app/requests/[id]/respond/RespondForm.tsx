"use client";

import { useActionState } from "react";
import { Button, Field } from "@/components/ui";
import { FileUploadField } from "@/components/FileUploadField";
import { respondToInfoRequest } from "./actions";

export function RespondForm({ requestId }: { requestId: string }) {
  const boundAction = respondToInfoRequest.bind(null, requestId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Your response">
        <textarea
          name="body"
          rows={5}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </Field>
      <FileUploadField />
      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send Response"}
      </Button>
    </form>
  );
}
