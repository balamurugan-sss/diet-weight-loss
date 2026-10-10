import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  generateDay,
  generatePlan,
  buildContext,
  validateDay,
  type DayPlan,
  type DayReport,
  type PlannedMeal,
  type PlannerProfile,
  type PlannerRecipe,
} from "@/lib/planner/engine";
import { lineNutrients, roundNutrients, scaleNutrients, addNutrients, ZERO } from "@/lib/recipes/nutrition";
import type { Nutrients } from "@/lib/recipes/types";
import type { CurrentUser, Profile } from "@/server/auth/dal";
import { db, schema, type DB } from "@/server/db/client";
import { addDaysISO, daysBetween, todayISO } from "@/server/time";
import { plannerProfile, plannerRecipes } from "./catalogue";
import { targetsForProfile } from "./targets";

type IngredientSwap = { from: string; to: string; ratio: number };
export type PlanItem = typeof schema.mealPlanItems.$inferSelect;
export type Plan = typeof schema.mealPlans.$inferSelect;

export async function plannerContextFor(profile: Profile) {
  const targets = targetsForProfile(profile);
  if (!targets) throw new Error("Profile incomplete");
  // Thumbs-down recipes from the meal-plan feedback sheet stay out of new plans and swaps.
  const [all, disliked] = await Promise.all([
    plannerRecipes(),
    db
      .select({ id: schema.recipeFeedback.recipeId })
      .from(schema.recipeFeedback)
      .where(and(eq(schema.recipeFeedback.userId, profile.userId), eq(schema.recipeFeedback.liked, false))),
  ]);
  const skip = new Set(disliked.map((d) => d.id));
  return { targets, pp: plannerProfile(profile, targets), recipes: skip.size ? all.filter((r) => !skip.has(r.id)) : all };
}

function itemsFromDays(planId: string, days: DayPlan[]) {
  return days.flatMap((d) =>
    d.meals.flatMap((m) =>
      m.components.map((c, position) => ({
        id: randomUUID(),
        planId,
        dayIndex: d.dayIndex,
        slot: m.slot,
        position,
        recipeId: c.recipeId,
        portion: c.portion,
        swaps: [] as IngredientSwap[],
      })),
    ),
  );
}

async function insertItems(tx: Pick<DB, "insert">, items: ReturnType<typeof itemsFromDays>) {
  for (let i = 0; i < items.length; i += 200) await tx.insert(schema.mealPlanItems).values(items.slice(i, i + 200));
}

export async function createPlan(user: CurrentUser, profile: Profile, days: number) {
  const { targets, pp, recipes } = await plannerContextFor(profile);
  const seed = Math.floor(Math.random() * 2 ** 31);
  const { days: plan } = generatePlan(recipes, pp, days, seed);
  const id = randomUUID();
  const start = todayISO();
  await db.transaction(async (tx) => {
    await tx.update(schema.mealPlans).set({ status: "archived" }).where(and(eq(schema.mealPlans.userId, user.id), eq(schema.mealPlans.status, "active")));
    await tx.insert(schema.mealPlans).values({
      id,
      userId: user.id,
      name: `${days}-day ${targets.style.replace("_", "-")} plan`,
      days,
      startDate: start,
      planStyle: targets.style,
      targets: {
        kcal: targets.kcal,
        kcalMin: targets.kcalMin,
        kcalMax: targets.kcalMax,
        proteinG: targets.proteinG,
        carbsG: targets.carbsG,
        netCarbLimitG: targets.netCarbLimitG,
        fatG: targets.fatG,
        fibreG: targets.fibreG,
      },
      status: "active",
      seed,
    });
    await insertItems(tx, itemsFromDays(id, plan));
  });
  return id;
}

export async function getActivePlan(userId: string) {
  const [plan] = await db
    .select()
    .from(schema.mealPlans)
    .where(and(eq(schema.mealPlans.userId, userId), eq(schema.mealPlans.status, "active")))
    .orderBy(desc(schema.mealPlans.createdAt))
    .limit(1);
  return plan ?? null;
}

export async function getOwnedPlan(userId: string, planId: string) {
  const [plan] = await db
    .select()
    .from(schema.mealPlans)
    .where(and(eq(schema.mealPlans.id, planId), eq(schema.mealPlans.userId, userId)))
    .limit(1);
  return plan ?? null;
}

