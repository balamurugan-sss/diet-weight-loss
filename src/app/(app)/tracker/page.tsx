"use client";

import { useState } from "react";
import { Droplets, Plus, Minus, Trash2, Flame, CheckCircle2 } from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";
import { useDailyLog, useTrackerStore } from "@/lib/store/trackerStore";
import { computeWaterStreak } from "@/lib/tracker-helpers";
import { HabitGrid } from "@/components/tracker/HabitGrid";
import { NumberField } from "@/components/tracker/NumberField";
import { todayKey } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { MealSlot, DailyLogEntry } from "@/types";

const MOODS: { value: NonNullable<DailyLogEntry["mood"]>; emoji: string }[] = [
  { value: "great", emoji: "😄" },
  { value: "good", emoji: "🙂" },
  { value: "okay", emoji: "😐" },
  { value: "low", emoji: "😔" },
  { value: "stressed", emoji: "😖" },
];

const ENERGY: { value: NonNullable<DailyLogEntry["energy"]>; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const SLOTS: MealSlot[] = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner", "bedtimeDrink"];

export default function TrackerPage() {
  const profile = useUserStore((s) => s.profile);
  const calc = useUserStore((s) => s.calculations);
  const today = todayKey();
  const log = useDailyLog(today);
  const logs = useTrackerStore((s) => s.logs);
  const upsertLog = useTrackerStore((s) => s.upsertLog);
  const addWater = useTrackerStore((s) => s.addWater);
  const logFood = useTrackerStore((s) => s.logFood);
  const removeFood = useTrackerStore((s) => s.removeFood);

  const [quickAdd, setQuickAdd] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", slot: "lunch" as MealSlot });

  if (!profile || !calc) return null;

  const streak = computeWaterStreak(logs, calc.waterLiters);

  function submitQuickAdd() {
    if (!quickAdd.name || !quickAdd.calories) return;
    logFood(today, {
      id: crypto.randomUUID(),
      foodName: quickAdd.name,
      servingSize: "1 serving",
      calories: Number(quickAdd.calories) || 0,
      proteinG: Number(quickAdd.protein) || 0,
      carbsG: Number(quickAdd.carbs) || 0,
      fatG: Number(quickAdd.fat) || 0,
      slot: quickAdd.slot,
      loggedAt: new Date().toISOString(),
    });
    setQuickAdd({ name: "", calories: "", protein: "", carbs: "", fat: "", slot: quickAdd.slot });
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Daily Tracker</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Today · {log.caloriesConsumed} / {calc.dailyCalories} kcal logged</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass-card p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets size={18} style={{ color: "var(--primary-2)" }} />
              <h3 className="font-semibold">Water Intake</h3>
            </div>
            <span className="chip">🔥 {streak} day streak</span>
          </div>
          <p className="text-3xl font-bold gradient-text">{log.waterLiters.toFixed(1)}L</p>
          <p className="mb-4 text-xs" style={{ color: "var(--muted)" }}>of {calc.waterLiters}L goal</p>
          <div className="flex gap-2">
            <button onClick={() => addWater(today, -0.25)} className="btn-secondary !px-3 !py-2"><Minus size={14} /></button>
            <button onClick={() => addWater(today, 0.25)} className="btn-primary flex-1 !py-2 text-sm"><Plus size={14} /> Add 250ml</button>
            <button onClick={() => addWater(today, 0.5)} className="btn-secondary !px-3 !py-2 text-sm">+500ml</button>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <Flame size={18} style={{ color: "var(--accent)" }} />
            <h3 className="font-semibold">Workout & Steps</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Steps" value={log.steps} onChange={(v) => upsertLog(today, { steps: v ?? 0 })} />
            <NumberField label="Workout kcal burned" value={log.workoutCaloriesBurned} onChange={(v) => upsertLog(today, { workoutCaloriesBurned: v ?? 0 })} />
          </div>
          <button
            onClick={() => upsertLog(today, { workoutCompleted: !log.workoutCompleted })}
            className={cn("mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold", log.workoutCompleted ? "text-white" : "")}
            style={log.workoutCompleted ? { backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))", borderColor: "transparent" } : { borderColor: "var(--card-border)" }}
          >
            <CheckCircle2 size={16} /> {log.workoutCompleted ? "Workout completed" : "Mark workout as done"}
          </button>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-4 font-semibold">Quick Add Food</h3>
        <div className="grid gap-3 sm:grid-cols-6">
          <input className="input-field sm:col-span-2" placeholder="Food name" value={quickAdd.name} onChange={(e) => setQuickAdd({ ...quickAdd, name: e.target.value })} />
          <input className="input-field" placeholder="kcal" value={quickAdd.calories} onChange={(e) => setQuickAdd({ ...quickAdd, calories: e.target.value })} />
          <input className="input-field" placeholder="Protein g" value={quickAdd.protein} onChange={(e) => setQuickAdd({ ...quickAdd, protein: e.target.value })} />
          <input className="input-field" placeholder="Carbs g" value={quickAdd.carbs} onChange={(e) => setQuickAdd({ ...quickAdd, carbs: e.target.value })} />
          <input className="input-field" placeholder="Fat g" value={quickAdd.fat} onChange={(e) => setQuickAdd({ ...quickAdd, fat: e.target.value })} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {SLOTS.map((s) => (
            <button key={s} onClick={() => setQuickAdd({ ...quickAdd, slot: s })} className={cn("chip", quickAdd.slot === s && "chip-active")}>
              {s}
            </button>
          ))}
          <button onClick={submitQuickAdd} className="btn-primary ml-auto !py-2 text-sm"><Plus size={14} /> Add</button>
        </div>

        {log.loggedFoods.length > 0 && (
          <div className="mt-5 flex flex-col gap-2">
            {log.loggedFoods.map((food) => (
              <div key={food.id} className="solid-card flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{food.foodName}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{food.slot} · {food.calories} kcal · {food.proteinG}g protein</p>
                </div>
                <button onClick={() => removeFood(today, food.id)} style={{ color: "var(--muted)" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-4 font-semibold">Body Metrics</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NumberField label="Weight" unit="kg" step={0.1} value={log.weightKg} onChange={(v) => upsertLog(today, { weightKg: v })} placeholder={`${profile.weightKg}`} />
          <NumberField label="Sleep" unit="hrs" step={0.5} value={log.sleepHours} onChange={(v) => upsertLog(today, { sleepHours: v })} placeholder={`${calc.sleepHours}`} />
          <NumberField label="Waist" unit="cm" value={log.waistCm} onChange={(v) => upsertLog(today, { waistCm: v })} />
          <NumberField label="Hip" unit="cm" value={log.hipCm} onChange={(v) => upsertLog(today, { hipCm: v })} />
          <NumberField label="Body Fat" unit="%" step={0.1} value={log.bodyFatPct} onChange={(v) => upsertLog(today, { bodyFatPct: v })} placeholder={profile.bodyFatPct ? `${profile.bodyFatPct}` : undefined} />
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-4 font-semibold">Mood & Energy</h3>
        <div className="mb-4 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => upsertLog(today, { mood: m.value })}
              className={cn("chip text-base", log.mood === m.value && "chip-active")}
            >
              {m.emoji} {m.value}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {ENERGY.map((e) => (
            <button
              key={e.value}
              onClick={() => upsertLog(today, { energy: e.value })}
              className={cn("chip", log.energy === e.value && "chip-active")}
            >
              {e.label} Energy
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-4 font-semibold">Habits</h3>
        <HabitGrid date={today} log={log} />
      </div>
    </div>
  );
}
