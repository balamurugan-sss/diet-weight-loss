import { z } from "zod";
import { CARDIO_ACTIVITY_IDS, CARDIO_INTENSITIES, type CardioActivity, type CardioIntensity } from "@/lib/workouts/cardio";

export const HEALTH_SOURCES = ["apple_health", "fitbit_export", "google_health", "manual"] as const;
export type HealthSource = (typeof HEALTH_SOURCES)[number];

/** One day's totals from a wearable or phone. Missing values stay null. */
export type HealthDay = {
  date: string;
  steps: number | null;
  activeMinutes: number | null;
  restingHr: number | null;
  sleepMinutes: number | null;
};

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

/** What a browser import sends to the server: compact daily totals only, never the raw export. */
export const HealthImportInput = z.object({
  source: z.enum(["apple_health", "fitbit_export"]),
  days: z
    .array(z.object({ date: day, steps: n(200_000), activeMinutes: n(1440), restingHr: n(250), sleepMinutes: n(1440) }))
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