export async function planItems(planId: string, dayIndex?: number) {
  return db
    .select()
    .from(schema.mealPlanItems)
    .where(dayIndex === undefined ? eq(schema.mealPlanItems.planId, planId) : and(eq(schema.mealPlanItems.planId, planId), eq(schema.mealPlanItems.dayIndex, dayIndex)))
    .orderBy(asc(schema.mealPlanItems.dayIndex), asc(schema.mealPlanItems.position));
}

/** Which day of the plan is "today" (clamped to the plan length). */
export function currentDayIndex(plan: Plan) {
  return Math.min(plan.days - 1, Math.max(0, daysBetween(plan.startDate, todayISO())));
}

export function planDate(plan: Plan, dayIndex: number) {
  return addDaysISO(plan.startDate, dayIndex);
}

// ─── Nutrition with ingredient swaps ────────────────────────────────────────

async function swapAdjustedPerServing(recipeId: string, swaps: IngredientSwap[]): Promise<Nutrients | null> {
  if (!swaps.length) return null;
  const [recipe] = await db.select({ servings: schema.recipes.servings }).from(schema.recipes).where(eq(schema.recipes.id, recipeId));
  const lines = await db.select().from(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, recipeId));
  const ids = [...new Set([...lines.map((l) => l.ingredientId), ...swaps.map((s) => s.to)])];
  const ings = new Map((await db.select().from(schema.ingredients).where(inArray(schema.ingredients.id, ids))).map((i) => [i.id, i]));
  let total = ZERO;
  for (const l of lines) {
    if (l.optional) continue;
    const swap = swaps.find((s) => s.from === l.ingredientId);
    const ing = ings.get(swap ? swap.to : l.ingredientId);
    if (ing) total = addNutrients(total, lineNutrients(ing, l.grams * (swap ? swap.ratio : 1)));
  }
  return roundNutrients(scaleNutrients(total, 1 / recipe.servings));
}

export type EnrichedItem = PlanItem & { recipe: PlannerRecipe; nutrients: Nutrients & { costInr: number } };

export async function enrichItems(items: PlanItem[]): Promise<EnrichedItem[]> {
  const recipes = new Map((await plannerRecipes()).map((r) => [r.id, r]));
  const out: EnrichedItem[] = [];
  for (const it of items) {
    const recipe = recipes.get(it.recipeId);
    if (!recipe) continue;
    const adjusted = await swapAdjustedPerServing(it.recipeId, it.swaps);
    const per = adjusted ?? recipe;
    out.push({
      ...it,
      recipe,
      nutrients: {
        kcal: per.kcal * it.portion,
        proteinG: per.proteinG * it.portion,
        carbsG: per.carbsG * it.portion,
        fibreG: per.fibreG * it.portion,
        netCarbsG: per.netCarbsG * it.portion,
        fatG: per.fatG * it.portion,
        costInr: recipe.costPerServingInr * it.portion,
      },
    });
  }
  return out;
}

export function groupBySlot(items: EnrichedItem[], slots: string[]) {
  const order = (s: string) => {
    const i = slots.indexOf(s);
    return i === -1 ? 99 : i;
  };
  const map = new Map<string, EnrichedItem[]>();
  for (const it of items) map.set(it.slot, [...(map.get(it.slot) ?? []), it]);
  return [...map.entries()].sort((a, b) => order(a[0]) - order(b[0])).map(([slot, items]) => ({ slot, items }));
}

