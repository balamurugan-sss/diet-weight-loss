import type { Exercise, Prescription } from "./types";

export function formatSeconds(s: number) {
  if (s >= 120 && s % 60 === 0) return `${s / 60} min`;
  if (s >= 120) return `${Math.round(s / 60)} min`;
  return `${s} s`;
}

export function formatClock(totalSec: number) {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** "3 × 10–12", "2 × 30 s", "15 min" (single timed block). */
export function formatDose(p: Prescription, ex: Exercise, perSide: string) {
  const side = ex.perSide ? ` ${perSide}` : "";
  const amount = p.reps ? (p.reps[0] === p.reps[1] ? `${p.reps[0]}` : `${p.reps[0]}–${p.reps[1]}`) : formatSeconds(p.seconds ?? 30);
  if (p.sets === 1 && !p.reps) return `${amount}${side}`;
  return `${p.sets} × ${amount}${side}`;
}

/** Whether the dumbbell weight is per hand (two dumbbells). */
export function perHand(ex: Exercise) {
  return ex.load?.implement === "dumbbell" && !ex.load.single;
}
