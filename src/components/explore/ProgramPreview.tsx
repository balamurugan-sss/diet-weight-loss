import { Moon } from "lucide-react";
import Link from "next/link";
import { ExerciseFigure } from "@/components/workouts/ExerciseFigure";
import type { TFunc } from "@/lib/i18n/t";
import { getExercise } from "@/lib/workouts/exercises";
import { formatDose } from "@/lib/workouts/format";
import type { ProgramDay } from "@/lib/workouts/types";

/** "What's inside": every day of a guide program — its exercises and doses — before you start it. */
export function ProgramPreview({ days, t }: { days: ProgramDay[]; t: TFunc }) {
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, w) => days.slice(w * 7, w * 7 + 7));
  return (
    <section aria-labelledby="inside-title" className="space-y-2">
      <h2 id="inside-title" className="border-b-2 border-line pb-2 text-[1.3rem] font-bold">
        {t("explore.inside")}
      </h2>
      {weeks.map((week, w) => (
        <details key={w} open={w === 0} className="group rounded-md bg-surface">
          <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between px-4 font-bold">
            <span>{t("wk.weekN", { n: w + 1 })}</span>
            <span className="text-sm font-medium text-muted">{t("explore.weekSummary", { n: week.filter((d) => d.kind === "workout").length })}</span>
          </summary>
          <ol className="divide-y divide-line border-t border-line">
            {week.map((d) => (
              <li key={d.index} className="px-4 py-3">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">
                    {t("wk.dayN", { n: d.index + 1 })} · {d.title ?? (d.kind === "rest" ? t("wk.restDay") : t("wk.recoveryDay"))}
                  </span>
                  {d.kind !== "rest" && <span className="shrink-0 text-sm text-muted tabular">{t("wk.minutes", { n: d.estMinutes })}</span>}
                </p>
                {d.kind === "rest" ? (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                    <Moon className="size-4" aria-hidden /> {t("explore.restBody")}
                  </p>
                ) : (
                  <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {d.main.map((p) => {
                      const ex = getExercise(p.exerciseId);
                      return (
                        <li key={p.slot}>
                          <Link href={`/workouts/library/${ex.id}`} className="flex items-center gap-2.5 rounded-sm bg-sand p-2 hover:bg-sand-2">
                            <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface">
                              <ExerciseFigure pattern={ex.pattern} label="" animate={false} className="size-9" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold">{ex.name}</span>
                              <span className="block text-xs text-muted tabular">{formatDose(p, ex, t("wk.perSide"))}</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </details>
      ))}
    </section>
  );
}
