"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ShoppingListItem, WeeklyMealPlan, WeeklyWorkoutPlan } from "@/types";

interface PlanState {
  mealPlan: WeeklyMealPlan | null;
  workoutPlan: WeeklyWorkoutPlan | null;
  shoppingList: ShoppingListItem[];
  setMealPlan: (plan: WeeklyMealPlan) => void;
  setWorkoutPlan: (plan: WeeklyWorkoutPlan) => void;
  setShoppingList: (items: ShoppingListItem[]) => void;
  toggleShoppingItem: (id: string) => void;
  deleteShoppingItem: (id: string) => void;
  addShoppingItem: (item: Omit<ShoppingListItem, "id" | "checked" | "addedManually">) => void;
  clearCheckedShoppingItems: () => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      mealPlan: null,
      workoutPlan: null,
      shoppingList: [],
      setMealPlan: (plan) => set({ mealPlan: plan }),
      setWorkoutPlan: (plan) => set({ workoutPlan: plan }),
      setShoppingList: (items) => set({ shoppingList: items }),
      toggleShoppingItem: (id) =>
        set({
          shoppingList: get().shoppingList.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item
          ),
        }),
      deleteShoppingItem: (id) =>
        set({ shoppingList: get().shoppingList.filter((item) => item.id !== id) }),
      addShoppingItem: (item) =>
        set({
          shoppingList: [
            ...get().shoppingList,
            { ...item, id: crypto.randomUUID(), checked: false, addedManually: true },
          ],
        }),
      clearCheckedShoppingItems: () =>
        set({ shoppingList: get().shoppingList.filter((item) => !item.checked) }),
    }),
    { name: "fitfusion-plans" }
  )
);
