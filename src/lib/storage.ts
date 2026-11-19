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

// Total attachment size per submission. Files go browser -> Supabase Storage
// directly (see createSignedUploads), so this is our own cap, not a platform one.
export const MAX_TOTAL_UPLOAD_BYTES = 18 * 1024 * 1024;

export interface PreparedUpload {
  storagePath: string;
  /** One-time URL the browser PUTs the file to; the token in it is the authorization. */
  signedUrl: string;
}

export interface UploadedFileRef {
  name: string;
  storagePath: string;
}

export interface VerifiedUpload {
  name: string;
  sizeBytes: number;
  mimeType: string;
  storagePath: string;
}

// Storage object keys reject many characters (brackets, non-ASCII, etc.), so
// the key gets a sanitized filename; the original name is kept on the document row.
function safeKeyName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-100);
}

/**
 * Issues one-time signed upload URLs so the browser can send files straight to
 * Storage. Vercel rejects request bodies over ~4.5MB before our code runs, so
 * files must never travel through a Server Action.
 */
export async function createSignedUploads(requestId: string, files: { name: string }[]): Promise<PreparedUpload[]> {
  return Promise.all(
    files.map(async (file) => {
      const storagePath = `${requestId}/${randomUUID()}-${safeKeyName(file.name)}`;
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(storagePath);
      if (error || !data) throw new Error(error?.message ?? "Could not prepare upload");
      return { storagePath, signedUrl: data.signedUrl };
    })
  );
}

/** Reads the `uploaded` JSON field the client form adds after uploading directly to Storage. */
export function parseUploadedRefs(formData: FormData): UploadedFileRef[] {
  const raw = formData.get("uploaded");
  if (typeof raw !== "string" || raw === "") return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Invalid upload");
  return parsed.map((r) => {
    if (typeof r?.name !== "string" || typeof r?.storagePath !== "string") throw new Error("Invalid upload");
    return { name: r.name, storagePath: r.storagePath };
  });
}

/**
 * Confirms files the browser claims to have uploaded actually exist under this
 * request's folder (never trust client-supplied paths or sizes), returning the
 * real size and type as Storage recorded them.
 */
export async function verifyUploads(requestId: string, refs: UploadedFileRef[]): Promise<VerifiedUpload[]> {
  if (refs.length === 0) return [];
  const { data, error } = await supabase.storage.from(BUCKET).list(requestId, { limit: 1000 });
  if (error) throw new Error(error.message);
  const byName = new Map((data ?? []).map((o) => [o.name, o]));

  const verified = refs.map((ref) => {
    if (!ref.storagePath.startsWith(`${requestId}/`) || !hasAllowedDocumentExtension(ref.name)) {
      throw new Error("Invalid upload");
    }
    const object = byName.get(ref.storagePath.slice(requestId.length + 1));
    if (!object) throw new Error(`"${ref.name}" didn't finish uploading. Please try again.`);
    const meta = (object.metadata ?? {}) as { size?: number; mimetype?: string };
    return {
      name: ref.name,
      sizeBytes: meta.size ?? 0,
      mimeType: meta.mimetype ?? "application/octet-stream",
      storagePath: ref.storagePath,
    };
  });

  if (verified.reduce((sum, v) => sum + v.sizeBytes, 0) > MAX_TOTAL_UPLOAD_BYTES) {
    await Promise.all(verified.map((v) => deleteDocumentFile(v.storagePath)));
    throw new Error("Attachments are over the size limit.");
  }
  return verified;
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
