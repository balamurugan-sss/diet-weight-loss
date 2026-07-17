import type { Ingredient, ShoppingListItem, WeeklyMealPlan } from "@/types";

export function generateShoppingList(plan: WeeklyMealPlan): ShoppingListItem[] {
  const grouped = new Map<string, { ingredient: Ingredient; count: number }>();

  for (const day of plan.days) {
    for (const recipe of Object.values(day.meals)) {
      if (!recipe) continue;
      for (const ingredient of recipe.ingredients) {
        const key = ingredient.name.toLowerCase().trim();
        const existing = grouped.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          grouped.set(key, { ingredient, count: 1 });
        }
      }
    }
  }

  return Array.from(grouped.values()).map(({ ingredient, count }) => ({
    id: crypto.randomUUID(),
    name: ingredient.name,
    quantity: count > 1 ? `${ingredient.quantity} (x${count} meals)` : ingredient.quantity,
    category: ingredient.category,
    checked: false,
    addedManually: false,
  }));
}

export const SHOPPING_CATEGORY_LABELS: Record<Ingredient["category"], string> = {
  vegetables: "Vegetables",
  fruits: "Fruits",
  protein: "Protein",
  grains: "Grains",
  dairy: "Dairy",
  spices: "Spices",
  "healthy-snacks": "Healthy Snacks",
  other: "Other",
};
