"use client";

import { startTransition, useActionState, useState } from "react";
import { Button, Field } from "@/components/ui";
import { FileUploadField } from "@/components/FileUploadField";
import { respondToInfoRequest } from "./actions";
import { withDirectUploads } from "@/lib/upload-client";

export function RespondForm({ requestId }: { requestId: string }) {
  const boundAction = respondToInfoRequest.bind(null, requestId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Files go browser -> Storage directly (Vercel caps request bodies at ~4.5MB);
  // the action only receives their paths.
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
    <form action={handleSubmit} className="flex flex-col gap-4">
      <Field label="Your response">
        <textarea
          name="body"
          rows={5}
          required
          className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
        />
      </Field>
      <FileUploadField />
      {(uploadError ?? state?.error) && <p className="text-sm text-rose-700">{uploadError ?? state?.error}</p>}
      <Button type="submit" variant="cta" disabled={pending || uploading}>
        {pending || uploading ? "Sending…" : "Send Response"}
      </Button>
    </form>
  );
}
