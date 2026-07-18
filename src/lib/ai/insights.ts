import type { CalculationResult, DailyLogEntry, UserProfile } from "@/types";
import { clamp } from "@/lib/utils";

export function calculateDailyScore(log: DailyLogEntry, calc: CalculationResult): number {
  const calorieScore = log.caloriesConsumed === 0
    ? 0
    : 100 - clamp((Math.abs(log.caloriesConsumed - calc.dailyCalories) / calc.dailyCalories) * 200, 0, 100);

  const waterScore = clamp((log.waterLiters / calc.waterLiters) * 100, 0, 100);
  const stepsScore = clamp((log.steps / calc.recommendedSteps) * 100, 0, 100);
  const workoutScore = log.workoutCompleted ? 100 : 40;
  const sleepScore = log.sleepHours ? clamp((log.sleepHours / calc.sleepHours) * 100, 0, 100) : 50;

  const weighted =
    calorieScore * 0.35 + waterScore * 0.15 + stepsScore * 0.2 + workoutScore * 0.2 + sleepScore * 0.1;

  return Math.round(clamp(weighted, 0, 100));
}

export function generateDailyInsight(
  profile: UserProfile,
  calc: CalculationResult,
  log: DailyLogEntry
): string {
  const caloriesLeft = calc.dailyCalories - log.caloriesConsumed;
  const proteinGap = calc.proteinG - log.proteinG;
  const waterGap = calc.waterLiters - log.waterLiters;
  const firstName = profile.name.split(" ")[0];

  if (log.caloriesConsumed === 0) {
    return `Good day to start strong, ${firstName}. Your target today is ${calc.dailyCalories} kcal with ${calc.proteinG}g protein — log your first meal to get real-time guidance.`;
  }

  if (proteinGap > 30) {
    return `You're ${proteinGap}g short on protein today, ${firstName}. Add a protein-rich snack like Greek yogurt, paneer, or eggs to stay on track for ${profile.goal.replace("-", " ")}.`;
  }

  if (caloriesLeft < 0) {
    return `You've gone ${Math.abs(caloriesLeft)} kcal over your ${calc.dailyCalories} kcal target today. A brisk 20-minute walk can help offset it — don't stress, just get back on track tomorrow.`;
  }

  if (waterGap > 0.8) {
    return `You still need ${waterGap.toFixed(1)}L of water today to hit your ${calc.waterLiters}L goal. Keep a bottle nearby and sip through the afternoon.`;
  }

  if (log.steps < calc.recommendedSteps * 0.5) {
    return `You're at ${log.steps.toLocaleString()} steps — a bit behind your ${calc.recommendedSteps.toLocaleString()} goal. A short walk after your next meal can close the gap.`;
  }

  if (caloriesLeft > 0 && caloriesLeft < 400) {
    return `Great pacing, ${firstName}! You have ${caloriesLeft} kcal left — perfect for a balanced dinner within your plan.`;
  }

  return `You're on track today, ${firstName}. Keep hitting your macros and steps, and the results will follow.`;
}

export function generateRecoveryTip(healthConditions: UserProfile["healthConditions"]): string {
  if (healthConditions.includes("knee-pain")) {
    return "Prioritize low-impact cardio (walking, cycling, swimming) today and stretch your quads and hamstrings after activity.";
  }
  if (healthConditions.includes("back-pain")) {
    return "Focus on core stability and gentle mobility work; avoid heavy spinal loading and maintain good posture during workouts.";
  }
  return "Prioritize 7-8 hours of sleep tonight and a 5-minute stretch routine to help muscles recover.";
}

export function generateMealImprovementTip(log: DailyLogEntry, calc: CalculationResult): string {
  const fiberEstimate = log.loggedFoods.length; // proxy: no fiber tracked per-log yet
  const proteinGap = calc.proteinG - log.proteinG;
  const carbsPct = log.caloriesConsumed > 0 ? (log.carbsG * 4) / log.caloriesConsumed : 0;

  if (log.caloriesConsumed === 0) {
    return "No meals logged yet today — try to log each meal as you eat for the most useful improvement tips.";
  }
  if (proteinGap > calc.proteinG * 0.3) {
    return `You're ${proteinGap}g short of your ${calc.proteinG}g protein target so far. Swap a refined-carb snack for a protein one (paneer, curd, eggs, or a protein shake) to close the gap.`;
  }
  if (carbsPct > 0.6) {
    return "Carbs are dominating today's intake. Try adding a vegetable side or salad to your next meal to bring more fiber and balance into the plate.";
  }
  if (fiberEstimate < 2) {
    return "Add one more fiber-rich food today (oats, dal, leafy greens, or fruit) to help with satiety and digestion.";
  }
  return "Your meals are well balanced today — keep the protein and fiber consistent across all meals, not just one.";
}

export function generateWorkoutSuggestion(
  profile: UserProfile,
  log: DailyLogEntry,
  todayFocus?: string
): string {
  if (log.workoutCompleted) {
    return `Nice work finishing today's session${todayFocus ? ` (${todayFocus})` : ""}. Prioritize protein in your next meal to support recovery.`;
  }
  if (profile.healthConditions.includes("knee-pain")) {
    return "Haven't trained yet today — a 20-30 minute walk or a swim is a safe, knee-friendly way to stay active.";
  }
  if (profile.fitnessLevel === "beginner") {
    return "Haven't trained yet today — even a short 15-minute bodyweight session (squats, push-ups, plank) counts. Consistency matters more than intensity right now.";
  }
  return `You haven't logged today's workout yet${todayFocus ? ` — ${todayFocus} is on your plan` : ""}. Try to fit it in before the day ends.`;
}

export function generateWeeklySummary(logs: DailyLogEntry[], calc: CalculationResult): string {
  const daysLogged = logs.filter((l) => l.caloriesConsumed > 0).length;
  if (daysLogged === 0) {
    return "No meals logged this week yet — start tracking to unlock your weekly summary.";
  }
  const avgCalories = Math.round(logs.reduce((s, l) => s + l.caloriesConsumed, 0) / daysLogged);
  const avgSteps = Math.round(logs.reduce((s, l) => s + l.steps, 0) / logs.length);
  const workoutsDone = logs.filter((l) => l.workoutCompleted).length;
  const diff = avgCalories - calc.dailyCalories;
  const trend = diff > 100 ? "slightly above" : diff < -100 ? "below" : "right on";

  return `This week you logged ${daysLogged}/7 days, averaging ${avgCalories} kcal/day (${trend} your ${calc.dailyCalories} kcal target), ${avgSteps.toLocaleString()} steps/day, and completed ${workoutsDone} workout${workoutsDone === 1 ? "" : "s"}.`;
}
