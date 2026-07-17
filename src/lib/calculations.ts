import { addWeeks, format } from "date-fns";
import type {
  ActivityLevel,
  CalculationResult,
  Goal,
  GoalSpeed,
  UserProfile,
} from "@/types";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

// kg lost per week by goal speed (safe ranges: ~0.25kg to ~1kg/week)
const GOAL_SPEED_RATE: Record<GoalSpeed, number> = {
  slow: 0.25,
  moderate: 0.5,
  aggressive: 0.9,
};

const CALORIES_PER_KG_FAT = 7700;

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

// Mifflin-St Jeor Equation
export function calculateBMR(profile: Pick<UserProfile, "gender" | "weightKg" | "heightCm" | "age">): number {
  const { gender, weightKg, heightCm, age } = profile;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

// Devine formula-based ideal body weight, gender aware
export function calculateIdealWeight(heightCm: number, gender: "male" | "female"): number {
  const heightIn = heightCm / 2.54;
  const inchesOver5Feet = Math.max(0, heightIn - 60);
  const base = gender === "male" ? 50 + 2.3 * inchesOver5Feet : 45.5 + 2.3 * inchesOver5Feet;
  return Number(base.toFixed(1));
}

function goalCalorieAdjustment(goal: Goal, speed: GoalSpeed): number {
  const weeklyRate = GOAL_SPEED_RATE[speed];
  const dailyDeficitForFatLoss = Math.round((weeklyRate * CALORIES_PER_KG_FAT) / 7);

  switch (goal) {
    case "weight-loss":
    case "fat-loss":
      return -dailyDeficitForFatLoss;
    case "lean-muscle":
      return Math.round(dailyDeficitForFatLoss * 0.4); // modest surplus
    case "maintain":
    default:
      return 0;
  }
}

export function calculateDailyCalories(tdee: number, goal: Goal, speed: GoalSpeed): number {
  const adjustment = goalCalorieAdjustment(goal, speed);
  const target = tdee + adjustment;
  // safety floor
  return Math.max(1200, Math.round(target));
}

export function calculateMacros(dailyCalories: number, weightKg: number, goal: Goal) {
  const proteinPerKg = goal === "lean-muscle" ? 2.0 : goal === "maintain" ? 1.6 : 1.8;
  const proteinG = Math.round(weightKg * proteinPerKg);
  const proteinCals = proteinG * 4;

  const fatPct = 0.28;
  const fatCals = dailyCalories * fatPct;
  const fatG = Math.round(fatCals / 9);

  const remainingCals = Math.max(0, dailyCalories - proteinCals - fatCals);
  const carbsG = Math.round(remainingCals / 4);

  const fiberG = Math.round((dailyCalories / 1000) * 14); // 14g per 1000 kcal

  return { proteinG, carbsG, fatG, fiberG };
}

export function calculateWaterRequirement(weightKg: number, activityLevel: ActivityLevel): number {
  const base = weightKg * 0.033; // liters
  const activityBonus = activityLevel === "active" || activityLevel === "athlete" ? 0.5 : activityLevel === "moderate" ? 0.3 : 0;
  return Number((base + activityBonus).toFixed(1));
}

export function calculateRecommendedSteps(activityLevel: ActivityLevel, goal: Goal): number {
  const base: Record<ActivityLevel, number> = {
    sedentary: 7000,
    light: 8000,
    moderate: 9000,
    active: 10000,
    athlete: 12000,
  };
  const bump = goal === "weight-loss" || goal === "fat-loss" ? 1000 : 0;
  return base[activityLevel] + bump;
}

export function calculateSleepRequirement(age: number): number {
  if (age < 18) return 9;
  if (age <= 64) return 8;
  return 7.5;
}

export function calculateWeeklyFatLossPrediction(goal: Goal, speed: GoalSpeed): number {
  if (goal === "maintain") return 0;
  if (goal === "lean-muscle") return -0.1; // slight gain
  return GOAL_SPEED_RATE[speed];
}

export function calculateTargetDate(
  currentWeightKg: number,
  targetWeightKg: number,
  weeklyRateKg: number
): { targetDate: string; weeksToGoal: number } {
  const diff = Math.abs(currentWeightKg - targetWeightKg);
  const weeks = weeklyRateKg > 0 ? Math.max(1, Math.ceil(diff / weeklyRateKg)) : 0;
  const date = addWeeks(new Date(), weeks);
  return { targetDate: format(date, "MMM d, yyyy"), weeksToGoal: weeks };
}

export function runFullCalculation(profile: UserProfile): CalculationResult {
  const bmi = calculateBMI(profile.weightKg, profile.heightCm);
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const idealWeightKg = calculateIdealWeight(profile.heightCm, profile.gender);
  const dailyCalories = calculateDailyCalories(tdee, profile.goal, profile.goalSpeed);
  const { proteinG, carbsG, fatG, fiberG } = calculateMacros(dailyCalories, profile.weightKg, profile.goal);
  const waterLiters = calculateWaterRequirement(profile.weightKg, profile.activityLevel);
  const recommendedSteps = calculateRecommendedSteps(profile.activityLevel, profile.goal);
  const sleepHours = calculateSleepRequirement(profile.age);
  const weeklyFatLossKg = calculateWeeklyFatLossPrediction(profile.goal, profile.goalSpeed);
  const { targetDate, weeksToGoal } = calculateTargetDate(
    profile.weightKg,
    profile.targetWeightKg,
    Math.abs(weeklyFatLossKg)
  );

  return {
    bmi,
    bmiCategory: bmiCategory(bmi),
    bmr,
    tdee,
    idealWeightKg,
    dailyCalories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    waterLiters,
    recommendedSteps,
    sleepHours,
    weeklyFatLossKg,
    targetDate,
    weeksToGoal,
  };
}
