import "server-only";
import { and, asc, desc, eq, gte, inArray, like, lte, not, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db, schema } from "@/server/db/client";
import type { Profile } from "@/server/auth/dal";
import { heroImages, imagesFor, type ImageRef } from "./media";

export const PAGE_SIZE = 24;

export type RecipeFilters = {
  q?: string;
  cat?: string;
  diet?: string;
  meal?: string;
  cuisine?: string;
  maxTime?: number;
  maxNet?: number;
  minProtein?: number;
  noAllergens?: string[];
  sort?: "relevance" | "quick" | "protein" | "lowcarb" | "cheap";
  page?: number;
  tab?: "all" | "favourites" | "recent";
  forMe?: boolean;
};

const DIETS_FOR: Record<string, string[]> = {
  vegan: ["vegan"],
  vegetarian: ["vegan", "vegetarian"],
  eggitarian: ["vegan", "vegetarian", "eggitarian"],
  non_vegetarian: ["vegan", "vegetarian", "eggitarian", "non_vegetarian"],
};

const jsonHas = (col: Parameters<typeof like>[0], v: string) => like(col, `%"${v.replace(/[%_"]/g, "")}"%`);

export const cardColumns = {
  id: schema.recipes.id,
  slug: schema.recipes.slug,
  title: schema.recipes.title,
  cuisine: schema.recipes.cuisine,
  course: schema.recipes.course,
  dietType: schema.recipes.dietType,
  kcal: schema.recipes.kcal,
  proteinG: schema.recipes.proteinG,
  netCarbsG: schema.recipes.netCarbsG,
  prepMin: schema.recipes.prepMin,
  cookMin: schema.recipes.cookMin,
  costPerServingInr: schema.recipes.costPerServingInr,
  isKeto: schema.recipes.isKeto,
  isHighProtein: schema.recipes.isHighProtein,
  palette: schema.recipes.palette,
  allergens: schema.recipes.allergens,
};
type CardRow = { [K in keyof typeof cardColumns]: (typeof cardColumns)[K]["_"]["data"] };
export type RecipeCardData = CardRow & { image: ImageRef | null };

async function withImages(rows: CardRow[]): Promise<RecipeCardData[]> {
  const imgs = await heroImages(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, image: imgs.get(r.id) ?? null }));
}

