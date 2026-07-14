import type { Answer, Question } from "./types";

/**
 * Shared branching-visibility logic for all categories. A question shows if
 * it has no parent, or if the parent's answer matches `showsIfAnswer`.
 * `showsIfAnswer` may be a single value or an array of acceptable values
 * (e.g. show this question if the parent select answer is "addition",
 * "deck", or "patio_cover"). When the parent is a `multiselect`, this checks
 * whether the parent's answer array intersects the accepted value(s).
 */
export function visibleQuestions(questions: Question[], answers: Record<string, Answer>): Question[] {
  function parentInputType(parentId: string) {
    return questions.find((q) => q.id === parentId)?.inputType;
  }

  function matches(parentId: string, parentAnswer: Answer | undefined, showsIfAnswer: unknown): boolean {
    const accepted = Array.isArray(showsIfAnswer) ? showsIfAnswer : [showsIfAnswer];
    if (parentInputType(parentId) === "multiselect") {
      return Array.isArray(parentAnswer) && accepted.some((v) => (parentAnswer as string[]).includes(v as string));
    }
    return accepted.includes(parentAnswer as string | boolean | number);
  }

  return questions
    .filter((q) => !q.parentId || matches(q.parentId, answers[q.parentId], q.showsIfAnswer))
    .sort((a, b) => a.order - b.order);
}
