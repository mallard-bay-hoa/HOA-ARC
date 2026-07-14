import type { Answer, Question, RequestFlag } from "./types";
import { visibleQuestions } from "./question-tree";

// Question tree for the Fence category. Sourced from REQUIREMENTS.md §4c/§6a:
// HOA Rule 4 (height, front-edge extension) and Saratoga Springs City Code
// §19.06 (front-yard height cap, clear-sight triangle, material restrictions).
// Rule-based, not AI — per the Requirements' decision, thresholds are
// authored here, not inferred.

export const FENCE_QUESTIONS: Question[] = [
  {
    id: "fence-height",
    categorySlug: "fence",
    prompt: "How tall will the fence be, in feet?",
    helper: "Checked against HOA Rule 4 and City Code §19.06.",
    inputType: "number",
    order: 1,
  },
  {
    id: "fence-location",
    categorySlug: "fence",
    prompt: "Where on the property will this fence be located?",
    helper: "Select all that apply.",
    inputType: "multiselect",
    options: [
      { value: "front_yard", label: "Front yard" },
      { value: "side_yard", label: "Side yard" },
      { value: "rear_yard", label: "Rear yard" },
    ],
    order: 2,
  },
  {
    id: "fence-near-sight-triangle",
    categorySlug: "fence",
    prompt: "Is this fence near a driveway or street intersection?",
    helper: "City code limits fence height in the “clear sight triangle” near driveways and intersections.",
    inputType: "boolean",
    order: 3,
  },
  {
    id: "fence-extends-past-front",
    categorySlug: "fence",
    prompt: "Does the fence extend past the front edge of the home?",
    inputType: "boolean",
    parentId: "fence-location",
    showsIfAnswer: "side_yard",
    order: 4,
  },
  {
    id: "fence-extends-past-front-height",
    categorySlug: "fence",
    prompt: "How tall is the portion that extends past the front edge, in feet?",
    helper: "HOA Rule 4.2 allows this only if it's under 4 ft.",
    inputType: "number",
    parentId: "fence-extends-past-front",
    showsIfAnswer: true,
    order: 5,
  },
  {
    id: "fence-material",
    categorySlug: "fence",
    prompt: "What material will the fence be?",
    helper: "Chain link/wire isn't listed — City Code §19.06 restricts it to agricultural, animal-containment, or sports uses.",
    inputType: "select",
    options: [
      { value: "wood", label: "Wood" },
      { value: "vinyl", label: "Vinyl" },
      { value: "metal", label: "Metal (non chain-link)" },
      { value: "other", label: "Other" },
    ],
    order: 6,
  },
  {
    id: "fence-material-other",
    categorySlug: "fence",
    prompt: "Please describe the material",
    helper: "The Board will need to confirm this is allowed before approving.",
    inputType: "textarea",
    parentId: "fence-material",
    showsIfAnswer: "other",
    order: 7,
  },
  {
    id: "fence-color",
    categorySlug: "fence",
    prompt: "What color or finish will the fence be?",
    helper: "Not checked against a specific rule — collected so the Board can review appearance.",
    inputType: "text",
    order: 8,
  },
];

/** Returns the questions that should currently be visible given answers so far. */
export function visibleFenceQuestions(answers: Record<string, Answer>): Question[] {
  return visibleQuestions(FENCE_QUESTIONS, answers);
}

export function evaluateFence(answers: Record<string, Answer>): RequestFlag[] {
  const flags: RequestFlag[] = [];
  const height = Number(answers["fence-height"] ?? 0);
  const locations = Array.isArray(answers["fence-location"]) ? (answers["fence-location"] as string[]) : [];
  const nearSightTriangle = answers["fence-near-sight-triangle"] === true;
  const extendsPastFront = answers["fence-extends-past-front"] === true;
  const extendsPastFrontHeight = Number(answers["fence-extends-past-front-height"] ?? 0);
  const material = answers["fence-material"];

  if (locations.includes("front_yard") && height > 3) {
    flags.push({
      type: "government_violation",
      citation: "Saratoga Springs City Code §19.06",
      description: `A ${height} ft fence in the front yard exceeds the city's 3 ft front-yard limit. This cannot be approved as drawn — the HOA's 6 ft rule does not override the stricter city limit.`,
    });
  }

  if (nearSightTriangle && height > 3) {
    flags.push({
      type: "government_violation",
      citation: "Saratoga Springs City Code §19.06 — clear sight triangle",
      description: `Fences near a driveway or intersection are capped at 3 ft in the clear sight triangle. At ${height} ft, this exceeds that limit.`,
    });
  }

  const hasNonFrontLocation = locations.some((l) => l !== "front_yard");
  if (height > 6 && hasNonFrontLocation) {
    flags.push({
      type: "hoa_conflict",
      citation: "HOA Rule 4",
      description: `Rule 4 caps fence height at 6 ft. At ${height} ft, the Board will need to review this — an 8 ft perimeter fence may be approvable in limited cases with City Planning Department approval, but that isn't guaranteed.`,
    });
  }

  if (extendsPastFront && extendsPastFrontHeight >= 4) {
    flags.push({
      type: "hoa_conflict",
      citation: "HOA Rule 4.2",
      description: `A fence may extend past the front edge of the home only if that portion is under 4 ft. At ${extendsPastFrontHeight} ft, this will need Board discussion.`,
    });
  }

  if (material === "other") {
    flags.push({
      type: "permit_reminder",
      citation: "Saratoga Springs City Code §19.06",
      description: "Chain link/wire fencing is restricted to agricultural, animal-containment, or sports uses and capped at 50% of a residential yard. The Board will need to confirm your described material is acceptable before this can be approved.",
    });
  }

  return flags;
}
