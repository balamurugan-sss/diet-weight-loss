import { defineIngredient } from "../ingredients";
import type { Ingredient } from "@/lib/recipes/types";

export const EXTRA_INGREDIENTS: Ingredient[] = [
  defineIngredient("tuna_fresh", "Tuna steak (fresh)", "சூரை மீன்", "ചൂര", "seafood", "nonveg", [109, 24.4, 0, 0, 0.5], 700, { allergens: ["fish"], avoid: ["seafood"], u: { piece: 150, pieceLabel: "steak" }, shop: ["g", 250] }),
  defineIngredient("lemongrass", "Lemongrass", "எலுமிச்சைப் புல்", "ഇഞ്ചിപ്പുല്ല്", "herbs", "vegan", [99, 1.8, 25.3, 0, 0.5], 300, { u: { piece: 10, pieceLabel: "stalk" }, pantry: false }),
  defineIngredient("pandan_leaf", "Pandan leaf (rampe)", "ரம்பை இலை", "പാണ്ടൻ ഇല", "herbs", "vegan", [35, 1.0, 8.0, 4.0, 0.5], 300, { u: { piece: 2, pieceLabel: "leaf" }, src: "estimate", pantry: false }),
  defineIngredient("sri_lankan_curry_powder", "Roasted Sri Lankan curry powder", "இலங்கை கறித் தூள்", "ശ്രീലങ്കൻ കറിപ്പൊടി", "spices", "vegan", [330, 13, 52, 25, 12], 700, { u: { tsp: 2.5, tbsp: 7.5 }, src: "estimate" }),
  defineIngredient("coconut_milk_light", "Light coconut milk", "லைட் தேங்காய்ப் பால்", "ലൈറ്റ് തേങ്ങാപ്പാൽ", "dairy", "vegan", [71, 0.5, 1.5, 0, 7.0], 300, { allergens: ["coconut"], density: 1.0, u: { tbsp: 15, cup: 240 }, shop: ["ml", 400], src: "label" }),
];
