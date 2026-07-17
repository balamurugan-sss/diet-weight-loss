import Link from "next/link";
import { Clock, Flame } from "lucide-react";
import type { MealSlot, Recipe } from "@/types";

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  morningSnack: "Morning Snack",
  lunch: "Lunch",
  eveningSnack: "Evening Snack",
  dinner: "Dinner",
  bedtimeDrink: "Bedtime Drink",
};

export function MealCard({ slot, recipe }: { slot: MealSlot; recipe: Recipe }) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="solid-card flex items-center gap-4 p-4 transition-transform hover:scale-[1.01]">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl gradient-primary text-lg font-bold text-white">
        {recipe.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--primary-2)" }}>
          {SLOT_LABELS[slot]}
        </p>
        <p className="truncate font-semibold">{recipe.name}</p>
        <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
          <span className="inline-flex items-center gap-1"><Flame size={12} /> {recipe.calories} kcal</span>
          <span>{recipe.proteinG}g protein</span>
          <span className="inline-flex items-center gap-1"><Clock size={12} /> {recipe.prepTimeMin + recipe.cookTimeMin}m</span>
        </div>
      </div>
    </Link>
  );
}
