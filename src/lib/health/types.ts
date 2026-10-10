import { z } from "zod";
import { CARDIO_ACTIVITY_IDS, CARDIO_INTENSITIES, type CardioActivity, type CardioIntensity } from "@/lib/workouts/cardio";

export const HEALTH_SOURCES = ["apple_health", "fitbit_export", "google_fit_export", "google_health", "manual"] as const;
export type HealthSource = (typeof HEALTH_SOURCES)[number];

/** One day's totals from a wearable or phone. Missing values stay null. Sleep counts towards the morning you wake up. */
export type HealthDay = {
  date: string;
  steps: number | null;
  activeMinutes: number | null;
  restingHr: number | null;
  sleepMinutes: number | null;
  /** Average and highest heart rate over the day. */
  avgHr: number | null;
  maxHr: number | null;
  /** 24 hourly average heart rates (local hours 0–23), null where nothing was recorded. */
  hrHourly: (number | null)[] | null;
  /** Time in bed for the main sleep, and its deep / REM stage minutes. */
  inBedMinutes: number | null;
  deepMinutes: number | null;
  remMinutes: number | null;
  /** Local "HH:MM" the main sleep started and ended (wake-up). */
  sleepStart: string | null;
  wakeTime: string | null;
  /** The device's own sleep score (Fitbit), 0–100. Movewell's estimate is computed separately. */
  sleepScore: number | null;
  /** Active energy burned (kcal), when the device records it (Apple Health). */
  activeKcal: number | null;
};

export const HEALTH_FIELDS = [
  "steps",
  "activeMinutes",
  "restingHr",
  "sleepMinutes",
  "avgHr",
  "maxHr",
  "hrHourly",
  "inBedMinutes",
  "deepMinutes",
  "remMinutes",
  "sleepStart",
  "wakeTime",
  "sleepScore",
  "activeKcal",
] as const satisfies readonly (keyof HealthDay)[];

export const emptyDay = (date: string): HealthDay => ({
  date,
  steps: null,
  activeMinutes: null,
  restingHr: null,
  sleepMinutes: null,
  avgHr: null,
  maxHr: null,
  hrHourly: null,
  inBedMinutes: null,
  deepMinutes: null,
  remMinutes: null,
  sleepStart: null,
  wakeTime: null,
  sleepScore: null,
  activeKcal: null,
});

/** "HH:MM" from minutes after midnight. */
export const hhmm = (minutes: number) => {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** Averages hourly buckets of [sum, count] into 24 rounded values (null when empty). */
export function hourlyAverages(buckets: [number, number][]): (number | null)[] | null {
  if (!buckets.some(([, c]) => c > 0)) return null;
  return buckets.map(([sum, c]) => (c ? Math.round(sum / c) : null));
}
export const newHourBuckets = (): [number, number][] => Array.from({ length: 24 }, () => [0, 0] as [number, number]);

export type ImportedWorkout = {
  externalId: string;
  date: string;
  activity: CardioActivity;
  intensity: CardioIntensity;
  minutes: number;
};

export type HealthImport = { days: HealthDay[]; workouts: ImportedWorkout[] };

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const n = (max: number) => z.number().min(0).max(max).nullable();
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** What a browser import sends to the server: compact daily totals only, never the raw export. */
export const HealthImportInput = z.object({
  source: z.enum(["apple_health", "fitbit_export", "google_fit_export"]),
  days: z
    .array(
      z.object({
        date: day,
        steps: n(200_000),
        activeMinutes: n(1440),
        restingHr: n(250),
        sleepMinutes: n(1440),
        avgHr: n(250),
        maxHr: n(250),
        hrHourly: z.array(n(250)).length(24).nullable(),
        inBedMinutes: n(1440),
        deepMinutes: n(1440),
        remMinutes: n(1440),
        sleepStart: clock.nullable(),
        wakeTime: clock.nullable(),
        sleepScore: n(100),
        activeKcal: n(10_000),
      }),
    )
    .max(200),
  workouts: z
    .array(
      z.object({
        externalId: z.string().min(1).max(200),
        date: day,
        activity: z.enum(CARDIO_ACTIVITY_IDS as [CardioActivity, ...CardioActivity[]]),
        intensity: z.enum(CARDIO_INTENSITIES),
        minutes: z.number().int().min(1).max(600),
      }),
    )
    .max(1000),
});

export const IMPORT_DAYS = 90;
