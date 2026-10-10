import { dietAllows } from "@/lib/recipes/nutrition";
import { BASIC_EQUIPMENT, INDIAN, SOUTH_INDIAN, type Course, type DietType, type Nutrients } from "@/lib/recipes/types";
import type { PlanStyle } from "@/lib/nutrition/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlannerRecipe = {
  id: string;
  title: string;
  course: Course;
  mealTypes: string[];
  cuisine: string;
  dietType: DietType;
  allergens: string[];
  avoidTags: string[];
  equipment: string[];
  totalMin: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fibreG: number;
  netCarbsG: number;
  fatG: number;
  costPerServingInr: number;
  isKeto: boolean;
  isLowCarb: boolean;
  isHighProtein: boolean;
};

export type PlannerTargets = {
  kcal: number;
  proteinG: number;
  fibreG: number;
  netCarbLimitG: number | null;
  kcalFloor: number;
};

export type PlannerProfile = {
  diet: DietType;
  allergies: string[];
  avoidFoods: string[];
  cuisines: string[];
  cookingTimeMin: number | null;
  equipment: string[];
  budgetPerDayInr: number | null;
  slots: string[];
  style: PlanStyle;
  targets: PlannerTargets;
};

export type Component = { recipeId: string; portion: number };
export type PlannedMeal = { slot: string; components: Component[] };
export type DayPlan = { dayIndex: number; meals: PlannedMeal[] };

export type Issue = { severity: "error" | "warning" | "info"; code: string; message: string };
export type DayReport = { totals: Nutrients & { costInr: number }; issues: Issue[]; ok: boolean };

// ─── Deterministic randomness ───────────────────────────────────────────────

export function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Slot shares and meal templates ─────────────────────────────────────────

const SLOT_SHARE: Record<string, number> = {
  breakfast: 0.25,
  mid_morning: 0.08,
  lunch: 0.32,
  evening: 0.1,
  dinner: 0.25,
};

export function slotKcalTargets(slots: string[], kcal: number) {
  const total = slots.reduce((s, x) => s + (SLOT_SHARE[x] ?? 0.1), 0);
  return Object.fromEntries(slots.map((s) => [s, (kcal * (SLOT_SHARE[s] ?? 0.1)) / total])) as Record<string, number>;
}

type Role = Course;
const MAIN_SLOTS = ["breakfast", "lunch", "dinner"];

function templatesFor(slot: string, style: PlanStyle): Role[][] {
  if (!MAIN_SLOTS.includes(slot)) return [["snack"], ["drink"], ["snack", "drink"]];
  if (slot === "breakfast")
    return [["complete"], ["base", "accompaniment"], ["base", "main"], ["base", "main", "accompaniment"], ["main", "base"]];
  const carbLight = style === "keto" || style === "low_carb";
  return carbLight
    ? [["main", "side"], ["main", "base", "side"], ["complete"], ["main", "side", "accompaniment"], ["complete", "side"]]
    : [["base", "main", "side"], ["base", "main"], ["complete"], ["base", "main", "side", "accompaniment"], ["complete", "accompaniment"]];
}

/** Which recipe courses may fill a role; snacks can also be fruit-like desserts. */
function courseMatches(role: Role, r: PlannerRecipe) {
  if (role === "snack") return r.course === "snack" || (r.course === "dessert" && r.kcal <= 220);
  return r.course === role;
}

function mealTypeOk(slot: string, role: Role, r: PlannerRecipe) {
  if (role === "base" || role === "accompaniment" || role === "side" || role === "drink") return true;
  if (slot === "breakfast") return r.mealTypes.includes("breakfast");
  if (slot === "lunch" || slot === "dinner") return r.mealTypes.includes("lunch") || r.mealTypes.includes("dinner");
  return true;
}

export function cuisineFamily(c: string) {
  if ((SOUTH_INDIAN as string[]).includes(c)) return "south";
  if (c === "pan_indian") return "any_indian";
  if ((INDIAN as string[]).includes(c)) return "north";
  return "intl";
}

function familiesCompatible(a: string, b: string) {
  const fa = cuisineFamily(a);
  const fb = cuisineFamily(b);
  if (fa === fb) return true;
  if (fa === "any_indian") return fb !== "intl";
  if (fb === "any_indian") return fa !== "intl";
  return false;
}

