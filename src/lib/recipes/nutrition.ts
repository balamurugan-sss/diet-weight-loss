import type { DietClass, DietType, Ingredient, Nutrients, RecipeLine } from "./types";

export type NutrientIngredient = Pick<
  Ingredient,
  "kcal" | "proteinG" | "carbsG" | "fibreG" | "fatG" | "sugarAlcoholG"
>;

export const ZERO: Nutrients = { kcal: 0, proteinG: 0, carbsG: 0, fibreG: 0, netCarbsG: 0, fatG: 0 };

/**
 * Net carbs = total carbohydrate − dietary fibre − sugar alcohols (e.g.
 * erythritol). Never negative. This is the definition used for every keto /
 * low-carb check in the app.
 */
export function netCarbs(carbsG: number, fibreG: number, sugarAlcoholG = 0) {
  return Math.max(0, carbsG - fibreG - sugarAlcoholG);
}

export function lineNutrients(ing: NutrientIngredient, grams: number): Nutrients {
  const f = grams / 100;
  const carbs = ing.carbsG * f;
  const fibre = ing.fibreG * f;
  return {
    kcal: ing.kcal * f,
    proteinG: ing.proteinG * f,
    carbsG: carbs,
    fibreG: fibre,
    netCarbsG: netCarbs(carbs, fibre, ing.sugarAlcoholG * f),
    fatG: ing.fatG * f,
  };
}

export function addNutrients(a: Nutrients, b: Nutrients): Nutrients {
  return {
    kcal: a.kcal + b.kcal,
    proteinG: a.proteinG + b.proteinG,
    carbsG: a.carbsG + b.carbsG,
    fibreG: a.fibreG + b.fibreG,
    netCarbsG: a.netCarbsG + b.netCarbsG,
    fatG: a.fatG + b.fatG,
  };
}

export function scaleNutrients(n: Nutrients, factor: number): Nutrients {
  return {
    kcal: n.kcal * factor,
    proteinG: n.proteinG * factor,
    carbsG: n.carbsG * factor,
    fibreG: n.fibreG * factor,
    netCarbsG: n.netCarbsG * factor,
    fatG: n.fatG * factor,
  };
}

export function roundNutrients(n: Nutrients): Nutrients {
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    kcal: Math.round(n.kcal),
    proteinG: r1(n.proteinG),
    carbsG: r1(n.carbsG),
    fibreG: r1(n.fibreG),
    netCarbsG: r1(n.netCarbsG),
    fatG: r1(n.fatG),
  };
}

/** Totals for a whole recipe. Optional lines are excluded (they're extras). */
export function recipeTotals(
  lines: RecipeLine[],
  lookup: (id: string) => NutrientIngredient | undefined,
): Nutrients {
  return lines
    .filter((l) => !l.optional)
    .reduce((acc, l) => {
      const ing = lookup(l.ingredientId);
      if (!ing) throw new Error(`Unknown ingredient: ${l.ingredientId}`);
      return addNutrients(acc, lineNutrients(ing, l.grams));
    }, ZERO);
}

export function recipeCost(
  lines: RecipeLine[],
  lookup: (id: string) => Pick<Ingredient, "costPerKgInr"> | undefined,
) {
  return lines
    .filter((l) => !l.optional)
    .reduce((sum, l) => sum + ((lookup(l.ingredientId)?.costPerKgInr ?? 0) * l.grams) / 1000, 0);
}

const DIET_RANK: Record<DietClass, number> = { vegan: 0, vegetarian: 1, egg: 2, nonveg: 3 };
const DIET_TYPE: Record<DietClass, DietType> = {
  vegan: "vegan",
  vegetarian: "vegetarian",
  egg: "eggitarian",
  nonveg: "non_vegetarian",
};

export function deriveDietType(classes: DietClass[]): DietType {
  const worst = classes.reduce<DietClass>(
    (w, c) => (DIET_RANK[c] > DIET_RANK[w] ? c : w),
    "vegan",
  );
  return DIET_TYPE[worst];
}

/** Which diet preferences may eat a recipe of the given diet type. */
export function dietAllows(pref: DietType, recipe: DietType) {
  const order: DietType[] = ["vegan", "vegetarian", "eggitarian", "non_vegetarian"];
  if (pref === "vegan") return recipe === "vegan";
  if (pref === "vegetarian") return recipe === "vegan" || recipe === "vegetarian";
  return order.indexOf(recipe) <= order.indexOf(pref);
}

// ─── Classification ─────────────────────────────────────────────────────────

/** A keto meal must fit within a 20–50 g/day net-carb budget across 3+ meals. */
export const KETO_MAX_NET_CARBS_PER_SERVING = 10;
export const KETO_MAX_NET_CARB_ENERGY = 0.12;
export const LOW_CARB_MAX_NET_CARBS_PER_SERVING = 20;
export const LOW_CARB_MAX_NET_CARB_ENERGY = 0.26;
export const HIGH_PROTEIN_MIN_G = 15;
export const HIGH_PROTEIN_MIN_ENERGY = 0.25;

export type Classification = {
  isKeto: boolean;
  isLowCarb: boolean;
  isHighProtein: boolean;
  reasons: string[];
};

/**
 * Classifies a single serving purely from computed nutrients — never from the
 * presence of "keto-sounding" ingredients like paneer, eggs or coconut.
 */
export function classifyServing(n: Nutrients): Classification {
  const kcal = Math.max(n.kcal, 1);
  const netEnergy = (n.netCarbsG * 4) / kcal;
  const proteinEnergy = (n.proteinG * 4) / kcal;
  const reasons: string[] = [];

  const isKeto = n.netCarbsG <= KETO_MAX_NET_CARBS_PER_SERVING && netEnergy <= KETO_MAX_NET_CARB_ENERGY;
  if (!isKeto)
    reasons.push(
      n.netCarbsG > KETO_MAX_NET_CARBS_PER_SERVING
        ? `Not keto: ${n.netCarbsG.toFixed(1)} g net carbs per serving (limit ${KETO_MAX_NET_CARBS_PER_SERVING} g).`
        : `Not keto: ${(netEnergy * 100).toFixed(0)}% of energy from net carbs (limit ${KETO_MAX_NET_CARB_ENERGY * 100}%).`,
    );
  const isLowCarb =
    n.netCarbsG <= LOW_CARB_MAX_NET_CARBS_PER_SERVING && netEnergy <= LOW_CARB_MAX_NET_CARB_ENERGY;
  const isHighProtein = n.proteinG >= HIGH_PROTEIN_MIN_G && proteinEnergy >= HIGH_PROTEIN_MIN_ENERGY;
  return { isKeto, isLowCarb, isHighProtein, reasons };
}

/** Atwater check used to catch data-entry errors in ingredient tables. */
export function atwaterKcal(n: Pick<Ingredient, "proteinG" | "carbsG" | "fibreG" | "fatG" | "sugarAlcoholG">) {
  return 4 * n.proteinG + 4 * netCarbs(n.carbsG, n.fibreG, n.sugarAlcoholG) + 2 * n.fibreG + 9 * n.fatG;
}
