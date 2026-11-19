"use client";

import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui";
import { FileUploadField } from "@/components/FileUploadField";
import { DocumentLinks } from "@/components/DocumentLinks";
import { submitAction } from "./actions";
import { withDirectUploads } from "@/lib/upload-client";
import { removeDocumentAction } from "../actions";
import type { Document } from "@/lib/domain/types";

export function SubmitForm({ requestId, documents }: { requestId: string; documents: Document[] }) {
  const boundAction = submitAction.bind(null, requestId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Files are uploaded from the browser straight to Storage first (Vercel
  // rejects request bodies over ~4.5MB); the action only receives their paths.
  async function handleSubmit(formData: FormData) {
    setUploadError(null);
    setUploading(true);
    try {
      const prepared = await withDirectUploads(requestId, formData);
      if (prepared instanceof FormData) startTransition(() => formAction(prepared));
      else setUploadError(prepared.error);
    } catch (e) {
      console.error("Attachment upload failed", e);
      setUploadError("Something went wrong uploading your files. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      {/* Documents only appear here if a prior submit attempt uploaded some but
          failed before finishing — normal flow uploads and submits together
          below, so there's nothing to manage separately beforehand. */}
      {documents.length > 0 && (
        <>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-900">Attached Files</h3>
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
      <form action={handleSubmit} className="flex flex-col gap-4">
        <FileUploadField />
        {(uploadError ?? state?.error) && <p className="text-sm text-rose-700">{uploadError ?? state?.error}</p>}
        <Button type="submit" variant="cta" disabled={pending || uploading} className="w-full sm:w-auto">
          {pending || uploading ? "Submitting…" : "Submit Request"}
        </Button>
      </form>
    </div>
  );
}
