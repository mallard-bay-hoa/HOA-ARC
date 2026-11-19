"use client";

import { useState } from "react";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { Button } from "@/components/ui";

/**
 * One vote option: a message box directly above its button. Denying needs a
 * non-blank message (`required` alone lets whitespace through, so it's also
 * checked here and again on the server); approving's message is optional.
 */
export function VoteForm({
  action,
  decision,
  id,
  label,
  placeholder,
}: {
  action: (formData: FormData) => void | Promise<void>;
  decision: "approve" | "deny";
  id: string;
  label: string;
  placeholder: string;
}) {
  const [error, setError] = useState(false);
  const required = decision === "deny";

  return (
    <form
      action={action}
      className="flex-1 space-y-2"
      onSubmit={(e) => {
        const message = String(new FormData(e.currentTarget).get("message") ?? "").trim();
        if (required && !message) {
          e.preventDefault();
          setError(true);
        }
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <AutoGrowTextarea
        id={id}
        name="message"
        placeholder={placeholder}
        required={required}
        aria-invalid={error}
        onChange={() => setError(false)}
        className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-rose-700">Enter a message to deny.</p>}
      <Button type="submit" variant={decision === "approve" ? "cta" : "danger"} className="w-full">
        {decision === "approve" ? "Approve" : "Deny"}
      </Button>
    </form>
  );
}
