import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { INGREDIENTS } from "../../content/ingredients";
import { atwaterKcal } from "@/lib/recipes/nutrition";
import {
  compileRecipe,
  findDuplicates,
  SourceFile,
  type CompiledRecipe,
} from "@/lib/recipes/source";
import type { Ingredient } from "@/lib/recipes/types";

export type LoadedBatch = { file: string; batch: string; source: string; author?: string; license?: string };
export type CatalogueReport = {
  ingredients: Ingredient[];
  recipes: (CompiledRecipe & { batch: LoadedBatch })[];
  errors: { file: string; id: string; errors: string[] }[];
  duplicates: { a: string; b: string; reason: string }[];
  ingredientIssues: string[];
};

// Reference tables use food-specific energy factors (cocoa, seed spices) or
// count non-macronutrient energy (alcohol in vanilla extract), so the generic
// Atwater cross-check doesn't apply to these.
const ATWATER_EXEMPT = new Set(["coriander_powder", "coriander_seeds", "cloves", "cocoa_powder", "vanilla_extract", "baking_powder"]);

export function checkIngredients(list: Ingredient[]) {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const ing of list) {
    if (seen.has(ing.id)) issues.push(`duplicate ingredient id ${ing.id}`);
    seen.add(ing.id);
    if (ing.fibreG > ing.carbsG) issues.push(`${ing.id}: fibre exceeds total carbs`);
    if (ATWATER_EXEMPT.has(ing.id)) continue;
    const atw = atwaterKcal(ing);
    if (Math.abs(atw - ing.kcal) > Math.max(25, ing.kcal * 0.15))
      issues.push(`${ing.id}: kcal ${ing.kcal} vs Atwater estimate ${Math.round(atw)}`);
  }
  return issues;
}

/** Core ingredient table plus any batch-contributed extras in content/ingredients-extra/. */
export async function loadIngredients(): Promise<Ingredient[]> {
  const dir = "content/ingredients-extra";
  const all = [...INGREDIENTS];
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".ts")).sort()) {
    const mod = (await import(path.resolve(dir, f))) as { EXTRA_INGREDIENTS?: Ingredient[] };
    all.push(...(mod.EXTRA_INGREDIENTS ?? []));
  }
  return all;
}

export async function loadCatalogue(dir = "content/recipes"): Promise<CatalogueReport> {
  const ingredients = await loadIngredients();
  const ingredientMap = new Map(ingredients.map((i) => [i.id, i]));
  const report: CatalogueReport = {
    ingredients,
    recipes: [],
    errors: [],
    duplicates: [],
    ingredientIssues: checkIngredients(ingredients),
  };
  const ids = new Map<string, string>();
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  for (const f of files) {
    const file = path.join(dir, f);
    let json: unknown;
    try {
      json = JSON.parse(readFileSync(file, "utf8"));
    } catch (e) {
      report.errors.push({ file, id: "(file)", errors: [`invalid JSON: ${(e as Error).message}`] });
      continue;
    }
    const meta = SourceFile.safeParse(json);
    if (!meta.success) {
      report.errors.push({ file, id: "(file)", errors: meta.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) });
      continue;
    }
    const batch: LoadedBatch = { file, batch: meta.data.batch, source: meta.data.source, author: meta.data.author, license: meta.data.license };
    for (const raw of meta.data.recipes) {
      const res = compileRecipe(raw, ingredientMap);
      if (!res.ok) {
        report.errors.push({ file, id: res.id, errors: res.errors });
        continue;
      }
      const prev = ids.get(res.recipe.id);
      if (prev) {
        report.errors.push({ file, id: res.recipe.id, errors: [`duplicate id (also in ${prev})`] });
        continue;
      }
      ids.set(res.recipe.id, file);
      report.recipes.push({ ...res.recipe, batch });
    }
  }
  report.duplicates = findDuplicates(report.recipes);
  return report;
}
