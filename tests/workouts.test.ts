import { describe, expect, it } from "vitest";
import { EXERCISES, EXERCISE_BY_ID, getExercise } from "@/lib/workouts/exercises";
import { applySwaps, availableEquipment, generateProgram, swapOptions, type ProgramInput } from "@/lib/workouts/generator";
import { estimatedOneRepMax, estimateDay, kcalFromMet, suggestLoad, suggestOverload } from "@/lib/workouts/load";
import { addDays, replayProgram, weekStart } from "@/lib/workouts/progress";
import { ADD_BACK_CAP_KCAL, fuelIdeas, trainingDayTargets, workoutAddBack } from "@/lib/workouts/fuel";
import { DAYS_PER_WEEK, LEVELS, LOCATIONS, MUSCLES, PATTERNS, ROLES, type DayKind } from "@/lib/workouts/types";

const base: ProgramInput = { location: "home", level: "beginner", goal: "lose", daysPerWeek: 3, equipment: [], sex: "female", weightKg: 72 };

describe("exercise library", () => {
  it("has 60+ exercises with complete, valid metadata", () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(60);
    expect(EXERCISE_BY_ID.size).toBe(EXERCISES.length);
    for (const e of EXERCISES) {
      expect(ROLES).toContain(e.role);
      expect(PATTERNS).toContain(e.pattern);
      e.muscles.forEach((m) => expect(MUSCLES).toContain(m));
      expect(e.steps.length, e.id).toBeGreaterThan(0);
      expect(e.mistakes.length, e.id).toBeGreaterThan(0);
      expect(e.met).toBeGreaterThan(1);
      expect(e.met).toBeLessThanOrEqual(10);
      if (e.mode === "reps") expect(e.secPerRep, e.id).toBeGreaterThan(0);
      if (e.harder) expect(EXERCISE_BY_ID.has(e.harder), `${e.id} → ${e.harder}`).toBe(true);
      if (e.easier) expect(EXERCISE_BY_ID.has(e.easier), `${e.id} → ${e.easier}`).toBe(true);
    }
  });

  it("covers every home movement named in the brief without equipment", () => {
    for (const id of ["bodyweight_squat", "pushup", "reverse_lunge", "plank", "burpee", "glute_bridge", "mountain_climbers"]) {
      expect(getExercise(id).equipment).toEqual([]);
      expect(getExercise(id).settings).toContain("home");
    }
  });
});

