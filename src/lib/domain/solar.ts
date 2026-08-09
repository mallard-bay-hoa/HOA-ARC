import type { Requirement } from "./types";

// Requirements for Solar. Sourced from REQUIREMENTS.md §4e/§6a: CCR §7.19
// (Board approval on type, appearance, and location) and the city's
// roof-mounted electrical permit requirement. Previously enforced via an
// adaptive question tree; now shown as a static disclosure the resident
// certifies they'll comply with (Requirements §7 decision), not evaluated
// in software.

export const SOLAR_REQUIREMENTS: Requirement[] = [
  {
    citation: "CCR §7.19",
    description: "Board approval is required for panel type, appearance, and location if panels will be visible from the street or Common Area.",
  },
  {
    citation: "Saratoga Springs Electrical Permit — Roof-Mounted Solar Photovoltaic",
    description: "Roof-mounted solar requires a city electrical permit — obtaining it is your responsibility.",
  },
  {
    citation: "Saratoga Springs Building/Planning Department",
    description: "Ground-mounted solar isn't addressed on the city's public pages — contact the Building/Planning Department to confirm permit requirements before installing.",
  },
];
