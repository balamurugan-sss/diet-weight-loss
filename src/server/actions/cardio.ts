"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CARDIO_ACTIVITY_IDS, CARDIO_INTENSITIES } from "@/lib/workouts/cardio";
import { requireOnboarded } from "@/server/auth/dal";
import { addCardio, deleteCardio } from "@/server/services/cardio";
import { bodyWeight } from "@/server/services/workouts";
import { addDaysISO, todayISO } from "@/server/time";

export type ActionResult = { ok: true } | { ok: false; error: string };

const CardioInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activity: z.enum(CARDIO_ACTIVITY_IDS as [string, ...string[]]),
  intensity: z.enum(CARDIO_INTENSITIES),
  minutes: z.number().int().min(1).max(600),
});

export async function logCardioAction(input: unknown): Promise<ActionResult> {
  const parsed = CardioInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };
  const today = todayISO();
  // Allow back-filling the last 60 days, but not future dates.
  if (parsed.data.date > today || parsed.data.date < addDaysISO(today, -60)) return { ok: false, error: "cardio.badDate" };
  const { user, profile } = await requireOnboarded();
  await addCardio(user.id, { ...parsed.data, activity: parsed.data.activity as never }, await bodyWeight(user.id, profile));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCardioAction(id: unknown): Promise<ActionResult> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "common.error" };
  const { user } = await requireOnboarded();
  await deleteCardio(user.id, parsed.data);
  revalidatePath("/", "layout");
  return { ok: true };
}
