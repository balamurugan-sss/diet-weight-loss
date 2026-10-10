import "server-only";
import {
  dailyRollUpBody,
  GOOGLE_HEALTH,
  listFilter,
  parseDailyRollUp,
  parseExercise,
  parseHeartRollup,
  parseHourlyHeart,
  parseRestingHr,
  parseSleepNights,
} from "@/lib/health/google";
import { emptyDay, type HealthDay, type HealthImport } from "@/lib/health/types";
import { config, ProviderError } from "@/server/config";
import { hasEncryptionKey } from "@/server/crypto";
import { addDaysISO, clockAt, todayISO } from "@/server/time";

/**
 * Google Health API client (Fitbit, Fitbit Air, Pixel Watch).
 * Needs a Google Cloud project with the Google Health API enabled and an OAuth
 * web client: GOOGLE_HEALTH_CLIENT_ID / GOOGLE_HEALTH_CLIENT_SECRET, plus
 * HEALTH_TOKEN_KEY to encrypt tokens. Redirect URI: <APP_URL>/api/health/google/callback.
 */
export function googleHealthConfigured() {
  return !!(process.env.GOOGLE_HEALTH_CLIENT_ID && process.env.GOOGLE_HEALTH_CLIENT_SECRET && hasEncryptionKey());
}

export const STATE_COOKIE = "thali_gh_state";

export const redirectUri = () => `${config.appUrl.replace(/\/$/, "")}/api/health/google/callback`;

export function authorizationUrl(state: string) {
  const url = new URL(GOOGLE_HEALTH.authUrl);
  url.searchParams.set("client_id", process.env.GOOGLE_HEALTH_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("scope", GOOGLE_HEALTH.scopes.join(" "));
  url.searchParams.set("state", state);
  return url.toString();
}

export type TokenSet = { accessToken: string; refreshToken: string | null; expiresAt: Date; scope: string };

async function postToken(params: Record<string, string>): Promise<TokenSet> {
  const res = await fetch(GOOGLE_HEALTH.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_HEALTH_CLIENT_ID!, client_secret: process.env.GOOGLE_HEALTH_CLIENT_SECRET!, ...params }),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("google health token error", res.status, text.slice(0, 300));
    throw new ProviderError(res.status === 400 ? "reconnect" : "token_failed", res.status === 400 ? 401 : 502);
  }
  const j = JSON.parse(text) as { access_token: string; refresh_token?: string; expires_in: number; scope?: string };
  return { accessToken: j.access_token, refreshToken: j.refresh_token ?? null, expiresAt: new Date(Date.now() + (j.expires_in - 60) * 1000), scope: j.scope ?? "" };
}

export const exchangeCode = (code: string) => postToken({ grant_type: "authorization_code", code, redirect_uri: redirectUri() });
export const refreshAccess = (refreshToken: string) => postToken({ grant_type: "refresh_token", refresh_token: refreshToken });

async function call(token: string, path: string, init?: { method?: string; body?: unknown; query?: Record<string, string> }) {
  const url = new URL(`${GOOGLE_HEALTH.apiBase}${path}`);
  for (const [k, v] of Object.entries(init?.query ?? {})) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  if (res.status === 401) throw new ProviderError("reconnect", 401);
  if (!res.ok) {
    console.error("google health api error", res.status, path, text.slice(0, 300));
    throw new ProviderError(res.status === 429 ? "busy" : res.status === 403 ? "no_access" : "sync_failed", res.status === 429 ? 429 : 502);
  }
  return text ? JSON.parse(text) : {};
}

/** All pages of a list call (the last page can be `{}`). */
async function listAll(token: string, dataType: "sleep" | "exercise" | "daily-resting-heart-rate", from: string, toEx: string) {
  const points: unknown[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 20; page++) {
    const body = await call(token, `/users/me/dataTypes/${dataType}/dataPoints`, {
      query: { filter: listFilter(dataType, from, toEx), pageSize: "25", ...(pageToken ? { pageToken } : {}) },
    });
    points.push(...(body.dataPoints ?? []));
    pageToken = body.nextPageToken || undefined;
    if (!pageToken) break;
  }
  return { dataPoints: points };
}

/** Today's heart rate in 1-hour windows from local midnight, placed by local hour. Best effort. */
async function hourlyHeartToday(token: string) {
  const [h, m] = clockAt().split(":").map(Number);
  const midnight = new Date(Date.now() - (h * 60 + m) * 60000);
  midnight.setUTCSeconds(0, 0);
  const body = { range: { startTime: midnight.toISOString(), endTime: new Date().toISOString() }, windowSize: "3600s" };
  const hourOf = (instant: string) => {
    const ms = Date.parse(instant);
    return Number.isNaN(ms) ? null : Number(clockAt(new Date(ms)).slice(0, 2));
  };
  return call(token, "/users/me/dataTypes/heart-rate/dataPoints:rollUp", { method: "POST", body }).then((b) => parseHourlyHeart(b, hourOf));
}

/** The last `days` days (≤14: the roll-up limit for active minutes and heart rate). */
export async function fetchRecent(token: string, days = 14): Promise<HealthImport> {
  const today = todayISO();
  const toEx = addDaysISO(today, 1);
  const from = addDaysISO(toEx, -days);
  const body = dailyRollUpBody(from, toEx);
  const optional = <T>(p: Promise<T>, empty: T) => p.catch(() => empty);
  const [steps, active, sleep, exercise, rhr, heart, hourly] = await Promise.all([
    call(token, "/users/me/dataTypes/steps/dataPoints:dailyRollUp", { method: "POST", body }).then((b) => parseDailyRollUp(b, "steps")),
    optional(call(token, "/users/me/dataTypes/active-minutes/dataPoints:dailyRollUp", { method: "POST", body }).then((b) => parseDailyRollUp(b, "activeMinutes")), new Map<string, number>()),
    listAll(token, "sleep", from, toEx).then(parseSleepNights),
    listAll(token, "exercise", from, toEx).then(parseExercise),
    optional(listAll(token, "daily-resting-heart-rate", from, toEx).then(parseRestingHr), new Map<string, number>()),
    optional(call(token, "/users/me/dataTypes/heart-rate/dataPoints:dailyRollUp", { method: "POST", body }).then(parseHeartRollup), new Map<string, { avg: number | null; max: number | null }>()),
    optional(hourlyHeartToday(token), null),
  ]);
  const dates = new Set([...steps.keys(), ...active.keys(), ...sleep.keys(), ...rhr.keys(), ...heart.keys(), ...(hourly ? [today] : [])]);
  const out: HealthDay[] = [...dates].sort().map((date) => {
    const night = sleep.get(date);
    return {
      ...emptyDay(date),
      steps: steps.has(date) ? Math.round(steps.get(date)!) : null,
      activeMinutes: active.has(date) ? Math.round(active.get(date)!) : null,
      restingHr: rhr.get(date) ?? null,
      sleepMinutes: night?.minutes ?? null,
      inBedMinutes: night?.inBed ?? null,
      deepMinutes: night?.deep ?? null,
      remMinutes: night?.rem ?? null,
      sleepStart: night?.start ?? null,
      wakeTime: night?.wake ?? null,
      avgHr: heart.get(date)?.avg ?? null,
      maxHr: heart.get(date)?.max ?? null,
      hrHourly: date === today ? hourly : null,
    };
  });
  return { days: out, workouts: exercise };
}