// ─── Hard constraints ───────────────────────────────────────────────────────

export function isEligible(r: PlannerRecipe, p: PlannerProfile): boolean {
  if (!dietAllows(p.diet, r.dietType)) return false;
  if (r.allergens.some((a) => p.allergies.includes(a))) return false;
  if (r.avoidTags.some((a) => p.avoidFoods.includes(a))) return false;
  const have = new Set([...BASIC_EQUIPMENT, ...p.equipment]);
  if (!r.equipment.every((tok) => tok.split("|").some((e) => have.has(e as never)))) return false;
  if (p.cookingTimeMin && r.course !== "base" && r.totalMin > p.cookingTimeMin + 10) return false;
  if (p.style === "keto") {
    const tinyCarb = (r.course === "accompaniment" || r.course === "drink") && r.netCarbsG <= 4;
    if (!r.isKeto && !tinyCarb) return false;
  }
  if (p.style === "low_carb" && r.course !== "base" && !r.isLowCarb && r.netCarbsG > 25) return false;
  return true;
}

// ─── Nutrition helpers ──────────────────────────────────────────────────────

export function componentNutrients(r: PlannerRecipe, portion: number): Nutrients & { costInr: number } {
  return {
    kcal: r.kcal * portion,
    proteinG: r.proteinG * portion,
    carbsG: r.carbsG * portion,
    fibreG: r.fibreG * portion,
    netCarbsG: r.netCarbsG * portion,
    fatG: r.fatG * portion,
    costInr: r.costPerServingInr * portion,
  };
}

export function sumComponents(components: Component[], lookup: (id: string) => PlannerRecipe | undefined) {
  const out = { kcal: 0, proteinG: 0, carbsG: 0, fibreG: 0, netCarbsG: 0, fatG: 0, costInr: 0 };
  for (const c of components) {
    const r = lookup(c.recipeId);
    if (!r) continue;
    const n = componentNutrients(r, c.portion);
    for (const k of Object.keys(out) as (keyof typeof out)[]) out[k] += n[k];
  }
  return out;
}

const PORTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const scalable = (course: Course) => course === "base" || course === "main" || course === "complete" || course === "snack";

/** Picks portions for scalable components so the meal lands near its calorie target. */
export function fitPortions(recipes: PlannerRecipe[], targetKcal: number, proteinPerKcal: number): number[] {
  const idx = recipes.map((r, i) => (scalable(r.course) ? i : -1)).filter((i) => i >= 0).slice(0, 2);
  const base = recipes.map(() => 1);
  let best = base;
  let bestScore = Infinity;
  const combos = idx.length === 0 ? [[]] : idx.length === 1 ? PORTIONS.map((p) => [p]) : PORTIONS.flatMap((a) => PORTIONS.map((b) => [a, b]));
  for (const combo of combos) {
    const portions = [...base];
    idx.forEach((ix, k) => (portions[ix] = combo[k]));
    let kcal = 0;
    let protein = 0;
    recipes.forEach((r, i) => {
      kcal += r.kcal * portions[i];
      protein += r.proteinG * portions[i];
    });
    const kcalErr = Math.abs(kcal - targetKcal) / targetKcal;
    const proteinShort = Math.max(0, targetKcal * proteinPerKcal - protein) / Math.max(1, targetKcal * proteinPerKcal);
    // Prefer normal portions when the fit is similar.
    const oddPortion = portions.reduce((s, p) => s + Math.abs(p - 1), 0) * 0.04;
    const score = kcalErr + proteinShort * 0.6 + oddPortion;
    if (score < bestScore) {
      bestScore = score;
      best = portions;
    }
  }
  return best;
}

// ─── Composition ────────────────────────────────────────────────────────────

export type History = Map<string, number>; // recipeId → last dayIndex used

type Ctx = {
  profile: PlannerProfile;
  pool: PlannerRecipe[];
  byId: Map<string, PlannerRecipe>;
  rand: () => number;
};

