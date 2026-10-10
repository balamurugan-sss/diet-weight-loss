import { EXERCISES, getExercise } from "./exercises";
import { estimateDay, roundLoad, suggestLoad } from "./load";
import type {
  DayKind,
  DaysPerWeek,
  Equipment,
  Exercise,
  HomeEquipment,
  Level,
  Location,
  Prescription,
  Program,
  ProgramDay,
  Role,
  Setting,
  WorkoutGoal,
} from "./types";

export type ProgramInput = {
  location: Location;
  level: Level;
  goal: WorkoutGoal;
  daysPerWeek: DaysPerWeek;
  equipment: HomeEquipment[];
  sex: "female" | "male";
  weightKg: number;
  /** No jumping (pregnancy, heart disease, hypertension, joint issues). */
  lowImpact?: boolean;
  /** No exercises lying on the back (later pregnancy). */
  noSupine?: boolean;
};

export const PROGRAM_WEEKS = 4;

// ─── Weekly rhythm ──────────────────────────────────────────────────────────
// W = workout, A = active recovery, R = rest. Day 1 is always a workout.

const RHYTHM: Record<DaysPerWeek, string> = {
  3: "WAWRWAR",
  4: "WWRWWAR",
  5: "WWWAWWR",
  6: "WWWWWWR",
};

// ─── Session templates ──────────────────────────────────────────────────────

type SlotKind = "main" | "accessory" | "core" | "finisher";
type Slot = { roles: Role[]; kind: SlotKind };
type Template = { focus: string; slots: Slot[] };

const s = (kind: SlotKind, ...roles: Role[]): Slot => ({ kind, roles });

const HOME: Record<string, Template> = {
  full_a: {
    focus: "full",
    slots: [s("main", "squat"), s("main", "push_h"), s("main", "glute", "hinge"), s("main", "pull_h", "pull_v"), s("accessory", "lunge"), s("core", "core"), s("finisher", "conditioning")],
  },
  full_b: {
    focus: "full",
    slots: [s("main", "lunge"), s("main", "push_h", "push_v"), s("main", "hinge", "glute"), s("main", "pull_v", "pull_h"), s("accessory", "triceps"), s("core", "core"), s("finisher", "conditioning")],
  },
  full_c: {
    focus: "full",
    slots: [s("main", "squat"), s("main", "push_h"), s("main", "glute"), s("main", "pull_h"), s("core", "core"), s("core", "core"), s("finisher", "conditioning")],
  },
  lower: {
    focus: "lower",
    slots: [s("main", "squat"), s("main", "lunge"), s("main", "glute"), s("main", "hinge", "glute"), s("accessory", "calves"), s("core", "core")],
  },
  upper: {
    focus: "upper",
    slots: [s("main", "push_h"), s("main", "pull_h"), s("main", "push_v", "push_h"), s("main", "pull_v", "pull_h"), s("accessory", "triceps"), s("accessory", "biceps", "shoulder_iso"), s("core", "core")],
  },
  hiit: {
    focus: "hiit",
    slots: [s("finisher", "conditioning"), s("main", "squat"), s("finisher", "conditioning"), s("main", "push_h"), s("finisher", "conditioning"), s("main", "lunge"), s("core", "core")],
  },
};