describe("program generator", () => {
  it("builds 4 × 7 days with the requested number of workouts per week", () => {
    for (const location of LOCATIONS)
      for (const level of LEVELS)
        for (const daysPerWeek of DAYS_PER_WEEK) {
          const p = generateProgram({ ...base, location, level, daysPerWeek });
          expect(p.days).toHaveLength(28);
          for (let w = 1; w <= 4; w++) {
            const week = p.days.filter((d) => d.week === w);
            expect(week.filter((d) => d.kind === "workout")).toHaveLength(daysPerWeek);
            expect(week.some((d) => d.kind === "rest")).toBe(true);
          }
          for (const d of p.days.filter((d) => d.kind === "workout")) {
            expect(d.main.length, `${location}/${level}/${daysPerWeek} day ${d.index}`).toBeGreaterThanOrEqual(4);
            expect(new Set(d.main.map((m) => m.exerciseId)).size).toBe(d.main.length);
            expect(d.warmup.length).toBeGreaterThan(0);
            expect(d.cooldown.length).toBeGreaterThan(0);
          }
        }
  });

  it("starts with a gentle intro day and builds active recovery into 3–5 day plans", () => {
    const p = generateProgram(base);
    expect(p.days[0].kind).toBe("workout");
    expect(p.days[0].isIntro).toBe(true);
    expect(p.days.filter((d) => d.isIntro)).toHaveLength(1);
    expect(p.days.some((d) => d.kind === "recovery")).toBe(true);
    // The intro has fewer total sets than the same template in week 2.
    const sets = (i: number) => p.days[i].main.reduce((n, m) => n + m.sets, 0);
    const reps = (i: number) => p.days[i].main.reduce((n, m) => n + (m.reps?.[1] ?? 0), 0);
    expect(sets(0) * 100 + reps(0)).toBeLessThan(sets(7) * 100 + reps(7));
  });

  it("progresses volume or difficulty across the four weeks", () => {
    const p = generateProgram(base);
    const volume = (week: number) =>
      p.days
        .filter((d) => d.week === week && d.kind === "workout" && !d.isIntro)
        .flatMap((d) => d.main)
        .reduce((n, m) => n + m.sets * (m.reps ? m.reps[1] : (m.seconds ?? 0) / 3), 0);
    expect(volume(2)).toBeGreaterThan(volume(1) * 0.9);
    expect(volume(3)).toBeGreaterThan(volume(2));
    expect(volume(4)).toBeGreaterThan(volume(3));
    // A harder variation appears by week 3 (incline/knee push-up → push-up).
    const pushes = (w: number) => p.days.filter((d) => d.week === w).flatMap((d) => d.main.map((m) => m.exerciseId));
    expect(pushes(3)).toContain("pushup");
    expect(pushes(1)).not.toContain("pushup");
  });

  it("keeps home sessions roughly 20–40 minutes and gym sessions under ~70", () => {
    for (const level of LEVELS) {
      for (const d of generateProgram({ ...base, level, daysPerWeek: 4 }).days.filter((d) => d.kind === "workout")) {
        expect(d.estMinutes).toBeGreaterThanOrEqual(18);
        expect(d.estMinutes).toBeLessThanOrEqual(45);
      }
      for (const d of generateProgram({ ...base, location: "gym", level, daysPerWeek: 4 }).days.filter((d) => d.kind === "workout")) {
        expect(d.estMinutes).toBeLessThanOrEqual(70);
      }
    }
  });

  it("home plans are bodyweight-only without equipment and use owned equipment otherwise", () => {
    const none = generateProgram({ ...base, daysPerWeek: 5, level: "intermediate" });
    for (const d of none.days) for (const m of [...d.warmup, ...d.main, ...d.cooldown]) expect(getExercise(m.exerciseId).equipment).toEqual([]);
    const db = generateProgram({ ...base, daysPerWeek: 5, level: "intermediate", equipment: ["dumbbells", "pullup_bar"] });
    const used = new Set(db.days.flatMap((d) => d.main.flatMap((m) => getExercise(m.exerciseId).equipment)));
    expect([...used].every((e) => e === "dumbbells" || e === "pullup_bar")).toBe(true);
    expect(used.size).toBeGreaterThan(0);
  });

  it("gym plans use loaded free-weight and machine lifts with suggested weights", () => {
    const p = generateProgram({ ...base, location: "gym", level: "intermediate", goal: "gain", daysPerWeek: 4, sex: "male", weightKg: 75 });
    expect(p.split).toBe("gym_upper_lower");
    const day = p.days[0];
    expect(day.focus).toBe("upper");
    const loaded = day.main.filter((m) => m.loadKg != null);
    expect(loaded.length).toBeGreaterThanOrEqual(4);
    for (const m of loaded) expect(m.loadKg! % 0.5).toBe(0);
    const ids = p.days.flatMap((d) => d.main.map((m) => m.exerciseId));
    expect(ids).toContain("barbell_back_squat");
    expect(ids.some((id) => getExercise(id).equipment.includes("machine"))).toBe(true);
    // Planned loads rise over the block.
    const bench = (w: number) => p.days.find((d) => d.week === w && d.main.some((m) => m.exerciseId === "barbell_bench_press"))!.main.find((m) => m.exerciseId === "barbell_bench_press")!.loadKg!;
    expect(bench(4)).toBeGreaterThan(bench(1));
  });

  it("chooses the classic splits", () => {
    expect(generateProgram({ ...base, location: "gym", daysPerWeek: 3 }).split).toBe("gym_full_body");
    expect(generateProgram({ ...base, location: "gym", level: "advanced", daysPerWeek: 6 }).split).toBe("gym_ppl");
    expect(generateProgram({ ...base, location: "gym", level: "intermediate", daysPerWeek: 5 }).split).toBe("gym_ul_ppl");
    const mix = generateProgram({ ...base, location: "mix", daysPerWeek: 4 });
    expect(new Set(mix.days.filter((d) => d.kind === "workout").map((d) => d.setting))).toEqual(new Set(["gym", "home"]));
  });

  it("respects low-impact and no-supine safety flags", () => {
    const p = generateProgram({ ...base, level: "advanced", daysPerWeek: 6, lowImpact: true, noSupine: true });
    for (const d of p.days)
      for (const m of [...d.warmup, ...d.main, ...d.cooldown]) {
        const e = getExercise(m.exerciseId);
        expect(e.impact, e.id).toBeUndefined();
        expect(e.supine, e.id).toBeFalsy();
      }
  });

  it("is deterministic", () => {
    expect(generateProgram(base)).toEqual(generateProgram(base));
  });
});

