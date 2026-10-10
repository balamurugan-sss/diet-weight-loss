import { ArrowRight, Lock, Scale, Target, TrendingDown, Watch } from "lucide-react";
import { CaloriesChart, StrengthChart, WeightChart, WorkoutsChart } from "@/components/charts/ProgressCharts";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { getExercise } from "@/lib/workouts/exercises";
import { getActiveProgram, strengthHistory, weeklyWorkoutCounts } from "@/server/services/workouts";
import { WaterTracker, WeightQuickLog } from "@/components/home/Trackers";
import { LinkButton } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { dailySeries, firstWeight, latestWeight, waterFor, weightHistory } from "@/server/services/progress";
import { targetsForProfile } from "@/server/services/targets";

export const metadata = { title: "Progress" };

export default async function ProgressPage({ searchParams }: PageProps<"/progress">) {
  const { user, profile } = await requireOnboarded();
  const { t } = await getI18n();
  const targets = targetsForProfile(profile)!;
  const sp = await searchParams;
  const [history, first, latest, week, water, workouts, strength, program] = await Promise.all([
    weightHistory(user.id, user.isPremium ? 365 : 60),
    firstWeight(user.id),
    latestWeight(user.id),
    dailySeries(user.id, 7),
    waterFor(user.id),
    weeklyWorkoutCounts(user.id, 8),
    strengthHistory(user.id),
    getActiveProgram(user.id),
  ]);
  const lifts = strength.slice(0, 5);
  const lift = lifts.find((l) => l.exerciseId === sp.lift) ?? lifts[0];
  const fmtWeek = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
  const goal = targets.effectiveTargetKg;
  const change = first && latest ? Math.round((latest.weightKg - first.weightKg) * 10) / 10 : 0;
  const toGo = goal && latest ? Math.max(0, Math.round((latest.weightKg - goal) * 10) / 10) : null;
  const pct = goal && first && latest && first.weightKg > goal ? Math.min(100, Math.max(0, ((first.weightKg - latest.weightKg) / (first.weightKg - goal)) * 100)) : 0;
  const logged = week.filter((d) => d.meals > 0);
  const nearTarget = logged.filter((d) => Math.abs(d.kcal - targets.kcal) <= targets.kcal * 0.12).length;
  const avgProtein = logged.length ? Math.round(logged.reduce((s, d) => s + d.proteinG, 0) / logged.length) : 0;
  const mealsLogged = week.reduce((s, d) => s + d.meals, 0);

  return (
    <div className="space-y-5">
      <PageHeader title={t("progress.title")} subtitle={t("progress.kind")} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <Scale className="size-8 text-forest" aria-hidden />
          <div>
            <p className="text-xs font-semibold text-muted">{t("progress.weight")}</p>
            <p className="text-2xl font-semibold tabular">{latest?.weightKg ?? profile.weightKg} kg</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <TrendingDown className="size-8 text-forest" aria-hidden />
          <div>
            <p className="text-xs font-semibold text-muted">{t("progress.change")}</p>
            <p className="text-2xl font-semibold tabular">{change > 0 ? "+" : ""}{change} kg</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <Target className="size-8 text-forest" aria-hidden />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted">{t("progress.toGo")}</p>
            <p className="text-2xl font-semibold tabular">{toGo !== null ? `${toGo} kg` : "—"}</p>
            {goal && (
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-sand-2" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemax={100} aria-label={t("progress.goal")}>
                <div className="h-full rounded-full bg-lime-600" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t("progress.weight")}</h2>
        {history.length >= 2 ? <WeightChart data={history} goal={goal} label={t("progress.weight")} /> : <p className="card-sand py-10 text-center text-muted">{t("progress.noData")}</p>}
        {history.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-semibold text-forest">Table</summary>
            <table className="mt-2 w-full text-left tabular">
              <tbody>
                {[...history].reverse().slice(0, 14).map((h) => (
                  <tr key={h.date} className="border-t border-line">
                    <td className="py-1.5">{h.date}</td>
                    <td className="py-1.5 text-right">{h.weightKg} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-1 text-lg font-semibold">{t("progress.calories")}</h2>
          <p className="mb-3 text-sm text-muted">
            {t("targets.daily")}: {targets.kcal} kcal
          </p>
          {logged.length ? <CaloriesChart data={week} target={targets.kcal} label={t("progress.calories")} /> : <p className="card-sand py-10 text-center text-muted">{t("progress.noData")}</p>}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-semibold">{t("progress.adherence")}</h2>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-sand/70 p-3">
              <dd className="text-2xl font-semibold tabular">{mealsLogged}</dd>
              <dt className="text-xs text-muted">{t("progress.mealsLogged")}</dt>
            </div>
            <div className="rounded-2xl bg-sand/70 p-3">
              <dd className="text-2xl font-semibold tabular">{nearTarget}/7</dd>
              <dt className="text-xs text-muted">{t("progress.daysOnTarget")}</dt>
            </div>
            <div className="rounded-2xl bg-sand/70 p-3">
              <dd className="text-2xl font-semibold tabular">{avgProtein} g</dd>
              <dt className="text-xs text-muted">{t("progress.avgProtein")}</dt>
            </div>
          </dl>
          <p className="mt-3 text-sm text-ink-2">{t("progress.kind")}</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="min-w-0">
          <h2 className="mb-1 text-lg font-semibold">{t("progress.workouts")}</h2>
          {program && <p className="mb-3 text-sm text-muted">{t("progress.workoutsTarget", { n: program.daysPerWeek })}</p>}
          {workouts.some((w) => w.workouts > 0) ? (
            <>
              <WorkoutsChart data={workouts} target={program?.daysPerWeek ?? null} label={t("progress.workouts")} />
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-semibold text-forest">Table</summary>
                <table className="mt-2 w-full text-left tabular">
                  <tbody>
                    {[...workouts].reverse().map((w) => (
                      <tr key={w.week} className="border-t border-line">
                        <td className="py-1.5">{t("progress.weekOf", { d: fmtWeek(w.week) })}</td>
                        <td className="py-1.5 text-right">{w.workouts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          ) : (
            <p className="card-sand py-10 text-center text-muted">{t("progress.noWorkouts")}</p>
          )}
        </Card>
        <Card className="min-w-0">
          <h2 className="mb-1 text-lg font-semibold">{t("progress.strength")}</h2>
          {lift ? (
            <>
              <p className="mb-2 text-sm text-muted">
                {t("progress.e1rm")} · {getExercise(lift.exerciseId).name}
              </p>
              {lifts.length > 1 && (
                <div className="no-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1">
                  {lifts.map((l) => (
                    <Link
                      key={l.exerciseId}
                      href={`/progress?lift=${l.exerciseId}`}
                      scroll={false}
                      aria-current={l === lift ? "true" : undefined}
                      className={cn(
                        "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-semibold",
                        l === lift ? "border-forest bg-forest text-on-accent" : "border-line bg-surface text-ink-2",
                      )}
                    >
                      {getExercise(l.exerciseId).name}
                    </Link>
                  ))}
                </div>
              )}
              {lift.points.length >= 2 ? (
                <StrengthChart data={lift.points} label={`${t("progress.strength")}: ${getExercise(lift.exerciseId).name}`} />
              ) : (
                <p className="card-sand py-8 text-center text-2xl font-semibold tabular">{lift.points[0].e1rm} kg</p>
              )}
            </>
          ) : (
            <p className="card-sand py-10 text-center text-muted">{t("progress.noStrength")}</p>
          )}
        </Card>
      </div>

      <Link href="/health" className="card flex items-center gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-water-100 text-water">
          <Watch className="size-6" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">{t("health.title")}</span>
          <span className="text-sm text-muted">{t("health.google.title")}</span>
        </span>
        <ArrowRight className="size-5 text-muted" aria-hidden />
      </Link>

      <div className="grid gap-5 sm:grid-cols-2">
        <WeightQuickLog current={latest?.weightKg ?? profile.weightKg} />
        <WaterTracker ml={water} goalMl={targets.waterMl} />
      </div>

      {!user.isPremium && (
        <Card className="flex flex-wrap items-center gap-3">
          <Lock className="size-5 text-forest" aria-hidden />
          <div className="min-w-[12rem] flex-1">
            <p className="font-semibold">{t("progress.advanced")}</p>
            <p className="text-sm text-muted">{t("progress.advancedPremium")}</p>
          </div>
          <LinkButton href="/subscription" variant="lime" size="sm">
            {t("sub.upgrade")}
          </LinkButton>
        </Card>
      )}
    </div>
  );
}
