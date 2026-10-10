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

Never set `ALLOW_DEV_PREMIUM` in production.

## Option A — Docker (single server, SQLite on a volume)
```bash
docker build -t thali .
docker run -p 3000:3000 -v thali-data:/app/.data --env-file .env thali
```
The container applies migrations and imports the catalogue on start (idempotent).
Back up the `.data` volume (e.g. `sqlite3 app.db ".backup backup.db"` or volume snapshots).

## Option B — Vercel (or any serverless host) + Turso
1. `turso db create thali && turso db tokens create thali` → set `DATABASE_URL` / `DATABASE_AUTH_TOKEN`.
2. From your machine/CI with those variables: `npm run db:seed` (migrations + catalogue).
3. Deploy the Next.js app with the same variables. Image generation needs up to 120 s
   (`maxDuration` is set on the AI routes; use a plan that allows it).
4. Re-run `npm run recipes:import` whenever the catalogue changes (e.g. as a CI step).

## Stripe
Create a recurring INR price, set `STRIPE_PRICE_ID`, and add a webhook endpoint
`https://<host>/api/stripe/webhook` for `checkout.session.completed` and
`customer.subscription.created|updated|deleted`; set `STRIPE_WEBHOOK_SECRET`. Enable the Customer Portal.

## Scheduled jobs
Run daily: `npm run db:prune` (expired sessions, old rate-limit windows, guest accounts idle 90 days).

## Release checklist
`npm run lint && npm run typecheck && npm test && npm run build`, then `npm run test:e2e` against a staging URL
(`E2E_BASE_URL=https://staging… npm run test:e2e`).
