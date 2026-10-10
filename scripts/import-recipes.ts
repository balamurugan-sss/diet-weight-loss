/**
 * Repeatable catalogue import: validates every batch in content/recipes,
 * computes nutrition from ingredient grams, rejects near-duplicates, and
 * upserts into the database. Safe to run any number of times — unchanged
 * recipes (same content hash) are skipped.
 *
 *   npm run recipes:import            import everything
 *   npm run recipes:import -- --prune hide DB recipes no longer in source
 *   npm run recipes:import -- --dry   validate and report only
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { and, eq, notInArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/server/db/client";
import { loadCatalogue } from "./lib/catalogue";
import { runMigrations } from "./migrate";

const TranslationFile = z.object({
  lang: z.enum(["ta", "ml", "en-IN", "hi", "te", "kn"]),
  status: z.enum(["reviewed", "draft", "machine"]),
  source: z.string(),
  recipes: z.array(
    z.object({
      recipeId: z.string(),
      title: z.string().min(2),
      description: z.string().optional(),
      steps: z.array(z.string().min(5)),
    }),
  ),
});

export async function importCatalogue(opts: { prune?: boolean; dry?: boolean; quiet?: boolean } = {}) {
  const log = (...a: unknown[]) => !opts.quiet && console.log(...a);
  const report = await loadCatalogue();
  for (const issue of report.ingredientIssues) log(`⚠ ingredient: ${issue}`);
  for (const e of report.errors) log(`✗ ${e.file} → ${e.id}: ${e.errors.join("; ")}`);
  const dupIds = new Set(report.duplicates.map((d) => d.b));
  for (const d of report.duplicates) log(`✗ near-duplicate skipped: ${d.b} ≈ ${d.a} (${d.reason})`);
  const recipes = report.recipes.filter((r) => !dupIds.has(r.id));
  if (opts.dry) return { imported: 0, skipped: 0, valid: recipes.length };

  await runMigrations();

  for (const ing of report.ingredients) {
    await db
      .insert(schema.ingredients)
      .values(ing)
      .onConflictDoUpdate({ target: schema.ingredients.id, set: ing });
  }

  const existing = new Map(
    (await db.select({ id: schema.recipes.id, hash: schema.recipes.contentHash }).from(schema.recipes)).map((r) => [
      r.id,
      r.hash,
    ]),
  );

  let imported = 0;
  let skipped = 0;
  const importedAt = new Date().toISOString();
  for (const r of recipes) {
    if (existing.get(r.id) === r.contentHash) {
      skipped++;
      continue;
    }
    const row = {
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      cuisine: r.cuisine,
      region: r.region,
      mealTypes: r.mealTypes,
      course: r.course,
      dietType: r.dietType,
      tags: r.tags,
      servings: r.servings,
      prepMin: r.prepMin,
      cookMin: r.cookMin,
      restMin: r.restMin,
      difficulty: r.difficulty,
      equipment: r.equipment,
      storage: r.storage,
      reheating: r.reheating,
      allergens: r.allergens,
      servingGrams: r.servingGrams,
      kcal: r.perServing.kcal,
      proteinG: r.perServing.proteinG,
      carbsG: r.perServing.carbsG,
      fibreG: r.perServing.fibreG,
      netCarbsG: r.perServing.netCarbsG,
      fatG: r.perServing.fatG,
      costPerServingInr: r.costPerServingInr,
      nutritionSource: "Computed from ingredient quantities using the reference ingredient table",
      nutritionStatus: "estimated" as const,
      isKeto: r.isKeto,
      isLowCarb: r.isLowCarb,
      isHighProtein: r.isHighProtein,
      provenance: {
        source: r.batch.source,
        author: r.batch.author,
        license: r.batch.license,
        importBatch: r.batch.batch,
        importedAt,
      },
      validationStatus: "validated" as const,
      validationNotes: r.warnings,
      contentHash: r.contentHash,
      searchText: r.searchText,
      palette: r.palette,
      updatedAt: new Date(),
    };
    await db.transaction(async (tx) => {
      await tx.insert(schema.recipes).values(row).onConflictDoUpdate({ target: schema.recipes.id, set: row });
      await tx.delete(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, r.id));
      await tx.delete(schema.recipeSteps).where(eq(schema.recipeSteps.recipeId, r.id));
      await tx.delete(schema.recipeSubstitutions).where(eq(schema.recipeSubstitutions.recipeId, r.id));
      if (r.lines.length) await tx.insert(schema.recipeIngredients).values(r.lines.map((l) => ({ ...l, recipeId: r.id })));
      if (r.steps.length) await tx.insert(schema.recipeSteps).values(r.steps.map((s) => ({ ...s, recipeId: r.id })));
      if (r.substitutions.length)
        await tx.insert(schema.recipeSubstitutions).values(r.substitutions.map((s) => ({ ...s, recipeId: r.id })));
      // Step content changed, so previously generated illustrations may no
      // longer match. Curated (approved) images are kept for review.
      if (existing.has(r.id))
        await tx
          .update(schema.imageAssets)
          .set({ status: "rejected" })
          .where(and(eq(schema.imageAssets.recipeId, r.id), eq(schema.imageAssets.status, "generated")));
    });
    imported++;
  }

  if (opts.prune) {
    const ids = recipes.map((r) => r.id);
    const res = await db
      .update(schema.recipes)
      .set({ validationStatus: "rejected" })
      .where(notInArray(schema.recipes.id, ids));
    log(`pruned ${res.rowsAffected} recipes no longer in source`);
  }

  const translated = await importTranslations(new Map(recipes.map((r) => [r.id, r])), log);
  log(
    `✓ ${recipes.length} valid recipes — ${imported} imported/updated, ${skipped} unchanged; ${report.ingredients.length} ingredients; ${translated} translations`,
  );
  return { imported, skipped, valid: recipes.length };
}

async function importTranslations(
  recipes: Map<string, { steps: unknown[]; contentHash: string }>,
  log: (...a: unknown[]) => void,
) {
  const root = "content/translations";
  let count = 0;
  for (const f of readdirSync(root).filter((f) => f.endsWith(".json")).sort()) {
    const parsed = TranslationFile.safeParse(JSON.parse(readFileSync(path.join(root, f), "utf8")));
    if (!parsed.success) {
      log(`✗ translation file ${f}: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
      continue;
    }
    const t = parsed.data;
    for (const tr of t.recipes) {
      const recipe = recipes.get(tr.recipeId);
      if (!recipe) {
        log(`✗ ${f}: unknown recipe ${tr.recipeId}`);
        continue;
      }
      if (tr.steps.length !== recipe.steps.length) {
        log(`✗ ${f}: ${tr.recipeId} has ${tr.steps.length} steps, recipe has ${recipe.steps.length}`);
        continue;
      }
      const row = {
        recipeId: tr.recipeId,
        lang: t.lang,
        title: tr.title,
        description: tr.description ?? null,
        steps: tr.steps,
        status: t.status,
        source: t.source,
        contentHash: recipe.contentHash,
        updatedAt: new Date(),
      };
      await db
        .insert(schema.recipeTranslations)
        .values(row)
        .onConflictDoUpdate({
          target: [schema.recipeTranslations.recipeId, schema.recipeTranslations.lang],
          set: row,
        });
      count++;
    }
  }
  return count;
}

if (process.argv[1]?.endsWith("import-recipes.ts")) {
  importCatalogue({ prune: process.argv.includes("--prune"), dry: process.argv.includes("--dry") })
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
