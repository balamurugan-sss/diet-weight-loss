"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingDown, Target, Scale } from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";
import { useTrackerStore } from "@/lib/store/trackerStore";
import { buildWeightSeries, type ProgressPoint, type ProgressRange } from "@/lib/progress";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS: { value: ProgressRange; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function ProgressPage() {
  const profile = useUserStore((s) => s.profile);
  const logs = useTrackerStore((s) => s.logs);
  const [range, setRange] = useState<ProgressRange>("daily");

  const series = useMemo(() => (profile ? buildWeightSeries(profile, logs, range) : []), [profile, logs, range]);

  if (!profile) return null;

  const startWeight = series[0]?.weightKg ?? profile.weightKg;
  const currentWeight = series[series.length - 1]?.weightKg ?? profile.weightKg;
  const change = currentWeight - startWeight;
  const hasBodyFat = series.some((p) => p.bodyFatPct !== undefined);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Progress</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Track your weight, BMI, and body composition over time</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummaryStat icon={Scale} label="Current" value={`${currentWeight.toFixed(1)}kg`} />
        <SummaryStat icon={TrendingDown} label="Change" value={`${change >= 0 ? "+" : ""}${change.toFixed(1)}kg`} accent={change <= 0 ? "var(--primary)" : "var(--accent)"} />
        <SummaryStat icon={Target} label="Target" value={`${profile.targetWeightKg}kg`} />
      </div>

      <div className="flex gap-2">
        {RANGE_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setRange(opt.value)} className={cn("chip", range === opt.value && "chip-active")}>
            {opt.label}
          </button>
        ))}
      </div>

      <ChartCard title="Weight Trend" unit="kg" data={series} dataKey="weightKg" />

      <ChartCard title="BMI Change" unit="" data={series} dataKey="bmi" color="var(--accent-2)" />

      {hasBodyFat && (
        <ChartCard title="Body Fat %" unit="%" data={series} dataKey="bodyFatPct" color="var(--accent)" />
      )}

      {series.length === 0 && (
        <div className="glass-card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          Log your weight in the Daily Tracker to start seeing trends here.
        </div>
      )}
    </div>
  );
}

function SummaryStat({ icon: Icon, label, value, accent = "var(--primary)" }: { icon: typeof Scale; label: string; value: string; accent?: string }) {
  return (
    <div className="glass-card p-4 text-center">
      <Icon size={18} className="mx-auto mb-1" style={{ color: accent }} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs" style={{ color: "var(--muted)" }}>{label}</p>
    </div>
  );
}

function ChartCard({
  title,
  unit,
  data,
  dataKey,
  color = "var(--primary)",
}: {
  title: string;
  unit: string;
  data: ProgressPoint[];
  dataKey: keyof ProgressPoint;
  color?: string;
}) {
  return (
    <div className="glass-card p-6">
      <h3 className="mb-3 font-semibold">
        {title} {unit && <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>({unit})</span>}
      </h3>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ring-track)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ background: "var(--card-solid)", border: "1px solid var(--card-border)", borderRadius: 12, fontSize: 12 }} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
