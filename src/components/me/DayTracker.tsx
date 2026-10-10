import { Droplets, Footprints, Moon, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { TFunc } from "@/lib/i18n/t";
import { pct, type DailyGoals } from "@/lib/today/goals";

type Intake = { kcal: number; proteinG: number; carbsG: number; fatG: number; fibreG: number };

/**
 * The day against its goals: movement (steps, active calories, sleep, water)
 * and food (calories, protein, carbs, fat, fibre vs targets), with one plain
 * line on what's furthest behind.
 */
export function DayTracker({
  t,
  goals,
  steps,
  activeKcal,
  sleepMin,
  waterMl,
  waterGoalMl,
  intake,
  targets,
}: {
  t: TFunc;
  goals: DailyGoals;
  steps: number | null;
  activeKcal: number | null;
  sleepMin: number | null;
  waterMl: number;
  waterGoalMl: number;
  intake: Intake;
  targets: Intake;
}) {
  const hm = (min: number) => t("health.hm", { h: Math.floor(min / 60), m: min % 60 });
  const move = [
    { icon: Footprints, label: t("health.steps"), value: steps != null ? steps.toLocaleString("en-IN") : "—", goal: goals.steps.toLocaleString("en-IN"), p: pct(steps, goals.steps) },
    { icon: Zap, label: t("me.activeKcal"), value: activeKcal != null ? `${activeKcal}` : "—", goal: `${goals.activeKcal} kcal`, p: pct(activeKcal, goals.activeKcal) },
    { icon: Moon, label: t("health.sleep"), value: sleepMin != null ? hm(sleepMin) : "—", goal: hm(goals.sleepMin), p: pct(sleepMin, goals.sleepMin) },
    { icon: Droplets, label: t("me.water"), value: `${(waterMl / 1000).toFixed(1)} l`, goal: `${(waterGoalMl / 1000).toFixed(1)} l`, p: pct(waterMl, waterGoalMl) },
  ];
  const food: { key: keyof Intake; label: string; unit: string; color: string }[] = [
    { key: "kcal", label: t("macro.calories"), unit: "kcal", color: "var(--color-lime)" },
    { key: "proteinG", label: t("macro.protein"), unit: "g", color: "var(--color-protein)" },
    { key: "carbsG", label: t("macro.carbs"), unit: "g", color: "var(--color-carbs)" },
    { key: "fatG", label: t("macro.fat"), unit: "g", color: "var(--color-fat)" },
    { key: "fibreG", label: t("macro.fibre"), unit: "g", color: "var(--color-fibre)" },
  ];
  // The one thing furthest behind (protein and steps matter most for the plan).
  const gaps = [
    { p: pct(intake.proteinG, targets.proteinG), text: t("tracker.gap.protein", { g: Math.max(0, targets.proteinG - intake.proteinG) }) },
    { p: pct(steps, goals.steps), text: t("tracker.gap.steps", { n: Math.max(0, goals.steps - (steps ?? 0)).toLocaleString("en-IN") }) },
    { p: pct(waterMl, waterGoalMl), text: t("tracker.gap.water", { ml: Math.max(0, waterGoalMl - waterMl) }) },
  ].filter((g) => g.p < 100);
  const behind = gaps.sort((a, b) => a.p - b.p)[0];

  return (
    <section aria-labelledby="tracker-title" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 id="tracker-title" className="text-[1.5rem] font-extrabold">
          {t("me.tracker")}
        </h2>
        <Link href="/me/goals" className="font-semibold text-lime">
          {t("me.setGoals")}
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {move.map(({ icon: Icon, label, value, goal, p }) => (
          <li key={label} className="rounded-md bg-surface p-3.5">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <Icon className="size-4 text-lime" aria-hidden /> {label}
            </p>
            <p className="mt-1.5 text-[1.3rem] font-extrabold tabular">{value}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-2" aria-hidden>
              <span className="block h-full bg-lime" style={{ width: `${p}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted tabular">
              {t("me.ofGoal", { goal })} · {p}%
            </p>
          </li>
        ))}
      </ul>
      <div className="rounded-md bg-surface p-4">
        <p className="mb-3 text-sm font-bold">{t("tracker.food")}</p>
        <ul className="space-y-2.5">
          {food.map(({ key, label, unit, color }) => {
            const p = pct(intake[key], targets[key]);
            return (
              <li key={key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink-2">{label}</span>
                  <span className={cn("font-semibold tabular", intake[key] > targets[key] * 1.1 && key !== "proteinG" && key !== "fibreG" && "text-amber-ink")}>
                    {Math.round(intake[key])} / {Math.round(targets[key])} {unit}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand-2" aria-hidden>
                  <span className="block h-full" style={{ width: `${p}%`, background: color }} />
                </div>
              </li>
            );
          })}
        </ul>
        {behind && <p className="mt-3 rounded-sm bg-sand px-3 py-2 text-sm text-ink-2">{behind.text}</p>}
      </div>
    </section>
  );
}
