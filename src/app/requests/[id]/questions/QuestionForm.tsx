"use client";

import { useState, useTransition } from "react";
import { getCategoryModule } from "@/lib/domain/registry";
import type { Answer, Question } from "@/lib/domain/types";
import { Button, Field } from "@/components/ui";
import { saveAnswersAndContinue } from "./actions";

function isAnswered(question: Question, value: Answer | undefined): boolean {
  if (question.optional) return true;
  if (value === undefined) return false;
  if (question.inputType === "multiselect") return Array.isArray(value) && value.length > 0;
  return value !== "";
}

export function QuestionForm({
  requestId,
  categorySlug,
  categoryName,
  initialAnswers,
}: {
  requestId: string;
  categorySlug: string;
  categoryName: string;
  initialAnswers: Record<string, Answer>;
}) {
  const [answers, setAnswers] = useState<Record<string, Answer>>(initialAnswers);
  const [pending, startTransition] = useTransition();
  const categoryModule = getCategoryModule(categorySlug);
  const visible = categoryModule?.visibleQuestions(answers) ?? [];
  const totalKnown = categoryModule?.questions.length ?? 0;

  function setAnswer(id: string, value: Answer) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function toggleMultiselect(id: string, value: string) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [id]: next };
    });
  }

  const allAnswered = visible.every((q) => isAnswered(q, answers[q.id]));

  return (
    <div>
      <div className="mb-4 h-1.5 rounded-full bg-slate-200">
        <div
          className="h-1.5 rounded-full bg-emerald-600 transition-all"
          style={{ width: `${Math.min(100, (visible.length / totalKnown) * 100)}%` }}
        />
      </div>
      <p className="mb-4 text-xs text-slate-500">
        {visible.filter((q) => isAnswered(q, answers[q.id])).length} of ~{totalKnown} questions &middot; {categoryName}
      </p>

      <div className="flex flex-col gap-4">
        {visible.map((q) => (
          <Field key={q.id} label={q.prompt} helper={q.helper}>
            {q.inputType === "number" && (
              <input
                type="number"
                className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={typeof answers[q.id] === "number" ? (answers[q.id] as number) : ""}
                onChange={(e) => setAnswer(q.id, e.target.valueAsNumber)}
              />
            )}
            {q.inputType === "text" && (
              <input
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
            )}
            {q.inputType === "textarea" && (
              <textarea
                rows={3}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
            )}
            {q.inputType === "boolean" && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={answers[q.id] === true ? "primary" : "ghost"}
                  onClick={() => setAnswer(q.id, true)}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={answers[q.id] === false ? "primary" : "ghost"}
                  onClick={() => setAnswer(q.id, false)}
                >
                  No
                </Button>
              </div>
            )}
            {q.inputType === "select" && (
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={(answers[q.id] as string) ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              >
                <option value="" disabled>
                  Choose one&hellip;
                </option>
                {q.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            {q.inputType === "multiselect" && (
              <div className="flex flex-col gap-1.5">
                {q.options?.map((opt) => {
                  const selected = Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt.value);
                  return (
                    <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleMultiselect(q.id, opt.value)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            )}
          </Field>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <Button
          disabled={!allAnswered || pending}
          onClick={() => startTransition(() => saveAnswersAndContinue(requestId, answers))}
        >
          {pending ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
