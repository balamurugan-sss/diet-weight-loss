import { subDays } from "date-fns";
import type { DailyLogEntry } from "@/types";
import { dateKey } from "@/lib/utils";

export function computeWaterStreak(logs: Record<string, DailyLogEntry>, goalLiters: number): number {
  let streak = 0;
  let cursor = new Date();

  // if today hasn't hit the goal yet, start counting from yesterday so an in-progress day doesn't break the streak
  const todayLog = logs[dateKey(cursor)];
  if (!todayLog || todayLog.waterLiters < goalLiters) {
    cursor = subDays(cursor, 1);
  }

  while (true) {
    const log = logs[dateKey(cursor)];
    if (!log || log.waterLiters < goalLiters) break;
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return streak;
}
