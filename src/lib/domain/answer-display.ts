import type { Answer } from "./types";

export interface DisplayAnswer {
  id: string;
  label: string;
  value: string;
}

const LABELS: Record<string, string> = {
  description: "Project Description",
  certifiedCompliance: "Certified Compliance",
};

/** Maps a request's stored answers (now just a free-text description + compliance
 * certification, not per-question data) to display-ready label/value pairs. */
export function formatAnswerEntries(answers: Record<string, Answer>): DisplayAnswer[] {
  return Object.entries(answers).map(([id, value]) => ({
    id,
    label: LABELS[id] ?? id,
    value: formatAnswerValue(value),
  }));
}

function formatAnswerValue(value: Answer): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return Array.isArray(value) ? value.join(", ") : String(value);
}
