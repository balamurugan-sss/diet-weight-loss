/**
 * The Today screen's activity line: what happened when, from every source —
 * wake-up (logged or from the watch), drinks and food, the planned and the
 * actual workout, cardio. Pure so it can be tested; the page translates.
 */

export type FoodMacros = { kcal: number; proteinG: number; carbsG: number; fatG: number; fibreG: number };

export type TimelineItem =
  | { kind: "wake"; time: string; source: "you" | "device"; sleepMinutes: number | null; sleepStart: string | null }
  | ({ kind: "food"; time: string; slot: string; title: string; logId: string } & FoodMacros)
  | { kind: "workout_plan"; time: string }
  | {
      kind: "workout";
      time: string;
      end: string | null;
      status: "in_progress" | "completed";
      sessionId: string;
      dayIndex: number;
      recovery: boolean;
      minutes: number | null;
      kcal: number | null;
      /** Program name for an alongside program; null for the main one. */
      label: string | null;
      /** "?p=<id>" for an alongside program's pages, "" for the main one. */
      query: string;
    }
  | { kind: "cardio"; time: string | null; activity: string; minutes: number; kcal: number; id: string };

export type TimelineSession = {
  id: string;
  start: string;
  end: string | null;
  status: "in_progress" | "completed";
  dayIndex: number;
  recovery: boolean;
  durationSec: number | null;
  kcal: number | null;
  label: string | null;
  query: string;
};

export type TimelineInput = {
  wake: { time: string; source: "you" | "device" } | null;
  sleep: { minutes: number | null; start: string | null } | null;
  foods: ({ time: string; slot: string; title: string; logId: string } & FoodMacros)[];
  workoutPlan: string | null;
  /** Today's sessions; the first one without a label is the main program's. */
  sessions: TimelineSession[];
  cardio: { time: string | null; activity: string; minutes: number; kcal: number; id: string }[];
};

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function buildTimeline(input: TimelineInput): TimelineItem[] {
  const items: TimelineItem[] = [];
  if (input.wake) items.push({ kind: "wake", ...input.wake, sleepMinutes: input.sleep?.minutes ?? null, sleepStart: input.sleep?.start ?? null });
  for (const f of input.foods) items.push({ kind: "food", ...f });
  // A plan is replaced by the real (main-program) session once it starts.
  if (input.workoutPlan && !input.sessions.some((s) => !s.label)) items.push({ kind: "workout_plan", time: input.workoutPlan });
  for (const s of input.sessions)
    items.push({
      kind: "workout",
      time: s.start,
      end: s.end,
      status: s.status,
      sessionId: s.id,
      dayIndex: s.dayIndex,
      recovery: s.recovery,
      minutes: s.durationSec != null ? Math.max(1, Math.round(s.durationSec / 60)) : null,
      kcal: s.kcal,
      label: s.label,
      query: s.query,
    });
  for (const c of input.cardio) items.push({ kind: "cardio", ...c });
  // Timed items in order; imported cardio without a time goes last.
  return items.sort((a, b) => (a.time == null ? 1 : b.time == null ? -1 : toMinutes(a.time) - toMinutes(b.time)));
}

/** Sum of the day's food and drink. */
export function dayTotals(items: TimelineItem[]): FoodMacros {
  const t = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 };
  for (const i of items)
    if (i.kind === "food") for (const k of Object.keys(t) as (keyof FoodMacros)[]) t[k] += i[k];
  return { kcal: Math.round(t.kcal), proteinG: Math.round(t.proteinG), carbsG: Math.round(t.carbsG), fatG: Math.round(t.fatG), fibreG: Math.round(t.fibreG) };
}

/**
 * Where an item dragged to position `to` (in the list without it) should sit in time:
 * halfway between its new neighbours, rounded to 5 minutes; 30 minutes before the
 * first or after the last item.
 */
export function timeForPosition(times: (string | null)[], to: number): string {
  const mins = times.map((t) => (t ? toMinutes(t) : null));
  const prev = [...mins.slice(0, to)].reverse().find((m) => m != null) ?? null;
  const next = mins.slice(to).find((m) => m != null) ?? null;
  const raw = prev != null && next != null ? (prev + next) / 2 : prev != null ? prev + 30 : next != null ? next - 30 : 12 * 60;
  const m = Math.max(0, Math.min(23 * 60 + 55, Math.round(raw / 5) * 5));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export type PromptId = "wake" | "morning_drink" | "plan_workout" | "start_workout" | "pre_workout" | "protein" | "protein_gap";

export type PromptInput = {
  now: string;
  wakeLogged: boolean;
  morningDrinkLogged: boolean;
  /** Today's planned program day, if any. */
  workoutKind: "workout" | "recovery" | "rest" | null;
  sessionStatus: "none" | "in_progress" | "completed";
  workoutPlan: string | null;
  /** Latest food or "I've eaten" time today. */
  lastAte: string | null;
  preWorkoutLogged: boolean;
  proteinLogged: boolean;
  sessionEnd: string | null;
  proteinLeftG: number;
};

/**
 * Which check-ins to ask now, most useful first. Morning questions only in the
 * morning; the pre-workout question when training is near and nothing was
 * eaten in the last two hours; protein right after a workout.
 */
export function todayPrompts(p: PromptInput): PromptId[] {
  const now = toMinutes(p.now);
  const out: PromptId[] = [];
  if (!p.wakeLogged && now < 14 * 60) out.push("wake");
  if (!p.morningDrinkLogged && now < 12 * 60) out.push("morning_drink");
  const pending = p.workoutKind === "workout" && p.sessionStatus === "none";
  const plan = p.workoutPlan ? toMinutes(p.workoutPlan) : null;
  if (pending && plan == null) out.push("plan_workout");
  if (pending && plan != null && plan - now <= 15) out.push("start_workout");
  const soon = plan == null ? now < 21 * 60 : plan - now <= 150 && plan - now >= -60;
  const hungry = p.lastAte == null || now - toMinutes(p.lastAte) > 120;
  if (pending && soon && hungry && !p.preWorkoutLogged) out.push("pre_workout");
  const justTrained = p.sessionStatus === "completed" && p.sessionEnd != null && now - toMinutes(p.sessionEnd) <= 180;
  if (justTrained && !p.proteinLogged) out.push("protein");
  // While a workout is still ahead, protein is asked for after it instead.
  else if (!pending && now >= 17 * 60 && p.proteinLeftG >= 25 && !p.proteinLogged) out.push("protein_gap");
  return out;
}

/** "in 2 h 10 min" style parts for a time later today (negative = already passed). */
export function minutesUntil(now: string, then: string) {
  return toMinutes(then) - toMinutes(now);
}
