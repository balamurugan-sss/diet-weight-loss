"use client";

import { Check } from "lucide-react";
import { HABIT_KEYS, HABIT_LABELS, useTrackerStore } from "@/lib/store/trackerStore";
import type { DailyLogEntry } from "@/types";
import { cn } from "@/lib/utils";

export function HabitGrid({ date, log }: { date: string; log: DailyLogEntry }) {
  const toggleHabit = useTrackerStore((s) => s.toggleHabit);

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {HABIT_KEYS.map((key) => {
        const active = !!log.habits[key];
        return (
          <button
            key={key}
            onClick={() => toggleHabit(date, key)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all",
              active ? "text-white" : ""
            )}
            style={
              active
                ? { backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))", borderColor: "transparent" }
                : { borderColor: "var(--card-border)", background: "var(--card)" }
            }
          >
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
              style={{ borderColor: active ? "white" : "var(--muted)" }}
            >
              {active && <Check size={10} />}
            </span>
            {HABIT_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}
