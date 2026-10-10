import type { PlanStyle } from "@/lib/nutrition/types";
import type { WorkoutGoal } from "./types";

/**
 * How training changes the day's food targets.
 *
 * Exercise estimates (and the activity level chosen at onboarding) overlap,
 * so only part of the *net* workout energy is added back when losing weight;
 * a cap keeps a long session from erasing the deficit or prompting a binge.
 */
export const ADD_BACK_SHARE: Record<WorkoutGoal, number> = { lose: 0.5, gain: 1, fit: 1 };
export const ADD_BACK_CAP_KCAL = 600;
/** Lean-gain surplus on training days when there is no weight-loss target. */
export const GAIN_SURPLUS_KCAL = 150;

const r5 = (n: number) => Math.round(n / 5) * 5;

export type BaseTargets = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  netCarbLimitG: number | null;
  goal: "lose" | "maintain";
  style: PlanStyle;
};

export type DayTargets = BaseTargets & {
  addBackKcal: number;
  surplusKcal: number;
  extraProteinG: number;
  trainingDay: boolean;
};

export function workoutAddBack(netKcal: number, goal: WorkoutGoal) {
  if (netKcal <= 0) return 0;
  return r5(Math.min(ADD_BACK_CAP_KCAL, netKcal * ADD_BACK_SHARE[goal]));
}

/**
 * Daily targets adjusted for training.
 *
 *  - Weight loss keeps the deficit: 50% of net workout energy comes back.
 *  - Muscle gain raises protein to ~1.8 g/kg (reference weight) on every day,
 *    plus a small surplus on training days unless the user also has a
 *    weight-loss target (then it is a recomposition: deficit stays).
 *  - Stay fit adds back what was burned.
 *
 * `allowExtraProtein` must be false when the base protein was capped for
 * medical reasons (e.g. kidney disease) or for under-18s.
 */
export function trainingDayTargets(
  base: BaseTargets,
  opts: {
    workoutGoal: WorkoutGoal;
    trainingDay: boolean;
    burnedNetKcal: number;
    referenceWeightKg: number;
    allowExtraProtein: boolean;
  },
): DayTargets {
  const addBackKcal = opts.trainingDay ? workoutAddBack(opts.burnedNetKcal, opts.workoutGoal) : 0;
  const surplusKcal = opts.workoutGoal === "gain" && opts.trainingDay && base.goal !== "lose" ? GAIN_SURPLUS_KCAL : 0;

  let proteinG = base.proteinG;
  if (opts.allowExtraProtein) {
    const perKg = opts.workoutGoal === "gain" ? 1.8 : opts.trainingDay ? 1.5 : 0;
    proteinG = Math.max(proteinG, Math.round(opts.referenceWeightKg * perKg));
  }
  const extraProteinG = proteinG - base.proteinG;
  const kcal = base.kcal + addBackKcal + surplusKcal;

  // Extra protein replaces the same energy from the other macros first,
  // then the added energy goes to carbohydrate (or fat on keto/low-carb).
  const extraKcal = addBackKcal + surplusKcal - extraProteinG * 4;
  let carbsG = base.carbsG;
  let fatG = base.fatG;
  const carbLimited = base.style === "keto" || base.style === "low_carb";
  if (carbLimited) fatG = Math.max(Math.round((kcal * 0.2) / 9), Math.round(fatG + extraKcal / 9));
  else carbsG = Math.max(0, Math.round(carbsG + extraKcal / 4));

  return {
    ...base,
    kcal: r5(kcal),
    proteinG,
    carbsG,
    fatG,
    addBackKcal,
    surplusKcal,
    extraProteinG,
    trainingDay: opts.trainingDay,
  };
}

// ─── Pre / post-workout food ideas ──────────────────────────────────────────

export type FuelIdea = {
  id: string;
  when: "pre" | "post";
  title: string;
  detail: string;
  diet: "vegan" | "vegetarian" | "eggitarian" | "non_vegetarian";
  /** Low enough in net carbs for keto days. */
  keto: boolean;
  /** Catalogue recipe ids to link to, when they exist. */
  recipeHints: string[];
};

export const FUEL_IDEAS: FuelIdea[] = [
  { id: "idli_sambar", when: "pre", title: "2 idli with sambar", detail: "Easy-to-digest carbs 60–90 min before training.", diet: "vegan", keto: false, recipeHints: ["idli", "sambar"] },
  { id: "ragi_malt", when: "pre", title: "Ragi malt (kanji)", detail: "Slow-release finger-millet carbs plus calcium.", diet: "vegetarian", keto: false, recipeHints: ["ragi"] },
  { id: "banana_peanut", when: "pre", title: "Banana with a few peanuts", detail: "A quick option 30–45 min before.", diet: "vegan", keto: false, recipeHints: [] },
  { id: "poha", when: "pre", title: "Vegetable poha", detail: "Light, low-fat carbs; add peas for protein.", diet: "vegan", keto: false, recipeHints: ["poha"] },
  { id: "coffee_almonds", when: "pre", title: "Black coffee + a handful of almonds", detail: "Keto-friendly; skip if caffeine upsets your stomach.", diet: "vegan", keto: true, recipeHints: [] },
  { id: "sprouts_chaat", when: "post", title: "Moong sprouts chaat", detail: "Plant protein, fibre and vitamin C.", diet: "vegan", keto: false, recipeHints: ["sprout"] },
  { id: "egg_bhurji", when: "post", title: "Egg bhurji with a phulka", detail: "~20 g protein to help muscles recover.", diet: "eggitarian", keto: false, recipeHints: ["egg-bhurji", "egg"] },
  { id: "boiled_eggs", when: "post", title: "2–3 boiled eggs with pepper", detail: "Quick protein; keto-friendly.", diet: "eggitarian", keto: true, recipeHints: ["egg"] },
  { id: "paneer_tikka", when: "post", title: "Paneer tikka or paneer bhurji", detail: "Casein-rich protein; keto-friendly.", diet: "vegetarian", keto: true, recipeHints: ["paneer"] },
  { id: "curd_rice", when: "post", title: "Curd rice with cucumber", detail: "Carbs to refuel plus curd protein and probiotics.", diet: "vegetarian", keto: false, recipeHints: ["curd-rice", "curd"] },
  { id: "buttermilk_chana", when: "post", title: "Spiced buttermilk + roasted chana", detail: "Light, hydrating and ~12 g protein.", diet: "vegetarian", keto: false, recipeHints: ["buttermilk", "chana"] },
  { id: "chicken_tikka", when: "post", title: "Grilled chicken tikka with salad", detail: "Lean protein ~30 g; keto-friendly.", diet: "non_vegetarian", keto: true, recipeHints: ["chicken-tikka", "chicken"] },
  { id: "tofu_stirfry", when: "post", title: "Tofu or soya chunk stir-fry", detail: "Complete plant protein for vegans.", diet: "vegan", keto: true, recipeHints: ["tofu", "soya"] },
];

const DIET_RANK = { vegan: 0, vegetarian: 1, eggitarian: 2, non_vegetarian: 3 } as const;

export function fuelIdeas(diet: FuelIdea["diet"], opts: { keto?: boolean; when?: FuelIdea["when"] } = {}) {
  return FUEL_IDEAS.filter((f) => DIET_RANK[f.diet] <= DIET_RANK[diet] && (!opts.keto || f.keto) && (!opts.when || f.when === opts.when));
}
