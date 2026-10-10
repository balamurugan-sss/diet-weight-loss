import type { DayKind } from "./types";

/**
 * Programs are a sequence of days, not fixed calendar dates.
 *
 *  - A workout day waits for you: if you miss it, the next calendar day still
 *    shows the same workout ("continue where you stopped", nothing resets).
 *  - Rest and active-recovery days pass with the calendar on their own,
 *    unless you train through them, which skips ahead to the next workout.
 *
 * Everything here is derived by replaying completions from the start date,
 * so the stored state is just the list of completed sessions.
 */

export type Completion = { dayIndex: number; date: string };

export type CellStatus = "completed" | "missed" | "rest" | "today" | "upcoming" | "before" | "finished";

export type CalendarCell = {
  date: string;
  status: CellStatus;
  /** Program day that falls (or fell) on this date, when there is one. */
  dayIndex: number | null;
  kind: DayKind | null;
};

export type ProgramProgress = {
  /** Index of the next day to do (equals days.length when finished). */
  position: number;
  finished: boolean;
  /** Days whose work is behind you: completed workouts plus rest days passed. */
  daysDone: number;
  workoutsDone: number;
  workoutsTotal: number;
  /** Consecutive calendar days on plan (rest days count; a missed workout breaks it). */
  streak: number;
  /** Whether today's planned workout has been completed. */
  doneToday: boolean;
  cells: CalendarCell[];
};

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetweenISO(a: string, b: string) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

/** Monday of the ISO week containing `iso`. */
export function weekStart(iso: string) {
  const dow = (new Date(iso + "T00:00:00Z").getUTCDay() + 6) % 7;
  return addDays(iso, -dow);
}

export function replayProgram(
  kinds: DayKind[],
  startDate: string,
  completions: Completion[],
  today: string,
  range?: [string, string],
): ProgramProgress {
  const byDate = new Map<string, number[]>();
  for (const c of completions) {
    if (c.dayIndex < 0 || c.dayIndex >= kinds.length) continue;
    const list = byDate.get(c.date) ?? [];
    list.push(c.dayIndex);
    byDate.set(c.date, list);
  }

  const history = new Map<string, CalendarCell>();
  const done = new Set<number>();
  let pos = 0;
  let restPassed = 0;
  const span = Math.max(0, daysBetweenISO(startDate, today));

  // Past days: rest days lapse, workout days wait.
  for (let i = 0; i < span && pos < kinds.length; i++) {
    const date = addDays(startDate, i);
    const comps = byDate.get(date);
    if (comps?.length) {
      const top = Math.max(...comps);
      for (let k = pos; k <= top; k++) if (kinds[k] !== "workout" && !comps.includes(k)) restPassed++;
      comps.forEach((k) => done.add(k));
      history.set(date, { date, status: "completed", dayIndex: top, kind: kinds[top] });
      pos = Math.max(pos, top + 1);
    } else if (kinds[pos] !== "workout") {
      history.set(date, { date, status: "rest", dayIndex: pos, kind: kinds[pos] });
      restPassed++;
      pos++;
    } else {
      history.set(date, { date, status: "missed", dayIndex: pos, kind: "workout" });
    }
  }

  // Today.
  let doneToday = false;
  const todays = daysBetweenISO(startDate, today) >= 0 ? byDate.get(today) : undefined;
  if (todays?.length) {
    const top = Math.max(...todays);
    for (let k = pos; k <= top; k++) if (kinds[k] !== "workout" && !todays.includes(k)) restPassed++;
    todays.forEach((k) => done.add(k));
    history.set(today, { date: today, status: "completed", dayIndex: top, kind: kinds[top] });
    pos = Math.max(pos, top + 1);
    doneToday = true;
  }

  const finished = pos >= kinds.length;
  const workoutsTotal = kinds.filter((k) => k === "workout").length;
  const workoutsDone = [...done].filter((i) => kinds[i] === "workout").length;

  // Streak: walk back from today over consecutive on-plan days.
  let streak = 0;
  const todayCell = history.get(today);
  if (todayCell?.status === "completed" || (!todayCell && kinds[pos] && kinds[pos] !== "workout")) streak++;
  for (let i = 1; i <= span; i++) {
    const cell = history.get(addDays(today, -i));
    if (!cell || cell.status === "missed") break;
    streak++;
  }

  const cells: CalendarCell[] = [];
  if (range) {
    const [from, to] = range;
    const n = daysBetweenISO(from, to);
    // Tomorrow continues from today's day, assuming today's workout gets done.
    const tomorrow = doneToday || pos >= kinds.length ? pos : pos + 1;
    for (let i = 0; i <= n; i++) {
      const date = addDays(from, i);
      const offset = daysBetweenISO(startDate, date);
      if (offset < 0) {
        cells.push({ date, status: "before", dayIndex: null, kind: null });
        continue;
      }
      const past = history.get(date);
      if (past && date !== today) {
        cells.push(past);
        continue;
      }
      if (date === today) {
        if (past) cells.push(past);
        else if (pos >= kinds.length) cells.push({ date, status: "finished", dayIndex: null, kind: null });
        else cells.push({ date, status: kinds[pos] === "workout" ? "today" : "rest", dayIndex: pos, kind: kinds[pos] });
        continue;
      }
      if (date < today) {
        cells.push({ date, status: "finished", dayIndex: null, kind: null });
        continue;
      }
      // Upcoming: project the remaining sequence forwards one day at a time.
      const ahead = tomorrow + daysBetweenISO(addDays(today, 1), date);
      if (ahead >= kinds.length) cells.push({ date, status: "finished", dayIndex: null, kind: null });
      else cells.push({ date, status: kinds[ahead] === "workout" ? "upcoming" : "rest", dayIndex: ahead, kind: kinds[ahead] });
    }
  }

  return {
    position: Math.min(pos, kinds.length),
    finished,
    daysDone: Math.min(kinds.length, done.size + restPassed),
    workoutsDone,
    workoutsTotal,
    streak,
    doneToday,
    cells,
  };
}
