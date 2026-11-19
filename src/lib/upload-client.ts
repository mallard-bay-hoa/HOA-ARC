import { prepareUploadsAction } from "@/app/requests/[id]/actions";

// Browser-side half of direct uploads. Vercel rejects request bodies over
// ~4.5MB before our code runs, so attachments go from the browser straight to
// Supabase Storage using one-time signed URLs issued by prepareUploadsAction.
// The form then submits only the resulting paths (the `uploaded` field).
// The signed URL carries its own authorization, so no Supabase key is needed
// in the browser (NEXT_PUBLIC_SUPABASE_ANON_KEY isn't set on Vercel).

export type UploadOutcome = { error: string } | { uploaded: { name: string; storagePath: string }[] };

export async function uploadFilesDirect(requestId: string, files: File[]): Promise<UploadOutcome> {
  if (files.length === 0) return { uploaded: [] };

  const prepared = await prepareUploadsAction(
    requestId,
    files.map((f) => ({ name: f.name, size: f.size }))
  );
  if ("error" in prepared) return prepared;

  const uploaded: { name: string; storagePath: string }[] = [];
  for (const [i, file] of files.entries()) {
    const { storagePath, signedUrl } = prepared.uploads[i];
    let res: Response;
    try {
      res = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" },
        body: file,
      });
    } catch {
      return { error: `"${file.name}" couldn't be uploaded. Check your connection and try again.` };
    }
    if (!res.ok) return { error: `"${file.name}" couldn't be uploaded (error ${res.status}). Please try again.` };
    uploaded.push({ name: file.name, storagePath });
  }
  return { uploaded };
}

/** Pulls the chosen files out of the form and swaps them for the `uploaded` paths field. */
export async function withDirectUploads(requestId: string, formData: FormData): Promise<FormData | { error: string }> {
  const files = (formData.getAll("file") as File[]).filter((f) => f.size > 0);
  const outcome = await uploadFilesDirect(requestId, files);
  if ("error" in outcome) return outcome;
  formData.delete("file");
  formData.set("uploaded", JSON.stringify(outcome.uploaded));
  return formData;
}
