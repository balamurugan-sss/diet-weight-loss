"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { alternativesForSlot, isEligible, sumComponents, type PlannedMeal } from "@/lib/planner/engine";
import { requireOnboarded } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import {
  activatePlan,
  createPlan,
  enrichItems,
  getOwnedPlan,
  logMeal,
  ownedItem,
  planDate,
  planItems,
  plannerContextFor,
  regenerateDay,
  replaceSlot,
  unlogMeal,
} from "@/server/services/plans";
import { consume, PLAN_DAYS } from "@/server/services/usage";

export type ActionResult = { ok: true } | { ok: false; error: string };
const LIMIT = { ok: false as const, error: "planner.limitReached" };

export async function createPlanAction(days: number): Promise<ActionResult> {
  const { user, profile } = await requireOnboarded();
  const allowed = PLAN_DAYS[user.isPremium ? "premium" : "free"];
  if (!allowed.includes(days)) return { ok: false, error: "planner.premiumDays" };
  if (!(await consume(user, "mealPlan"))) return LIMIT;
  await createPlan(user, profile, days);
  revalidatePath("/", "layout");
  redirect("/planner");
}

export async function regenerateDayAction(planId: string, dayIndex: number): Promise<ActionResult> {
  const { user, profile } = await requireOnboarded();
  const plan = await getOwnedPlan(user.id, planId);
  if (!plan || dayIndex < 0 || dayIndex >= plan.days) return { ok: false, error: "common.error" };
  if (!(await consume(user, "dayRegen"))) return LIMIT;
  await regenerateDay(plan, profile, dayIndex);
  revalidatePath("/planner");
  return { ok: true };
}

export type Alternative = {
  meal: PlannedMeal;
  titles: string[];
  kcal: number;
  proteinG: number;
  netCarbsG: number;
  costInr: number;
};

export async function getAlternativesAction(planId: string, dayIndex: number, slot: string): Promise<Alternative[]> {
  const { user, profile } = await requireOnboarded();
  const plan = await getOwnedPlan(user.id, planId);
  if (!plan) return [];
  const { pp, recipes } = await plannerContextFor(profile);
  const current = (await planItems(plan.id, dayIndex)).filter((i) => i.slot === slot).map((i) => i.recipeId);
  const byId = new Map(recipes.map((r) => [r.id, r]));
  return alternativesForSlot(recipes, pp, slot, current, Date.now() % 100000, 6).map((meal) => {
    const totals = sumComponents(meal.components, (id) => byId.get(id));
    return {
      meal,
      titles: meal.components.map((c) => byId.get(c.recipeId)!.title),
      kcal: Math.round(totals.kcal),
      proteinG: Math.round(totals.proteinG),
      netCarbsG: Math.round(totals.netCarbsG),
      costInr: Math.round(totals.costInr),
    };
  });
}

const MealSchema = z.object({
  slot: z.string(),
  components: z.array(z.object({ recipeId: z.string().max(80), portion: z.number().min(0.25).max(3) })).min(1).max(5),
});

export async function applyAlternativeAction(planId: string, dayIndex: number, slot: string, raw: unknown): Promise<ActionResult> {
  const { user, profile } = await requireOnboarded();
  const plan = await getOwnedPlan(user.id, planId);
  const parsed = MealSchema.safeParse(raw);
  if (!plan || !parsed.success || dayIndex < 0 || dayIndex >= plan.days) return { ok: false, error: "common.error" };
  const { pp, recipes } = await plannerContextFor(profile);
  const byId = new Map(recipes.map((r) => [r.id, r]));
  // Never trust the client: every component must still fit the user's constraints.
  if (!parsed.data.components.every((c) => byId.has(c.recipeId) && isEligible(byId.get(c.recipeId)!, pp)))
    return { ok: false, error: "common.error" };
  if (!(await consume(user, "swap"))) return LIMIT;
  await replaceSlot(plan, dayIndex, slot, parsed.data);
  revalidatePath("/planner");
  revalidatePath("/home");
  return { ok: true };
}

export async function setPortionAction(itemId: string, portion: number): Promise<ActionResult> {
  const { user } = await requireOnboarded();
  const row = await ownedItem(user.id, itemId);
  if (!row) return { ok: false, error: "common.error" };
  const p = Math.round(Math.min(3, Math.max(0.25, portion)) * 4) / 4;
  await db.update(schema.mealPlanItems).set({ portion: p }).where(eq(schema.mealPlanItems.id, itemId));
  revalidatePath("/planner");
  revalidatePath("/home");
  return { ok: true };
}

export async function swapIngredientAction(itemId: string, from: string, to: string | null): Promise<ActionResult> {
  const { user } = await requireOnboarded();
  const row = await ownedItem(user.id, itemId);
  if (!row) return { ok: false, error: "common.error" };
  let swaps = row.item.swaps.filter((s) => s.from !== from);
  if (to) {
    const [sub] = await db
      .select()
      .from(schema.recipeSubstitutions)
      .where(
        and(
          eq(schema.recipeSubstitutions.recipeId, row.item.recipeId),
          eq(schema.recipeSubstitutions.ingredientId, from),
          eq(schema.recipeSubstitutions.substituteId, to),
        ),
      )
      .limit(1);
    if (!sub) return { ok: false, error: "common.error" };
    swaps = [...swaps, { from, to, ratio: sub.ratio }];
  }
  await db.update(schema.mealPlanItems).set({ swaps }).where(eq(schema.mealPlanItems.id, itemId));
  revalidatePath("/planner");
  return { ok: true };
}

export async function toggleEatenAction(itemId: string): Promise<ActionResult> {
  const { user } = await requireOnboarded();
  const row = await ownedItem(user.id, itemId);
  if (!row) return { ok: false, error: "common.error" };
  if (row.item.completedAt) await unlogMeal(user.id, itemId);
  else {
    const [enriched] = await enrichItems([row.item]);
    await logMeal(user.id, enriched, planDate(row.plan, row.item.dayIndex));
  }
  revalidatePath("/planner");
  revalidatePath("/home");
  revalidatePath("/progress");
  return { ok: true };
}

export async function toggleFavouritePlanAction(planId: string): Promise<ActionResult> {
  const { user } = await requireOnboarded();
  const plan = await getOwnedPlan(user.id, planId);
  if (!plan) return { ok: false, error: "common.error" };
  await db.update(schema.mealPlans).set({ isFavourite: !plan.isFavourite }).where(eq(schema.mealPlans.id, planId));
  revalidatePath("/planner");
  return { ok: true };
}

export async function activatePlanAction(planId: string): Promise<ActionResult> {
  const { user } = await requireOnboarded();
  await activatePlan(user.id, planId);
  revalidatePath("/", "layout");
  redirect("/planner");
}
