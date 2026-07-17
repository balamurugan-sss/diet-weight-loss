"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ShoppingCart, Sparkles } from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";
import { usePlanStore } from "@/lib/store/planStore";
import { generateWeeklyMealPlan, totalDayCalories, totalDayMacros } from "@/lib/ai/mealPlanner";
import { generateShoppingList } from "@/lib/ai/shoppingList";
import { MealCard } from "@/components/meals/MealCard";
import { MacroBar } from "@/components/dashboard/MacroBar";
import { cn } from "@/lib/utils";
import type { MealSlot } from "@/types";

const SLOT_ORDER: MealSlot[] = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner", "bedtimeDrink"];

export default function MealsPage() {
  const profile = useUserStore((s) => s.profile);
  const calc = useUserStore((s) => s.calculations);
  const mealPlan = usePlanStore((s) => s.mealPlan);
  const setMealPlan = usePlanStore((s) => s.setMealPlan);
  const setShoppingList = usePlanStore((s) => s.setShoppingList);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    if (profile && calc && !mealPlan) {
      setMealPlan(generateWeeklyMealPlan(profile, calc));
    }
  }, [profile, calc, mealPlan, setMealPlan]);

  if (!profile || !calc) return null;

  function regenerate() {
    if (!profile || !calc) return;
    setMealPlan(generateWeeklyMealPlan(profile, calc));
    setActiveDay(0);
  }

  function buildShoppingList() {
    if (!mealPlan) return;
    setShoppingList(generateShoppingList(mealPlan));
  }

  if (!mealPlan) {
    return (
      <div className="mx-auto max-w-5xl">
        <button onClick={regenerate} className="btn-primary">
          <RefreshCw size={16} /> Generate My Weekly Meal Plan
        </button>
      </div>
    );
  }

  const day = mealPlan.days[activeDay];
  const dayCalories = totalDayCalories(day);
  const dayMacros = totalDayMacros(day);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Weekly Meal Planner</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Week of {mealPlan.weekOf}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/recipes/generator" className="btn-secondary !py-2 text-sm">
            <Sparkles size={14} /> Recipe Generator
          </Link>
          <button onClick={regenerate} className="btn-secondary !py-2 text-sm">
            <RefreshCw size={14} /> Regenerate
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {mealPlan.days.map((d, i) => (
          <button
            key={d.day}
            onClick={() => setActiveDay(i)}
            className={cn("shrink-0 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all", i === activeDay ? "text-white" : "")}
            style={
              i === activeDay
                ? { backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))", borderColor: "transparent" }
                : { borderColor: "var(--card-border)", background: "var(--card)" }
            }
          >
            {d.day.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="glass-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{day.day}</h2>
          <span className="chip">{dayCalories} / {calc.dailyCalories} kcal</span>
        </div>
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <MacroBar label="Protein" current={dayMacros.protein} target={calc.proteinG} color="var(--primary)" />
          <MacroBar label="Carbs" current={dayMacros.carbs} target={calc.carbsG} color="var(--accent-2)" />
          <MacroBar label="Fat" current={dayMacros.fat} target={calc.fatG} color="var(--accent)" />
        </div>

        <div className="flex flex-col gap-3">
          {SLOT_ORDER.map((slot) => {
            const recipe = day.meals[slot];
            return recipe ? <MealCard key={slot} slot={slot} recipe={recipe} /> : null;
          })}
        </div>
      </div>

      <Link href="/shopping-list" onClick={buildShoppingList} className="btn-primary self-start">
        <ShoppingCart size={16} /> Build Shopping List From This Week
      </Link>
    </div>
  );
}
