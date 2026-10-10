/** Daily goals for the Me tab tracker, with sensible defaults until the person sets their own. */
export const DEFAULT_GOALS = { steps: 8000, activeKcal: 400, sleepMin: 450 } as const;

export type DailyGoals = { steps: number; activeKcal: number; sleepMin: number };

export function goalsFor(p: { stepGoal: number | null; activeKcalGoal: number | null; sleepGoalMin: number | null }): DailyGoals {
  return { steps: p.stepGoal ?? DEFAULT_GOALS.steps, activeKcal: p.activeKcalGoal ?? DEFAULT_GOALS.activeKcal, sleepMin: p.sleepGoalMin ?? DEFAULT_GOALS.sleepMin };
}

/** 0–100, capped. */
export const pct = (value: number | null, goal: number) => (value == null || goal <= 0 ? 0 : Math.min(100, Math.round((value / goal) * 100)));
