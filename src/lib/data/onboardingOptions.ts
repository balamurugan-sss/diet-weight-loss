import type {
  ActivityLevel,
  CuisinePreference,
  FoodPreference,
  Goal,
  GoalSpeed,
  HealthCondition,
  WorkoutPreference,
} from "@/types";

export const ACTIVITY_LEVEL_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: "sedentary", label: "Sedentary", desc: "Little to no exercise, desk job" },
  { value: "light", label: "Light", desc: "Exercise 1-3 days/week" },
  { value: "moderate", label: "Moderate", desc: "Exercise 3-5 days/week" },
  { value: "active", label: "Active", desc: "Exercise 6-7 days/week" },
  { value: "athlete", label: "Athlete", desc: "Intense training daily" },
];

export const FOOD_PREFERENCE_OPTIONS: { value: FoodPreference; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "eggitarian", label: "Eggitarian" },
  { value: "non-vegetarian", label: "Non-Vegetarian" },
];

export const CUISINE_OPTIONS: { value: CuisinePreference; label: string }[] = [
  { value: "south-indian", label: "South Indian" },
  { value: "north-indian", label: "North Indian" },
  { value: "indian", label: "Indian (General)" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "asian", label: "Asian" },
  { value: "mexican", label: "Mexican" },
  { value: "italian", label: "Italian" },
];

export const HEALTH_CONDITION_OPTIONS: { value: HealthCondition; label: string }[] = [
  { value: "diabetes", label: "Diabetes" },
  { value: "thyroid", label: "Thyroid" },
  { value: "pcos", label: "PCOS" },
  { value: "high-bp", label: "High Blood Pressure" },
  { value: "cholesterol", label: "Cholesterol" },
  { value: "knee-pain", label: "Knee Pain" },
  { value: "back-pain", label: "Back Pain" },
];

export const WORKOUT_PREFERENCE_OPTIONS: { value: WorkoutPreference; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "gym", label: "Gym" },
  { value: "walking", label: "Walking" },
  { value: "running", label: "Running" },
  { value: "yoga", label: "Yoga" },
];

export const GOAL_OPTIONS: { value: Goal; label: string; desc: string }[] = [
  { value: "weight-loss", label: "Weight Loss", desc: "Lose overall body weight" },
  { value: "fat-loss", label: "Fat Loss", desc: "Reduce body fat %, stay toned" },
  { value: "lean-muscle", label: "Lean Muscle", desc: "Build muscle, minimal fat gain" },
  { value: "maintain", label: "Maintain Weight", desc: "Stay at current weight" },
];

export const GOAL_SPEED_OPTIONS: { value: GoalSpeed; label: string; desc: string }[] = [
  { value: "slow", label: "Slow & Steady", desc: "~0.25 kg/week — most sustainable" },
  { value: "moderate", label: "Moderate", desc: "~0.5 kg/week — recommended" },
  { value: "aggressive", label: "Aggressive", desc: "~0.9 kg/week — needs discipline" },
];

export const FITNESS_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;
