import { CheckCircle2, Headset, Moon, Play, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { DayTracker } from "@/components/me/DayTracker";
import { WeekStrip, type StripDay } from "@/components/program/WeekStrip";
import { ExerciseFigure } from "@/components/workouts/ExerciseFigure";
import { goalsFor } from "@/lib/today/goals";
import { WorkoutHero, type HeroAction } from "@/components/program/WorkoutHero";
import { AnnouncementCard } from "@/components/today/AnnouncementCard";
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
import { currentAnnouncement } from "@/server/services/announcements";
import { approvedVideos } from "@/server/services/exerciseMedia";
import { intakeForDate, waterFor } from "@/server/services/progress";
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

  const [program, intake, training, kg, news] = await Promise.all([
    getActiveProgram(user.id),
    intakeForDate(user.id, today),
    trainingContext(user.id, profile, today),
    bodyWeight(user.id, profile),
    currentAnnouncement(user.id, user.isPremium),
  ]);
  const targets = training?.adjusted ?? targetsForProfile(profile)!;
  const proteinLeft = Math.max(0, targets.proteinG - intake.proteinG);
  const [o, prog, water] = await Promise.all([
    todayOverview(user.id, profile, proteinLeft),
    program ? programProgress(program, [sunday, addDays(sunday, 6)]) : null,
    waterFor(user.id, today),
  ]);
  // Alongside programs ("Add to my day"): this week's calendar for each, for the strip and the cards.
  const sideWeeks = await Promise.all(o.side.map((x) => programProgress(x.program, [sunday, addDays(sunday, 6)])));

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
      extra: sideWeeks.some((w) => w.cells.some((c) => c.date === date && c.status === "completed"))
        ? "done"
        : sideWeeks.some((w) => w.cells.some((c) => c.date === date && c.kind === "workout" && c.status !== "missed"))
          ? "planned"
          : null,
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
      {news && <AnnouncementCard key={news.id} id={news.id} title={news.title} body={news.body} link={news.link} />}

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

      {o.side.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[1.3rem] font-extrabold">{t("program.alsoToday")}</h2>
          <ul className="space-y-2">
            {o.side.map((x, n) => {
              const c = isToday ? null : sideWeeks[n].cells.find((cc) => cc.date === picked);
              const di = isToday ? x.dayIndex : (c?.dayIndex ?? null);
              const d = di != null ? programDay(x.program, di) : null;
              const doneHere = isToday ? x.session?.status === "completed" : c?.status === "completed";
              const q = `?p=${x.program.id}`;
              const href = d && d.kind !== "rest" && di != null ? (isToday && !doneHere ? `/workouts/session/${di}${q}` : `/workouts/day/${di}${q}`) : null;
              const est = d && d.kind !== "rest" ? estimateDay(d, kg) : null;
              return (
                <li key={x.program.id} className="flex items-center gap-3 rounded-md bg-surface p-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-sm bg-sand">
                    {d && d.kind !== "rest" ? (
                      <ExerciseFigure pattern={getExercise(d.main[0]?.exerciseId ?? d.warmup[0].exerciseId).pattern} label="" animate={false} className="size-10" />
                    ) : (
                      <Moon className="size-5 text-muted" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold tracking-wide text-[var(--color-tag)] uppercase">{x.program.name}</span>
                    <span className="block truncate font-semibold">
                      {d ? (d.kind === "rest" ? t("wk.restDay") : `${t("wk.dayN", { n: (di ?? 0) + 1 })} · ${dayTitle(d, t)}`) : t("wk.finished")}
                    </span>
                    {est && <span className="block text-sm text-muted tabular">{t("wk.minutes", { n: est.minutes })}</span>}
                  </span>
                  {doneHere ? (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-[var(--color-tag)] px-2 py-1 text-xs font-bold text-white">
                      <CheckCircle2 className="size-3.5" aria-hidden /> {t("program.done")}
                    </span>
                  ) : href ? (
                    <Link href={href} className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-lime px-3 text-sm font-bold text-on-accent">
                      <Play className="size-4" aria-hidden /> {isToday ? t("program.startShort") : t("program.view")}
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <DayTracker
        t={t}
        goals={goalsFor(profile)}
        steps={o.health.today?.steps ?? null}
        activeKcal={o.health.today?.activeKcal ?? (training?.burnedKcal || null)}
        sleepMin={o.health.latest?.sleepMinutes ?? null}
        waterMl={water}
        waterGoalMl={targets.waterMl}
        intake={{ kcal: intake.kcal, proteinG: intake.proteinG, carbsG: intake.carbsG, fatG: intake.fatG, fibreG: intake.fibreG }}
        targets={{ kcal: targets.kcal, proteinG: targets.proteinG, carbsG: targets.carbsG, fatG: targets.fatG, fibreG: targets.fibreG }}
      />
    </div>
  );
}
