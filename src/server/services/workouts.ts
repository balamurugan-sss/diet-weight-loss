import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { profileAge } from "@/lib/profile/health";
import { applySwaps, availableEquipment, generateProgram, type ProgramInput, type SelectionContext } from "@/lib/workouts/generator";
import { replayProgram, type Completion } from "@/lib/workouts/progress";
import type { DaysPerWeek, ProgramDay, WorkoutProfileInput } from "@/lib/workouts/types";
import type { Profile } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { todayISO } from "@/server/time";
import { latestWeight } from "./progress";

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
