import { sql } from "drizzle-orm";
import {
  blob,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { HomeEquipment, ProgramDay } from "../../lib/workouts/types";

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

const json = <T>(name: string) => text(name, { mode: "json" }).$type<T>();

// ─── Accounts ────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  displayName: text("display_name"),
  isGuest: integer("is_guest", { mode: "boolean" }).notNull().default(true),
  plan: text("plan", { enum: ["free", "premium"] }).notNull().default("free"),
  premiumUntil: integer("premium_until", { mode: "timestamp_ms" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: createdAt(),
  lastActiveAt: integer("last_active_at", { mode: "timestamp_ms" }),
});

export const sessions = sqliteTable(
  "sessions",
  {
    // SHA-256 of the cookie token; the raw token is never stored.
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const profiles = sqliteTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  dateOfBirth: text("date_of_birth"),
  ageYears: integer("age_years"),
  sexForEquation: text("sex_for_equation", { enum: ["female", "male"] }),
  heightCm: real("height_cm"),
  weightKg: real("weight_kg"),
  targetWeightKg: real("target_weight_kg"),
  activityLevel: text("activity_level", {
    enum: ["sedentary", "light", "moderate", "very"],
  }),
  dietPreference: text("diet_preference", {
    enum: ["vegetarian", "eggitarian", "non_vegetarian", "vegan"],
  }),
  cuisines: json<string[]>("cuisines").notNull().default([]),
  regionalNotes: text("regional_notes"),
  allergies: json<string[]>("allergies").notNull().default([]),
  avoidFoods: json<string[]>("avoid_foods").notNull().default([]),
  conditions: json<string[]>("conditions").notNull().default([]),
  pregnancyStatus: text("pregnancy_status", {
    enum: ["none", "pregnant", "breastfeeding", "prefer_not"],
  }),
  medicalNotes: text("medical_notes"),
  cookingTimeMin: integer("cooking_time_min"),
  equipment: json<string[]>("equipment").notNull().default([]),
  budgetInr: integer("budget_inr"),
  budgetPeriod: text("budget_period", { enum: ["day", "week"] }),
  mealSlots: json<string[]>("meal_slots").notNull().default([]),
  planStyle: text("plan_style", {
    enum: ["balanced", "low_carb", "keto", "high_protein"],
  }),
  netCarbLimitG: integer("net_carb_limit_g"),
  pace: text("pace", { enum: ["gentle", "steady"] }),
  householdSize: integer("household_size").notNull().default(1),
  language: text("language").notNull().default("en"),
  /** Daily goals shown in the Me tab tracker. */
  stepGoal: integer("step_goal"),
  activeKcalGoal: integer("active_kcal_goal"),
  sleepGoalMin: integer("sleep_goal_min"),
  transliteration: integer("transliteration", { mode: "boolean" })
    .notNull()
    .default(false),
  voiceId: text("voice_id"),
  narrationRate: real("narration_rate").notNull().default(1),
  units: text("units", { enum: ["metric", "kitchen"] })
    .notNull()
    .default("kitchen"),
  waterGoalMl: integer("water_goal_ml"),
  keepAwake: integer("keep_awake", { mode: "boolean" }).notNull().default(true),
  voiceCommands: integer("voice_commands", { mode: "boolean" })
    .notNull()
    .default(false),
  onboardingCompletedAt: integer("onboarding_completed_at", {
    mode: "timestamp_ms",
  }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

// ─── Catalogue ───────────────────────────────────────────────────────────────

export type UnitWeights = {
  tsp?: number;
  tbsp?: number;
  cup?: number;
  piece?: number;
  pieceLabel?: string;
};

export const ingredients = sqliteTable("ingredients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameTa: text("name_ta"),
  nameMl: text("name_ml"),
  category: text("category").notNull(),
  dietClass: text("diet_class", { enum: ["vegan", "vegetarian", "egg", "nonveg"] }).notNull(),
  avoidTags: json<string[]>("avoid_tags").notNull().default([]),
  // All nutrient values are per 100 g edible portion. carbsG is TOTAL
  // carbohydrate including dietary fibre; net carbs are derived.
  kcal: real("kcal").notNull(),
  proteinG: real("protein_g").notNull(),
  carbsG: real("carbs_g").notNull(),
  fibreG: real("fibre_g").notNull(),
  fatG: real("fat_g").notNull(),
  sugarAlcoholG: real("sugar_alcohol_g").notNull().default(0),
  allergens: json<string[]>("allergens").notNull().default([]),
  hiddenCarbNote: text("hidden_carb_note"),
  costPerKgInr: real("cost_per_kg_inr").notNull(),
  unitWeights: json<UnitWeights>("unit_weights").notNull().default({}),
  shopUnit: text("shop_unit", { enum: ["g", "ml", "piece"] })
    .notNull()
    .default("g"),
  shopPack: real("shop_pack"),
  densityGPerMl: real("density_g_per_ml"),
  pantryStaple: integer("pantry_staple", { mode: "boolean" })
    .notNull()
    .default(false),
  nutritionSource: text("nutrition_source").notNull(),
  validationStatus: text("validation_status", {
    enum: ["verified", "reference_estimate", "unverified"],
  }).notNull(),
});

export type Provenance = {
  source: string;
  author?: string;
  license?: string;
  importBatch?: string;
  importedAt?: string;
};

export const recipes = sqliteTable(
  "recipes",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    cuisine: text("cuisine").notNull(),
    region: text("region"),
    mealTypes: json<string[]>("meal_types").notNull(),
    course: text("course", {
      enum: ["complete", "main", "side", "base", "accompaniment", "snack", "dessert", "drink"],
    }).notNull(),
    dietType: text("diet_type", {
      enum: ["vegan", "vegetarian", "eggitarian", "non_vegetarian"],
    }).notNull(),
    tags: json<string[]>("tags").notNull(),
    servings: integer("servings").notNull(),
    prepMin: integer("prep_min").notNull(),
    cookMin: integer("cook_min").notNull(),
    restMin: integer("rest_min").notNull().default(0),
    difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] })
      .notNull()
      .default("easy"),
    equipment: json<string[]>("equipment").notNull(),
    storage: text("storage"),
    reheating: text("reheating"),
    allergens: json<string[]>("allergens").notNull(),
    avoidTags: json<string[]>("avoid_tags").notNull().default([]),
    servingGrams: real("serving_grams").notNull(),
    kcal: real("kcal").notNull(),
    proteinG: real("protein_g").notNull(),
    carbsG: real("carbs_g").notNull(),
    fibreG: real("fibre_g").notNull(),
    netCarbsG: real("net_carbs_g").notNull(),
    fatG: real("fat_g").notNull(),
    costPerServingInr: real("cost_per_serving_inr").notNull(),
    nutritionSource: text("nutrition_source").notNull(),
    nutritionStatus: text("nutrition_status", {
      enum: ["verified", "estimated"],
    }).notNull(),
    isKeto: integer("is_keto", { mode: "boolean" }).notNull(),
    isLowCarb: integer("is_low_carb", { mode: "boolean" }).notNull(),
    isHighProtein: integer("is_high_protein", { mode: "boolean" }).notNull(),
    provenance: json<Provenance>("provenance").notNull(),
    validationStatus: text("validation_status", {
      enum: ["validated", "draft", "rejected"],
    }).notNull(),
    validationNotes: json<string[]>("validation_notes").notNull().default([]),
    contentHash: text("content_hash").notNull(),
    searchText: text("search_text").notNull(),
    palette: json<string[]>("palette").notNull().default([]),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    index("recipes_diet_idx").on(t.dietType),
    index("recipes_cuisine_idx").on(t.cuisine),
    index("recipes_status_idx").on(t.validationStatus),
    index("recipes_kcal_idx").on(t.kcal),
  ],
);

