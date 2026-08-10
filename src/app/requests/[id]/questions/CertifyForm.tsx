"use client";

import { useActionState, useState } from "react";
import { Button, Field } from "@/components/ui";
import type { Requirement } from "@/lib/domain/types";
import { saveCertificationAndContinue } from "./actions";

export function CertifyForm({
  requestId,
  requirements,
  initialDescription,
}: {
  requestId: string;
  requirements: Requirement[];
  initialDescription: string;
}) {
  const boundAction = saveCertificationAndContinue.bind(null, requestId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const [certified, setCertified] = useState(false);
  const [description, setDescription] = useState(initialDescription);

  const canContinue = certified && description.trim().length > 0;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Government and HOA requirements</h3>
        <ul className="flex flex-col gap-3">
          {requirements.map((r, i) => (
            <li key={i} className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{r.citation}</div>
              <div className="text-sm text-slate-700">{r.description}</div>
            </li>
          ))}
        </ul>
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="certifiedCompliance"
          className="mt-0.5"
          required
          checked={certified}
          onChange={(e) => setCertified(e.target.checked)}
        />
        <span>I understand and will comply with government and HOA requirements.</span>
      </label>

      <Field label="Describe your project">
        <textarea
          name="description"
          rows={6}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please describe your project in as much detail as possible — dimensions, materials, location on the property, timeline, and anything else that will help the Board evaluate your request."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </Field>

      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}

      <Button type="submit" disabled={pending || !canContinue} className="w-full sm:w-auto">
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
