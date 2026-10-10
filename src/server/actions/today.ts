"use server";

import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getQuickFood, QUICK_FOODS, QUICK_SLOT } from "@/lib/today/quickFoods";
import { requireOnboarded } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { rateLimit } from "@/server/rateLimit";
import { setDayEvent } from "@/server/services/today";
import { clockAt, todayISO, zonedInstant } from "@/server/time";
import { cardioEnergy, type CardioActivity } from "@/lib/workouts/cardio";
import { bodyWeight, getOwnedProgram, getOwnedSession, programDay, sessionSets, summarise } from "@/server/services/workouts";

type Result = { ok: true } | { ok: false; error: string };

const Clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

function done(): Result {
  revalidatePath("/home");
  revalidatePath("/progress");
  return { ok: true };
}

/** "I woke up at …" — overrides the watch's wake time for today. */
export async function setWakeTimeAction(time: unknown): Promise<Result> {
  const t = Clock.safeParse(time);
  if (!t.success) return { ok: false, error: "today.badTime" };
  const { user } = await requireOnboarded();
  await setDayEvent(user.id, todayISO(), "wake", t.data);
  return done();
}

/** When the person plans to train today; null clears it. */
export async function setWorkoutTimeAction(time: unknown): Promise<Result> {
  const t = Clock.nullable().safeParse(time);
  if (!t.success) return { ok: false, error: "today.badTime" };
  const { user } = await requireOnboarded();
  await setDayEvent(user.id, todayISO(), "workout_plan", t.data);
  return done();
}

/** "Yes, I've eaten" to the pre-workout question, without logging what. */
export async function markAteAction(): Promise<Result> {
  const { user } = await requireOnboarded();
  await setDayEvent(user.id, todayISO(), "ate", clockAt());
  return done();
}

async function addWater(userId: string, date: string, ml: number) {
  if (!ml) return;
  await db
    .insert(schema.waterLogs)
    .values({ userId, date, ml: Math.max(0, ml) })
    .onConflictDoUpdate({ target: [schema.waterLogs.userId, schema.waterLogs.date], set: { ml: sql`max(0, min(10000, ${schema.waterLogs.ml} + ${ml}))` } });
}

/** One tap: logs a morning drink, pre-workout snack or protein serving to today's intake (and water). */
export async function quickLogAction(foodId: unknown): Promise<Result> {
  const food = typeof foodId === "string" ? getQuickFood(foodId) : null;
  if (!food) return { ok: false, error: "common.error" };
  const { user } = await requireOnboarded();
  if (!(await rateLimit(`quicklog:${user.id}`, 60, 3600))) return { ok: false, error: "auth.rateLimited" };
  const date = todayISO();
  await db.insert(schema.mealLogs).values({
    id: randomUUID(),
    userId: user.id,
    date,
    slot: QUICK_SLOT[food.group],
    recipeId: null,
    planItemId: null,
    title: food.title,
    portion: 1,
    kcal: food.kcal,
    proteinG: food.proteinG,
    carbsG: food.carbsG,
    netCarbsG: Math.max(0, food.carbsG - food.fibreG),
    fatG: food.fatG,
    fibreG: food.fibreG,
  });
  await addWater(user.id, date, food.waterMl);
  return done();
}

/** Undo a one-tap log from today's timeline. Plan meals are un-logged from the planner instead. */
export async function removeQuickLogAction(logId: unknown): Promise<Result> {
  const id = z.string().uuid().safeParse(logId);
  if (!id.success) return { ok: false, error: "common.error" };
  const { user } = await requireOnboarded();
  const [row] = await db
    .select()
    .from(schema.mealLogs)
    .where(and(eq(schema.mealLogs.id, id.data), eq(schema.mealLogs.userId, user.id), inArray(schema.mealLogs.slot, Object.values(QUICK_SLOT))));
  if (!row) return { ok: false, error: "common.error" };
  await db.delete(schema.mealLogs).where(eq(schema.mealLogs.id, row.id));
  const food = QUICK_FOODS.find((f) => f.title === row.title && QUICK_SLOT[f.group] === row.slot);
  if (food) await addWater(user.id, row.date, -food.waterMl);
  return done();
}