export const recipeIngredients = sqliteTable(
  "recipe_ingredients",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    ingredientId: text("ingredient_id")
      .notNull()
      .references(() => ingredients.id),
    grams: real("grams").notNull(),
    measureText: text("measure_text"),
    prepNote: text("prep_note"),
    optional: integer("optional", { mode: "boolean" }).notNull().default(false),
    toTaste: integer("to_taste", { mode: "boolean" }).notNull().default(false),
    groupName: text("group_name"),
  },
  (t) => [
    index("ri_recipe_idx").on(t.recipeId),
    index("ri_ingredient_idx").on(t.ingredientId),
  ],
);

export const recipeSteps = sqliteTable(
  "recipe_steps",
  {
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    stepIndex: integer("step_index").notNull(),
    title: text("title").notNull(),
    text: text("text").notNull(),
    kind: text("kind", {
      enum: ["prep", "cook", "rest", "assemble", "serve"],
    }).notNull(),
    timerSec: integer("timer_sec"),
    tempC: integer("temp_c"),
    heat: text("heat", { enum: ["low", "medium", "high"] }),
    uses: json<string[]>("uses").notNull().default([]),
    visual: text("visual").notNull(),
    equipment: json<string[]>("equipment").notNull().default([]),
  },
  (t) => [primaryKey({ columns: [t.recipeId, t.stepIndex] })],
);

