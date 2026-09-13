"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { FileUploadField } from "@/components/FileUploadField";
import { DocumentLinks } from "@/components/DocumentLinks";
import { submitAction } from "./actions";
import { removeDocumentAction } from "../actions";
import type { Document } from "@/lib/domain/types";

export function SubmitForm({ requestId, documents }: { requestId: string; documents: Document[] }) {
  const boundAction = submitAction.bind(null, requestId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      {/* Documents only appear here if a prior submit attempt uploaded some but
          failed before finishing — normal flow uploads and submits together
          below, so there's nothing to manage separately beforehand. */}
      {documents.length > 0 && (
        <>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Attached Files</h3>
          <ul className="mb-4 space-y-1 text-sm text-slate-600">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3">
                <span>
                  {d.name} ({Math.round(d.sizeBytes / 1024)} KB)
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <DocumentLinks requestId={requestId} documentId={d.id} documentName={d.name} />
                  <form action={removeDocumentAction.bind(null, requestId, d.id)}>
                    <button
                      type="submit"
                      aria-label={`Remove ${d.name}`}
                      className="px-1 py-1 text-xs text-rose-700 hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <FileUploadField />
        {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
        <Button type="submit" variant="cta" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Submitting…" : "Submit Request"}
        </Button>
      </form>
    </div>
  );
}
