import { ArrowRight, Headset, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { WeekStrip, type StripDay } from "@/components/program/WeekStrip";
import { WorkoutHero, type HeroAction } from "@/components/program/WorkoutHero";
import { CheckIns } from "@/components/today/CheckIns";
import { DayTimeline } from "@/components/today/DayTimeline";
import { WorkoutTimeControl } from "@/components/today/WorkoutTimeControl";
import { profileAge } from "@/lib/profile/health";
import { quickFoods } from "@/lib/today/quickFoods";
import { getExercise } from "@/lib/workouts/exercises";
import { dayTitle } from "@/lib/workouts/label";
import { estimateDay } from "@/lib/workouts/load";
import { addDays } from "@/lib/workouts/progress";
import type { ProgramDay } from "@/lib/workouts/types";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { approvedVideos } from "@/server/services/exerciseMedia";
import { intakeForDate } from "@/server/services/progress";
import { targetsForProfile } from "@/server/services/targets";
import { todayOverview } from "@/server/services/today";
import { bodyWeight, getActiveProgram, programDay, programProgress, trainingContext } from "@/server/services/workouts";
import { todayISO } from "@/server/time";

export const metadata = { title: "My program" };

/** Sunday-start week containing `iso`, as in the reference calendar strip. */
const weekOf = (iso: string) => addDays(iso, -new Date(iso + "T00:00:00Z").getUTCDay());

/**
 * My program: the week strip, today's (or the picked day's) workout as one big
 * card, then a single check-in and the day so far. Everything else lives in
 * Explore, Meals and Me.
 */
export default async function MyProgramPage({ searchParams }: PageProps<"/home">) {
  const { user, profile } = await requireOnboarded();
  const { t, lang } = await getI18n();
  const locale = lang === "ta" ? "ta-IN" : lang === "ml" ? "ml-IN" : "en-IN";
  const sp = await searchParams;
  const today = todayISO();
  const picked = typeof sp.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : today;
  const sunday = weekOf(today);

  const [program, intake, training, kg] = await Promise.all([
    getActiveProgram(user.id),
    intakeForDate(user.id, today),
    trainingContext(user.id, profile, today),
    bodyWeight(user.id, profile),
  ]);
  const targets = training?.adjusted ?? targetsForProfile(profile)!;
  const proteinLeft = Math.max(0, targets.proteinG - intake.proteinG);
  const [o, prog] = await Promise.all([todayOverview(user.id, profile, proteinLeft), program ? programProgress(program, [sunday, addDays(sunday, 6)]) : null]);

  const dow = new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" });
  const strip: StripDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(sunday, i);
    const cell = prog?.cells.find((c) => c.date === date);
    return {
      date,
      dow: dow.format(new Date(date + "T00:00:00Z")),
      num: Number(date.slice(8)),
      today: date === today,
      selected: date === picked,
      workout: cell?.kind === "workout",
      done: cell?.status === "completed",
    };
  });

  // The day to show: today's live state, or the program day planned for another date this week.
  const isToday = picked === today;
  const cell = prog?.cells.find((c) => c.date === picked);
  const session = isToday ? o.workout.session : null;
  const day: ProgramDay | null = isToday ? (session?.day ?? o.workout.plannedDay) : program && cell?.dayIndex != null ? programDay(program, cell.dayIndex) : null;
  const dayIndex = isToday ? (session?.dayIndex ?? o.workout.position) : (cell?.dayIndex ?? null);
  const lead = day?.kind === "workout" || day?.kind === "recovery" ? getExercise(day.main[0]?.exerciseId ?? day.warmup[0].exerciseId) : null;
  const videos = lead ? await approvedVideos([lead.id]) : {};
  const est = day && day.kind !== "rest" ? estimateDay(day, kg) : null;
  const noEquipment = day ? [...day.warmup, ...day.main, ...day.cooldown].every((p) => getExercise(p.exerciseId).equipment.length === 0) : false;
  const tags = day && program && day.kind !== "rest"
    ? [
        dayTitle(day, t),
        noEquipment ? t("tag.noEquipment") : t("tag.equipment"),
        t(`wk.level.${program.level}`),
        t(`wk.goal.${program.goal}`),
        t(`wk.loc.${day.setting}`),
        est ? (est.minutes <= 25 ? t("tag.short") : est.minutes <= 45 ? t("tag.medium") : t("tag.long")) : null,
      ].filter((x): x is string => !!x)
    : [];

  let action: HeroAction | null = null;
  if (!program) action = { href: "/workouts/setup", label: t("wk.home.setupTitle"), kind: "start" };
  else if (day && day.kind !== "rest" && dayIndex != null) {
    if (session?.status === "completed") action = day.kind === "workout" ? { href: `/workouts/session/${dayIndex}/edit`, label: t("today.edit.cta"), kind: "edit" } : null;
    else if (session?.status === "in_progress") action = { href: `/workouts/session/${dayIndex}`, label: t("today.tl.resume"), kind: "resume" };
    else if (isToday) action = { href: `/workouts/session/${dayIndex}`, label: day.kind === "recovery" ? t("today.startRecovery") : t("today.startWorkout"), kind: "start" };
    else action = { href: `/workouts/day/${dayIndex}`, label: t("program.preview"), kind: "view" };
  }

  const diet = profile.dietPreference ?? "vegetarian";
  const keto = targets.style === "keto";
  const allowSupplements = (profileAge(profile) ?? 30) >= 18 && !(profile.conditions ?? []).includes("kidney");
  const foods = {
    morning: quickFoods("morning", { diet, keto }),
    pre: quickFoods("pre", { diet, keto }),
    protein: quickFoods("protein", { diet, keto, allowSupplements }),
  };
  const startHref = o.workout.position != null && o.workout.plannedDay && o.workout.plannedDay.kind !== "rest" ? `/workouts/session/${o.workout.position}` : null;
  const icon = "grid size-11 place-items-center rounded-md text-lime hover:bg-sand";

  return (
    <div className="space-y-5">
      <header className="-mx-4 -mt-5 flex items-center justify-between bg-surface px-4 pt-4 sm:mx-0 sm:mt-0 sm:rounded-t-md">
        <span className="size-11" aria-hidden />
        <h1 className="text-[1.35rem] font-bold">{t("nav.home")}</h1>
        <span className="flex">
          <Link href="/settings#help" className={icon} aria-label={t("settings.help")}>
            <Headset className="size-6" aria-hidden />
          </Link>
          <Link href="/workouts/settings" className={icon} aria-label={t("program.settings")}>
            <SlidersHorizontal className="size-6" aria-hidden />
          </Link>
        </span>
      </header>
      <div className="-mt-5">
        <WeekStrip days={strip} label={t("program.week")} />
      </div>

      <section className="space-y-3">
        <h2 className="text-[1.75rem] leading-tight font-extrabold">
          {!program ? t("program.none") : day ? (day.kind === "rest" ? t("wk.restDay") : dayTitle(day, t)) : prog?.finished ? t("wk.finished") : t("wk.restDay")}
        </h2>
        <WorkoutHero
          lead={lead}
          video={lead ? videos[lead.id] : undefined}
          tags={tags}
          action={action}
          done={session?.status === "completed" ? t("program.done") : undefined}
          rest={!day || day.kind === "rest"}
          restLabel={program && (!day || day.kind === "rest") ? t("program.restBody") : undefined}
        />
      </section>

      {isToday && (
        <>
          {!session && day?.kind === "workout" && <WorkoutTimeControl plan={o.events.workout_plan ?? null} now={o.now} />}
          <CheckIns prompts={o.prompts.slice(0, 1)} now={o.now} deviceWake={o.deviceWake} workoutPlan={o.events.workout_plan ?? null} startHref={startHref} foods={foods} proteinLeftG={proteinLeft} />
          {o.timeline.length > 0 && <DayTimeline items={o.timeline} now={o.now} t={t} />}
        </>
      )}

      <section>
        <h2 className="mb-3 text-[1.5rem] font-extrabold">{t("program.perks")}</h2>
        <Link
          href="/explore"
          className="relative flex min-h-28 items-center justify-between overflow-hidden border border-line bg-surface px-5 [clip-path:polygon(0_0,92%_0,100%_22%,100%_100%,8%_100%,0_78%)] hover:border-lime/60"
        >
          <span className="pointer-events-none absolute -left-6 h-40 w-24 -skew-x-[20deg] bg-lime/80" aria-hidden />
          <span className="pointer-events-none absolute left-16 h-40 w-3 -skew-x-[20deg] bg-lime/50" aria-hidden />
          <span className="relative ml-auto flex items-center gap-2 text-right text-[1.35rem] font-bold text-lime">
            {t("program.guides")} <ArrowRight className="size-6" aria-hidden />
          </span>
        </Link>
      </section>
    </div>
  );
}
