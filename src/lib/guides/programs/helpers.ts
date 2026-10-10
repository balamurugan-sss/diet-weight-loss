import type { GuideBlock, TemplateDay, TemplateItem } from "../types";

/** Rep-mode item. `reps` is a fixed count or a [low, high] range (per side for perSide moves). */
export const r = (exerciseId: string, sets: number, reps: number | [number, number], restSec = 45): TemplateItem => ({
  exerciseId,
  sets,
  reps: typeof reps === "number" ? [reps, reps] : reps,
  restSec,
});

/** Time-mode item: `seconds` per set (per side for perSide moves). */
export const t = (exerciseId: string, sets: number, seconds: number, restSec = 15): TemplateItem => ({
  exerciseId,
  sets,
  seconds,
  restSec,
});

export const workout = (title: string, warmup: TemplateItem[], main: TemplateItem[], cooldown: TemplateItem[]): TemplateDay => ({
  kind: "workout",
  title,
  warmup,
  main,
  cooldown,
});

export const recovery = (title: string, warmup: TemplateItem[], main: TemplateItem[], cooldown: TemplateItem[]): TemplateDay => ({
  kind: "recovery",
  title,
  warmup,
  main,
  cooldown,
});

export const rest = (title = "Rest"): TemplateDay => ({ kind: "rest", title, warmup: [], main: [], cooldown: [] });

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** A week-by-week grid (Mon–Sun) of day titles, for programs built in 7-day weeks. */
export function weekGrid(days: TemplateDay[]): GuideBlock {
  const rows: string[][] = [];
  for (let w = 0; w * 7 < days.length; w++) {
    rows.push([`Week ${w + 1}`, ...days.slice(w * 7, w * 7 + 7).map((d) => d.title)]);
  }
  return { kind: "table", head: ["Week", ...WEEKDAYS], rows };
}

/** One row per day, for day-numbered challenges. */
export function dayTable(days: TemplateDay[]): GuideBlock {
  const label = { workout: "Practice", recovery: "Easy day", rest: "Rest" } as const;
  return {
    kind: "table",
    head: ["Day", "Session", "Type"],
    rows: days.map((d, i) => [String(i + 1), d.title, label[d.kind]]),
  };
}

/** Printable tick boxes, one per non-rest day. */
export function sessionChecklist(days: TemplateDay[]): GuideBlock {
  return {
    kind: "checklist",
    items: days.flatMap((d, i) => (d.kind === "rest" ? [] : [`Day ${i + 1}: ${d.title}`])),
  };
}
