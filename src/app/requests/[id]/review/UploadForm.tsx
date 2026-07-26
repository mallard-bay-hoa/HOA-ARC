"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { FileUploadField } from "@/components/FileUploadField";
import { uploadDocumentAction } from "./actions";
import { removeDocumentAction } from "../actions";
import type { Document } from "@/lib/domain/types";

export function UploadForm({ requestId, documents }: { requestId: string; documents: Document[] }) {
  const boundUpload = uploadDocumentAction.bind(null, requestId);
  const [state, formAction, pending] = useActionState(boundUpload, undefined);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (state?.success) setFiles([]);
  }, [state]);

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Attach a file</p>
      <form action={formAction} className="flex flex-col gap-3">
        <FileUploadField files={files} onFilesChange={setFiles} />
        {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
        <Button type="submit" variant="ghost" disabled={pending} className="w-fit">
          {pending ? "Uploading…" : "Upload"}
        </Button>
      </form>
      {documents.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3">
              <span>
                {d.name} ({Math.round(d.sizeBytes / 1024)} KB)
                {!d.persistedToDrive && (
                  <span className="ml-2 text-xs text-amber-700">— not yet saved to Drive (integration not wired up)</span>
                )}
              </span>
              <form action={removeDocumentAction.bind(null, requestId, d.id)}>
                <button type="submit" className="shrink-0 text-xs text-rose-700 hover:underline">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