const GYM: Record<string, Template> = {
  full_a: {
    focus: "full",
    slots: [s("main", "squat"), s("main", "push_h"), s("main", "pull_v"), s("accessory", "hinge"), s("accessory", "shoulder_iso"), s("core", "core")],
  },
  full_b: {
    focus: "full",
    slots: [s("main", "hinge"), s("main", "push_v"), s("main", "pull_h"), s("accessory", "lunge"), s("accessory", "triceps"), s("core", "core")],
  },
  full_c: {
    focus: "full",
    slots: [s("main", "squat"), s("main", "push_h"), s("main", "pull_h"), s("accessory", "glute"), s("accessory", "biceps"), s("core", "core")],
  },
  upper: {
    focus: "upper",
    slots: [s("main", "push_h"), s("main", "pull_h"), s("main", "push_v"), s("main", "pull_v"), s("accessory", "triceps"), s("accessory", "biceps")],
  },
  lower: {
    focus: "lower",
    slots: [s("main", "squat"), s("main", "hinge"), s("accessory", "lunge"), s("accessory", "quad_iso"), s("accessory", "ham_iso"), s("accessory", "calves"), s("core", "core")],
  },
  push: {
    focus: "push",
    slots: [s("main", "push_h"), s("main", "push_v"), s("accessory", "push_h"), s("accessory", "shoulder_iso"), s("accessory", "chest_iso"), s("accessory", "triceps")],
  },
  pull: {
    focus: "pull",
    slots: [s("main", "pull_v"), s("main", "pull_h"), s("accessory", "pull_h"), s("accessory", "shoulder_iso"), s("accessory", "biceps"), s("core", "core")],
  },
  legs: {
    focus: "legs",
    slots: [s("main", "squat"), s("main", "hinge"), s("accessory", "glute"), s("accessory", "lunge"), s("accessory", "ham_iso"), s("accessory", "calves")],
  },
  cardio_core: {
    focus: "cardio_core",
    slots: [s("finisher", "conditioning"), s("core", "core"), s("core", "core"), s("core", "core"), s("finisher", "conditioning")],
  },
};

type DayPlan = { setting: Setting; template: Template };

function split(input: ProgramInput): { key: string; days: DayPlan[] } {
  const { location, level, daysPerWeek: n } = input;
  const gym = (k: keyof typeof GYM): DayPlan => ({ setting: "gym", template: GYM[k] });
  const home = (k: keyof typeof HOME): DayPlan => ({ setting: "home", template: HOME[k] });

  if (location === "home") {
    const byDays: Record<DaysPerWeek, DayPlan[]> = {
      3: [home("full_a"), home("full_b"), home("full_c")],
      4: [home("lower"), home("upper"), home("full_b"), home("hiit")],
      5: [home("lower"), home("upper"), home("hiit"), home("full_a"), home("full_b")],
      6: [home("lower"), home("upper"), home("hiit"), home("lower"), home("upper"), home("full_a")],
    };
    return { key: n === 3 ? "home_full_body" : "home_split", days: byDays[n] };
  }

  if (location === "mix") {
    const byDays: Record<DaysPerWeek, DayPlan[]> = {
      3: [gym("full_a"), home("hiit"), gym("full_b")],
      4: [gym("upper"), home("full_a"), gym("lower"), home("hiit")],
      5: [gym("upper"), home("hiit"), gym("lower"), home("full_b"), gym("full_c")],
      6: [gym("push"), home("hiit"), gym("pull"), home("full_a"), gym("legs"), home("full_b")],
    };
    return { key: "mix", days: byDays[n] };
  }

  const beginner = level === "beginner";
  if (n === 3) {
    return level === "advanced"
      ? { key: "gym_ppl", days: [gym("push"), gym("pull"), gym("legs")] }
      : { key: "gym_full_body", days: [gym("full_a"), gym("full_b"), gym("full_c")] };
  }
  if (n === 4) return { key: "gym_upper_lower", days: [gym("upper"), gym("lower"), gym("upper"), gym("lower")] };
  if (n === 5) {
    return beginner
      ? { key: "gym_upper_lower", days: [gym("upper"), gym("lower"), gym("cardio_core"), gym("upper"), gym("lower")] }
      : { key: "gym_ul_ppl", days: [gym("upper"), gym("lower"), gym("push"), gym("pull"), gym("legs")] };
  }
  return beginner
    ? { key: "gym_upper_lower", days: [gym("upper"), gym("lower"), gym("cardio_core"), gym("upper"), gym("lower"), gym("cardio_core")] }
    : { key: "gym_ppl", days: [gym("push"), gym("pull"), gym("legs"), gym("push"), gym("pull"), gym("legs")] };
}

// ─── Exercise selection ─────────────────────────────────────────────────────

const MAX_DIFFICULTY: Record<Level, number> = { beginner: 1, intermediate: 2, advanced: 3 };
const TARGET_DIFFICULTY: Record<Level, number> = { beginner: 1, intermediate: 2, advanced: 2 };

export function availableEquipment(setting: Setting, owned: HomeEquipment[]): Set<Equipment> {
  if (setting === "gym") return new Set<Equipment>(["dumbbells", "bands", "pullup_bar", "bench", "barbell", "machine", "cable", "kettlebell"]);
  return new Set<Equipment>(owned);
}

