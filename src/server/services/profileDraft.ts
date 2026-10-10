import "server-only";
import type { Draft } from "@/components/onboarding/ProfileWizard";
import type { CurrentUser, Profile } from "@/server/auth/dal";

export function profileToDraft(user: CurrentUser, p: Profile | null): Draft {
  const lang = (p?.language ?? "en") as Draft["language"];
  return {
    displayName: user.displayName ?? "",
    language: ["en", "en-IN", "ta", "ml"].includes(lang) ? lang : "en",
    dateOfBirth: p?.dateOfBirth ?? null,
    ageYears: p?.ageYears ?? null,
    sexForEquation: p?.sexForEquation ?? undefined,
    pregnancyStatus: p?.pregnancyStatus ?? "none",
    heightCm: p?.heightCm ?? undefined,
    weightKg: p?.weightKg ?? undefined,
    targetWeightKg: p?.targetWeightKg ?? null,
    activityLevel: p?.activityLevel ?? undefined,
    conditions: p?.conditions ?? [],
    medicalNotes: p?.medicalNotes ?? null,
    dietPreference: p?.dietPreference ?? undefined,
    avoidFoods: p?.avoidFoods ?? [],
    cuisines: p?.cuisines ?? [],
    regionalNotes: p?.regionalNotes ?? null,
    allergies: p?.allergies ?? [],
    cookingTimeMin: p?.cookingTimeMin ?? null,
    equipment: p?.equipment ?? [],
    householdSize: p?.householdSize ?? 1,
    budgetInr: p?.budgetInr ?? null,
    budgetPeriod: p?.budgetPeriod ?? "day",
    mealSlots: p?.mealSlots?.length ? p.mealSlots : ["breakfast", "lunch", "evening", "dinner"],
    planStyle: p?.planStyle ?? "balanced",
    pace: p?.pace ?? "gentle",
    netCarbLimitG: p?.netCarbLimitG ?? null,
  } as Draft;
}
