import { describe, expect, it } from "vitest";
import { assessBmi, computeBmi } from "@/lib/nutrition/bmi";
import { ageFromDob, bmrMifflinStJeor, tdee } from "@/lib/nutrition/energy";
import { screenHealth } from "@/lib/nutrition/safety";
import { CALORIE_FLOOR, computeTargets, projectWeight } from "@/lib/nutrition/targets";
import type { HealthInput } from "@/lib/nutrition/types";

const base: HealthInput = {
  ageYears: 34,
  sex: "female",
  heightCm: 160,
  weightKg: 72,
  targetWeightKg: 62,
  activity: "light",
  planStyle: "balanced",
  pace: "steady",
  conditions: [],
  pregnancy: "none",
};

describe("BMI", () => {
  it("computes kg/m² to one decimal", () => {
    expect(computeBmi(72, 160)).toBe(28.1);
    expect(computeBmi(70, 175)).toBe(22.9);
  });
  it("classifies with WHO and Asian-Indian bands", () => {
    const a = assessBmi(70, 175, 30);
    if (a.kind !== "adult") throw new Error("expected adult");
    expect(a.who.id).toBe("healthy");
    expect(a.asianIndian.id).toBe("healthy");
    const b = assessBmi(74, 175, 30); // 24.2
    if (b.kind !== "adult") throw new Error();
    expect(b.who.id).toBe("healthy");
    expect(b.asianIndian.id).toBe("overweight");
  });
  it("does not apply adult categories under 18", () => {
    expect(assessBmi(60, 160, 15).kind).toBe("under18");
  });
});

describe("energy", () => {
  it("Mifflin-St Jeor matches reference values", () => {
    // 10*72 + 6.25*160 - 5*34 - 161 = 1389
    expect(bmrMifflinStJeor("female", 72, 160, 34)).toBe(1389);
    // 10*80 + 6.25*178 - 5*40 + 5 = 1717.5 → 1718
    expect(bmrMifflinStJeor("male", 80, 178, 40)).toBe(1718);
  });
  it("applies activity factor", () => {
    expect(tdee(1389, "light")).toBe(1910);
  });
  it("derives age from date of birth", () => {
    expect(ageFromDob("1990-06-15", new Date("2026-06-14T12:00:00Z"))).toBe(35);
    expect(ageFromDob("1990-06-15", new Date("2026-06-15T12:00:00Z"))).toBe(36);
  });
});

describe("targets", () => {
  it("creates a moderate deficit capped at 20% of maintenance", () => {
    const t = computeTargets(base);
    expect(t.goal).toBe("lose");
    expect(t.maintenanceKcal).toBe(1910);
    expect(t.dailyDeficit).toBeLessThanOrEqual(1910 * 0.2 + 5);
    expect(t.kcal).toBeGreaterThanOrEqual(CALORIE_FLOOR.female);
  });
  it("never goes below the sex-specific floor", () => {
    const t = computeTargets({ ...base, heightCm: 148, weightKg: 58, targetWeightKg: 48, activity: "sedentary", ageYears: 60 });
    expect(t.kcal).toBeGreaterThanOrEqual(1200);
    const m = computeTargets({ ...base, sex: "male", heightCm: 160, weightKg: 62, targetWeightKg: 55, activity: "sedentary", ageYears: 70 });
    expect(m.kcal).toBeGreaterThanOrEqual(1500);
  });
  it("never assigns a 1000 kcal diet", () => {
    for (const w of [50, 60, 80, 120]) {
      const t = computeTargets({ ...base, weightKg: w, targetWeightKg: w - 10, activity: "sedentary" });
      expect(t.kcal).toBeGreaterThan(1000);
    }
  });
  it("macro calories add up to the calorie target (±3%)", () => {
    for (const planStyle of ["balanced", "low_carb", "keto", "high_protein"] as const) {
      const t = computeTargets({ ...base, planStyle });
      const total = t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9;
      expect(Math.abs(total - t.kcal) / t.kcal).toBeLessThan(0.03);
    }
  });
  it("keto sets a bounded net-carb limit", () => {
    expect(computeTargets({ ...base, planStyle: "keto" }).netCarbLimitG).toBe(30);
    expect(computeTargets({ ...base, planStyle: "keto", netCarbLimitG: 5 }).netCarbLimitG).toBe(20);
    expect(computeTargets({ ...base, planStyle: "keto", netCarbLimitG: 90 }).netCarbLimitG).toBe(50);
  });
  it("anchors protein to reference weight at high BMI", () => {
    const t = computeTargets({ ...base, weightKg: 110, targetWeightKg: 80 });
    expect(t.proteinG).toBeLessThan(110 * 1.3);
  });
  it("gives a weight-loss range, never a single promise", () => {
    const t = computeTargets(base);
    expect(t.weeklyLossKg[0]).toBeLessThan(t.weeklyLossKg[1]);
    expect(t.weeklyLossKg[1]).toBeLessThanOrEqual(0.5);
  });
  it("respects a custom water goal", () => {
    expect(computeTargets({ ...base, waterGoalMl: 2200 }).waterMl).toBe(2200);
    expect(computeTargets(base).waterMl).toBe(2500);
  });
});

describe("safety screening", () => {
  it("blocks keto for diabetes on glucose-lowering medication", () => {
    const t = computeTargets({ ...base, planStyle: "keto", conditions: ["diabetes_meds"] });
    expect(t.style).toBe("balanced");
    expect(t.styleNote).toMatch(/doctor/i);
    expect(t.screening.requiresProfessional).toBe(true);
  });
  it("pregnancy: maintenance only, no restrictive plans", () => {
    const t = computeTargets({ ...base, pregnancy: "pregnant", planStyle: "keto" });
    expect(t.goal).toBe("maintain");
    expect(t.style).toBe("balanced");
    expect(t.waterMl).toBeGreaterThan(computeTargets(base).waterMl);
  });
  it("kidney disease blocks high-protein and keto, lowers protein", () => {
    const s = screenHealth({ ...base, conditions: ["kidney"] });
    expect(s.allowedStyles).not.toContain("keto");
    expect(s.allowedStyles).not.toContain("high_protein");
    const t = computeTargets({ ...base, conditions: ["kidney"], planStyle: "high_protein" });
    expect(t.proteinG).toBeLessThanOrEqual(Math.round(62 * 0.8) + 1);
  });
  it("teens get maintenance and balanced only", () => {
    const t = computeTargets({ ...base, ageYears: 15, planStyle: "keto" });
    expect(t.goal).toBe("maintain");
    expect(t.style).toBe("balanced");
  });
  it("no deficit when underweight", () => {
    const t = computeTargets({ ...base, weightKg: 45, targetWeightKg: 42 });
    expect(t.goal).toBe("maintain");
  });
  it("raises a too-low target to BMI 18.5", () => {
    const t = computeTargets({ ...base, targetWeightKg: 40 });
    expect(t.effectiveTargetKg).toBeGreaterThanOrEqual(47);
    expect(t.screening.flags.some((f) => f.code === "target_too_low")).toBe(true);
  });
  it("eating disorder history: no deficit", () => {
    expect(computeTargets({ ...base, conditions: ["eating_disorder"] }).goal).toBe("maintain");
  });
});

describe("projection", () => {
  it("produces a band that ends at the target", () => {
    const { points, weeksRange } = projectWeight(72, 62, [0.3, 0.5]);
    expect(weeksRange).toEqual([20, 34]);
    expect(points.at(-1)!.fast).toBe(62);
    expect(points.every((p) => p.slow >= p.fast)).toBe(true);
  });
});
