import type { Requirement } from "./types";

// Requirements for Detached Structure. Sourced from REQUIREMENTS.md §4b/§6a:
// CCR §7.6/§7.14 (Board approval for outbuildings), CCR §7.10.6/HOA Rule 3.7
// (garage parking capacity), and the confirmed R1-10 accessory-structure
// setback/height table (City Code Table 19.04.07 and §19.05.11). Previously
// enforced via an adaptive question tree; now shown as a static disclosure
// the resident certifies they'll comply with (Requirements §7 decision),
// not evaluated in software.

export const DETACHED_STRUCTURE_REQUIREMENTS: Requirement[] = [
  {
    citation: "Saratoga Springs City Code §19.05.11",
    description: "Accessory structures 200 sq ft or larger require a city building permit — obtaining it is your responsibility.",
  },
  {
    citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
    description: "Max height is 25 ft for structures 200 sq ft or larger, 15 ft for structures under 200 sq ft (or the height of your home, whichever is more restrictive). Sheds under 200 sq ft only skip a building permit if 10 ft or shorter.",
  },
  {
    citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
    description: "An accessory structure can't exceed the footprint of the main house.",
  },
  {
    citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
    description: "Minimum setbacks: 25 ft front/street-side (shared with the primary structure); side setback 5 ft for structures 200 sq ft and over, 2 ft for smaller structures; rear setback matches the side minimum, except alley-accessed garages need 20 ft.",
  },
  {
    citation: "HOA Rule 3.7 / CCR §7.10.6",
    description: "Garage alterations that reduce the number of vehicles that could be parked compared to before are not permitted without Board approval.",
  },
  {
    citation: "CCR §7.6 / §7.14",
    description: "No temporary structure, shed, or outbuilding may be built without prior Board approval — attach your plans for the Board's review.",
  },
];
