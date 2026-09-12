"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { FileUploadField } from "@/components/FileUploadField";
import { DocumentLinks } from "@/components/DocumentLinks";
import { uploadDocumentAction } from "./actions";
import { removeDocumentAction } from "../actions";
import type { Document } from "@/lib/domain/types";

export function UploadForm({ requestId, documents }: { requestId: string; documents: Document[] }) {
  const boundUpload = uploadDocumentAction.bind(null, requestId);
  const [state, formAction, pending] = useActionState(boundUpload, undefined);

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Attach a file</h3>
      <form action={formAction} className="flex flex-col gap-3">
        {/* Keyed on documents.length so a successful upload (which grows this
            list via the action's revalidatePath) remounts the field and
            clears its picked files — no effect needed to reset it. */}
        <FileUploadField key={documents.length} />
        {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
        <Button type="submit" variant="ghost" disabled={pending} className="w-fit">
          {pending ? "Uploading…" : "Upload"}
        </Button>
      </form>
      {documents.length > 0 && (
        <>
          <hr className="mt-6 border-slate-100" />
          <h3 className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Uploaded Files</h3>
          <ul className="space-y-1 text-sm text-slate-600">
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
    </div>
  );
}
