import type { CardioActivity, CardioIntensity } from "@/lib/workouts/cardio";
import { emptyDay, hourlyAverages, newHourBuckets, type HealthDay, type HealthImport, type ImportedWorkout } from "./types";

/**
 * File exports that aren't Apple Health:
 *
 * - Fitbit data export (Fitbit app → Settings → "Export your data", or Google
 *   Takeout → Fitbit). The "Global Export Data" folder holds one JSON file per
 *   metric and month or day, e.g. steps-2026-09-01.json, sleep-2026-09-01.json,
 *   resting_heart_rate-2026-09-01.json, heart_rate-2026-09-25.json,
 *   very_active_minutes-…, exercise-0.json; the "Sleep Score" folder has
 *   sleep_score.csv.
 * - Google Fit via Google Takeout → Fit → "Daily activity metrics": the summary
 *   CSV (one row per day) and the per-day CSVs (15-minute rows, used for the
 *   hourly heart-rate line).
 * - A plain CSV with date, steps, active_minutes, resting_hr, sleep_minutes,
 *   avg_hr, max_hr, sleep_score columns, for any other tracker.
 *
 * Fitbit's intraday heart-rate and sleep-score timestamps are treated as UTC
 * (as its step files are) and moved to the phone's time zone with
 * `utcOffsetMinutes`; sleep logs are already in local time.
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

/** "09/25/26 07:00:05" / "2026-09-25T07:00:05" (UTC) → local date and minutes after midnight. */
function shiftUtc(s: unknown, offsetMin: number): { date: string; minute: number } | null {
  const date = fitbitDate(s);
  const time = typeof s === "string" ? s.match(/[ T](\d{2}):(\d{2})/) : null;
  if (!date || !time) return null;
  const ms = Date.parse(`${date}T${time[1]}:${time[2]}:00Z`) + offsetMin * 60000;
  const d = new Date(ms);
  return { date: d.toISOString().slice(0, 10), minute: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

/** Local clock from "2026-09-24T23:10:30.000" (already local). */
const localClock = (s: unknown) => (typeof s === "string" && /[ T]\d{2}:\d{2}/.test(s) ? s.match(/[ T](\d{2}:\d{2})/)![1] : null);

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

type Hr = { sum: number; count: number; max: number; hours: [number, number][] };

/** Splits one CSV line, honouring double quotes. */
function cells(line: string) {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export function createFitbitParser(since: string, utcOffsetMinutes = 0) {
  const days = new Map<string, HealthDay>();
  const hr = new Map<string, Hr>();
  const workouts: ImportedWorkout[] = [];
  let googleFit = false;
  let fitbit = false;

  const day = (d: string) => {
    let row = days.get(d);
    if (!row) days.set(d, (row = emptyDay(d)));
    return row;
  };
  const ok = (d: string | null): d is string => !!d && d >= since;
  const inc = (d: string | null, k: "steps" | "activeMinutes", v: number) => {
    if (ok(d) && Number.isFinite(v)) day(d)[k] = (day(d)[k] ?? 0) + v;
  };
  const hrAdd = (date: string, minute: number, bpm: number, max = bpm) => {
    if (!ok(date) || !(bpm > 20 && bpm < 250)) return;
    const h = hr.get(date) ?? { sum: 0, count: 0, max: 0, hours: newHourBuckets() };
    h.sum += bpm;
    h.count++;
    h.max = Math.max(h.max, max);
    const hour = Math.floor(minute / 60);
    h.hours[hour][0] += bpm;
    h.hours[hour][1]++;
    hr.set(date, h);
  };

  function addJson(fileName: string, data: unknown) {
    const name = fileName.toLowerCase().split("/").pop() ?? "";
    if (!Array.isArray(data)) return;
    fitbit = true;
    if (name.startsWith("steps-")) {
      for (const r of data) inc(fitbitDate(r?.dateTime), "steps", Number(r?.value));
    } else if (name.startsWith("very_active_minutes-") || name.startsWith("moderately_active_minutes-")) {
      for (const r of data) inc(fitbitDate(r?.dateTime), "activeMinutes", Number(r?.value));
    } else if (name.startsWith("sleep-")) {
      for (const r of data) {
        const d = fitbitDate(r?.dateOfSleep);
        // Only the main sleep, as the Fitbit app does for "time asleep".
        if (!ok(d) || r?.isMainSleep === false) continue;
        const row = day(d);
        row.sleepMinutes = Number(r?.minutesAsleep) || 0;
        const inBed = Number(r?.timeInBed);
        row.inBedMinutes = inBed > 0 ? inBed : null;
        const summary = r?.levels?.summary;
        // Stage data exists only for "stages" logs; classic logs have asleep / restless / awake.
        row.deepMinutes = summary?.deep ? Number(summary.deep.minutes) || 0 : null;
        row.remMinutes = summary?.rem ? Number(summary.rem.minutes) || 0 : null;
        row.sleepStart = localClock(r?.startTime);
        row.wakeTime = localClock(r?.endTime);
      }
    } else if (name.startsWith("resting_heart_rate-")) {
      for (const r of data) {
        const d = fitbitDate(r?.value?.date ?? r?.dateTime);
        const v = Number(r?.value?.value);
        if (ok(d) && v > 0) day(d).restingHr = Math.round(v);
      }
    } else if (name.startsWith("heart_rate-")) {
      for (const r of data) {
        const at = shiftUtc(r?.dateTime, utcOffsetMinutes);
        if (at) hrAdd(at.date, at.minute, Number(r?.value?.bpm));
      }
    } else if (name.startsWith("exercise-")) {
      for (const r of data) {
        const d = fitbitDate(r?.startTime);
        const minutes = Math.round(Number(r?.activeDuration ?? r?.duration) / 60000);
        if (!ok(d) || !(minutes >= 1)) continue;
        const label = String(r?.activityName ?? "");
        const activity = ACTIVITY.find(([re]) => re.test(label))?.[1];
        if (!activity) continue; // strength and unknown sessions aren't cardio
        const bpm = Number(r?.averageHeartRate);
        const intensity: CardioIntensity = bpm >= 140 ? "vigorous" : bpm && bpm < 100 ? "light" : "moderate";
        workouts.push({ externalId: String(r?.logId ?? `${label}@${r?.startTime}`), date: d, activity, intensity, minutes: Math.min(600, minutes) });
      }
    }
  }

  function addCsv(text: string, fileName = "") {
    const [head, ...rows] = text.trim().split(/\r?\n/);
    const cols = cells(head).map((c) => c.toLowerCase());
    const idx = (...names: string[]) => cols.findIndex((c) => names.includes(c));
    const num = (row: string[], i: number) => (i >= 0 && row[i] ? Number(row[i]) : NaN);
    const fileDate = fitbitDate(fileName.split("/").pop() ?? "");

    // Fitbit "Sleep Score/sleep_score.csv": the score belongs to the morning the sleep ended.
    if (cols.includes("overall_score")) {
      fitbit = true;
      const [ts, score] = [idx("timestamp"), idx("overall_score")];
      for (const line of rows) {
        const row = cells(line);
        const at = shiftUtc(row[ts], utcOffsetMinutes);
        const v = num(row, score);
        if (at && ok(at.date) && v > 0) day(at.date).sleepScore = Math.round(v);
      }
      return;
    }

    // Google Fit per-day file ("2026-09-25.csv"): 15-minute rows → hourly heart rate.
    if (cols.includes("start time") && fileDate) {
      googleFit = true;
      const [start, avg, max] = [idx("start time"), idx("average heart rate (bpm)"), idx("max heart rate (bpm)")];
      for (const line of rows) {
        const row = cells(line);
        const t = row[start]?.match(/^(\d{2}):(\d{2})/);
        const bpm = num(row, avg);
        if (t && Number.isFinite(bpm)) hrAdd(fileDate, Number(t[1]) * 60 + Number(t[2]), bpm, Number.isFinite(num(row, max)) ? num(row, max) : bpm);
      }
      return;
    }

    // Google Fit summary ("Daily activity metrics.csv") or a generic tracker CSV.
    if (cols.includes("move minutes count")) googleFit = true;
    const c = {
      date: idx("date"),
      steps: idx("steps", "step count"),
      active: idx("active_minutes", "move minutes count"),
      rhr: idx("resting_hr"),
      sleep: idx("sleep_minutes"),
      avg: idx("avg_hr", "average heart rate (bpm)"),
      max: idx("max_hr", "max heart rate (bpm)"),
      score: idx("sleep_score"),
      energy: idx("active_kcal"),
    };
    for (const line of rows) {
      const row = cells(line);
      const d = fitbitDate(row[c.date]);
      if (!ok(d)) continue;
      const r = day(d);
      const set = (k: "steps" | "activeMinutes" | "restingHr" | "sleepMinutes" | "avgHr" | "maxHr" | "sleepScore" | "activeKcal", i: number) => {
        const v = num(row, i);
        if (Number.isFinite(v)) r[k] = Math.round(v);
      };
      set("steps", c.steps);
      set("activeMinutes", c.active);
      set("restingHr", c.rhr);
      set("sleepMinutes", c.sleep);
      set("avgHr", c.avg);
      set("maxHr", c.max);
      set("sleepScore", c.score);
      set("activeKcal", c.energy);
    }
  }

  function finish(): HealthImport {
    for (const [date, h] of hr) {
      const r = day(date);
      // Prefer the file's own daily figures when it has them (Google Fit summary).
      r.avgHr ??= Math.round(h.sum / h.count);
      r.maxHr ??= Math.round(h.max);
      r.hrHourly = hourlyAverages(h.hours);
    }
    const out = [...days.values()]
      .filter((d) => Object.entries(d).some(([k, v]) => k !== "date" && v != null))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, steps: d.steps == null ? null : Math.round(d.steps), activeMinutes: d.activeMinutes == null ? null : Math.round(d.activeMinutes) }));
    return { days: out, workouts };
  }

  /** Which export this was, for the source label. */
  const source = (): "fitbit_export" | "google_fit_export" => (googleFit && !fitbit ? "google_fit_export" : "fitbit_export");

  return { addJson, addCsv, finish, source };
}

