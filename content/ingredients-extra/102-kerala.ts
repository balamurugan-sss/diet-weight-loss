import { defineIngredient } from "../ingredients";
import type { Ingredient } from "@/lib/recipes/types";

export const EXTRA_INGREDIENTS: Ingredient[] = [
  defineIngredient("tapioca", "Tapioca (cassava, kappa), peeled", "மரவள்ளிக்கிழங்கு", "കപ്പ", "vegetables", "vegan", [160, 1.4, 38.1, 1.8, 0.3], 40, { u: { piece: 300, pieceLabel: "medium tapioca root (peeled)", cup: 140 }, hidden: "Tapioca is almost pure starch — about 36 g net carbs per 100 g, more than potato.", src: "usda" }),
  defineIngredient("rice_flour", "Rice flour (puttu/appam podi)", "அரிசி மாவு", "അരിപ്പൊടി", "grains", "vegan", [366, 6.0, 80.1, 2.4, 1.4], 60, { u: { tbsp: 10, cup: 160 }, hidden: "Rice flour is concentrated starch — about 78 g net carbs per 100 g.", src: "usda" }),
  defineIngredient("raw_mango", "Raw green mango", "மாங்காய்", "പച്ചമാങ്ങ", "fruits", "vegan", [44, 0.7, 10.8, 1.8, 0.1], 80, { u: { piece: 200, pieceLabel: "medium raw mango", cup: 165 }, src: "ifct" }),
];
