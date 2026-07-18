import { subDays } from "date-fns";
import type { CalculationResult, DailyLogEntry, UserProfile } from "@/types";
import { dateKey } from "@/lib/utils";

export function collectRecentLogs(logs: Record<string, DailyLogEntry>, days: number): DailyLogEntry[] {
  return Array.from({ length: days }).map((_, i) => {
    const key = dateKey(subDays(new Date(), days - 1 - i));
    return logs[key] ?? null;
  }).filter((l): l is DailyLogEntry => l !== null);
}

export interface NutritionReport {
  daysLogged: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  calorieAdherencePct: number;
  proteinAdherencePct: number;
  topFoods: { name: string; count: number }[];
}

export function buildNutritionReport(logs: DailyLogEntry[], calc: CalculationResult): NutritionReport {
  const loggedDays = logs.filter((l) => l.caloriesConsumed > 0);
  const daysLogged = loggedDays.length;

  const sum = (fn: (l: DailyLogEntry) => number) => loggedDays.reduce((s, l) => s + fn(l), 0);
  const avgCalories = daysLogged ? Math.round(sum((l) => l.caloriesConsumed) / daysLogged) : 0;
  const avgProtein = daysLogged ? Math.round(sum((l) => l.proteinG) / daysLogged) : 0;
  const avgCarbs = daysLogged ? Math.round(sum((l) => l.carbsG) / daysLogged) : 0;
  const avgFat = daysLogged ? Math.round(sum((l) => l.fatG) / daysLogged) : 0;

  const foodCounts = new Map<string, number>();
  for (const log of logs) {
    for (const food of log.loggedFoods) {
      foodCounts.set(food.foodName, (foodCounts.get(food.foodName) ?? 0) + 1);
    }
  }
  const topFoods = Array.from(foodCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    daysLogged,
    avgCalories,
    avgProtein,
    avgCarbs,
    avgFat,
    calorieAdherencePct: calc.dailyCalories > 0 ? Math.round((avgCalories / calc.dailyCalories) * 100) : 0,
    proteinAdherencePct: calc.proteinG > 0 ? Math.round((avgProtein / calc.proteinG) * 100) : 0,
    topFoods,
  };
}

export interface WorkoutReport {
  daysCompleted: number;
  totalDays: number;
  totalCaloriesBurned: number;
  completionPct: number;
}

export function buildWorkoutReport(logs: DailyLogEntry[]): WorkoutReport {
  const daysCompleted = logs.filter((l) => l.workoutCompleted).length;
  const totalCaloriesBurned = logs.reduce((s, l) => s + l.workoutCaloriesBurned, 0);
  return {
    daysCompleted,
    totalDays: logs.length,
    totalCaloriesBurned,
    completionPct: logs.length > 0 ? Math.round((daysCompleted / logs.length) * 100) : 0,
  };
}

export interface WeightLossReport {
  startWeight: number;
  currentWeight: number;
  changeKg: number;
  targetWeight: number;
  remainingKg: number;
  progressPct: number;
}

export function buildWeightLossReport(profile: UserProfile, logs: DailyLogEntry[]): WeightLossReport {
  const weighIns = logs.filter((l): l is DailyLogEntry & { weightKg: number } => !!l.weightKg);
  const startWeight = profile.weightKg;
  const currentWeight = weighIns.length > 0 ? weighIns[weighIns.length - 1].weightKg : profile.weightKg;
  const totalToLose = Math.abs(profile.targetWeightKg - startWeight);
  const lostSoFar = Math.abs(startWeight - currentWeight);

  return {
    startWeight,
    currentWeight,
    changeKg: Number((currentWeight - startWeight).toFixed(1)),
    targetWeight: profile.targetWeightKg,
    remainingKg: Number(Math.abs(profile.targetWeightKg - currentWeight).toFixed(1)),
    progressPct: totalToLose > 0 ? Math.round(Math.min(100, (lostSoFar / totalToLose) * 100)) : 0,
  };
}
