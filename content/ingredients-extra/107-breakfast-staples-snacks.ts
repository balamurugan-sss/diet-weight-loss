import { defineIngredient } from "../ingredients";
import type { Ingredient } from "@/lib/recipes/types";

export const EXTRA_INGREDIENTS: Ingredient[] = [
  defineIngredient("basmati_rice", "Basmati rice (raw, white)", "பாஸ்மதி அரிசி", "ബസ്മതി അരി", "grains", "vegan", [365, 7.1, 80.0, 1.3, 0.7], 120, { u: { tbsp: 12, cup: 185 } }),
];
