import "server-only";
import { randomUUID } from "node:crypto";
import { supabase } from "./data/supabase";

const BUCKET = "documents";

// Requirements §10 file-type allowlist. Checked by extension rather than
// browser-reported MIME type alone, since some browsers send a generic
// type (or none) for .doc/.docx.
export const ALLOWED_DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];

export function hasAllowedDocumentExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ALLOWED_DOCUMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export interface UploadResult {
  storagePath: string;
}

/** Uploads a resident-attached file to the private "documents" Storage bucket. */
export async function uploadDocumentFile(file: {
  name: string;
  bytes: Uint8Array;
  mimeType: string;
  requestId: string;
}): Promise<UploadResult> {
  const storagePath = `${file.requestId}/${randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file.bytes, {
    contentType: file.mimeType,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return { storagePath };
}

/** Downloads a document's bytes back out of Storage (for the view/download route). */
export async function downloadDocumentFile(storagePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) throw new Error(error?.message ?? "File not found");
  return data;
}

/** Removes a document's bytes from Storage (mirrors removeDocument's removal from the DB). */
export async function deleteDocumentFile(storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath]);
}
