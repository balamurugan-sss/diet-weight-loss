# Deployment

## Environment variables
See `.env.example`. Only `DATABASE_URL` (and `DATABASE_AUTH_TOKEN` for Turso) is needed in production;
every AI and payment integration is optional and switches on when its key is present.

| Variable | Needed for |
|---|---|
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | Database (`file:` path or `libsql://` Turso URL) |
| `APP_URL` | Stripe redirect URLs |
| `APP_TIMEZONE` | Calendar dates (default `Asia/Kolkata`) |
| `OPENAI_API_KEY` (+ `OPENAI_IMAGE_MODEL`, `OPENAI_IMAGE_QUALITY`) | AI dish and step images |
| `SARVAM_API_KEY` (+ `SARVAM_TTS_MODEL`, `SARVAM_TTS_SPEAKER`, `SARVAM_TRANSLATE_MODEL`) | Natural Tamil/Malayalam/Indian-English voices and recipe translation |
| `GOOGLE_TTS_API_KEY` | Alternative TTS provider |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `PREMIUM_PRICE_INR` | Subscriptions |
| `GEMINI_API_KEY` (+ `VEO_MODEL`, `VEO_DAILY_LIMIT`), `ADMIN_EMAILS` | AI exercise demo clips (Veo 3.1) generated and reviewed at `/admin/media` |
| `GOOGLE_HEALTH_CLIENT_ID`, `GOOGLE_HEALTH_CLIENT_SECRET`, `HEALTH_TOKEN_KEY` | Google Health (Fitbit / Fitbit Air / Pixel Watch) sync — see docs/HEALTH.md |

Never set `ALLOW_DEV_PREMIUM` in production.

## Option A — Docker (single server, SQLite on a volume)
```bash
docker build -t thali .
docker run -p 3000:3000 -v thali-data:/app/.data --env-file .env thali
```
The container applies migrations and imports the catalogue on start (idempotent).
Back up the `.data` volume (e.g. `sqlite3 app.db ".backup backup.db"` or volume snapshots).

## Option B — Vercel + Turso

Vercel functions have a **read-only filesystem**, so the local SQLite fallback
(`file:./.data/app.db`) cannot work there: without `DATABASE_URL` every page fails with
"This page couldn't load / A server error occurred". Use a hosted libSQL database (Turso):

1. Create the database (free tier is fine):
   ```bash
   turso db create thali
   turso db show thali --url          # → libsql://thali-<org>.turso.io
   turso db tokens create thali       # → auth token
   ```
2. In **Vercel → Project → Settings → Environment Variables**, add for Production (and Preview)
   (or connect Turso from Vercel → Storage; its `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` are picked up too):
   `DATABASE_URL` = the `libsql://…` URL, `DATABASE_AUTH_TOKEN` = the token,
   `APP_URL` = your site URL (e.g. `https://thali.vercel.app`). Optional keys as in the table above.
3. **Redeploy** (Deployments → ⋯ → Redeploy). Vercel runs the `vercel-build` script, which runs
   `scripts/predeploy.ts` first: it checks the variables, applies migrations and imports the recipe
   catalogue (idempotent — later deploys only apply what changed), then runs `next build`.
   If the variables are missing or wrong, the **build fails with an explanation** instead of
   deploying a broken site. The first import takes a minute or two over the network.
4. Image generation needs up to 120 s (`maxDuration` is set on the AI routes; use a plan that allows it).

Troubleshooting: open **Vercel → Project → Logs** (or the deployment's *Functions* log) and
find the error with the "Reference" code shown on the error page. A message starting
`DATABASE_URL is missing` means step 2 wasn't applied to that environment; `no such table`
means migrations didn't run (redeploy, or run `npm run db:seed` locally with the same variables).

## Stripe
Create a recurring INR price, set `STRIPE_PRICE_ID`, and add a webhook endpoint
`https://<host>/api/stripe/webhook` for `checkout.session.completed` and
`customer.subscription.created|updated|deleted`; set `STRIPE_WEBHOOK_SECRET`. Enable the Customer Portal.

## Scheduled jobs
Run daily: `npm run db:prune` (expired sessions, old rate-limit windows, guest accounts idle 90 days).

## Release checklist
`npm run lint && npm run typecheck && npm test && npm run build`, then `npm run test:e2e` against a staging URL
(`E2E_BASE_URL=https://staging… npm run test:e2e`).
