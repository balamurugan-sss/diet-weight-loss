import { friendlyNumber } from "@/lib/recipes/measures";
import type { Ingredient } from "@/lib/recipes/types";

export type ShopSection = "vegetables" | "fruits" | "meat" | "seafood" | "dairy" | "pantry" | "spices";
export const SECTION_ORDER: ShopSection[] = ["vegetables", "fruits", "meat", "seafood", "dairy", "pantry", "spices"];

const SECTION: Record<string, ShopSection> = {
  vegetables: "vegetables",
  herbs: "vegetables",
  fruits: "fruits",
  meat: "meat",
  seafood: "seafood",
  dairy: "dairy",
  eggs: "dairy",
  grains: "pantry",
  pulses: "pantry",
  nuts_seeds: "pantry",
  oils: "pantry",
  condiments: "pantry",
  sweeteners: "pantry",
  spices: "spices",
};

export type ShopItemInput = { recipeId: string; portion: number; swaps: { from: string; to: string; ratio: number }[] };
export type ShopRecipe = {
  title: string;
  servings: number;
  lines: { ingredientId: string; grams: number; optional: boolean }[];
};
export type ShopIngredient = Pick<
  Ingredient,
  "id" | "name" | "costPerKgInr" | "unitWeights" | "shopUnit" | "shopPack" | "densityGPerMl" | "pantryStaple" | "allergens" | "hiddenCarbNote"
> & { category: string };

export type ShopRow = {
  ingredientId: string;
  name: string;
  section: ShopSection;
  grams: number;
  quantity: string;
  buy: string | null;
  costInr: number;
  pantryStaple: boolean;
  allergens: string[];
  hiddenCarbNote: string | null;
  recipes: string[];
};

/**
 * Servings to buy for: the user's planned portion plus one standard serving
 * for each other person in the household.
 */
export function servingsToBuy(portion: number, householdSize: number) {
  return portion + Math.max(0, householdSize - 1);
}

function roundUp(x: number, step: number) {
  return Math.ceil(x / step - 1e-9) * step;
}

export function practicalQuantity(ing: ShopIngredient, grams: number): { quantity: string; buy: string | null } {
  const u = ing.unitWeights;
  if (ing.shopUnit === "piece" && u.piece) {
    const count = Math.max(1, Math.ceil(grams / u.piece - 0.05));
    const label = u.pieceLabel ?? "piece";
    const buy = ing.shopPack ? `${Math.ceil(count / ing.shopPack)} × pack of ${ing.shopPack}` : null;
    return { quantity: `${count} ${count === 1 ? label : label.replace(/^(\S+)/, "$1s").replace(/ss\b/, "s")}`, buy };
  }
  if (ing.shopUnit === "ml" || ing.densityGPerMl) {
    const ml = grams / (ing.densityGPerMl ?? 1);
    const shown = ml >= 1000 ? `${(roundUp(ml, 50) / 1000).toFixed(2).replace(/0$/, "")} L` : `${roundUp(ml, ml < 100 ? 10 : 50)} ml`;
    return { quantity: shown, buy: ing.shopPack ? `${Math.ceil(ml / ing.shopPack)} × ${ing.shopPack} ml` : null };
  }
  const step = grams < 50 ? 5 : grams < 500 ? 50 : 100;
  const g = roundUp(grams, step);
  const shown = g >= 1000 ? `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 1)} kg` : `${g} g`;
  const pieces = u.piece && (ing.category === "vegetables" || ing.category === "fruits") && grams / u.piece <= 30 ? ` (≈ ${friendlyNumber(grams / u.piece)} ${u.pieceLabel ?? "pc"})` : "";
  return { quantity: shown + pieces, buy: ing.shopPack ? `${Math.ceil(grams / ing.shopPack)} × ${ing.shopPack} g` : null };
}

export function aggregateShopping(
  items: ShopItemInput[],
  recipes: Map<string, ShopRecipe>,
  ingredients: Map<string, ShopIngredient>,
  householdSize: number,
): ShopRow[] {
  const totals = new Map<string, { grams: number; recipes: Set<string> }>();
  for (const item of items) {
    const r = recipes.get(item.recipeId);
    if (!r) continue;
    const factor = servingsToBuy(item.portion, householdSize) / r.servings;
    for (const line of r.lines) {
      if (line.optional || line.ingredientId === "water") continue;
      const swap = item.swaps.find((s) => s.from === line.ingredientId);
      const id = swap ? swap.to : line.ingredientId;
      const grams = line.grams * factor * (swap ? swap.ratio : 1);
      const t = totals.get(id) ?? { grams: 0, recipes: new Set<string>() };
      t.grams += grams;
      t.recipes.add(r.title);
      totals.set(id, t);
    }
  }
  const rows: ShopRow[] = [];
  for (const [id, t] of totals) {
    const ing = ingredients.get(id);
    if (!ing) continue;
    const { quantity, buy } = practicalQuantity(ing, t.grams);
    rows.push({
      ingredientId: id,
      name: ing.name,
      section: SECTION[ing.category] ?? "pantry",
      grams: Math.round(t.grams),
      quantity,
      buy,
      costInr: Math.round((t.grams * ing.costPerKgInr) / 1000),
      pantryStaple: ing.pantryStaple,
      allergens: ing.allergens,
      hiddenCarbNote: ing.hiddenCarbNote,
      recipes: [...t.recipes],
    });
  }
  return rows.sort((a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section) || b.grams - a.grams);
}
