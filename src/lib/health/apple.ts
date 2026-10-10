import type { CardioActivity, CardioIntensity } from "@/lib/workouts/cardio";
import { emptyDay, hourlyAverages, newHourBuckets, type HealthDay, type HealthImport, type ImportedWorkout } from "./types";

/**
 * Streaming parser for Apple Health's export.xml (Health app → profile →
 * Export All Health Data). The file is often hundreds of MB, so it is read in
 * chunks in the browser and only daily totals are kept.
 *
 * Steps and sleep are recorded by several sources at once (iPhone and Watch);
 * per day we sum each source separately and keep the largest, which is how to
 * avoid double counting without Apple's own merge logic. Heart rate is kept
 * as a daily average, maximum and 24 hourly averages — never the raw samples.
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
const DEEP = "HKCategoryValueSleepAnalysisAsleepDeep";
const REM = "HKCategoryValueSleepAnalysisAsleepREM";
const IN_BED = "HKCategoryValueSleepAnalysisInBed";
const AWAKE = "HKCategoryValueSleepAnalysisAwake";

type Night = { asleep: number; deep: number; rem: number; inBed: number; start: number; end: number; startClock: string; endClock: string };
type HrDay = { sum: number; count: number; max: number; hours: [number, number][] };

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
// "2026-10-01 07:30:00 +0530" → local "07:30" (the export writes local time with its offset)
const clockOf = (s: string) => s.slice(11, 16);
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
  const nights = new Map<string, Map<string, Night>>(); // wake date → source → night
  const hr = new Map<string, HrDay>();
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
      const value = a.value ?? "";
      if (!date || date < since || !(ASLEEP.has(value) || value === IN_BED || value === AWAKE)) return;
      const start = timeOf(a.startDate);
      const end = timeOf(a.endDate);
      const minutes = (end - start) / 60000;
      if (!(minutes > 0 && minutes < 1440)) return;
      const bySource = nights.get(date) ?? new Map<string, Night>();
      const n = bySource.get(source) ?? { asleep: 0, deep: 0, rem: 0, inBed: 0, start: Infinity, end: -Infinity, startClock: "", endClock: "" };
      if (value === IN_BED) n.inBed += minutes;
      else {
        if (ASLEEP.has(value)) n.asleep += minutes;
        if (value === DEEP) n.deep += minutes;
        if (value === REM) n.rem += minutes;
        if (start < n.start) [n.start, n.startClock] = [start, clockOf(a.startDate)];
        if (end > n.end) [n.end, n.endClock] = [end, clockOf(a.endDate)];
      }
      bySource.set(source, n);
      nights.set(date, bySource);
      return;
    }
    if (type === "HKQuantityTypeIdentifierHeartRate") {
      const date = dateOf(a.startDate);
      const bpm = Number(a.value);
      if (!date || date < since || !(bpm > 20 && bpm < 250)) return;
      const d = hr.get(date) ?? { sum: 0, count: 0, max: 0, hours: newHourBuckets() };
      d.sum += bpm;
      d.count++;
      d.max = Math.max(d.max, bpm);
      const h = Number(a.startDate.slice(11, 13));
      if (h >= 0 && h < 24) {
        d.hours[h][0] += bpm;
        d.hours[h][1]++;
      }
      hr.set(date, d);
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
      const dates = new Set([...steps.keys(), ...exercise.keys(), ...nights.keys(), ...rhr.keys(), ...hr.keys()]);
      const days: HealthDay[] = [...dates].sort().map((date) => {
        const s = best(steps, date);
        const e = best(exercise, date);
        const r = rhr.get(date);
        const h = hr.get(date);
        // The night from the source that recorded the most sleep.
        const night = [...(nights.get(date)?.values() ?? [])].filter((n) => n.asleep > 0).sort((a, b) => b.asleep - a.asleep)[0];
        const span = night ? (night.end - night.start) / 60000 : 0;
        return {
          ...emptyDay(date),
          steps: s == null ? null : Math.round(s),
          activeMinutes: e == null ? null : Math.round(e),
          restingHr: r ? Math.round(r.reduce((x, y) => x + y, 0) / r.length) : null,
          sleepMinutes: night ? Math.round(Math.min(night.asleep, 1440)) : null,
          inBedMinutes: night ? Math.round(Math.min(Math.max(night.inBed, span, night.asleep), 1440)) : null,
          // Stage minutes only exist on Apple Watch nights with sleep stages (watchOS 9+).
          deepMinutes: night && night.deep + night.rem > 0 ? Math.round(night.deep) : null,
          remMinutes: night && night.deep + night.rem > 0 ? Math.round(night.rem) : null,
          sleepStart: night?.startClock || null,
          wakeTime: night?.endClock || null,
          avgHr: h?.count ? Math.round(h.sum / h.count) : null,
          maxHr: h?.count ? Math.round(h.max) : null,
          hrHourly: h ? hourlyAverages(h.hours) : null,
        };
      });
      return { days, workouts };
    },
  };
}
