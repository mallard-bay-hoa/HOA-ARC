"use client";

import { useRef, useState } from "react";
import { Button } from "./ui";

const ACCEPT =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png";

export function FileUploadField({ name = "file" }: { name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" onClick={() => inputRef.current?.click()}>
          Choose File
        </Button>
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        <span className="text-sm text-slate-600">{fileName ?? "No file chosen"}</span>
      </div>
      <p className="text-xs text-slate-500">PDF, Word (.doc/.docx), JPG, or PNG only.</p>
    </div>
  );
}
