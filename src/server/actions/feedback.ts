"use server";

import { z } from "zod";
import { requireOnboarded } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";

const Input = z.object({ recipeId: z.string().min(1).max(200), liked: z.boolean() });

/** "Are you satisfied with the recipe?" — one thumbs up / down per recipe, latest wins. */
export async function recipeFeedbackAction(input: unknown): Promise<{ ok: boolean }> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { user } = await requireOnboarded();
  await db
    .insert(schema.recipeFeedback)
    .values({ userId: user.id, recipeId: parsed.data.recipeId, liked: parsed.data.liked })
    .onConflictDoUpdate({ target: [schema.recipeFeedback.userId, schema.recipeFeedback.recipeId], set: { liked: parsed.data.liked, createdAt: new Date() } });
  return { ok: true };
}
