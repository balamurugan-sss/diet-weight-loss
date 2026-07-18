"use client";

import { Sparkles, Salad, Dumbbell, HeartPulse, CalendarRange, Quote } from "lucide-react";
import { format, subDays } from "date-fns";
import { useUserStore } from "@/lib/store/userStore";
import { useDailyLog, useTrackerStore } from "@/lib/store/trackerStore";
import { usePlanStore } from "@/lib/store/planStore";
import { todayKey, dateKey } from "@/lib/utils";
import { quoteForDate } from "@/lib/data/quotes";
import {
  generateDailyInsight,
  generateMealImprovementTip,
  generateWorkoutSuggestion,
  generateRecoveryTip,
  generateWeeklySummary,
} from "@/lib/ai/insights";

export default function InsightsPage() {
  const profile = useUserStore((s) => s.profile);
  const calc = useUserStore((s) => s.calculations);
  const today = todayKey();
  const log = useDailyLog(today);
  const logs = useTrackerStore((s) => s.logs);
  const workoutPlan = usePlanStore((s) => s.workoutPlan);

  if (!profile || !calc) return null;

  const todayName = format(new Date(), "EEEE");
  const todaysWorkout = workoutPlan?.days.find((d) => d.day === todayName);
  const weekLogs = Array.from({ length: 7 }).map((_, i) => {
    const key = dateKey(subDays(new Date(), i));
    return logs[key] ?? { ...log, date: key, caloriesConsumed: 0, steps: 0, workoutCompleted: false };
  });

  const cards = [
    {
      icon: Sparkles,
      title: "Personalized Advice",
      color: "linear-gradient(135deg, var(--primary), var(--primary-2))",
      content: generateDailyInsight(profile, calc, log),
    },
    {
      icon: Quote,
      title: "Motivational Message",
      color: "linear-gradient(135deg, var(--accent), var(--accent-2))",
      content: quoteForDate(today),
    },
    {
      icon: Salad,
      title: "Meal Improvement",
      color: "linear-gradient(135deg, #22c55e, #0ea5b7)",
      content: generateMealImprovementTip(log, calc),
    },
    {
      icon: Dumbbell,
      title: "Workout Suggestion",
      color: "linear-gradient(135deg, #f59e0b, #fb7185)",
      content: generateWorkoutSuggestion(profile, log, todaysWorkout?.focus),
    },
    {
      icon: HeartPulse,
      title: "Recovery Tips",
      color: "linear-gradient(135deg, #8b5cf6, #6366f1)",
      content: generateRecoveryTip(profile.healthConditions),
    },
    {
      icon: CalendarRange,
      title: "Weekly Summary",
      color: "linear-gradient(135deg, #0ea5b7, #12b981)",
      content: generateWeeklySummary(weekLogs, calc),
    },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">AI Insights</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Fresh, personalized guidance generated from your data today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <div key={card.title} className="glass-card p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ backgroundImage: card.color }}>
                <card.icon size={16} />
              </div>
              <h3 className="text-sm font-semibold">{card.title}</h3>
            </div>
            <p className="text-sm leading-relaxed">{card.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
