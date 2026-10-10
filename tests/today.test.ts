import { describe, expect, it } from "vitest";
import { QUICK_FOODS, quickFoods } from "@/lib/today/quickFoods";
import { buildTimeline, dayTotals, timeForPosition, todayPrompts, type PromptInput } from "@/lib/today/timeline";

describe("day timeline", () => {
  it("orders everything by time, swaps the plan for the real session, and puts untimed cardio last", () => {
    const items = buildTimeline({
      wake: { time: "06:40", source: "device" },
      sleep: { minutes: 412, start: "23:10" },
      foods: [
        { time: "07:05", slot: "morning_drink", title: "Warm lemon water", kcal: 6, proteinG: 0, carbsG: 2, fatG: 0, fibreG: 0, logId: "a" },
        { time: "17:20", slot: "pre_workout", title: "Banana + a few peanuts", kcal: 190, proteinG: 5, carbsG: 30, fatG: 7, fibreG: 4, logId: "b" },
      ],
      workoutPlan: "18:00",
      sessions: [
        { id: "s1", start: "18:05", end: "18:50", status: "completed", dayIndex: 16, recovery: false, durationSec: 2700, kcal: 310, label: null, query: "" },
        { id: "s2", start: "07:30", end: "07:50", status: "completed", dayIndex: 2, recovery: false, durationSec: 1200, kcal: 60, label: "Tai Chi Guide", query: "?p=x" },
      ],
      cardio: [{ time: null, activity: "walk", minutes: 30, kcal: 120, id: "c" }],
    });
    expect(items.map((i) => i.kind)).toEqual(["wake", "food", "workout", "food", "workout", "cardio"]);
    expect(items[0]).toMatchObject({ sleepMinutes: 412, sleepStart: "23:10", source: "device" });
    expect(items[2]).toMatchObject({ label: "Tai Chi Guide", query: "?p=x" });
    expect(items[4]).toMatchObject({ minutes: 45, kcal: 310, end: "18:50", label: null });
    // The main session replaced the 18:00 plan; the day's food adds up.
    expect(items.some((i) => i.kind === "workout_plan")).toBe(false);
    expect(dayTotals(items)).toEqual({ kcal: 196, proteinG: 5, carbsG: 32, fatG: 7, fibreG: 4 });
  });

  it("shows the planned time until the workout starts", () => {
    const items = buildTimeline({ wake: null, sleep: null, foods: [], workoutPlan: "18:30", sessions: [], cardio: [] });
    expect(items).toEqual([{ kind: "workout_plan", time: "18:30" }]);
  });
});

describe("drag to a new time", () => {
  it("lands halfway between the new neighbours, rounded to 5 minutes", () => {
    const times = ["07:00", "08:00", "13:00"];
    expect(timeForPosition(times, 1)).toBe("07:30");
    expect(timeForPosition(times, 2)).toBe("10:30");
    expect(timeForPosition(times, 0)).toBe("06:30");
    expect(timeForPosition(times, 3)).toBe("13:30");
    expect(timeForPosition([null, "09:10"], 1)).toBe("08:40");
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

describe("local time to instant", () => {
  it("places HH:MM on the date in the app's time zone (IST by default)", async () => {
    const { zonedInstant } = await import("@/server/time");
    expect(zonedInstant("2026-10-10", "06:30").toISOString()).toBe("2026-10-10T01:00:00.000Z");
    expect(zonedInstant("2026-10-10", "00:15").toISOString()).toBe("2026-10-09T18:45:00.000Z");
  });
});
