export type DietClass = "vegan" | "vegetarian" | "egg" | "nonveg";
export type DietType = "vegan" | "vegetarian" | "eggitarian" | "non_vegetarian";

export const INGREDIENT_CATEGORIES = [
  "vegetables",
  "herbs",
  "fruits",
  "meat",
  "seafood",
  "eggs",
  "dairy",
  "grains",
  "pulses",
  "nuts_seeds",
  "oils",
  "spices",
  "condiments",
  "sweeteners",
  "water",
] as const;
export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

export const ALLERGENS = [
  "milk",
  "egg",
  "fish",
  "shellfish",
  "peanut",
  "tree_nuts",
  "soy",
  "gluten",
  "sesame",
  "mustard",
  "coconut",
  "sulphites",
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const AVOID_TAGS = ["beef", "mutton", "seafood", "onion_garlic", "mushroom"] as const;
export type AvoidTag = (typeof AVOID_TAGS)[number];

export type UnitWeights = {
  tsp?: number;
  tbsp?: number;
  cup?: number;
  piece?: number;
  pieceLabel?: string;
};

export type Ingredient = {
  id: string;
  name: string;
  nameTa: string | null;
  nameMl: string | null;
  category: IngredientCategory;
  dietClass: DietClass;
  avoidTags: string[];
  kcal: number;
  proteinG: number;
  carbsG: number;
  fibreG: number;
  fatG: number;
  sugarAlcoholG: number;
  allergens: string[];
  hiddenCarbNote: string | null;
  costPerKgInr: number;
  unitWeights: UnitWeights;
  shopUnit: "g" | "ml" | "piece";
  shopPack: number | null;
  densityGPerMl: number | null;
  pantryStaple: boolean;
  nutritionSource: string;
  validationStatus: "verified" | "reference_estimate" | "unverified";
};

export type RecipeLine = {
  ingredientId: string;
  grams: number;
  measureText?: string | null;
  prepNote?: string | null;
  optional?: boolean;
  toTaste?: boolean;
  groupName?: string | null;
};

export type Nutrients = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fibreG: number;
  netCarbsG: number;
  fatG: number;
};

/**
 * How a recipe fits into a meal. Indian meals are usually combinations — a
 * base (rice, roti, idli, cauliflower rice), a main (sambar, curry) and a
 * side (poriyal, thoran) — so the planner composes meals from these parts.
 */
export const COURSES = ["complete", "main", "side", "base", "accompaniment", "snack", "dessert", "drink"] as const;
export type Course = (typeof COURSES)[number];

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "dessert"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const CUISINES = [
  "tamil_nadu",
  "kerala",
  "andhra",
  "telangana",
  "karnataka",
  "north_indian",
  "west_indian",
  "east_indian",
  "pan_indian",
  "south_asian",
  "indo_chinese",
  "mediterranean",
  "continental",
  "east_asian",
  "middle_eastern",
  "mexican",
] as const;
export type Cuisine = (typeof CUISINES)[number];

export const SOUTH_INDIAN: Cuisine[] = ["tamil_nadu", "kerala", "andhra", "telangana", "karnataka"];
export const INDIAN: Cuisine[] = [
  ...SOUTH_INDIAN,
  "north_indian",
  "west_indian",
  "east_indian",
  "pan_indian",
  "south_asian",
  "indo_chinese",
];

export const EQUIPMENT = [
  "stove",
  "kadai",
  "tawa",
  "saucepan",
  "mixing_bowl",
  "knife_board",
  "pressure_cooker",
  "mixer_grinder",
  "blender",
  "non_stick_pan",
  "oven",
  "air_fryer",
  "microwave",
  "steamer",
  "idli_stand",
  "grill",
  "skewers",
  "baking_tray",
  "whisk",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

/** Most Indian kitchens have these; planners never exclude a recipe for them. */
export const BASIC_EQUIPMENT: Equipment[] = [
  "stove",
  "kadai",
  "tawa",
  "saucepan",
  "mixing_bowl",
  "knife_board",
  "whisk",
];

export const STEP_KINDS = ["prep", "cook", "rest", "assemble", "serve"] as const;
export type StepKind = (typeof STEP_KINDS)[number];

export type RecipeStep = {
  stepIndex: number;
  title: string;
  text: string;
  kind: StepKind;
  timerSec: number | null;
  tempC: number | null;
  heat: "low" | "medium" | "high" | null;
  uses: string[];
  visual: string;
  equipment: string[];
};

/** Editorial tags authored by people; nutrition-derived tags are computed. */
export const EDITORIAL_TAGS = ["family", "meal_prep", "festive", "kid_friendly", "one_pot", "no_cook"] as const;
