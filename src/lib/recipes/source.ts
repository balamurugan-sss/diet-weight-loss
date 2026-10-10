import { createHash } from "node:crypto";
import { z } from "zod";
import {
  classifyServing,
  deriveDietType,
  recipeCost,
  recipeTotals,
  roundNutrients,
  scaleNutrients,
} from "./nutrition";
import {
  BASIC_EQUIPMENT,
  COURSES,
  CUISINES,
  EDITORIAL_TAGS,
  EQUIPMENT,
  INDIAN,
  MEAL_TYPES,
  SOUTH_INDIAN,
  STEP_KINDS,
  type DietType,
  type Ingredient,
  type Nutrients,
} from "./types";

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase-kebab-case");
const equipmentToken = z
  .string()
  .refine(
    (s) => s.split("|").every((e) => (EQUIPMENT as readonly string[]).includes(e)),
    "unknown equipment (use codes from EQUIPMENT, alternatives separated by |)",
  );

export const SourceLine = z.object({
  ref: z.string(),
  g: z.number().positive().max(5000),
  measure: z.string().max(40).optional(),
  prep: z.string().max(80).optional(),
  optional: z.boolean().optional(),
  toTaste: z.boolean().optional(),
  group: z.string().max(30).optional(),
});

export const SourceStep = z.object({
  title: z.string().min(2).max(48),
  text: z.string().min(15).max(600),
  kind: z.enum(STEP_KINDS),
  uses: z.array(z.string()).default([]),
  visual: z.string().min(15).max(400),
  timerMin: z.number().positive().max(720).optional(),
  tempC: z.number().int().min(30).max(260).optional(),
  heat: z.enum(["low", "medium", "high"]).optional(),
  equipment: z.array(equipmentToken).optional(),
});

export const SourceRecipe = z.object({
  id: slug.max(64),
  title: z.string().min(3).max(70),
  description: z.string().min(20).max(280),
  cuisine: z.enum(CUISINES),
  region: z.string().max(40).optional(),
  mealTypes: z.array(z.enum(MEAL_TYPES)).min(1),
  course: z.enum(COURSES),
  servings: z.number().int().min(1).max(12),
  prepMin: z.number().int().min(0).max(240),
  cookMin: z.number().int().min(0).max(480),
  restMin: z.number().int().min(0).max(1440).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  equipment: z.array(equipmentToken).min(1),
  ingredients: z.array(SourceLine).min(2).max(30),
  steps: z.array(SourceStep).min(3).max(16),
  substitutions: z
    .array(
      z.object({
        ref: z.string(),
        with: z.string().optional(),
        ratio: z.number().positive().max(4).optional(),
        note: z.string().min(5).max(200),
      }),
    )
    .default([]),
  storage: z.string().max(240).optional(),
  reheating: z.string().max(240).optional(),
  tags: z.array(z.enum(EDITORIAL_TAGS)).default([]),
  diet: z.enum(["vegan", "vegetarian", "eggitarian", "non_vegetarian"]).optional(),
});
export type SourceRecipe = z.infer<typeof SourceRecipe>;

export const SourceFile = z.object({
  batch: z.string(),
  source: z.string(),
  author: z.string().optional(),
  license: z.string().optional(),
  recipes: z.array(z.unknown()),
});