export type SelectionContext = {
  setting: Setting;
  level: Level;
  equipment: Set<Equipment>;
  lowImpact: boolean;
  noSupine: boolean;
};

export function isAllowed(ex: Exercise, ctx: SelectionContext, maxDifficulty = MAX_DIFFICULTY[ctx.level]) {
  return (
    ex.settings.includes(ctx.setting) &&
    ex.equipment.every((e) => ctx.equipment.has(e)) &&
    ex.difficulty <= maxDifficulty &&
    !(ctx.lowImpact && ex.impact === "high") &&
    !(ctx.noSupine && ex.supine)
  );
}

function score(ex: Exercise, ctx: SelectionContext, kind: SlotKind) {
  let target = TARGET_DIFFICULTY[ctx.level];
  if (ctx.level === "advanced" && kind === "main") target = 3;
  if (kind === "accessory" || kind === "core") target = Math.min(target, 2);
  let sc = -Math.abs(ex.difficulty - target) * 2;
  // Home plans are bodyweight-first; equipment versions stay one swap away.
  if (ctx.setting === "home") sc -= ex.equipment.length * 1.5;
  if (ctx.setting === "gym" && kind !== "core" && kind !== "finisher") {
    // At the gym, strength slots use loadable machine and free-weight lifts.
    if (ex.load) sc += 2.5;
    // Beginners learn on machines and dumbbells before barbells; others favour barbells.
    if (ex.equipment.includes("barbell")) sc += ctx.level === "beginner" ? -2 : 0.5;
  }
  // Past the beginner stage, skip same-difficulty regressions (chair squat → bodyweight squat).
  if (ctx.level !== "beginner" && ex.harder && getExercise(ex.harder).difficulty === ex.difficulty) sc -= 0.5;
  // Jumping belongs in finishers; strength slots start with the controlled version.
  if (ex.impact === "high" && kind !== "finisher") sc -= 2.5;
  // Time-based cardio finishers are easier to scale than rep-based ones.
  if (kind === "finisher" && ex.mode === "time") sc += 0.5;
  return sc;
}

export function candidates(roles: Role[], ctx: SelectionContext, kind: SlotKind = "main"): Exercise[] {
  for (const role of roles) {
    const list = EXERCISES.filter((e) => e.role === role && isAllowed(e, ctx))
      .map((e, i) => ({ e, sc: score(e, ctx, kind), i }))
      .sort((a, b) => b.sc - a.sc || a.i - b.i)
      .map((x) => x.e);
    if (list.length) return list;
  }
  return [];
}

/** Alternatives for the swap button: same role first, then same main muscle. */
export function swapOptions(exerciseId: string, ctx: SelectionContext, exclude: string[] = []): Exercise[] {
  const ex = getExercise(exerciseId);
  const skip = new Set([exerciseId, ...exclude]);
  const sameRole = EXERCISES.filter((e) => e.role === ex.role && !skip.has(e.id) && isAllowed(e, ctx, 3));
  const sameMuscle = EXERCISES.filter(
    (e) =>
      e.role !== ex.role &&
      !["warmup", "cooldown", "recovery"].includes(e.role) &&
      e.muscles[0] === ex.muscles[0] &&
      !skip.has(e.id) &&
      isAllowed(e, ctx, 3),
  );
  const byCloseness = (a: Exercise, b: Exercise) => Math.abs(a.difficulty - ex.difficulty) - Math.abs(b.difficulty - ex.difficulty);
  return [...sameRole.sort(byCloseness), ...sameMuscle.sort(byCloseness)].slice(0, 8);
}

// ─── Dosage ─────────────────────────────────────────────────────────────────

const clampReps = (ex: Exercise, lo: number, hi: number, add: number): [number, number] => {
  if (ex.repRange) {
    const step = Math.floor(add / 2);
    return [ex.repRange[0] + step, ex.repRange[1] + step];
  }
  const cap = Math.max(3, Math.floor(60 / (ex.secPerRep ?? 3)));
  const scale = ex.perSide ? 0.8 : 1;
  const l = Math.max(3, Math.min(cap, Math.round(lo * scale)));
  const h = Math.max(l, Math.min(cap, Math.round(hi * scale)));
  return [l, h];
};

