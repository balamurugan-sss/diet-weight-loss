import { format } from "date-fns";
import type {
  CalculationResult,
  DayMealPlan,
  MealSlot,
  MealTag,
  Recipe,
  UserProfile,
  WeeklyMealPlan,
} from "@/types";
import { RECIPES } from "@/lib/data/recipes";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SLOT_CALORIE_SHARE: Record<MealSlot, number> = {
  breakfast: 0.25,
  morningSnack: 0.08,
  lunch: 0.3,
  eveningSnack: 0.08,
  dinner: 0.24,
  bedtimeDrink: 0.05,
};

const DIET_HIERARCHY: Record<UserProfile["foodPreference"], MealTag[]> = {
  vegan: ["vegan"],
  vegetarian: ["vegan", "vegetarian"],
  eggitarian: ["vegan", "vegetarian", "eggitarian"],
  "non-vegetarian": ["vegan", "vegetarian", "eggitarian", "non-vegetarian"],
};

const HEALTH_TAG_MAP: Partial<Record<UserProfile["healthConditions"][number], MealTag>> = {
  diabetes: "diabetes-friendly",
  "high-bp": "low-sodium",
  cholesterol: "low-sodium",
  pcos: "pcos-friendly",
  thyroid: "thyroid-friendly",
};

function isDietCompatible(recipe: Recipe, profile: UserProfile): boolean {
  const allowed = DIET_HIERARCHY[profile.foodPreference];
  return recipe.tags.some((tag) => allowed.includes(tag));
}

function healthScore(recipe: Recipe, profile: UserProfile): number {
  let score = 0;
  for (const condition of profile.healthConditions) {
    const tag = HEALTH_TAG_MAP[condition];
    if (tag && recipe.tags.includes(tag)) score += 3;
  }
  return score;
}

function cuisineScore(recipe: Recipe, profile: UserProfile): number {
  return recipe.cuisine.some((c) => profile.cuisinePreferences.includes(c)) ? 3 : 0;
}

function scoreRecipe(recipe: Recipe, profile: UserProfile, targetCalories: number): number {
  const calorieDiff = Math.abs(recipe.calories - targetCalories);
  const calorieScore = Math.max(0, 5 - calorieDiff / 40);
  return cuisineScore(recipe, profile) + healthScore(recipe, profile) + calorieScore;
}

function pickForSlot(
  slot: MealSlot,
  profile: UserProfile,
  targetCalories: number,
  usedIds: Set<string>
): Recipe | undefined {
  const compatible = RECIPES.filter((r) => r.slot === slot && isDietCompatible(r, profile));
  if (compatible.length === 0) return undefined;

  const fresh = compatible.filter((r) => !usedIds.has(r.id));
  const pool = fresh.length > 0 ? fresh : compatible;

  const scored = pool
    .map((recipe) => ({ recipe, score: scoreRecipe(recipe, profile, targetCalories) }))
    .sort((a, b) => b.score - a.score);

  const topN = scored.slice(0, Math.min(4, scored.length));
  const choice = topN[Math.floor(Math.random() * topN.length)].recipe;
  usedIds.add(choice.id);
  return choice;
}

export function generateWeeklyMealPlan(profile: UserProfile, calc: CalculationResult): WeeklyMealPlan {
  const usedIds = new Set<string>();
  const includeBedtimeDrink = !profile.healthConditions.includes("diabetes");

  const days: DayMealPlan[] = DAYS.map((day) => {
    const meals: DayMealPlan["meals"] = {};

    (Object.keys(SLOT_CALORIE_SHARE) as MealSlot[]).forEach((slot) => {
      if (slot === "bedtimeDrink" && !includeBedtimeDrink) return;
      const target = calc.dailyCalories * SLOT_CALORIE_SHARE[slot];
      const recipe = pickForSlot(slot, profile, target, usedIds);
      if (recipe) meals[slot] = recipe;
    });

    return { day, meals };
  });

  return { weekOf: format(new Date(), "MMM d, yyyy"), days };
}

export function totalDayCalories(day: DayMealPlan): number {
  return Object.values(day.meals).reduce((sum, r) => sum + (r?.calories ?? 0), 0);
}

export function totalDayMacros(day: DayMealPlan) {
  return Object.values(day.meals).reduce(
    (acc, r) => ({
      protein: acc.protein + (r?.proteinG ?? 0),
      carbs: acc.carbs + (r?.carbsG ?? 0),
      fat: acc.fat + (r?.fatG ?? 0),
    }),
    { protein: 0, carbs: 0, fat: 0 }
  );
}
