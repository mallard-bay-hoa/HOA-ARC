import type { Requirement } from "./types";
import { FENCE_REQUIREMENTS } from "./fence";
import { HOME_ALTERATION_REQUIREMENTS } from "./home-alteration";
import { DETACHED_STRUCTURE_REQUIREMENTS } from "./detached-structure";
import { LANDSCAPE_REQUIREMENTS } from "./landscape";
import { SOLAR_REQUIREMENTS } from "./solar";

export interface CategoryRuleModule {
  requirements: Requirement[];
}

// Every category's government/HOA requirements list, keyed by slug
// (Requirements §3/§4). Pages and Server Actions should go through this
// registry rather than importing a specific category's module, so adding a
// category is a one-line addition here instead of a change everywhere it's
// used.
export const CATEGORY_MODULES: Record<string, CategoryRuleModule> = {
  fence: { requirements: FENCE_REQUIREMENTS },
  "home-alteration": { requirements: HOME_ALTERATION_REQUIREMENTS },
  "detached-structure": { requirements: DETACHED_STRUCTURE_REQUIREMENTS },
  landscape: { requirements: LANDSCAPE_REQUIREMENTS },
  solar: { requirements: SOLAR_REQUIREMENTS },
};

export function getCategoryModule(categorySlug: string): CategoryRuleModule | undefined {
  return CATEGORY_MODULES[categorySlug];
}
