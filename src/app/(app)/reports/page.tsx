"use client";

import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";
import { useTrackerStore } from "@/lib/store/trackerStore";
import { collectRecentLogs, buildNutritionReport, buildWorkoutReport, buildWeightLossReport } from "@/lib/reports";
import { generateWeeklySummary } from "@/lib/ai/insights";
import { cn } from "@/lib/utils";

type ReportTab = "weekly" | "monthly" | "weight-loss" | "nutrition" | "workout";

const TABS: { value: ReportTab; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "weight-loss", label: "Weight Loss" },
  { value: "nutrition", label: "Nutrition" },
  { value: "workout", label: "Workout" },
];

export default function ReportsPage() {
  const profile = useUserStore((s) => s.profile);
  const calc = useUserStore((s) => s.calculations);
  const logs = useTrackerStore((s) => s.logs);
  const [tab, setTab] = useState<ReportTab>("weekly");

  const weekLogs = useMemo(() => collectRecentLogs(logs, 7), [logs]);
  const monthLogs = useMemo(() => collectRecentLogs(logs, 30), [logs]);

  if (!profile || !calc) return null;

  const activeLogs = tab === "monthly" ? monthLogs : weekLogs;
  const nutrition = buildNutritionReport(activeLogs, calc);
  const workout = buildWorkoutReport(activeLogs);
  const weightLoss = buildWeightLossReport(profile, activeLogs.length > 0 ? activeLogs : weekLogs);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Auto-generated summaries from your tracked data.</p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary !py-2 text-sm">
          <Printer size={14} /> Export PDF
        </button>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 no-print">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setTab(t.value)} className={cn("chip shrink-0", tab === t.value && "chip-active")}>
            {t.label}
          </button>
        ))}
      </div>

      {(tab === "weekly" || tab === "monthly") && (
        <div className="glass-card p-6">
          <h2 className="mb-3 font-semibold">{tab === "weekly" ? "Weekly" : "Monthly"} Summary</h2>
          <p className="text-sm leading-relaxed">{generateWeeklySummary(activeLogs.length > 0 ? activeLogs : weekLogs, calc)}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Days Logged" value={`${nutrition.daysLogged}/${activeLogs.length}`} />
            <Stat label="Avg Calories" value={`${nutrition.avgCalories}`} />
            <Stat label="Avg Protein" value={`${nutrition.avgProtein}g`} />
            <Stat label="Workouts Done" value={`${workout.daysCompleted}`} />
          </div>
        </div>
      )}

      {tab === "weight-loss" && (
        <div className="glass-card p-6">
          <h2 className="mb-3 font-semibold">Weight Loss Report</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Start" value={`${weightLoss.startWeight}kg`} />
            <Stat label="Current" value={`${weightLoss.currentWeight}kg`} />
            <Stat label="Change" value={`${weightLoss.changeKg >= 0 ? "+" : ""}${weightLoss.changeKg}kg`} />
            <Stat label="Target" value={`${weightLoss.targetWeight}kg`} />
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs" style={{ color: "var(--muted)" }}>
              <span>Progress to goal</span>
              <span>{weightLoss.progressPct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--ring-track)" }}>
              <div className="h-full rounded-full gradient-primary" style={{ width: `${weightLoss.progressPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {tab === "nutrition" && (
        <div className="glass-card p-6">
          <h2 className="mb-3 font-semibold">Nutrition Report</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Avg Calories" value={`${nutrition.avgCalories}`} sub={`${nutrition.calorieAdherencePct}% of target`} />
            <Stat label="Avg Protein" value={`${nutrition.avgProtein}g`} sub={`${nutrition.proteinAdherencePct}% of target`} />
            <Stat label="Avg Carbs" value={`${nutrition.avgCarbs}g`} />
            <Stat label="Avg Fat" value={`${nutrition.avgFat}g`} />
            <Stat label="Days Logged" value={`${nutrition.daysLogged}`} />
          </div>
          {nutrition.topFoods.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Most Logged Foods</p>
              <div className="flex flex-col gap-2">
                {nutrition.topFoods.map((f) => (
                  <div key={f.name} className="solid-card flex items-center justify-between px-3 py-2 text-sm">
                    <span>{f.name}</span>
                    <span style={{ color: "var(--muted)" }}>{f.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "workout" && (
        <div className="glass-card p-6">
          <h2 className="mb-3 font-semibold">Workout Report</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Completed" value={`${workout.daysCompleted}/${workout.totalDays}`} />
            <Stat label="Completion" value={`${workout.completionPct}%`} />
            <Stat label="Calories Burned" value={`${workout.totalCaloriesBurned}`} />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="solid-card p-3">
      <p className="text-[11px] font-medium" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="text-lg font-bold gradient-text">{value}</p>
      {sub && <p className="text-[11px]" style={{ color: "var(--muted)" }}>{sub}</p>}
    </div>
  );
}
