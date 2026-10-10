/**
 * One-command setup: apply migrations and import the recipe catalogue.
 *   npm run db:seed            migrations + catalogue
 *   npm run db:seed -- --demo  also create a demo account with 3 weeks of history
 */
import { randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { hashPassword } from "@/server/auth/password";
import { computeTargets } from "@/lib/nutrition/targets";
import { generatePlan } from "@/lib/planner/engine";
import { CALORIE_FLOOR } from "@/lib/nutrition/targets";
import { importCatalogue } from "./import-recipes";

const DEMO_EMAIL = "demo@example.com";

async function seedDemo() {
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, DEMO_EMAIL));
  if (existing) {
    console.log(`demo account already exists (${DEMO_EMAIL})`);
    return;
  }
  const password = process.env.DEMO_PASSWORD || randomBytes(9).toString("base64url");
  const id = randomUUID();
  await db.insert(schema.users).values({ id, email: DEMO_EMAIL, passwordHash: await hashPassword(password), displayName: "Demo", isGuest: false });
  const profile = {
    userId: id,
    ageYears: 36,
    sexForEquation: "female" as const,
    pregnancyStatus: "none" as const,
    heightCm: 158,
    weightKg: 74,
    targetWeightKg: 64,
    activityLevel: "light" as const,
    dietPreference: "vegetarian" as const,
    cuisines: ["tamil_nadu", "kerala"],
    allergies: [],
    avoidFoods: [],
    conditions: ["hypertension"],
    cookingTimeMin: 45,
    equipment: ["pressure_cooker", "mixer_grinder", "idli_stand"],
    householdSize: 3,
    budgetInr: 250,
    budgetPeriod: "day" as const,
    mealSlots: ["breakfast", "lunch", "evening", "dinner"],
    planStyle: "balanced" as const,
    pace: "gentle" as const,
    language: "en",
    onboardingCompletedAt: new Date(),
  };
  await db.insert(schema.profiles).values(profile);

  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  for (let i = 21; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    if (i % 3 === 0 || i === 0)
      await db.insert(schema.weightLogs).values({ id: randomUUID(), userId: id, date: iso(d), weightKg: Math.round((76.2 - (21 - i) * 0.1 + Math.sin(i) * 0.3) * 10) / 10 });
    await db.insert(schema.waterLogs).values({ userId: id, date: iso(d), ml: 1500 + ((i * 250) % 1250) });
  }

  const targets = computeTargets({ ageYears: 36, sex: "female", heightCm: 158, weightKg: 74, targetWeightKg: 64, activity: "light", planStyle: "balanced", pace: "gentle", conditions: ["hypertension"], pregnancy: "none" });
  const recipes = (await db.select().from(schema.recipes).where(eq(schema.recipes.validationStatus, "validated"))).map((r) => ({ ...r, totalMin: r.prepMin + r.cookMin }));
  const { days } = generatePlan(
    recipes,
    { diet: "vegetarian", allergies: [], avoidFoods: [], cuisines: profile.cuisines, cookingTimeMin: 45, equipment: profile.equipment, budgetPerDayInr: 250, slots: profile.mealSlots, style: "balanced", targets: { kcal: targets.kcal, proteinG: targets.proteinG, fibreG: targets.fibreG, netCarbLimitG: null, kcalFloor: CALORIE_FLOOR.female } },
    7,
    2026,
  );
  const planId = randomUUID();
  await db.insert(schema.mealPlans).values({
    id: planId,
    userId: id,
    name: "7-day balanced plan",
    days: 7,
    startDate: iso(today),
    planStyle: "balanced",
    targets: { kcal: targets.kcal, kcalMin: targets.kcalMin, kcalMax: targets.kcalMax, proteinG: targets.proteinG, carbsG: targets.carbsG, netCarbLimitG: null, fatG: targets.fatG, fibreG: targets.fibreG },
    status: "active",
    isFavourite: true,
    seed: 2026,
  });
  for (const d of days)
    for (const m of d.meals)
      for (const [position, c] of m.components.entries())
        await db.insert(schema.mealPlanItems).values({ id: randomUUID(), planId, dayIndex: d.dayIndex, slot: m.slot, position, recipeId: c.recipeId, portion: c.portion, swaps: [] });
  console.log(`✓ demo account: ${DEMO_EMAIL} / ${password}`);
}

async function main() {
  await importCatalogue({ quiet: process.argv.includes("--quiet") });
  if (process.argv.includes("--demo")) await seedDemo();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
