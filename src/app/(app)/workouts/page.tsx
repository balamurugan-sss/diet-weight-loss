"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Flame, Moon } from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";
import { usePlanStore } from "@/lib/store/planStore";
import { generateWeeklyWorkoutPlan } from "@/lib/ai/workoutPlanner";
import { ExerciseCard } from "@/components/workouts/ExerciseCard";
import { cn } from "@/lib/utils";

export default function WorkoutsPage() {
  const profile = useUserStore((s) => s.profile);
  const workoutPlan = usePlanStore((s) => s.workoutPlan);
  const setWorkoutPlan = usePlanStore((s) => s.setWorkoutPlan);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    if (profile && !workoutPlan) {
      setWorkoutPlan(generateWeeklyWorkoutPlan(profile));
    }
  }, [profile, workoutPlan, setWorkoutPlan]);

  if (!profile) return null;

  function regenerate() {
    if (!profile) return;
    setWorkoutPlan(generateWeeklyWorkoutPlan(profile));
    setActiveDay(0);
  }

  if (!workoutPlan) {
    return (
      <div className="mx-auto max-w-5xl">
        <button onClick={regenerate} className="btn-primary">
          <RefreshCw size={16} /> Generate My Weekly Plan
        </button>
      </div>
    );
  }

  const day = workoutPlan.days[activeDay];
  const dayCalories = day.exercises.reduce((s, e) => s + e.caloriesBurned, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Weekly Workout Plan</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {workoutPlan.environment === "gym" ? "Gym" : "Home"} · {workoutPlan.level} · Week of {workoutPlan.weekOf}
          </p>
        </div>
        <button onClick={regenerate} className="btn-secondary !py-2 text-sm">
          <RefreshCw size={14} /> Regenerate
        </button>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {workoutPlan.days.map((d, i) => (
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
            <span className="mt-0.5 block text-[10px] font-normal opacity-80">{d.focus.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      <div className="glass-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{day.day} · {day.focus}</h2>
            {!day.isRestDay && (
              <p className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                <Flame size={14} /> ~{dayCalories} kcal burn estimate
              </p>
            )}
          </div>
          {day.isRestDay && (
            <span className="chip" style={{ color: "var(--accent-2)" }}>
              <Moon size={14} /> Recovery Day
            </span>
          )}
        </div>

        {day.isRestDay && (
          <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
            Light mobility work only. Prioritize sleep, hydration, and gentle stretching to recover.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {day.exercises.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
          {day.exercises.length === 0 && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>No exercises matched your filters for this day.</p>
          )}
        </div>
      </div>
    </div>
  );
}
