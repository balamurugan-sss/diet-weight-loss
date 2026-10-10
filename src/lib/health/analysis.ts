import type { HealthDay } from "./types";

/**
 * Turns a day of wearable data into a few plain-language, actionable notes.
 * Comparisons are against the person's own recent baseline rather than
 * population norms where that matters (resting heart rate), and against
 * public guidance where it's well established (sleep 7–9 h; steps).
 */

export const STEP_GOAL = 8000;
export const SLEEP_MIN_GOOD = 7 * 60;
export const RHR_ELEVATED_BPM = 5;

export type Insight = {
  id: "steps_low" | "steps_good" | "sleep_short" | "sleep_good" | "rhr_up" | "rhr_ok" | "active_good";
  tone: "good" | "info" | "caution";
  vars: Record<string, number>;
};

export type Analysis = {
  today: HealthDay | null;
  baseline: { steps: number | null; sleepMinutes: number | null; restingHr: number | null };
  insights: Insight[];
  /** Suggest swapping a hard session for recovery today. */
  suggestRecovery: boolean;
};

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

export function analyseDay(days: HealthDay[], date: string): Analysis {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const today = sorted.find((d) => d.date === date) ?? null;
  const prior = sorted.filter((d) => d.date < date).slice(-7);
  const baseline = {
    steps: avg(prior.map((d) => d.steps)),
    sleepMinutes: avg(prior.map((d) => d.sleepMinutes)),
    restingHr: avg(prior.map((d) => d.restingHr)),
  };
  const insights: Insight[] = [];
  let suggestRecovery = false;

  if (today?.steps != null) {
    if (today.steps < STEP_GOAL) {
      const missing = STEP_GOAL - today.steps;
      // ~100 steps a minute at a brisk pace.
      insights.push({ id: "steps_low", tone: "info", vars: { steps: today.steps, goal: STEP_GOAL, minutes: Math.max(5, Math.ceil(missing / 100 / 5) * 5) } });
    } else insights.push({ id: "steps_good", tone: "good", vars: { steps: today.steps } });
  }

  if (today?.sleepMinutes != null) {
    if (today.sleepMinutes < SLEEP_MIN_GOOD) {
      insights.push({ id: "sleep_short", tone: "caution", vars: { h: Math.floor(today.sleepMinutes / 60), m: today.sleepMinutes % 60 } });
      if (today.sleepMinutes < 6 * 60) suggestRecovery = true;
    } else insights.push({ id: "sleep_good", tone: "good", vars: { h: Math.floor(today.sleepMinutes / 60), m: today.sleepMinutes % 60 } });
  }

  if (today?.restingHr != null && baseline.restingHr != null && prior.filter((d) => d.restingHr != null).length >= 3) {
    const diff = Math.round(today.restingHr - baseline.restingHr);
    if (diff >= RHR_ELEVATED_BPM) {
      insights.push({ id: "rhr_up", tone: "caution", vars: { bpm: today.restingHr, diff } });
      suggestRecovery = true;
    } else insights.push({ id: "rhr_ok", tone: "good", vars: { bpm: today.restingHr } });
  }

  if (today?.activeMinutes != null && today.activeMinutes >= 30) insights.push({ id: "active_good", tone: "good", vars: { minutes: today.activeMinutes } });

  return { today, baseline: { steps: baseline.steps && Math.round(baseline.steps), sleepMinutes: baseline.sleepMinutes && Math.round(baseline.sleepMinutes), restingHr: baseline.restingHr && Math.round(baseline.restingHr) }, insights, suggestRecovery };
}

export type SleepScore = { score: number; source: "device" | "estimate"; label: "excellent" | "good" | "fair" | "poor" };

const sleepLabel = (score: number): SleepScore["label"] => (score >= 90 ? "excellent" : score >= 80 ? "good" : score >= 60 ? "fair" : "poor");

/**
 * The device's sleep score when it gives one (Fitbit), otherwise Movewell's
 * estimate on the same 0–100 scale. The estimate follows the shape of
 * Fitbit's score — duration, sleep quality and restoration — using only what
 * any tracker records:
 *   duration    50 pts: 7.5 h or more is full marks, falling to 0 at 3.5 h
 *   stages      25 pts: deep + REM at 40% of sleep or more is full marks
 *   restoration 25 pts: efficiency (asleep ÷ in bed) 90%+ = 15, and resting
 *                       heart rate at or below the person's usual = 10
 * Missing parts are left out and the rest scaled up, so a phone that only
 * knows duration still gets a fair number. It is an estimate, labelled so.
 */
export function sleepScore(d: HealthDay, baselineRhr: number | null = null): SleepScore | null {
  if (d.sleepScore != null) return { score: Math.round(d.sleepScore), source: "device", label: sleepLabel(d.sleepScore) };
  if (d.sleepMinutes == null || d.sleepMinutes <= 0) return null;
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  const parts: [number, number][] = [[50, clamp((d.sleepMinutes - 210) / (450 - 210))]];
  if (d.deepMinutes != null && d.remMinutes != null && d.deepMinutes + d.remMinutes > 0) parts.push([25, clamp((d.deepMinutes + d.remMinutes) / d.sleepMinutes / 0.4)]);
  if (d.inBedMinutes != null && d.inBedMinutes >= d.sleepMinutes) parts.push([15, clamp((d.sleepMinutes / d.inBedMinutes - 0.7) / 0.2)]);
  if (d.restingHr != null && baselineRhr != null) parts.push([10, clamp(1 - (d.restingHr - baselineRhr) / 6)]);
  const max = parts.reduce((a, [w]) => a + w, 0);
  const score = Math.round((parts.reduce((a, [w, v]) => a + w * v, 0) / max) * 100);
  return { score, source: "estimate", label: sleepLabel(score) };
}

/** Thousands separators for step counts in messages ("4,300"). */
export function formatVars(vars: Record<string, number>) {
  return Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, k === "steps" || k === "goal" ? v.toLocaleString("en-IN") : v]));
}
