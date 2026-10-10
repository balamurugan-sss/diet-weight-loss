import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { cardioEnergy, type CardioActivity, type CardioIntensity } from "@/lib/workouts/cardio";
import { db, schema } from "@/server/db/client";

export type CardioLog = typeof schema.cardioLogs.$inferSelect;

export async function cardioBetween(userId: string, from: string, to: string) {
  return db
    .select()
    .from(schema.cardioLogs)
    .where(and(eq(schema.cardioLogs.userId, userId), gte(schema.cardioLogs.date, from), lte(schema.cardioLogs.date, to)))
    .orderBy(asc(schema.cardioLogs.date), asc(schema.cardioLogs.createdAt));
}

export async function addCardio(
  userId: string,
  v: { date: string; activity: CardioActivity; intensity: CardioIntensity; minutes: number; source?: CardioLog["source"]; externalId?: string | null },
  weightKg: number,
) {
  const energy = cardioEnergy(v.activity, v.intensity, v.minutes, weightKg);
  const row = {
    id: randomUUID(),
    userId,
    date: v.date,
    activity: v.activity,
    intensity: v.intensity,
    minutes: v.minutes,
    ...energy,
    source: v.source ?? "manual",
    externalId: v.externalId ?? null,
  };
  // Imports carry an external id; re-importing the same session updates it instead of duplicating.
  await db
    .insert(schema.cardioLogs)
    .values(row)
    .onConflictDoUpdate({
      target: [schema.cardioLogs.userId, schema.cardioLogs.source, schema.cardioLogs.externalId],
      set: { date: row.date, activity: row.activity, intensity: row.intensity, minutes: row.minutes, kcal: row.kcal, netKcal: row.netKcal },
    });
  return row;
}

export async function deleteCardio(userId: string, id: string) {
  await db.delete(schema.cardioLogs).where(and(eq(schema.cardioLogs.id, id), eq(schema.cardioLogs.userId, userId)));
}
