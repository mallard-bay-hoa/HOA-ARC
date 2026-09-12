"use client";

import { useRef, useState } from "react";
import { clsx } from "clsx";

export type BoardTabKey = "details" | "documents" | "discussion" | "communication";

export function BoardTabs({
  details,
  documents,
  discussion,
  communication,
  initialTab = "discussion",
}: {
  details: React.ReactNode;
  documents: React.ReactNode;
  discussion: React.ReactNode;
  communication: React.ReactNode;
  initialTab?: BoardTabKey;
}) {
  const tabs = [
    { key: "details", label: "Details", content: details },
    { key: "documents", label: "Documents", content: documents },
    { key: "discussion", label: "Discussion", content: discussion },
    { key: "communication", label: "Communication & Vote", content: communication },
  ] as const;
  const [active, setActive] = useState<(typeof tabs)[number]["key"]>(initialTab);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusTab(index: number) {
    const wrapped = (index + tabs.length) % tabs.length;
    setActive(tabs[wrapped].key);
    tabRefs.current[wrapped]?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusTab(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusTab(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusTab(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusTab(tabs.length - 1);
    }
  }

  return (
    <div>
      <div role="tablist" aria-label="Request sections" className="mb-4 flex gap-5 border-b border-slate-200 text-sm">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={active === t.key}
            aria-controls={`tabpanel-${t.key}`}
            tabIndex={active === t.key ? 0 : -1}
            onClick={() => setActive(t.key)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={clsx(
              "-mb-px border-b-2 pb-2 font-medium",
              active === t.key ? "border-emerald-600 text-slate-900" : "border-transparent text-slate-500"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`tabpanel-${t.key}`}
          aria-labelledby={`tab-${t.key}`}
          hidden={active !== t.key}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
