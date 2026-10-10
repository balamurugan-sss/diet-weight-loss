# Health data

Steps, active minutes, sleep, resting heart rate and cardio workouts from a
watch or phone, stored per day (`health_days`, one row per source) and read
alongside the food and workout plans.

## Sources

| Source | How | What |
|---|---|---|
| **Google Health API** (Fitbit, Fitbit Air, Pixel Watch) | OAuth "Connect Google Health" on `/health`, then "Sync now" | Last 14 days: steps and active minutes (daily roll-ups), main sleep by wake-up date, cardio exercise sessions |
| **Apple Health export** | Health app → profile → Export All Health Data → unzip → upload `export.xml` | Last 90 days: steps (largest source per day, so iPhone + Watch aren't double counted), exercise minutes, resting HR, sleep (asleep stages, by wake date), cardio workouts |
| **Fitbit export / Google Takeout** | Upload the JSON files from "Global Export Data" | steps, very/moderately active minutes, main sleep, resting HR, cardio exercise |
| **CSV** (any tracker) | `date,steps,active_minutes,resting_hr,sleep_minutes` | as given |

Exports are parsed **in the browser**; only daily totals (and cardio sessions)
are sent to the server. Imported workouts become cardio entries with the source
and its id, so re-importing updates rather than duplicates them. Strength
sessions from devices are skipped (the app tracks those itself).

When two sources report the same day, values are taken in this order:
Google Health → Apple Health → Fitbit export → manual.

**Not possible from a web app:** iPhone HealthKit and Android Health Connect
are on-device only. Direct sync needs a native wrapper (e.g. Capacitor with a
HealthKit / Health Connect plugin) — planned separately.

## Google Health API setup

The legacy Fitbit Web API was retired on 2026-09-30; the Google Health API (v4,
`health.googleapis.com`) replaces it. As of Google's August 2026 developer
newsletter, Google wasn't onboarding new projects generally, so access may need
to be requested.

1. Google Cloud console → new project → enable **Google Health API**.
2. OAuth consent screen (External). The scopes are *restricted*; in **Testing**
   mode up to 100 test users work without verification, but their refresh tokens
   expire after 7 days (users reconnect weekly). Production use needs Google's
   app verification.
3. Credentials → OAuth client (Web) → redirect URI `<APP_URL>/api/health/google/callback`.
4. Set `GOOGLE_HEALTH_CLIENT_ID`, `GOOGLE_HEALTH_CLIENT_SECRET`, `APP_URL`, and
   `HEALTH_TOKEN_KEY` (`openssl rand -base64 32`). Tokens are stored AES-256-GCM
   encrypted and revoked at Google on disconnect.

Scopes requested (read-only): `googlehealth.activity_and_fitness.readonly`,
`googlehealth.health_metrics_and_measurements.readonly`, `googlehealth.sleep.readonly`.

Request shapes (`src/lib/health/google.ts`, unit-tested against recorded
responses): `POST /v4/users/me/dataTypes/{steps|active-minutes}/dataPoints:dailyRollUp`
with a civil-date range; `GET …/dataTypes/sleep/dataPoints?filter=sleep.interval.civil_end_time …`
and `…/exercise/dataPoints?filter=exercise.interval.civil_start_time …`.
Resting heart rate isn't read from Google Health yet (no confirmed data type).
The connector has not been run against a live Google project from this
environment; verify with a test account after setup.

## Daily analysis (`src/lib/health/analysis.ts`)

Compares the latest day with the person's previous 7 days:

- Steps below 8,000 → minutes of brisk walking to close the gap (≈100 steps/min).
- Sleep under 7 h → hunger/protein note; under 6 h → suggest an easy day.
- Resting HR ≥ 5 bpm above the 7-day average (needs ≥ 3 days) → suggest recovery.
- 30+ active minutes → counted towards the WHO 150 min/week.

Insights are wellness guidance, not medical advice.
