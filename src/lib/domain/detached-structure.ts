import type { Answer, Question, RequestFlag } from "./types";
import { visibleQuestions } from "./question-tree";

// Question tree for Detached Structure. Sourced from REQUIREMENTS.md §4b/§6a:
// CCR §7.6/§7.14 (Board approval for outbuildings), CCR §7.10.6/HOA Rule 3.7
// (garage parking capacity), and the confirmed R1-10 accessory-structure
// setback/height table (City Code Table 19.04.07 and §19.05.11).

export const DETACHED_STRUCTURE_QUESTIONS: Question[] = [
  {
    id: "ds-type",
    categorySlug: "detached-structure",
    prompt: "What type of structure is this?",
    inputType: "select",
    options: [
      { value: "shed", label: "Shed / storage building" },
      { value: "detached_garage", label: "Detached garage" },
      { value: "other_outbuilding", label: "Other outbuilding" },
    ],
    order: 1,
  },
  {
    id: "ds-footprint-sqft",
    categorySlug: "detached-structure",
    prompt: "What will the structure's footprint be, in square feet?",
    helper: "Determines which permit and setback rules apply (the line is 200 sq ft).",
    inputType: "number",
    order: 2,
  },
  {
    id: "ds-height-ft",
    categorySlug: "detached-structure",
    prompt: "How tall will the structure be, in feet?",
    inputType: "number",
    order: 3,
  },
  {
    id: "ds-house-footprint-sqft",
    categorySlug: "detached-structure",
    prompt: "What is your home's footprint, in square feet (approximate)?",
    helper: "An accessory structure can't exceed the footprint of the main house.",
    inputType: "number",
    order: 4,
  },
  {
    id: "ds-front-setback",
    categorySlug: "detached-structure",
    prompt: "How far from the front or street-side property line, in feet?",
    helper: "Accessory structures use the same front/street-side setback as the house (25 ft / 20 ft in R1-10).",
    inputType: "number",
    order: 5,
  },
  {
    id: "ds-side-setback",
    categorySlug: "detached-structure",
    prompt: "How far from the nearest side property line, in feet?",
    helper: "R1-10 minimum is 5 ft for structures 200 sq ft and over, 2 ft for smaller structures.",
    inputType: "number",
    order: 6,
  },
  {
    id: "ds-alley-access",
    categorySlug: "detached-structure",
    prompt: "Is this garage accessed from an alley?",
    inputType: "boolean",
    parentId: "ds-type",
    showsIfAnswer: "detached_garage",
    order: 7,
  },
  {
    id: "ds-rear-setback",
    categorySlug: "detached-structure",
    prompt: "How far from the rear property line, in feet?",
    helper: "20 ft minimum if alley-accessed; otherwise the same 5 ft / 2 ft rule as the side setback.",
    inputType: "number",
    order: 8,
  },
  {
    id: "ds-garage-reduces-parking",
    categorySlug: "detached-structure",
    prompt: "Will this reduce the number of vehicles your existing garage/driveway can park, compared to today?",
    inputType: "boolean",
    parentId: "ds-type",
    showsIfAnswer: "detached_garage",
    order: 9,
  },
];

export function visibleDetachedStructureQuestions(answers: Record<string, Answer>): Question[] {
  return visibleQuestions(DETACHED_STRUCTURE_QUESTIONS, answers);
}

export function evaluateDetachedStructure(answers: Record<string, Answer>): RequestFlag[] {
  const flags: RequestFlag[] = [];
  const type = answers["ds-type"];
  const footprint = Number(answers["ds-footprint-sqft"] ?? 0);
  const height = Number(answers["ds-height-ft"] ?? 0);
  const houseFootprint = Number(answers["ds-house-footprint-sqft"] ?? 0);
  const front = Number(answers["ds-front-setback"] ?? 0);
  const side = Number(answers["ds-side-setback"] ?? 0);
  const rear = Number(answers["ds-rear-setback"] ?? 0);
  const alleyAccess = answers["ds-alley-access"] === true;
  const reducesParking = answers["ds-garage-reduces-parking"] === true;

  const isLarge = footprint >= 200;

  if (isLarge) {
    flags.push({
      type: "permit_reminder",
      citation: "Saratoga Springs City Code §19.05.11",
      description: "Accessory structures 200 sq ft or larger require a city building permit — obtaining it is your responsibility.",
    });
    if (height > 25) {
      flags.push({
        type: "government_violation",
        citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
        description: `A ${height} ft structure exceeds the R1-10 zone's 25 ft max accessory-structure height (or the height of your home, whichever is more restrictive).`,
      });
    }
  } else if (height > 15) {
    flags.push({
      type: "government_violation",
      citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
      description: `A ${height} ft structure exceeds the R1-10 zone's 15 ft max accessory-structure height for structures under 200 sq ft.`,
    });
  } else if (height > 10) {
    flags.push({
      type: "permit_reminder",
      citation: "Saratoga Springs City Code — shed permit guidance",
      description: `Sheds under 200 sq ft only skip a building permit if they're 10 ft or shorter. At ${height} ft, you'll likely need a permit even though you're under the 200 sq ft threshold — confirm with the Building Department.`,
    });
  }

  if (houseFootprint > 0 && footprint > houseFootprint) {
    flags.push({
      type: "government_violation",
      citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
      description: `A ${footprint} sq ft structure would exceed your home's ${houseFootprint} sq ft footprint — accessory structures can't be larger than the main house.`,
    });
  }

  if (front > 0 && front < 25) {
    flags.push({
      type: "government_violation",
      citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
      description: `A ${front} ft front/street-side setback is under the 25 ft minimum accessory structures share with the primary structure.`,
    });
  }

  const sideMin = isLarge ? 5 : 2;
  if (side > 0 && side < sideMin) {
    flags.push({
      type: "government_violation",
      citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
      description: `A ${side} ft side setback is under the ${sideMin} ft minimum for ${isLarge ? "structures 200 sq ft and over" : "structures under 200 sq ft"}.`,
    });
  }

  if (alleyAccess && rear > 0 && rear < 20) {
    flags.push({
      type: "government_violation",
      citation: "Saratoga Springs City Code §19.05.11",
      description: `Alley-accessed detached garages need a 20 ft rear setback; at ${rear} ft this is under that minimum.`,
    });
  } else if (!alleyAccess && rear > 0 && rear < sideMin) {
    flags.push({
      type: "government_violation",
      citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
      description: `A ${rear} ft rear setback is under the ${sideMin} ft minimum for ${isLarge ? "structures 200 sq ft and over" : "structures under 200 sq ft"}.`,
    });
  }

  if (type === "detached_garage" && reducesParking) {
    flags.push({
      type: "hoa_conflict",
      citation: "HOA Rule 3.7 / CCR §7.10.6",
      description: "Garage alterations that reduce the number of vehicles that could be parked compared to before are not permitted without Board approval — the Board will need to review this closely.",
    });
  }

  flags.push({
    type: "permit_reminder",
    citation: "CCR §7.6 / §7.14",
    description: "No temporary structure, shed, or outbuilding may be built without prior Board approval — attach your plans for the Board's review.",
  });

  return flags;
}
