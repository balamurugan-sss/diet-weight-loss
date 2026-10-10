# API contracts

All endpoints require a signed-in session cookie unless noted. JSON route handlers reject
cross-site requests (Origin must match Host). Errors are `{ "error": "<code>" }`.

## Route handlers

### `POST /api/images/generate`
Generate (or fetch cached) AI illustration for a finished dish or cooking step.

Request: `{ "recipeId": "air-fryer-paneer-tikka", "stepIndex": -1 | 0..n, "regenerate"?: boolean }`
(`-1` = finished dish)

| Status | Body |
|---|---|
| 200 | `{ "id": "<uuid>", "kind": "ai_illustration", "cached": boolean }` |
| 402 | `{ "error": "premium" }` — step images need Premium |
| 429 | `{ "error": "quota" \| "rate_limited" \| "busy" }` |
| 503 | `{ "error": "not_configured" }` — no `OPENAI_API_KEY` |

### `POST /api/tts`
Natural-voice narration for one step (Premium).

Request: `{ "recipeId": "...", "stepIndex": 0, "lang": "en" | "en-IN" | "ta" | "ml" }`

| Status | Body |
|---|---|
| 200 | `{ "url": "/api/media/audio/<sha256>", "cached": boolean }` |
| 402 | `premium` · 409 `no_translation` (no validated text in that language) · 429 `quota` · 503 `not_configured` |

### `POST /api/translate`
Machine-translate a recipe's validated steps into Tamil or Malayalam (Premium). Stored with status `machine`.

Request: `{ "recipeId": "...", "lang": "ta" | "ml" }` → `{ "ok": true, "cached": boolean }`

### `GET /api/media/image/:id`, `GET /api/media/audio/:id`
Public, immutable-cached binary media (catalogue content, not user data).

### `GET /api/account/export`
Downloads all of the user's data as JSON.

### `POST /api/stripe/webhook`
Stripe-signed. Handles `checkout.session.completed`, `customer.subscription.created|updated|deleted`.

## Server actions (called from the UI)

| Module | Action | Purpose |
|---|---|---|
| `actions/auth.ts` | `startAsGuest`, `logIn`, `secureAccount`, `logOut`, `setLanguage` | Accounts and language |
| `actions/profile.ts` | `saveProfile(ProfileInput)`, `savePreferences(prefs)` | Onboarding/profile edits; settings |
| `actions/plans.ts` | `createPlanAction(days)`, `regenerateDayAction`, `getAlternativesAction`, `applyAlternativeAction`, `setPortionAction`, `swapIngredientAction`, `toggleEatenAction`, `toggleFavouritePlanAction`, `activatePlanAction` | Meal planner |
| `actions/recipes.ts` | `toggleFavouriteAction`, `recordViewAction` | Library |
| `actions/cooking.ts` | `saveCookingProgress`, `finishCooking` | Cooking mode resume and logging |
| `actions/progress.ts` | `addWaterAction`, `logWeightAction` | Tracking |
| `actions/shopping.ts` | `setShoppingState`, `setHouseholdSize` | Shopping list |
| `actions/account.ts` | `deleteAccountAction`, `startCheckoutAction`, `billingPortalAction`, `toggleDevPremiumAction` | Privacy and billing |

Plan mutations return `{ ok: true } | { ok: false, error: "<message key>" }`; quota failures return
`planner.limitReached`.

## Daily quotas

| Feature | Free | Premium |
|---|---|---|
| Meal plan generations | 3 (7-day only) | 20 (7/14/30-day) |
| Day regenerations | 5 | 40 |
| Meal swaps | 15 | 100 |
| AI dish images | 3 | 30 |
| AI step images | — | 60 |
| Natural-voice characters | — | 20,000 |
| Machine translations | — | 20 |

Cached images and audio never count against quotas. Limits are shown before use (`src/server/services/usage.ts`).