export async function searchRecipes(userId: string, profile: Profile, f: RecipeFilters) {
  const conds: (SQL | undefined)[] = [eq(schema.recipes.validationStatus, "validated")];
  const q = f.q?.trim().toLowerCase().slice(0, 80);
  if (q) for (const tok of q.split(/\s+/).filter(Boolean).slice(0, 6)) conds.push(like(schema.recipes.searchText, `%${tok.replace(/[%_]/g, "")}%`));
  if (f.cat) conds.push(jsonHas(schema.recipes.tags, f.cat));
  const diet = f.diet ?? (f.forMe ? profile.dietPreference : undefined);
  if (diet && DIETS_FOR[diet]) conds.push(inArray(schema.recipes.dietType, DIETS_FOR[diet] as never));
  if (f.meal) conds.push(jsonHas(schema.recipes.mealTypes, f.meal));
  if (f.cuisine) conds.push(eq(schema.recipes.cuisine, f.cuisine));
  if (f.maxTime) conds.push(lte(sql`${schema.recipes.prepMin} + ${schema.recipes.cookMin}`, f.maxTime));
  if (f.maxNet !== undefined) conds.push(lte(schema.recipes.netCarbsG, f.maxNet));
  if (f.minProtein) conds.push(gte(schema.recipes.proteinG, f.minProtein));
  const allergens = new Set([...(f.noAllergens ?? []), ...(f.forMe ? profile.allergies : [])]);
  for (const a of allergens) conds.push(not(jsonHas(schema.recipes.allergens, a)));
  if (f.forMe) for (const a of profile.avoidFoods) conds.push(not(jsonHas(schema.recipes.avoidTags, a)));

  const page = Math.max(1, f.page ?? 1);
  const preferred = profile.cuisines.length ? profile.cuisines : ["__none__"];
  const order =
    f.sort === "quick"
      ? [asc(sql`${schema.recipes.prepMin} + ${schema.recipes.cookMin}`)]
      : f.sort === "protein"
        ? [desc(schema.recipes.proteinG)]
        : f.sort === "lowcarb"
          ? [asc(schema.recipes.netCarbsG)]
          : f.sort === "cheap"
            ? [asc(schema.recipes.costPerServingInr)]
            : q
              ? [desc(sql`instr(lower(${schema.recipes.title}), ${q}) > 0`), asc(schema.recipes.title)]
              : [desc(inArray(schema.recipes.cuisine, preferred)), asc(schema.recipes.title)];

  const base = db.select(cardColumns).from(schema.recipes);
  const where = and(...conds);
  let rows: CardRow[];
  let total: number;
  if (f.tab === "favourites") {
    const join = and(eq(schema.favourites.recipeId, schema.recipes.id), eq(schema.favourites.userId, userId));
    rows = await base.innerJoin(schema.favourites, join).where(where).orderBy(desc(schema.favourites.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
    [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(schema.recipes).innerJoin(schema.favourites, join).where(where);
  } else if (f.tab === "recent") {
    const join = and(eq(schema.recentViews.recipeId, schema.recipes.id), eq(schema.recentViews.userId, userId));
    rows = await base.innerJoin(schema.recentViews, join).where(where).orderBy(desc(schema.recentViews.viewedAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
    [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(schema.recipes).innerJoin(schema.recentViews, join).where(where);
  } else {
    rows = await base.where(where).orderBy(...order).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
    [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(schema.recipes).where(where);
  }
  return { recipes: await withImages(rows), total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function favouriteRecipes(userId: string, limit = 12) {
  const rows = await db
    .select(cardColumns)
    .from(schema.recipes)
    .innerJoin(schema.favourites, and(eq(schema.favourites.recipeId, schema.recipes.id), eq(schema.favourites.userId, userId)))
    .orderBy(desc(schema.favourites.createdAt))
    .limit(limit);
  return withImages(rows);
}

export async function recentRecipes(userId: string, limit = 12) {
  const rows = await db
    .select(cardColumns)
    .from(schema.recipes)
    .innerJoin(schema.recentViews, and(eq(schema.recentViews.recipeId, schema.recipes.id), eq(schema.recentViews.userId, userId)))
    .orderBy(desc(schema.recentViews.viewedAt))
    .limit(limit);
  return withImages(rows);
}

export async function catalogueCount() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(schema.recipes).where(eq(schema.recipes.validationStatus, "validated"));
  return n;
}

// ─── Detail ─────────────────────────────────────────────────────────────────

export async function getRecipeDetail(slug: string, lang: string, userId: string) {
  const [recipe] = await db.select().from(schema.recipes).where(eq(schema.recipes.slug, slug)).limit(1);
  if (!recipe || recipe.validationStatus === "rejected") return null;
  const sub = alias(schema.ingredients, "sub_ing");
  const [lines, steps, subs, translations, fav, images] = await Promise.all([
    db
      .select({ line: schema.recipeIngredients, ing: schema.ingredients })
      .from(schema.recipeIngredients)
      .innerJoin(schema.ingredients, eq(schema.ingredients.id, schema.recipeIngredients.ingredientId))
      .where(eq(schema.recipeIngredients.recipeId, recipe.id))
      .orderBy(asc(schema.recipeIngredients.position)),
    db.select().from(schema.recipeSteps).where(eq(schema.recipeSteps.recipeId, recipe.id)).orderBy(asc(schema.recipeSteps.stepIndex)),
    db
      .select({ s: schema.recipeSubstitutions, fromName: schema.ingredients.name, toName: sub.name })
      .from(schema.recipeSubstitutions)
      .innerJoin(schema.ingredients, eq(schema.ingredients.id, schema.recipeSubstitutions.ingredientId))
      .leftJoin(sub, eq(sub.id, schema.recipeSubstitutions.substituteId))
      .where(eq(schema.recipeSubstitutions.recipeId, recipe.id)),
    db.select().from(schema.recipeTranslations).where(eq(schema.recipeTranslations.recipeId, recipe.id)),
    db.select().from(schema.favourites).where(and(eq(schema.favourites.userId, userId), eq(schema.favourites.recipeId, recipe.id))).limit(1),
    imagesFor([recipe.id]),
  ]);
  const translation = translations.find((tr) => tr.lang === lang) ?? null;
  return {
    recipe,
    lines,
    steps,
    substitutions: subs,
    translation,
    availableLangs: translations.map((tr) => tr.lang),
    isFavourite: fav.length > 0,
    heroImage: images.get(`${recipe.id}:-1`) ?? null,
    stepImages: Object.fromEntries(steps.map((s) => [s.stepIndex, images.get(`${recipe.id}:${s.stepIndex}`) ?? null])) as Record<number, ImageRef | null>,
  };
}
export type RecipeDetail = NonNullable<Awaited<ReturnType<typeof getRecipeDetail>>>;
