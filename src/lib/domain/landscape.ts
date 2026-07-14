import type { Answer, Question, RequestFlag } from "./types";
import { visibleQuestions } from "./question-tree";

// Question tree for Landscape. Sourced from REQUIREMENTS.md §4d/§6a:
// City Ordinance §19.06.08 / HOA Rule 5.1 (new-construction landscaping
// deadlines), HOA Rule 5.2 (watering restrictions), and the city's 4 ft+
// retaining wall permit threshold.

export const LANDSCAPE_QUESTIONS: Question[] = [
  {
    id: "ls-type",
    categorySlug: "landscape",
    prompt: "What kind of landscape change is this?",
    inputType: "select",
    options: [
      { value: "new_yard_installation", label: "New-construction front/back yard installation" },
      { value: "planting_hardscape", label: "General planting or hardscape change" },
      { value: "retaining_wall", label: "Retaining wall" },
      { value: "irrigation_change", label: "Irrigation change" },
    ],
    order: 1,
  },
  {
    id: "ls-yard-area",
    categorySlug: "landscape",
    prompt: "Which yard(s) does this cover?",
    helper: "Select all that apply.",
    inputType: "multiselect",
    options: [
      { value: "front_yard", label: "Front yard" },
      { value: "back_yard", label: "Back yard" },
    ],
    parentId: "ls-type",
    showsIfAnswer: "new_yard_installation",
    order: 2,
  },
  {
    id: "ls-years-since-co",
    categorySlug: "landscape",
    prompt: "About how many years ago did you receive your Certificate of Occupancy?",
    helper: "Front yard landscaping is required within 1 year, backyard within 2 years (City Ordinance §19.06.08).",
    inputType: "number",
    parentId: "ls-type",
    showsIfAnswer: "new_yard_installation",
    order: 3,
  },
  {
    id: "ls-retaining-wall-height",
    categorySlug: "landscape",
    prompt: "How tall will the retaining wall be, in feet?",
    inputType: "number",
    parentId: "ls-type",
    showsIfAnswer: "retaining_wall",
    order: 4,
  },
  {
    id: "ls-watering-plan",
    categorySlug: "landscape",
    prompt: "Will this involve a new or modified irrigation system?",
    inputType: "boolean",
    order: 5,
  },
  {
    id: "ls-description",
    categorySlug: "landscape",
    prompt: "Briefly describe the landscape change",
    inputType: "textarea",
    order: 6,
  },
];

export function visibleLandscapeQuestions(answers: Record<string, Answer>): Question[] {
  return visibleQuestions(LANDSCAPE_QUESTIONS, answers);
}

export function evaluateLandscape(answers: Record<string, Answer>): RequestFlag[] {
  const flags: RequestFlag[] = [];
  const type = answers["ls-type"];
  const yardAreas = Array.isArray(answers["ls-yard-area"]) ? (answers["ls-yard-area"] as string[]) : [];
  const yearsSinceCO = Number(answers["ls-years-since-co"] ?? 0);
  const wallHeight = Number(answers["ls-retaining-wall-height"] ?? 0);
  const newIrrigation = answers["ls-watering-plan"] === true;

  if (type === "new_yard_installation") {
    if (yardAreas.includes("front_yard") && yearsSinceCO > 1) {
      flags.push({
        type: "hoa_conflict",
        citation: "City Ordinance §19.06.08 / HOA Rule 5.1",
        description: `Front yard landscaping is required within 1 year of your Certificate of Occupancy. At about ${yearsSinceCO} years, this is past that deadline — the Board may want to discuss.`,
      });
    }
    if (yardAreas.includes("back_yard") && yearsSinceCO > 2) {
      flags.push({
        type: "hoa_conflict",
        citation: "City Ordinance §19.06.08 / HOA Rule 5.1",
        description: `Backyard landscaping is required within 2 years of your Certificate of Occupancy. At about ${yearsSinceCO} years, this is past that deadline — the Board may want to discuss.`,
      });
    }
  }

  if (type === "retaining_wall" && wallHeight >= 4) {
    flags.push({
      type: "permit_reminder",
      citation: "Saratoga Springs City Code §19.06",
      description: "Retaining walls 4 ft and taller require a city building permit — obtaining it is your responsibility.",
    });
  }

  if (newIrrigation) {
    flags.push({
      type: "permit_reminder",
      citation: "HOA Rule 5.2",
      description: "Follow Saratoga Springs City and Utah County watering restrictions — watering is encouraged only between 8:00pm and 9:00am.",
    });
  }

  return flags;
}
