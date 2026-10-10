import { defineIngredient } from "../ingredients";
import type { Ingredient } from "@/lib/recipes/types";

export const EXTRA_INGREDIENTS: Ingredient[] = [
  defineIngredient("sundakkai_vathal", "Dried turkey berry (sundakkai vathal)", "சுண்டைக்காய் வற்றல்", "ചുണ്ടങ്ങ വറ്റൽ", "vegetables", "vegan", [255, 8.3, 62.0, 22.0, 1.7], 600, { u: { tbsp: 6, tsp: 2 }, shop: ["g", 100], pantry: true, src: "estimate" }),
];