export const recipeSubstitutions = sqliteTable(
  "recipe_substitutions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    ingredientId: text("ingredient_id")
      .notNull()
      .references(() => ingredients.id),
    substituteId: text("substitute_id").references(() => ingredients.id),
    ratio: real("ratio").notNull().default(1),
    note: text("note").notNull(),
  },
  (t) => [index("rs_recipe_idx").on(t.recipeId)],
);

export const recipeTranslations = sqliteTable(
  "recipe_translations",
  {
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    lang: text("lang").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    steps: json<string[]>("steps").notNull(),
    // reviewed = checked by a native speaker; draft = human/AI-drafted, not
    // yet reviewed; machine = produced by a translation API on demand.
    status: text("status", { enum: ["reviewed", "draft", "machine"] }).notNull(),
    source: text("source").notNull(),
    contentHash: text("content_hash").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
  },
  (t) => [primaryKey({ columns: [t.recipeId, t.lang] })],
);

// ─── Generated media cache ───────────────────────────────────────────────────

export const imageAssets = sqliteTable(
  "image_assets",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    // -1 = finished-dish hero image; 0..n = cooking step.
    stepIndex: integer("step_index").notNull(),
    status: text("status", {
      enum: ["approved", "generated", "rejected"],
    }).notNull(),
    kind: text("kind", { enum: ["ai_illustration", "verified_photo"] }).notNull(),
    provider: text("provider").notNull(),
    model: text("model"),
    prompt: text("prompt"),
    mime: text("mime").notNull(),
    data: blob("data", { mode: "buffer" }).notNull(),
    bytes: integer("bytes").notNull(),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reports: integer("reports").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("img_lookup_idx").on(t.recipeId, t.stepIndex, t.status)],
);

export const audioAssets = sqliteTable("audio_assets", {
  // sha256(provider|voice|lang|text) — identical narration is generated once.
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  voice: text("voice").notNull(),
  lang: text("lang").notNull(),
  mime: text("mime").notNull(),
  data: blob("data", { mode: "buffer" }).notNull(),
  chars: integer("chars").notNull(),
  createdAt: createdAt(),
});

// ─── Per-user activity ───────────────────────────────────────────────────────

export const favourites = sqliteTable(
  "favourites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.recipeId] })],
);

export const recentViews = sqliteTable(
  "recent_views",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    viewedAt: integer("viewed_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.recipeId] })],
);

export type TargetsSnapshot = {
  kcal: number;
  kcalMin: number;
  kcalMax: number;
  proteinG: number;
  carbsG: number;
  netCarbLimitG: number | null;
  fatG: number;
  fibreG: number;
};

export const mealPlans = sqliteTable(
  "meal_plans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    days: integer("days").notNull(),
    startDate: text("start_date").notNull(),
    planStyle: text("plan_style").notNull(),
    targets: json<TargetsSnapshot>("targets").notNull(),
    status: text("status", { enum: ["active", "archived"] }).notNull(),
    isFavourite: integer("is_favourite", { mode: "boolean" })
      .notNull()
      .default(false),
    seed: integer("seed").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("plans_user_idx").on(t.userId, t.status)],
);

export type IngredientSwap = { from: string; to: string; ratio: number };

export const mealPlanItems = sqliteTable(
  "meal_plan_items",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id")
      .notNull()
      .references(() => mealPlans.id, { onDelete: "cascade" }),
    dayIndex: integer("day_index").notNull(),
    slot: text("slot").notNull(),
    position: integer("position").notNull().default(0),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id),
    portion: real("portion").notNull(),
    swaps: json<IngredientSwap[]>("swaps").notNull().default([]),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("items_plan_day_idx").on(t.planId, t.dayIndex)],
);