describe("swaps", () => {
  const ctx = { setting: "home" as const, level: "beginner" as const, equipment: availableEquipment("home", ["dumbbells"]), lowImpact: false, noSupine: false };

  it("offers same-role alternatives that fit the user's equipment", () => {
    const opts = swapOptions("bodyweight_squat", ctx);
    expect(opts.length).toBeGreaterThan(1);
    expect(opts[0].role).toBe("squat");
    expect(opts.map((o) => o.id)).toContain("goblet_squat");
    expect(opts.every((o) => o.equipment.every((e) => e === "dumbbells"))).toBe(true);
    expect(opts.map((o) => o.id)).not.toContain("barbell_back_squat");
  });

  it("applies one-day and everywhere swaps and keeps the dosage valid", () => {
    const p = generateProgram(base);
    const day = p.days[0];
    const first = day.main[0];
    const one = applySwaps(day, { [`${day.index}:${first.slot}`]: "goblet_squat" });
    expect(one.main[0].exerciseId).toBe("goblet_squat");
    const plankSlot = day.main.find((m) => getExercise(m.exerciseId).mode === "time")!;
    const all = applySwaps(day, { [`*:${plankSlot.exerciseId}`]: "dead_bug" });
    const swapped = all.main.find((m) => m.slot === plankSlot.slot)!;
    expect(swapped.exerciseId).toBe("dead_bug");
    expect(swapped.reps).toBeDefined();
    expect(swapped.seconds).toBeUndefined();
  });
});

