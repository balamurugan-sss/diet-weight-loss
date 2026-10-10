"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOnboarded } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";

const Goals = z.object({
  steps: z.coerce.number().int().min(1000).max(50_000),
  activeKcal: z.coerce.number().int().min(50).max(3000),
  sleepHours: z.coerce.number().min(4).max(12),
});

export type GoalsState = { error?: string } | undefined;

/** Daily goals for steps, active calories and hours of sleep (Me → Tracker). */
export async function saveGoalsAction(_prev: GoalsState, form: FormData): Promise<GoalsState> {
  const parsed = Goals.safeParse({ steps: form.get("steps"), activeKcal: form.get("activeKcal"), sleepHours: form.get("sleepHours") });
  if (!parsed.success) return { error: "me.goals.invalid" };
  const { user } = await requireOnboarded();
  await db
    .update(schema.profiles)
    .set({ stepGoal: parsed.data.steps, activeKcalGoal: parsed.data.activeKcal, sleepGoalMin: Math.round(parsed.data.sleepHours * 60), updatedAt: new Date() })
    .where(eq(schema.profiles.userId, user.id));
  revalidatePath("/me");
  redirect("/me");
}
