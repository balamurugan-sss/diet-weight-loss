"use client";

import Link from "next/link";
import { Droplets, Footprints, Activity, Flame, Sparkles, Plus, ArrowRight } from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";
import { useTrackerStore, useDailyLog } from "@/lib/store/trackerStore";
import { usePlanStore } from "@/lib/store/planStore";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { MacroBar } from "@/components/dashboard/MacroBar";
import { StatTile } from "@/components/dashboard/StatTile";
import { WeeklyCaloriesChart } from "@/components/dashboard/WeeklyCaloriesChart";
import { todayKey } from "@/lib/utils";
import { quoteForDate } from "@/lib/data/quotes";
import { generateDailyInsight, calculateDailyScore } from "@/lib/ai/insights";
import { format } from "date-fns";

export default function DashboardPage() {
  const profile = useUserStore((s) => s.profile);
  const calc = useUserStore((s) => s.calculations);
  const today = todayKey();
  const log = useDailyLog(today);
  const addWater = useTrackerStore((s) => s.addWater);
  const workoutPlan = usePlanStore((s) => s.workoutPlan);

  if (!profile || !calc) return null;

  const todayName = format(new Date(), "EEEE");
  const todaysWorkout = workoutPlan?.days.find((d) => d.day === todayName);

  const caloriePct = (log.caloriesConsumed / calc.dailyCalories) * 100;
  const score = calculateDailyScore(log, calc);
  const insight = generateDailyInsight(profile, calc, log);
  const quote = quoteForDate(today);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="glass-card flex flex-col items-center justify-center gap-3 p-6 lg:col-span-1">
          <ProgressRing
            value={caloriePct}
            size={140}
            label={`${Math.max(calc.dailyCalories - log.caloriesConsumed, 0)}`}
            sublabel="kcal left"
          />
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {log.caloriesConsumed} / {calc.dailyCalories} kcal consumed
          </p>
        </div>

        <div className="glass-card grid grid-cols-2 gap-4 p-6 lg:col-span-2">
          <StatTile icon={Activity} label="BMI" value={`${calc.bmi}`} sub={calc.bmiCategory} accent="linear-gradient(135deg, var(--primary), var(--primary-2))" />
          <StatTile icon={Sparkles} label="Daily Score" value={`${score}`} sub="/ 100" accent="linear-gradient(135deg, var(--accent), var(--accent-2))" />
          <StatTile icon={Footprints} label="Steps" value={`${log.steps.toLocaleString()}`} sub={`goal ${calc.recommendedSteps.toLocaleString()}`} />
          <StatTile icon={Droplets} label="Water" value={`${log.waterLiters.toFixed(1)}L`} sub={`goal ${calc.waterLiters}L`} accent="linear-gradient(135deg, #38bdf8, #0ea5b7)" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Today&apos;s Macros</h3>
            <Link href="/tracker" className="text-xs font-medium" style={{ color: "var(--primary-2)" }}>
              Log food <ArrowRight size={12} className="inline" />
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <MacroBar label="Protein" current={log.proteinG} target={calc.proteinG} color="var(--primary)" />
            <MacroBar label="Carbs" current={log.carbsG} target={calc.carbsG} color="var(--accent-2)" />
            <MacroBar label="Fat" current={log.fatG} target={calc.fatG} color="var(--accent)" />
          </div>
        </div>

        <div className="glass-card flex flex-col justify-between p-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Droplets size={16} style={{ color: "var(--primary-2)" }} />
              <h3 className="font-semibold">Water Intake</h3>
            </div>
            <p className="text-2xl font-bold gradient-text">{log.waterLiters.toFixed(1)}L</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>of {calc.waterLiters}L goal</p>
          </div>
          <button onClick={() => addWater(today, 0.25)} className="btn-secondary mt-4 w-full !py-2 text-sm">
            <Plus size={14} /> Add 250ml
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={16} style={{ color: "var(--accent-2)" }} />
            <h3 className="font-semibold">AI Recommendation</h3>
          </div>
          <p className="text-sm leading-relaxed">{insight}</p>
        </div>
        <div className="glass-card flex flex-col justify-center p-6" style={{ backgroundImage: "linear-gradient(135deg, rgba(18,185,129,0.12), rgba(139,92,246,0.12))" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Motivation</p>
          <p className="mt-2 text-sm font-medium leading-relaxed">&ldquo;{quote}&rdquo;</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <TodaySection title="Today's Meals" href="/meals" emptyText="No meal plan yet. Generate your personalized weekly plan." icon={Flame} />
        <TodaySection
          title="Today's Workout"
          href="/workouts"
          emptyText="No workout plan yet. Build your weekly training split."
          icon={Activity}
          summary={
            todaysWorkout
              ? todaysWorkout.isRestDay
                ? "Recovery day — light mobility & stretching."
                : `${todaysWorkout.focus} · ${todaysWorkout.exercises.length} exercises · ~${todaysWorkout.exercises.reduce((s, e) => s + e.caloriesBurned, 0)} kcal burn`
              : undefined
          }
        />
      </div>

      <div className="glass-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Weekly Progress</h3>
          <Link href="/progress" className="text-xs font-medium" style={{ color: "var(--primary-2)" }}>
            Full progress <ArrowRight size={12} className="inline" />
          </Link>
        </div>
        <WeeklyCaloriesChart targetCalories={calc.dailyCalories} />
      </div>
    </div>
  );
}

function TodaySection({
  title,
  href,
  emptyText,
  icon: Icon,
  summary,
}: {
  title: string;
  href: string;
  emptyText: string;
  icon: typeof Flame;
  summary?: string;
}) {
  return (
    <div className="glass-card p-6">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} style={{ color: "var(--primary)" }} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{summary ?? emptyText}</p>
      <Link href={href} className="btn-primary mt-4 !py-2 text-sm">
        View {title} <ArrowRight size={14} />
      </Link>
    </div>
  );
}
