import { ChartLine, Droplets, Flame, Footprints, Moon, PlusCircle, Settings, Zap } from "lucide-react";
import Link from "next/link";
import { WaterButton, WeightTrack } from "@/components/me/MeControls";
import { BodyPanel } from "@/components/today/BodyPanel";
import { cn } from "@/lib/cn";
import { goalsFor, pct } from "@/lib/today/goals";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { firstWeight, intakeForDate, latestWeight, waterFor } from "@/server/services/progress";
import { targetsForProfile } from "@/server/services/targets";
import { todayOverview } from "@/server/services/today";
import { getActiveProgram, programProgress, trainingContext, workoutTotals } from "@/server/services/workouts";
import { todayISO } from "@/server/time";
import { TopBar } from "@/components/ui/TopBar";

export const metadata = { title: "Me" };

/** Me: totals, weight, daily norms, the goal tracker (steps, active calories, sleep) and heart data from the watch. */
export default async function MePage() {
  const { user, profile } = await requireOnboarded();
  const { t } = await getI18n();
  const today = todayISO();
  const [totals, latest, first, water, program, training, intake] = await Promise.all([
    workoutTotals(user.id),
    latestWeight(user.id),
    firstWeight(user.id),
    waterFor(user.id, today),
    getActiveProgram(user.id),
    trainingContext(user.id, profile, today),
    intakeForDate(user.id, today),
  ]);
  const targets = training?.adjusted ?? targetsForProfile(profile)!;
  const o = await todayOverview(user.id, profile, Math.max(0, targets.proteinG - intake.proteinG));
  const prog = program ? await programProgress(program) : null;
  const goals = goalsFor(profile);

  const current = latest?.weightKg ?? profile.weightKg ?? null;
  const start = first?.weightKg ?? profile.weightKg ?? current;
  const target = profile.targetWeightKg ?? null;
  const left = current != null && target != null ? Math.round(Math.abs(current - target) * 10) / 10 : null;
  const span = start != null && target != null && start !== target ? Math.min(1, Math.max(0, (start - (current ?? start)) / (start - target))) : 0;

  const h = o.health.today;
  // Active calories: the watch's figure when it records one, otherwise what Movewell logged (workouts + cardio).
  const activeKcal = h?.activeKcal ?? (training?.burnedKcal || null);
  const sleep = o.health.latest?.sleepMinutes ?? null;
  const hm = (min: number) => t("health.hm", { h: Math.floor(min / 60), m: min % 60 });
  const trackers = [
    { icon: Footprints, label: t("health.steps"), value: h?.steps != null ? h.steps.toLocaleString("en-IN") : "—", goal: goals.steps.toLocaleString("en-IN"), p: pct(h?.steps ?? null, goals.steps) },
    { icon: Zap, label: t("me.activeKcal"), value: activeKcal != null ? `${activeKcal}` : "—", goal: `${goals.activeKcal} kcal`, p: pct(activeKcal, goals.activeKcal) },
    { icon: Moon, label: t("health.sleep"), value: sleep != null ? hm(sleep) : "—", goal: hm(goals.sleepMin), p: pct(sleep, goals.sleepMin) },
    { icon: Droplets, label: t("me.water"), value: `${(water / 1000).toFixed(1)} l`, goal: `${(targets.waterMl / 1000).toFixed(1)} l`, p: pct(water, targets.waterMl) },
  ];
  const row = "flex items-center gap-4 rounded-md bg-surface p-4";

  return (
    <div className="space-y-6">
      <TopBar
        title={t("nav.me")}
        action={
          <Link href="/settings" className="grid size-12 place-items-center text-lime" aria-label={t("nav.settings")}>
            <Settings className="size-6" aria-hidden />
          </Link>
        }
      />

      <dl className="grid grid-cols-3 divide-x divide-line rounded-md border-2 border-lime/80 bg-surface py-4 text-center">
        {[
          [totals.workouts, t("me.workouts")],
          [totals.minutes, t("me.minutes")],
          [prog?.streak ?? 0, t("me.streak")],
        ].map(([v, l]) => (
          <div key={String(l)}>
            <dd className="text-[1.9rem] leading-none font-extrabold tabular">{v}</dd>
            <dt className="mt-1.5 text-[11px] font-bold tracking-[0.1em] text-muted uppercase">{l}</dt>
          </div>
        ))}
      </dl>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[1.35rem] font-bold">{t("me.weight")}</h2>
          <Link href="/progress" className="font-semibold text-lime">
            {t("me.logs")}
          </Link>
        </div>
        <WeightTrack current={current} left={left} />
        <Link href="/progress" className={cn(row, "hover:bg-sand")}>
          <span className="flex-1">
            <span className="relative block h-0.5 bg-lime" style={{ width: "100%" }} aria-hidden>
              <span className="absolute -top-1.5 -left-1 size-3.5 rounded-full border-2 border-lime bg-surface" />
              <span className="absolute -top-1.5 size-3.5 rounded-full bg-lime" style={{ left: `calc(${Math.round(span * 100)}% - 0.4rem)` }} />
            </span>
            <span className="mt-3 flex justify-between text-[11px] font-bold tracking-[0.1em] text-muted uppercase">
              <span>
                {t("me.start")} {start ?? "—"} kg
              </span>
              <span>
                {t("me.now")} {current ?? "—"} kg
              </span>
            </span>
          </span>
          <span className="flex flex-col items-center gap-1 border-l border-line pl-4 text-sm font-semibold text-lime">
            <ChartLine className="size-6" aria-hidden /> {t("me.graph")}
          </span>
        </Link>
      </section>

      <section className="space-y-2">
        <div className={row}>
          <span className="grid size-12 place-items-center rounded-sm bg-sand text-lime">
            <Flame className="size-6" aria-hidden />
          </span>
          <span>
            <span className="block text-sm text-ink-2">{t("me.calorieNorm")}</span>
            <span className="text-[1.5rem] font-extrabold tabular">{targets.kcal} kcal</span>
          </span>
        </div>
        <div className={row}>
          <span className="grid size-12 place-items-center rounded-sm bg-sand text-water">
            <Droplets className="size-6" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-sm text-ink-2">{t("me.waterIntake")}</span>
            <span className="text-[1.5rem] font-extrabold tabular">
              {(water / 1000).toFixed(2)} <span className="text-base font-semibold text-muted">/ {(targets.waterMl / 1000).toFixed(1)} l</span>
            </span>
          </span>
          <WaterButton label={t("home.addWater")} />
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[1.35rem] font-bold">{t("me.tracker")}</h2>
          <Link href="/me/goals" className="font-semibold text-lime">
            {t("me.setGoals")}
          </Link>
        </div>
        <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
          {trackers.map(({ icon: Icon, label, value, goal, p }) => (
            <li key={label} className="w-40 shrink-0 rounded-md bg-surface p-4 sm:w-auto">
              <p className="flex items-center gap-1.5 text-sm font-bold">
                <Icon className="size-4 text-lime" aria-hidden /> {label}
              </p>
              <p className="mt-2 text-[1.4rem] font-extrabold tabular">{value}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-2" aria-hidden>
                <span className="block h-full bg-lime" style={{ width: `${p}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-muted tabular">
                {t("me.ofGoal", { goal })} · {p}%
              </p>
            </li>
          ))}
        </ul>
        {!o.health.connected.any && (
          <Link href="/me/sync/google" className="flex items-center gap-3 rounded-md bg-surface p-4 hover:bg-sand">
            <PlusCircle className="size-6 text-lime" aria-hidden />
            <span className="flex-1">
              <span className="block font-semibold">{t("me.connectTitle")}</span>
              <span className="text-sm text-muted">{t("me.connectBody")}</span>
            </span>
          </Link>
        )}
      </section>

      {o.health.connected.any && <BodyPanel health={o.health} t={t} />}
    </div>
  );
}
