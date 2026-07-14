import "server-only";

// STUB — DESIGN.md §5. Real implementation: a Google service account added
// as Content Manager on an HOA Shared Drive, uploading via `files.create`
// and reading back via `files.get?alt=media` (never Drive's own sharing
// links, since residents have no Drive account under this auth model).
//
// Needs env vars once wired up:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
//   GOOGLE_DRIVE_SHARED_DRIVE_ID

export interface UploadResult {
  driveFileId: string | null;
  persistedToDrive: boolean;
}

export async function uploadToDrive(file: {
  name: string;
  bytes: Uint8Array;
  mimeType: string;
  requestId: string;
  categorySlug: string;
  address: string;
}): Promise<UploadResult> {
  const configured = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  if (!configured) {
    // Not wired up yet — record the metadata only, so the UI can be built
    // and tested end-to-end without a live Drive integration.
    console.log(`[drive stub] would upload "${file.name}" for request ${file.requestId}`);
    return { driveFileId: null, persistedToDrive: false };
  }
  throw new Error("Google Drive integration not yet implemented — see lib/drive.ts");
}
