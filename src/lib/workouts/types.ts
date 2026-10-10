import { z } from "zod";

export const LOCATIONS = ["home", "gym", "mix"] as const;
export type Location = (typeof LOCATIONS)[number];
export type Setting = Exclude<Location, "mix">;

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];

export const WORKOUT_GOALS = ["lose", "gain", "fit"] as const;
export type WorkoutGoal = (typeof WORKOUT_GOALS)[number];

export const DAYS_PER_WEEK = [3, 4, 5, 6] as const;
export type DaysPerWeek = (typeof DAYS_PER_WEEK)[number];

/** Equipment a home user can own; a gym is assumed to have everything. */
export const HOME_EQUIPMENT = ["dumbbells", "bands", "pullup_bar"] as const;
export type HomeEquipment = (typeof HOME_EQUIPMENT)[number];

export const EQUIPMENT = ["none", ...HOME_EQUIPMENT, "bench", "barbell", "machine", "cable", "kettlebell"] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const MUSCLES = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "full_body",
  "cardio",
  "mobility",
] as const;
export type Muscle = (typeof MUSCLES)[number];

/** Which slot of a session an exercise can fill. */
export const ROLES = [
  "warmup",
  "cooldown",
  "squat",
  "lunge",
  "hinge",
  "glute",
  "push_h",
  "push_v",
  "pull_h",
  "pull_v",
  "chest_iso",
  "shoulder_iso",
  "biceps",
  "triceps",
  "quad_iso",
  "ham_iso",
  "calves",
  "core",
  "conditioning",
  "recovery",
] as const;
export type Role = (typeof ROLES)[number];

/** Movement patterns drawn by the animated figure. */
export const PATTERNS = [
  "squat",
  "lunge",
  "hinge",
  "bridge",
  "pushup",
  "press",
  "row",
  "pull",
  "curl",
  "raise",
  "dip",
  "calf",
  "plank",
  "crunch",
  "superman",
  "jack",
  "climber",
  "burpee",
  "march",
  "stretch",
] as const;
export type Pattern = (typeof PATTERNS)[number];

export type Difficulty = 1 | 2 | 3;

export type Exercise = {
  id: string;
  name: string;
  role: Role;
  muscles: Muscle[];
  secondary?: Muscle[];
  /** Everything listed is required. Empty = bodyweight. */
  equipment: Exclude<Equipment, "none">[];
  settings: Setting[];
  difficulty: Difficulty;
  pattern: Pattern;
  mode: "reps" | "time";
  /** Compendium of Physical Activities MET for the activity as typically performed. */
  met: number;
  /** Seconds per rep including the lowering phase. */
  secPerRep?: number;
  /** Realistic rep range for hard bodyweight moves (overrides the level default). */
  repRange?: [number, number];
  /** Done one side at a time: reps are per side. */
  perSide?: boolean;
  impact?: "high";
  /** Lying on the back (avoided later in pregnancy). */
  supine?: boolean;
  harder?: string;
  easier?: string;
  /**
   * Starting-load suggestion for a beginner, as a fraction of body weight
   * (per hand for dumbbells unless `single`: one weight held in both hands).
   * Scaled by level and sex in `suggestLoad`.
   */
  load?: { ratio: number; implement: "barbell" | "dumbbell" | "machine" | "cable" | "kettlebell"; upper: boolean; minKg?: number; single?: true };
  steps: string[];
  mistakes: string[];
  /** Optional photo/video/GIF; when absent the animated figure is shown. */
  media?: { kind: "image" | "video"; src: string; credit?: string } | null;
};

export type Prescription = {
  slot: number;
  exerciseId: string;
  sets: number;
  /** Rep range [low, high] (equal for a fixed count); per side when the exercise is perSide. */
  reps?: [number, number];
  seconds?: number;
  restSec: number;
  /** Suggested starting load in kg (per hand for dumbbells). */
  loadKg?: number;
};

export type DayKind = "workout" | "recovery" | "rest";

export type ProgramDay = {
  index: number;
  week: number;
  kind: DayKind;
  /** Short focus label key, e.g. "lower", "push", "full". */
  focus: string;
  setting: Setting;
  isIntro: boolean;
  warmup: Prescription[];
  main: Prescription[];
  cooldown: Prescription[];
  estMinutes: number;
};

export type Program = {
  name: string;
  split: string;
  location: Location;
  level: Level;
  goal: WorkoutGoal;
  daysPerWeek: DaysPerWeek;
  weeks: number;
  days: ProgramDay[];
};

export const WorkoutProfileInput = z
  .object({
    location: z.enum(LOCATIONS),
    level: z.enum(LEVELS),
    goal: z.enum(WORKOUT_GOALS),
    daysPerWeek: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
    equipment: z.array(z.enum(HOME_EQUIPMENT)).max(HOME_EQUIPMENT.length).default([]),
    doctorAck: z.literal(true),
  })
  .strict();
export type WorkoutProfileInput = z.infer<typeof WorkoutProfileInput>;
