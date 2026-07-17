"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DailyLogEntry, LoggedFood } from "@/types";

export const HABIT_KEYS = [
  "sleep",
  "meditation",
  "reading",
  "walking",
  "workout",
  "water",
  "healthyEating",
] as const;

export type HabitKey = (typeof HABIT_KEYS)[number];

export const HABIT_LABELS: Record<HabitKey, string> = {
  sleep: "Sleep 7-8h",
  meditation: "Meditation",
  reading: "Reading",
  walking: "Walking",
  workout: "Workout",
  water: "Water Goal",
  healthyEating: "Healthy Eating",
};

function emptyLog(date: string): DailyLogEntry {
  return {
    date,
    caloriesConsumed: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    waterLiters: 0,
    steps: 0,
    workoutCompleted: false,
    workoutCaloriesBurned: 0,
    loggedFoods: [],
    habits: {},
  };
}

interface TrackerState {
  logs: Record<string, DailyLogEntry>;
  waterStreak: number;
  upsertLog: (date: string, partial: Partial<DailyLogEntry>) => void;
  logFood: (date: string, food: LoggedFood) => void;
  removeFood: (date: string, foodId: string) => void;
  toggleHabit: (date: string, habit: HabitKey) => void;
  addWater: (date: string, liters: number) => void;
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      logs: {},
      waterStreak: 0,
      upsertLog: (date, partial) => {
        const current = get().logs[date] ?? emptyLog(date);
        set({ logs: { ...get().logs, [date]: { ...current, ...partial } } });
      },
      logFood: (date, food) => {
        const current = get().logs[date] ?? emptyLog(date);
        const loggedFoods = [...current.loggedFoods, food];
        set({
          logs: {
            ...get().logs,
            [date]: {
              ...current,
              loggedFoods,
              caloriesConsumed: current.caloriesConsumed + food.calories,
              proteinG: current.proteinG + food.proteinG,
              carbsG: current.carbsG + food.carbsG,
              fatG: current.fatG + food.fatG,
            },
          },
        });
      },
      removeFood: (date, foodId) => {
        const current = get().logs[date] ?? emptyLog(date);
        const removed = current.loggedFoods.find((f) => f.id === foodId);
        if (!removed) return;
        set({
          logs: {
            ...get().logs,
            [date]: {
              ...current,
              loggedFoods: current.loggedFoods.filter((f) => f.id !== foodId),
              caloriesConsumed: Math.max(0, current.caloriesConsumed - removed.calories),
              proteinG: Math.max(0, current.proteinG - removed.proteinG),
              carbsG: Math.max(0, current.carbsG - removed.carbsG),
              fatG: Math.max(0, current.fatG - removed.fatG),
            },
          },
        });
      },
      toggleHabit: (date, habit) => {
        const current = get().logs[date] ?? emptyLog(date);
        set({
          logs: {
            ...get().logs,
            [date]: {
              ...current,
              habits: { ...current.habits, [habit]: !current.habits[habit] },
            },
          },
        });
      },
      addWater: (date, liters) => {
        const current = get().logs[date] ?? emptyLog(date);
        set({
          logs: {
            ...get().logs,
            [date]: { ...current, waterLiters: Math.max(0, current.waterLiters + liters) },
          },
        });
      },
    }),
    { name: "fitfusion-tracker" }
  )
);

export function useDailyLog(date: string): DailyLogEntry {
  const raw = useTrackerStore((s) => s.logs[date]);
  return useMemo(() => raw ?? emptyLog(date), [raw, date]);
}