function candidateScore(r: PlannerRecipe, role: Role, slot: string, ctx: Ctx, dayIndex: number, history: History, usedToday: Set<string>) {
  const p = ctx.profile;
  let s = ctx.rand() * 1.2;
  if (p.cuisines.length && p.cuisines.includes(r.cuisine)) s += 1.2;
  else if (p.cuisines.length && p.cuisines.some((c) => cuisineFamily(c) === cuisineFamily(r.cuisine))) s += 0.5;
  if (p.style === "high_protein" && r.kcal > 0) s += ((r.proteinG * 4) / r.kcal) * 3;
  if (p.style === "low_carb" || p.style === "keto") s -= r.netCarbsG / 25;
  if (role !== "base" && role !== "accompaniment") {
    if (usedToday.has(r.id)) s -= 10;
    const last = history.get(r.id);
    if (last !== undefined) s -= Math.max(0, 4 - (dayIndex - last)) * 1.3;
  } else if (usedToday.has(r.id)) s -= 3;
  if (p.budgetPerDayInr) s -= Math.max(0, r.costPerServingInr - p.budgetPerDayInr / 4) / 40;
  return s;
}

function pick<T>(items: T[], score: (t: T) => number): T | undefined {
  let best: T | undefined;
  let bestS = -Infinity;
  for (const it of items) {
    const s = score(it);
    if (s > bestS) {
      bestS = s;
      best = it;
    }
  }
  return best;
}

export function composeMeal(
  slot: string,
  targetKcal: number,
  ctx: Ctx,
  dayIndex: number,
  history: History,
  usedToday: Set<string>,
  exclude: Set<string> = new Set(),
): PlannedMeal | null {
  const templates = templatesFor(slot, ctx.profile.style);
  const order = templates.map((t, i) => ({ t, k: ctx.rand() + (i === 0 ? 0.35 : 0) })).sort((a, b) => b.k - a.k);
  const proteinPerKcal = ctx.profile.targets.proteinG / ctx.profile.targets.kcal;
  let best: { meal: PlannedMeal; err: number } | null = null;
  for (const { t } of order) {
    const chosen: PlannerRecipe[] = [];
    let anchor: PlannerRecipe | undefined;
    let ok = true;
    for (const role of t) {
      const options = ctx.pool.filter(
        (r) =>
          courseMatches(role, r) &&
          mealTypeOk(slot, role, r) &&
          !exclude.has(r.id) &&
          !chosen.includes(r) &&
          (!anchor || familiesCompatible(anchor.cuisine, r.cuisine)),
      );
      const choice = pick(options, (r) => candidateScore(r, role, slot, ctx, dayIndex, history, usedToday));
      if (!choice) {
        ok = false;
        break;
      }
      chosen.push(choice);
      if (!anchor && role !== "drink") anchor = choice;
    }
    if (!ok || !chosen.length) continue;
    const portions = fitPortions(chosen, targetKcal, proteinPerKcal);
    const kcal = chosen.reduce((s, r, i) => s + r.kcal * portions[i], 0);
    const protein = chosen.reduce((s, r, i) => s + r.proteinG * portions[i], 0);
    const net = chosen.reduce((s, r, i) => s + r.netCarbsG * portions[i], 0);
    const proteinGoal = targetKcal * proteinPerKcal;
    let err = Math.abs(kcal - targetKcal) / targetKcal + (Math.max(0, proteinGoal - protein) / Math.max(1, proteinGoal)) * 0.6;
    const limit = ctx.profile.targets.netCarbLimitG;
    if (limit) {
      const slotBudget = (limit * targetKcal) / ctx.profile.targets.kcal;
      err += Math.max(0, net - slotBudget) / Math.max(1, slotBudget);
    }
    const meal = { slot, components: chosen.map((r, i) => ({ recipeId: r.id, portion: portions[i] })) };
    if (!best || err < best.err) best = { meal, err };
    if (err < 0.06) break;
  }
  return best?.meal ?? null;
}

export function buildContext(recipes: PlannerRecipe[], profile: PlannerProfile, seed: number): Ctx {
  const pool = recipes.filter((r) => isEligible(r, profile));
  return { profile, pool, byId: new Map(recipes.map((r) => [r.id, r])), rand: prng(seed) };
}

