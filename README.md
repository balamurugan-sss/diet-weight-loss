# FitFusion AI

A mobile-first AI weight-loss coaching app: personalized calorie/macro targets, an
AI-generated weekly meal plan with full recipes, an AI-generated weekly workout plan,
daily/water/habit tracking, progress charts, a shopping list, an AI chat coach, food
search (with voice/barcode/image entry points), reports, a premium/paywall scaffold,
and a lightweight admin/content panel.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
Framer Motion · Zustand · Recharts · next-themes

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000, click **Get Started**, and complete onboarding — a
profile is required before any other page is reachable (enforced by `ProfileGate`).

```bash
npm run lint       # eslint
npx tsc --noEmit   # typecheck
npm run build      # production build
```

## Architecture — read this before assuming it's "just a demo"

This is a **local-first, single-device app**: there is no backend server, database,
or user auth system. Your profile, daily logs, generated meal/workout plans, and
shopping list live in the browser via `localStorage` (Zustand's `persist` middleware).
Clearing site data resets the app; there is no multi-device sync.

This was a deliberate call, not a shortcut taken silently — the environment this app
was built in had no `DATABASE_URL`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, or any other
credential configured, and standing up a real Postgres + Prisma + NextAuth backend
with no database to point it at would have produced dead scaffolding rather than a
working app. Every *feature* in the product spec is real and functional; what's
architecturally simplified is *where the data lives*.

If you want to evolve this into a real multi-user product, the natural next step is:
add Prisma + Postgres, replace the Zustand stores' persistence with API calls to
route handlers backed by that DB, and add NextAuth for real accounts. The
UI/business-logic layer (`src/lib/ai/*`, `src/lib/calculations.ts`, all the page
components) doesn't need to change to support that — only the persistence layer does.

### What's genuinely real vs. gated behind an API key

| Feature | Status |
|---|---|
| BMI/BMR/TDEE/macro/water/steps/target-date calculations | Real, deterministic math (`src/lib/calculations.ts`) |
| Weekly meal plan generator | Real rule-based scoring engine over a 60-recipe DB, diet/cuisine/health-condition aware (`src/lib/ai/mealPlanner.ts`) |
| Weekly workout plan generator | Real rule-based engine over an 85-exercise DB, home/gym/level/knee-pain-friendly aware (`src/lib/ai/workoutPlanner.ts`) |
| AI Recipe Generator | Real ingredient/tag matching & scoring over the recipe DB |
| AI Chat Coach | Real rule-based intent engine (`src/lib/ai/chatCoach.ts`) answering the product spec's example questions. `/api/chat` calls OpenAI's `gpt-4o-mini` instead **if `OPENAI_API_KEY` is set** in the server environment; otherwise it falls back to the rule-based engine — the app is fully functional either way |
| Food image recognition | Calls GPT-4o vision via `/api/food-vision` **only if `OPENAI_API_KEY` is set**; shows a clear "not configured" message otherwise (never fakes a result) |
| Barcode scanner | Real camera decode via `@zxing/browser` + a real lookup against the public [Open Food Facts](https://world.openfoodfacts.org) API (no key required) — not tested end-to-end in the sandboxed dev environment this was built in, since its network egress policy blocks arbitrary external hosts; will work for real users on real networks |
| Voice search | Real browser `SpeechRecognition` Web API, no key needed |
| Stripe checkout | `/api/checkout` creates a real Stripe Checkout Session **if `STRIPE_SECRET_KEY` is set**; otherwise returns a clear setup message. A labeled "dev only" toggle lets you simulate a premium account locally to test gating without a real payment |
| Premium gating | Real (if modest): Recipe Generator caps results to 3 for free vs 8 for premium; the Progress page's "Yearly" range requires premium |
| Admin panel | Manages what's actually real for a single-device app: DB size stats, custom recipes/foods (which genuinely feed into the meal planner / recipe generator / food search), the current workout plan, local blog posts/FAQs, and a read-only view of the chat coach's intents. It does **not** pretend to manage a multi-user table — there isn't one |
| Push notifications | Real browser `Notification` permission request + toggleable reminder preferences. Persistent background scheduling would need a service worker, which is out of scope for a `localStorage`-backed app |
| PDF export | `window.print()` with a print stylesheet (Shopping List, Reports) — a real PDF, produced by the browser's own print-to-PDF, not a third-party PDF library |

### Environment variables (all optional — the app works with none of them set)

```
OPENAI_API_KEY=       # enables real AI chat replies + food image recognition
STRIPE_SECRET_KEY=    # enables real Stripe Checkout sessions
```

## Project structure

```
src/
  app/
    page.tsx                 landing page
    onboarding/               multi-step signup wizard
    (app)/                    route group sharing the app shell (sidebar/topbar/bottom nav)
      dashboard/  meals/  recipes/[id]/  recipes/generator/  workouts/
      tracker/  progress/  shopping-list/  chat/  food-search/
      insights/  notifications/  reports/  premium/  admin/  settings/  more/
    api/
      chat/route.ts           OpenAI-or-rule-based chat
      food-vision/route.ts    OpenAI vision-or-503
      checkout/route.ts       Stripe-or-503
  components/                 UI, feature, and layout components
  lib/
    calculations.ts           BMI/BMR/TDEE/macro engine
    ai/                       meal planner, workout planner, recipe generator, chat coach, insights, shopping list
    data/                     seeded recipes (60), exercises (85), foods (82), quotes, onboarding options
    store/                    zustand stores (user, tracker, plan, chat, settings, admin) — all localStorage-persisted
    progress.ts / reports.ts  chart/report data shaping
  types/index.ts               shared domain types
```

## Known limitation (not a bug)

Requesting an unknown `/recipes/[id]` renders the correct "not found" UI but with an
HTTP 200 status (with a `noindex` meta tag). This is documented Next.js App Router
streaming behavior — response headers (and therefore the status code) are sent before
`notFound()` runs deeper in the tree. Given this is a local-first app with no SEO/
analytics dependency on that status code, it was left as-is rather than adding a
proxy-layer existence check purely to change a status code a user never sees.
