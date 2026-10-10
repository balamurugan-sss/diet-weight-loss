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
import { generateProgram } from "@/lib/workouts/generator";
import { estimateDay } from "@/lib/workouts/load";
import { getExercise } from "@/lib/workouts/exercises";
import { clockAt, todayISO } from "@/server/time";
import { importCatalogue } from "./import-recipes";

const DEMO_EMAIL = "demo@example.com";

async function seedDemo() {
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, DEMO_EMAIL));
  if (existing) {
    console.log(`demo account already exists (${DEMO_EMAIL})`);
    await seedDemoWorkouts(existing.id);
    await seedDemoHealth(existing.id);
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
  // A week of logged meals so progress charts have something to show.
  const byId = new Map(recipes.map((r) => [r.id, r]));
  for (let back = 1; back <= 6; back++) {
    const day = days[back % days.length];
    const date = iso(new Date(today.getTime() - back * 86400000));
    for (const m of day.meals.slice(0, back % 3 === 0 ? 3 : 4))
      for (const c of m.components) {
        const r = byId.get(c.recipeId)!;
        await db.insert(schema.mealLogs).values({
          id: randomUUID(), userId: id, date, slot: m.slot, recipeId: r.id, planItemId: null, title: r.title, portion: c.portion,
          kcal: r.kcal * c.portion, proteinG: r.proteinG * c.portion, carbsG: r.carbsG * c.portion, netCarbsG: r.netCarbsG * c.portion, fatG: r.fatG * c.portion, fibreG: r.fibreG * c.portion,
        });
      }
  }
  await seedDemoWorkouts(id);
  await seedDemoHealth(id);
  console.log(`✓ demo account: ${DEMO_EMAIL} / ${password}`);
}

/**
 * A gym full-body program started 17 days ago: workouts done in order with
 * weights creeping up, one missed day (the plan waits rather than skipping),
 * and one active-recovery walk. Safe to re-run.
 */
async function seedDemoWorkouts(userId: string) {
  const [has] = await db.select().from(schema.workoutProfiles).where(eq(schema.workoutProfiles.userId, userId));
  if (has) return;
  const wp = { location: "gym" as const, level: "beginner" as const, goal: "lose" as const, daysPerWeek: 3, equipment: [] };
  await db.insert(schema.workoutProfiles).values({ userId, ...wp, doctorAckAt: new Date() });
  // Hypertension in the demo profile → low-impact selection, as the app would do.
  const program = generateProgram({ ...wp, daysPerWeek: 3, sex: "female", weightKg: 74, lowImpact: true });
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  const start = new Date(today.getTime() - 17 * 86400000);
  const programId = randomUUID();
  await db.insert(schema.workoutPrograms).values({
    id: programId, userId, name: program.name, split: program.split, location: program.location, level: program.level, goal: program.goal,
    daysPerWeek: program.daysPerWeek, startDate: iso(start), days: program.days, status: "active",
  });
  let pos = 0;
  let sessionNo = 0;
  for (let offset = 0; offset < 17; offset++) {
    const date = iso(new Date(start.getTime() + offset * 86400000));
    const day = program.days[pos];
    if (day.kind === "rest" || (day.kind === "recovery" && offset !== 1)) {
      pos++;
      continue;
    }
    if (day.kind === "workout" && offset === 9) continue; // missed — the same workout waits for the next day
    const est = estimateDay(day, 74);
    const sessionId = randomUUID();
    const startedAt = new Date(Date.parse(date + "T12:30:00Z"));
    await db.insert(schema.workoutSessions).values({
      id: sessionId, userId, programId, dayIndex: pos, date, kind: day.kind === "recovery" ? "recovery" : "workout", status: "completed",
      startedAt, finishedAt: new Date(startedAt.getTime() + est.minutes * 60000), durationSec: est.minutes * 60, kcal: est.kcal, netKcal: est.netKcal,
      exercisesDone: day.main.length,
    });
    if (day.kind === "workout") {
      for (const m of day.main)
        for (let k = 0; k < m.sets; k++) {
          const ex = getExercise(m.exerciseId);
          const reps = m.reps ? Math.min(m.reps[1], m.reps[0] + ((sessionNo + k) % 3)) : null;
          const weightKg = m.loadKg != null ? m.loadKg + Math.floor(sessionNo / 2) * (ex.load?.implement === "dumbbell" ? 1 : 2.5) : null;
          await db.insert(schema.workoutSets).values({
            sessionId, slot: m.slot, setIndex: k, exerciseId: m.exerciseId, reps, seconds: m.seconds ?? null, weightKg, done: true, completedAt: startedAt,
          });
        }
      sessionNo++;
    }
    pos++;
  }
  console.log(`✓ demo workouts: ${sessionNo} sessions`);
}

/**
 * Two weeks of watch data as if imported from a Fitbit export: steps, resting
 * and hourly heart rate, and sleep with stages. Today's heart-rate line stops
 * at the current hour. Safe to re-run (skipped when health data exists).
 */
async function seedDemoHealth(userId: string) {
  const [has] = await db.select().from(schema.healthDays).where(eq(schema.healthDays.userId, userId)).limit(1);
  if (has) return;
  const today = todayISO();
  const hourNow = Number(clockAt().slice(0, 2));
  for (let back = 13; back >= 0; back--) {
    const d = new Date(today + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - back);
    const date = d.toISOString().slice(0, 10);
    const wobble = (n: number) => ((back * 37 + n * 11) % 9) - 4;
    const trained = back % 2 === 1;
    // Low while asleep, a morning rise, a training peak around 18:00 on workout days.
    const hrHourly = Array.from({ length: 24 }, (_, h) => {
      if (back === 0 && h > hourNow) return null;
      const base = h < 6 ? 58 : h < 8 ? 68 : h < 22 ? 76 : 64;
      return base + wobble(h) + (trained && (h === 18 || h === 19) ? 52 - (h - 18) * 20 : 0);
    });
    const vals = hrHourly.filter((v): v is number => v != null);
    const sleepMinutes = 400 + wobble(1) * 12;
    await db.insert(schema.healthDays).values({
      userId,
      date,
      source: "fitbit_export",
      steps: back === 0 ? 3200 + hourNow * 250 : 7600 + wobble(2) * 700,
      activeMinutes: trained ? 48 : 22,
      restingHr: 61 + (wobble(3) > 2 ? 1 : 0),
      sleepMinutes,
      inBedMinutes: sleepMinutes + 28,
      deepMinutes: 66 + wobble(4) * 3,
      remMinutes: 92 + wobble(5) * 4,
      sleepStart: `23:${String(5 + ((back * 7) % 40)).padStart(2, "0")}`,
      wakeTime: `06:${String(20 + ((back * 5) % 30)).padStart(2, "0")}`,
      avgHr: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      maxHr: Math.max(...vals) + 8,
      hrHourly,
      sleepScore: null,
      updatedAt: new Date(),
    });
  }
  console.log("✓ demo health data: 14 days");
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