/** Nudges portions so the day lands inside the calorie window, then repairs keto overruns. */
function balanceDay(day: DayPlan, ctx: Ctx) {
  const t = ctx.profile.targets;
  const lookup = (id: string) => ctx.byId.get(id);
  if (t.netCarbLimitG) {
    for (let iter = 0; iter < 8; iter++) {
      const totals = sumComponents(day.meals.flatMap((m) => m.components), lookup);
      if (totals.netCarbsG <= t.netCarbLimitG) break;
      const c = day.meals
        .flatMap((m) => m.components)
        .filter((c) => c.portion > 0.5 && scalable(lookup(c.recipeId)!.course))
        .sort((a, b) => lookup(b.recipeId)!.netCarbsG - lookup(a.recipeId)!.netCarbsG)[0];
      if (!c) break;
      c.portion = Math.round((c.portion - 0.25) * 100) / 100;
    }
  }
  for (let iter = 0; iter < 12; iter++) {
    const totals = sumComponents(day.meals.flatMap((m) => m.components), lookup);
    const diff = (totals.kcal - t.kcal) / t.kcal;
    if (Math.abs(diff) <= 0.05) break;
    const comps = day.meals
      .flatMap((m) => m.components)
      .filter((c) => {
        const r = lookup(c.recipeId)!;
        return scalable(r.course) && (diff < 0 ? c.portion < 2 : c.portion > 0.5);
      })
      .sort((a, b) => {
        const ra = lookup(a.recipeId)!;
        const rb = lookup(b.recipeId)!;
        if (t.netCarbLimitG && diff < 0) return ra.netCarbsG / Math.max(ra.kcal, 1) - rb.netCarbsG / Math.max(rb.kcal, 1);
        return rb.kcal - ra.kcal;
      });
    const c = comps[0];
    if (t.netCarbLimitG && diff < 0) {
      const r = lookup(c?.recipeId ?? "");
      const totals2 = sumComponents(day.meals.flatMap((m) => m.components), lookup);
      if (r && totals2.netCarbsG + r.netCarbsG * 0.25 > t.netCarbLimitG) break;
    }
    if (!c) break;
    c.portion = Math.round((c.portion + (diff < 0 ? 0.25 : -0.25)) * 100) / 100;
  }
}

export function generateDay(dayIndex: number, ctx: Ctx, history: History): DayPlan {
  const targets = slotKcalTargets(ctx.profile.slots, ctx.profile.targets.kcal);
  const usedToday = new Set<string>();
  const meals: PlannedMeal[] = [];
  for (const slot of ctx.profile.slots) {
    const meal = composeMeal(slot, targets[slot], ctx, dayIndex, history, usedToday);
    if (!meal) continue;
    meal.components.forEach((c) => usedToday.add(c.recipeId));
    meals.push(meal);
  }
  const day = { dayIndex, meals };
  balanceDay(day, ctx);
  // Keto: if the day still exceeds the net-carb limit, swap the highest-carb
  // component's meal for another composition (bounded attempts).
  const limit = ctx.profile.targets.netCarbLimitG;
  if (limit) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const totals = sumComponents(day.meals.flatMap((m) => m.components), (id) => ctx.byId.get(id));
      if (totals.netCarbsG <= limit) break;
      const worst = [...day.meals].sort(
        (a, b) =>
          sumComponents(b.components, (id) => ctx.byId.get(id)).netCarbsG -
          sumComponents(a.components, (id) => ctx.byId.get(id)).netCarbsG,
      )[0];
      const exclude = new Set(worst.components.map((c) => c.recipeId));
      const replacement = composeMeal(worst.slot, targets[worst.slot], ctx, dayIndex, history, usedToday, exclude);
      if (!replacement) break;
      day.meals[day.meals.indexOf(worst)] = replacement;
      balanceDay(day, ctx);
    }
  }
  for (const m of meals) for (const c of m.components) history.set(c.recipeId, dayIndex);
  return day;
}

export function generatePlan(recipes: PlannerRecipe[], profile: PlannerProfile, days: number, seed: number) {
  const ctx = buildContext(recipes, profile, seed);
  const history: History = new Map();
  const plan: DayPlan[] = [];
  for (let d = 0; d < days; d++) plan.push(generateDay(d, ctx, history));
  return { days: plan, poolSize: ctx.pool.length };
}

