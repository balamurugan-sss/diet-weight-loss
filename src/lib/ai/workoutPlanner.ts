import type { Exercise, MuscleGroup, UserProfile, WeeklyWorkoutPlan, WorkoutDay } from "@/types";
import { EXERCISES } from "@/lib/data/exercises";
import { format } from "date-fns";

interface DayTemplate {
  day: string;
  focus: string;
  groups: MuscleGroup[];
  isRestDay?: boolean;
}

const STANDARD_SPLIT: DayTemplate[] = [
  { day: "Monday", focus: "Chest", groups: ["chest"] },
  { day: "Tuesday", focus: "Legs", groups: ["legs"] },
  { day: "Wednesday", focus: "Walking / Cardio", groups: ["cardio"] },
  { day: "Thursday", focus: "Back", groups: ["back"] },
  { day: "Friday", focus: "Shoulders & Arms", groups: ["shoulders", "arms"] },
  { day: "Saturday", focus: "HIIT / Full Body", groups: ["full-body", "cardio"] },
  { day: "Sunday", focus: "Recovery", groups: ["mobility"], isRestDay: true },
];

const KNEE_FRIENDLY_SPLIT: DayTemplate[] = [
  { day: "Monday", focus: "Low-Impact Cardio", groups: ["cardio", "legs"] },
  { day: "Tuesday", focus: "Upper Body Strength", groups: ["chest", "back"] },
  { day: "Wednesday", focus: "Walking", groups: ["cardio"] },
  { day: "Thursday", focus: "Lower Body (Knee-Safe)", groups: ["legs"] },
  { day: "Friday", focus: "Shoulders & Core", groups: ["shoulders", "core"] },
  { day: "Saturday", focus: "Cycling / Swimming", groups: ["cardio"] },
  { day: "Sunday", focus: "Recovery & Stretching", groups: ["mobility"], isRestDay: true },
];

const EXERCISES_PER_DAY: Record<UserProfile["fitnessLevel"], number> = {
  beginner: 3,
  intermediate: 4,
  advanced: 5,
};

function difficultyAllowed(level: UserProfile["fitnessLevel"], difficulty: Exercise["difficulty"]): boolean {
  if (level === "beginner") return difficulty !== "advanced";
  if (level === "advanced") return difficulty !== "beginner";
  return true;
}

function scaleSets(exercise: Exercise, level: UserProfile["fitnessLevel"]): Exercise {
  if (level === "beginner") return { ...exercise, sets: Math.max(2, exercise.sets - 1) };
  if (level === "advanced") return { ...exercise, sets: Math.min(6, exercise.sets + 1) };
  return exercise;
}

export function generateWeeklyWorkoutPlan(profile: UserProfile): WeeklyWorkoutPlan {
  const environment: "home" | "gym" = profile.workoutPreferences.includes("gym") ? "gym" : "home";
  const hasKneePain = profile.healthConditions.includes("knee-pain");
  const hasBackPain = profile.healthConditions.includes("back-pain");
  const wantsYoga = profile.workoutPreferences.includes("yoga");

  const template = hasKneePain ? KNEE_FRIENDLY_SPLIT : STANDARD_SPLIT;
  const exercisesPerDay = EXERCISES_PER_DAY[profile.fitnessLevel];

  const pool = EXERCISES.filter((ex) => {
    if (ex.suitableFor !== "both" && !ex.suitableFor.includes(profile.gender)) return false;
    if (hasKneePain && !ex.kneeFriendly) return false;
    if (hasBackPain && /deadlift/i.test(ex.name)) return false;
    return true;
  });

  const usedIds = new Set<string>();

  const days: WorkoutDay[] = template.map((tmpl) => {
    if (tmpl.isRestDay) {
      const stretches = pool.filter((ex) => ex.muscleGroup === "mobility" && !usedIds.has(ex.id));
      const picks = pickUnique(stretches, 2, usedIds);
      return { day: tmpl.day, focus: tmpl.focus, exercises: picks, isRestDay: true };
    }

    let candidates = pool.filter(
      (ex) =>
        tmpl.groups.includes(ex.muscleGroup) &&
        ex.environment === environment &&
        difficultyAllowed(profile.fitnessLevel, ex.difficulty)
    );

    // cardio/mobility days often live under "home" even for gym users (walking, stretching)
    if (candidates.length < exercisesPerDay) {
      candidates = pool.filter(
        (ex) => tmpl.groups.includes(ex.muscleGroup) && difficultyAllowed(profile.fitnessLevel, ex.difficulty)
      );
    }

    if (wantsYoga && tmpl.groups.includes("mobility")) {
      candidates = [...candidates, ...pool.filter((ex) => /yoga|stretch/i.test(ex.name))];
    }

    const picks = pickUnique(candidates, exercisesPerDay, usedIds).map((ex) => scaleSets(ex, profile.fitnessLevel));

    return { day: tmpl.day, focus: tmpl.focus, exercises: picks, isRestDay: false };
  });

  return {
    weekOf: format(new Date(), "MMM d, yyyy"),
    environment,
    level: profile.fitnessLevel,
    days,
  };
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickUnique(candidates: Exercise[], count: number, usedIds: Set<string>): Exercise[] {
  const fresh = candidates.filter((ex) => !usedIds.has(ex.id));
  const pool = fresh.length >= count ? fresh : candidates;
  const shuffled = shuffle(pool);
  const picked: Exercise[] = [];

  for (const ex of shuffled) {
    if (picked.length >= count) break;
    if (picked.some((p) => p.id === ex.id)) continue;
    picked.push(ex);
    usedIds.add(ex.id);
  }
  return picked;
}