function dose(ex: Exercise, kind: SlotKind, setting: Setting, input: ProgramInput, week: number): Omit<Prescription, "slot" | "exerciseId"> {
  const { level, goal } = input;
  const li = level === "beginner" ? 0 : level === "intermediate" ? 1 : 2;
  const loss = goal === "lose";

  if (ex.mode === "time") {
    const base = kind === "finisher" ? [25, 30, 40][li] : [20, 30, 40][li];
    const seconds = base + [0, 5, 10, 15][week] * (li === 0 ? 1 : 1.5);
    const sets = kind === "finisher" ? [2, 3, 3][li] + (week >= 2 ? 1 : 0) : [2, 3, 3][li];
    // Cardio machines run as a single steady block.
    if (ex.role === "conditioning" && ex.equipment.includes("machine")) {
      return { sets: 1, seconds: (kind === "finisher" ? [10, 12, 15][li] : 8) * 60 + week * 60, restSec: 0 };
    }
    return { sets, seconds: Math.round(seconds / 5) * 5, restSec: loss ? 20 : 30 };
  }

  if (setting === "home" || !ex.load) {
    const [lo, hi] = [
      [8, 10],
      [12, 15],
      [15, 20],
    ][li];
    const add = [0, 2, 2, 4][week];
    const reps = clampReps(ex, lo + add, hi + add, add);
    const baseSets = kind === "main" ? [2, 3, 3][li] : 2;
    const sets = Math.min(5, baseSets + (week >= 2 && kind === "main" ? 1 : 0));
    let restSec = loss ? Math.max(20, [45, 40, 30][li] - (week >= 2 ? 10 : 0)) : [60, 60, 45][li];
    // Hard bodyweight strength moves (pull-ups, decline push-ups) need full recovery between sets.
    if (ex.repRange && ex.role !== "conditioning") restSec = Math.max(restSec, loss ? 60 : 90);
    return { sets, reps, restSec };
  }

  // Loaded gym exercise.
  const gain = goal === "gain";
  const reps: [number, number] = kind === "main" ? (gain ? (li === 0 ? [8, 12] : [6, 10]) : [8, 12]) : [10, 15];
  const baseSets = kind === "main" ? (li === 0 ? 3 : 4) : li === 0 ? 2 : 3;
  const sets = Math.min(5, baseSets + (week >= 2 && kind === "main" ? 1 : 0));
  const restSec = kind === "main" ? (gain ? [90, 120, 150][li] : [75, 90, 90][li]) : 60;
  return { sets, reps, restSec };
}

// ─── Warm-up, cool-down, recovery ───────────────────────────────────────────

const p = (exerciseId: string, sets: number, amount: number, restSec = 0): Omit<Prescription, "slot"> =>
  getExercise(exerciseId).mode === "time" ? { exerciseId, sets, seconds: amount, restSec } : { exerciseId, sets, reps: [amount, amount], restSec };

function warmup(setting: Setting, focus: string, input: ProgramInput): Omit<Prescription, "slot">[] {
  const items =
    setting === "gym"
      ? [p("stationary_bike", 1, 240), p("arm_circles", 1, 30), p("hip_circles", 1, 30)]
      : [p("march_in_place", 1, 60), p("arm_circles", 1, 30), p("hip_circles", 1, 30)];
  items.push(input.level === "beginner" ? p("cat_cow", 1, 30) : p("worlds_greatest_stretch", 1, 20));
  if (["lower", "legs", "full", "hiit"].includes(focus)) items.push(p("bodyweight_squat", 1, 10));
  else if (input.level !== "beginner") items.push(p("inchworm", 1, 5));
  if (focus === "hiit" && !input.lowImpact) items.push(p("jumping_jacks", 1, 30));
  return items;
}

function cooldown(focus: string, input: ProgramInput): Omit<Prescription, "slot">[] {
  const lowerFocus = ["lower", "legs", "full", "hiit", "cardio_core"].includes(focus);
  const items = lowerFocus
    ? [p("quad_stretch", 1, 30), p("hamstring_stretch", 1, 40), p("figure_four_stretch", 1, 30), p("childs_pose", 1, 40)]
    : [p("chest_stretch", 1, 40), p("childs_pose", 1, 40), p("hamstring_stretch", 1, 30)];
  return input.noSupine ? items.filter((x) => !getExercise(x.exerciseId).supine) : items;
}

