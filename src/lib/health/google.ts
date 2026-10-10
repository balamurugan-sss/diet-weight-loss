import type { CardioActivity, CardioIntensity } from "@/lib/workouts/cardio";
import type { ImportedWorkout } from "./types";

/**
 * Google Health API (v4) — the cloud API for Fitbit devices (including
 * Fitbit Air) and Pixel Watch since the legacy Fitbit Web API was retired on
 * 2026-09-30. Request/response shapes follow the v4 reference and observed
 * responses: daily roll-ups for steps and active minutes, list + filter for
 * sleep (keyed to the wake-up date) and exercise sessions.
 */
export const GOOGLE_HEALTH = {
  apiBase: "https://health.googleapis.com/v4",
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  scopes: [
    "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
    "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
    "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
  ],
};

type Civil = { date: { year: number; month: number; day: number }; time: Record<string, number> };

const toCivil = (iso: string): Civil => {
  const [year, month, day] = iso.split("-").map(Number);
  return { date: { year, month, day }, time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 } };
};
const fromCivil = (c: { date?: { year?: number; month?: number; day?: number } } | undefined) =>
  c?.date?.year ? `${c.date.year}-${String(c.date.month).padStart(2, "0")}-${String(c.date.day).padStart(2, "0")}` : null;

/** dailyRollUp body: start inclusive, end exclusive (the day after `to`). Active minutes allow ≤14 days. */
export function dailyRollUpBody(from: string, toExclusive: string) {
  return { range: { start: toCivil(from), end: toCivil(toExclusive) }, windowSizeDays: 1 };
}

/** AIP-160 filter for list calls. Sleep only filters by end (wake) date; exercise by civil start date. */
export function listFilter(dataType: "sleep" | "exercise", from: string, toExclusive: string) {
  const member = dataType === "sleep" ? "sleep.interval.civil_end_time" : "exercise.interval.civil_start_time";
  return `${member} >= "${from}" AND ${member} < "${toExclusive}"`;
}

type RollupPoint = { civilStartTime?: Parameters<typeof fromCivil>[0] } & Record<string, unknown>;

/** Reads `{ rollupDataPoints: [{ civilStartTime, steps: { countSum: "9525" } }] }` — the value is the first *Sum field. */
export function parseDailyRollUp(body: unknown, field: string): Map<string, number> {
  const out = new Map<string, number>();
  const points = (body as { rollupDataPoints?: RollupPoint[] })?.rollupDataPoints ?? [];
  for (const p of points) {
    const date = fromCivil(p.civilStartTime);
    const obj = p[field] as Record<string, unknown> | undefined;
    if (!date || !obj) continue;
    const key = Object.keys(obj).find((k) => k.endsWith("Sum")) ?? Object.keys(obj)[0];
    const value = Number(obj[key as string]);
    if (Number.isFinite(value)) out.set(date, value);
  }
  return out;
}

/** Local calendar date of an RFC3339 instant plus a "32400s"-style UTC offset. */
export function localDate(instant: string | undefined, offset: string | undefined) {
  if (!instant) return null;
  const ms = Date.parse(instant);
  if (Number.isNaN(ms)) return null;
  const off = Number((offset ?? "0s").replace("s", "")) || 0;
  return new Date(ms + off * 1000).toISOString().slice(0, 10);
}

type SleepPoint = {
  sleep?: {
    interval?: { endTime?: string; endUtcOffset?: string };
    metadata?: { mainSleep?: boolean };
    summary?: { minutesAsleep?: string | number };
  };
};

/** Main-sleep minutes per wake-up date. */
export function parseSleep(body: unknown): Map<string, number> {
  const out = new Map<string, number>();
  for (const p of ((body as { dataPoints?: SleepPoint[] })?.dataPoints ?? [])) {
    const s = p.sleep;
    if (!s || s.metadata?.mainSleep === false) continue;
    const date = localDate(s.interval?.endTime, s.interval?.endUtcOffset);
    const minutes = Number(s.summary?.minutesAsleep);
    if (date && minutes > 0) out.set(date, Math.max(out.get(date) ?? 0, minutes));
  }
  return out;
}

const EXERCISE_TYPES: [RegExp, CardioActivity][] = [
  [/WALK|HIK/, "walk"],
  [/RUN|TREADMILL/, "run"],
  [/BIK|CYCL|SPIN/, "cycle"],
  [/SWIM/, "swim"],
  [/JUMP_ROPE|SKIP/, "skipping"],
  [/STAIR/, "stairs"],
  [/DANC/, "dance"],
  [/YOGA|PILATES/, "yoga"],
  [/CRICKET|BADMINTON|TENNIS|SOCCER|FOOTBALL|BASKETBALL|SPORT/, "sport"],
  [/CARDIO|AEROBIC|ELLIPTICAL|HIIT/, "other"],
];

type ExercisePoint = {
  name?: string;
  exercise?: {
    interval?: { startTime?: string; startUtcOffset?: string };
    exerciseType?: string;
    activeDuration?: string;
    metricsSummary?: { heartRateZoneDurations?: Record<string, string> };
  };
};

const seconds = (d: string | undefined) => Number((d ?? "0s").replace("s", "")) || 0;

/** Cardio sessions from `exercise` data points; strength sessions are skipped (the app tracks those itself). */
export function parseExercise(body: unknown): ImportedWorkout[] {
  const out: ImportedWorkout[] = [];
  for (const p of ((body as { dataPoints?: ExercisePoint[] })?.dataPoints ?? [])) {
    const e = p.exercise;
    if (!e) continue;
    const activity = EXERCISE_TYPES.find(([re]) => re.test(e.exerciseType ?? ""))?.[1];
    const date = localDate(e.interval?.startTime, e.interval?.startUtcOffset);
    const minutes = Math.round(seconds(e.activeDuration) / 60);
    if (!activity || !date || minutes < 1) continue;
    const z = e.metricsSummary?.heartRateZoneDurations ?? {};
    const hard = seconds(z.vigorousTime) + seconds(z.peakTime);
    const moderate = seconds(z.moderateTime);
    const intensity: CardioIntensity = hard > moderate ? "vigorous" : moderate > 0 || !Object.keys(z).length ? "moderate" : "light";
    out.push({ externalId: p.name ?? `${e.exerciseType}@${e.interval?.startTime}`, date, activity, intensity, minutes: Math.min(600, minutes) });
  }
  return out;
}
