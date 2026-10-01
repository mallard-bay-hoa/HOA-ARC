"use client";

import { useRef, useState } from "react";
import { Button } from "./ui";

const ACCEPT =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png";

// Server Actions cap the whole request body at 20MB (see next.config.ts) —
// stay a bit under that so form fields/multipart overhead never push a
// selection that looked fine here over the server's limit, where it would
// otherwise fail with no error reaching the page.
const MAX_TOTAL_BYTES = 18 * 1024 * 1024;

function sameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function FileUploadField({ name = "file" }: { name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  function syncNativeInput(next: File[]) {
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    if (inputRef.current) inputRef.current.files = dt.files;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const merged = [...files];
    for (const f of picked) {
      if (!merged.some((m) => sameFile(m, f))) merged.push(f);
    }
    const totalBytes = merged.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      setError(`Those files add up to ${formatMB(totalBytes)}, which is over the ${formatMB(MAX_TOTAL_BYTES)} limit. Remove one or attach smaller files.`);
      return;
    }
    setError(null);
    syncNativeInput(merged);
    setFiles(merged);
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    syncNativeInput(next);
    setFiles(next);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-slate-600">
        Please submit drawings, plans, photos, building permits, etc. to help the board understand your
        request.
      </p>
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" onClick={() => inputRef.current?.click()}>
          Choose File
        </Button>
        <input ref={inputRef} type="file" name={name} multiple accept={ACCEPT} className="hidden" onChange={handleChange} />
        {files.length === 0 && <span className="text-sm text-slate-600">No file chosen</span>}
      </div>
      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}-${f.lastModified}`} className="flex items-center gap-2 text-sm text-slate-700">
              <span>{f.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label={`Remove ${f.name}`}
                className="px-1 py-1 text-xs text-rose-700 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <p className="text-xs text-slate-500">PDF, Word (.doc/.docx), JPG, or PNG only, up to {formatMB(MAX_TOTAL_BYTES)} total.</p>
    </div>
  );
}
