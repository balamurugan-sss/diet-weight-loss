import "server-only";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { addDaysISO, todayISO } from "@/server/time";

export async function intakeForDate(userId: string, date: string) {
  const logs = await db.select().from(schema.mealLogs).where(and(eq(schema.mealLogs.userId, userId), eq(schema.mealLogs.date, date)));
  const sum = (k: "kcal" | "proteinG" | "carbsG" | "netCarbsG" | "fatG" | "fibreG") => logs.reduce((s, l) => s + l[k], 0);
  return {
    logs,
    kcal: Math.round(sum("kcal")),
    proteinG: Math.round(sum("proteinG")),
    carbsG: Math.round(sum("carbsG")),
    netCarbsG: Math.round(sum("netCarbsG")),
    fatG: Math.round(sum("fatG")),
    fibreG: Math.round(sum("fibreG")),
  };
}

export async function waterFor(userId: string, date = todayISO()) {
  const [row] = await db.select().from(schema.waterLogs).where(and(eq(schema.waterLogs.userId, userId), eq(schema.waterLogs.date, date)));
  return row?.ml ?? 0;
}

export async function weightHistory(userId: string, days = 120) {
  return db
    .select({ date: schema.weightLogs.date, weightKg: schema.weightLogs.weightKg })
    .from(schema.weightLogs)
    .where(and(eq(schema.weightLogs.userId, userId), gte(schema.weightLogs.date, addDaysISO(todayISO(), -days))))
    .orderBy(asc(schema.weightLogs.date));
}

export async function firstWeight(userId: string) {
  const [row] = await db.select().from(schema.weightLogs).where(eq(schema.weightLogs.userId, userId)).orderBy(asc(schema.weightLogs.date)).limit(1);
  return row ?? null;
}

export async function latestWeight(userId: string) {
  const [row] = await db.select().from(schema.weightLogs).where(eq(schema.weightLogs.userId, userId)).orderBy(desc(schema.weightLogs.date)).limit(1);
  return row ?? null;
}

/** Per-day intake and water for the last `days` days (oldest first). */
export async function dailySeries(userId: string, days = 7) {
  const end = todayISO();
  const start = addDaysISO(end, -(days - 1));
  const [logs, water] = await Promise.all([
    db.select().from(schema.mealLogs).where(and(eq(schema.mealLogs.userId, userId), gte(schema.mealLogs.date, start), lte(schema.mealLogs.date, end))),
    db.select().from(schema.waterLogs).where(and(eq(schema.waterLogs.userId, userId), gte(schema.waterLogs.date, start), lte(schema.waterLogs.date, end))),
  ]);
  return Array.from({ length: days }, (_, i) => {
    const date = addDaysISO(start, i);
    const dl = logs.filter((l) => l.date === date);
    return {
      date,
      kcal: Math.round(dl.reduce((s, l) => s + l.kcal, 0)),
      proteinG: Math.round(dl.reduce((s, l) => s + l.proteinG, 0)),
      netCarbsG: Math.round(dl.reduce((s, l) => s + l.netCarbsG, 0)),
      meals: dl.length,
      waterMl: water.find((w) => w.date === date)?.ml ?? 0,
    };
  });
}
