"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const NOTIFICATION_KEYS = [
  "mealReminder",
  "workoutReminder",
  "waterReminder",
  "weightReminder",
  "sleepReminder",
  "shoppingReminder",
] as const;

export type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

export const NOTIFICATION_LABELS: Record<NotificationKey, { title: string; desc: string }> = {
  mealReminder: { title: "Meal Reminder", desc: "Nudge to log breakfast, lunch, and dinner" },
  workoutReminder: { title: "Workout Reminder", desc: "Reminder to complete today's workout" },
  waterReminder: { title: "Water Reminder", desc: "Hourly nudges to hit your water goal" },
  weightReminder: { title: "Weight Reminder", desc: "Weekly reminder to log your weight" },
  sleepReminder: { title: "Sleep Reminder", desc: "Wind-down reminder before bedtime" },
  shoppingReminder: { title: "Shopping Reminder", desc: "Reminder to review your shopping list" },
};

export type Units = "metric" | "imperial";

interface SettingsState {
  notifications: Record<NotificationKey, boolean>;
  units: Units;
  toggleNotification: (key: NotificationKey) => void;
  setUnits: (units: Units) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      notifications: {
        mealReminder: true,
        workoutReminder: true,
        waterReminder: true,
        weightReminder: true,
        sleepReminder: false,
        shoppingReminder: false,
      },
      units: "metric",
      toggleNotification: (key) =>
        set({ notifications: { ...get().notifications, [key]: !get().notifications[key] } }),
      setUnits: (units) => set({ units }),
    }),
    { name: "fitfusion-settings" }
  )
);
