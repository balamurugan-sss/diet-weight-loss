"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { format, subDays } from "date-fns";
import { useTrackerStore } from "@/lib/store/trackerStore";
import { dateKey } from "@/lib/utils";

export function WeeklyCaloriesChart({ targetCalories }: { targetCalories: number }) {
  const logs = useTrackerStore((s) => s.logs);

  const data = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = dateKey(d);
    return {
      day: format(d, "EEE"),
      calories: logs[key]?.caloriesConsumed ?? 0,
    };
  });

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "var(--card-solid)", border: "1px solid var(--card-border)", borderRadius: 12, fontSize: 12 }}
          />
          <ReferenceLine y={targetCalories} stroke="var(--accent)" strokeDasharray="4 4" />
          <Bar dataKey="calories" radius={[8, 8, 8, 8]} fill="var(--primary)" maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
