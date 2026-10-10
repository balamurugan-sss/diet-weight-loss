import { defineIngredient } from "../ingredients";
import type { Ingredient } from "@/lib/recipes/types";

export const EXTRA_INGREDIENTS: Ingredient[] = [
  defineIngredient("parsley", "Parsley (flat-leaf or curly)", "பார்ஸ்லி", "പാഴ്സ്ലി", "herbs", "vegan", [36, 3.0, 6.3, 3.3, 0.8], 400, { u: { tbsp: 3.8, cup: 60, piece: 30, pieceLabel: "small bunch" }, src: "usda" }),
  defineIngredient("basil", "Sweet basil leaves", "இனிப்பு துளசி (பேசில்)", "ബേസിൽ", "herbs", "vegan", [23, 3.2, 2.7, 1.6, 0.6], 600, { u: { tbsp: 2.6, cup: 24, piece: 0.5, pieceLabel: "leaf" }, src: "usda" }),
  defineIngredient("watermelon", "Watermelon", "தர்பூசணி", "തണ്ണിമത്തൻ", "fruits", "vegan", [30, 0.6, 7.6, 0.4, 0.2], 30, { u: { cup: 152, piece: 280, pieceLabel: "wedge (flesh)" }, src: "usda" }),
];
