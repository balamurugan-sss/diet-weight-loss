import type { CalculationResult, DailyLogEntry, DayMealPlan, MealSlot, Recipe, UserProfile } from "@/types";
import { RECIPES } from "@/lib/data/recipes";
import { FOODS } from "@/lib/data/foods";
import { generateRecipeSuggestions } from "@/lib/ai/recipeGenerator";
import { generateDailyInsight } from "@/lib/ai/insights";
import { MOTIVATION_QUOTES } from "@/lib/data/quotes";

export interface ChatContext {
  profile: UserProfile;
  calc: CalculationResult;
  log: DailyLogEntry;
  todayMeals?: DayMealPlan;
}

const SLOT_ORDER: MealSlot[] = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner", "bedtimeDrink"];

function extractCalorieLimit(message: string): number | undefined {
  const match = message.match(/(\d{2,4})\s*(kcal|cal|calories)?/i);
  return match ? Number(match[1]) : undefined;
}

function extractIngredients(message: string): string[] {
  const afterHave = message.match(/(?:have|got|with)\s+([a-zA-Z,\s]+)/i);
  const source = afterHave ? afterHave[1] : message;
  return source
    .split(/,|and/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 25)
    .slice(0, 6);
}

function cleanQuery(query: string): string {
  return query.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function nameMatches(name: string, q: string): boolean {
  const cleanedName = cleanQuery(name);
  if (q.includes(cleanedName) || cleanedName.includes(q)) return true;
  const queryWords = q.split(/\s+/).filter((w) => w.length > 3);
  return queryWords.some((word) => cleanedName.includes(word));
}

function findFoodOrRecipe(query: string): { name: string; calories: number; source: "recipe" | "food"; tags?: string[] } | undefined {
  const q = cleanQuery(query);
  const recipe = RECIPES.find((r) => nameMatches(r.name, q));
  if (recipe) return { name: recipe.name, calories: recipe.calories, source: "recipe", tags: recipe.tags };
  const food = FOODS.find((f) => nameMatches(f.name, q));
  if (food) return { name: food.name, calories: food.calories, source: "food" };
  return undefined;
}

function nextUnloggedSlot(todayMeals: DayMealPlan | undefined, log: DailyLogEntry): { slot: MealSlot; recipe: Recipe } | undefined {
  if (!todayMeals) return undefined;
  const loggedNames = new Set(log.loggedFoods.map((f) => f.foodName.toLowerCase()));
  for (const slot of SLOT_ORDER) {
    const recipe = todayMeals.meals[slot];
    if (recipe && !loggedNames.has(recipe.name.toLowerCase())) {
      return { slot, recipe };
    }
  }
  return undefined;
}

export function answerQuestion(message: string, ctx: ChatContext): string {
  const { profile, calc, log, todayMeals } = ctx;
  const text = message.toLowerCase();
  const caloriesLeft = calc.dailyCalories - log.caloriesConsumed;

  if (/motivat|encourage|inspire/.test(text)) {
    const quote = MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
    return `${quote}\n\nYou're working toward ${profile.targetWeightKg}kg — every consistent day counts, ${profile.name.split(" ")[0]}. Keep going!`;
  }

  if (/how many calories|calories left|calories remaining/.test(text)) {
    if (caloriesLeft <= 0) {
      return `You've used all ${calc.dailyCalories} kcal for today (${Math.abs(caloriesLeft)} kcal over). Consider a light walk, and aim to get back on target tomorrow.`;
    }
    return `You have ${caloriesLeft} kcal left today (${log.caloriesConsumed} / ${calc.dailyCalories} kcal consumed so far).`;
  }

  if (/restaurant/.test(text)) {
    const options = FOODS.filter((f) => f.category === "restaurant").sort((a, b) => a.calories - b.calories).slice(0, 5);
    const list = options.map((f) => `• ${f.name} — ${f.calories} kcal, ${f.proteinG}g protein`).join("\n");
    return `Here are some lighter restaurant options:\n${list}\n\nTry to pair with a salad or clear soup and go easy on fried starters.`;
  }

  const calorieLimit = /under|below|less than/.test(text) ? extractCalorieLimit(text) : undefined;
  if (/dinner/.test(text) && (calorieLimit || /suggest|recommend|what.*eat/.test(text))) {
    const candidates = RECIPES.filter((r) => r.slot === "dinner" && (!calorieLimit || r.calories <= calorieLimit)).sort(
      (a, b) => a.calories - b.calories
    );
    if (candidates.length === 0) {
      return `I couldn't find a dinner option ${calorieLimit ? `under ${calorieLimit} kcal` : ""} — try loosening the calorie limit a bit.`;
    }
    const pick = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))];
    return `Try "${pick.name}" — ${pick.calories} kcal, ${pick.proteinG}g protein, ${pick.fiberG}g fiber. Ready in ${pick.prepTimeMin + pick.cookTimeMin} min.`;
  }

  if (/generate.*recipe|recipe.*with|make.*with/.test(text) || /^i have\b/.test(text)) {
    const ingredients = extractIngredients(message);
    const suggestions = generateRecipeSuggestions({ ingredients }, 3);
    if (suggestions.length === 0) {
      return `I couldn't match a recipe to "${ingredients.join(", ")}" — try the Recipe Generator page for more filters, or list different ingredients.`;
    }
    const list = suggestions.map((r) => `• ${r.name} (${r.calories} kcal, ${r.proteinG}g protein)`).join("\n");
    return `With ${ingredients.join(", ") || "those ingredients"}, you could make:\n${list}\n\nTap any of these in the Recipe Generator to see full instructions.`;
  }

  if (/^can i eat|is .* healthy|should i eat/.test(text)) {
    const query = text.replace(/^can i eat|is |healthy\??|should i eat/g, "").trim();
    const match = findFoodOrRecipe(query || text);
    if (match) {
      const withinBudget = match.calories <= caloriesLeft;
      const conditionNote = profile.healthConditions.includes("diabetes")
        ? " Since you're managing diabetes, keep the portion moderate and pair it with fiber/protein to slow the sugar spike."
        : profile.healthConditions.includes("high-bp") || profile.healthConditions.includes("cholesterol")
        ? " Watch the sodium and oil content given your condition — ask for less salt/oil if eating out."
        : "";
      return `${match.name} is about ${match.calories} kcal. ${
        withinBudget ? `That fits within your ${caloriesLeft} kcal remaining today` : `That would put you over your ${caloriesLeft} kcal remaining today`
      } — enjoy in moderation and balance the rest of your day accordingly.${conditionNote}`;
    }
    return `I don't have exact data on that dish, but as a rule of thumb: enjoy it in a moderate portion, balance it with vegetables or a salad, and stay within your ${calc.dailyCalories} kcal daily target.`;
  }

  if (/what should i eat|what to eat|next meal/.test(text)) {
    const next = nextUnloggedSlot(todayMeals, log);
    if (next) {
      return `Your next meal is ${next.recipe.name} (${next.recipe.slot}) — ${next.recipe.calories} kcal, ${next.recipe.proteinG}g protein. Check the Meal Planner for the full recipe.`;
    }
    return `You have ${caloriesLeft} kcal and ${Math.max(calc.proteinG - log.proteinG, 0)}g protein left today. Pick something high in protein and fiber to stay satisfied.`;
  }

  return generateDailyInsight(profile, calc, log);
}
