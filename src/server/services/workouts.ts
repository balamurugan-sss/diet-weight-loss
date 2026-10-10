import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { profileAge } from "@/lib/profile/health";
import { applySwaps, availableEquipment, generateProgram, type ProgramInput, type SelectionContext } from "@/lib/workouts/generator";
import { estimatePrescriptions, type LoggedSet } from "@/lib/workouts/load";
import { replayProgram, type Completion, type ProgramProgress } from "@/lib/workouts/progress";
import type { DaysPerWeek, Prescription, ProgramDay, WorkoutGoal, WorkoutProfileInput } from "@/lib/workouts/types";
import { trainingDayTargets, workoutAddBack } from "@/lib/workouts/fuel";
import { estimatedOneRepMax } from "@/lib/workouts/load";
import { weightForBmi } from "@/lib/nutrition/bmi";
import { addDays, weekStart } from "@/lib/workouts/progress";
import type { Profile } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { todayISO } from "@/server/time";
import { latestWeight } from "./progress";
import { cardioBetween } from "./cardio";
import { targetsForProfile } from "./targets";

export type WorkoutProfile = typeof schema.workoutProfiles.$inferSelect;
export type WorkoutProgram = typeof schema.workoutPrograms.$inferSelect;
export type WorkoutSession = typeof schema.workoutSessions.$inferSelect;

/**
 * Health flags from the shared food profile that change exercise selection.
 * `cautions` are message keys shown next to the doctor note.
 */
export function workoutSafety(profile: Profile) {
  const conditions = profile.conditions ?? [];
  const pregnant = profile.pregnancyStatus === "pregnant";
  const age = profileAge(profile) ?? 30;
  const cautions: ("wk.caution.pregnant" | "wk.caution.heart" | "wk.caution.bp" | "wk.caution.minor" | "wk.caution.older")[] = [];
  if (pregnant) cautions.push("wk.caution.pregnant");
  if (conditions.includes("heart_disease")) cautions.push("wk.caution.heart");
  if (conditions.includes("hypertension")) cautions.push("wk.caution.bp");
  if (age < 18) cautions.push("wk.caution.minor");
  if (age >= 65) cautions.push("wk.caution.older");
  return {
    lowImpact: pregnant || conditions.includes("heart_disease") || conditions.includes("hypertension") || age >= 65,
    noSupine: pregnant,
    cautions,
  };
}

export async function getWorkoutProfile(userId: string) {
  const [row] = await db.select().from(schema.workoutProfiles).where(eq(schema.workoutProfiles.userId, userId));
  return row ?? null;
}

export async function getActiveProgram(userId: string) {
  const [row] = await db
    .select()
    .from(schema.workoutPrograms)
    .where(and(eq(schema.workoutPrograms.userId, userId), eq(schema.workoutPrograms.status, "active")))
    .orderBy(desc(schema.workoutPrograms.createdAt))
    .limit(1);
  return row ?? null;
}

export async function getOwnedProgram(userId: string, programId: string) {
  const [row] = await db
    .select()
    .from(schema.workoutPrograms)
    .where(and(eq(schema.workoutPrograms.id, programId), eq(schema.workoutPrograms.userId, userId)));
  return row ?? null;
}

async function bodyWeight(userId: string, profile: Profile) {
  return (await latestWeight(userId))?.weightKg ?? profile.weightKg ?? 70;
}

export async function programInputFor(userId: string, profile: Profile, wp: Pick<WorkoutProfile, "location" | "level" | "goal" | "daysPerWeek" | "equipment">): Promise<ProgramInput> {
  const safety = workoutSafety(profile);
  return {
    location: wp.location,
    level: wp.level,
    goal: wp.goal,
    daysPerWeek: wp.daysPerWeek as DaysPerWeek,
    equipment: wp.equipment,
    sex: profile.sexForEquation ?? "female",
    weightKg: await bodyWeight(userId, profile),
    lowImpact: safety.lowImpact,
    noSupine: safety.noSupine,
  };
}

