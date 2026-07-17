import { format, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import type { DailyLogEntry, UserProfile } from "@/types";
import { calculateBMI } from "@/lib/calculations";

export type ProgressRange = "daily" | "weekly" | "monthly" | "yearly";

export interface ProgressPoint {
  key: string;
  label: string;
  date: Date;
  weightKg: number;
  bmi: number;
  bodyFatPct?: number;
}

function collectRawPoints(profile: UserProfile, logs: Record<string, DailyLogEntry>): { date: Date; weightKg: number; bodyFatPct?: number }[] {
  const points = new Map<string, { date: Date; weightKg: number; bodyFatPct?: number }>();

  const createdDate = new Date(profile.createdAt);
  points.set(format(createdDate, "yyyy-MM-dd"), { date: createdDate, weightKg: profile.weightKg, bodyFatPct: profile.bodyFatPct });

  for (const [key, log] of Object.entries(logs)) {
    if (log.weightKg) {
      points.set(key, { date: new Date(key), weightKg: log.weightKg, bodyFatPct: log.bodyFatPct });
    }
  }

  return Array.from(points.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function bucketKey(date: Date, range: ProgressRange): { key: string; label: string; bucketDate: Date } {
  switch (range) {
    case "weekly": {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      return { key: format(start, "yyyy-MM-dd"), label: format(start, "MMM d"), bucketDate: start };
    }
    case "monthly": {
      const start = startOfMonth(date);
      return { key: format(start, "yyyy-MM"), label: format(start, "MMM yyyy"), bucketDate: start };
    }
    case "yearly": {
      const start = startOfYear(date);
      return { key: format(start, "yyyy"), label: format(start, "yyyy"), bucketDate: start };
    }
    default:
      return { key: format(date, "yyyy-MM-dd"), label: format(date, "MMM d"), bucketDate: date };
  }
}

const RANGE_LIMIT: Record<ProgressRange, number> = {
  daily: 14,
  weekly: 8,
  monthly: 12,
  yearly: 5,
};

export function buildWeightSeries(profile: UserProfile, logs: Record<string, DailyLogEntry>, range: ProgressRange): ProgressPoint[] {
  const raw = collectRawPoints(profile, logs);
  if (raw.length === 0) return [];

  const buckets = new Map<string, { label: string; date: Date; weights: number[]; bodyFats: number[] }>();

  for (const point of raw) {
    const { key, label, bucketDate } = bucketKey(point.date, range);
    const bucket = buckets.get(key) ?? { label, date: bucketDate, weights: [], bodyFats: [] };
    bucket.weights.push(point.weightKg);
    if (point.bodyFatPct) bucket.bodyFats.push(point.bodyFatPct);
    buckets.set(key, bucket);
  }

  const series = Array.from(buckets.entries())
    .map(([key, bucket]) => {
      const avgWeight = bucket.weights.reduce((s, w) => s + w, 0) / bucket.weights.length;
      const avgBodyFat = bucket.bodyFats.length > 0 ? bucket.bodyFats.reduce((s, b) => s + b, 0) / bucket.bodyFats.length : undefined;
      return {
        key,
        label: bucket.label,
        date: bucket.date,
        weightKg: Math.round(avgWeight * 10) / 10,
        bmi: calculateBMI(avgWeight, profile.heightCm),
        bodyFatPct: avgBodyFat,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return series.slice(-RANGE_LIMIT[range]);
}
