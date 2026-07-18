import type { MealSlot, MealTag, Recipe } from "@/types";
import { RECIPES } from "@/lib/data/recipes";

export interface RecipeGeneratorInput {
  ingredients: string[];
  slot?: MealSlot;
  tags?: MealTag[];
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function ingredientMatchScore(recipe: Recipe, ingredients: string[]): number {
  if (ingredients.length === 0) return 0;
  const recipeIngredientNames = recipe.ingredients.map((i) => normalize(i.name));
  let matches = 0;
  for (const query of ingredients) {
    const q = normalize(query);
    if (recipeIngredientNames.some((name) => name.includes(q) || q.includes(name))) {
      matches += 1;
    }
  }
  return matches;
}

export function generateRecipeSuggestions(input: RecipeGeneratorInput, limit = 8, extraRecipes: Recipe[] = []): Recipe[] {
  const { ingredients, slot, tags = [] } = input;
  const recipePool = extraRecipes.length > 0 ? [...RECIPES, ...extraRecipes] : RECIPES;

  const scored = recipePool.map((recipe) => {
    if (slot && recipe.slot !== slot) return { recipe, score: -1 };

    const ingredientScore = ingredientMatchScore(recipe, ingredients) * 4;
    const tagScore = tags.filter((tag) => recipe.tags.includes(tag)).length * 3;
    const hasAnyFilter = ingredients.length > 0 || tags.length > 0;

    const score = ingredientScore + tagScore;
    return { recipe, score: hasAnyFilter ? score : 1 };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.recipe);
}
