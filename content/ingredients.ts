/**
 * Ingredient reference database.
 *
 * Nutrients are per 100 g edible portion (raw/dry unless the name says
 * otherwise). `carbs` is TOTAL carbohydrate INCLUDING dietary fibre, so that
 * net carbs = carbs − fibre − sugar alcohols is consistent across sources
 * (note: IFCT 2017 reports "available" carbohydrate, which excludes fibre;
 * values taken from IFCT have had fibre added back).
 *
 * Values were transcribed from IFCT 2017 (NIN, India), USDA FoodData Central
 * (SR Legacy) or typical Indian manufacturer labels, and are marked
 * `reference_estimate` until independently checked against the source table.
 * Prices are approximate Indian urban retail (₹/kg, 2025) for estimates only.
 */
import type {
  Allergen,
  DietClass,
  Ingredient,
  IngredientCategory,
  UnitWeights,
} from "@/lib/recipes/types";

type Src = "ifct" | "usda" | "label" | "estimate";
export type Opts = {
  allergens?: Allergen[];
  avoid?: string[];
  hidden?: string;
  u?: UnitWeights;
  shop?: ["g" | "ml" | "piece", number?];
  density?: number;
  pantry?: boolean;
  src?: Src;
  sa?: number;
};

const SRC: Record<Src, string> = {
  ifct: "IFCT 2017 (NIN) reference value",
  usda: "USDA FoodData Central reference value",
  label: "Typical Indian product label",
  estimate: "Composite estimate (no single reference)",
};

const CATEGORY_DEFAULTS: Partial<Record<IngredientCategory, UnitWeights>> = {
  spices: { tsp: 2.5, tbsp: 7.5 },
  oils: { tsp: 4.5, tbsp: 13.5, cup: 218 },
  herbs: { tbsp: 2, cup: 16 },
  nuts_seeds: { tbsp: 9, cup: 140 },
  grains: { tbsp: 12, cup: 180 },
  pulses: { tbsp: 13, cup: 200 },
  condiments: { tsp: 5, tbsp: 15 },
  sweeteners: { tsp: 4, tbsp: 12 },
};

export function defineIngredient(
  id: string,
  name: string,
  ta: string | null,
  ml: string | null,
  category: IngredientCategory,
  dietClass: DietClass,
  [kcal, proteinG, carbsG, fibreG, fatG]: [number, number, number, number, number],
  costPerKgInr: number,
  o: Opts = {},
): Ingredient {
  const liquid = o.density !== undefined;
  return {
    id,
    name,
    nameTa: ta,
    nameMl: ml,
    category,
    dietClass,
    avoidTags: o.avoid ?? [],
    kcal,
    proteinG,
    carbsG,
    fibreG,
    fatG,
    sugarAlcoholG: o.sa ?? 0,
    allergens: o.allergens ?? [],
    hiddenCarbNote: o.hidden ?? null,
    costPerKgInr,
    unitWeights: { ...CATEGORY_DEFAULTS[category], ...o.u },
    shopUnit: o.shop?.[0] ?? (liquid ? "ml" : "g"),
    shopPack: o.shop?.[1] ?? null,
    densityGPerMl: o.density ?? null,
    pantryStaple: o.pantry ?? ["spices", "oils", "condiments", "sweeteners", "water"].includes(category),
    nutritionSource: SRC[o.src ?? "usda"],
    validationStatus: o.src === "estimate" ? "unverified" : "reference_estimate",
  };
}

export const OG = ["onion_garlic"];

