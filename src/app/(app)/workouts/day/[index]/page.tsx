import { ArrowLeft, ArrowRight, CheckCircle2, Info, Moon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatStrip } from "@/components/brand/Brand";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Chip";
import { ExerciseMedia } from "@/components/workouts/ExerciseMedia";
import { SwapButton } from "@/components/workouts/SwapButton";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { getExercise } from "@/lib/workouts/exercises";
import { formatDose, perHand } from "@/lib/workouts/format";
import { estimateDay } from "@/lib/workouts/load";
import type { Prescription } from "@/lib/workouts/types";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { latestWeight } from "@/server/services/progress";
import { canStartDay, getActiveProgram, getSession, programDay, programProgress } from "@/server/services/workouts";
import { buttonClass } from "@/components/ui/Button";

export const metadata = { title: "Workout day" };

export default async function WorkoutDayPage({ params }: PageProps<"/workouts/day/[index]">) {
  const { user, profile } = await requireOnboarded();
  const program = await getActiveProgram(user.id);
  if (!program) redirect("/workouts");
  const index = Number((await params).index);
  const day = Number.isInteger(index) ? programDay(program, index) : null;
  if (!day) notFound();
  const { t } = await getI18n();
  const [weight, session, prog] = await Promise.all([latestWeight(user.id), getSession(program.id, index), programProgress(program)]);
  const kg = weight?.weightKg ?? profile.weightKg ?? 70;
  const startable = day.kind !== "rest" && (session != null || canStartDay(program, prog, index));
  const est = estimateDay(day, kg);
  const original = program.days[index];
  const isSwapped = (p: Prescription) => [...original.warmup, ...original.main, ...original.cooldown].find((o) => o.slot === p.slot)?.exerciseId !== p.exerciseId;
  const hasLoads = day.main.some((m) => m.loadKg != null);
  const title = day.kind === "rest" ? t("wk.restDay") : day.kind === "recovery" ? t("wk.recoveryDay") : t(`wk.focus.${day.focus}` as MessageKey);

  const row = (p: Prescription, compact: boolean) => {
    const ex = getExercise(p.exerciseId);
    return (
      <li key={p.slot} className="flex items-center gap-3 py-2.5">
        <Link href={`/workouts/library/${ex.id}`} className="shrink-0">
          <ExerciseMedia exercise={ex} animate={false} className={compact ? "size-12 rounded-xl" : "size-16 rounded-2xl"} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/workouts/library/${ex.id}`} className="block leading-snug font-semibold hover:underline">
            {ex.name}
          </Link>
          <p className="text-sm text-muted tabular">
            {formatDose(p, ex, t("wk.perSide"))}
            {!compact && p.restSec > 0 && <> · {t("wk.restS", { n: p.restSec })}</>}
          </p>
          {p.loadKg != null && (
            <p className="mt-0.5 text-sm font-semibold text-forest tabular">
              {t("wk.suggestedKg", { kg: p.loadKg })}
              {perHand(ex) && ` ${t("wk.each")}`}
            </p>
          )}
        </div>
        {!compact && day.kind === "workout" && <SwapButton programId={program.id} dayIndex={index} slot={p.slot} name={ex.name} swapped={isSwapped(p)} />}
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <Link href="/workouts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
        <ArrowLeft className="size-4" aria-hidden /> {t("wk.title")}
      </Link>

      <header>
        <p className="text-sm font-semibold text-muted">
          {t("wk.dayOf", { n: index + 1, total: program.days.length })} · {t("wk.weekN", { n: day.week })}
        </p>
        <h1 className="mt-0.5 text-[1.9rem] leading-tight">{title}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge>{t(`wk.setting.${day.setting}`)}</Badge>
          {day.isIntro && <Badge tone="lime">{t("wk.intro")}</Badge>}
        </div>
      </header>

      {day.kind === "rest" ? (
        <Card className="flex items-start gap-4">
          <Moon className="mt-1 size-6 shrink-0 text-forest" aria-hidden />
          <p className="text-[15px] leading-relaxed text-ink-2">{t("wk.restDayBody")}</p>
        </Card>
      ) : (
        <>
          <StatStrip
            items={[
              { value: `~${est.minutes}`, label: t("common.min") },
              { value: `~${est.kcal}`, label: t("common.kcal") },
              { value: day.main.length, label: t("wk.exercises") },
            ]}
          />

          {day.warmup.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold">{t("wk.warmup")}</h2>
              <ul className="divide-y divide-line">{day.warmup.map((p) => row(p, true))}</ul>
            </Card>
          )}

          <Card>
            <h2 className="text-lg font-semibold">{day.kind === "recovery" ? t("wk.recoveryDay") : t("wk.main")}</h2>
            <ul className="divide-y divide-line">{day.main.map((p) => row(p, false))}</ul>
            {hasLoads && (
              <p className="mt-2 flex items-start gap-2 text-sm text-muted">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("wk.suggestedHelp")}
              </p>
            )}
          </Card>

          {day.cooldown.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold">{t("wk.cooldown")}</h2>
              <ul className="divide-y divide-line">{day.cooldown.map((p) => row(p, true))}</ul>
            </Card>
          )}

          {startable && (
            <div className="sticky bottom-24 z-20 lg:bottom-6">
              <Link href={`/workouts/session/${index}`} className={buttonClass("lime", "xl", "w-full shadow-[var(--shadow-lift)]")}>
                {session?.status === "completed" ? (
                  <>
                    <CheckCircle2 className="size-5" aria-hidden /> {t("wk.cal.completed")}
                  </>
                ) : (
                  <>
                    {session ? t("wk.continue") : t("wk.start")} <ArrowRight className="size-5" aria-hidden />
                  </>
                )}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
