# Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| Web framework | Next.js 16 (App Router, React 19, Turbopack) | Server Components for data-heavy screens, Server Actions for mutations, one deployable unit for mobile and desktop web |
| Database | SQLite via **libSQL** + **Drizzle ORM** | Relational, zero-ops locally (`file:` URL), and the same driver talks to Turso in production. Migrations in `drizzle/` |
| Styling | Tailwind CSS v4 with design tokens in `src/app/globals.css` | Ivory / forest-green / lime system, fonts via `next/font` (Fraunces, Plus Jakarta Sans, Noto Sans Tamil/Malayalam) |
| Charts | Recharts | Weight trend, calories vs target, projection band |
| Validation | Zod | Profile input, recipe source format, API bodies |
| Tests | Vitest (unit) + Playwright (e2e) | |

## Code layout

```
content/                      Catalogue source data (version-controlled)
  ingredients.ts              Reference nutrition table (per 100 g), names in Tamil/Malayalam, units, ₹/kg
  ingredients-extra/*.ts      Batch-contributed ingredients
  recipes/*.json              Recipe batches (authoring format — see RECIPE_PIPELINE.md)
  translations/*.json         Recipe translations (status: reviewed | draft | machine)
scripts/                      migrate, seed, import-recipes, validate-recipes, prune, workout-samples
src/
  lib/                        Pure, framework-free logic (unit-tested)
    nutrition/                BMI, energy equations, safety screening, targets, projection
    recipes/                  Source schema + compiler, nutrition, classification, measures/scaling
    planner/engine.ts         Meal composition, portion fitting, day balancing, validation
    workouts/                 Exercise library, 4-week program generator, progress replay, energy, food link (see WORKOUTS.md)
    shopping/aggregate.ts     Ingredient aggregation and practical quantities
    media/prompts.ts          Continuity-aware image prompts
    i18n/                     Language registry, messages (en/ta/ml), narration templates, transliteration
  server/                     Server-only code (`import "server-only"`)
    db/                       Drizzle schema and client
    auth/                     Password hashing, DB sessions, data access layer
    services/                 Recipes, plans, day views, shopping, progress, usage quotas, media
    providers/                OpenAI images, Sarvam/Google TTS, Sarvam translation
    actions/                  Server Actions (auth, profile, plans, recipes, cooking, shopping, workouts, account)
  app/                        Routes: (app) with navigation, (focus) full-screen, api/ route handlers
  components/                 UI
```

## Data model (main tables)

- `users`, `sessions` (SHA-256 of the cookie token), `profiles`
- `ingredients` — per-100 g nutrients with `nutrition_source` and `validation_status`
- `recipes` (+ `recipe_ingredients`, `recipe_steps`, `recipe_substitutions`, `recipe_translations`) —
  per-serving nutrition, cost, computed tags, provenance, `validation_status`, `content_hash`
- `image_assets` (by recipe + step, status `approved|generated|rejected`, kind `ai_illustration|verified_photo`),
  `audio_assets` (keyed by hash of provider/voice/language/text)
- `meal_plans`, `meal_plan_items` (slot, position, portion, ingredient swaps, completed)
- `meal_logs`, `weight_logs`, `water_logs`, `cooking_sessions`, `favourites`, `recent_views`, `shopping_state`
- `workout_profiles`, `workout_programs` (28-day snapshot + swaps), `workout_sessions` (one per program day), `workout_sets`
- `usage_counters` (daily quotas), `rate_limits`, `stripe_events` (webhook idempotency)

## Request flow

1. `src/proxy.ts` does an optimistic cookie check and redirects anonymous visitors away from app routes.
2. Every page and action calls the data access layer (`requireUser` / `requireOnboarded`), which
   verifies the session against the database.
3. Server Components read through `src/server/services/*`; mutations go through Server Actions,
   which re-validate input with Zod and re-check ownership.
4. Expensive AI features run in route handlers (`/api/images/generate`, `/api/tts`, `/api/translate`)
   that check same-origin, authentication, plan tier, per-minute rate limits and daily quotas —
   in that order — before calling a provider, refunding quota on failure.

## Media caching

- Images are stored once per `(recipe, step)` and served from `/api/media/image/:id` with
  immutable caching. Approved (curated) images win over generated ones. Re-importing a recipe
  whose content changed marks its generated images as rejected.
- Step images pass the previous step's image as a reference, and prompts list which ingredients
  may appear and which must not appear yet.
- Narration audio is keyed by the hash of the exact text, so identical narration is generated once.

## Security

- Passwords: scrypt (N=16384, r=8, p=1), constant-time compare; login rate-limited per IP and per email.
- Sessions: random 256-bit token in an `HttpOnly`, `SameSite=Lax`, `Secure` (production) cookie;
  only its hash is stored; 30-day sliding expiry; credential changes sign out other devices.
- API keys are read only in `src/server/config.ts` / providers (server-only); nothing is exposed with `NEXT_PUBLIC_`.
- Narration and translation are built from database text, never from client-supplied text,
  so the TTS endpoint cannot be used as a general speech service.
- Stripe webhooks verify signatures and are idempotent.
- Security headers in `next.config.ts`; account export and full deletion in Profile → Privacy.
