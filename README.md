# Thali — AI Indian Diet Planner, Keto Coach & Visual Cooking Assistant

A mobile-first web app for Indian users who want to lose weight on familiar food:
personalised calorie and macro targets with safety screening, 7/14/30-day meal plans
built from a validated catalogue of Indian and international recipes, keto and
low-carb options checked carb-by-carb, a hands-free visual cooking mode with
narration in English, Tamil and Malayalam, shopping lists, and progress tracking.

> General wellness guidance and estimates — not medical advice or diagnosis.

## Quick start

```bash
npm install
npm run db:seed -- --demo   # migrations + recipe catalogue + a demo account (prints its password)
npm run dev                 # http://localhost:3000
```

No API keys are needed to run the app. Without keys, AI image generation, natural
voices, machine translation and payments are shown as unavailable (never faked); the
cooking assistant uses the device's built-in voices instead.

```bash
npm test                 # unit tests: nutrition, safety, scaling, planner, shopping, prompts
npm run test:e2e         # Playwright golden path (onboard → plan → swap → cook → log)
npm run lint && npm run typecheck && npm run build
npm run recipes:validate -- --table   # validate the catalogue and print per-serving nutrition
```

## What's in the box

| Area | Status |
|---|---|
| Onboarding (9 steps, skippable optional steps, editable later) | ✅ |
| BMI with WHO **and** Asian-Indian categories, limitations, under-18 handling | ✅ |
| Mifflin–St Jeor BMR/TDEE, calorie range, macros, fibre, water guideline, ranged projection | ✅ |
| Safety screening (pregnancy, diabetes medication, kidney/liver/gallbladder, eating-disorder history, under-18, underweight) | ✅ blocks unsafe plan styles and deficits, explains why |
| Recipe catalogue | ✅ **321 validated recipes**, 218 ingredients, repeatable import pipeline for 1,000+ |
| Nutrition, keto/low-carb/high-protein tags, allergens, cost | ✅ computed from ingredient grams, never declared |
| Meal planner: 7/14/30 days, Indian meal composition, swaps, ingredient swaps, portions, regenerate day, favourites, daily validation | ✅ |
| Recipe search, 16 categories, filters, sort, pagination, favourites, recently viewed | ✅ |
| Cooking mode: step images, timers with spoken alerts, narration, speed, language, voice commands, wake lock, servings & units, resume | ✅ |
| AI finished-dish and step images with continuity, cached per recipe/step, regenerate | ✅ needs `OPENAI_API_KEY` |
| Natural-voice narration (Tamil, Malayalam, Indian English) | ✅ needs `SARVAM_API_KEY` or `GOOGLE_TTS_API_KEY`; device voices work without |
| UI in English, Tamil, Malayalam (+ optional Latin transliteration) | ✅ translations are AI-drafted — native-speaker review recommended |
| Shopping list: merged, scaled, practical quantities, ₹ cost, pantry, hidden-carb warnings | ✅ |
| Progress dashboard, water, weight, adherence (no streaks or shaming) | ✅ |
| Auth (guest-first, email/password), privacy export, account deletion | ✅ |
| Free/Premium tiers with visible quotas; Stripe checkout, portal, webhook | ✅ needs Stripe keys; dev-only toggle otherwise |

## Design

Dark, high-contrast look with a neon-lime accent (geometric display type, handwritten
notes, lime brush ribbons, pill chips, lime feature cards with ↗ buttons). An ivory /
forest-green light theme is available under Settings → Appearance. All colours are
role-based tokens in `src/app/globals.css`; chart colours are validated for
colour-blind safety in both themes.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — stack, data model, request flow, security
- [API contracts](docs/API.md) — route handlers and server actions
- [Nutrition methods](docs/NUTRITION_METHODS.md) — equations, net carbs, keto rules, safety rules
- [Recipe pipeline](docs/RECIPE_PIPELINE.md) — authoring format, validation, import, translations, growing to 1,000+
- [Deployment](docs/DEPLOYMENT.md) — environment variables, Docker, Vercel + Turso, cron jobs

## Honest limitations

- **Nutrition values are estimates.** Ingredient values were transcribed from IFCT 2017,
  USDA FoodData Central and typical labels and are marked `reference_estimate` until
  verified against the source tables; recipe totals are computed from them.
- **Children and teenagers:** the app does not compute BMI-for-age percentiles (it would
  need WHO/IAP reference tables, which are not bundled). Under-18s see an explanation and
  are offered balanced maintenance plans only, with a referral to a paediatrician.
- **Translations** of the UI and of 50+ recipes are AI-drafted and labelled
  "awaiting native-speaker review" in the app; machine translations created on demand are
  labelled as machine-translated.
- **AI images** are clearly labelled as AI illustrations. Until a key is configured, recipes
  show a labelled, generated placeholder illustration rather than a photo.
- The catalogue ships with 321 recipes; reaching 1,000+ means adding more batches through
  the same validated pipeline (see the recipe pipeline doc) — the app does not pad the count.
