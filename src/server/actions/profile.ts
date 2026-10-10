"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ProfileInput } from "@/lib/profile/schema";
import { requireUser } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { LANG_COOKIE } from "@/server/i18n";
import { THEME_COOKIE } from "@/server/theme";
import { todayISO } from "@/server/time";

export async function saveProfile(raw: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user, profile } = await requireUser();
  const parsed = ProfileInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "common.error" };
  const p = parsed.data;
  const values = {
    dateOfBirth: p.dateOfBirth ?? null,
    ageYears: p.dateOfBirth ? null : (p.ageYears ?? null),
    sexForEquation: p.sexForEquation,
    pregnancyStatus: p.sexForEquation === "female" ? p.pregnancyStatus : "none",
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    targetWeightKg: p.targetWeightKg ?? null,
    activityLevel: p.activityLevel,
    conditions: p.conditions,
    medicalNotes: p.medicalNotes ?? null,
    dietPreference: p.dietPreference,
    avoidFoods: p.avoidFoods,
    cuisines: p.cuisines,
    regionalNotes: p.regionalNotes ?? null,
    allergies: p.allergies,
    cookingTimeMin: p.cookingTimeMin ?? null,
    equipment: p.equipment,
    householdSize: p.householdSize,
    budgetInr: p.budgetInr ?? null,
    budgetPeriod: p.budgetInr ? (p.budgetPeriod ?? "day") : null,
    mealSlots: p.mealSlots,
    planStyle: p.planStyle,
    pace: p.pace,
    netCarbLimitG: p.netCarbLimitG ?? null,
    language: p.language,
    onboardingCompletedAt: profile?.onboardingCompletedAt ?? new Date(),
    updatedAt: new Date(),
  } as const;
  await db
    .insert(schema.profiles)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: schema.profiles.userId, set: values });
  if (p.displayName !== undefined) await db.update(schema.users).set({ displayName: p.displayName || null }).where(eq(schema.users.id, user.id));

  // The profile weight doubles as today's weigh-in so progress has a start point.
  const today = todayISO();
  const [existingLog] = await db
    .select({ id: schema.weightLogs.id })
    .from(schema.weightLogs)
    .where(and(eq(schema.weightLogs.userId, user.id), eq(schema.weightLogs.date, today)));
  if (!existingLog) await db.insert(schema.weightLogs).values({ id: randomUUID(), userId: user.id, date: today, weightKg: p.weightKg });
  else await db.update(schema.weightLogs).set({ weightKg: p.weightKg }).where(eq(schema.weightLogs.id, existingLog.id));

  (await cookies()).set(LANG_COOKIE, p.language, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
  return { ok: true };
}

const Prefs = z.object({
  language: z.enum(["en", "en-IN", "ta", "ml"]).optional(),
  transliteration: z.boolean().optional(),
  units: z.enum(["metric", "kitchen"]).optional(),
  narrationRate: z.number().min(0.5).max(2).optional(),
  keepAwake: z.boolean().optional(),
  voiceCommands: z.boolean().optional(),
  waterGoalMl: z.number().int().min(1000).max(6000).nullable().optional(),
  voiceId: z.string().max(80).nullable().optional(),
});

export async function savePreferences(raw: unknown) {
  const { user } = await requireUser();
  const parsed = Prefs.safeParse(raw);
  if (!parsed.success) return { ok: false as const };
  await db.update(schema.profiles).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.profiles.userId, user.id));
  if (parsed.data.language)
    (await cookies()).set(LANG_COOKIE, parsed.data.language, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function setThemeAction(theme: "dark" | "light") {
  (await cookies()).set(THEME_COOKIE, theme === "light" ? "light" : "dark", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
