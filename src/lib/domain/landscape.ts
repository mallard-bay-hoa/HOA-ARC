import type { Requirement } from "./types";

// Requirements for Landscape. Sourced from REQUIREMENTS.md §4d/§6a:
// City Ordinance §19.06.08 / HOA Rule 5.1 (new-construction landscaping
// deadlines), HOA Rule 5.2 (watering restrictions), and the city's 4 ft+
// retaining wall permit threshold. Previously enforced via an adaptive
// question tree; now shown as a static disclosure the resident certifies
// they'll comply with (Requirements §7 decision), not evaluated in
// software.

export const LANDSCAPE_REQUIREMENTS: Requirement[] = [
  {
    citation: "City Ordinance §19.06.08 / HOA Rule 5.1",
    description: "New-construction front yard landscaping is required within 1 year of your Certificate of Occupancy; backyard within 2 years.",
  },
  {
    citation: "Saratoga Springs City Code §19.06",
    description: "Retaining walls 4 ft and taller require a city building permit — obtaining it is your responsibility.",
  },
  {
    citation: "HOA Rule 5.2",
    description: "Follow Saratoga Springs City and Utah County watering restrictions — watering is allowed only between 8:00pm and 9:00am.",
  },
];
