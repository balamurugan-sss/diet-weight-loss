import { hhmm } from "@/lib/health/types";
import { toMinutes } from "@/lib/today/timeline";

/** Hours after waking for each meal slot (wake 07:00 → breakfast 08:30, lunch 13:00, dinner 20:00). */
const OFFSET_H: Record<string, number> = { breakfast: 1.5, mid_morning: 4, lunch: 6, evening: 10, dinner: 13 };

/** Suggested time for a meal, shifted with the day's wake-up time and rounded to the half hour. */
export function slotTime(slot: string, wake: string | null) {
  const start = wake ? toMinutes(wake) : 7 * 60;
  const t = start + (OFFSET_H[slot] ?? 6) * 60;
  return hhmm(Math.min(22 * 60 + 30, Math.round(t / 30) * 30));
}
