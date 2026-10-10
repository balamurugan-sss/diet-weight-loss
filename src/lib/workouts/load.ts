import { getExercise } from "./exercises";
import type { Exercise, Level, Prescription, ProgramDay } from "./types";

// ─── Energy ─────────────────────────────────────────────────────────────────

/** kcal = MET × 3.5 × body weight (kg) ÷ 200 × minutes (ACSM). */
export function kcalFromMet(met: number, weightKg: number, minutes: number) {
  return (met * 3.5 * weightKg * minutes) / 200;
}

/** Between sets people stand, walk and set up; never at the working MET. */
const REST_MET_CAP = 3.0;
const TRANSITION_SEC = 20;

export function avgReps(p: Pick<Prescription, "reps">) {
  return p.reps ? (p.reps[0] + p.reps[1]) / 2 : 0;
}

/** Working seconds for one set. */
export function setWorkSeconds(p: Prescription, ex: Exercise = getExercise(p.exerciseId)) {
  const sides = ex.perSide ? 2 : 1;
  if (ex.mode === "time") return (p.seconds ?? 30) * sides;
  return avgReps(p) * (ex.secPerRep ?? 3) * sides;
}

export type Estimate = { minutes: number; kcal: number; netKcal: number };

/**
 * Duration and energy for a list of prescriptions. `kcal` is the gross figure
 * shown to the user; `netKcal` subtracts resting energy (1 MET), which is
 * already counted in the daily calorie target, and is what feeds the food plan.
 */
export function estimatePrescriptions(items: Prescription[], weightKg: number): Estimate {
  let sec = 0;
  let kcal = 0;
  let net = 0;
  for (const p of items) {
    const ex = getExercise(p.exerciseId);
    const work = setWorkSeconds(p, ex) * p.sets;
    const rest = Math.max(0, p.sets - 1) * p.restSec + TRANSITION_SEC;
    const restMet = Math.min(ex.met, REST_MET_CAP);
    sec += work + rest;
    kcal += kcalFromMet(ex.met, weightKg, work / 60) + kcalFromMet(restMet, weightKg, rest / 60);
    net += kcalFromMet(ex.met - 1, weightKg, work / 60) + kcalFromMet(restMet - 1, weightKg, rest / 60);
  }
  return { minutes: sec / 60, kcal, netKcal: net };
}

export function estimateDay(day: Pick<ProgramDay, "warmup" | "main" | "cooldown">, weightKg: number): Estimate {
  const e = estimatePrescriptions([...day.warmup, ...day.main, ...day.cooldown], weightKg);
  return { minutes: Math.round(e.minutes), kcal: Math.round(e.kcal), netKcal: Math.round(e.netKcal) };
}

// ─── Starting loads ─────────────────────────────────────────────────────────

const LEVEL_LOAD: Record<Level, number> = { beginner: 1, intermediate: 1.35, advanced: 1.7 };
/** Body weight above this adds little to starting strength; keeps suggestions sensible. */
const LOAD_BODYWEIGHT_CAP = 90;

export function roundLoad(kg: number, implement: NonNullable<Exercise["load"]>["implement"]) {
  switch (implement) {
    case "dumbbell":
      return kg <= 10 ? Math.max(1, Math.round(kg)) : Math.round(kg / 2) * 2;
    case "kettlebell":
      return Math.max(4, Math.round(kg / 4) * 4);
    default:
      return Math.round(kg / 2.5) * 2.5;
  }
}

/**
 * A conservative first-session weight (kg; per hand for dumbbells). It should
 * leave 2–3 reps in reserve; the overload rules adjust it after one session.
 */
export function suggestLoad(ex: Exercise, who: { weightKg: number; sex: "female" | "male"; level: Level }): number | null {
  if (!ex.load) return null;
  const bw = Math.min(who.weightKg, LOAD_BODYWEIGHT_CAP);
  const sexFactor = who.sex === "female" ? (ex.load.upper ? 0.6 : 0.75) : 1;
  const kg = ex.load.ratio * bw * LEVEL_LOAD[who.level] * sexFactor;
  return Math.max(ex.load.minKg ?? 0, roundLoad(kg, ex.load.implement));
}

// ─── Progressive overload ───────────────────────────────────────────────────

export type LoggedSet = { reps: number | null; seconds?: number | null; weightKg: number | null; done: boolean };

export type Overload =
  | { kind: "increase"; weightKg: number; by: number }
  | { kind: "hold"; weightKg: number | null }
  | { kind: "reduce"; weightKg: number; by: number }
  | { kind: "more_reps"; reps: number }
  | { kind: "more_time"; seconds: number }
  | { kind: "harder"; exerciseId: string }
  | { kind: "none" };

export function loadIncrement(ex: Exercise, currentKg: number) {
  const imp = ex.load?.implement;
  if (imp === "barbell") return ex.load!.upper ? 2.5 : 5;
  if (imp === "dumbbell") return currentKg < 10 ? 1 : 2;
  if (imp === "kettlebell") return 4;
  if (imp === "machine" || imp === "cable") return ex.load!.upper ? 2.5 : 5;
  return 0;
}

/**
 * Double progression: work inside the rep range; when every planned set
 * reaches the top of the range, add the smallest practical increment. If most
 * sets fall short of the bottom, step back one increment.
 */
export function suggestOverload(p: Prescription, logged: LoggedSet[]): Overload {
  const ex = getExercise(p.exerciseId);
  const done = logged.filter((s) => s.done);
  if (done.length === 0) return { kind: "none" };

  if (ex.mode === "time") {
    const target = p.seconds ?? 30;
    const allHit = done.length >= p.sets && done.every((s) => (s.seconds ?? target) >= target);
    return allHit ? { kind: "more_time", seconds: target + (target >= 45 ? 10 : 5) } : { kind: "none" };
  }

  const [lo, hi] = p.reps ?? [10, 10];
  const allTop = done.length >= p.sets && done.every((s) => (s.reps ?? 0) >= hi);
  const shortSets = done.filter((s) => (s.reps ?? 0) < lo).length;

  if (ex.load) {
    const weights = done.map((s) => s.weightKg).filter((w): w is number => w != null);
    const kg = weights.length ? Math.min(...weights) : (p.loadKg ?? null);
    if (kg == null) return { kind: "hold", weightKg: null };
    const step = loadIncrement(ex, kg);
    if (allTop) return { kind: "increase", weightKg: kg + step, by: step };
    if (shortSets >= Math.ceil(done.length / 2) && kg - step >= (ex.load.minKg ?? step)) {
      return { kind: "reduce", weightKg: kg - step, by: step };
    }
    return { kind: "hold", weightKg: kg };
  }

  if (allTop) return ex.harder && hi >= 15 ? { kind: "harder", exerciseId: ex.harder } : { kind: "more_reps", reps: hi + 2 };
  return { kind: "none" };
}

/** Epley estimated one-rep max, used for the strength-progress chart. */
export function estimatedOneRepMax(weightKg: number, reps: number) {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}
