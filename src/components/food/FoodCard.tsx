"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { FoodItem, MealSlot } from "@/types";
import { useTrackerStore } from "@/lib/store/trackerStore";
import { todayKey, cn } from "@/lib/utils";

const SLOTS: MealSlot[] = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner", "bedtimeDrink"];

export function FoodCard({ food }: { food: FoodItem }) {
  const logFood = useTrackerStore((s) => s.logFood);
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState<MealSlot>("lunch");
  const [logged, setLogged] = useState(false);

  return (
    <div className="solid-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{food.name}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {food.servingSize} · {food.calories} kcal · {food.proteinG}g protein
          </p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="chip shrink-0">
          {logged ? <Check size={14} /> : <Plus size={14} />} {logged ? "Added" : "Add"}
        </button>
      </div>

      {open && !logged && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: "var(--card-border)" }}>
          {SLOTS.map((s) => (
            <button key={s} onClick={() => setSlot(s)} className={cn("chip text-xs", slot === s && "chip-active")}>
              {s}
            </button>
          ))}
          <button
            onClick={() => {
              logFood(todayKey(), {
                id: crypto.randomUUID(),
                foodName: food.name,
                servingSize: food.servingSize,
                calories: food.calories,
                proteinG: food.proteinG,
                carbsG: food.carbsG,
                fatG: food.fatG,
                slot,
                loggedAt: new Date().toISOString(),
              });
              setLogged(true);
              setOpen(false);
            }}
            className="btn-primary ml-auto !py-1.5 text-xs"
          >
            Log it
          </button>
        </div>
      )}
    </div>
  );
}