export type CompiledRecipe = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cuisine: string;
  region: string | null;
  mealTypes: string[];
  course: (typeof COURSES)[number];
  dietType: DietType;
  tags: string[];
  servings: number;
  prepMin: number;
  cookMin: number;
  restMin: number;
  difficulty: "easy" | "medium" | "hard";
  equipment: string[];
  storage: string | null;
  reheating: string | null;
  allergens: string[];
  avoidTags: string[];
  servingGrams: number;
  perServing: Nutrients;
  costPerServingInr: number;
  isKeto: boolean;
  isLowCarb: boolean;
  isHighProtein: boolean;
  lines: {
    position: number;
    ingredientId: string;
    grams: number;
    measureText: string | null;
    prepNote: string | null;
    optional: boolean;
    toTaste: boolean;
    groupName: string | null;
  }[];
  steps: {
    stepIndex: number;
    title: string;
    text: string;
    kind: (typeof STEP_KINDS)[number];
    timerSec: number | null;
    tempC: number | null;
    heat: "low" | "medium" | "high" | null;
    uses: string[];
    visual: string;
    equipment: string[];
  }[];
  substitutions: { ingredientId: string; substituteId: string | null; ratio: number; note: string }[];
  palette: string[];
  contentHash: string;
  searchText: string;
  warnings: string[];
};

export type CompileResult = { ok: true; recipe: CompiledRecipe } | { ok: false; id: string; errors: string[] };

const CATEGORY_COLOURS: Record<string, string> = {
  vegetables: "#5E8C3A",
  herbs: "#3F7D3A",
  fruits: "#E0923A",
  meat: "#A4442A",
  seafood: "#D07A4F",
  eggs: "#F1C44E",
  dairy: "#F2E6CF",
  grains: "#D9B77A",
  pulses: "#E2A93B",
  nuts_seeds: "#B07A4A",
  spices: "#C9541E",
  condiments: "#8E3B2B",
};

