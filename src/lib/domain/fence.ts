import type { Requirement } from "./types";

// Requirements for the Fence category. Sourced from REQUIREMENTS.md §4c/§6a:
// HOA Rule 4 (height, front-edge extension) and Saratoga Springs City Code
// §19.06 (front-yard height cap, clear-sight triangle, material restrictions).
// Previously enforced via an adaptive question tree; now shown as a static
// disclosure the resident certifies they'll comply with (Requirements §7
// decision), not evaluated in software.

export const FENCE_REQUIREMENTS: Requirement[] = [
  {
    citation: "Saratoga Springs City Code §19.06",
    description: "Front-yard fences may not exceed 3 ft, including within the clear-sight triangle near a driveway or street intersection.",
  },
  {
    citation: "HOA Rule 4",
    description: "Fence height elsewhere on the property is capped at 6 ft (an 8 ft perimeter fence may be approvable in limited cases with City Planning Department approval, but this isn't guaranteed).",
  },
  {
    citation: "HOA Rule 4.2",
    description: "A fence may extend past the front edge of the home only if that portion is under 4 ft.",
  },
  {
    citation: "Saratoga Springs City Code §19.06",
    description: "Chain link/wire fencing is restricted to agricultural, animal-containment, or sports uses and capped at 50% of a residential yard.",
  },
];
