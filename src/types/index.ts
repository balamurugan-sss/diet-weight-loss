export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "athlete";

export type FoodPreference = "vegetarian" | "vegan" | "eggitarian" | "non-vegetarian";

export type CuisinePreference =
  | "south-indian"
  | "north-indian"
  | "indian"
  | "mediterranean"
  | "asian"
  | "mexican"
  | "italian";

export type HealthCondition =
  | "diabetes"
  | "thyroid"
  | "pcos"
  | "high-bp"
  | "cholesterol"
  | "knee-pain"
  | "back-pain";

export type WorkoutPreference = "home" | "gym" | "walking" | "running" | "yoga";

export type Goal = "weight-loss" | "fat-loss" | "lean-muscle" | "maintain";

export type GoalSpeed = "slow" | "moderate" | "aggressive";

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  bodyFatPct?: number;
  activityLevel: ActivityLevel;
  occupation: string;
  dailySteps: number;
  sleepHours: number;
  waterIntakeLiters: number;
  foodPreference: FoodPreference;
  cuisinePreferences: CuisinePreference[];
  healthConditions: HealthCondition[];
  workoutPreferences: WorkoutPreference[];
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  goal: Goal;
  goalSpeed: GoalSpeed;
  createdAt: string;
}

export interface CalculationResult {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  idealWeightKg: number;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterLiters: number;
  recommendedSteps: number;
  sleepHours: number;
  weeklyFatLossKg: number;
  targetDate: string;
  weeksToGoal: number;
}

export type MealSlot =
  | "breakfast"
  | "morningSnack"
  | "lunch"
  | "eveningSnack"
  | "dinner"
  | "bedtimeDrink";

export type MealTag =
  | "high-protein"
  | "low-carb"
  | "low-fat"
  | "vegetarian"
  | "vegan"
  | "eggitarian"
  | "non-vegetarian"
  | "budget"
  | "indian"
  | "diabetes-friendly"
  | "low-sodium"
  | "pcos-friendly"
  | "thyroid-friendly";

export interface Ingredient {
  name: string;
  quantity: string;
  category:
    | "vegetables"
    | "fruits"
    | "protein"
    | "grains"
    | "dairy"
    | "spices"
    | "healthy-snacks"
    | "other";
}

export interface Recipe {
  id: string;
  name: string;
  slot: MealSlot;
  cuisine: CuisinePreference[];
  tags: MealTag[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  servingSize: string;
  prepTimeMin: number;
  cookTimeMin: number;
  difficulty: "easy" | "medium" | "hard";
  ingredients: Ingredient[];
  instructions: string[];
  nutritionalBenefits: string[];
  storageTips: string;
  healthyAlternatives: string[];
  image: string;
}

export interface DayMealPlan {
  day: string;
  meals: Partial<Record<MealSlot, Recipe>>;
}

export interface WeeklyMealPlan {
  weekOf: string;
  days: DayMealPlan[];
}

export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "full-body"
  | "cardio"
  | "mobility";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  environment: "home" | "gym";
  difficulty: "beginner" | "intermediate" | "advanced";
  sets: number;
  reps: string;
  restSeconds: number;
  caloriesBurned: number;
  equipment: string;
  instructions: string[];
  commonMistakes: string[];
  safetyTips: string[];
  alternativeExercise: string;
  kneeFriendly: boolean;
  suitableFor: Gender[] | "both";
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: Exercise[];
  isRestDay: boolean;
}

export interface WeeklyWorkoutPlan {
  weekOf: string;
  environment: "home" | "gym";
  level: "beginner" | "intermediate" | "advanced";
  days: WorkoutDay[];
}

export interface DailyLogEntry {
  date: string;
  caloriesConsumed: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterLiters: number;
  steps: number;
  weightKg?: number;
  sleepHours?: number;
  workoutCompleted: boolean;
  workoutCaloriesBurned: number;
  mood?: "great" | "good" | "okay" | "low" | "stressed";
  energy?: "high" | "medium" | "low";
  waistCm?: number;
  hipCm?: number;
  bodyFatPct?: number;
  loggedFoods: LoggedFood[];
  habits: Record<string, boolean>;
}

export interface FoodItem {
  id: string;
  name: string;
  category: "indian" | "restaurant" | "fast-food" | "packaged";
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
}

export interface LoggedFood {
  id: string;
  foodName: string;
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  slot: MealSlot;
  loggedAt: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  category: Ingredient["category"];
  checked: boolean;
  addedManually: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
