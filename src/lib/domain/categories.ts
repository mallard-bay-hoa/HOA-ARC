import type { Category } from "./types";

// Requirements §3 — flat list for now; `enabled` lets us light up the
// remaining categories one at a time without touching this registry's shape.
export const CATEGORIES: Category[] = [
  {
    slug: "fence",
    name: "Fence",
    description: "New fence or replacement",
    enabled: true,
  },
  {
    slug: "home-alteration",
    name: "Home Alteration",
    description: "Additions, exterior finishes, room additions",
    enabled: true,
  },
  {
    slug: "detached-structure",
    name: "Detached Structure",
    description: "Sheds, garages, outbuildings",
    enabled: true,
  },
  {
    slug: "landscape",
    name: "Landscape",
    description: "Yard, plantings, hardscape",
    enabled: true,
  },
  {
    slug: "solar",
    name: "Solar",
    description: "Roof or ground-mounted solar panels",
    enabled: true,
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
