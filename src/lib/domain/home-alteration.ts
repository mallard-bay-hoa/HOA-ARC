import type { Requirement } from "./types";

// Requirements for Home Alteration. Sourced from REQUIREMENTS.md §4a/§6a:
// CCR §7.6 (Board + city approval for exterior alterations), CCR §7.11
// (aerials/antennas/satellite dishes), and the confirmed R1-10 zone setback
// and height table (City Code Table 19.04.07). Previously enforced via an
// adaptive question tree; now shown as a static disclosure the resident
// certifies they'll comply with (Requirements §7 decision), not evaluated
// in software.

export const HOME_ALTERATION_REQUIREMENTS: Requirement[] = [
  {
    citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
    description: "Max primary structure height in the R1-10 zone is 35 ft.",
  },
  {
    citation: "Saratoga Springs City Code Table 19.04.07 (R1-10)",
    description: "Minimum setbacks: 25 ft front (an enclosed entry/porch may encroach up to 5 ft), 25 ft rear, 8 ft interior side.",
  },
  {
    citation: "CCR §7.11",
    description: "Satellite dishes/aerials over 1 meter are prohibited on Lots in Mallard Bay, and may only be installed on your own Lot, not Common Area, regardless of size.",
  },
  {
    citation: "CCR §7.6",
    description: "Exterior alterations to a Living Unit require both Board approval and the appropriate city building permit — obtaining that permit is your responsibility.",
  },
  {
    citation: "Saratoga Springs Building Department",
    description: "For patio covers specifically: the city's public pages don't spell out a clear permit threshold — contact the Building Department to confirm before starting.",
  },
];
