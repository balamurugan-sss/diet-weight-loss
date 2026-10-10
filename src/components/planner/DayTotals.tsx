import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { MacroBar, ProgressRing } from "@/components/ui/ProgressRing";
import { cn } from "@/lib/cn";
import type { TFunc } from "@/lib/i18n/t";
import type { DayView } from "@/server/services/dayView";
import type { TargetsSnapshot } from "@/server/db/schema";

export function DayTotals({ view, targets, t }: { view: DayView; targets: TargetsSnapshot; t: TFunc }) {
  const tot = view.totals;
  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-center gap-5">
        <ProgressRing value={tot.kcal} max={targets.kcal} size={112} stroke={11} label={t("planner.dayTotals")}>
          <span className="text-2xl font-semibold tabular">{tot.kcal}</span>
          <span className="-mt-1 block text-xs text-muted">/ {targets.kcal}</span>
        </ProgressRing>
        <div className="flex-1 space-y-2.5">
          <MacroBar label={t("macro.protein")} value={tot.proteinG} target={targets.proteinG} color="var(--color-protein)" />
          {targets.netCarbLimitG ? (
            <MacroBar label={t("macro.netCarbs")} value={tot.netCarbsG} target={targets.netCarbLimitG} color="var(--color-carbs)" />
          ) : (
            <MacroBar label={t("macro.carbs")} value={tot.carbsG} target={targets.carbsG} color="var(--color-carbs)" />
          )}
          <MacroBar label={t("macro.fat")} value={tot.fatG} target={targets.fatG} color="var(--color-fat)" />
          <MacroBar label={t("macro.fibre")} value={tot.fibreG} target={targets.fibreG} color="var(--color-fibre)" />
        </div>
      </div>
      <div className="mt-4">
        {view.issues.length === 0 ? (
          <p className="flex items-center gap-2 rounded-2xl bg-forest-50 px-3 py-2 text-sm font-semibold text-forest">
            <CheckCircle2 className="size-4" aria-hidden /> {t("planner.withinTarget")} · ≈ ₹{tot.costInr}
          </p>
        ) : (
          <ul className="space-y-1.5" aria-label={t("planner.issues")}>
            {view.issues.map((i) => (
              <li
                key={i.code + i.message}
                className={cn(
                  "flex gap-2 rounded-2xl px-3 py-2 text-sm",
                  i.severity === "error" ? "bg-terracotta-100 text-terracotta" : i.severity === "warning" ? "bg-amber-100 text-amber-ink" : "bg-sand text-ink-2",
                )}
              >
                {i.severity === "info" ? <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />}
                {i.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
