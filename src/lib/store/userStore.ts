"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CalculationResult, UserProfile } from "@/types";
import { runFullCalculation } from "@/lib/calculations";

interface UserState {
  profile: UserProfile | null;
  calculations: CalculationResult | null;
  hasHydrated: boolean;
  isPremium: boolean;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  recalculate: () => void;
  clearProfile: () => void;
  setPremium: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      calculations: null,
      hasHydrated: false,
      isPremium: false,
      setProfile: (profile) => {
        set({ profile, calculations: runFullCalculation(profile) });
      },
      updateProfile: (partial) => {
        const current = get().profile;
        if (!current) return;
        const updated = { ...current, ...partial };
        set({ profile: updated, calculations: runFullCalculation(updated) });
      },
      recalculate: () => {
        const current = get().profile;
        if (!current) return;
        set({ calculations: runFullCalculation(current) });
      },
      clearProfile: () => set({ profile: null, calculations: null }),
      setPremium: (value) => set({ isPremium: value }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "fitfusion-user",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
