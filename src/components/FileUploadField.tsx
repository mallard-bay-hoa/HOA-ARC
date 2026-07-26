"use client";

import { useRef } from "react";
import { Button } from "./ui";

const ACCEPT =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png";

function sameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

export function FileUploadField({
  name = "file",
  files,
  onFilesChange,
}: {
  name?: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

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
    syncNativeInput(merged);
    onFilesChange(merged);
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    syncNativeInput(next);
    onFilesChange(next);
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
              <button type="button" onClick={() => removeFile(i)} className="text-xs text-rose-700 hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-500">PDF, Word (.doc/.docx), JPG, or PNG only.</p>
    </div>
  );
}
