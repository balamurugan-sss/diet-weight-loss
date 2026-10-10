import type { Level, Pattern } from "@/lib/workouts/types";

/**
 * Guides shown in the Explore tab. Everything is original Movewell content,
 * written to be read on a phone and printed (each guide has a printable view).
 * Health claims are kept to what the cited sources support.
 */

export type GuideBlock =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  /** Printable tick boxes (sleep checklist, daily challenge…). */
  | { kind: "checklist"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "tip"; text: string }
  | { kind: "caution"; text: string }
  /** A blank log to fill in when printed (sleep diary, progress log): column headings and how many empty rows. */
  | { kind: "log"; head: string[]; rows: number }
  /** A short self-check quiz; each option adds points to one outcome. */
  | {
      kind: "quiz";
      id: string;
      questions: { q: string; options: { label: string; outcome: string }[] }[];
      outcomes: Record<string, { title: string; text: string }>;
    };

export type GuideSection = { heading: string; blocks: GuideBlock[] };

export type GuideCategory = "program" | "trending";

export type Guide = {
  slug: string;
  title: string;
  category: GuideCategory;
  /** One or two sentences for the card. */
  summary: string;
  /** Short uppercase tags on the card, e.g. ["BODYWEIGHT", "BEGINNER", "HOME"]. */
  tags: string[];
  readMinutes: number;
  /** Drawn on the card when there is no image. */
  pattern: Pattern;
  /** Shown on the card and the guide page. */
  sections: GuideSection[];
  sources: { title: string; url: string }[];
  /** When set, the guide has a followable day-by-day program (see ProgramTemplate). */
  programId?: string;
  /** Who should check with a doctor first, shown at the top. */
  caution?: string;
};

export type TemplateItem = {
  exerciseId: string;
  sets: number;
  /** Rep range [low, high]; equal numbers for a fixed count. Per side when the exercise is perSide. */
  reps?: [number, number];
  seconds?: number;
  restSec: number;
};

export type TemplateDay = {
  kind: "workout" | "recovery" | "rest";
  /** Shown as the day's title, e.g. "Push-up ladder" or "Rest". */
  title: string;
  warmup: TemplateItem[];
  main: TemplateItem[];
  cooldown: TemplateItem[];
};

/** A fixed program from a guide that can be followed in the session player. */
export type ProgramTemplate = {
  id: string;
  /** Matches the guide that describes it. */
  guideSlug: string;
  name: string;
  level: Level;
  /** Uses only bodyweight / a chair unless listed. */
  equipment: ("none" | "chair" | "dumbbells" | "pullup_bar")[];
  days: TemplateDay[];
};