/** Validates a stored day, using swap-adjusted nutrition. */
export function reportForItems(items: EnrichedItem[], pp: PlannerProfile): DayReport {
  const virtual = new Map<string, PlannerRecipe>();
  const day: DayPlan = { dayIndex: items[0]?.dayIndex ?? 0, meals: [] };
  for (const it of items) {
    const key = `${it.id}`;
    virtual.set(key, {
      ...it.recipe,
      id: key,
      kcal: it.nutrients.kcal / it.portion,
      proteinG: it.nutrients.proteinG / it.portion,
      carbsG: it.nutrients.carbsG / it.portion,
      fibreG: it.nutrients.fibreG / it.portion,
      netCarbsG: it.nutrients.netCarbsG / it.portion,
      fatG: it.nutrients.fatG / it.portion,
    });
    let meal = day.meals.find((m) => m.slot === it.slot);
    if (!meal) day.meals.push((meal = { slot: it.slot, components: [] }));
    meal.components.push({ recipeId: key, portion: it.portion });
  }
  return validateDay(day, (id) => virtual.get(id), pp);
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function regenerateDay(plan: Plan, profile: Profile, dayIndex: number) {
  const { pp, recipes } = await plannerContextFor(profile);
  const all = await planItems(plan.id);
  const history = new Map<string, number>();
  for (const it of all) if (it.dayIndex !== dayIndex && Math.abs(it.dayIndex - dayIndex) <= 3) history.set(it.recipeId, it.dayIndex < dayIndex ? it.dayIndex : dayIndex - 1);
  // Also avoid what's there now, so the user actually gets something new.
  for (const it of all) if (it.dayIndex === dayIndex) history.set(it.recipeId, dayIndex);
  const ctx = buildContext(recipes, pp, Math.floor(Math.random() * 2 ** 31));
  const day = generateDay(dayIndex, ctx, history);
  await db.transaction(async (tx) => {
    await tx.delete(schema.mealPlanItems).where(and(eq(schema.mealPlanItems.planId, plan.id), eq(schema.mealPlanItems.dayIndex, dayIndex)));
    await insertItems(tx, itemsFromDays(plan.id, [day]));
  });
}

export async function replaceSlot(plan: Plan, dayIndex: number, slot: string, meal: PlannedMeal) {
  await db.transaction(async (tx) => {
    await tx
      .delete(schema.mealPlanItems)
      .where(and(eq(schema.mealPlanItems.planId, plan.id), eq(schema.mealPlanItems.dayIndex, dayIndex), eq(schema.mealPlanItems.slot, slot)));
    await insertItems(tx, itemsFromDays(plan.id, [{ dayIndex, meals: [{ ...meal, slot }] }]));
  });
}

export async function ownedItem(userId: string, itemId: string) {
  const [row] = await db
    .select({ item: schema.mealPlanItems, plan: schema.mealPlans })
    .from(schema.mealPlanItems)
    .innerJoin(schema.mealPlans, eq(schema.mealPlans.id, schema.mealPlanItems.planId))
    .where(and(eq(schema.mealPlanItems.id, itemId), eq(schema.mealPlans.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function logMeal(userId: string, item: EnrichedItem, date: string) {
  const n = item.nutrients;
  await db.insert(schema.mealLogs).values({
    id: randomUUID(),
    userId,
    date,
    slot: item.slot,
    recipeId: item.recipeId,
    planItemId: item.id,
    title: item.recipe.title,
    portion: item.portion,
    kcal: n.kcal,
    proteinG: n.proteinG,
    carbsG: n.carbsG,
    netCarbsG: n.netCarbsG,
    fatG: n.fatG,
    fibreG: n.fibreG,
  });
  await db.update(schema.mealPlanItems).set({ completedAt: new Date() }).where(eq(schema.mealPlanItems.id, item.id));
}

export async function unlogMeal(userId: string, itemId: string) {
  await db.delete(schema.mealLogs).where(and(eq(schema.mealLogs.userId, userId), eq(schema.mealLogs.planItemId, itemId)));
  await db.update(schema.mealPlanItems).set({ completedAt: null }).where(eq(schema.mealPlanItems.id, itemId));
}

export async function savedPlans(userId: string) {
  return db
    .select()
    .from(schema.mealPlans)
    .where(eq(schema.mealPlans.userId, userId))
    .orderBy(desc(schema.mealPlans.isFavourite), desc(schema.mealPlans.createdAt))
    .limit(30);
}

export async function activatePlan(userId: string, planId: string) {
  await db.transaction(async (tx) => {
    await tx.update(schema.mealPlans).set({ status: "archived" }).where(and(eq(schema.mealPlans.userId, userId), eq(schema.mealPlans.status, "active")));
    await tx
      .update(schema.mealPlans)
      .set({ status: "active", startDate: todayISO() })
      .where(and(eq(schema.mealPlans.id, planId), eq(schema.mealPlans.userId, userId)));
    await tx.update(schema.mealPlanItems).set({ completedAt: null }).where(eq(schema.mealPlanItems.planId, planId));
  });
}
