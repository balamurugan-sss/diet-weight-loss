"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { swapOptions } from "@/lib/workouts/generator";
import { WorkoutProfileInput } from "@/lib/workouts/types";
import { requireOnboarded } from "@/server/auth/dal";
import { getOwnedProgram, getWorkoutProfile, programDay, saveWorkoutSetup, selectionContext, setSwap } from "@/server/services/workouts";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveWorkoutSetupAction(input: unknown): Promise<ActionResult> {
  const { user, profile } = await requireOnboarded();
  const parsed = WorkoutProfileInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };
  await saveWorkoutSetup(user.id, profile, parsed.data);
  revalidatePath("/", "layout");
  redirect("/workouts");
}

export type SwapOption = { id: string; name: string; pattern: string; muscles: string[]; equipment: string[]; difficulty: number };

const SlotRef = z.object({ programId: z.string().uuid(), dayIndex: z.number().int().min(0).max(400), slot: z.number().int().min(0).max(300) });

async function ownedSlot(ref: unknown) {
  const parsed = SlotRef.safeParse(ref);
  if (!parsed.success) return null;
  const { user, profile } = await requireOnboarded();
  const program = await getOwnedProgram(user.id, parsed.data.programId);
  const day = program ? programDay(program, parsed.data.dayIndex) : null;
  const item = day && [...day.warmup, ...day.main, ...day.cooldown].find((p) => p.slot === parsed.data.slot);
  if (!program || !day || !item) return null;
  return { user, profile, program, day, item, original: program.days[parsed.data.dayIndex], ...parsed.data };
}

export async function getSwapOptionsAction(ref: unknown): Promise<SwapOption[]> {
  const s = await ownedSlot(ref);
  if (!s) return [];
  const wp = await getWorkoutProfile(s.user.id);
  const ctx = selectionContext(s.program, s.day, s.profile, wp?.equipment ?? []);
  const inDay = s.day.main.map((m) => m.exerciseId).filter((id) => id !== s.item.exerciseId);
  return swapOptions(s.item.exerciseId, ctx, inDay).map((e) => ({
    id: e.id,
    name: e.name,
    pattern: e.pattern,
    muscles: e.muscles,
    equipment: e.equipment,
    difficulty: e.difficulty,
  }));
}

const SwapInput = z.object({ exerciseId: z.string().max(60).nullable(), scope: z.enum(["day", "all"]) });

export async function swapExerciseAction(ref: unknown, input: unknown): Promise<ActionResult> {
  const s = await ownedSlot(ref);
  const parsed = SwapInput.safeParse(input);
  if (!s || !parsed.success) return { ok: false, error: "common.error" };
  const { exerciseId, scope } = parsed.data;
  const originalItem = [...s.original.warmup, ...s.original.main, ...s.original.cooldown].find((p) => p.slot === s.slot)!;

  if (exerciseId === null) {
    // Back to the original: clear both the day swap and an everywhere swap of the original.
    await setSwap(s.program, `${s.dayIndex}:${s.slot}`, null);
    const fresh = await getOwnedProgram(s.user.id, s.programId);
    if (fresh) await setSwap(fresh, `*:${originalItem.exerciseId}`, null);
  } else {
    const wp = await getWorkoutProfile(s.user.id);
    const ctx = selectionContext(s.program, s.day, s.profile, wp?.equipment ?? []);
    if (!swapOptions(s.item.exerciseId, ctx).some((e) => e.id === exerciseId)) return { ok: false, error: "common.error" };
    await setSwap(s.program, scope === "day" ? `${s.dayIndex}:${s.slot}` : `*:${originalItem.exerciseId}`, exerciseId);
  }
  revalidatePath("/workouts", "layout");
  return { ok: true };
}
