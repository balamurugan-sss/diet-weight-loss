import { defineIngredient } from "../ingredients";
import type { Ingredient } from "@/lib/recipes/types";

export const EXTRA_INGREDIENTS: Ingredient[] = [
  defineIngredient("ajwain_seeds", "Carom seeds (ajwain)", "ஓமம்", "അയമോദകം", "spices", "vegan", [390, 17.0, 45.0, 21.0, 21.0], 400, { u: { tsp: 2.5, tbsp: 7.5 }, src: "ifct" }),
  defineIngredient("nigella_seeds", "Nigella seeds (kalonji / kalo jeere)", "கருஞ்சீரகம்", "കരിഞ്ചീരകം", "spices", "vegan", [420, 17.0, 45.0, 11.0, 22.0], 400, { u: { tsp: 2.8, tbsp: 8.4 }, src: "estimate" }),
  defineIngredient("panch_phoron", "Panch phoron (Bengali five-seed mix)", "பஞ்ச் போரன் (ஐந்து விதை கலவை)", "പാഞ്ച് ഫോറൻ (അഞ്ച് വിത്ത് മിശ്രിതം)", "spices", "vegan", [400, 20.0, 45.5, 19.5, 20.5], 400, { allergens: ["mustard"], u: { tsp: 3, tbsp: 9 }, src: "estimate" }),
  defineIngredient("amchur", "Dry mango powder (amchur)", "மாங்காய் தூள்", "ഉണക്ക മാങ്ങാപ്പൊടി", "spices", "vegan", [320, 2.5, 80.0, 10.0, 1.5], 600, { u: { tsp: 2.5, tbsp: 7.5 }, src: "estimate" }),
  defineIngredient("whole_urad", "Whole black urad (sabut urad)", "முழு கருப்பு உளுந்து", "മുഴുവൻ ഉഴുന്ന്", "pulses", "vegan", [341, 25.2, 59.0, 18.3, 1.6], 150, { u: { tbsp: 13, cup: 200 } }),
  defineIngredient("makki_atta", "Maize flour (makki ka atta)", "மக்காச்சோள மாவு", "ചോളപ്പൊടി", "grains", "vegan", [362, 8.1, 76.9, 7.3, 3.6], 70, { u: { tbsp: 8, cup: 120 } }),
  defineIngredient("rohu", "Rohu fish (rui, steaks)", "ரோகு மீன்", "രോഹു മീൻ", "seafood", "nonveg", [90, 17.6, 0, 0, 2.0], 250, { allergens: ["fish"], avoid: ["seafood"], u: { piece: 80, pieceLabel: "steak" }, src: "ifct", shop: ["g", 500] }),
];