/** Validates one authored recipe and computes everything derivable from it. */
export function compileRecipe(
  raw: unknown,
  ingredientMap: Map<string, Ingredient>,
): CompileResult {
  const parsed = SourceRecipe.safeParse(raw);
  const rawId = (raw as { id?: string })?.id ?? "(missing id)";
  if (!parsed.success) {
    return {
      ok: false,
      id: rawId,
      errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  const r = parsed.data;
  const errors: string[] = [];
  const warnings: string[] = [];

  const refs = new Set<string>();
  for (const l of r.ingredients) {
    if (!ingredientMap.has(l.ref)) errors.push(`ingredients: unknown ingredient "${l.ref}"`);
    if (refs.has(l.ref) && !l.group) errors.push(`ingredients: "${l.ref}" listed twice without a group`);
    refs.add(l.ref);
  }

  // Continuity: every step may only use listed ingredients, and every
  // required ingredient must appear in a step so images never show items
  // appearing from nowhere.
  const used = new Set<string>();
  r.steps.forEach((s, i) => {
    for (const u of s.uses) {
      if (!refs.has(u)) errors.push(`steps[${i}].uses: "${u}" is not in the ingredient list`);
      used.add(u);
    }
    for (const e of s.equipment ?? []) {
      const options = e.split("|");
      const listed = r.equipment.some((re) => re.split("|").some((x) => options.includes(x)));
      if (!listed && !options.some((o) => (BASIC_EQUIPMENT as string[]).includes(o)))
        errors.push(`steps[${i}].equipment: "${e}" not in recipe equipment`);
    }
  });
  for (const l of r.ingredients) {
    if (!l.optional && l.ref !== "water" && !used.has(l.ref))
      errors.push(`ingredients: "${l.ref}" is never used in any step`);
  }
  const serveIdx = r.steps.findIndex((s) => s.kind === "serve");
  if (serveIdx === -1) errors.push("steps: the final step must have kind \"serve\"");
  else if (serveIdx !== r.steps.length - 1)
    errors.push("steps: only the final step may have kind \"serve\" (finished dish must come last)");

  for (const s of r.substitutions) {
    if (!refs.has(s.ref)) errors.push(`substitutions: "${s.ref}" is not in the ingredient list`);
    if (s.with && !ingredientMap.has(s.with)) errors.push(`substitutions: unknown substitute "${s.with}"`);
  }

  if (errors.length) return { ok: false, id: r.id, errors };

  const lookup = (id: string) => ingredientMap.get(id);
  const lines = r.ingredients.map((l) => ({
    ingredientId: l.ref,
    grams: l.g,
    optional: !!l.optional,
  }));
  const totals = recipeTotals(lines, lookup);
  const perServing = roundNutrients(scaleNutrients(totals, 1 / r.servings));
  const cls = classifyServing(perServing);
  const requiredIngs = r.ingredients.filter((l) => !l.optional).map((l) => ingredientMap.get(l.ref)!);
  const dietType = deriveDietType(requiredIngs.map((i) => i.dietClass));
  if (r.diet && r.diet !== dietType)
    return { ok: false, id: r.id, errors: [`diet: declared "${r.diet}" but ingredients make it "${dietType}"`] };

  const nonWaterGrams = r.ingredients
    .filter((l) => !l.optional && l.ref !== "water")
    .reduce((s, l) => s + l.g, 0);
  const servingGrams = Math.round(nonWaterGrams / r.servings);

  if (perServing.kcal < 40) warnings.push(`very low energy per serving (${perServing.kcal} kcal)`);
  if (perServing.kcal > 1100) errors.push(`implausible energy per serving (${perServing.kcal} kcal)`);
  if (errors.length) return { ok: false, id: r.id, errors };

  const allergens = [...new Set(r.ingredients.flatMap((l) => ingredientMap.get(l.ref)!.allergens))].sort();
  const avoidTags = [...new Set(requiredIngs.flatMap((i) => i.avoidTags))].sort();
  const costPerServingInr = Math.round(recipeCost(lines, lookup) / r.servings);
  const totalMin = r.prepMin + r.cookMin;

  const tags = new Set<string>(r.tags);
  const indian = (INDIAN as string[]).includes(r.cuisine);
  if (cls.isKeto) tags.add("keto");
  if (cls.isKeto && indian) tags.add("indian_keto");
  if (cls.isLowCarb) tags.add("low_carb");
  if (cls.isLowCarb && (SOUTH_INDIAN as string[]).includes(r.cuisine)) tags.add("south_indian_low_carb");
  if (cls.isHighProtein) tags.add("high_protein");
  if (dietType === "vegan" || dietType === "vegetarian") tags.add("vegetarian");
  if (dietType === "vegan") tags.add("vegan");
  if (requiredIngs.some((i) => i.category === "eggs") || requiredIngs.some((i) => i.id === "egg")) tags.add("egg");
  if (requiredIngs.some((i) => i.category === "meat")) tags.add("chicken_meat");
  if (requiredIngs.some((i) => i.category === "seafood")) tags.add("fish_seafood");
  if (r.mealTypes.includes("breakfast")) tags.add("breakfast");
  if (r.mealTypes.includes("lunch") || r.mealTypes.includes("dinner")) tags.add("lunch_dinner");
  if (r.mealTypes.includes("snack")) tags.add("snacks");
  if (r.mealTypes.includes("dessert")) tags.add("dessert");
  if (/soup|salad|rasam|shorba/i.test(r.title)) tags.add("soups_salads");
  if (totalMin <= 15) tags.add("quick_15");
  if (costPerServingInr <= 40) tags.add("budget");
  if (r.servings >= 4) tags.add("family");

  const palette = [
    ...new Set(
      requiredIngs
        .filter((i) => CATEGORY_COLOURS[i.category])
        .sort((a, b) => b.costPerKgInr - a.costPerKgInr)
        .map((i) => CATEGORY_COLOURS[i.category]),
    ),
  ].slice(0, 4);

  const contentHash = createHash("sha256").update(JSON.stringify(r)).digest("hex").slice(0, 16);
  const searchText = [
    r.title,
    r.description,
    r.region ?? "",
    r.cuisine.replace("_", " "),
    ...requiredIngs.map((i) => `${i.name} ${i.nameTa ?? ""} ${i.nameMl ?? ""}`),
    ...tags,
  ]
    .join(" ")
    .toLowerCase();

  return {
    ok: true,
    recipe: {
      id: r.id,
      slug: r.id,
      title: r.title,
      description: r.description,
      cuisine: r.cuisine,
      region: r.region ?? null,
      mealTypes: r.mealTypes,
      course: r.course,
      dietType,
      tags: [...tags].sort(),
      servings: r.servings,
      prepMin: r.prepMin,
      cookMin: r.cookMin,
      restMin: r.restMin ?? 0,
      difficulty: r.difficulty,
      equipment: r.equipment,
      storage: r.storage ?? null,
      reheating: r.reheating ?? null,
      allergens,
      avoidTags,
      servingGrams,
      perServing,
      costPerServingInr,
      isKeto: cls.isKeto,
      isLowCarb: cls.isLowCarb,
      isHighProtein: cls.isHighProtein,
      lines: r.ingredients.map((l, position) => ({
        position,
        ingredientId: l.ref,
        grams: l.g,
        measureText: l.measure ?? null,
        prepNote: l.prep ?? null,
        optional: !!l.optional,
        toTaste: !!l.toTaste,
        groupName: l.group ?? null,
      })),
      steps: r.steps.map((s, stepIndex) => ({
        stepIndex,
        title: s.title,
        text: s.text,
        kind: s.kind,
        timerSec: s.timerMin ? Math.round(s.timerMin * 60) : null,
        tempC: s.tempC ?? null,
        heat: s.heat ?? null,
        uses: s.uses,
        visual: s.visual,
        equipment: s.equipment ?? [],
      })),
      substitutions: r.substitutions.map((s) => ({
        ingredientId: s.ref,
        substituteId: s.with ?? null,
        ratio: s.ratio ?? 1,
        note: s.note,
      })),
      palette,
      contentHash,
      searchText,
      warnings,
    },
  };
}

// ─── Duplicate detection ────────────────────────────────────────────────────

function normaliseTitle(t: string) {
  return t
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(easy|quick|healthy|homestyle|style|recipe|with|and|the|a)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jaccard(a: Set<string>, b: Set<string>) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

const TRIVIAL = new Set(["salt", "water", "turmeric", "chilli_powder", "oil", "mustard_seeds", "curry_leaves"]);

/**
 * Flags near-duplicates: same normalised title, or ≥85% ingredient overlap
 * (ignoring trivial seasonings) with near-identical gram amounts. This stops
 * a catalogue from being padded with superficial variants.
 */
export function findDuplicates(recipes: CompiledRecipe[]): { a: string; b: string; reason: string }[] {
  const out: { a: string; b: string; reason: string }[] = [];
  const titles = new Map<string, string>();
  const sigs = recipes.map((r) => ({
    id: r.id,
    set: new Set(r.lines.filter((l) => !l.optional && !TRIVIAL.has(l.ingredientId)).map((l) => l.ingredientId)),
    grams: new Map(r.lines.map((l) => [l.ingredientId, l.grams / r.servings])),
  }));
  for (const r of recipes) {
    const t = normaliseTitle(r.title);
    const prev = titles.get(t);
    if (prev) out.push({ a: prev, b: r.id, reason: `same normalised title "${t}"` });
    else titles.set(t, r.id);
  }
  for (let x = 0; x < sigs.length; x++) {
    for (let y = x + 1; y < sigs.length; y++) {
      const A = sigs[x];
      const B = sigs[y];
      if (A.set.size < 3 || B.set.size < 3) continue;
      const j = jaccard(A.set, B.set);
      if (j < 0.85) continue;
      let close = 0;
      let shared = 0;
      for (const id of A.set) {
        if (!B.set.has(id)) continue;
        shared++;
        const ga = A.grams.get(id)!;
        const gb = B.grams.get(id)!;
        if (Math.abs(ga - gb) / Math.max(ga, gb) < 0.2) close++;
      }
      if (shared && close / shared > 0.8)
        out.push({ a: A.id, b: B.id, reason: `${Math.round(j * 100)}% ingredient overlap with similar quantities` });
    }
  }
  return out;
}
