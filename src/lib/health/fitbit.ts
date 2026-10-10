import type { CardioActivity, CardioIntensity } from "@/lib/workouts/cardio";
import type { HealthDay, HealthImport, ImportedWorkout } from "./types";

/**
 * Fitbit data export (Fitbit app → Settings → "Export your data", or Google
 * Takeout → Fitbit). The "Global Export Data" folder holds one JSON file per
 * metric and month, e.g. steps-2026-09-01.json, sleep-2026-09-01.json,
 * resting_heart_rate-2026-09-01.json, very_active_minutes-…, exercise-0.json.
 * A plain CSV with date, steps, active_minutes, resting_hr, sleep_minutes
 * columns is accepted too, for any other tracker.
 */

/** "09/25/26 07:00:00" or "2026-09-25…" → "2026-09-25". */
export function fitbitDate(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = s.match(/^(\d{2})\/(\d{2})\/(\d{2,4})/);
  if (!us) return null;
  const year = us[3].length === 2 ? `20${us[3]}` : us[3];
  return `${year}-${us[1]}-${us[2]}`;
}

const ACTIVITY: [RegExp, CardioActivity][] = [
  [/walk|hike/i, "walk"],
  [/run|jog|treadmill/i, "run"],
  [/bike|cycl|spinning/i, "cycle"],
  [/swim/i, "swim"],
  [/rope|skip/i, "skipping"],
  [/stair/i, "stairs"],
  [/danc|zumba/i, "dance"],
  [/yoga|pilates/i, "yoga"],
  [/cricket|badminton|tennis|football|soccer|basketball|sport/i, "sport"],
];

type Acc = { steps: Map<string, number>; active: Map<string, number>; sleep: Map<string, number>; rhr: Map<string, number>; workouts: ImportedWorkout[] };

export function createFitbitParser(since: string) {
  const acc: Acc = { steps: new Map(), active: new Map(), sleep: new Map(), rhr: new Map(), workouts: [] };
  const inc = (m: Map<string, number>, d: string | null, v: number) => {
    if (d && d >= since && Number.isFinite(v)) m.set(d, (m.get(d) ?? 0) + v);
  };

  function addJson(fileName: string, data: unknown) {
    const name = fileName.toLowerCase().split("/").pop() ?? "";
    if (!Array.isArray(data)) return;
    if (name.startsWith("steps-")) {
      for (const r of data) inc(acc.steps, fitbitDate(r?.dateTime), Number(r?.value));
    } else if (name.startsWith("very_active_minutes-") || name.startsWith("moderately_active_minutes-")) {
      for (const r of data) inc(acc.active, fitbitDate(r?.dateTime), Number(r?.value));
    } else if (name.startsWith("sleep-")) {
      for (const r of data) {
        const d = fitbitDate(r?.dateOfSleep);
        // Count only the main sleep, as the Fitbit app does for "time asleep".
        if (d && d >= since && r?.isMainSleep !== false) acc.sleep.set(d, Number(r?.minutesAsleep) || 0);
      }
    } else if (name.startsWith("resting_heart_rate-")) {
      for (const r of data) {
        const d = fitbitDate(r?.value?.date ?? r?.dateTime);
        const v = Number(r?.value?.value);
        if (d && d >= since && v > 0) acc.rhr.set(d, Math.round(v));
      }
    } else if (name.startsWith("exercise-")) {
      for (const r of data) {
        const d = fitbitDate(r?.startTime);
        const minutes = Math.round(Number(r?.activeDuration ?? r?.duration) / 60000);
        if (!d || d < since || !(minutes >= 1)) continue;
        const label = String(r?.activityName ?? "");
        const activity = ACTIVITY.find(([re]) => re.test(label))?.[1];
        if (!activity) continue; // strength and unknown sessions aren't cardio
        const hr = Number(r?.averageHeartRate);
        const intensity: CardioIntensity = hr >= 140 ? "vigorous" : hr && hr < 100 ? "light" : "moderate";
        acc.workouts.push({ externalId: String(r?.logId ?? `${label}@${r?.startTime}`), date: d, activity, intensity, minutes: Math.min(600, minutes) });
      }
    }
  }

  /** CSV: header row with any of date, steps, active_minutes, resting_hr, sleep_minutes. */
  function addCsv(text: string) {
    const [head, ...rows] = text.trim().split(/\r?\n/);
    const cols = head.split(",").map((c) => c.trim().toLowerCase());
    const at = (row: string[], key: string) => {
      const i = cols.indexOf(key);
      return i >= 0 && row[i]?.trim() ? Number(row[i]) : NaN;
    };
    for (const line of rows) {
      const row = line.split(",");
      const d = fitbitDate(row[cols.indexOf("date")]?.trim());
      if (!d || d < since) continue;
      if (Number.isFinite(at(row, "steps"))) acc.steps.set(d, at(row, "steps"));
      if (Number.isFinite(at(row, "active_minutes"))) acc.active.set(d, at(row, "active_minutes"));
      if (Number.isFinite(at(row, "resting_hr"))) acc.rhr.set(d, at(row, "resting_hr"));
      if (Number.isFinite(at(row, "sleep_minutes"))) acc.sleep.set(d, at(row, "sleep_minutes"));
    }
  }

  function finish(): HealthImport {
    const dates = new Set([...acc.steps.keys(), ...acc.active.keys(), ...acc.sleep.keys(), ...acc.rhr.keys()]);
    const days: HealthDay[] = [...dates].sort().map((date) => ({
      date,
      steps: acc.steps.has(date) ? Math.round(acc.steps.get(date)!) : null,
      activeMinutes: acc.active.has(date) ? Math.round(acc.active.get(date)!) : null,
      restingHr: acc.rhr.get(date) ?? null,
      sleepMinutes: acc.sleep.has(date) ? Math.round(acc.sleep.get(date)!) : null,
    }));
    return { days, workouts: acc.workouts };
  }

  return { addJson, addCsv, finish };
}