export const mealLogs = sqliteTable(
  "meal_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    slot: text("slot").notNull(),
    recipeId: text("recipe_id").references(() => recipes.id, {
      onDelete: "set null",
    }),
    planItemId: text("plan_item_id"),
    title: text("title").notNull(),
    portion: real("portion").notNull(),
    kcal: real("kcal").notNull(),
    proteinG: real("protein_g").notNull(),
    carbsG: real("carbs_g").notNull(),
    netCarbsG: real("net_carbs_g").notNull(),
    fatG: real("fat_g").notNull(),
    fibreG: real("fibre_g").notNull(),
    /** Local "HH:MM" set in Edit my day; null = when it was logged. */
    time: text("time"),
    createdAt: createdAt(),
  },
  (t) => [index("meal_logs_user_date_idx").on(t.userId, t.date)],
);

export const shoppingState = sqliteTable(
  "shopping_state",
  {
    planId: text("plan_id")
      .notNull()
      .references(() => mealPlans.id, { onDelete: "cascade" }),
    weekIndex: integer("week_index").notNull(),
    ingredientId: text("ingredient_id").notNull(),
    haveAtHome: integer("have_at_home", { mode: "boolean" })
      .notNull()
      .default(false),
    checked: integer("checked", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.planId, t.weekIndex, t.ingredientId] })],
);

export const weightLogs = sqliteTable(
  "weight_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    weightKg: real("weight_kg").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("weight_user_date_uq").on(t.userId, t.date)],
);

export const waterLogs = sqliteTable(
  "water_logs",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    ml: integer("ml").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.date] })],
);

export const cookingSessions = sqliteTable(
  "cooking_sessions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    stepIndex: integer("step_index").notNull().default(0),
    completedSteps: json<number[]>("completed_steps").notNull().default([]),
    servings: real("servings").notNull(),
    planItemId: text("plan_item_id"),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.recipeId] })],
);

// ─── Workouts ────────────────────────────────────────────────────────────────

export const workoutProfiles = sqliteTable("workout_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  location: text("location", { enum: ["home", "gym", "mix"] }).notNull(),
  level: text("level", { enum: ["beginner", "intermediate", "advanced"] }).notNull(),
  goal: text("goal", { enum: ["lose", "gain", "fit"] }).notNull(),
  daysPerWeek: integer("days_per_week").notNull(),
  equipment: json<HomeEquipment[]>("equipment").notNull().default([]),
  /** Chosen training weekdays (0 = Sunday); null = the standard rhythm from the start day. */
  weekdays: json<number[]>("weekdays"),
  doctorAckAt: integer("doctor_ack_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

export const workoutPrograms = sqliteTable(
  "workout_programs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    split: text("split").notNull(),
    location: text("location", { enum: ["home", "gym", "mix"] }).notNull(),
    level: text("level", { enum: ["beginner", "intermediate", "advanced"] }).notNull(),
    goal: text("goal", { enum: ["lose", "gain", "fit"] }).notNull(),
    daysPerWeek: integer("days_per_week").notNull(),
    startDate: text("start_date").notNull(),
    // Snapshot of the generated program so later library changes never alter it.
    days: json<ProgramDay[]>("days").notNull(),
    // "<dayIndex>:<slot>" → exerciseId for one day, "*:<exerciseId>" → exerciseId everywhere.
    swaps: json<Record<string, string>>("swaps").notNull().default({}),
    // "side" = a guide program followed alongside the main one ("Add to my day").
    status: text("status", { enum: ["active", "side", "archived", "completed"] }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("workout_programs_user_idx").on(t.userId, t.status)],
);

export const workoutSessions = sqliteTable(
  "workout_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    programId: text("program_id")
      .notNull()
      .references(() => workoutPrograms.id, { onDelete: "cascade" }),
    dayIndex: integer("day_index").notNull(),
    date: text("date").notNull(),
    kind: text("kind", { enum: ["workout", "recovery"] }).notNull(),
    status: text("status", { enum: ["in_progress", "completed"] }).notNull(),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
    durationSec: integer("duration_sec"),
    kcal: integer("kcal"),
    netKcal: integer("net_kcal"),
    exercisesDone: integer("exercises_done"),
  },
  (t) => [
    index("workout_sessions_user_date_idx").on(t.userId, t.date),
    uniqueIndex("workout_sessions_program_day_uq").on(t.programId, t.dayIndex),
  ],
);

export const workoutSets = sqliteTable(
  "workout_sets",
  {
    sessionId: text("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    slot: integer("slot").notNull(),
    setIndex: integer("set_index").notNull(),
    exerciseId: text("exercise_id").notNull(),
    reps: integer("reps"),
    seconds: integer("seconds"),
    weightKg: real("weight_kg"),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.slot, t.setIndex] }), index("workout_sets_exercise_idx").on(t.exerciseId)],
);

