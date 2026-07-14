import type { Answer, Question, RequestFlag } from "./types";
import { FENCE_QUESTIONS, visibleFenceQuestions, evaluateFence } from "./fence";
import { HOME_ALTERATION_QUESTIONS, visibleHomeAlterationQuestions, evaluateHomeAlteration } from "./home-alteration";
import { DETACHED_STRUCTURE_QUESTIONS, visibleDetachedStructureQuestions, evaluateDetachedStructure } from "./detached-structure";
import { LANDSCAPE_QUESTIONS, visibleLandscapeQuestions, evaluateLandscape } from "./landscape";
import { SOLAR_QUESTIONS, visibleSolarQuestions, evaluateSolar } from "./solar";

export interface CategoryRuleModule {
  questions: Question[];
  visibleQuestions: (answers: Record<string, Answer>) => Question[];
  evaluate: (answers: Record<string, Answer>) => RequestFlag[];
}

// Every category's question tree + rule engine, keyed by slug (Requirements
// §3/§4). Pages and Server Actions should go through this registry rather
// than importing a specific category's module, so adding a category is a
// one-line addition here instead of a change everywhere it's used.
export const CATEGORY_MODULES: Record<string, CategoryRuleModule> = {
  fence: {
    questions: FENCE_QUESTIONS,
    visibleQuestions: visibleFenceQuestions,
    evaluate: evaluateFence,
  },
  "home-alteration": {
    questions: HOME_ALTERATION_QUESTIONS,
    visibleQuestions: visibleHomeAlterationQuestions,
    evaluate: evaluateHomeAlteration,
  },
  "detached-structure": {
    questions: DETACHED_STRUCTURE_QUESTIONS,
    visibleQuestions: visibleDetachedStructureQuestions,
    evaluate: evaluateDetachedStructure,
  },
  landscape: {
    questions: LANDSCAPE_QUESTIONS,
    visibleQuestions: visibleLandscapeQuestions,
    evaluate: evaluateLandscape,
  },
  solar: {
    questions: SOLAR_QUESTIONS,
    visibleQuestions: visibleSolarQuestions,
    evaluate: evaluateSolar,
  },
};

export function getCategoryModule(categorySlug: string): CategoryRuleModule | undefined {
  return CATEGORY_MODULES[categorySlug];
}
