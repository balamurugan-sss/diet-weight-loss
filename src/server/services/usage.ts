import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import type { CurrentUser } from "@/server/auth/dal";
import { todayISO } from "@/server/time";

export type Feature = "mealPlan" | "dayRegen" | "swap" | "stepImage" | "heroImage" | "cloudTts" | "translate";

/** Daily limits. 0 = not included in the plan. Cached assets never count. */
export const PLAN_LIMITS: Record<"free" | "premium", Record<Feature, number>> = {
  free: { mealPlan: 3, dayRegen: 5, swap: 15, stepImage: 0, heroImage: 3, cloudTts: 0, translate: 0 },
  premium: { mealPlan: 20, dayRegen: 40, swap: 100, stepImage: 60, heroImage: 30, cloudTts: 20000, translate: 20 },
};

export const PLAN_DAYS: Record<"free" | "premium", number[]> = { free: [7], premium: [7, 14, 30] };

export const PREMIUM_PRICE_INR = Number(process.env.PREMIUM_PRICE_INR || 199);

const tierOf = (u: Pick<CurrentUser, "isPremium">) => (u.isPremium ? "premium" : "free");

export function limitFor(user: Pick<CurrentUser, "isPremium">, feature: Feature) {
  return PLAN_LIMITS[tierOf(user)][feature];
}

export async function usageToday(userId: string) {
  const rows = await db
    .select({ feature: schema.usageCounters.feature, count: schema.usageCounters.count })
    .from(schema.usageCounters)
    .where(and(eq(schema.usageCounters.userId, userId), eq(schema.usageCounters.day, todayISO())));
  return Object.fromEntries(rows.map((r) => [r.feature, r.count])) as Partial<Record<Feature, number>>;
}

export async function remaining(user: CurrentUser, feature: Feature) {
  const used = (await usageToday(user.id))[feature] ?? 0;
  return Math.max(0, limitFor(user, feature) - used);
}

/**
 * Atomically reserves `amount` units of a feature for today. Returns false
 * (and consumes nothing) if it would exceed the limit.
 */
export async function consume(user: CurrentUser, feature: Feature, amount = 1): Promise<boolean> {
  const limit = limitFor(user, feature);
  if (limit <= 0 || amount > limit) return false;
  const day = todayISO();
  const res = await db
    .insert(schema.usageCounters)
    .values({ userId: user.id, feature, day, count: amount })
    .onConflictDoUpdate({
      target: [schema.usageCounters.userId, schema.usageCounters.feature, schema.usageCounters.day],
      set: { count: sql`${schema.usageCounters.count} + ${amount}` },
      setWhere: sql`${schema.usageCounters.count} + ${amount} <= ${limit}`,
    })
    .returning({ count: schema.usageCounters.count });
  return res.length > 0;
}

/** Gives units back when the paid operation failed after reserving. */
export async function refund(user: CurrentUser, feature: Feature, amount = 1) {
  await db
    .update(schema.usageCounters)
    .set({ count: sql`max(0, ${schema.usageCounters.count} - ${amount})` })
    .where(and(eq(schema.usageCounters.userId, user.id), eq(schema.usageCounters.feature, feature), eq(schema.usageCounters.day, todayISO())));
}