/** Saves the answers and starts a fresh 4-week program today (the old one is archived, history kept). */
export async function saveWorkoutSetup(userId: string, profile: Profile, input: WorkoutProfileInput) {
  const now = new Date();
  const values = {
    location: input.location,
    level: input.level,
    goal: input.goal,
    daysPerWeek: input.daysPerWeek,
    equipment: input.location === "gym" ? [] : input.equipment,
    doctorAckAt: now,
    updatedAt: now,
  };
  const program = generateProgram(await programInputFor(userId, profile, values));
  const id = randomUUID();
  await db.batch([
    db
      .insert(schema.workoutProfiles)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: schema.workoutProfiles.userId, set: values }),
    db
      .update(schema.workoutPrograms)
      .set({ status: "archived" })
      .where(and(eq(schema.workoutPrograms.userId, userId), eq(schema.workoutPrograms.status, "active"))),
    db.insert(schema.workoutPrograms).values({
      id,
      userId,
      name: program.name,
      split: program.split,
      location: program.location,
      level: program.level,
      goal: program.goal,
      daysPerWeek: program.daysPerWeek,
      startDate: todayISO(),
      days: program.days,
      status: "active",
    }),
  ]);
  return id;
}

export async function completions(programId: string): Promise<Completion[]> {
  return db
    .select({ dayIndex: schema.workoutSessions.dayIndex, date: schema.workoutSessions.date })
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.programId, programId), eq(schema.workoutSessions.status, "completed")));
}

export async function programProgress(program: WorkoutProgram, range?: [string, string], today = todayISO()) {
  const kinds = program.days.map((d) => d.kind);
  return replayProgram(kinds, program.startDate, await completions(program.id), today, range);
}

export function programDay(program: WorkoutProgram, dayIndex: number): ProgramDay | null {
  const day = program.days[dayIndex];
  return day ? applySwaps(day, program.swaps) : null;
}

export function selectionContext(program: WorkoutProgram, day: ProgramDay, profile: Profile, equipment: WorkoutProfile["equipment"]): SelectionContext {
  const safety = workoutSafety(profile);
  return {
    setting: day.setting,
    level: program.level,
    equipment: availableEquipment(day.setting, equipment),
    lowImpact: safety.lowImpact,
    noSupine: safety.noSupine,
  };
}

export async function setSwap(program: WorkoutProgram, key: string, exerciseId: string | null) {
  const swaps = { ...program.swaps };
  if (exerciseId) swaps[key] = exerciseId;
  else delete swaps[key];
  await db.update(schema.workoutPrograms).set({ swaps }).where(eq(schema.workoutPrograms.id, program.id));
}

export async function sessionsFor(programId: string, dayIndexes: number[]) {
  if (!dayIndexes.length) return [];
  return db
    .select()
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.programId, programId), inArray(schema.workoutSessions.dayIndex, dayIndexes)));
}

// ─── Sessions ───────────────────────────────────────────────────────────────

export type WorkoutSet = typeof schema.workoutSets.$inferSelect;

/**
 * A day can be started when it is the current day, or a later day reached only
 * by skipping rest / recovery days ("train anyway"). Workout days are never skipped.
 */
export function canStartDay(program: WorkoutProgram, prog: ProgramProgress, dayIndex: number) {
  if (dayIndex < prog.position || dayIndex >= program.days.length) return false;
  return program.days.slice(prog.position, dayIndex).every((d) => d.kind !== "workout");
}

export async function getSession(programId: string, dayIndex: number) {
  const [row] = await db
    .select()
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.programId, programId), eq(schema.workoutSessions.dayIndex, dayIndex)));
  return row ?? null;
}

export async function getOwnedSession(userId: string, sessionId: string) {
  const [row] = await db
    .select()
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.id, sessionId), eq(schema.workoutSessions.userId, userId)));
  return row ?? null;
}

export async function startSession(userId: string, program: WorkoutProgram, dayIndex: number) {
  const kind = program.days[dayIndex].kind === "recovery" ? "recovery" : "workout";
  await db
    .insert(schema.workoutSessions)
    .values({ id: randomUUID(), userId, programId: program.id, dayIndex, date: todayISO(), kind, status: "in_progress", startedAt: new Date() })
    .onConflictDoNothing();
  return (await getSession(program.id, dayIndex))!;
}

export async function sessionSets(sessionId: string) {
  return db.select().from(schema.workoutSets).where(eq(schema.workoutSets.sessionId, sessionId));
}