describe("energy and loads", () => {
  it("uses the MET formula", () => {
    // 8 MET, 70 kg, 30 min = 294 kcal.
    expect(kcalFromMet(8, 70, 30)).toBeCloseTo(294, 0);
  });

  it("estimates realistic session burns", () => {
    const p = generateProgram(base);
    const e = estimateDay(p.days[2], 72);
    expect(e.kcal).toBeGreaterThan(50);
    expect(e.kcal).toBeLessThan(250);
    expect(e.netKcal).toBeLessThan(e.kcal);
    const rest = p.days.find((d) => d.kind === "rest")!;
    expect(estimateDay(rest, 72).kcal).toBe(0);
  });

  it("suggests conservative starting loads that scale by level and sex", () => {
    const squat = getExercise("barbell_back_squat");
    const m = suggestLoad(squat, { weightKg: 75, sex: "male", level: "beginner" })!;
    const f = suggestLoad(squat, { weightKg: 75, sex: "female", level: "beginner" })!;
    const adv = suggestLoad(squat, { weightKg: 75, sex: "male", level: "advanced" })!;
    expect(m).toBeGreaterThanOrEqual(20);
    expect(m).toBeLessThan(60);
    expect(f).toBeLessThanOrEqual(m);
    expect(adv).toBeGreaterThan(m);
    expect(suggestLoad(getExercise("lateral_raise"), { weightKg: 50, sex: "female", level: "beginner" })).toBeGreaterThanOrEqual(1);
    expect(suggestLoad(getExercise("pushup"), { weightKg: 75, sex: "male", level: "beginner" })).toBeNull();
  });

  it("applies double progression", () => {
    const p = { slot: 0, exerciseId: "barbell_bench_press", sets: 3, reps: [8, 12] as [number, number], restSec: 90, loadKg: 40 };
    const top = [12, 12, 12].map((reps) => ({ reps, weightKg: 40, done: true }));
    expect(suggestOverload(p, top)).toEqual({ kind: "increase", weightKg: 42.5, by: 2.5 });
    const mid = [12, 10, 9].map((reps) => ({ reps, weightKg: 40, done: true }));
    expect(suggestOverload(p, mid)).toEqual({ kind: "hold", weightKg: 40 });
    const short = [7, 6, 6].map((reps) => ({ reps, weightKg: 40, done: true }));
    expect(suggestOverload(p, short)).toEqual({ kind: "reduce", weightKg: 37.5, by: 2.5 });
    const squat = { ...p, exerciseId: "barbell_back_squat" };
    expect(suggestOverload(squat, top)).toMatchObject({ kind: "increase", by: 5 });
    const bw = { slot: 0, exerciseId: "bodyweight_squat", sets: 2, reps: [10, 12] as [number, number], restSec: 45 };
    expect(suggestOverload(bw, [12, 12].map((reps) => ({ reps, weightKg: null, done: true })))).toEqual({ kind: "more_reps", reps: 14 });
    expect(suggestOverload(bw, [])).toEqual({ kind: "none" });
  });

  it("estimates one-rep max with Epley", () => {
    expect(estimatedOneRepMax(100, 1)).toBe(100);
    expect(estimatedOneRepMax(60, 10)).toBe(80);
  });
});

describe("progress replay (no reset on missed days)", () => {
  // W A W R W A R
  const kinds: DayKind[] = ["workout", "recovery", "workout", "rest", "workout", "recovery", "rest", "workout"];
  const start = "2026-10-05"; // a Monday

  it("waits on a missed workout and lets rest days pass", () => {
    // Did day 0 on Monday, skipped Tuesday (recovery passes), missed Wednesday and Thursday.
    const r = replayProgram(kinds, start, [{ dayIndex: 0, date: start }], "2026-10-09", [start, "2026-10-11"]);
    expect(r.position).toBe(2);
    expect(r.cells.map((c) => c.status)).toEqual(["completed", "rest", "missed", "missed", "today", "rest", "upcoming"]);
    expect(r.cells[4].dayIndex).toBe(2);
    expect(r.cells[5].dayIndex).toBe(3);
    expect(r.cells[6].dayIndex).toBe(4);
  });

  it("continues from the same day when the user comes back", () => {
    const comps = [
      { dayIndex: 0, date: start },
      { dayIndex: 2, date: "2026-10-10" },
    ];
    const r = replayProgram(kinds, start, comps, "2026-10-10");
    expect(r.position).toBe(3);
    expect(r.workoutsDone).toBe(2);
    expect(r.doneToday).toBe(true);
  });

  it("training through a rest day skips ahead without losing anything", () => {
    const comps = [
      { dayIndex: 0, date: start },
      { dayIndex: 2, date: "2026-10-06" }, // trained on the recovery day
    ];
    const r = replayProgram(kinds, start, comps, "2026-10-07");
    expect(r.position).toBe(3);
    expect(r.daysDone).toBe(3);
  });

  it("counts a streak across rest days and breaks it on a missed workout", () => {
    const comps = [
      { dayIndex: 0, date: start },
      { dayIndex: 2, date: "2026-10-07" },
    ];
    // Mon done, Tue recovery passed, Wed done, Thu rest passed, Fri today (workout not yet done).
    expect(replayProgram(kinds, start, comps, "2026-10-09").streak).toBe(4);
    // Same but Wednesday missed → streak only counts after the miss.
    const missed = replayProgram(kinds, start, [{ dayIndex: 0, date: start }], "2026-10-08");
    expect(missed.streak).toBe(0);
  });

  it("finishes the program", () => {
    const comps = kinds.map((k, i) => ({ dayIndex: i, date: addDays(start, i) })).filter((_, i) => kinds[i] === "workout");
    const r = replayProgram(kinds, start, comps, addDays(start, 10));
    expect(r.finished).toBe(true);
    expect(r.position).toBe(kinds.length);
  });

  it("finds the Monday of a week", () => {
    expect(weekStart("2026-10-10")).toBe("2026-10-05");
    expect(weekStart("2026-10-05")).toBe("2026-10-05");
    expect(weekStart("2026-10-11")).toBe("2026-10-05");
  });
});

