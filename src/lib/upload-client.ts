import { createClient } from "@supabase/supabase-js";
import { prepareUploadsAction } from "@/app/requests/[id]/actions";

// Browser-side half of direct uploads. Vercel rejects request bodies over
// ~4.5MB before our code runs, so attachments go from the browser straight to
// Supabase Storage using one-time signed tokens issued by prepareUploadsAction.
// The form then submits only the resulting paths (the `uploaded` field).

const BUCKET = "documents";

export type UploadOutcome = { error: string } | { uploaded: { name: string; storagePath: string }[] };

export async function uploadFilesDirect(requestId: string, files: File[]): Promise<UploadOutcome> {
  if (files.length === 0) return { uploaded: [] };

  const prepared = await prepareUploadsAction(
    requestId,
    files.map((f) => ({ name: f.name, size: f.size }))
  );
  if ("error" in prepared) return prepared;

  // Signed tokens carry the authorization; the anon key is just the public client key.
  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  ).storage.from(BUCKET);

  const uploaded: { name: string; storagePath: string }[] = [];
  for (const [i, file] of files.entries()) {
    const { storagePath, token } = prepared.uploads[i];
    const { error } = await storage.uploadToSignedUrl(storagePath, token, file, {
      contentType: file.type || undefined,
    });
    if (error) return { error: `"${file.name}" couldn't be uploaded (${error.message}). Please try again.` };
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
