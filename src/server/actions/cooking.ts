"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboarded } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { enrichItems, logMeal, ownedItem, planDate } from "@/server/services/plans";
import { todayISO } from "@/server/time";

const Progress = z.object({
  recipeId: z.string().max(80),
  stepIndex: z.number().int().min(0).max(30),
  completedSteps: z.array(z.number().int().min(0).max(30)).max(31),
  servings: z.number().min(0.5).max(24),
  planItemId: z.string().max(64).nullable().optional(),
});

export async function saveCookingProgress(raw: unknown) {
  const { user } = await requireOnboarded();
  const p = Progress.safeParse(raw);
  if (!p.success) return;
  const values = { ...p.data, planItemId: p.data.planItemId ?? null, updatedAt: new Date(), finishedAt: null };
  await db
    .insert(schema.cookingSessions)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: [schema.cookingSessions.userId, schema.cookingSessions.recipeId], set: values });
}

/** Marks cooking finished and logs what the user will eat (one serving, or the plan portion). */
export async function finishCooking(recipeId: string, planItemId: string | null, portion = 1) {
  const { user } = await requireOnboarded();
  await db
    .update(schema.cookingSessions)
    .set({ finishedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.cookingSessions.userId, user.id));
  if (planItemId) {
    const row = await ownedItem(user.id, planItemId);
    if (row && !row.item.completedAt) {
      const [enriched] = await enrichItems([row.item]);
      await logMeal(user.id, enriched, planDate(row.plan, row.item.dayIndex));
    }
  } else {
    const [r] = await db.select().from(schema.recipes).where(eq(schema.recipes.id, recipeId)).limit(1);
    if (!r) return { ok: false as const };
    const k = Math.min(3, Math.max(0.25, portion));
    await db.insert(schema.mealLogs).values({
      id: randomUUID(),
      userId: user.id,
      date: todayISO(),
      slot: "other",
      recipeId: r.id,
      planItemId: null,
      title: r.title,
      portion: k,
      kcal: r.kcal * k,
      proteinG: r.proteinG * k,
      carbsG: r.carbsG * k,
      netCarbsG: r.netCarbsG * k,
      fatG: r.fatG * k,
      fibreG: r.fibreG * k,
    });
  }
  revalidatePath("/home");
  revalidatePath("/progress");
  return { ok: true as const };
}
