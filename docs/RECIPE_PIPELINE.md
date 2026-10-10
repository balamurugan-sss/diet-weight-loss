# Recipe pipeline

The catalogue is authored as version-controlled JSON and compiled into the database by a repeatable,
idempotent importer. Nutrition, tags, allergens and costs are **computed**, not typed in.

```
content/recipes/*.json ──► validate (zod + rules) ──► compile (nutrition, tags, cost, hashes)
                         ──► near-duplicate check ──► upsert into DB (unchanged hashes skipped)
content/translations/*.json ──► step-count check ──► upsert recipe_translations
```

Commands:

```bash
npm run recipes:validate                 # whole catalogue
npm run recipes:validate -- 101 --table  # one batch, with per-serving nutrition table
npm run recipes:import                   # import (idempotent)
npm run recipes:import -- --prune        # hide DB recipes that were removed from source
```

## Authoring format

A batch file: `{ "batch", "source", "author", "license", "recipes": [...] }`. Each recipe
(schema: `src/lib/recipes/source.ts`):

- `id` (kebab-case, stable), `title`, `description`, `cuisine`, `region?`, `mealTypes`, `course`
  (`complete | main | side | base | accompaniment | snack | dessert | drink`), `servings`, `prepMin`,
  `cookMin`, `restMin?`, `difficulty`, `equipment` (codes; alternatives with `|`)
- `ingredients`: `{ ref, g, measure?, prep?, optional?, toTaste?, group? }` — `g` is the raw weight for all servings
- `steps`: `{ title, text, kind, uses[], visual, timerMin?, tempC?, heat?, equipment? }`
- `substitutions`: `{ ref, with?, ratio?, note }`, `storage?`, `reheating?`, editorial `tags`

## Validation rules
- Every ingredient `ref` exists (core table or `content/ingredients-extra/`).
- **Visual continuity:** a step may only `use` listed ingredients; every required ingredient is used in some step;
  exactly one `serve` step and it is last (the finished dish never appears early).
- Step equipment must be in the recipe's equipment.
- Declared `diet` (optional) must match the diet computed from ingredients.
- Per-serving energy must be plausible (< 1,100 kcal; warnings under 40 kcal).
- **Near-duplicates are rejected:** same normalised title, or ≥ 85% ingredient overlap with similar quantities.

## Provenance
Each recipe stores `{ source, author, license, importBatch, importedAt }`, a `content_hash`, and
`validation_status` (`validated | draft | rejected`). Changing a recipe's content invalidates its
generated images.

## Growing to 1,000+ recipes
Add new batch files (e.g. `108-maharashtrian.json`), add any missing ingredients to a new
`content/ingredients-extra/108-*.ts`, run `npm run recipes:validate -- 108 --table`, fix every
rejection, then `npm run recipes:import`. Imports from external sources must keep their licence in the
batch header. The importer never pads the count — duplicates and superficial variants are rejected.

## Translations
`content/translations/<lang>-NNN.json`: `{ lang, status, source, recipes: [{ recipeId, title, description?, steps[] }] }`.
`steps` must have the same length as the recipe's steps. Status:
- `reviewed` — checked by a native speaker (shown without a caveat),
- `draft` — human- or AI-drafted, awaiting review (labelled in the app),
- `machine` — created on demand by the translation API (labelled as machine-translated).
Narration is only ever spoken from this stored text.
