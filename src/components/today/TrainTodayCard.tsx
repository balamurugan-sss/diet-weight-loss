import { CheckCircle2, Dumbbell, Footprints, Moon, PencilLine, Play } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { ExerciseMedia } from "@/components/workouts/ExerciseMedia";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { TFunc } from "@/lib/i18n/t";
import { getExercise } from "@/lib/workouts/exercises";
import { estimateDay } from "@/lib/workouts/load";
import type { TodayOverview } from "@/server/services/today";
import { WorkoutTimeControl } from "./WorkoutTimeControl";

/** Today's training: set a time, start (goes straight into the session), resume, or edit what you did. */
export function TrainTodayCard({ o, kg, t }: { o: TodayOverview; kg: number; t: TFunc }) {
  const { program, plannedDay, session, position } = o.workout;
  if (!program) {
    return (
      <Link href="/workouts/setup" className="card flex items-center gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]">
        <span className="grid size-12 shrink-0 -skew-x-6 place-items-center rounded-lg bg-lime text-[#0a0c0e]">
          <Dumbbell className="size-6 skew-x-6" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-display text-xl font-extrabold uppercase">{t("wk.home.setupTitle")}</span>
          <span className="text-sm text-muted">{t("wk.home.setupBody")}</span>
        </span>
      </Link>
    );
  }

  const day = session?.day ?? plannedDay;
  const lead = day?.kind === "workout" ? getExercise(day.main[0].exerciseId) : null;
  const est = day && day.kind !== "rest" ? estimateDay(day, kg) : null;
  const title = !day
    ? t("wk.finished")
    : day.kind === "workout"
      ? `${t("wk.dayN", { n: (session?.dayIndex ?? position ?? 0) + 1 })} · ${t(`wk.focus.${day.focus}` as MessageKey)}`
      : day.kind === "recovery"
        ? t("wk.recoveryDay")
        : t("wk.restDay");
  const startHref = position != null && day && day.kind !== "rest" ? `/workouts/session/${session?.dayIndex ?? position}` : null;

  return (
    <section className="card overflow-hidden p-1.5" aria-labelledby="train-title">
      <div className="flex items-center gap-3 p-2.5">
        {lead && session?.status !== "completed" ? (
          <ExerciseMedia exercise={lead} animate={false} className="size-16 shrink-0 rounded-lg" />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-sand text-forest">
            {session?.status === "completed" ? <CheckCircle2 className="size-7" aria-hidden /> : day?.kind === "recovery" ? <Footprints className="size-7" aria-hidden /> : <Moon className="size-7" aria-hidden />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wider text-forest uppercase">{t("wk.today")}</p>
          <h2 id="train-title" className="truncate text-[1.45rem]">
            {title}
          </h2>
          {est && session?.status !== "completed" && (
            <p className="text-sm text-muted tabular">
              {t("wk.minutes", { n: est.minutes })} · {t("wk.kcal", { n: est.kcal })}
            </p>
          )}
          {session?.status === "completed" && (
            <p className="text-sm text-muted tabular">
              {t("wk.minutes", { n: Math.max(1, Math.round((session.durationSec ?? 0) / 60)) })} · {t("wk.kcal", { n: session.kcal ?? 0 })}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2.5 px-2.5 pb-2.5">
        {!session && day?.kind === "workout" && <WorkoutTimeControl plan={o.events.workout_plan ?? null} now={o.now} />}
        {!session && startHref && (
          <Link href={startHref} className={buttonClass("lime", "xl", "w-full")}>
            <Play className="size-5" aria-hidden /> {day?.kind === "recovery" ? t("today.startRecovery") : t("today.startWorkout")}
          </Link>
        )}
        {session?.status === "in_progress" && startHref && (
          <Link href={startHref} className={buttonClass("lime", "xl", "w-full")}>
            <Play className="size-5" aria-hidden /> {t("today.tl.resume")}
          </Link>
        )}
        {session?.status === "completed" && session.kind === "workout" && (
          <Link href={`/workouts/session/${session.dayIndex}/edit`} className={buttonClass("outline", "lg", "w-full")}>
            <PencilLine className="size-5" aria-hidden /> {t("today.edit.cta")}
          </Link>
        )}
        {day?.kind === "rest" && !session && <p className="px-1 text-sm text-muted">{t("today.restNote")}</p>}
      </div>
    </section>
  );
}
