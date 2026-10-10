import { describe, expect, it } from "vitest";
import { QUICK_FOODS, quickFoods } from "@/lib/today/quickFoods";
import { buildTimeline, todayPrompts, type PromptInput } from "@/lib/today/timeline";

describe("day timeline", () => {
  it("orders everything by time, swaps the plan for the real session, and puts untimed cardio last", () => {
    const items = buildTimeline({
      wake: { time: "06:40", source: "device" },
      sleep: { minutes: 412, start: "23:10" },
      foods: [
        { time: "07:05", slot: "morning_drink", title: "Warm lemon water", kcal: 6, proteinG: 0, logId: "a" },
        { time: "17:20", slot: "pre_workout", title: "Banana + a few peanuts", kcal: 190, proteinG: 5, logId: "b" },
      ],
      workoutPlan: "18:00",
      session: { start: "18:05", end: "18:50", status: "completed", dayIndex: 16, recovery: false, durationSec: 2700, kcal: 310 },
      cardio: [{ time: null, activity: "walk", minutes: 30, kcal: 120, id: "c" }],
    });
    expect(items.map((i) => i.kind)).toEqual(["wake", "food", "food", "workout", "cardio"]);
    expect(items[0]).toMatchObject({ sleepMinutes: 412, sleepStart: "23:10", source: "device" });
    expect(items[3]).toMatchObject({ minutes: 45, kcal: 310, end: "18:50" });
  });

  it("shows the planned time until the workout starts", () => {
    const items = buildTimeline({ wake: null, sleep: null, foods: [], workoutPlan: "18:30", session: null, cardio: [] });
    expect(items).toEqual([{ kind: "workout_plan", time: "18:30" }]);
  });
});

describe("check-in prompts", () => {
  const base: PromptInput = {
    now: "07:10",
    wakeLogged: false,
    morningDrinkLogged: false,
    workoutKind: "workout",
    sessionStatus: "none",
    workoutPlan: null,
    lastAte: null,
    preWorkoutLogged: false,
    proteinLogged: false,
    sessionEnd: null,
    proteinLeftG: 90,
  };

  it("asks wake-up, morning drink and training time in the morning", () => {
    expect(todayPrompts(base).slice(0, 3)).toEqual(["wake", "morning_drink", "plan_workout"]);
  });

  it("asks about food when training is near and nothing was eaten for 2 hours", () => {
    const p = { ...base, now: "16:30", wakeLogged: true, morningDrinkLogged: true, workoutPlan: "18:00", lastAte: "13:30" };
    expect(todayPrompts(p)).toEqual(["pre_workout"]);
    expect(todayPrompts({ ...p, lastAte: "15:45" })).toEqual([]);
    // Too early to ask: training is in 5 hours.
    expect(todayPrompts({ ...p, now: "13:00", lastAte: "09:00" })).toEqual([]);
  });

  it("says it's time to start, then asks for protein after the workout", () => {
    const p = { ...base, now: "17:55", wakeLogged: true, morningDrinkLogged: true, workoutPlan: "18:00", lastAte: "17:00" };
    expect(todayPrompts(p)).toEqual(["start_workout"]);
    const after = { ...p, now: "19:10", workoutKind: null, sessionStatus: "completed" as const, sessionEnd: "18:50" };
    expect(todayPrompts(after)).toEqual(["protein"]);
    expect(todayPrompts({ ...after, proteinLogged: true })).toEqual([]);
    // Later in the evening on a rest day, a remaining protein gap is flagged.
    expect(todayPrompts({ ...after, now: "20:00", sessionStatus: "none", sessionEnd: null, workoutKind: "rest", proteinLeftG: 40 })).toEqual(["protein_gap"]);
  });
});

describe("quick foods", () => {
  it("filters by diet and keto, and hides protein powders when they aren't safe", () => {
    const vegan = quickFoods("protein", { diet: "vegan" });
    expect(vegan.every((f) => f.diet === "vegan")).toBe(true);
    expect(vegan.some((f) => f.id === "whey")).toBe(false);
    expect(vegan.some((f) => f.id === "plant_protein")).toBe(true);
    expect(quickFoods("protein", { diet: "vegetarian" }).some((f) => f.id === "whey")).toBe(true);
    expect(quickFoods("protein", { diet: "non_vegetarian", allowSupplements: false }).some((f) => f.supplement)).toBe(false);
    expect(quickFoods("pre", { diet: "vegan", keto: true }).map((f) => f.id)).toEqual(["coffee_almonds"]);
  });

  it("has consistent energy values (4/4/9 kcal per g, within 25%)", () => {
    for (const f of QUICK_FOODS.filter((x) => x.kcal >= 50)) {
      const est = f.proteinG * 4 + (f.carbsG - f.fibreG) * 4 + f.fibreG * 2 + f.fatG * 9;
      expect(Math.abs(est - f.kcal) / f.kcal, f.id).toBeLessThan(0.25);
    }
    expect(new Set(QUICK_FOODS.map((f) => f.id)).size).toBe(QUICK_FOODS.length);
  });
});