export const cardioLogs = sqliteTable(
  "cardio_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    activity: text("activity").notNull(),
    intensity: text("intensity", { enum: ["light", "moderate", "vigorous"] }).notNull(),
    minutes: integer("minutes").notNull(),
    kcal: integer("kcal").notNull(),
    netKcal: integer("net_kcal").notNull(),
    // Where the entry came from; imported entries carry the source's id so re-imports don't duplicate.
    source: text("source", { enum: ["manual", "apple_health", "fitbit_export", "google_fit_export", "google_health"] }).notNull().default("manual"),
    externalId: text("external_id"),
    /** Local "HH:MM" set in Edit my day; null = when it was logged (manual) or unknown (imported). */
    time: text("time"),
    createdAt: createdAt(),
  },
  (t) => [index("cardio_user_date_idx").on(t.userId, t.date), uniqueIndex("cardio_external_uq").on(t.userId, t.source, t.externalId)],
);

// Public read-only links to a plan summary. The page never shows profile or body data.
export const shareLinks = sqliteTable(
  "share_links",
  {
    token: text("token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    views: integer("views").notNull().default(0),
    createdAt: createdAt(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("share_links_user_idx").on(t.userId)],
);

// ─── Health data (wearables / phone exports) ────────────────────────────────

export const healthDays = sqliteTable(
  "health_days",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    source: text("source", { enum: ["apple_health", "fitbit_export", "google_fit_export", "google_health", "manual"] }).notNull(),
    steps: integer("steps"),
    activeMinutes: integer("active_minutes"),
    restingHr: integer("resting_hr"),
    sleepMinutes: integer("sleep_minutes"),
    avgHr: integer("avg_hr"),
    maxHr: integer("max_hr"),
    hrHourly: json<(number | null)[]>("hr_hourly"),
    inBedMinutes: integer("in_bed_minutes"),
    deepMinutes: integer("deep_minutes"),
    remMinutes: integer("rem_minutes"),
    sleepStart: text("sleep_start"),
    wakeTime: text("wake_time"),
    sleepScore: integer("sleep_score"),
    activeKcal: integer("active_kcal"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.date, t.source] })],
);

/** OAuth connections. Tokens are AES-256-GCM encrypted with HEALTH_TOKEN_KEY; never stored in plain text. */
export const healthConnections = sqliteTable(
  "health_connections",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["google_health"] }).notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    scope: text("scope").notNull(),
    connectedAt: integer("connected_at", { mode: "timestamp_ms" }).notNull(),
    lastSyncAt: integer("last_sync_at", { mode: "timestamp_ms" }),
    lastError: text("last_error"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.provider] })],
);

/** AI exercise demo clips. Only `approved` clips are shown to users; the drawn figure is the fallback. */
export const exerciseMedia = sqliteTable(
  "exercise_media",
  {
    id: text("id").primaryKey(),
    exerciseId: text("exercise_id").notNull(),
    status: text("status", { enum: ["generating", "ready", "approved", "rejected", "failed"] }).notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    prompt: text("prompt").notNull(),
    operation: text("operation"),
    data: blob("data", { mode: "buffer" }),
    mime: text("mime"),
    bytes: integer("bytes"),
    error: text("error"),
    createdAt: createdAt(),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("exercise_media_exercise_idx").on(t.exerciseId, t.status)],
);

// ─── Quotas, rate limits, billing ────────────────────────────────────────────

export const usageCounters = sqliteTable(
  "usage_counters",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(),
    day: text("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.feature, t.day] })],
);

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: integer("window_start").notNull(),
  count: integer("count").notNull(),
});

export const stripeEvents = sqliteTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  createdAt: createdAt(),
});

/**
 * Things the person tells the Today screen that aren't food: when they woke
 * up and when they plan to train. Food and drinks (morning water, pre-workout
 * snack, whey) go to meal_logs so they count towards the day's intake.
 */
export const dayEvents = sqliteTable(
  "day_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    kind: text("kind", { enum: ["wake", "workout_plan", "ate"] }).notNull(),
    /** Local "HH:MM". */
    time: text("time").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("day_events_user_date_kind_uq").on(t.userId, t.date, t.kind)],
);

/** Thumbs up / down on a recipe from the meal plan, used to steer future plans. */
export const recipeFeedback = sqliteTable(
  "recipe_feedback",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    liked: integer("liked", { mode: "boolean" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.recipeId] })],
);
