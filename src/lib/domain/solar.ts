import type { Answer, Question, RequestFlag } from "./types";
import { visibleQuestions } from "./question-tree";

// Question tree for Solar. Sourced from REQUIREMENTS.md §4e/§6a: CCR §7.19
// (Board approval on type, appearance, and location) and the city's
// roof-mounted electrical permit requirement.

export const SOLAR_QUESTIONS: Question[] = [
  {
    id: "solar-mount-type",
    categorySlug: "solar",
    prompt: "How will the panels be mounted?",
    inputType: "select",
    options: [
      { value: "roof_mounted", label: "Roof-mounted" },
      { value: "ground_mounted", label: "Ground-mounted" },
    ],
    order: 1,
  },
  {
    id: "solar-roof-location",
    categorySlug: "solar",
    prompt: "Which roof plane(s) will the panels be on (e.g., south-facing rear roof)?",
    inputType: "text",
    parentId: "solar-mount-type",
    showsIfAnswer: "roof_mounted",
    order: 2,
  },
  {
    id: "solar-visible-from-street",
    categorySlug: "solar",
    prompt: "Will the panels be visible from the street or Common Area?",
    helper: "CCR §7.19 requires Board approval of type, appearance, and location.",
    inputType: "boolean",
    order: 3,
  },
  {
    id: "solar-panel-color",
    categorySlug: "solar",
    prompt: "What color/finish are the panels and frame?",
    inputType: "text",
    order: 4,
  },
  {
    id: "solar-installer",
    categorySlug: "solar",
    prompt: "Installer or contractor name",
    helper: "Needed for your city electrical permit — not required to submit this request.",
    inputType: "text",
    optional: true,
    order: 5,
  },
];

export function visibleSolarQuestions(answers: Record<string, Answer>): Question[] {
  return visibleQuestions(SOLAR_QUESTIONS, answers);
}

export function evaluateSolar(answers: Record<string, Answer>): RequestFlag[] {
  const flags: RequestFlag[] = [];
  const mountType = answers["solar-mount-type"];

  if (mountType === "roof_mounted") {
    flags.push({
      type: "permit_reminder",
      citation: "Saratoga Springs Electrical Permit — Roof-Mounted Solar Photovoltaic",
      description: "Roof-mounted solar requires a city electrical permit — obtaining it is your responsibility.",
    });
  }

  if (mountType === "ground_mounted") {
    flags.push({
      type: "permit_reminder",
      citation: "Saratoga Springs Building/Planning Department",
      description: "Ground-mounted solar isn't addressed on the city's public pages — contact the Building/Planning Department to confirm permit requirements before installing.",
    });
  }

  return flags;
}
