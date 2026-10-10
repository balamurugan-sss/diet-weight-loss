"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tooltipStyle = { borderRadius: 14, border: "1px solid var(--color-line)", boxShadow: "var(--shadow-soft)", fontSize: 13 };
const axisTick = { fontSize: 12, fill: "var(--color-muted)" };
const short = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

export function WeightChart({ data, goal, label }: { data: { date: string; weightKg: number }[]; goal: number | null; label: string }) {
  const values = data.map((d) => d.weightKg).concat(goal ? [goal] : []);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);
  return (
    <div className="h-60 w-full" role="img" aria-label={label}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="date" tickFormatter={short} tickLine={false} axisLine={false} tick={axisTick} minTickGap={28} />
          <YAxis domain={[min, max]} tickLine={false} axisLine={false} tick={axisTick} width={36} />
          {goal && <ReferenceLine y={goal} stroke="var(--color-lime-600)" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `${goal} kg`, position: "insideTopRight", fontSize: 12, fill: "var(--color-forest)" }} />}
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => short(String(d))} formatter={(v) => [`${v} kg`, ""]} cursor={{ stroke: "var(--color-muted)" }} />
          <Line type="monotone" dataKey="weightKg" stroke="var(--color-forest)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-forest)", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CaloriesChart({ data, target, label }: { data: { date: string; kcal: number }[]; target: number; label: string }) {
  const top = Math.ceil(Math.max(target * 1.15, ...data.map((d) => d.kcal)) / 250) * 250;
  return (
    <div className="h-52 w-full" role="img" aria-label={label}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="date" tickFormatter={(d) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" })} tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis domain={[0, top]} tickLine={false} axisLine={false} tick={axisTick} width={40} />
          <ReferenceLine y={target} stroke="var(--color-forest)" strokeDasharray="4 4" strokeWidth={1.5} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => short(String(d))} formatter={(v) => [`${v} kcal`, ""]} cursor={{ fill: "var(--color-sand)" }} />
          <Bar dataKey="kcal" fill="var(--color-lime-600)" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WorkoutsChart({ data, target, label }: { data: { week: string; workouts: number }[]; target: number | null; label: string }) {
  const top = Math.max(target ?? 0, ...data.map((d) => d.workouts), 3) + 1;
  return (
    <div className="h-52 w-full" role="img" aria-label={label}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="week" tickFormatter={short} tickLine={false} axisLine={false} tick={axisTick} minTickGap={8} />
          <YAxis domain={[0, top]} allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} width={28} />
          {target && <ReferenceLine y={target} stroke="var(--color-forest)" strokeDasharray="4 4" strokeWidth={1.5} />}
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => short(String(d))} formatter={(v) => [`${v}`, ""]} cursor={{ fill: "var(--color-sand)" }} />
          <Bar dataKey="workouts" fill="var(--color-lime-600)" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StrengthChart({ data, label }: { data: { date: string; e1rm: number }[]; label: string }) {
  const values = data.map((d) => d.e1rm);
  const min = Math.max(0, Math.floor((Math.min(...values) - 5) / 5) * 5);
  const max = Math.ceil((Math.max(...values) + 5) / 5) * 5;
  return (
    <div className="h-56 w-full" role="img" aria-label={label}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="date" tickFormatter={short} tickLine={false} axisLine={false} tick={axisTick} minTickGap={28} />
          <YAxis domain={[min, max]} tickLine={false} axisLine={false} tick={axisTick} width={36} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => short(String(d))} formatter={(v) => [`${v} kg`, ""]} cursor={{ stroke: "var(--color-muted)" }} />
          <Line type="monotone" dataKey="e1rm" stroke="var(--color-forest)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-forest)", stroke: "var(--color-surface)", strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
