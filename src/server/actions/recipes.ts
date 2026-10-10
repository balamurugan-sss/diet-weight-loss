"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOnboarded } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";

async function recipeExists(recipeId: string) {
  const [r] = await db.select({ id: schema.recipes.id }).from(schema.recipes).where(eq(schema.recipes.id, recipeId)).limit(1);
  return !!r;
}

export async function toggleFavouriteAction(recipeId: string) {
  const { user } = await requireOnboarded();
  if (!(await recipeExists(recipeId))) return { ok: false as const };
  const where = and(eq(schema.favourites.userId, user.id), eq(schema.favourites.recipeId, recipeId));
  const [existing] = await db.select().from(schema.favourites).where(where).limit(1);
  if (existing) await db.delete(schema.favourites).where(where);
  else await db.insert(schema.favourites).values({ userId: user.id, recipeId });
  revalidatePath("/recipes");
  revalidatePath("/home");
  return { ok: true as const, favourite: !existing };
}

export async function recordViewAction(recipeId: string) {
  const { user } = await requireOnboarded();
  if (!(await recipeExists(recipeId))) return;
  await db
    .insert(schema.recentViews)
    .values({ userId: user.id, recipeId, viewedAt: new Date() })
    .onConflictDoUpdate({ target: [schema.recentViews.userId, schema.recentViews.recipeId], set: { viewedAt: new Date() } });
}
