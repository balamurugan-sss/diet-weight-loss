"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { swapOptions } from "@/lib/workouts/generator";
import { WorkoutProfileInput } from "@/lib/workouts/types";
import { requireOnboarded } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { getExercise } from "@/lib/workouts/exercises";
import {
  bodyWeight,
  canStartDay,
  finishSession,
  programForRequest,
  addSideProgram,
  endSideProgram,
  getOwnedProgram,
  getOwnedSession,
  getSession,
  getWorkoutProfile,
  logSet,
  programDay,
  programProgress,
  saveWorkoutSchedule,
  startGuideProgram,
  saveWorkoutSetup,
  selectionContext,
  sessionSets,
  setSwap,
  startSession,
  summarise,
  type SessionSummary,
} from "@/server/services/workouts";

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

// ─── Sessions ───────────────────────────────────────────────────────────────

export async function startSessionAction(dayIndex: number, programId?: string | null): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
  if (!Number.isInteger(dayIndex)) return { ok: false, error: "common.error" };
  const { user } = await requireOnboarded();
  const program = await programForRequest(user.id, programId);
  if (!program) return { ok: false, error: "common.error" };
  const existing = await getSession(program.id, dayIndex);
  if (existing) return { ok: true, sessionId: existing.id };
  if (!canStartDay(program, await programProgress(program), dayIndex)) return { ok: false, error: "common.error" };
  const session = await startSession(user.id, program, dayIndex);
  return { ok: true, sessionId: session.id };
}

const SetInput = z.object({
  sessionId: z.string().uuid(),
  slot: z.number().int().min(0).max(300),
  setIndex: z.number().int().min(0).max(20),
  reps: z.number().int().min(0).max(500).nullable(),
  seconds: z.number().int().min(0).max(7200).nullable(),
  weightKg: z.number().min(0).max(500).nullable(),
  done: z.boolean(),
});

export async function logSetAction(input: unknown): Promise<ActionResult> {
  const parsed = SetInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };
  const { user } = await requireOnboarded();
  const session = await getOwnedSession(user.id, parsed.data.sessionId);
  const program = session && (await getOwnedProgram(user.id, session.programId));
  const day = program && programDay(program, session.dayIndex);
  const item = day?.main.find((m) => m.slot === parsed.data.slot);
  if (!session || session.status !== "in_progress" || !item || parsed.data.setIndex >= item.sets + 3) return { ok: false, error: "common.error" };
  const { sessionId, ...v } = parsed.data;
  await logSet(sessionId, { ...v, exerciseId: item.exerciseId, weightKg: getExercise(item.exerciseId).load ? v.weightKg : null });
  return { ok: true };
}

export async function finishSessionAction(sessionId: unknown, activeSec: unknown): Promise<{ ok: true; summary: SessionSummary } | { ok: false; error: string }> {
  const id = z.string().uuid().safeParse(sessionId);
  const sec = z.number().int().min(0).max(6 * 3600).safeParse(activeSec);
  if (!id.success || !sec.success) return { ok: false, error: "common.error" };
  const { user, profile } = await requireOnboarded();
  const session = await getOwnedSession(user.id, id.data);
  const program = session && (await getOwnedProgram(user.id, session.programId));
  const day = program && programDay(program, session.dayIndex);
  if (!session || !program || !day) return { ok: false, error: "common.error" };
  if (session.status === "completed") {
    return {
      ok: true,
      summary: summarise(day, await sessionSets(session.id), session.durationSec ?? 0, await bodyWeight(user.id, profile), program.goal),
    };
  }
  const summary = summarise(day, await sessionSets(session.id), Math.max(60, sec.data), await bodyWeight(user.id, profile), program.goal);
  await finishSession(session, summary);
  revalidatePath("/", "layout");
  return { ok: true, summary };
}

const EditInput = z.object({
  sessionId: z.string().uuid(),
  durationMin: z.number().int().min(1).max(360),
  sets: z
    .array(
      z.object({
        slot: z.number().int().min(0).max(300),
        setIndex: z.number().int().min(0).max(20),
        reps: z.number().int().min(0).max(500).nullable(),
        seconds: z.number().int().min(0).max(7200).nullable(),
        weightKg: z.number().min(0).max(500).nullable(),
        done: z.boolean(),
      }),
    )
    .max(200),
});

/**
 * "Edit what I did": replaces a finished session's sets and duration with
 * what the person actually did, then recomputes its energy (and so the
 * day's food add-back). Only sets for exercises in that day's plan are kept.
 */
export async function editSessionAction(input: unknown): Promise<{ ok: true; summary: SessionSummary } | { ok: false; error: string }> {
  const parsed = EditInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };
  const { user, profile } = await requireOnboarded();
  const session = await getOwnedSession(user.id, parsed.data.sessionId);
  const program = session && (await getOwnedProgram(user.id, session.programId));
  const day = program && programDay(program, session.dayIndex);
  if (!session || !program || !day || session.status !== "completed") return { ok: false, error: "common.error" };
  const bySlot = new Map(day.main.map((m) => [m.slot, m]));
  const sets = parsed.data.sets.filter((st) => bySlot.has(st.slot) && st.setIndex < bySlot.get(st.slot)!.sets + 3);
  await db.delete(schema.workoutSets).where(eq(schema.workoutSets.sessionId, session.id));
  for (const st of sets) {
    const exerciseId = bySlot.get(st.slot)!.exerciseId;
    await logSet(session.id, { ...st, exerciseId, weightKg: getExercise(exerciseId).load ? st.weightKg : null });
  }
  const summary = summarise(day, sets, parsed.data.durationMin * 60, await bodyWeight(user.id, profile), program.goal);
  await db
    .update(schema.workoutSessions)
    .set({ durationSec: summary.durationSec, kcal: summary.kcal, netKcal: summary.netKcal, exercisesDone: summary.exercisesDone })
    .where(eq(schema.workoutSessions.id, session.id));
  revalidatePath("/", "layout");
  return { ok: true, summary };
}

/** Program settings → Schedule: the weekdays to train on (restarts the plan from today). */
export async function saveScheduleAction(weekdays: unknown): Promise<ActionResult> {
  const days = z.array(z.number().int().min(0).max(6)).min(3).max(6).safeParse(weekdays);
  if (!days.success) return { ok: false, error: "program.schedule.count" };
  const { user, profile } = await requireOnboarded();
  const id = await saveWorkoutSchedule(user.id, profile, days.data);
  if (!id) return { ok: false, error: "program.schedule.setupFirst" };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Explore → a program guide → "Start this program". */
export async function startGuideProgramAction(programId: unknown): Promise<ActionResult> {
  const id = z.string().min(1).max(80).safeParse(programId);
  if (!id.success) return { ok: false, error: "common.error" };
  const { user, profile } = await requireOnboarded();
  if (!(await startGuideProgram(user.id, profile, id.data))) return { ok: false, error: "common.error" };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Explore → a program guide → "Add to my day": follow it alongside the main program. */
export async function addSideProgramAction(programId: unknown): Promise<ActionResult> {
  const id = z.string().min(1).max(80).safeParse(programId);
  if (!id.success) return { ok: false, error: "common.error" };
  const { user, profile } = await requireOnboarded();
  if (!(await addSideProgram(user.id, profile, id.data))) return { ok: false, error: "common.error" };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function endSideProgramAction(programId: unknown): Promise<ActionResult> {
  const id = z.string().min(1).max(64).safeParse(programId);
  if (!id.success) return { ok: false, error: "common.error" };
  const { user } = await requireOnboarded();
  await endSideProgram(user.id, id.data);
  revalidatePath("/", "layout");
  return { ok: true };
}
