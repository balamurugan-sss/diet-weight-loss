import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { analyseDay, sleepScore } from "@/lib/health/analysis";
import { QUICK_SLOT } from "@/lib/today/quickFoods";
import { buildTimeline, todayPrompts } from "@/lib/today/timeline";
import { addDays } from "@/lib/workouts/progress";
import type { Profile } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { clockAt, todayISO } from "@/server/time";
import { cardioBetween } from "./cardio";
import { getGoogleConnection, healthDaysBetween } from "./health";
import { getActiveProgram, programDay, programProgress } from "./workouts";

export type DayEventKind = (typeof schema.dayEvents.$inferSelect)["kind"];

export async function dayEventsFor(userId: string, date: string) {
  const rows = await db.select().from(schema.dayEvents).where(and(eq(schema.dayEvents.userId, userId), eq(schema.dayEvents.date, date)));
  return Object.fromEntries(rows.map((r) => [r.kind, r.time])) as Partial<Record<DayEventKind, string>>;
}

export async function setDayEvent(userId: string, date: string, kind: DayEventKind, time: string | null) {
  if (time == null) {
    await db.delete(schema.dayEvents).where(and(eq(schema.dayEvents.userId, userId), eq(schema.dayEvents.date, date), eq(schema.dayEvents.kind, kind)));
    return;
  }
  await db
    .insert(schema.dayEvents)
    .values({ id: randomUUID(), userId, date, kind, time })
    .onConflictDoUpdate({ target: [schema.dayEvents.userId, schema.dayEvents.date, schema.dayEvents.kind], set: { time } });
}

/** Everything the Today screen shows: the activity line, the check-ins to ask, and the body data. */
export async function todayOverview(userId: string, profile: Profile, proteinLeftG: number) {
  const date = todayISO();
  const now = clockAt();
  const [events, health, meals, program, sessions, cardio, google] = await Promise.all([
    dayEventsFor(userId, date),
    healthDaysBetween(userId, addDays(date, -21), date),
    db.select().from(schema.mealLogs).where(and(eq(schema.mealLogs.userId, userId), eq(schema.mealLogs.date, date))),
    getActiveProgram(userId),
    db
      .select()
      .from(schema.workoutSessions)
      .where(and(eq(schema.workoutSessions.userId, userId), eq(schema.workoutSessions.date, date)))
      .orderBy(desc(schema.workoutSessions.startedAt))
      .limit(1),
    cardioBetween(userId, date, date),
    getGoogleConnection(userId),
  ]);

  const healthToday = health.find((d) => d.date === date) ?? null;
  const analysis = healthToday ? analyseDay(health, date) : null;
  const latest = healthToday ?? [...health].reverse().find((d) => d.date >= addDays(date, -1)) ?? null;
  const score = latest ? sleepScore(latest, analysis?.baseline.restingHr ?? null) : null;

  const prog = program ? await programProgress(program) : null;
  const plannedDay = program && prog && !prog.finished ? programDay(program, prog.position) : null;
  const session = sessions[0] ?? null;
  const sessionDay = session && program && session.programId === program.id ? programDay(program, session.dayIndex) : null;

  const foods = meals
    .map((m) => ({ time: clockAt(m.createdAt), slot: m.slot, title: m.title, kcal: Math.round(m.kcal), proteinG: Math.round(m.proteinG), logId: m.id }))
    .sort((a, b) => a.time.localeCompare(b.time));
  const wake = events.wake
    ? { time: events.wake, source: "you" as const }
    : healthToday?.wakeTime
      ? { time: healthToday.wakeTime, source: "device" as const }
      : null;

  const timeline = buildTimeline({
    wake,
    sleep: healthToday ? { minutes: healthToday.sleepMinutes, start: healthToday.sleepStart } : null,
    foods,
    workoutPlan: events.workout_plan ?? null,
    session: session
      ? {
          start: clockAt(session.startedAt),
          end: session.finishedAt ? clockAt(session.finishedAt) : null,
          status: session.status,
          dayIndex: session.dayIndex,
          recovery: session.kind === "recovery",
          durationSec: session.durationSec,
          kcal: session.kcal,
        }
      : null,
    // Manually logged cardio has a real time; imported sessions are shown without one.
    cardio: cardio.map((c) => ({ time: c.source === "manual" ? clockAt(c.createdAt) : null, activity: c.activity, minutes: c.minutes, kcal: c.kcal, id: c.id })),
  });

  const lastFood = foods.filter((f) => f.slot !== QUICK_SLOT.morning || f.kcal >= 50).at(-1)?.time ?? null;
  const lastAte = [lastFood, events.ate ?? null].filter((x): x is string => !!x).sort().at(-1) ?? null;
  const prompts = todayPrompts({
    now,
    wakeLogged: !!events.wake,
    morningDrinkLogged: foods.some((f) => f.slot === QUICK_SLOT.morning),
    workoutKind: session ? null : (plannedDay?.kind ?? null),
    sessionStatus: session ? session.status : "none",
    workoutPlan: events.workout_plan ?? null,
    lastAte,
    preWorkoutLogged: foods.some((f) => f.slot === QUICK_SLOT.pre),
    proteinLogged: foods.some((f) => f.slot === QUICK_SLOT.protein),
    sessionEnd: session?.finishedAt ? clockAt(session.finishedAt) : null,
    proteinLeftG,
  });

  return {
    date,
    now,
    events,
    timeline,
    prompts,
    deviceWake: healthToday?.wakeTime ?? null,
    workout: {
      program: program ? { id: program.id } : null,
      position: prog?.position ?? null,
      plannedDay,
      session: session ? { ...session, day: sessionDay } : null,
    },
    health: { today: healthToday, latest, analysis, score, connected: { google: !!google, any: health.length > 0 } },
  };
}

export type TodayOverview = Awaited<ReturnType<typeof todayOverview>>;
