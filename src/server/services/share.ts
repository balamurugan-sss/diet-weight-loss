import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { addDays, weekStart } from "@/lib/workouts/progress";
import { db, schema } from "@/server/db/client";
import { todayISO } from "@/server/time";
import { dayView } from "./dayView";
import { currentDayIndex, getActivePlan } from "./plans";
import { getActiveProgram, programProgress } from "./workouts";

export async function activeShareLink(userId: string) {
  const [row] = await db
    .select()
    .from(schema.shareLinks)
    .where(and(eq(schema.shareLinks.userId, userId), isNull(schema.shareLinks.revokedAt)))
    .limit(1);
  return row ?? null;
}

export async function createShareLink(userId: string) {
  const existing = await activeShareLink(userId);
  if (existing) return existing;
  // 128 random bits: unguessable, and unrelated to the user's id.
  const token = randomBytes(16).toString("base64url");
  await db.insert(schema.shareLinks).values({ token, userId });
  return (await activeShareLink(userId))!;
}

export async function revokeShareLinks(userId: string) {
  await db
    .update(schema.shareLinks)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.shareLinks.userId, userId), isNull(schema.shareLinks.revokedAt)));
}

/**
 * Everything the public page shows. Deliberately limited to the plan itself:
 * no name, email, weight, age, health conditions or calorie targets.
 */
export async function sharedPlan(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const [link] = await db
    .select()
    .from(schema.shareLinks)
    .where(and(eq(schema.shareLinks.token, token), isNull(schema.shareLinks.revokedAt)));
  if (!link) return null;
  await db
    .update(schema.shareLinks)
    .set({ views: sql`${schema.shareLinks.views} + 1` })
    .where(eq(schema.shareLinks.token, token));

  const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, link.userId));
  const today = todayISO();
  const monday = weekStart(today);
  const [program, plan] = await Promise.all([getActiveProgram(link.userId), getActivePlan(link.userId)]);
  const progress = program ? await programProgress(program, [monday, addDays(monday, 6)], today) : null;
  const meals = plan && profile ? await dayView(plan, profile, currentDayIndex(plan)) : null;

  return {
    workouts:
      program && progress
        ? {
            split: program.split,
            name: program.name,
            level: program.level,
            goal: program.goal,
            daysPerWeek: program.daysPerWeek,
            totalDays: program.days.length,
            weeks: program.days[program.days.length - 1].week,
            week: program.days[Math.min(progress.position, program.days.length - 1)].week,
            progress,
            focusByIndex: program.days.map((d) => ({ kind: d.kind, focus: d.focus })),
          }
        : null,
    meals: meals && plan ? { style: plan.planStyle, days: plan.days, slots: meals.slots.map((s) => ({ slot: s.slot, titles: s.items.map((i) => i.title), lead: s.items[0] })) } : null,
  };
}
