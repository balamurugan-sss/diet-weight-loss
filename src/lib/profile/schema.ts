import { z } from "zod";
import { CONDITION_CODES } from "@/lib/nutrition/types";
import { ALLERGENS, AVOID_TAGS, CUISINES, EQUIPMENT } from "@/lib/recipes/types";

export const MEAL_SLOTS = ["breakfast", "mid_morning", "lunch", "evening", "dinner"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];
export const COOKING_TIMES = [15, 30, 45, 60, 90] as const;
export const USER_EQUIPMENT = EQUIPMENT.filter(
  (e) => !["stove", "kadai", "tawa", "saucepan", "mixing_bowl", "knife_board", "whisk"].includes(e),
);

const subset = <T extends readonly string[]>(values: T) => z.array(z.enum(values as unknown as [string, ...string[]])).max(values.length);

export const ProfileInput = z
  .object({
    displayName: z.string().trim().max(60).optional().nullable(),
    language: z.enum(["en", "en-IN", "ta", "ml"]),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    ageYears: z.number().int().min(5).max(110).optional().nullable(),
    sexForEquation: z.enum(["female", "male"]),
    pregnancyStatus: z.enum(["none", "pregnant", "breastfeeding", "prefer_not"]).default("none"),
    heightCm: z.number().min(100).max(230),
    weightKg: z.number().min(25).max(300),
    targetWeightKg: z.number().min(25).max(300).optional().nullable(),
    activityLevel: z.enum(["sedentary", "light", "moderate", "very"]),
    conditions: subset(CONDITION_CODES).default([]),
    medicalNotes: z.string().trim().max(500).optional().nullable(),
    dietPreference: z.enum(["vegetarian", "eggitarian", "non_vegetarian", "vegan"]),
    avoidFoods: subset(AVOID_TAGS).default([]),
    cuisines: subset(CUISINES).default([]),
    regionalNotes: z.string().trim().max(200).optional().nullable(),
    allergies: subset(ALLERGENS).default([]),
    cookingTimeMin: z.number().int().min(10).max(180).optional().nullable(),
    equipment: subset(EQUIPMENT).default([]),
    householdSize: z.number().int().min(1).max(12).default(1),
    budgetInr: z.number().int().min(0).max(100000).optional().nullable(),
    budgetPeriod: z.enum(["day", "week"]).optional().nullable(),
    mealSlots: subset(MEAL_SLOTS).min(2),
    planStyle: z.enum(["balanced", "low_carb", "keto", "high_protein"]),
    pace: z.enum(["gentle", "steady"]).default("gentle"),
    netCarbLimitG: z.number().int().min(20).max(130).optional().nullable(),
  })
  .refine((p) => p.dateOfBirth || p.ageYears, { message: "ob.required", path: ["ageYears"] });

export type ProfileInput = z.infer<typeof ProfileInput>;
