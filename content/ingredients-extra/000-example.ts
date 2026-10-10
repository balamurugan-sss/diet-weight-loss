import { defineIngredient } from "../ingredients";
import type { Ingredient } from "@/lib/recipes/types";

export const EXTRA_INGREDIENTS: Ingredient[] = [
  defineIngredient("gongura", "Gongura (sorrel leaves)", "புளிச்சக்கீரை", "ഗോംഗുര", "vegetables", "vegan", [56, 1.7, 9.9, 3.2, 1.1], 80, { u: { cup: 30 }, src: "ifct" }),
];