/** Sets from the most recent completed session that included each exercise. */
export async function previousSets(userId: string, exerciseIds: string[], excludeSessionId: string) {
  const out = new Map<string, LoggedSet[]>();
  if (!exerciseIds.length) return out;
  const rows = await db
    .select({ set: schema.workoutSets, finishedAt: schema.workoutSessions.finishedAt })
    .from(schema.workoutSets)
    .innerJoin(schema.workoutSessions, eq(schema.workoutSessions.id, schema.workoutSets.sessionId))
    .where(
      and(
        eq(schema.workoutSessions.userId, userId),
        eq(schema.workoutSessions.status, "completed"),
        ne(schema.workoutSessions.id, excludeSessionId),
        inArray(schema.workoutSets.exerciseId, exerciseIds),
      ),
    )
    .orderBy(desc(schema.workoutSessions.finishedAt), schema.workoutSets.setIndex);
  const sessionFor = new Map<string, string>();
  for (const { set } of rows) {
    const first = sessionFor.get(set.exerciseId);
    if (first && first !== set.sessionId) continue;
    sessionFor.set(set.exerciseId, set.sessionId);
    const list = out.get(set.exerciseId) ?? [];
    list.push({ reps: set.reps, seconds: set.seconds, weightKg: set.weightKg, done: set.done });
    out.set(set.exerciseId, list);
  }
  return out;
}

export async function logSet(sessionId: string, v: { slot: number; setIndex: number; exerciseId: string; reps: number | null; seconds: number | null; weightKg: number | null; done: boolean }) {
  const values = { ...v, completedAt: v.done ? new Date() : null };
  await db
    .insert(schema.workoutSets)
    .values({ sessionId, ...values })
    .onConflictDoUpdate({ target: [schema.workoutSets.sessionId, schema.workoutSets.slot, schema.workoutSets.setIndex], set: values });
}

export type SessionSummary = { durationSec: number; kcal: number; netKcal: number; exercisesDone: number; exercisesTotal: number; addBackKcal: number };

/**
 * Energy for what was actually done: warm-up and cool-down plus the completed
 * sets of each exercise, scaled towards the real elapsed time (within ±50%).
 */
export function summarise(day: ProgramDay, sets: Pick<WorkoutSet, "slot" | "done">[], durationSec: number, weightKg: number, goal: WorkoutGoal): SessionSummary {
  const doneBySlot = new Map<number, number>();
  for (const st of sets) if (st.done) doneBySlot.set(st.slot, (doneBySlot.get(st.slot) ?? 0) + 1);
  const isRecovery = day.kind === "recovery";
  const main: Prescription[] = day.main
    .map((m) => ({ ...m, sets: isRecovery ? m.sets : Math.min(m.sets, doneBySlot.get(m.slot) ?? 0) }))
    .filter((m) => m.sets > 0);
  const exercisesDone = main.length;
  const e = estimatePrescriptions([...day.warmup, ...main, ...day.cooldown], weightKg);
  const planned = e.minutes * 60;
  const scale = planned > 0 && durationSec > 0 ? Math.min(1.5, Math.max(0.5, durationSec / planned)) : 1;
  const kcal = Math.round(e.kcal * scale);
  const netKcal = Math.round(e.netKcal * scale);
  return { durationSec, kcal, netKcal, exercisesDone, exercisesTotal: day.main.length, addBackKcal: workoutAddBack(netKcal, goal) };
}

export async function finishSession(session: WorkoutSession, summary: SessionSummary) {
  await db
    .update(schema.workoutSessions)
    .set({
      status: "completed",
      date: todayISO(),
      finishedAt: new Date(),
      durationSec: summary.durationSec,
      kcal: summary.kcal,
      netKcal: summary.netKcal,
      exercisesDone: summary.exercisesDone,
    })
    .where(eq(schema.workoutSessions.id, session.id));
}

export { bodyWeight };

// ─── Food-planner link ──────────────────────────────────────────────────────

/**
 * Today's food targets after training: the base targets from the food plan,
 * adjusted for a planned or completed workout (see lib/workouts/fuel.ts).
 */
