/**
 * One-tap foods and drinks for the Today check-ins: the morning drink, a
 * pre-workout snack and post-workout protein. Values are per stated serving,
 * rounded from IFCT 2017 / USDA figures and typical whey labels; they are
 * estimates and are shown with "≈".
 */

export type Diet = "vegan" | "vegetarian" | "eggitarian" | "non_vegetarian";

export type QuickFood = {
  id: string;
  group: "morning" | "pre" | "protein";
  title: string;
  serving: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fibreG: number;
  fatG: number;
  /** Water it adds to the day's hydration, if it's a drink. */
  waterMl: number;
  diet: Diet;
  /** Low enough in net carbs for a keto day. */
  keto: boolean;
  /** A protein powder: not suggested when extra protein is unsafe (kidney disease, under 18). */
  supplement?: boolean;
  /** When to have it, or why. */
  note: string;
};

export const QUICK_FOODS: QuickFood[] = [
  // Morning — hydration first. None of these "detox"; the liver and kidneys do that. They're an easy, low-calorie start.
  { id: "warm_water", group: "morning", title: "Warm water", serving: "1 glass (250 ml)", kcal: 0, proteinG: 0, carbsG: 0, fibreG: 0, fatG: 0, waterMl: 250, diet: "vegan", keto: true, note: "Rehydrates after the night." },
  { id: "lemon_water", group: "morning", title: "Warm lemon water", serving: "250 ml + ½ lemon", kcal: 6, proteinG: 0, carbsG: 2, fibreG: 0, fatG: 0, waterMl: 250, diet: "vegan", keto: true, note: "A little vitamin C; rinse your mouth after to protect enamel." },
  { id: "jeera_water", group: "morning", title: "Jeera (cumin) water", serving: "250 ml, 1 tsp seeds", kcal: 8, proteinG: 0, carbsG: 1, fibreG: 0, fatG: 0, waterMl: 250, diet: "vegan", keto: true, note: "Traditional and gentle on the stomach." },
  { id: "methi_water", group: "morning", title: "Soaked methi water", serving: "250 ml, 1 tsp seeds", kcal: 12, proteinG: 1, carbsG: 2, fibreG: 1, fatG: 0, waterMl: 250, diet: "vegan", keto: true, note: "Fenugreek can lower blood sugar — check with your doctor if you take diabetes medicine." },
  { id: "ginger_lemon", group: "morning", title: "Ginger-lemon water", serving: "250 ml", kcal: 8, proteinG: 0, carbsG: 2, fibreG: 0, fatG: 0, waterMl: 250, diet: "vegan", keto: true, note: "Warming; good before an early walk." },
  { id: "amla_water", group: "morning", title: "Amla juice in water", serving: "30 ml in 200 ml", kcal: 15, proteinG: 0, carbsG: 3, fibreG: 1, fatG: 0, waterMl: 230, diet: "vegan", keto: true, note: "Rich in vitamin C." },
  { id: "coconut_water", group: "morning", title: "Tender coconut water", serving: "1 glass (200 ml)", kcal: 40, proteinG: 1, carbsG: 9, fibreG: 0, fatG: 0, waterMl: 200, diet: "vegan", keto: false, note: "Natural electrolytes, handy on hot days." },
  { id: "green_tea", group: "morning", title: "Green tea", serving: "1 cup", kcal: 2, proteinG: 0, carbsG: 0, fibreG: 0, fatG: 0, waterMl: 200, diet: "vegan", keto: true, note: "Mild caffeine." },
  { id: "black_coffee", group: "morning", title: "Black coffee", serving: "1 cup", kcal: 5, proteinG: 0, carbsG: 0, fibreG: 0, fatG: 0, waterMl: 150, diet: "vegan", keto: true, note: "Fine before training; skip if it upsets your stomach." },

  // Pre-workout — easy carbs 30–90 minutes before.
  { id: "banana_peanut", group: "pre", title: "Banana + a few peanuts", serving: "1 banana, 15 g peanuts", kcal: 190, proteinG: 5, carbsG: 30, fibreG: 4, fatG: 7, waterMl: 0, diet: "vegan", keto: false, note: "Quick: 30–45 min before." },
  { id: "dates", group: "pre", title: "3 dates", serving: "3 dates (24 g)", kcal: 70, proteinG: 1, carbsG: 18, fibreG: 2, fatG: 0, waterMl: 0, diet: "vegan", keto: false, note: "Fast energy if you're short on time." },
  { id: "idli_sambar", group: "pre", title: "2 idli with sambar", serving: "2 idli, ½ cup sambar", kcal: 220, proteinG: 8, carbsG: 42, fibreG: 4, fatG: 2, waterMl: 0, diet: "vegan", keto: false, note: "Easy to digest, 60–90 min before." },
  { id: "ragi_malt", group: "pre", title: "Ragi malt", serving: "1 glass (25 g ragi, milk)", kcal: 180, proteinG: 7, carbsG: 28, fibreG: 3, fatG: 4, waterMl: 150, diet: "vegetarian", keto: false, note: "Slow carbs plus calcium." },
  { id: "veg_poha", group: "pre", title: "Vegetable poha", serving: "1 cup", kcal: 250, proteinG: 5, carbsG: 45, fibreG: 3, fatG: 6, waterMl: 0, diet: "vegan", keto: false, note: "Light; eat 60–90 min before." },
  { id: "coffee_almonds", group: "pre", title: "Black coffee + almonds", serving: "1 cup, 15 almonds", kcal: 110, proteinG: 4, carbsG: 3, fibreG: 2, fatG: 9, waterMl: 150, diet: "vegan", keto: true, note: "Keto-friendly pre-workout." },

  // Protein — within a couple of hours after training.
  { id: "whey", group: "protein", title: "Whey protein", serving: "1 scoop (30 g) in water", kcal: 120, proteinG: 24, carbsG: 3, fibreG: 0, fatG: 2, waterMl: 250, diet: "vegetarian", keto: true, supplement: true, note: "Fast-digesting milk protein. Check the label: per-scoop protein varies by brand." },
  { id: "plant_protein", group: "protein", title: "Plant protein (pea / soy)", serving: "1 scoop (30 g) in water", kcal: 110, proteinG: 20, carbsG: 4, fibreG: 1, fatG: 2, waterMl: 250, diet: "vegan", keto: true, supplement: true, note: "Dairy-free alternative to whey." },
  { id: "boiled_eggs", group: "protein", title: "3 boiled eggs", serving: "3 eggs", kcal: 210, proteinG: 18, carbsG: 1, fibreG: 0, fatG: 15, waterMl: 0, diet: "eggitarian", keto: true, note: "Whole-food protein." },
  { id: "paneer_100", group: "protein", title: "Paneer", serving: "100 g", kcal: 265, proteinG: 18, carbsG: 3, fibreG: 0, fatG: 20, waterMl: 0, diet: "vegetarian", keto: true, note: "Slow-digesting casein; keto-friendly." },
  { id: "hung_curd", group: "protein", title: "Hung curd (Greek-style)", serving: "200 g", kcal: 140, proteinG: 18, carbsG: 8, fibreG: 0, fatG: 4, waterMl: 0, diet: "vegetarian", keto: false, note: "Add fruit or nuts." },
  { id: "soya_chunks", group: "protein", title: "Soya chunks", serving: "50 g dry, cooked", kcal: 170, proteinG: 26, carbsG: 16, fibreG: 7, fatG: 1, waterMl: 0, diet: "vegan", keto: false, note: "One of the richest plant proteins." },
  { id: "sprouts_chaat", group: "protein", title: "Moong sprouts chaat", serving: "1 cup", kcal: 150, proteinG: 10, carbsG: 25, fibreG: 6, fatG: 1, waterMl: 0, diet: "vegan", keto: false, note: "Protein, fibre and vitamin C." },
  { id: "chicken_breast", group: "protein", title: "Grilled chicken breast", serving: "150 g", kcal: 250, proteinG: 38, carbsG: 0, fibreG: 0, fatG: 9, waterMl: 0, diet: "non_vegetarian", keto: true, note: "Lean protein." },
];

const DIET_RANK: Record<Diet, number> = { vegan: 0, vegetarian: 1, eggitarian: 2, non_vegetarian: 3 };

export function quickFoods(group: QuickFood["group"], opts: { diet: Diet; keto?: boolean; allowSupplements?: boolean }) {
  return QUICK_FOODS.filter(
    (f) => f.group === group && DIET_RANK[f.diet] <= DIET_RANK[opts.diet] && (!opts.keto || f.keto) && (opts.allowSupplements !== false || !f.supplement),
  );
}

export const getQuickFood = (id: string) => QUICK_FOODS.find((f) => f.id === id) ?? null;

/** meal_logs slot for each group. */
export const QUICK_SLOT = { morning: "morning_drink", pre: "pre_workout", protein: "post_workout" } as const;