/** Ranked alternative compositions for one slot, for the "swap meal" sheet. */
export function alternativesForSlot(
  recipes: PlannerRecipe[],
  profile: PlannerProfile,
  slot: string,
  currentIds: string[],
  seed: number,
  count = 5,
): PlannedMeal[] {
  const target = slotKcalTargets(profile.slots, profile.targets.kcal)[slot];
  const out: PlannedMeal[] = [];
  const exclude = new Set(currentIds.filter((id) => recipes.find((r) => r.id === id)?.course !== "base"));
  for (let i = 0; i < count * 3 && out.length < count; i++) {
    const ctx = buildContext(recipes, profile, seed + i * 7919);
    const meal = composeMeal(slot, target, ctx, 0, new Map(), new Set(), exclude);
    if (!meal) break;
    const key = meal.components.map((c) => c.recipeId).sort().join("+");
    if (!out.some((m) => m.components.map((c) => c.recipeId).sort().join("+") === key)) out.push(meal);
    const lead = meal.components.find((c) => recipes.find((r) => r.id === c.recipeId)?.course !== "base");
    if (lead) exclude.add(lead.recipeId);
  }
  return out;
}

// ─── Validation ─────────────────────────────────────────────────────────────

export function validateDay(day: DayPlan, lookup: (id: string) => PlannerRecipe | undefined, profile: PlannerProfile): DayReport {
  const t = profile.targets;
  const issues: Issue[] = [];
  const comps = day.meals.flatMap((m) => m.components);
  const totals = sumComponents(comps, lookup);
  const diff = (totals.kcal - t.kcal) / t.kcal;
  if (totals.kcal < t.kcalFloor - 50)
    issues.push({ severity: "error", code: "below_floor", message: `About ${Math.round(totals.kcal)} kcal — below the safe minimum of ${t.kcalFloor}. Add a snack or increase a portion.` });
  else if (Math.abs(diff) > 0.15)
    issues.push({ severity: "warning", code: "kcal_off", message: `About ${Math.round(totals.kcal)} kcal — ${diff > 0 ? "above" : "below"} your ${t.kcal} kcal target by ${Math.round(Math.abs(diff) * 100)}%.` });
  if (totals.proteinG < t.proteinG * 0.85)
    issues.push({ severity: "warning", code: "protein_low", message: `Protein ${Math.round(totals.proteinG)} g — short of your ${t.proteinG} g target.` });
  if (totals.fibreG < t.fibreG * 0.6)
    issues.push({ severity: "info", code: "fibre_low", message: `Fibre ${Math.round(totals.fibreG)} g — add vegetables, greens or seeds to reach ~${t.fibreG} g.` });
  if (t.netCarbLimitG && totals.netCarbsG > t.netCarbLimitG + 0.5)
    issues.push({
      severity: profile.style === "keto" ? "error" : "warning",
      code: "net_carbs_over",
      message: `Net carbs ${Math.round(totals.netCarbsG)} g — over your ${t.netCarbLimitG} g limit.`,
    });
  for (const c of comps) {
    const r = lookup(c.recipeId);
    if (!r) continue;
    if (!dietAllows(profile.diet, r.dietType)) issues.push({ severity: "error", code: "diet", message: `${r.title} doesn't match your diet preference.` });
    const hit = r.allergens.filter((a) => profile.allergies.includes(a));
    if (hit.length) issues.push({ severity: "error", code: "allergen", message: `${r.title} contains ${hit.join(", ")}.` });
  }
  const leadIds = comps.filter((c) => lookup(c.recipeId)?.course !== "base" && lookup(c.recipeId)?.course !== "accompaniment").map((c) => c.recipeId);
  if (new Set(leadIds).size < leadIds.length)
    issues.push({ severity: "info", code: "repeat", message: "The same dish appears twice today." });
  if (profile.budgetPerDayInr && totals.costInr > profile.budgetPerDayInr * 1.1)
    issues.push({ severity: "info", code: "budget", message: `Estimated ₹${Math.round(totals.costInr)} for you today — above your ₹${profile.budgetPerDayInr} budget.` });
  return { totals, issues, ok: !issues.some((i) => i.severity === "error") };
}
