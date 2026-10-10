import "server-only";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import type { Issue } from "@/lib/planner/engine";
import type { Profile } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { heroImages } from "./media";
import { enrichItems, groupBySlot, planDate, planItems, plannerContextFor, reportForItems, type Plan } from "./plans";

export type DayItemView = {
  id: string;
  recipeId: string;
  slug: string;
  title: string;
  course: string;
  portion: number;
  kcal: number;
  proteinG: number;
  netCarbsG: number;
  fatG: number;
  costInr: number;
  completed: boolean;
  palette: string[];
  image: { id: string; kind: "ai_illustration" | "verified_photo" } | null;
  totalMin: number;
  swaps: { from: string; to: string }[];
  substitutions: { from: string; fromName: string; to: string; toName: string; note: string }[];
};

export type DayView = {
  planId: string;
  dayIndex: number;
  date: string;
  slots: { slot: string; items: DayItemView[]; kcal: number }[];
  totals: { kcal: number; proteinG: number; carbsG: number; netCarbsG: number; fatG: number; fibreG: number; costInr: number };
  issues: Issue[];
  ok: boolean;
};

export async function dayView(plan: Plan, profile: Profile, dayIndex: number): Promise<DayView> {
  const items = await enrichItems(await planItems(plan.id, dayIndex));
  const { pp } = await plannerContextFor(profile);
  const report = reportForItems(items, pp);
  const ids = [...new Set(items.map((i) => i.recipeId))];
  const meta = ids.length
    ? new Map(
        (await db.select({ id: schema.recipes.id, slug: schema.recipes.slug, palette: schema.recipes.palette }).from(schema.recipes).where(inArray(schema.recipes.id, ids))).map((r) => [r.id, r]),
      )
    : new Map();
  const images = await heroImages(ids);
  const from = alias(schema.ingredients, "from_ing");
  const to = alias(schema.ingredients, "to_ing");
  const subs = ids.length
    ? await db
        .select({
          recipeId: schema.recipeSubstitutions.recipeId,
          from: schema.recipeSubstitutions.ingredientId,
          fromName: from.name,
          to: schema.recipeSubstitutions.substituteId,
          toName: to.name,
          note: schema.recipeSubstitutions.note,
        })
        .from(schema.recipeSubstitutions)
        .innerJoin(from, eq(from.id, schema.recipeSubstitutions.ingredientId))
        .innerJoin(to, eq(to.id, schema.recipeSubstitutions.substituteId))
        .where(and(inArray(schema.recipeSubstitutions.recipeId, ids), isNotNull(schema.recipeSubstitutions.substituteId)))
    : [];

  const slots = groupBySlot(items, profile.mealSlots).map(({ slot, items }) => ({
    slot,
    kcal: Math.round(items.reduce((s, i) => s + i.nutrients.kcal, 0)),
    items: items.map<DayItemView>((i) => ({
      id: i.id,
      recipeId: i.recipeId,
      slug: meta.get(i.recipeId)?.slug ?? i.recipeId,
      title: i.recipe.title,
      course: i.recipe.course,
      portion: i.portion,
      kcal: Math.round(i.nutrients.kcal),
      proteinG: Math.round(i.nutrients.proteinG),
      netCarbsG: Math.round(i.nutrients.netCarbsG * 10) / 10,
      fatG: Math.round(i.nutrients.fatG),
      costInr: Math.round(i.nutrients.costInr),
      completed: !!i.completedAt,
      palette: meta.get(i.recipeId)?.palette ?? [],
      image: images.get(i.recipeId) ?? null,
      totalMin: i.recipe.totalMin,
      swaps: i.swaps,
      substitutions: subs
        .filter((s) => s.recipeId === i.recipeId)
        .map((s) => ({ from: s.from, fromName: s.fromName, to: s.to!, toName: s.toName, note: s.note })),
    })),
  }));
  const t = report.totals;
  return {
    planId: plan.id,
    dayIndex,
    date: planDate(plan, dayIndex),
    slots,
    totals: {
      kcal: Math.round(t.kcal),
      proteinG: Math.round(t.proteinG),
      carbsG: Math.round(t.carbsG),
      netCarbsG: Math.round(t.netCarbsG),
      fatG: Math.round(t.fatG),
      fibreG: Math.round(t.fibreG),
      costInr: Math.round(t.costInr),
    },
    issues: report.issues,
    ok: report.ok,
  };
}
