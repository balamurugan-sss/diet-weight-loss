"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useTrackerStore } from "@/lib/store/trackerStore";
import { todayKey } from "@/lib/utils";
import type { Recipe } from "@/types";

export function LogMealButton({ recipe }: { recipe: Recipe }) {
  const logFood = useTrackerStore((s) => s.logFood);
  const [logged, setLogged] = useState(false);

  return (
    <button
      onClick={() => {
        logFood(todayKey(), {
          id: crypto.randomUUID(),
          foodName: recipe.name,
          servingSize: recipe.servingSize,
          calories: recipe.calories,
          proteinG: recipe.proteinG,
          carbsG: recipe.carbsG,
          fatG: recipe.fatG,
          slot: recipe.slot,
          loggedAt: new Date().toISOString(),
        });
        setLogged(true);
      }}
      disabled={logged}
      className="btn-primary !py-2.5 text-sm disabled:opacity-60"
    >
      {logged ? <Check size={16} /> : <Plus size={16} />}
      {logged ? "Logged to today" : "Log this meal"}
    </button>
  );
}
