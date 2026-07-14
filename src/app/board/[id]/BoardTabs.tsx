"use client";

import { useState } from "react";
import { clsx } from "clsx";

export function BoardTabs({
  details,
  documents,
  discussion,
  communication,
}: {
  details: React.ReactNode;
  documents: React.ReactNode;
  discussion: React.ReactNode;
  communication: React.ReactNode;
}) {
  const tabs = [
    { key: "details", label: "Details", content: details },
    { key: "documents", label: "Documents", content: documents },
    { key: "discussion", label: "Discussion", content: discussion },
    { key: "communication", label: "Communication & Vote", content: communication },
  ] as const;
  const [active, setActive] = useState<(typeof tabs)[number]["key"]>("discussion");

  return (
    <div>
      <div className="mb-4 flex gap-5 border-b border-slate-200 text-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={clsx(
              "-mb-px border-b-2 pb-2 font-medium",
              active === t.key ? "border-emerald-600 text-slate-900" : "border-transparent text-slate-500"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.find((t) => t.key === active)?.content}
    </div>
  );
}