export async function trainingContext(userId: string, profile: Profile, date = todayISO()) {
  const base = targetsForProfile(profile);
  if (!base) return null;
  const program = await getActiveProgram(userId);
  const [done, cardio, prog, weightKg] = await Promise.all([
    program
      ? db
          .select()
          .from(schema.workoutSessions)
          .where(and(eq(schema.workoutSessions.userId, userId), eq(schema.workoutSessions.date, date), eq(schema.workoutSessions.status, "completed")))
      : [],
    cardioBetween(userId, date, date),
    program ? programProgress(program, [date, date], date) : null,
    bodyWeight(userId, profile),
  ]);
  const plannedKind = prog?.cells[0]?.kind ?? null;
  const cardioMinutes = cardio.reduce((n, c) => n + c.minutes, 0);
  const burnedKcal = done.reduce((n, x) => n + (x.kcal ?? 0), 0) + cardio.reduce((n, c) => n + c.kcal, 0);
  const burnedNetKcal = done.reduce((n, x) => n + (x.netKcal ?? 0), 0) + cardio.reduce((n, c) => n + c.netKcal, 0);
  const trainingDay = done.length > 0 || plannedKind === "workout" || cardioMinutes >= 20;
  if (!program && cardio.length === 0) {
    return { base, adjusted: null, program: null, trainingDay: false, plannedKind: null, burnedKcal: 0, burnedNetKcal: 0, sessionsToday: 0, cardioMinutes: 0 };
  }
  const age = profileAge(profile) ?? 30;
  const referenceWeightKg = base.bmi > 25 && profile.heightCm ? weightForBmi(25, profile.heightCm) : weightKg;
  const adjusted = trainingDayTargets(base, {
    // Without a workout program, the food goal decides how much of the burn comes back.
    workoutGoal: program?.goal ?? (base.goal === "lose" ? "lose" : "fit"),
    trainingDay,
    burnedNetKcal,
    referenceWeightKg,
    allowExtraProtein: age >= 18 && !(profile.conditions ?? []).includes("kidney"),
  });
  return { base, adjusted, program, trainingDay, plannedKind, burnedKcal, burnedNetKcal, sessionsToday: done.length, cardioMinutes };
}

// ─── Progress charts ────────────────────────────────────────────────────────

/** Completed workouts per ISO week (Mon start), oldest first, including empty weeks. */
export async function weeklyWorkoutCounts(userId: string, weeks = 8, today = todayISO()) {
  const first = addDays(weekStart(today), -7 * (weeks - 1));
  const rows = await db
    .select({ date: schema.workoutSessions.date, kind: schema.workoutSessions.kind })
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.userId, userId), eq(schema.workoutSessions.status, "completed")));
  const counts = new Map<string, number>();
  for (let w = 0; w < weeks; w++) counts.set(addDays(first, w * 7), 0);
  for (const r of rows) {
    if (r.kind !== "workout" || r.date < first) continue;
    const k = weekStart(r.date);
    if (counts.has(k)) counts.set(k, counts.get(k)! + 1);
  }
  return [...counts].map(([week, workouts]) => ({ week, workouts }));
}

/** Best estimated 1RM per session date for each loaded lift; lifts ordered by how often they were logged. */
export async function strengthHistory(userId: string) {
  const rows = await db
    .select({ exerciseId: schema.workoutSets.exerciseId, reps: schema.workoutSets.reps, weightKg: schema.workoutSets.weightKg, date: schema.workoutSessions.date })
    .from(schema.workoutSets)
    .innerJoin(schema.workoutSessions, eq(schema.workoutSessions.id, schema.workoutSets.sessionId))
    .where(and(eq(schema.workoutSessions.userId, userId), eq(schema.workoutSessions.status, "completed"), eq(schema.workoutSets.done, true)));
  const best = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (r.weightKg == null || !r.reps) continue;
    const e1rm = estimatedOneRepMax(r.weightKg, r.reps);
    const byDate = best.get(r.exerciseId) ?? new Map<string, number>();
    byDate.set(r.date, Math.max(byDate.get(r.date) ?? 0, e1rm));
    best.set(r.exerciseId, byDate);
  }
  return [...best]
    .map(([exerciseId, byDate]) => ({ exerciseId, points: [...byDate].map(([date, e1rm]) => ({ date, e1rm })).sort((a, b) => a.date.localeCompare(b.date)) }))
    .sort((a, b) => b.points.length - a.points.length);
}
