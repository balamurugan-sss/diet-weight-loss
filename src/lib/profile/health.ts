import { ageFromDob } from "@/lib/nutrition/energy";
import type { HealthInput } from "@/lib/nutrition/types";

type ProfileLike = {
  dateOfBirth: string | null;
  ageYears: number | null;
  sexForEquation: "female" | "male" | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  activityLevel: "sedentary" | "light" | "moderate" | "very" | null;
  planStyle: "balanced" | "low_carb" | "keto" | "high_protein" | null;
  pace: "gentle" | "steady" | null;
  netCarbLimitG: number | null;
  waterGoalMl: number | null;
  conditions: string[];
  pregnancyStatus: "none" | "pregnant" | "breastfeeding" | "prefer_not" | null;
};

export function profileAge(p: Pick<ProfileLike, "dateOfBirth" | "ageYears">): number | null {
  if (p.dateOfBirth) return ageFromDob(p.dateOfBirth);
  return p.ageYears ?? null;
}

export function toHealthInput(p: ProfileLike, overrideWeightKg?: number | null): HealthInput | null {
  const ageYears = profileAge(p);
  if (!ageYears || !p.sexForEquation || !p.heightCm || !p.weightKg || !p.activityLevel) return null;
  return {
    ageYears,
    sex: p.sexForEquation,
    heightCm: p.heightCm,
    weightKg: overrideWeightKg ?? p.weightKg,
    targetWeightKg: p.targetWeightKg,
    activity: p.activityLevel,
    planStyle: p.planStyle ?? "balanced",
    pace: p.pace ?? "gentle",
    netCarbLimitG: p.netCarbLimitG,
    waterGoalMl: p.waterGoalMl,
    conditions: p.conditions,
    pregnancy: p.pregnancyStatus ?? "none",
  };
}
