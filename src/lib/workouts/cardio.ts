import { kcalFromMet } from "./load";

/**
 * Cardio activities a user can log (or import) with Compendium of Physical
 * Activities METs for light / moderate / vigorous effort.
 */
export const CARDIO_INTENSITIES = ["light", "moderate", "vigorous"] as const;
export type CardioIntensity = (typeof CARDIO_INTENSITIES)[number];

export const CARDIO_ACTIVITIES = {
  walk: { met: [3.0, 4.3, 5.3] },
  run: { met: [7.0, 9.8, 11.5] },
  cycle: { met: [4.0, 6.8, 8.0] },
  swim: { met: [5.8, 8.3, 9.8] },
  skipping: { met: [8.8, 11.8, 12.3] },
  stairs: { met: [4.0, 8.0, 8.8] },
  dance: { met: [4.5, 5.5, 7.8] },
  yoga: { met: [2.5, 3.0, 4.0] },
  sport: { met: [4.5, 6.0, 8.0] },
  other: { met: [3.0, 5.0, 7.0] },
} as const satisfies Record<string, { met: readonly [number, number, number] }>;
export type CardioActivity = keyof typeof CARDIO_ACTIVITIES;
export const CARDIO_ACTIVITY_IDS = Object.keys(CARDIO_ACTIVITIES) as CardioActivity[];

export function cardioMet(activity: CardioActivity, intensity: CardioIntensity) {
  return CARDIO_ACTIVITIES[activity].met[CARDIO_INTENSITIES.indexOf(intensity)];
}

/** Gross kcal shown to the user and net kcal (minus resting energy) that feeds the food plan. */
export function cardioEnergy(activity: CardioActivity, intensity: CardioIntensity, minutes: number, weightKg: number) {
  const met = cardioMet(activity, intensity);
  return {
    kcal: Math.round(kcalFromMet(met, weightKg, minutes)),
    netKcal: Math.round(kcalFromMet(met - 1, weightKg, minutes)),
  };
}

/** WHO: 150–300 min moderate (or 75–150 vigorous) activity a week; vigorous minutes count double. */
export const WHO_WEEKLY_MODERATE_MIN = 150;

export function moderateEquivalentMinutes(entries: { minutes: number; intensity: CardioIntensity }[]) {
  return entries.reduce((n, e) => n + (e.intensity === "vigorous" ? e.minutes * 2 : e.intensity === "moderate" ? e.minutes : 0), 0);
}

/** Day-type for the calendar: what kind of training a program day (or a logged cardio day) is. */
export type DayType = "strength" | "cardio" | "recovery" | "rest";

export function dayTypeForFocus(focus: string | null | undefined, kind: "workout" | "recovery" | "rest" | null): DayType {
  if (kind === "rest") return "rest";
  if (kind === "recovery") return "recovery";
  if (focus === "hiit" || focus === "cardio_core") return "cardio";
  return "strength";
}