function recovery(input: ProgramInput, week: number): Omit<Prescription, "slot">[] {
  const walkMin = input.level === "beginner" ? 15 : 20;
  return [p("brisk_walk", 1, (walkMin + week * 2) * 60), p("mobility_flow", 1, 8 * 60)];
}

const withSlots = (items: Omit<Prescription, "slot">[], from = 0): Prescription[] => items.map((x, i) => ({ ...x, slot: from + i }));

// ─── Session length ─────────────────────────────────────────────────────────

const MINUTES_CAP: Record<Setting, Record<Level, number>> = {
  home: { beginner: 32, intermediate: 38, advanced: 42 },
  gym: { beginner: 50, intermediate: 62, advanced: 68 },
};

function fitToTime(day: ProgramDay, kinds: SlotKind[], input: ProgramInput) {
  const cap = MINUTES_CAP[day.setting][input.level];
  const minutes = () => estimateDay(day, input.weightKg).minutes;
  const lastIndex = (pred: (i: number) => boolean) => [...day.main.keys()].reverse().find(pred);
  // Trim sets (accessories first), then drop accessories, then extra core work.
  for (let guard = 0; minutes() > cap && guard < 30; guard++) {
    const trim =
      lastIndex((i) => kinds[i] === "accessory" && day.main[i].sets > 2) ??
      lastIndex((i) => kinds[i] !== "finisher" && day.main[i].sets > 2);
    if (trim !== undefined) {
      day.main[trim].sets--;
      continue;
    }
    if (day.main.length <= 4) break;
    const drop = lastIndex((i) => kinds[i] === "accessory") ?? lastIndex((i) => kinds[i] === "core" && kinds.filter((k) => k === "core").length > 1);
    if (drop === undefined) break;
    day.main.splice(drop, 1);
    kinds.splice(drop, 1);
  }
  day.main.forEach((m, i) => (m.slot = i));
}

// ─── Program ────────────────────────────────────────────────────────────────

/**
 * Builds a 4-week program as a sequence of days. Days are completed in order;
 * the calendar mapping (and what happens on a missed day) lives in progress.ts.
 */
