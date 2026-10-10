import "server-only";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { aggregateShopping, type ShopRecipe } from "@/lib/shopping/aggregate";
import { db, schema } from "@/server/db/client";
import type { Plan } from "./plans";

export async function shoppingForWeek(plan: Plan, weekIndex: number, householdSize: number) {
  const from = weekIndex * 7;
  const to = Math.min(plan.days - 1, from + 6);
  const items = await db
    .select()
    .from(schema.mealPlanItems)
    .where(and(eq(schema.mealPlanItems.planId, plan.id), gte(schema.mealPlanItems.dayIndex, from), lte(schema.mealPlanItems.dayIndex, to)));
  const recipeIds = [...new Set(items.map((i) => i.recipeId))];
  if (!recipeIds.length) return { rows: [], state: new Map(), recipeCount: 0 };
  const [recipeRows, lines] = await Promise.all([
    db.select({ id: schema.recipes.id, title: schema.recipes.title, servings: schema.recipes.servings }).from(schema.recipes).where(inArray(schema.recipes.id, recipeIds)),
    db.select().from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, recipeIds)),
  ]);
  const recipes = new Map<string, ShopRecipe>(
    recipeRows.map((r) => [r.id, { title: r.title, servings: r.servings, lines: lines.filter((l) => l.recipeId === r.id).map((l) => ({ ingredientId: l.ingredientId, grams: l.grams, optional: l.optional })) }]),
  );
  const ingIds = [...new Set([...lines.map((l) => l.ingredientId), ...items.flatMap((i) => i.swaps.map((s) => s.to))])];
  const ingredients = new Map((await db.select().from(schema.ingredients).where(inArray(schema.ingredients.id, ingIds))).map((i) => [i.id, i]));
  const rows = aggregateShopping(items, recipes, ingredients, householdSize);
  const state = new Map(
    (await db.select().from(schema.shoppingState).where(and(eq(schema.shoppingState.planId, plan.id), eq(schema.shoppingState.weekIndex, weekIndex)))).map((s) => [s.ingredientId, s]),
  );
  return { rows, state, recipeCount: recipeIds.length };
}
