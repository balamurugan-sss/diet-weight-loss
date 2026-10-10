export type Sex = "female" | "male";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very";
export type PlanStyle = "balanced" | "low_carb" | "keto" | "high_protein";
export type Pace = "gentle" | "steady";
export type DietPreference = "vegetarian" | "eggitarian" | "non_vegetarian" | "vegan";
export type PregnancyStatus = "none" | "pregnant" | "breastfeeding" | "prefer_not";

export const ACTIVITY_LEVELS: ActivityLevel[] = ["sedentary", "light", "moderate", "very"];
export const PLAN_STYLES: PlanStyle[] = ["balanced", "low_carb", "keto", "high_protein"];

export const CONDITION_CODES = [
  "diabetes_meds",
  "diabetes_diet",
  "kidney",
  "liver",
  "gallbladder",
  "pancreatitis",
  "heart_disease",
  "hypertension",
  "thyroid",
  "pcos",
  "gout",
  "eating_disorder",
] as const;
export type ConditionCode = (typeof CONDITION_CODES)[number];

export type HealthInput = {
  ageYears: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number | null;
  activity: ActivityLevel;
  planStyle: PlanStyle;
  pace: Pace;
  netCarbLimitG?: number | null;
  waterGoalMl?: number | null;
  conditions: string[];
  pregnancy: PregnancyStatus;
};
