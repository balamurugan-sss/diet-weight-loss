"use server";

import { revalidatePath } from "next/cache";
import { requireOnboarded } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { getOwnedPlan } from "@/server/services/plans";

export async function setShoppingState(planId: string, weekIndex: number, ingredientIds: string[], patch: { checked?: boolean; haveAtHome?: boolean }) {
  const { user } = await requireOnboarded();
  const plan = await getOwnedPlan(user.id, planId);
  if (!plan || weekIndex < 0 || weekIndex > 5 || ingredientIds.length > 400) return { ok: false as const };
  for (const ingredientId of ingredientIds.slice(0, 400)) {
    await db
      .insert(schema.shoppingState)
      .values({ planId, weekIndex, ingredientId: ingredientId.slice(0, 80), checked: patch.checked ?? false, haveAtHome: patch.haveAtHome ?? false })
      .onConflictDoUpdate({ target: [schema.shoppingState.planId, schema.shoppingState.weekIndex, schema.shoppingState.ingredientId], set: patch });
  }
  revalidatePath("/shopping");
  return { ok: true as const };
}

export async function setHouseholdSize(n: number) {
  const { user } = await requireOnboarded();
  const size = Math.max(1, Math.min(12, Math.round(n)));
  const { eq } = await import("drizzle-orm");
  await db.update(schema.profiles).set({ householdSize: size, updatedAt: new Date() }).where(eq(schema.profiles.userId, user.id));
  revalidatePath("/shopping");
}