// ─── Edit my day ────────────────────────────────────────────────────────────

const ItemTime = z.object({
  kind: z.enum(["food", "cardio", "wake", "workout_plan", "workout"]),
  id: z.string().max(64).optional(),
  time: Clock,
});

/** Moves one day-line item to a new local time (drag or time field). Workouts keep their length. */
export async function setItemTimeAction(input: unknown): Promise<Result> {
  const parsed = ItemTime.safeParse(input);
  if (!parsed.success) return { ok: false, error: "today.badTime" };
  const { kind, id, time } = parsed.data;
  const { user } = await requireOnboarded();
  const date = todayISO();
  if (kind === "wake" || kind === "workout_plan") {
    await setDayEvent(user.id, date, kind, time);
    return done();
  }
  if (!id) return { ok: false, error: "common.error" };
  if (kind === "food") {
    await db.update(schema.mealLogs).set({ time }).where(and(eq(schema.mealLogs.id, id), eq(schema.mealLogs.userId, user.id)));
  } else if (kind === "cardio") {
    await db.update(schema.cardioLogs).set({ time }).where(and(eq(schema.cardioLogs.id, id), eq(schema.cardioLogs.userId, user.id)));
  } else {
    const [s] = await db.select().from(schema.workoutSessions).where(and(eq(schema.workoutSessions.id, id), eq(schema.workoutSessions.userId, user.id)));
    if (!s) return { ok: false, error: "common.error" };
    const startedAt = zonedInstant(s.date, time);
    const finishedAt = s.finishedAt ? new Date(startedAt.getTime() + (s.durationSec ?? Math.max(0, s.finishedAt.getTime() - s.startedAt.getTime()) / 1000) * 1000) : null;
    await db.update(schema.workoutSessions).set({ startedAt, finishedAt }).where(eq(schema.workoutSessions.id, s.id));
  }
  return done();
}

const Minutes = z.object({ id: z.string().min(1).max(64), minutes: z.number().int().min(1).max(360) });

/** "How long did I actually train?" — sets a finished workout's length and recomputes its calories. */
export async function setWorkoutMinutesAction(input: unknown): Promise<Result> {
  const parsed = Minutes.safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };
  const { user, profile } = await requireOnboarded();
  const session = await getOwnedSession(user.id, parsed.data.id);
  const program = session && (await getOwnedProgram(user.id, session.programId));
  const day = program && programDay(program, session.dayIndex);
  if (!session || !program || !day || session.status !== "completed") return { ok: false, error: "common.error" };
  const summary = summarise(day, await sessionSets(session.id), parsed.data.minutes * 60, await bodyWeight(user.id, profile), program.goal);
  await db
    .update(schema.workoutSessions)
    .set({ durationSec: summary.durationSec, kcal: summary.kcal, netKcal: summary.netKcal, finishedAt: new Date(session.startedAt.getTime() + summary.durationSec * 1000) })
    .where(eq(schema.workoutSessions.id, session.id));
  return done();
}

/** Corrects a cardio entry's minutes; energy is recalculated from its activity and effort. */
export async function setCardioMinutesAction(input: unknown): Promise<Result> {
  const parsed = Minutes.safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };
  const { user, profile } = await requireOnboarded();
  const [c] = await db.select().from(schema.cardioLogs).where(and(eq(schema.cardioLogs.id, parsed.data.id), eq(schema.cardioLogs.userId, user.id)));
  if (!c) return { ok: false, error: "common.error" };
  const e = cardioEnergy(c.activity as CardioActivity, c.intensity, parsed.data.minutes, await bodyWeight(user.id, profile));
  await db.update(schema.cardioLogs).set({ minutes: parsed.data.minutes, kcal: e.kcal, netKcal: e.netKcal }).where(eq(schema.cardioLogs.id, c.id));
  return done();
}
