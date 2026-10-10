import type { CardioActivity, CardioIntensity } from "@/lib/workouts/cardio";
import type { ImportedWorkout } from "./types";

/**
 * Google Health API (v4) — the cloud API for Fitbit devices (including
 * Fitbit Air) and Pixel Watch since the legacy Fitbit Web API was retired on
 * 2026-09-30. Request/response shapes follow the v4 reference and observed
 * responses: daily roll-ups for steps, active minutes and heart rate
 * (average / max), an hourly heart-rate roll-up for today, list + filter for
 * sleep (keyed to the wake-up date, with stages), daily resting heart rate and
 * exercise sessions. Parsers are lenient: a missing field means "no data".
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

/** AIP-160 filter for list calls. Sleep only filters by end (wake) date; exercise by civil start date; resting HR by its date. */
export function listFilter(dataType: "sleep" | "exercise" | "daily-resting-heart-rate", from: string, toExclusive: string) {
  const member =
    dataType === "sleep" ? "sleep.interval.civil_end_time" : dataType === "exercise" ? "exercise.interval.civil_start_time" : "daily_resting_heart_rate.date";
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

type Interval = { startTime?: string; startUtcOffset?: string; endTime?: string; endUtcOffset?: string };
type SleepStage = Interval & { type?: string; interval?: Interval };
type SleepPoint = {
  sleep?: {
    interval?: Interval;
    metadata?: { mainSleep?: boolean };
    summary?: { minutesAsleep?: string | number; minutesInSleepPeriod?: string | number };
    stages?: SleepStage[];
    sleepStages?: SleepStage[];
  };
};

/** Local "HH:MM" of an RFC3339 instant plus a "19800s"-style UTC offset. */
export function localClock(instant: string | undefined, offset: string | undefined) {
  if (!instant) return null;
  const ms = Date.parse(instant);
  if (Number.isNaN(ms)) return null;
  const off = Number((offset ?? "0s").replace("s", "")) || 0;
  return new Date(ms + off * 1000).toISOString().slice(11, 16);
}

export type Night = { minutes: number; inBed: number | null; deep: number | null; rem: number | null; start: string | null; wake: string | null };

/** Main sleep per wake-up date: minutes asleep, time in bed, deep / REM stage minutes, bed and wake times. */
export function parseSleepNights(body: unknown): Map<string, Night> {
  const out = new Map<string, Night>();
  for (const p of ((body as { dataPoints?: SleepPoint[] })?.dataPoints ?? [])) {
    const s = p.sleep;
    if (!s || s.metadata?.mainSleep === false) continue;
    const iv = s.interval ?? {};
    const date = localDate(iv.endTime, iv.endUtcOffset);
    const minutes = Number(s.summary?.minutesAsleep);
    if (!date || !(minutes > 0) || minutes <= (out.get(date)?.minutes ?? 0)) continue;
    const span = (Date.parse(iv.endTime ?? "") - Date.parse(iv.startTime ?? "")) / 60000;
    const inBed = Number(s.summary?.minutesInSleepPeriod) || (span > 0 ? Math.round(span) : null);
    const stages = s.stages ?? s.sleepStages ?? [];
    const stageMin = (kind: string) =>
      stages
        .filter((st) => (st.type ?? "").toUpperCase().includes(kind))
        .reduce((a, st) => {
          const i = st.interval ?? st;
          const m = (Date.parse(i.endTime ?? "") - Date.parse(i.startTime ?? "")) / 60000;
          return a + (m > 0 ? m : 0);
        }, 0);
    const staged = stages.some((st) => /DEEP|REM/i.test(st.type ?? ""));
    out.set(date, {
      minutes,
      inBed,
      deep: staged ? Math.round(stageMin("DEEP")) : null,
      rem: staged ? Math.round(stageMin("REM")) : null,
      start: localClock(iv.startTime, iv.startUtcOffset),
      wake: localClock(iv.endTime, iv.endUtcOffset),
    });
  }
  return out;
}

/** Main-sleep minutes per wake-up date. */
export function parseSleep(body: unknown): Map<string, number> {
  return new Map([...parseSleepNights(body)].map(([d, n]) => [d, n.minutes]));
}

type RhrPoint = { dailyRestingHeartRate?: { date?: { year?: number; month?: number; day?: number }; beatsPerMinute?: string | number } };

/** `daily-resting-heart-rate` list → bpm per date. */
export function parseRestingHr(body: unknown): Map<string, number> {
  const out = new Map<string, number>();
  for (const p of ((body as { dataPoints?: RhrPoint[] })?.dataPoints ?? [])) {
    const r = p.dailyRestingHeartRate;
    const date = fromCivil(r?.date ? { date: r.date } : undefined);
    const bpm = Number(r?.beatsPerMinute);
    if (date && bpm > 0) out.set(date, Math.round(bpm));
  }
  return out;
}

type HrValue = { beatsPerMinuteAvg?: string | number; beatsPerMinuteMax?: string | number };
type HrRollupPoint = { civilStartTime?: Parameters<typeof fromCivil>[0]; startTime?: string; heartRate?: HrValue };

/** heart-rate dailyRollUp → { avg, max } per date. */
export function parseHeartRollup(body: unknown): Map<string, { avg: number | null; max: number | null }> {
  const out = new Map<string, { avg: number | null; max: number | null }>();
  for (const p of ((body as { rollupDataPoints?: HrRollupPoint[] })?.rollupDataPoints ?? [])) {
    const date = fromCivil(p.civilStartTime);
    const avg = Number(p.heartRate?.beatsPerMinuteAvg);
    const max = Number(p.heartRate?.beatsPerMinuteMax);
    if (date && (avg > 0 || max > 0)) out.set(date, { avg: avg > 0 ? Math.round(avg) : null, max: max > 0 ? Math.round(max) : null });
  }
  return out;
}

/** heart-rate rollUp in 1-hour windows → 24 hourly averages, using `hourOf` to place each window in local time. */
export function parseHourlyHeart(body: unknown, hourOf: (instant: string) => number | null): (number | null)[] | null {
  const hours: (number | null)[] = Array(24).fill(null);
  for (const p of ((body as { rollupDataPoints?: HrRollupPoint[] })?.rollupDataPoints ?? [])) {
    const h = p.startTime ? hourOf(p.startTime) : null;
    const avg = Number(p.heartRate?.beatsPerMinuteAvg);
    if (h != null && h >= 0 && h < 24 && avg > 0) hours[h] = Math.round(avg);
  }
  return hours.some((v) => v != null) ? hours : null;
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
