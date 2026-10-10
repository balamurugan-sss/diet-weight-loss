import type { CardioActivity, CardioIntensity } from "@/lib/workouts/cardio";
import type { HealthDay, HealthImport, ImportedWorkout } from "./types";

/**
 * Streaming parser for Apple Health's export.xml (Health app → profile →
 * Export All Health Data). The file is often hundreds of MB, so it is read in
 * chunks in the browser and only daily totals are kept.
 *
 * Steps and sleep are recorded by several sources at once (iPhone and Watch);
 * per day we sum each source separately and keep the largest, which is how to
 * avoid double counting without Apple's own merge logic.
 */

const ASLEEP = new Set([
  "HKCategoryValueSleepAnalysisAsleep",
  "HKCategoryValueSleepAnalysisAsleepUnspecified",
  "HKCategoryValueSleepAnalysisAsleepCore",
  "HKCategoryValueSleepAnalysisAsleepDeep",
  "HKCategoryValueSleepAnalysisAsleepREM",
]);

const WORKOUT_TYPES: Record<string, CardioActivity> = {
  HKWorkoutActivityTypeWalking: "walk",
  HKWorkoutActivityTypeHiking: "walk",
  HKWorkoutActivityTypeRunning: "run",
  HKWorkoutActivityTypeCycling: "cycle",
  HKWorkoutActivityTypeSwimming: "swim",
  HKWorkoutActivityTypeJumpRope: "skipping",
  HKWorkoutActivityTypeStairClimbing: "stairs",
  HKWorkoutActivityTypeStairs: "stairs",
  HKWorkoutActivityTypeDance: "dance",
  HKWorkoutActivityTypeSocialDance: "dance",
  HKWorkoutActivityTypeCardioDance: "dance",
  HKWorkoutActivityTypeYoga: "yoga",
  HKWorkoutActivityTypeCricket: "sport",
  HKWorkoutActivityTypeBadminton: "sport",
  HKWorkoutActivityTypeTennis: "sport",
  HKWorkoutActivityTypeSoccer: "sport",
  HKWorkoutActivityTypeBasketball: "sport",
};
const VIGOROUS: Set<CardioActivity> = new Set(["run", "skipping", "swim"]);
const LIGHT: Set<CardioActivity> = new Set(["yoga"]);

type SourceSums = Map<string, Map<string, number>>; // date → source → sum

export type AppleParser = {
  push(text: string): void;
  finish(): HealthImport;
};

function attrs(tag: string) {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/(\w+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

const dateOf = (s: string | undefined) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null);
// "2026-10-01 07:30:00 +0530" → epoch ms
const timeOf = (s: string) => Date.parse(s.replace(" ", "T").replace(" ", "").replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));

function add(map: SourceSums, date: string, source: string, value: number) {
  const bySource = map.get(date) ?? new Map<string, number>();
  bySource.set(source, (bySource.get(source) ?? 0) + value);
  map.set(date, bySource);
}
const best = (map: SourceSums, date: string) => {
  const bySource = map.get(date);
  return bySource ? Math.max(...bySource.values()) : null;
};

/** `since` (YYYY-MM-DD) drops older data so the summary stays small. */
export function createAppleHealthParser(since: string): AppleParser {
  const steps: SourceSums = new Map();
  const exercise: SourceSums = new Map();
  const sleep: SourceSums = new Map();
  const rhr = new Map<string, number[]>();
  const workouts: ImportedWorkout[] = [];
  let tail = "";

  const handle = (kind: string, a: Record<string, string>) => {
    if (kind === "Workout") {
      const date = dateOf(a.startDate);
      const activity = WORKOUT_TYPES[a.workoutActivityType ?? ""];
      if (!date || date < since || !activity) return;
      const raw = Number(a.duration);
      const minutes = Math.round(a.durationUnit === "s" ? raw / 60 : a.durationUnit === "hr" ? raw * 60 : raw);
      if (!(minutes >= 1)) return;
      const intensity: CardioIntensity = VIGOROUS.has(activity) ? "vigorous" : LIGHT.has(activity) ? "light" : "moderate";
      workouts.push({ externalId: `${a.workoutActivityType}@${a.startDate}`, date, activity, intensity, minutes: Math.min(600, minutes) });
      return;
    }
    const type = a.type;
    const source = a.sourceName ?? "?";
    if (type === "HKCategoryTypeIdentifierSleepAnalysis") {
      // Sleep counts towards the morning you wake up.
      const date = dateOf(a.endDate);
      if (!date || date < since || !ASLEEP.has(a.value ?? "")) return;
      const minutes = (timeOf(a.endDate) - timeOf(a.startDate)) / 60000;
      if (minutes > 0 && minutes < 1440) add(sleep, date, source, minutes);
      return;
    }
    const date = dateOf(a.startDate);
    if (!date || date < since) return;
    const value = Number(a.value);
    if (!Number.isFinite(value)) return;
    if (type === "HKQuantityTypeIdentifierStepCount") add(steps, date, source, value);
    else if (type === "HKQuantityTypeIdentifierAppleExerciseTime") add(exercise, date, source, value);
    else if (type === "HKQuantityTypeIdentifierRestingHeartRate") rhr.set(date, [...(rhr.get(date) ?? []), value]);
  };

  return {
    push(text: string) {
      const chunk = tail + text;
      // Keep any unfinished tag for the next chunk.
      const cut = chunk.lastIndexOf(">") + 1;
      tail = chunk.slice(cut);
      for (const m of chunk.slice(0, cut).matchAll(/<(Record|Workout)\s([^>]*?)\/?>/g)) handle(m[1], attrs(m[2]));
    },
    finish(): HealthImport {
      const dates = new Set([...steps.keys(), ...exercise.keys(), ...sleep.keys(), ...rhr.keys()]);
      const days: HealthDay[] = [...dates].sort().map((date) => {
        const s = best(steps, date);
        const e = best(exercise, date);
        const sl = best(sleep, date);
        const r = rhr.get(date);
        return {
          date,
          steps: s == null ? null : Math.round(s),
          activeMinutes: e == null ? null : Math.round(e),
          sleepMinutes: sl == null ? null : Math.round(Math.min(sl, 1440)),
          restingHr: r ? Math.round(r.reduce((x, y) => x + y, 0) / r.length) : null,
        };
      });
      return { days, workouts };
    },
  };
}
