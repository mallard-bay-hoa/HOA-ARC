import type { Answer, Question } from "./types";
import { getCategoryModule } from "./registry";

export interface DisplayAnswer {
  id: string;
  label: string;
  value: string;
}

/** Maps a category's raw stored answers (question id -> value) to display-ready label/value pairs. */
export function formatAnswerEntries(categorySlug: string, answers: Record<string, Answer>): DisplayAnswer[] {
  const questions = getCategoryModule(categorySlug)?.questions ?? [];
  const byId = new Map(questions.map((q) => [q.id, q]));

  return Object.entries(answers).map(([id, value]) => {
    const question = byId.get(id);
    return {
      id,
      label: question?.prompt ?? id,
      value: formatAnswerValue(question, value),
    };
  });
}

function formatAnswerValue(question: Question | undefined, value: Answer): string {
  if (value === undefined || value === null || value === "") return "—";

  if (question?.inputType === "boolean") return value ? "Yes" : "No";

  if (question?.inputType === "select") {
    return question.options?.find((o) => o.value === value)?.label ?? String(value);
  }

  if (question?.inputType === "multiselect" && Array.isArray(value)) {
    return value.map((v) => question.options?.find((o) => o.value === v)?.label ?? String(v)).join(", ");
  }

  return Array.isArray(value) ? value.join(", ") : String(value);
}
