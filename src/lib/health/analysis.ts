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

/** Thousands separators for step counts in messages ("4,300"). */
export function formatVars(vars: Record<string, number>) {
  return Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, k === "steps" || k === "goal" ? v.toLocaleString("en-IN") : v]));
}