export const INGREDIENTS: Ingredient[] = [
  // ── Vegetables ──────────────────────────────────────────────────────────
  defineIngredient("onion", "Onion", "வெங்காயம்", "സവാള", "vegetables", "vegan", [40, 1.1, 9.3, 1.7, 0.1], 40, { avoid: OG, u: { piece: 110, pieceLabel: "medium onion", cup: 160, tbsp: 10 }, hidden: "Onions add up in carbs when used generously — about 8 g net carbs per medium onion." }),
  defineIngredient("shallots", "Shallots (small onions)", "சின்ன வெங்காயம்", "ചെറിയ ഉള്ളി", "vegetables", "vegan", [72, 2.5, 16.8, 3.2, 0.1], 80, { avoid: OG, u: { piece: 10, pieceLabel: "shallot", cup: 150 } }),
  defineIngredient("spring_onion", "Spring onion", "வெங்காயத்தாள்", "സ്പ്രിംഗ് ഒണിയൻ", "vegetables", "vegan", [32, 1.8, 7.3, 2.6, 0.2], 120, { avoid: OG, u: { piece: 15, pieceLabel: "stalk", tbsp: 6, cup: 100 } }),
  defineIngredient("tomato", "Tomato", "தக்காளி", "തക്കാളി", "vegetables", "vegan", [18, 0.9, 3.9, 1.2, 0.2], 40, { u: { piece: 100, pieceLabel: "medium tomato", cup: 180 } }),
  defineIngredient("potato", "Potato", "உருளைக்கிழங்கு", "ഉരുളക്കിഴങ്ങ്", "vegetables", "vegan", [77, 2.0, 17.5, 2.2, 0.1], 35, { u: { piece: 150, pieceLabel: "medium potato", cup: 150 } }),
  defineIngredient("sweet_potato", "Sweet potato", "சர்க்கரைவள்ளிக்கிழங்கு", "മധുരക്കിഴങ്ങ്", "vegetables", "vegan", [86, 1.6, 20.1, 3.0, 0.1], 60, { u: { piece: 150, pieceLabel: "medium sweet potato", cup: 135 } }),
  defineIngredient("cauliflower", "Cauliflower", "காலிஃபிளவர்", "കോളിഫ്ലവർ", "vegetables", "vegan", [25, 1.9, 5.0, 2.0, 0.3], 50, { u: { cup: 100, piece: 600, pieceLabel: "medium head" } }),
  defineIngredient("cabbage", "Cabbage", "முட்டைக்கோஸ்", "കാബേജ്", "vegetables", "vegan", [25, 1.3, 5.8, 2.5, 0.1], 30, { u: { cup: 90 } }),
  defineIngredient("broccoli", "Broccoli", "ப்ரோக்கோலி", "ബ്രോക്കോളി", "vegetables", "vegan", [34, 2.8, 6.6, 2.6, 0.4], 200, { u: { cup: 90 } }),
  defineIngredient("spinach", "Spinach (palak)", "பசலைக்கீரை", "പാലക്ക് ചീര", "vegetables", "vegan", [23, 2.9, 3.6, 2.2, 0.4], 60, { u: { cup: 30 } }),
  defineIngredient("amaranth_leaves", "Amaranth leaves", "அரைக்கீரை", "ചീര", "vegetables", "vegan", [23, 2.5, 4.0, 2.0, 0.3], 60, { u: { cup: 30 } }),
  defineIngredient("methi_leaves", "Fenugreek leaves (methi)", "வெந்தயக்கீரை", "ഉലുവയില", "vegetables", "vegan", [38, 4.0, 6.0, 4.9, 0.9], 80, { u: { cup: 30 }, src: "ifct" }),
  defineIngredient("mustard_greens", "Mustard greens (sarson)", "கடுகுக் கீரை", "കടുകില", "vegetables", "vegan", [27, 2.9, 4.7, 3.2, 0.4], 60, { u: { cup: 56 } }),
  defineIngredient("drumstick_leaves", "Drumstick leaves (moringa)", "முருங்கைக்கீரை", "മുരിങ്ങയില", "vegetables", "vegan", [64, 9.4, 8.3, 2.0, 1.4], 80, { u: { cup: 21 } }),
  defineIngredient("capsicum", "Green capsicum", "குடைமிளகாய்", "കാപ്സിക്കം", "vegetables", "vegan", [20, 0.9, 4.6, 1.7, 0.2], 80, { u: { piece: 120, pieceLabel: "medium capsicum", cup: 150 } }),
  defineIngredient("bell_pepper_red", "Red/yellow bell pepper", "சிவப்பு குடைமிளகாய்", "ചുവന്ന കാപ്സിക്കം", "vegetables", "vegan", [31, 1.0, 6.0, 2.1, 0.3], 220, { u: { piece: 150, pieceLabel: "bell pepper", cup: 150 } }),
  defineIngredient("cucumber", "Cucumber", "வெள்ளரிக்காய்", "വെള്ളരിക്ക", "vegetables", "vegan", [15, 0.7, 3.6, 0.5, 0.1], 40, { u: { piece: 200, pieceLabel: "cucumber", cup: 120 } }),
  defineIngredient("carrot", "Carrot", "கேரட்", "കാരറ്റ്", "vegetables", "vegan", [41, 0.9, 9.6, 2.8, 0.2], 50, { u: { piece: 70, pieceLabel: "medium carrot", cup: 110 } }),
  defineIngredient("beetroot", "Beetroot", "பீட்ரூட்", "ബീറ്റ്റൂട്ട്", "vegetables", "vegan", [43, 1.6, 9.6, 2.8, 0.2], 50, { u: { piece: 120, pieceLabel: "medium beetroot", cup: 135 } }),
  defineIngredient("french_beans", "French beans", "பீன்ஸ்", "ബീൻസ്", "vegetables", "vegan", [31, 1.8, 7.0, 2.7, 0.2], 80, { u: { cup: 100 } }),
  defineIngredient("long_beans", "Long beans (payar)", "காராமணி", "അച്ചിങ്ങ പയർ", "vegetables", "vegan", [47, 2.8, 8.4, 3.6, 0.4], 80, { u: { cup: 100 } }),
  defineIngredient("okra", "Okra (lady's finger)", "வெண்டைக்காய்", "വെണ്ടയ്ക്ക", "vegetables", "vegan", [33, 1.9, 7.5, 3.2, 0.2], 60, { u: { piece: 12, pieceLabel: "pod", cup: 100 } }),
  defineIngredient("brinjal", "Brinjal (eggplant)", "கத்தரிக்காய்", "വഴുതനങ്ങ", "vegetables", "vegan", [25, 1.0, 5.9, 3.0, 0.2], 50, { u: { piece: 80, pieceLabel: "small brinjal", cup: 82 } }),
  defineIngredient("bottle_gourd", "Bottle gourd (lauki)", "சுரைக்காய்", "ചുരയ്ക്ക", "vegetables", "vegan", [15, 0.6, 3.4, 0.5, 0.0], 40, { u: { cup: 120 } }),
  defineIngredient("ridge_gourd", "Ridge gourd", "பீர்க்கங்காய்", "പീച്ചിങ്ങ", "vegetables", "vegan", [20, 1.2, 4.4, 1.1, 0.2], 60, { u: { cup: 100 } }),
  defineIngredient("snake_gourd", "Snake gourd", "புடலங்காய்", "പടവലങ്ങ", "vegetables", "vegan", [18, 0.6, 3.6, 0.6, 0.3], 50, { u: { cup: 100 } }),
  defineIngredient("bitter_gourd", "Bitter gourd", "பாகற்காய்", "പാവയ്ക്ക", "vegetables", "vegan", [17, 1.0, 3.7, 2.8, 0.2], 60, { u: { piece: 100, pieceLabel: "bitter gourd", cup: 95 } }),
  defineIngredient("ash_gourd", "Ash gourd", "வெள்ளைப் பூசணி", "കുമ്പളങ്ങ", "vegetables", "vegan", [13, 0.4, 3.0, 2.9, 0.2], 40, { u: { cup: 130 } }),
  defineIngredient("pumpkin", "Pumpkin (red)", "பரங்கிக்காய்", "മത്തങ്ങ", "vegetables", "vegan", [26, 1.0, 6.5, 0.5, 0.1], 40, { u: { cup: 116 } }),
  defineIngredient("drumstick", "Drumstick (moringa pods)", "முருங்கைக்காய்", "മുരിങ്ങക്കായ", "vegetables", "vegan", [37, 2.1, 8.5, 3.2, 0.2], 100, { u: { piece: 40, pieceLabel: "drumstick", cup: 100 } }),
  defineIngredient("raw_banana", "Raw banana (plantain)", "வாழைக்காய்", "പച്ചക്കായ", "vegetables", "vegan", [122, 1.3, 31.9, 2.3, 0.4], 50, { u: { piece: 150, pieceLabel: "raw banana" }, hidden: "Raw banana is starchy — similar in carbs to potato." }),
  defineIngredient("chow_chow", "Chayote (chow chow)", "சௌசௌ", "ചൗചൗ", "vegetables", "vegan", [19, 0.8, 4.5, 1.7, 0.1], 40, { u: { piece: 250, pieceLabel: "chow chow", cup: 130 } }),
  defineIngredient("kohlrabi", "Kohlrabi (nool kol)", "நூல்கோல்", "നൂൽക്കോൽ", "vegetables", "vegan", [27, 1.7, 6.2, 3.6, 0.1], 60, { u: { piece: 150, pieceLabel: "kohlrabi", cup: 135 } }),
  defineIngredient("ivy_gourd", "Ivy gourd (tindora)", "கோவைக்காய்", "കോവയ്ക്ക", "vegetables", "vegan", [18, 1.2, 3.1, 1.6, 0.1], 60, { u: { cup: 110 }, src: "ifct" }),
  defineIngredient("elephant_yam", "Elephant foot yam", "சேனைக்கிழங்கு", "ചേന", "vegetables", "vegan", [79, 1.2, 18.4, 4.1, 0.1], 60, { u: { cup: 130 }, src: "ifct", hidden: "Yam is starchy — keep portions small on low-carb plans." }),
  defineIngredient("colocasia", "Colocasia (arbi)", "சேப்பங்கிழங்கு", "ചേമ്പ്", "vegetables", "vegan", [112, 1.5, 26.5, 4.1, 0.2], 60, { u: { piece: 40, pieceLabel: "small arbi", cup: 104 } }),
  defineIngredient("zucchini", "Zucchini", "சுக்கினி", "സുക്കിനി", "vegetables", "vegan", [17, 1.2, 3.1, 1.0, 0.3], 200, { u: { piece: 200, pieceLabel: "zucchini", cup: 124 } }),
  defineIngredient("mushroom", "Button mushrooms", "காளான்", "കൂൺ", "vegetables", "vegan", [22, 3.1, 3.3, 1.0, 0.3], 250, { avoid: ["mushroom"], u: { piece: 18, pieceLabel: "mushroom", cup: 70 }, shop: ["g", 200] }),
  defineIngredient("lettuce", "Lettuce", "லெட்டூஸ்", "ലെറ്റൂസ്", "vegetables", "vegan", [15, 1.4, 2.9, 1.3, 0.2], 200, { u: { cup: 47 } }),
  defineIngredient("celery", "Celery", "செலரி", "സെലറി", "vegetables", "vegan", [14, 0.7, 3.0, 1.6, 0.2], 200, { u: { piece: 40, pieceLabel: "stalk", cup: 100 } }),
  defineIngredient("radish", "Radish (mooli)", "முள்ளங்கி", "മുള്ളങ്കി", "vegetables", "vegan", [16, 0.7, 3.4, 1.6, 0.1], 40, { u: { piece: 150, pieceLabel: "radish", cup: 116 } }),
  defineIngredient("green_peas", "Green peas", "பட்டாணி", "ഗ്രീൻ പീസ്", "vegetables", "vegan", [81, 5.4, 14.5, 5.1, 0.4], 120, { u: { cup: 145, tbsp: 9 }, hidden: "Peas are higher in carbs than most vegetables — about 9 g net carbs per 100 g." }),
  defineIngredient("sweet_corn", "Sweet corn kernels", "மக்காச்சோளம்", "സ്വീറ്റ് കോൺ", "vegetables", "vegan", [86, 3.3, 19.0, 2.7, 1.4], 150, { u: { cup: 150, tbsp: 9 }, hidden: "Sweet corn is a starchy vegetable — about 16 g net carbs per 100 g." }),
  defineIngredient("avocado", "Avocado", "அவகேடோ", "അവക്കാഡോ", "fruits", "vegan", [160, 2.0, 8.5, 6.7, 14.7], 600, { u: { piece: 150, pieceLabel: "avocado (flesh)", cup: 150 } }),
  defineIngredient("olives", "Olives", "ஆலிவ்", "ഒലിവ്", "condiments", "vegan", [115, 0.8, 6.3, 3.2, 10.7], 800, { u: { piece: 4, pieceLabel: "olive", tbsp: 9 } }),
  defineIngredient("garlic", "Garlic", "பூண்டு", "വെളുത്തുള്ളി", "vegetables", "vegan", [149, 6.4, 33.1, 2.1, 0.5], 200, { avoid: OG, u: { piece: 4, pieceLabel: "clove", tsp: 3, tbsp: 9 }, pantry: true }),
  defineIngredient("ginger", "Ginger", "இஞ்சி", "ഇഞ്ചി", "vegetables", "vegan", [80, 1.8, 17.8, 2.0, 0.8], 150, { u: { piece: 10, pieceLabel: "inch piece", tsp: 3, tbsp: 9 }, pantry: true }),
  defineIngredient("ginger_garlic_paste", "Ginger–garlic paste", "இஞ்சி பூண்டு விழுது", "ഇഞ്ചി-വെളുത്തുള്ളി പേസ്റ്റ്", "condiments", "vegan", [115, 4.0, 25.0, 2.0, 0.6], 250, { avoid: OG, u: { tsp: 5, tbsp: 15 }, src: "estimate" }),
  defineIngredient("green_chilli", "Green chilli", "பச்சை மிளகாய்", "പച്ചമുളക്", "vegetables", "vegan", [40, 2.0, 9.5, 1.5, 0.2], 80, { u: { piece: 3, pieceLabel: "green chilli" }, shop: ["g", 50], pantry: true }),
  defineIngredient("lemon_juice", "Lemon juice", "எலுமிச்சை சாறு", "ചെറുനാരങ്ങ നീര്", "fruits", "vegan", [22, 0.4, 6.9, 0.3, 0.2], 140, { u: { tsp: 5, tbsp: 15, piece: 30, pieceLabel: "lemon (juiced)" }, shop: ["piece"], density: 1.03 }),
  defineIngredient("amla", "Indian gooseberry (amla)", "நெல்லிக்காய்", "നെല്ലിക്ക", "fruits", "vegan", [44, 0.9, 10.2, 4.3, 0.6], 100, { u: { piece: 25, pieceLabel: "amla" } }),
  defineIngredient("kudampuli", "Kudampuli (Malabar tamarind)", "குடம்புளி", "കുടംപുളി", "condiments", "vegan", [60, 1.0, 14.0, 8.0, 0.5], 600, { u: { piece: 5, pieceLabel: "piece" }, src: "estimate" }),

  // ── Herbs ───────────────────────────────────────────────────────────────
  defineIngredient("curry_leaves", "Curry leaves", "கறிவேப்பிலை", "കറിവേപ്പില", "herbs", "vegan", [108, 6.1, 18.7, 6.4, 1.0], 200, { u: { piece: 1, pieceLabel: "sprig", tbsp: 1 }, src: "ifct", pantry: true }),
  defineIngredient("coriander_leaves", "Coriander leaves", "கொத்தமல்லி இலை", "മല്ലിയില", "herbs", "vegan", [23, 2.1, 3.7, 2.8, 0.5], 120, { u: { tbsp: 1, cup: 16 } }),
  defineIngredient("mint", "Mint leaves", "புதினா", "പുതിന", "herbs", "vegan", [44, 3.3, 8.4, 6.8, 0.7], 150, { u: { tbsp: 1.5, cup: 20 } }),
  defineIngredient("dill", "Dill leaves (suva)", "சதகுப்பை", "ശതകുപ്പ", "herbs", "vegan", [43, 3.5, 7.0, 2.1, 1.1], 150, { u: { tbsp: 1, cup: 9 } }),
  defineIngredient("oregano", "Dried oregano", "ஓரிகானோ", "ഒറിഗാനോ", "spices", "vegan", [265, 9.0, 68.9, 42.5, 4.3], 900, { u: { tsp: 1, tbsp: 3 } }),

  // ── Fruits ──────────────────────────────────────────────────────────────
  defineIngredient("banana", "Banana", "வாழைப்பழம்", "പഴം", "fruits", "vegan", [89, 1.1, 22.8, 2.6, 0.3], 60, { u: { piece: 100, pieceLabel: "medium banana", cup: 150 } }),
  defineIngredient("apple", "Apple", "ஆப்பிள்", "ആപ്പിൾ", "fruits", "vegan", [52, 0.3, 13.8, 2.4, 0.2], 180, { u: { piece: 180, pieceLabel: "medium apple", cup: 125 } }),
  defineIngredient("papaya", "Papaya", "பப்பாளி", "പപ്പായ", "fruits", "vegan", [43, 0.5, 10.8, 1.7, 0.3], 50, { u: { cup: 145 } }),
  defineIngredient("guava", "Guava", "கொய்யா", "പേരയ്ക്ക", "fruits", "vegan", [68, 2.6, 14.3, 5.4, 1.0], 80, { u: { piece: 100, pieceLabel: "guava" } }),
  defineIngredient("orange", "Orange", "ஆரஞ்சு", "ഓറഞ്ച്", "fruits", "vegan", [47, 0.9, 11.8, 2.4, 0.1], 100, { u: { piece: 130, pieceLabel: "orange" } }),
  defineIngredient("pomegranate", "Pomegranate arils", "மாதுளை", "മാതളം", "fruits", "vegan", [83, 1.7, 18.7, 4.0, 1.2], 200, { u: { tbsp: 10, cup: 170 } }),
  defineIngredient("strawberries", "Strawberries", "ஸ்ட்ராபெர்ரி", "സ്ട്രോബെറി", "fruits", "vegan", [32, 0.7, 7.7, 2.0, 0.3], 500, { u: { piece: 12, pieceLabel: "strawberry", cup: 150 }, shop: ["g", 200] }),
  defineIngredient("mango", "Mango", "மாம்பழம்", "മാമ്പഴം", "fruits", "vegan", [60, 0.8, 15.0, 1.6, 0.4], 120, { u: { cup: 165, piece: 200, pieceLabel: "mango (flesh)" } }),
  defineIngredient("dates", "Dates", "பேரீச்சம்பழம்", "ഈന്തപ്പഴം", "sweeteners", "vegan", [282, 2.5, 75.0, 8.0, 0.4], 300, { u: { piece: 8, pieceLabel: "date" }, hidden: "Dates are very high in natural sugar." }),
  defineIngredient("raisins", "Raisins", "உலர் திராட்சை", "ഉണക്കമുന്തിരി", "sweeteners", "vegan", [299, 3.1, 79.2, 3.7, 0.5], 400, { u: { tbsp: 9 }, hidden: "Raisins are concentrated sugar." }),
  defineIngredient("coconut_grated", "Fresh grated coconut", "தேங்காய் துருவல்", "ചിരകിയ തേങ്ങ", "nuts_seeds", "vegan", [354, 3.3, 15.2, 9.0, 33.5], 130, { allergens: ["coconut"], u: { tbsp: 6, cup: 80, piece: 300, pieceLabel: "coconut, grated" } }),
  defineIngredient("coconut_milk", "Coconut milk", "தேங்காய்ப் பால்", "തേങ്ങാപ്പാൽ", "dairy", "vegan", [200, 2.0, 3.3, 0.0, 21.0], 350, { allergens: ["coconut"], density: 1.0, u: { tbsp: 15, cup: 240 }, shop: ["ml", 200] }),
  defineIngredient("desiccated_coconut", "Desiccated coconut", "உலர் தேங்காய்", "ഉണക്ക തേങ്ങാപ്പൊടി", "nuts_seeds", "vegan", [660, 6.9, 23.7, 16.3, 64.5], 400, { allergens: ["coconut"], u: { tbsp: 5, cup: 80 } }),

  // ── Dairy ───────────────────────────────────────────────────────────────
  defineIngredient("milk", "Toned milk", "பால்", "പാൽ", "dairy", "vegetarian", [58, 3.1, 4.7, 0, 3.0], 58, { allergens: ["milk"], density: 1.03, u: { tbsp: 15, cup: 245 }, shop: ["ml", 500], src: "label", hidden: "Milk has natural sugar (lactose) — about 5 g carbs per 100 ml." }),
  defineIngredient("milk_full", "Full-cream milk", "முழு கொழுப்பு பால்", "ഫുൾ ക്രീം പാൽ", "dairy", "vegetarian", [86, 3.2, 4.9, 0, 6.0], 70, { allergens: ["milk"], density: 1.03, u: { tbsp: 15, cup: 245 }, shop: ["ml", 500], src: "label", hidden: "Milk has natural sugar (lactose)." }),
  defineIngredient("curd", "Curd (dahi)", "தயிர்", "തൈര്", "dairy", "vegetarian", [60, 3.1, 4.0, 0, 3.4], 90, { allergens: ["milk"], u: { tbsp: 15, cup: 245 }, shop: ["g", 400], src: "label" }),
  defineIngredient("hung_curd", "Hung curd / Greek yogurt", "கெட்டித் தயிர்", "കട്ടത്തൈര്", "dairy", "vegetarian", [97, 9.0, 4.0, 0, 5.0], 250, { allergens: ["milk"], u: { tbsp: 17, cup: 245 }, shop: ["g", 200] }),
  defineIngredient("paneer", "Paneer", "பனீர்", "പനീർ", "dairy", "vegetarian", [265, 18.3, 1.2, 0, 20.8], 440, { allergens: ["milk"], u: { cup: 150, piece: 15, pieceLabel: "1-inch cube" }, shop: ["g", 200], src: "label" }),
  defineIngredient("ghee", "Ghee", "நெய்", "നെയ്യ്", "oils", "vegetarian", [898, 0, 0, 0, 99.8], 650, { allergens: ["milk"], u: { tsp: 4.5, tbsp: 13.5, cup: 205 }, shop: ["ml", 200], density: 0.91 }),
  defineIngredient("butter", "Butter", "வெண்ணெய்", "വെണ്ണ", "dairy", "vegetarian", [717, 0.9, 0.1, 0, 81.0], 560, { allergens: ["milk"], u: { tsp: 4.7, tbsp: 14 }, shop: ["g", 100] }),
  defineIngredient("cheese_cheddar", "Cheddar / processed cheese", "சீஸ்", "ചീസ്", "dairy", "vegetarian", [403, 24.9, 1.3, 0, 33.1], 700, { allergens: ["milk"], u: { tbsp: 7, cup: 113, piece: 20, pieceLabel: "slice" }, shop: ["g", 200] }),
  defineIngredient("mozzarella", "Mozzarella", "மொசரெல்லா", "മൊസറെല്ല", "dairy", "vegetarian", [280, 28.0, 3.1, 0, 17.0], 800, { allergens: ["milk"], u: { cup: 112, tbsp: 7 }, shop: ["g", 200] }),
  defineIngredient("parmesan", "Parmesan", "பார்மேசன்", "പാർമസാൻ", "dairy", "vegetarian", [431, 38.0, 4.1, 0, 29.0], 2500, { allergens: ["milk"], u: { tbsp: 5 }, shop: ["g", 100] }),
  defineIngredient("feta", "Feta", "ஃபெட்டா", "ഫെറ്റ", "dairy", "vegetarian", [264, 14.2, 4.1, 0, 21.3], 1500, { allergens: ["milk"], u: { tbsp: 9, cup: 150 }, shop: ["g", 200] }),
  defineIngredient("cream_fresh", "Fresh cream (25%)", "கிரீம்", "ഫ്രഷ് ക്രീം", "dairy", "vegetarian", [247, 2.0, 3.5, 0, 25.0], 400, { allergens: ["milk"], density: 1.0, u: { tbsp: 15, cup: 240 }, shop: ["ml", 200], src: "label" }),
  defineIngredient("cream_heavy", "Heavy/whipping cream (35%)", "விப்பிங் கிரீம்", "വിപ്പിംഗ് ക്രീം", "dairy", "vegetarian", [345, 2.8, 2.8, 0, 36.0], 600, { allergens: ["milk"], density: 1.0, u: { tbsp: 15, cup: 240 }, shop: ["ml", 250] }),
  defineIngredient("cream_cheese", "Cream cheese", "கிரீம் சீஸ்", "ക്രീം ചീസ്", "dairy", "vegetarian", [342, 6.0, 5.5, 0, 34.0], 1200, { allergens: ["milk"], u: { tbsp: 15 }, shop: ["g", 200] }),

  // ── Eggs ────────────────────────────────────────────────────────────────
  defineIngredient("egg", "Egg", "முட்டை", "മുട്ട", "eggs", "egg", [143, 12.6, 0.7, 0, 9.5], 127, { allergens: ["egg"], u: { piece: 50, pieceLabel: "egg" }, shop: ["piece", 6] }),
  defineIngredient("egg_white", "Egg white", "முட்டை வெள்ளைக்கரு", "മുട്ടയുടെ വെള്ള", "eggs", "egg", [52, 10.9, 0.7, 0, 0.2], 190, { allergens: ["egg"], u: { piece: 33, pieceLabel: "egg white", tbsp: 15 }, shop: ["piece", 6] }),

  // ── Meat & poultry ──────────────────────────────────────────────────────
  defineIngredient("chicken_curry_cut", "Chicken curry cut (bone-in, skinless)", "கோழி இறைச்சி", "കോഴിയിറച്ചി", "meat", "nonveg", [95, 15.5, 0, 0, 3.6], 260, { u: { piece: 50, pieceLabel: "curry-cut piece" }, src: "estimate", shop: ["g", 250] }),
  defineIngredient("chicken_breast", "Chicken breast (boneless)", "கோழி நெஞ்சுக்கறி", "ചിക്കൻ ബ്രെസ്റ്റ്", "meat", "nonveg", [120, 22.5, 0, 0, 2.6], 380, { u: { piece: 200, pieceLabel: "breast fillet" }, shop: ["g", 250] }),
  defineIngredient("chicken_thigh", "Chicken thigh (boneless, skinless)", "கோழி தொடைக்கறி", "ചിക്കൻ തുട", "meat", "nonveg", [121, 19.7, 0, 0, 4.1], 340, { u: { piece: 90, pieceLabel: "thigh" }, shop: ["g", 250] }),
  defineIngredient("chicken_mince", "Chicken mince (keema)", "கோழி கீமா", "ചിക്കൻ കീമ", "meat", "nonveg", [143, 17.4, 0, 0, 8.1], 360, { u: { cup: 225 }, shop: ["g", 250] }),
  defineIngredient("mutton", "Mutton curry cut (bone-in)", "ஆட்டிறைச்சி", "ആട്ടിറച്ചി", "meat", "nonveg", [120, 15.0, 0, 0, 6.6], 800, { avoid: ["mutton"], src: "estimate", shop: ["g", 250] }),
  defineIngredient("mutton_mince", "Mutton mince (keema)", "ஆட்டுக் கீமா", "മട്ടൻ കീമ", "meat", "nonveg", [198, 18.0, 0, 0, 14.0], 850, { avoid: ["mutton"], src: "estimate", u: { cup: 225 }, shop: ["g", 250] }),
  defineIngredient("beef", "Beef (boneless)", "மாட்டிறைச்சி", "പോത്തിറച്ചി", "meat", "nonveg", [188, 20.0, 0, 0, 12.0], 380, { avoid: ["beef"], src: "estimate", shop: ["g", 250] }),

  // ── Fish & seafood ──────────────────────────────────────────────────────
  defineIngredient("seer_fish", "Seer fish (vanjaram/neymeen)", "வஞ்சிரம்", "നെയ്മീൻ", "seafood", "nonveg", [105, 20.3, 0, 0, 2.0], 900, { allergens: ["fish"], avoid: ["seafood"], u: { piece: 100, pieceLabel: "steak" }, shop: ["g", 250] }),
  defineIngredient("mackerel", "Indian mackerel (ayala/bangda)", "கானாங்கெளுத்தி", "അയല", "seafood", "nonveg", [121, 19.0, 0, 0, 5.0], 280, { allergens: ["fish"], avoid: ["seafood"], u: { piece: 120, pieceLabel: "cleaned fish" }, src: "ifct", shop: ["g", 250] }),
  defineIngredient("sardine", "Sardine (mathi/chaala)", "மத்தி", "മത്തി", "seafood", "nonveg", [150, 19.8, 0, 0, 7.8], 200, { allergens: ["fish"], avoid: ["seafood"], u: { piece: 40, pieceLabel: "cleaned sardine" }, src: "ifct", shop: ["g", 250] }),
  defineIngredient("pomfret", "Pomfret", "வாவல்", "ആവോലി", "seafood", "nonveg", [110, 18.8, 0, 0, 3.8], 700, { allergens: ["fish"], avoid: ["seafood"], u: { piece: 250, pieceLabel: "whole cleaned pomfret" }, shop: ["g", 250] }),
  defineIngredient("basa", "Basa / white fish fillet", "பாசா மீன்", "ബാസ ഫില്ലറ്റ്", "seafood", "nonveg", [91, 15.0, 0, 0, 3.4], 400, { allergens: ["fish"], avoid: ["seafood"], u: { piece: 150, pieceLabel: "fillet" }, shop: ["g", 250] }),
  defineIngredient("salmon", "Salmon", "சால்மன்", "സാൽമൺ", "seafood", "nonveg", [208, 20.4, 0, 0, 13.4], 2000, { allergens: ["fish"], avoid: ["seafood"], u: { piece: 150, pieceLabel: "fillet" }, shop: ["g", 250] }),
  defineIngredient("tuna_canned", "Tuna, canned in water (drained)", "டூனா", "ട്യൂണ", "seafood", "nonveg", [116, 25.5, 0, 0, 0.8], 1100, { allergens: ["fish"], avoid: ["seafood"], u: { cup: 154 }, shop: ["g", 185] }),
  defineIngredient("prawns", "Prawns (cleaned)", "இறால்", "ചെമ്മീൻ", "seafood", "nonveg", [85, 20.1, 0, 0, 0.5], 600, { allergens: ["shellfish"], avoid: ["seafood"], u: { piece: 12, pieceLabel: "medium prawn", cup: 145 }, shop: ["g", 250] }),
  defineIngredient("squid", "Squid (koonthal/kanava)", "கணவாய்", "കണവ", "seafood", "nonveg", [92, 15.6, 3.1, 0, 1.4], 450, { allergens: ["shellfish"], avoid: ["seafood"], shop: ["g", 250] }),

  // ── Pulses & legumes (dry, uncooked) ────────────────────────────────────
  defineIngredient("toor_dal", "Toor dal (split pigeon pea)", "துவரம் பருப்பு", "തുവരപ്പരിപ്പ്", "pulses", "vegan", [335, 21.7, 64.0, 9.0, 1.5], 160, { src: "ifct" }),
  defineIngredient("moong_dal", "Moong dal (split yellow)", "பாசிப் பருப்பு", "ചെറുപയർ പരിപ്പ്", "pulses", "vegan", [340, 24.5, 60.0, 8.2, 1.2], 140, { src: "ifct" }),
  defineIngredient("green_moong", "Whole green moong", "பச்சைப் பயறு", "ചെറുപയർ", "pulses", "vegan", [330, 23.9, 62.6, 16.3, 1.2], 140),
  defineIngredient("urad_dal", "Urad dal (split, skinless)", "உளுத்தம் பருப்பு", "ഉഴുന്ന് പരിപ്പ്", "pulses", "vegan", [335, 25.0, 59.0, 11.0, 1.6], 150, { src: "ifct" }),
  defineIngredient("chana_dal", "Chana dal", "கடலைப் பருப்பு", "കടലപ്പരിപ്പ്", "pulses", "vegan", [360, 21.0, 60.0, 11.0, 5.5], 110, { src: "ifct" }),
  defineIngredient("masoor_dal", "Masoor dal (red lentil)", "மைசூர் பருப்பு", "മസൂർ പരിപ്പ്", "pulses", "vegan", [352, 24.6, 63.1, 10.8, 2.2], 110),
  defineIngredient("rajma", "Rajma (kidney beans)", "ராஜ்மா", "രാജ്മ", "pulses", "vegan", [333, 23.6, 60.0, 15.2, 0.8], 160),
  defineIngredient("kabuli_chana", "Chickpeas (kabuli chana)", "கொண்டைக்கடலை", "വെള്ളക്കടല", "pulses", "vegan", [364, 19.3, 60.7, 17.4, 6.0], 130),
  defineIngredient("kala_chana", "Black chickpeas (kala chana)", "கருப்பு கொண்டைக்கடலை", "കറുത്ത കടല", "pulses", "vegan", [360, 20.0, 60.0, 17.0, 5.0], 110, { src: "ifct" }),
  defineIngredient("soy_chunks", "Soya chunks", "சோயா சங்க்ஸ்", "സോയ ചങ്ക്സ്", "pulses", "vegan", [345, 52.0, 33.0, 13.0, 0.5], 180, { allergens: ["soy"], u: { cup: 50, tbsp: 4 }, src: "label", shop: ["g", 200] }),
  defineIngredient("tofu", "Firm tofu", "டோஃபு", "ടോഫു", "pulses", "vegan", [144, 17.3, 2.8, 2.3, 8.7], 300, { allergens: ["soy"], u: { cup: 250, piece: 15, pieceLabel: "1-inch cube" }, shop: ["g", 200] }),
  defineIngredient("moong_sprouts", "Moong sprouts", "முளைகட்டிய பயறு", "മുളപ്പിച്ച ചെറുപയർ", "pulses", "vegan", [30, 3.0, 5.9, 1.8, 0.2], 120, { u: { cup: 104, tbsp: 7 }, pantry: false }),
  defineIngredient("roasted_gram", "Roasted gram (pottukadalai)", "பொட்டுக்கடலை", "പൊട്ടുകടല", "pulses", "vegan", [369, 22.5, 58.8, 16.8, 5.2], 160, { src: "ifct" }),

  // ── Grains, flours, starches ────────────────────────────────────────────
  defineIngredient("rice", "White rice (raw, e.g. sona masoori)", "அரிசி", "അരി", "grains", "vegan", [352, 6.8, 79.0, 1.3, 0.5], 60, { u: { tbsp: 12, cup: 190 }, src: "ifct" }),
  defineIngredient("brown_rice", "Brown rice (raw)", "பழுப்பு அரிசி", "ബ്രൗൺ അരി", "grains", "vegan", [367, 7.5, 76.2, 3.4, 2.7], 90, { u: { cup: 190 } }),
  defineIngredient("idli_rice", "Idli rice (parboiled)", "இட்லி அரிசி", "ഇഡ്ഡലി അരി", "grains", "vegan", [350, 6.4, 79.0, 1.0, 0.5], 50, { u: { cup: 190 }, src: "ifct" }),
  defineIngredient("matta_rice", "Kerala matta rice (red, parboiled)", "சிவப்பு அரிசி", "മട്ട അരി", "grains", "vegan", [355, 7.5, 77.0, 3.0, 2.0], 70, { u: { cup: 190 }, src: "estimate" }),
  defineIngredient("poha", "Poha (flattened rice)", "அவல்", "അവൽ", "grains", "vegan", [350, 6.6, 77.3, 2.5, 1.2], 70, { u: { cup: 90 }, src: "ifct" }),
  defineIngredient("rava", "Rava / semolina", "ரவை", "റവ", "grains", "vegan", [360, 12.7, 72.8, 3.9, 1.1], 60, { allergens: ["gluten"], u: { cup: 167 } }),
  defineIngredient("atta", "Whole-wheat flour (atta)", "கோதுமை மாவு", "ഗോതമ്പ് പൊടി", "grains", "vegan", [340, 13.2, 72.0, 10.7, 2.5], 45, { allergens: ["gluten"], u: { tbsp: 8, cup: 120 } }),
  defineIngredient("besan", "Besan (gram flour)", "கடலை மாவு", "കടലമാവ്", "grains", "vegan", [380, 22.4, 57.8, 10.8, 6.7], 100, { u: { tbsp: 7.5, cup: 90 }, hidden: "Besan is a pulse flour — a coating or batter can add 10–20 g carbs per serving." }),
  defineIngredient("ragi_flour", "Ragi (finger millet) flour", "கேழ்வரகு மாவு", "റാഗി പൊടി", "grains", "vegan", [320, 7.2, 78.0, 11.2, 1.9], 70, { u: { tbsp: 8, cup: 120 }, src: "ifct" }),
  defineIngredient("oats", "Rolled oats", "ஓட்ஸ்", "ഓട്സ്", "grains", "vegan", [379, 13.2, 67.7, 10.1, 6.5], 180, { allergens: ["gluten"], u: { tbsp: 5, cup: 80 } }),
  defineIngredient("foxtail_millet", "Foxtail millet (thinai)", "தினை", "തിന", "grains", "vegan", [331, 12.3, 66.8, 6.7, 4.3], 120, { u: { cup: 200 }, src: "ifct" }),
  defineIngredient("little_millet", "Little millet (samai)", "சாமை", "ചാമ", "grains", "vegan", [346, 8.9, 72.0, 6.4, 5.2], 120, { u: { cup: 200 }, src: "ifct" }),
  defineIngredient("jowar_flour", "Jowar (sorghum) flour", "சோள மாவு", "ജോവർ പൊടി", "grains", "vegan", [334, 10.0, 72.0, 9.7, 1.7], 70, { u: { tbsp: 8, cup: 120 }, src: "ifct" }),
  defineIngredient("bajra_flour", "Bajra (pearl millet) flour", "கம்பு மாவு", "കമ്പ് പൊടി", "grains", "vegan", [361, 11.0, 67.5, 11.5, 5.4], 60, { u: { tbsp: 8, cup: 120 }, src: "ifct" }),
  defineIngredient("quinoa", "Quinoa", "கினோவா", "ക്വിനോവ", "grains", "vegan", [368, 14.1, 64.2, 7.0, 6.1], 500, { u: { cup: 170 } }),
  defineIngredient("whole_wheat_bread", "Whole-wheat bread", "கோதுமை ரொட்டி", "ഗോതമ്പ് ബ്രെഡ്", "grains", "vegan", [247, 13.0, 41.0, 7.0, 3.4], 150, { allergens: ["gluten"], u: { piece: 30, pieceLabel: "slice" }, shop: ["piece", 16], pantry: false }),
  defineIngredient("whole_wheat_pasta", "Whole-wheat pasta (dry)", "கோதுமை பாஸ்தா", "ഗോതമ്പ് പാസ്ത", "grains", "vegan", [348, 14.6, 71.3, 9.2, 1.4], 350, { allergens: ["gluten"], u: { cup: 90 }, shop: ["g", 500] }),
  defineIngredient("cornflour", "Cornflour (corn starch)", "கார்ன்ஃப்ளார்", "കോൺഫ്ലോർ", "grains", "vegan", [381, 0.3, 91.3, 0.9, 0.1], 120, { u: { tsp: 2.7, tbsp: 8 }, hidden: "Cornflour is pure starch — even a spoonful used as a thickener adds about 7 g carbs.", pantry: true }),
  defineIngredient("almond_flour", "Almond flour", "பாதாம் மாவு", "ബദാം പൊടി", "nuts_seeds", "vegan", [600, 21.4, 21.4, 10.7, 50.0], 1200, { allergens: ["tree_nuts"], u: { tbsp: 7, cup: 96 }, shop: ["g", 250] }),
  defineIngredient("coconut_flour", "Coconut flour", "தேங்காய் மாவு", "തേങ്ങാപ്പൊടി", "nuts_seeds", "vegan", [400, 13.3, 60.0, 33.3, 13.3], 600, { allergens: ["coconut"], u: { tbsp: 7, cup: 112 }, src: "label", shop: ["g", 250] }),
  defineIngredient("psyllium_husk", "Psyllium husk (isabgol)", "இசப்கோல்", "ഇസബ്ഗോൾ", "nuts_seeds", "vegan", [200, 1.5, 85.0, 80.0, 0.6], 1200, { u: { tsp: 3, tbsp: 9 }, src: "label", shop: ["g", 100] }),
  defineIngredient("makhana", "Makhana (fox nuts)", "தாமரை விதை", "മഖാന", "nuts_seeds", "vegan", [347, 9.7, 77.0, 7.6, 0.1], 1000, { u: { cup: 32 }, src: "ifct", hidden: "Makhana is mostly starch — about 70 g net carbs per 100 g.", shop: ["g", 100] }),

  // ── Nuts & seeds ────────────────────────────────────────────────────────
  defineIngredient("peanuts", "Peanuts", "வேர்க்கடலை", "നിലക്കടല", "nuts_seeds", "vegan", [567, 25.8, 16.1, 8.5, 49.2], 160, { allergens: ["peanut"] }),
  defineIngredient("almonds", "Almonds", "பாதாம்", "ബദാം", "nuts_seeds", "vegan", [579, 21.2, 21.6, 12.5, 49.9], 900, { allergens: ["tree_nuts"], u: { piece: 1.2, pieceLabel: "almond", tbsp: 9, cup: 143 }, shop: ["g", 100] }),
  defineIngredient("cashews", "Cashews", "முந்திரி", "കശുവണ്ടി", "nuts_seeds", "vegan", [553, 18.2, 30.2, 3.3, 43.9], 900, { allergens: ["tree_nuts"], u: { piece: 1.5, pieceLabel: "cashew", tbsp: 9, cup: 137 }, shop: ["g", 100] }),
  defineIngredient("walnuts", "Walnuts", "வால்நட்", "വാൾനട്ട്", "nuts_seeds", "vegan", [654, 15.2, 13.7, 6.7, 65.2], 1400, { allergens: ["tree_nuts"], u: { piece: 4, pieceLabel: "walnut half", tbsp: 7.5, cup: 117 }, shop: ["g", 100] }),
  defineIngredient("pistachios", "Pistachios", "பிஸ்தா", "പിസ്ത", "nuts_seeds", "vegan", [560, 20.2, 27.2, 10.6, 45.3], 1600, { allergens: ["tree_nuts"], u: { tbsp: 8 }, shop: ["g", 100] }),
  defineIngredient("flax_seeds", "Flax seeds", "ஆளி விதை", "ഫ്ലാക്സ് സീഡ്", "nuts_seeds", "vegan", [534, 18.3, 28.9, 27.3, 42.2], 250, { u: { tsp: 3.5, tbsp: 10 }, shop: ["g", 100] }),
  defineIngredient("chia_seeds", "Chia seeds", "சியா விதை", "ചിയ വിത്ത്", "nuts_seeds", "vegan", [486, 16.5, 42.1, 34.4, 30.7], 600, { u: { tsp: 4, tbsp: 12 }, shop: ["g", 100] }),
  defineIngredient("sesame_seeds", "Sesame seeds", "எள்", "എള്ള്", "nuts_seeds", "vegan", [573, 17.7, 23.4, 11.8, 49.7], 250, { allergens: ["sesame"], u: { tsp: 3, tbsp: 9 }, pantry: true }),
  defineIngredient("pumpkin_seeds", "Pumpkin seeds", "பூசணி விதை", "മത്തങ്ങക്കുരു", "nuts_seeds", "vegan", [559, 30.2, 10.7, 6.0, 49.1], 900, { u: { tbsp: 8, cup: 129 }, shop: ["g", 100] }),
  defineIngredient("sunflower_seeds", "Sunflower seeds", "சூரியகாந்தி விதை", "സൂര്യകാന്തി വിത്ത്", "nuts_seeds", "vegan", [584, 20.8, 20.0, 8.6, 51.5], 500, { u: { tbsp: 9 }, shop: ["g", 100] }),
  defineIngredient("peanut_butter", "Peanut butter (unsweetened)", "வேர்க்கடலை வெண்ணெய்", "പീനട്ട് ബട്ടർ", "condiments", "vegan", [588, 25.0, 20.0, 6.0, 50.0], 500, { allergens: ["peanut"], u: { tsp: 5.3, tbsp: 16 }, shop: ["g", 340] }),
  defineIngredient("tahini", "Tahini (sesame paste)", "எள் விழுது", "താഹിനി", "condiments", "vegan", [595, 17.0, 21.2, 9.3, 53.8], 900, { allergens: ["sesame"], u: { tsp: 5, tbsp: 15 }, shop: ["g", 200] }),

  // ── Oils ────────────────────────────────────────────────────────────────
  defineIngredient("coconut_oil", "Coconut oil", "தேங்காய் எண்ணெய்", "വെളിച്ചെണ്ണ", "oils", "vegan", [892, 0, 0, 0, 99.1], 250, { allergens: ["coconut"], density: 0.92, shop: ["ml", 500] }),
  defineIngredient("groundnut_oil", "Groundnut oil", "கடலை எண்ணெய்", "കടലെണ്ണ", "oils", "vegan", [884, 0, 0, 0, 100], 220, { density: 0.92, shop: ["ml", 1000] }),
  defineIngredient("sesame_oil", "Gingelly (sesame) oil", "நல்லெண்ணெய்", "നല്ലെണ്ണ", "oils", "vegan", [884, 0, 0, 0, 100], 350, { allergens: ["sesame"], density: 0.92, shop: ["ml", 500] }),
  defineIngredient("mustard_oil", "Mustard oil", "கடுகு எண்ணெய்", "കടുകെണ്ണ", "oils", "vegan", [884, 0, 0, 0, 100], 200, { allergens: ["mustard"], density: 0.92, shop: ["ml", 1000] }),
  defineIngredient("olive_oil", "Olive oil", "ஆலிவ் எண்ணெய்", "ഒലിവ് ഓയിൽ", "oils", "vegan", [884, 0, 0, 0, 100], 900, { density: 0.92, shop: ["ml", 500] }),
  defineIngredient("sunflower_oil", "Sunflower / rice-bran oil", "சூரியகாந்தி எண்ணெய்", "സൂര്യകാന്തി എണ്ണ", "oils", "vegan", [884, 0, 0, 0, 100], 160, { density: 0.92, shop: ["ml", 1000] }),

  // ── Spices & masalas ────────────────────────────────────────────────────
  defineIngredient("salt", "Salt", "உப்பு", "ഉപ്പ്", "spices", "vegan", [0, 0, 0, 0, 0], 25, { u: { tsp: 6, tbsp: 18 } }),
  defineIngredient("black_salt", "Black salt (kala namak)", "கருப்பு உப்பு", "കറുത്ത ഉപ്പ്", "spices", "vegan", [0, 0, 0, 0, 0], 100, { u: { tsp: 5 } }),
  defineIngredient("turmeric", "Turmeric powder", "மஞ்சள் தூள்", "മഞ്ഞൾപ്പൊടി", "spices", "vegan", [312, 9.7, 67.1, 22.7, 3.3], 300, { u: { tsp: 3, tbsp: 9 } }),
  defineIngredient("chilli_powder", "Red chilli powder", "மிளகாய்த் தூள்", "മുളകുപൊടി", "spices", "vegan", [282, 13.5, 49.7, 34.8, 14.3], 350, { u: { tsp: 2.5, tbsp: 7.5 } }),
  defineIngredient("kashmiri_chilli", "Kashmiri chilli powder", "காஷ்மீரி மிளகாய்த் தூள்", "കാശ്മീരി മുളകുപൊടി", "spices", "vegan", [282, 13.5, 49.7, 34.8, 14.3], 600, { u: { tsp: 2.5, tbsp: 7.5 } }),
  defineIngredient("chilli_flakes", "Chilli flakes", "மிளகாய் துகள்", "മുളക് ചതച്ചത്", "spices", "vegan", [282, 13.5, 49.7, 34.8, 14.3], 600, { u: { tsp: 1.8, tbsp: 5.4 } }),
  defineIngredient("dried_red_chilli", "Dried red chilli", "காய்ந்த மிளகாய்", "ഉണക്കമുളക്", "spices", "vegan", [324, 12.0, 69.9, 28.7, 5.8], 300, { u: { piece: 0.6, pieceLabel: "dried chilli" } }),
  defineIngredient("coriander_powder", "Coriander powder", "மல்லித் தூள்", "മല്ലിപ്പൊടി", "spices", "vegan", [298, 12.4, 55.0, 41.9, 17.8], 250, { u: { tsp: 2, tbsp: 6 } }),
  defineIngredient("coriander_seeds", "Coriander seeds", "கொத்தமல்லி விதை", "മല്ലി", "spices", "vegan", [298, 12.4, 55.0, 41.9, 17.8], 200, { u: { tsp: 1.8, tbsp: 5.4 } }),
  defineIngredient("cumin_seeds", "Cumin seeds", "சீரகம்", "ജീരകം", "spices", "vegan", [375, 17.8, 44.2, 10.5, 22.3], 500, { u: { tsp: 2, tbsp: 6 } }),
  defineIngredient("cumin_powder", "Cumin powder", "சீரகத் தூள்", "ജീരകപ്പൊടി", "spices", "vegan", [375, 17.8, 44.2, 10.5, 22.3], 600, { u: { tsp: 2, tbsp: 6 } }),
  defineIngredient("mustard_seeds", "Mustard seeds", "கடுகு", "കടുക്", "spices", "vegan", [508, 26.1, 28.1, 12.2, 36.2], 150, { allergens: ["mustard"], u: { tsp: 3.5, tbsp: 10.5 } }),
  defineIngredient("fenugreek_seeds", "Fenugreek seeds", "வெந்தயம்", "ഉലുവ", "spices", "vegan", [323, 23.0, 58.4, 24.6, 6.4], 150, { u: { tsp: 3.7, tbsp: 11 } }),
  defineIngredient("fennel_seeds", "Fennel seeds", "பெருஞ்சீரகம்", "പെരുംജീരകം", "spices", "vegan", [345, 15.8, 52.3, 39.8, 14.9], 300, { u: { tsp: 2, tbsp: 6 } }),
  defineIngredient("black_pepper", "Black pepper", "மிளகு", "കുരുമുളക്", "spices", "vegan", [251, 10.4, 64.0, 25.3, 3.3], 800, { u: { tsp: 2.3, tbsp: 6.9 } }),
  defineIngredient("garam_masala", "Garam masala", "கரம் மசாலா", "ഗരം മസാല", "spices", "vegan", [380, 13.0, 50.0, 25.0, 15.0], 800, { u: { tsp: 2, tbsp: 6 }, src: "estimate" }),
  defineIngredient("tandoori_masala", "Tandoori masala", "தந்தூரி மசாலா", "തന്തൂരി മസാല", "spices", "vegan", [300, 12.0, 50.0, 22.0, 8.0], 700, { u: { tsp: 2.5, tbsp: 7.5 }, src: "estimate" }),
  defineIngredient("sambar_powder", "Sambar powder", "சாம்பார் பொடி", "സാമ്പാർ പൊടി", "spices", "vegan", [330, 14.0, 52.0, 20.0, 10.0], 400, { u: { tsp: 2.5, tbsp: 7.5 }, src: "estimate" }),
  defineIngredient("rasam_powder", "Rasam powder", "ரசப் பொடி", "രസം പൊടി", "spices", "vegan", [320, 14.0, 52.0, 22.0, 9.0], 400, { u: { tsp: 2.5, tbsp: 7.5 }, src: "estimate" }),
  defineIngredient("meat_masala", "Meat / chicken masala", "கறி மசாலா", "മീറ്റ് മസാല", "spices", "vegan", [330, 12.0, 50.0, 22.0, 12.0], 600, { u: { tsp: 2.5, tbsp: 7.5 }, src: "estimate" }),
  defineIngredient("fish_masala", "Fish masala", "மீன் மசாலா", "ഫിഷ് മസാല", "spices", "vegan", [320, 12.0, 50.0, 22.0, 10.0], 600, { u: { tsp: 2.5, tbsp: 7.5 }, src: "estimate" }),
  defineIngredient("chaat_masala", "Chaat masala", "சாட் மசாலா", "ചാട്ട് മസാല", "spices", "vegan", [250, 10.0, 50.0, 15.0, 5.0], 500, { u: { tsp: 2.5 }, src: "estimate" }),
  defineIngredient("kasuri_methi", "Kasuri methi (dried fenugreek leaves)", "கசூரி மேத்தி", "കസൂരി മേത്തി", "spices", "vegan", [300, 22.0, 52.0, 25.0, 6.0], 800, { u: { tsp: 0.7, tbsp: 2 }, src: "estimate" }),
  defineIngredient("cardamom", "Green cardamom", "ஏலக்காய்", "ഏലയ്ക്ക", "spices", "vegan", [311, 10.8, 68.5, 28.0, 6.7], 3000, { u: { piece: 0.3, pieceLabel: "pod", tsp: 2 } }),
  defineIngredient("cloves", "Cloves", "கிராம்பு", "ഗ്രാമ്പൂ", "spices", "vegan", [274, 6.0, 65.5, 33.9, 13.0], 1500, { u: { piece: 0.1, pieceLabel: "clove", tsp: 2.1 } }),
  defineIngredient("cinnamon", "Cinnamon", "பட்டை", "കറുവപ്പട്ട", "spices", "vegan", [247, 4.0, 80.6, 53.1, 1.2], 600, { u: { piece: 1, pieceLabel: "1-inch stick", tsp: 2.6 } }),
  defineIngredient("bay_leaf", "Bay leaf", "பிரிஞ்சி இலை", "വഴനയില", "spices", "vegan", [313, 7.6, 75.0, 26.3, 8.4], 500, { u: { piece: 0.2, pieceLabel: "bay leaf" } }),
  defineIngredient("star_anise", "Star anise", "அன்னாசிப்பூ", "തക്കോലം", "spices", "vegan", [337, 17.6, 50.0, 14.6, 15.9], 1200, { u: { piece: 0.5, pieceLabel: "star anise" } }),
  defineIngredient("hing", "Asafoetida (hing, compounded)", "பெருங்காயம்", "കായം", "spices", "vegan", [297, 4.0, 68.0, 4.0, 1.1], 2000, { allergens: ["gluten"], u: { tsp: 2.5 }, hidden: "Most compounded hing is mixed with wheat flour (gluten).", src: "estimate" }),
  defineIngredient("tamarind", "Tamarind pulp", "புளி", "പുളി", "condiments", "vegan", [239, 2.8, 62.5, 5.1, 0.6], 200, { u: { tsp: 6, tbsp: 18, piece: 10, pieceLabel: "lemon-sized ball" }, hidden: "Tamarind is sweet-sour fruit pulp — about 57 g net carbs per 100 g, so keep amounts small on keto." }),

  // ── Condiments & sauces ─────────────────────────────────────────────────
  defineIngredient("soy_sauce", "Soy sauce", "சோயா சாஸ்", "സോയ സോസ്", "condiments", "vegan", [53, 8.1, 4.9, 0.8, 0.6], 300, { allergens: ["soy", "gluten"], density: 1.15, shop: ["ml", 200] }),
  defineIngredient("vinegar", "Vinegar", "வினிகர்", "വിനാഗിരി", "condiments", "vegan", [18, 0, 0.1, 0, 0], 100, { density: 1.0, shop: ["ml", 500], allergens: ["sulphites"] }),
  defineIngredient("ketchup", "Tomato ketchup", "தக்காளி சாஸ்", "ടൊമാറ്റോ കെച്ചപ്പ്", "condiments", "vegan", [101, 1.0, 27.4, 0.3, 0.1], 150, { hidden: "Ketchup is about a quarter sugar.", shop: ["g", 500] }),
  defineIngredient("mayonnaise", "Mayonnaise", "மயோனைஸ்", "മയോണൈസ്", "condiments", "egg", [680, 1.0, 0.6, 0, 75.0], 400, { allergens: ["egg"], u: { tsp: 4.6, tbsp: 14 }, shop: ["g", 250] }),
  defineIngredient("mustard_sauce", "Mustard sauce (Dijon-style)", "கடுகு சாஸ்", "മസ്റ്റാർഡ് സോസ്", "condiments", "vegan", [66, 4.4, 5.8, 3.3, 4.0], 800, { allergens: ["mustard"], shop: ["g", 200] }),

  // ── Sweeteners & baking ─────────────────────────────────────────────────
  defineIngredient("sugar", "Sugar", "சர்க்கரை", "പഞ്ചസാര", "sweeteners", "vegan", [387, 0, 100, 0, 0], 45, { u: { tsp: 4.2, tbsp: 12.5 } }),
  defineIngredient("jaggery", "Jaggery", "வெல்லம்", "ശർക്കര", "sweeteners", "vegan", [383, 0.4, 98.0, 0, 0.1], 80, { u: { tsp: 5, tbsp: 15 }, hidden: "Jaggery is sugar — nutritionally very close to white sugar.", src: "ifct" }),
  defineIngredient("honey", "Honey", "தேன்", "തേൻ", "sweeteners", "vegetarian", [304, 0.3, 82.4, 0.2, 0], 450, { u: { tsp: 7, tbsp: 21 }, hidden: "Honey is sugar.", shop: ["g", 250] }),
  defineIngredient("stevia", "Stevia (pure extract)", "ஸ்டீவியா", "സ്റ്റീവിയ", "sweeteners", "vegan", [0, 0, 0, 0, 0], 4000, { u: { tsp: 0.5 }, src: "label", shop: ["g", 25] }),
  defineIngredient("erythritol", "Erythritol", "எரித்ரிட்டால்", "എറിത്രിറ്റോൾ", "sweeteners", "vegan", [0, 0, 100, 0, 0], 900, { sa: 100, u: { tsp: 4, tbsp: 12 }, src: "label", shop: ["g", 250] }),
  defineIngredient("dark_chocolate", "Dark chocolate (70–85%)", "டார்க் சாக்லேட்", "ഡാർക്ക് ചോക്ലേറ്റ്", "sweeteners", "vegan", [598, 7.8, 45.9, 10.9, 42.6], 1500, { allergens: ["milk", "soy"], u: { piece: 10, pieceLabel: "square" }, shop: ["g", 100], hidden: "Even dark chocolate has sugar — about 24 g net carbs per 100 g at 70%." }),
  defineIngredient("cocoa_powder", "Cocoa powder (unsweetened)", "கோகோ பவுடர்", "കൊക്കോ പൗഡർ", "sweeteners", "vegan", [228, 19.6, 57.9, 37.0, 13.7], 1200, { u: { tsp: 2.5, tbsp: 5.4 }, shop: ["g", 100] }),
  defineIngredient("vanilla_extract", "Vanilla extract", "வெனிலா எசென்ஸ்", "വാനില എസ്സൻസ്", "sweeteners", "vegan", [288, 0.1, 12.7, 0, 0.1], 3000, { u: { tsp: 4.2 }, shop: ["ml", 20], density: 0.88 }),
  defineIngredient("baking_powder", "Baking powder", "பேக்கிங் பவுடர்", "ബേക്കിംഗ് പൗഡർ", "sweeteners", "vegan", [53, 0, 27.7, 0.2, 0], 400, { u: { tsp: 4.6 }, shop: ["g", 100] }),
  defineIngredient("baking_soda", "Baking soda", "சமையல் சோடா", "അപ്പക്കാരം", "spices", "vegan", [0, 0, 0, 0, 0], 150, { u: { tsp: 4.6 } }),
  defineIngredient("agar_agar", "Agar-agar (china grass)", "கடல்பாசி", "ചൈന ഗ്രാസ്", "sweeteners", "vegan", [306, 6.2, 80.9, 7.7, 0.3], 2500, { u: { tsp: 2, tbsp: 6 }, shop: ["g", 25] }),

  // ── Water ───────────────────────────────────────────────────────────────
  defineIngredient("water", "Water", "தண்ணீர்", "വെള്ളം", "water", "vegan", [0, 0, 0, 0, 0], 0, { density: 1.0, u: { tbsp: 15, cup: 240 } }),
];
