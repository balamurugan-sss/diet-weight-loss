import type { ActivityLevel, Sex } from "./types";

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

export function ageFromDob(dob: string, today = new Date()): number {
  const d = new Date(dob + "T00:00:00Z");
  let age = today.getUTCFullYear() - d.getUTCFullYear();
  const m = today.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

/** Mifflin–St Jeor (1990): validated for adults, the ADA-recommended default. */
export function bmrMifflinStJeor(sex: Sex, weightKg: number, heightCm: number, ageYears: number) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function tdee(bmr: number, activity: ActivityLevel) {
  return Math.round(bmr * ACTIVITY_FACTORS[activity]);
}

export const KCAL_PER_KG = 7700;
