import { beforeAll, describe, expect, it } from "vitest";
import { loadCatalogue } from "../scripts/lib/catalogue";
import { computeTargets, CALORIE_FLOOR } from "@/lib/nutrition/targets";
import {
  alternativesForSlot,
  fitPortions,
  generatePlan,
  isEligible,
  validateDay,
  type PlannerProfile,
  type PlannerRecipe,
} from "@/lib/planner/engine";

let recipes: PlannerRecipe[] = [];

beforeAll(async () => {
  const cat = await loadCatalogue();
  const ing = new Map(cat.ingredients.map((i) => [i.id, i]));
  recipes = cat.recipes.map((r) => ({
    id: r.id,
    title: r.title,
    course: r.course,
    mealTypes: r.mealTypes,
    cuisine: r.cuisine,
    dietType: r.dietType,
    allergens: r.allergens,
    avoidTags: r.avoidTags,
    equipment: r.equipment,
    totalMin: r.prepMin + r.cookMin,
    ...r.perServing,
    costPerServingInr: r.costPerServingInr,
    isKeto: r.isKeto,
    isLowCarb: r.isLowCarb,
    isHighProtein: r.isHighProtein,
  }));
  expect(ing.size).toBeGreaterThan(150);
}, 30000);

function profileFor(style: PlannerProfile["style"], diet: PlannerProfile["diet"], extra: Partial<PlannerProfile> = {}): PlannerProfile {
  const t = computeTargets({
    ageYears: 35, sex: "female", heightCm: 160, weightKg: 75, targetWeightKg: 62,
    activity: "light", planStyle: style, pace: "steady", conditions: [], pregnancy: "none",
  });
  return {
    diet, allergies: [], avoidFoods: [], cuisines: ["tamil_nadu", "kerala"], cookingTimeMin: null,
    equipment: ["pressure_cooker", "mixer_grinder", "air_fryer", "oven", "blender", "idli_stand", "steamer", "skewers", "non_stick_pan"],
    budgetPerDayInr: null, slots: ["breakfast", "lunch", "evening", "dinner"], style,
    targets: { kcal: t.kcal, proteinG: t.proteinG, fibreG: t.fibreG, netCarbLimitG: t.netCarbLimitG, kcalFloor: CALORIE_FLOOR.female },
    ...extra,
  };
}

const lookup = (id: string) => recipes.find((r) => r.id === id);

describe("portion fitting", () => {
  it("scales portions toward the calorie target", () => {
    const main = { ...recipes[0], course: "main" as const, kcal: 200, proteinG: 10 };
    const base = { ...recipes[0], id: "b", course: "base" as const, kcal: 150, proteinG: 3 };
    const p = fitPortions([base, main], 525, 0.07);
    const kcal = 150 * p[0] + 200 * p[1];
    expect(Math.abs(kcal - 525)).toBeLessThan(40);
  });
});

describe("meal plan generation", () => {
  it("balanced vegetarian 7-day plan stays near target and respects diet", () => {
    const profile = profileFor("balanced", "vegetarian");
    const { days } = generatePlan(recipes, profile, 7, 42);
    expect(days).toHaveLength(7);
    for (const d of days) {
      const rep = validateDay(d, lookup, profile);
      expect(rep.issues.filter((i) => i.code === "diet" || i.code === "allergen")).toEqual([]);
      expect(Math.abs(rep.totals.kcal - profile.targets.kcal) / profile.targets.kcal).toBeLessThan(0.2);
      expect(d.meals.length).toBe(4);
    }
  });

  it("keto plans keep every day within the net-carb limit", () => {
    const profile = profileFor("keto", "non_vegetarian");
    const { days, poolSize } = generatePlan(recipes, profile, 7, 7);
    expect(poolSize).toBeGreaterThan(20);
    for (const d of days) {
      const rep = validateDay(d, lookup, profile);
      expect(rep.totals.netCarbsG).toBeLessThanOrEqual(profile.targets.netCarbLimitG! + 0.5);
      for (const c of d.meals.flatMap((m) => m.components)) {
        const r = lookup(c.recipeId)!;
        expect(r.isKeto || r.netCarbsG <= 4).toBe(true);
      }
    }
  });

  it("never includes excluded allergens or avoided foods", () => {
    const profile = profileFor("balanced", "non_vegetarian", { allergies: ["milk", "peanut"], avoidFoods: ["onion_garlic"] });
    const { days } = generatePlan(recipes, profile, 7, 3);
    for (const c of days.flatMap((d) => d.meals.flatMap((m) => m.components))) {
      const r = lookup(c.recipeId)!;
      expect(r.allergens).not.toContain("milk");
      expect(r.allergens).not.toContain("peanut");
      expect(r.avoidTags).not.toContain("onion_garlic");
    }
  });

  it("vegan plans contain only vegan recipes", () => {
    const profile = profileFor("balanced", "vegan");
    for (const c of generatePlan(recipes, profile, 7, 11).days.flatMap((d) => d.meals.flatMap((m) => m.components)))
      expect(lookup(c.recipeId)!.dietType).toBe("vegan");
  });

  it("is deterministic for a given seed", () => {
    const profile = profileFor("high_protein", "eggitarian");
    expect(generatePlan(recipes, profile, 3, 99)).toEqual(generatePlan(recipes, profile, 3, 99));
  });

  it("limits repeats of main dishes across a week", () => {
    const profile = profileFor("balanced", "non_vegetarian");
    const { days } = generatePlan(recipes, profile, 7, 5);
    const counts = new Map<string, number>();
    for (const c of days.flatMap((d) => d.meals.flatMap((m) => m.components)))
      if (!["base", "accompaniment", "drink"].includes(lookup(c.recipeId)!.course)) counts.set(c.recipeId, (counts.get(c.recipeId) ?? 0) + 1);
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(3);
  });

  it("respects the cooking-time limit", () => {
    const profile = profileFor("balanced", "vegetarian", { cookingTimeMin: 30 });
    for (const r of recipes.filter((r) => isEligible(r, profile) && r.course !== "base")) expect(r.totalMin).toBeLessThanOrEqual(40);
  });

  it("offers distinct alternatives for a slot", () => {
    const profile = profileFor("balanced", "vegetarian");
    const alts = alternativesForSlot(recipes, profile, "lunch", [], 1);
    expect(alts.length).toBeGreaterThanOrEqual(3);
  });
});

describe("validation", () => {
  it("flags a keto day that exceeds its net-carb limit", () => {
    const profile = profileFor("keto", "vegetarian");
    const carby = recipes.filter((r) => r.netCarbsG > 30).slice(0, 2);
    const rep = validateDay({ dayIndex: 0, meals: [{ slot: "lunch", components: carby.map((r) => ({ recipeId: r.id, portion: 1 })) }] }, lookup, profile);
    expect(rep.ok).toBe(false);
    expect(rep.issues.some((i) => i.code === "net_carbs_over")).toBe(true);
  });
  it("flags days below the safe calorie floor", () => {
    const profile = profileFor("balanced", "vegetarian");
    const small = recipes.filter((r) => r.kcal < 150).slice(0, 2);
    const rep = validateDay({ dayIndex: 0, meals: [{ slot: "lunch", components: small.map((r) => ({ recipeId: r.id, portion: 1 })) }] }, lookup, profile);
    expect(rep.issues.some((i) => i.code === "below_floor")).toBe(true);
  });
});
