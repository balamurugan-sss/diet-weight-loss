"use server";

import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOnboarded } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { todayISO } from "@/server/time";

export async function addWaterAction(deltaMl: number) {
  const { user } = await requireOnboarded();
  const d = Math.max(-1000, Math.min(1000, Math.round(deltaMl)));
  const date = todayISO();
  await db
    .insert(schema.waterLogs)
    .values({ userId: user.id, date, ml: Math.max(0, d) })
    .onConflictDoUpdate({
      target: [schema.waterLogs.userId, schema.waterLogs.date],
      set: { ml: sql`max(0, min(10000, ${schema.waterLogs.ml} + ${d}))` },
    });
  revalidatePath("/home");
  revalidatePath("/progress");
}

export async function logWeightAction(weightKg: number, date?: string) {
  const { user } = await requireOnboarded();
  if (!Number.isFinite(weightKg) || weightKg < 25 || weightKg > 300) return { ok: false as const };
  const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= todayISO() ? date : todayISO();
  const w = Math.round(weightKg * 10) / 10;
  const [existing] = await db.select({ id: schema.weightLogs.id }).from(schema.weightLogs).where(and(eq(schema.weightLogs.userId, user.id), eq(schema.weightLogs.date, day)));
  if (existing) await db.update(schema.weightLogs).set({ weightKg: w }).where(eq(schema.weightLogs.id, existing.id));
  else await db.insert(schema.weightLogs).values({ id: randomUUID(), userId: user.id, date: day, weightKg: w });
  // Keep calorie targets in step with the latest weigh-in.
  if (day === todayISO()) await db.update(schema.profiles).set({ weightKg: w, updatedAt: new Date() }).where(eq(schema.profiles.userId, user.id));
  revalidatePath("/", "layout");
  return { ok: true as const };
}