export function generateProgram(input: ProgramInput): Program {
  const { key, days: plans } = split(input);
  const rhythm = RHYTHM[input.daysPerWeek];
  const days: ProgramDay[] = [];
  let firstWorkoutSeen = false;

  for (let week = 0; week < PROGRAM_WEEKS; week++) {
    let w = 0;
    const seenFocus = new Map<string, number>();
    for (let d = 0; d < 7; d++) {
      const index = week * 7 + d;
      const code = rhythm[d];
      const kind: DayKind = code === "W" ? "workout" : code === "A" ? "recovery" : "rest";
      if (kind !== "workout") {
        const main = kind === "recovery" ? withSlots(recovery(input, week)) : [];
        const day: ProgramDay = { index, week: week + 1, kind, focus: kind, setting: input.location === "gym" ? "gym" : "home", isIntro: false, warmup: [], main, cooldown: [], estMinutes: 0 };
        day.estMinutes = estimateDay(day, input.weightKg).minutes;
        days.push(day);
        continue;
      }

      const plan = plans[w++ % plans.length];
      const variant = seenFocus.get(plan.template.focus + plan.setting) ?? 0;
      seenFocus.set(plan.template.focus + plan.setting, variant + 1);
      const isIntro = !firstWorkoutSeen;
      firstWorkoutSeen = true;

      const ctx: SelectionContext = {
        setting: plan.setting,
        level: input.level,
        equipment: availableEquipment(plan.setting, input.equipment),
        lowImpact: !!input.lowImpact,
        noSupine: !!input.noSupine,
      };
      const used = new Set<string>();
      const main: Prescription[] = [];
      const kinds: SlotKind[] = [];
      for (const slot of plan.template.slots) {
        if (isIntro && slot.kind === "finisher" && plan.template.focus !== "hiit" && plan.template.focus !== "cardio_core") continue;
        const list = candidates(slot.roles, ctx, slot.kind).filter((e) => !used.has(e.id));
        if (!list.length) continue;
        // Repeated focuses within a week (e.g. a second upper day) rotate to the next-best exercise.
        let ex = list[variant % list.length];
        if (week >= 2 && !isIntro && ex.harder && !ex.load) {
          const harder = getExercise(ex.harder);
          const cap = Math.min(3, MAX_DIFFICULTY[input.level] + 1);
          if (!used.has(harder.id) && harder.impact !== "high" && isAllowed(harder, ctx, cap)) ex = harder;
        }
        used.add(ex.id);
        const dosage = dose(ex, slot.kind, plan.setting, input, week);
        // Planned loads step up ~5% a week; logged sessions refine this (see suggestOverload).
        const base = suggestLoad(ex, input);
        const loadKg = base != null && ex.load ? Math.max(ex.load.minKg ?? 0, roundLoad(base * (1 + 0.05 * week), ex.load.implement)) : null;
        main.push({ slot: main.length, exerciseId: ex.id, ...dosage, ...(loadKg != null ? { loadKg } : {}) });
        kinds.push(slot.kind);
      }

      // Day 1 is a gentle introduction: fewer sets, easier reps or lighter loads, longer rests.
      if (isIntro) {
        for (const m of main) {
          const ex = getExercise(m.exerciseId);
          if (m.sets > 1) m.sets = Math.max(2, m.sets - 1);
          if (ex.load && m.loadKg != null) m.loadKg = Math.max(ex.load.minKg ?? 0, roundLoad(m.loadKg * 0.85, ex.load.implement));
          else if (m.reps) m.reps = [Math.max(4, m.reps[0] - 2), Math.max(4, m.reps[1] - 2)];
          if (m.seconds && m.sets > 1) m.seconds = Math.max(15, m.seconds - 5);
          m.restSec += 15;
        }
      }

      const day: ProgramDay = {
        index,
        week: week + 1,
        kind,
        focus: plan.template.focus,
        setting: plan.setting,
        isIntro,
        warmup: withSlots(warmup(plan.setting, plan.template.focus, input), 100),
        main,
        cooldown: withSlots(cooldown(plan.template.focus, input), 200),
        estMinutes: 0,
      };
      fitToTime(day, kinds, input);
      day.estMinutes = estimateDay(day, input.weightKg).minutes;
      days.push(day);
    }
  }

  return {
    name: programName(key, input),
    split: key,
    location: input.location,
    level: input.level,
    goal: input.goal,
    daysPerWeek: input.daysPerWeek,
    weeks: PROGRAM_WEEKS,
    days,
  };
}

const SPLIT_NAMES: Record<string, string> = {
  home_full_body: "Home Full Body",
  home_split: "Home Strength & Cardio",
  gym_full_body: "Gym Full Body",
  gym_upper_lower: "Gym Upper / Lower",
  gym_ppl: "Gym Push / Pull / Legs",
  gym_ul_ppl: "Gym Upper / Lower + PPL",
  mix: "Gym + Home Hybrid",
};

function programName(key: string, input: ProgramInput) {
  return `${SPLIT_NAMES[key] ?? key} · ${input.daysPerWeek} days`;
}

/** Applies user swaps. Keys: "<dayIndex>:<slot>" for one day, "*:<exerciseId>" for every day. */
export function applySwaps(day: ProgramDay, swaps: Record<string, string>): ProgramDay {
  const swap = (items: Prescription[]) =>
    items.map((it) => {
      const to = swaps[`${day.index}:${it.slot}`] ?? swaps[`*:${it.exerciseId}`];
      if (!to || to === it.exerciseId) return it;
      const ex = getExercise(to);
      const from = getExercise(it.exerciseId);
      const next: Prescription = { ...it, exerciseId: to };
      // Keep the dosage shape valid for the new exercise.
      if (ex.mode === "time" && from.mode === "reps") {
        delete next.reps;
        next.seconds = 30;
      } else if (ex.mode === "reps" && from.mode === "time") {
        delete next.seconds;
        next.reps = [10, 12];
      }
      if (!ex.load) delete next.loadKg;
      return next;
    });
  return { ...day, warmup: swap(day.warmup), main: swap(day.main), cooldown: swap(day.cooldown) };
}
