import { estimateDay } from "@/lib/workouts/load";
import type { Prescription, ProgramDay } from "@/lib/workouts/types";
import { ARTICLE_GUIDES } from "./articles";
import { PROGRAM_GUIDES, PROGRAMS } from "./programs";
import type { Guide, ProgramTemplate, TemplateItem } from "./types";

/** Every guide in Explore: programs first, then trending reads. */
export const GUIDES: Guide[] = [...PROGRAM_GUIDES, ...ARTICLE_GUIDES];
export const PROGRAM_TEMPLATES: ProgramTemplate[] = PROGRAMS;

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug) ?? null;
export const getProgramTemplate = (id: string) => PROGRAM_TEMPLATES.find((p) => p.id === id) ?? null;

const slots = (items: TemplateItem[], from: number): Prescription[] =>
  items.map((x, i) => ({ slot: from + i, exerciseId: x.exerciseId, sets: x.sets, restSec: x.restSec, ...(x.reps ? { reps: x.reps } : {}), ...(x.seconds != null ? { seconds: x.seconds } : {}) }));

/**
 * A guide template as program days the session player can run: same slot
 * numbering as generated programs (main 0…, warm-up 100…, cool-down 200…).
 */
export function templateDays(tpl: ProgramTemplate, weightKg: number): ProgramDay[] {
  let seenWorkout = false;
  return tpl.days.map((d, index) => {
    const day: ProgramDay = {
      index,
      week: Math.floor(index / 7) + 1,
      kind: d.kind,
      focus: d.kind === "workout" ? "guide" : d.kind,
      title: d.title,
      setting: "home",
      isIntro: d.kind === "workout" && !seenWorkout,
      warmup: slots(d.warmup, 100),
      main: slots(d.main, 0),
      cooldown: slots(d.cooldown, 200),
      estMinutes: 0,
    };
    if (d.kind === "workout") seenWorkout = true;
    day.estMinutes = estimateDay(day, weightKg).minutes;
    return day;
  });
}
