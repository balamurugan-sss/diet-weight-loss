import "server-only";
import { eq } from "drizzle-orm";
import type { PlannerProfile, PlannerRecipe } from "@/lib/planner/engine";
import type { Targets } from "@/lib/nutrition/targets";
import { CALORIE_FLOOR } from "@/lib/nutrition/targets";
import { db, schema } from "@/server/db/client";
import type { Profile } from "@/server/auth/dal";

let cache: { at: number; recipes: PlannerRecipe[] } | null = null;
const TTL = 60_000;

/** Lightweight projection of every validated recipe, for planning and swaps. */
export async function plannerRecipes(): Promise<PlannerRecipe[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.recipes;
  const rows = await db
    .select({
      id: schema.recipes.id,
      title: schema.recipes.title,
      course: schema.recipes.course,
      mealTypes: schema.recipes.mealTypes,
      cuisine: schema.recipes.cuisine,
      dietType: schema.recipes.dietType,
      allergens: schema.recipes.allergens,
      avoidTags: schema.recipes.avoidTags,
      equipment: schema.recipes.equipment,
      prepMin: schema.recipes.prepMin,
      cookMin: schema.recipes.cookMin,
      kcal: schema.recipes.kcal,
      proteinG: schema.recipes.proteinG,
      carbsG: schema.recipes.carbsG,
      fibreG: schema.recipes.fibreG,
      netCarbsG: schema.recipes.netCarbsG,
      fatG: schema.recipes.fatG,
      costPerServingInr: schema.recipes.costPerServingInr,
      isKeto: schema.recipes.isKeto,
      isLowCarb: schema.recipes.isLowCarb,
      isHighProtein: schema.recipes.isHighProtein,
    })
    .from(schema.recipes)
    .where(eq(schema.recipes.validationStatus, "validated"))
    .orderBy(schema.recipes.id);
  const recipes = rows.map(({ prepMin, cookMin, ...r }) => ({ ...r, totalMin: prepMin + cookMin }));
  cache = { at: Date.now(), recipes };
  return recipes;
}

export function plannerProfile(profile: Profile, targets: Targets): PlannerProfile {
  const budget = profile.budgetInr ? (profile.budgetPeriod === "week" ? profile.budgetInr / 7 : profile.budgetInr) : null;
  return {
    diet: (profile.dietPreference ?? "vegetarian") as PlannerProfile["diet"],
    allergies: profile.allergies,
    avoidFoods: profile.avoidFoods,
    cuisines: profile.cuisines,
    cookingTimeMin: profile.cookingTimeMin,
    equipment: profile.equipment,
    budgetPerDayInr: budget,
    slots: profile.mealSlots.length ? profile.mealSlots : ["breakfast", "lunch", "dinner"],
    style: targets.style,
    targets: {
      kcal: targets.kcal,
      proteinG: targets.proteinG,
      fibreG: targets.fibreG,
      netCarbLimitG: targets.netCarbLimitG,
      kcalFloor: targets.goal === "lose" ? CALORIE_FLOOR[profile.sexForEquation ?? "female"] : Math.round(targets.kcal * 0.85),
    },
  };
}
