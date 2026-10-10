import "server-only";
import { and, eq, gte, lte } from "drizzle-orm";
import type { HealthDay, HealthImport, HealthSource } from "@/lib/health/types";
import { ProviderError } from "@/server/config";
import { decryptSecret, encryptSecret } from "@/server/crypto";
import { db, schema } from "@/server/db/client";
import { exchangeCode, fetchRecent, refreshAccess } from "@/server/providers/googleHealth";
import { addCardio } from "./cardio";

/** When several sources report the same day, the first non-empty value in this order wins. */
const PRIORITY: HealthSource[] = ["google_health", "apple_health", "fitbit_export", "manual"];

export async function healthDaysBetween(userId: string, from: string, to: string): Promise<HealthDay[]> {
  const rows = await db
    .select()
    .from(schema.healthDays)
    .where(and(eq(schema.healthDays.userId, userId), gte(schema.healthDays.date, from), lte(schema.healthDays.date, to)));
  const byDate = new Map<string, typeof rows>();
  for (const r of rows) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);
  return [...byDate]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => {
      const ordered = [...list].sort((a, b) => PRIORITY.indexOf(a.source) - PRIORITY.indexOf(b.source));
      const pick = (k: "steps" | "activeMinutes" | "restingHr" | "sleepMinutes") => ordered.find((r) => r[k] != null)?.[k] ?? null;
      return { date, steps: pick("steps"), activeMinutes: pick("activeMinutes"), restingHr: pick("restingHr"), sleepMinutes: pick("sleepMinutes") };
    });
}

export async function saveHealthImport(userId: string, source: Exclude<HealthSource, "manual">, data: HealthImport, weightKg: number) {
  const now = new Date();
  for (const d of data.days) {
    const values = { steps: d.steps, activeMinutes: d.activeMinutes, restingHr: d.restingHr, sleepMinutes: d.sleepMinutes, updatedAt: now };
    await db
      .insert(schema.healthDays)
      .values({ userId, date: d.date, source, ...values })
      .onConflictDoUpdate({ target: [schema.healthDays.userId, schema.healthDays.date, schema.healthDays.source], set: values });
  }
  for (const w of data.workouts) await addCardio(userId, { ...w, source, externalId: w.externalId }, weightKg);
  return { days: data.days.length, workouts: data.workouts.length };
}

// ─── Google Health connection ───────────────────────────────────────────────

export async function getGoogleConnection(userId: string) {
  const [row] = await db
    .select()
    .from(schema.healthConnections)
    .where(and(eq(schema.healthConnections.userId, userId), eq(schema.healthConnections.provider, "google_health")));
  return row ?? null;
}

export async function connectGoogle(userId: string, code: string) {
  const t = await exchangeCode(code);
  const values = {
    accessToken: encryptSecret(t.accessToken),
    refreshToken: t.refreshToken ? encryptSecret(t.refreshToken) : null,
    expiresAt: t.expiresAt,
    scope: t.scope,
    connectedAt: new Date(),
    lastError: null,
  };
  await db
    .insert(schema.healthConnections)
    .values({ userId, provider: "google_health", ...values })
    .onConflictDoUpdate({ target: [schema.healthConnections.userId, schema.healthConnections.provider], set: values });
}

export async function disconnectGoogle(userId: string) {
  const conn = await getGoogleConnection(userId);
  if (conn) {
    // Best effort: revoke at Google too, so the app's access really ends.
    try {
      const token = conn.refreshToken ? decryptSecret(conn.refreshToken) : decryptSecret(conn.accessToken);
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST", signal: AbortSignal.timeout(10_000) });
    } catch {}
  }
  await db.delete(schema.healthConnections).where(and(eq(schema.healthConnections.userId, userId), eq(schema.healthConnections.provider, "google_health")));
}

async function accessTokenFor(conn: NonNullable<Awaited<ReturnType<typeof getGoogleConnection>>>) {
  if (conn.expiresAt.getTime() > Date.now()) return decryptSecret(conn.accessToken);
  if (!conn.refreshToken) throw new ProviderError("reconnect", 401);
  const t = await refreshAccess(decryptSecret(conn.refreshToken));
  await db
    .update(schema.healthConnections)
    .set({
      accessToken: encryptSecret(t.accessToken),
      expiresAt: t.expiresAt,
      ...(t.refreshToken ? { refreshToken: encryptSecret(t.refreshToken) } : {}),
    })
    .where(and(eq(schema.healthConnections.userId, conn.userId), eq(schema.healthConnections.provider, "google_health")));
  return t.accessToken;
}

export async function syncGoogle(userId: string, weightKg: number) {
  const conn = await getGoogleConnection(userId);
  if (!conn) throw new ProviderError("not_connected", 404);
  try {
    const data = await fetchRecent(await accessTokenFor(conn));
    const res = await saveHealthImport(userId, "google_health", data, weightKg);
    await db
      .update(schema.healthConnections)
      .set({ lastSyncAt: new Date(), lastError: null })
      .where(and(eq(schema.healthConnections.userId, userId), eq(schema.healthConnections.provider, "google_health")));
    return res;
  } catch (e) {
    const code = e instanceof ProviderError ? e.message : "sync_failed";
    await db
      .update(schema.healthConnections)
      .set({ lastError: code })
      .where(and(eq(schema.healthConnections.userId, userId), eq(schema.healthConnections.provider, "google_health")));
    throw e;
  }
}
