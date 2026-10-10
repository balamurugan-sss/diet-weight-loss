"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ProjectionPoint } from "@/lib/nutrition/targets";

export function ProjectionChart({
  points,
  targetKg,
  weekLabel,
  ariaLabel,
}: {
  points: ProjectionPoint[];
  targetKg: number;
  weekLabel: string;
  ariaLabel: string;
}) {
  const min = Math.floor(Math.min(targetKg, ...points.map((p) => p.fast)) - 1);
  const max = Math.ceil(Math.max(...points.map((p) => p.slow)) + 1);
  return (
    <div className="h-56 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer>
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="0" />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted)" }} tickFormatter={(w) => `${w}`} interval="preserveStartEnd" minTickGap={24} />
          <YAxis domain={[min, max]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted)" }} width={36} tickFormatter={(v) => `${v}`} />
          <ReferenceLine y={targetKg} stroke="var(--color-forest)" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `${targetKg} kg`, position: "insideBottomRight", fontSize: 12, fill: "var(--color-forest)" }} />
          <Tooltip
            cursor={{ stroke: "var(--color-muted)", strokeWidth: 1 }}
            contentStyle={{ borderRadius: 14, border: "1px solid var(--color-line)", boxShadow: "var(--shadow-soft)", fontSize: 13 }}
            labelFormatter={(w) => `${weekLabel} ${w}`}
            formatter={(v) => {
              const [a, b] = v as unknown as [number, number];
              return [`${a}–${b} kg`, ""];
            }}
          />
          <Area type="monotone" dataKey={(d: ProjectionPoint) => [d.fast, d.slow]} stroke="var(--color-forest)" strokeWidth={2} fill="var(--color-lime)" fillOpacity={0.35} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
