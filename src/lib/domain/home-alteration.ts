import type { Answer, Question, RequestFlag } from "./types";
import { visibleQuestions } from "./question-tree";

// Question tree for Home Alteration. Sourced from REQUIREMENTS.md §4a/§6a:
// CCR §7.6 (Board + city approval for exterior alterations), CCR §7.11
// (aerials/antennas/satellite dishes), and the confirmed R1-10 zone setback
// and height table (City Code Table 19.04.07).

const STRUCTURAL_TYPES = ["addition", "deck", "patio_cover", "exterior_finish"];
const SETBACK_TYPES = ["addition", "deck", "patio_cover"];

export const HOME_ALTERATION_QUESTIONS: Question[] = [
  {
    id: "ha-type",
    categorySlug: "home-alteration",
    prompt: "What type of alteration is this?",
    inputType: "select",
    options: [
      { value: "addition", label: "Room addition" },
      { value: "deck", label: "Deck" },
      { value: "patio_cover", label: "Patio cover" },
      { value: "exterior_finish", label: "Exterior finish or color change" },
      { value: "satellite_dish", label: "Satellite dish / aerial" },
      { value: "other", label: "Other" },
    ],
    order: 1,
  },
  {
    id: "ha-height",
    categorySlug: "home-alteration",
    prompt: "What is the height of the finished structure, in feet?",
    helper: "Max primary structure height in the R1-10 zone is 35 ft.",
    inputType: "number",
    parentId: "ha-type",
    showsIfAnswer: STRUCTURAL_TYPES,
    order: 2,
  },
  {
    id: "ha-front-setback",
    categorySlug: "home-alteration",
    prompt: "How far from the front property line will this be built, in feet?",
    helper: "R1-10 minimum front setback is 25 ft (an enclosed entry/porch may encroach up to 5 ft).",
    inputType: "number",
    parentId: "ha-type",
    showsIfAnswer: SETBACK_TYPES,
    order: 3,
  },
  {
    id: "ha-rear-setback",
    categorySlug: "home-alteration",
    prompt: "How far from the rear property line, in feet?",
    helper: "R1-10 minimum rear setback is 25 ft.",
    inputType: "number",
    parentId: "ha-type",
    showsIfAnswer: SETBACK_TYPES,
    order: 4,
  },
  {
    id: "ha-side-setback",
    categorySlug: "home-alteration",
    prompt: "How far from the nearest side property line, in feet?",
    helper: "R1-10 minimum interior side setback is 8 ft.",
    inputType: "number",
    parentId: "ha-type",
    showsIfAnswer: SETBACK_TYPES,
    order: 5,
  },
  {
    id: "ha-dish-size",
    categorySlug: "home-alteration",
    prompt: "What size is the dish or aerial?",
    inputType: "select",
    options: [
      { value: "under_1m", label: "1 meter (about 3.3 ft) or less" },
      { value: "over_1m", label: "More than 1 meter" },
    ],
    parentId: "ha-type",
    showsIfAnswer: "satellite_dish",
    order: 6,
  },
  {
    id: "ha-dish-location",
    categorySlug: "home-alteration",
    prompt: "Where will it be installed?",
    inputType: "select",
    options: [
      { value: "on_lot", label: "On my Lot (yard or roof)" },
      { value: "common_area", label: "Common Area" },
    ],
    parentId: "ha-type",
    showsIfAnswer: "satellite_dish",
    order: 7,
  },
  {
    id: "ha-color-material",
    categorySlug: "home-alteration",
    prompt: "What color or exterior material will be used?",
    helper: "Collected so the Board can review appearance.",
    inputType: "text",
    parentId: "ha-type",
    showsIfAnswer: STRUCTURAL_TYPES,
    order: 8,
  },
];

export function visibleHomeAlterationQuestions(answers: Record<string, Answer>): Question[] {
  return visibleQuestions(HOME_ALTERATION_QUESTIONS, answers);
}

export function evaluateHomeAlteration(answers: Record<string, Answer>): RequestFlag[] {
  const flags: RequestFlag[] = [];
  const type = answers["ha-type"];
  const height = Number(answers["ha-height"] ?? 0);
  const front = Number(answers["ha-front-setback"] ?? 0);
  const rear = Number(answers["ha-rear-setback"] ?? 0);
  const side = Number(answers["ha-side-setback"] ?? 0);
  const dishSize = answers["ha-dish-size"];
  const dishLocation = answers["ha-dish-location"];

  const isStructural = STRUCTURAL_TYPES.includes(type as string);
  const needsSetbackCheck = SETBACK_TYPES.includes(type as string);

  if (isStructural && height > 35) {
    flags.push({
      type: "government_violation",
      citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
      description: `A ${height} ft structure exceeds the R1-10 zone's 35 ft max primary structure height.`,
    });
  }

  if (needsSetbackCheck) {
    if (front > 0 && front < 25) {
      flags.push({
        type: "government_violation",
        citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
        description: `A ${front} ft front setback is under the R1-10 zone's 25 ft minimum.`,
      });
    }
    if (rear > 0 && rear < 25) {
      flags.push({
        type: "government_violation",
        citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
        description: `A ${rear} ft rear setback is under the R1-10 zone's 25 ft minimum.`,
      });
    }
    if (side > 0 && side < 8) {
      flags.push({
        type: "government_violation",
        citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
        description: `A ${side} ft side setback is under the R1-10 zone's 8 ft minimum.`,
      });
    }
  }

  if (type === "satellite_dish") {
    if (dishSize === "over_1m") {
      flags.push({
        type: "government_violation",
        citation: "CCR §7.11",
        description: "Dishes/aerials over 1 meter are prohibited on Lots in Mallard Bay.",
      });
    }
    if (dishLocation === "common_area") {
      flags.push({
        type: "government_violation",
        citation: "CCR §7.11",
        description: "Dishes/aerials may only be installed on your own Lot, not on Common Area, regardless of size.",
      });
    }
  }

  if (isStructural) {
    flags.push({
      type: "permit_reminder",
      citation: "CCR §7.6",
      description: "Exterior alterations to a Living Unit require both Board approval and the appropriate city building permit — obtaining that permit is your responsibility.",
    });
  }

  if (type === "patio_cover") {
    flags.push({
      type: "permit_reminder",
      citation: "Saratoga Springs Building Department",
      description: "The city's public pages don't spell out a clear permit threshold for patio covers — contact the Building Department to confirm before starting.",
    });
  }

  return flags;
}