describe("food-planner link", () => {
  const targets = { kcal: 1600, proteinG: 85, carbsG: 190, fatG: 55, netCarbLimitG: null, goal: "lose" as const, style: "balanced" as const };

  it("adds back 50% when losing, 100% otherwise, capped at 600 kcal", () => {
    expect(workoutAddBack(300, "lose")).toBe(150);
    expect(workoutAddBack(300, "fit")).toBe(300);
    expect(workoutAddBack(2000, "gain")).toBe(ADD_BACK_CAP_KCAL);
    expect(workoutAddBack(-10, "lose")).toBe(0);
  });

  it("keeps the deficit on weight loss and raises protein on training days", () => {
    const t = trainingDayTargets(targets, { workoutGoal: "lose", trainingDay: true, burnedNetKcal: 200, referenceWeightKg: 64, allowExtraProtein: true });
    expect(t.kcal).toBe(1700);
    expect(t.proteinG).toBe(96);
    const rest = trainingDayTargets(targets, { workoutGoal: "lose", trainingDay: false, burnedNetKcal: 0, referenceWeightKg: 64, allowExtraProtein: true });
    expect(rest.kcal).toBe(1600);
    expect(rest.proteinG).toBe(85);
  });

  it("muscle gain: more protein every day, small surplus only without a loss target", () => {
    const maintain = { ...targets, goal: "maintain" as const, kcal: 2200 };
    const t = trainingDayTargets(maintain, { workoutGoal: "gain", trainingDay: true, burnedNetKcal: 200, referenceWeightKg: 70, allowExtraProtein: true });
    expect(t.proteinG).toBe(126);
    expect(t.surplusKcal).toBe(150);
    expect(t.kcal).toBe(2200 + 200 + 150);
    const recomp = trainingDayTargets(targets, { workoutGoal: "gain", trainingDay: true, burnedNetKcal: 200, referenceWeightKg: 70, allowExtraProtein: true });
    expect(recomp.surplusKcal).toBe(0);
    // Energy balances: macros add up to the target within rounding.
    const kcalFromMacros = t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9;
    expect(Math.abs(kcalFromMacros - (maintain.proteinG * 4 + maintain.carbsG * 4 + maintain.fatG * 9) - 350)).toBeLessThan(10);
  });

  it("never raises protein when it was capped for medical reasons", () => {
    const t = trainingDayTargets(targets, { workoutGoal: "gain", trainingDay: true, burnedNetKcal: 200, referenceWeightKg: 70, allowExtraProtein: false });
    expect(t.proteinG).toBe(85);
  });

  it("filters pre/post-workout ideas by diet and keto", () => {
    const vegan = fuelIdeas("vegan");
    expect(vegan.every((f) => f.diet === "vegan")).toBe(true);
    expect(fuelIdeas("vegetarian").some((f) => f.id === "curd_rice")).toBe(true);
    expect(fuelIdeas("vegetarian").some((f) => f.id === "egg_bhurji")).toBe(false);
    expect(fuelIdeas("non_vegetarian", { keto: true }).every((f) => f.keto)).toBe(true);
    expect(fuelIdeas("eggitarian", { when: "pre" }).map((f) => f.id)).toContain("idli_sambar");
  });
});
