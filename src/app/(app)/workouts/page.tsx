import { ArrowRight, CalendarDays, CheckCircle2, Flame, Footprints, HeartPulse, ListChecks, Moon, Settings2, Stethoscope, Trophy } from "lucide-react";
import Link from "next/link";
import { ArrowCircle, Squiggle, TwoTone } from "@/components/brand/Brand";
import { buttonClass, LinkButton } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { ExerciseMedia } from "@/components/workouts/ExerciseMedia";
import { WeekCalendar } from "@/components/workouts/WeekCalendar";
import { CardioLogButton } from "@/components/workouts/CardioLogButton";
import { moderateEquivalentMinutes, WHO_WEEKLY_MODERATE_MIN } from "@/lib/workouts/cardio";
import { cardioBetween } from "@/server/services/cardio";
import { activeShareLink } from "@/server/services/share";
import { ShareCard } from "@/components/workouts/ShareCard";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { TFunc } from "@/lib/i18n/t";
import { EXERCISES, getExercise } from "@/lib/workouts/exercises";
import { formatDose } from "@/lib/workouts/format";
import { estimateDay } from "@/lib/workouts/load";
import { addDays, weekStart } from "@/lib/workouts/progress";
import type { ProgramDay } from "@/lib/workouts/types";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { latestWeight } from "@/server/services/progress";
import { getActiveProgram, programDay, programProgress, sessionsFor } from "@/server/services/workouts";
import { todayISO } from "@/server/time";

export const metadata = { title: "Workouts" };

export default async function WorkoutsPage() {
  const { user, profile } = await requireOnboarded();
  const { t, lang } = await getI18n();
  const locale = lang === "ta" ? "ta-IN" : lang === "ml" ? "ml-IN" : "en-IN";
  const program = await getActiveProgram(user.id);

  if (!program) {
    return (
      <div className="space-y-5">
        <section className="hero-gradient relative overflow-hidden rounded-[var(--radius-card)] p-6 text-white sm:p-8">
          <Squiggle className="absolute -right-10 -bottom-6 h-28 w-72 opacity-90" />
          <div className="relative max-w-md">
            <TwoTone as="h1" text={t("wk.noProgram.title")} className="text-[2rem] leading-tight" />
            <p className="mt-2 text-white/80">{t("wk.noProgram.body")}</p>
            <LinkButton href="/workouts/setup" variant="lime" size="xl" className="mt-5">
              {t("wk.noProgram.cta")} <ArrowRight className="size-5" aria-hidden />
            </LinkButton>
          </div>
        </section>
        <LibraryTile t={t} />
      </div>
    );
  }

  const today = todayISO();
  const monday = weekStart(today);
  const [prog, weight, weekCardio, share] = await Promise.all([
    programProgress(program, [monday, addDays(monday, 6)], today),
    latestWeight(user.id),
    cardioBetween(user.id, monday, addDays(monday, 6)),
    activeShareLink(user.id),
  ]);
  const activeMinutes = moderateEquivalentMinutes(weekCardio);
  const kg = weight?.weightKg ?? profile.weightKg ?? 70;
  const pos = prog.position;
  const day = prog.finished ? null : programDay(program, pos);
  const [session] = day ? await sessionsFor(program.id, [pos]) : [];
  const est = day ? estimateDay(day, kg) : null;
  const nextWorkout = program.days.findIndex((d, i) => i > pos && d.kind === "workout");
  const lastWeek = prog.cells.filter((c) => c.date < today);
  const missedRecently = lastWeek.length > 0 && lastWeek[lastWeek.length - 1].status === "missed";
  const upcoming = program.days.filter((d, i) => i > pos && d.kind === "workout").slice(0, 3);
  const week = day?.week ?? program.days[program.days.length - 1].week;
  const focus = (d: ProgramDay) => t(`wk.focus.${d.focus}` as MessageKey);
  const lead = day?.main[0] ? getExercise(day.main[0].exerciseId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-3">
        <Link href="/workouts/setup" className={buttonClass("outline", "sm")} aria-label={t("wk.editSetup")}>
          <Settings2 className="size-4" aria-hidden /> <span className="hidden sm:inline">{t("wk.editSetup")}</span>
        </Link>
      </div>

      <header>
        <TwoTone text={t(`wk.split.${program.split}` as MessageKey)} className="text-[2rem] leading-tight sm:text-4xl" />
        <p className="mt-1 text-[15px] text-muted">
          {t(`wk.level.${program.level}`)} · {t("wk.daysPerWeek", { n: program.daysPerWeek })} · {t("wk.weekN", { n: week })} / {program.days[program.days.length - 1].week}
        </p>
      </header>

      {/* Today */}
      {prog.finished ? (
        <section className="hero-gradient rounded-[var(--radius-card)] p-6 text-white">
          <Trophy className="size-9 text-lime" aria-hidden />
          <h2 className="mt-3 text-2xl">{t("wk.finished")}</h2>
          <p className="mt-1 text-white/80">{t("wk.finishedBody")}</p>
          <LinkButton href="/workouts/setup" variant="lime" size="lg" className="mt-4">
            {t("wk.nextBlock")}
          </LinkButton>
        </section>
      ) : prog.doneToday ? (
        <section className="card-lime flex items-center gap-4 p-5">
          <CheckCircle2 className="size-10 shrink-0" aria-hidden />
          <div className="flex-1">
            <h2 className="text-xl">{t("wk.doneToday")}</h2>
            <p className="text-[15px] text-[#0a0c0e]/75">{t("wk.doneTodayBody", { n: pos + 1 })}</p>
          </div>
          <Link href={`/workouts/day/${pos}`} aria-label={t("wk.preview")}>
            <ArrowCircle dark className="size-12" />
          </Link>
        </section>
      ) : day && day.kind === "workout" ? (
        <section className="card-lime-strong relative overflow-hidden p-1.5 sm:grid sm:grid-cols-[1fr_15rem]">
          <div className="flex flex-col p-4 sm:p-5">
            <p className="text-xs font-bold tracking-wide uppercase">
              {t("wk.today")} · {t("wk.dayOf", { n: pos + 1, total: program.days.length })}
            </p>
            <h2 className="mt-1 text-[1.9rem] leading-[1.05]">{focus(day)}</h2>
            <p className="mt-1 text-sm font-medium text-[#0a0c0e]/70">
              {t(`wk.setting.${day.setting}`)}
              {day.isIntro && <> · {t("wk.intro")}</>}
            </p>
            <dl className="mt-4 grid grid-cols-3 divide-x divide-[#0a0c0e]/15 rounded-2xl bg-[#0a0c0e]/[0.07]">
              {[
                { v: `~${est!.minutes}`, l: t("common.min") },
                { v: `~${est!.kcal}`, l: t("common.kcal") },
                { v: day.main.length, l: t("wk.exercises") },
              ].map((s) => (
                <div key={s.l} className="px-2 py-2.5 text-center">
                  <dd className="text-[15px] font-bold tabular">{s.v}</dd>
                  <dt className="text-[11px] text-[#0a0c0e]/65">{s.l}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex gap-2 sm:mt-auto">
              <Link href={`/workouts/session/${pos}`} className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0a0c0e] whitespace-nowrap px-6 text-[17px] font-bold text-[#c6f135] hover:opacity-90">
                {session?.status === "in_progress" ? t("wk.continue") : t("wk.start")} <ArrowRight className="size-5" aria-hidden />
              </Link>
              <Link
                href={`/workouts/day/${pos}`}
                aria-label={t("wk.preview")}
                title={t("wk.preview")}
                className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#0a0c0e]/25 hover:bg-[#0a0c0e]/5 sm:w-auto sm:gap-2 sm:px-4"
              >
                <ListChecks className="size-5" aria-hidden />
                <span className="hidden text-[15px] font-bold sm:inline">{t("wk.preview")}</span>
              </Link>
            </div>
          </div>
          {lead && <ExerciseMedia exercise={lead} className="hidden rounded-[1.15rem] bg-[#0a0c0e] text-white sm:block" />}
        </section>
      ) : day ? (
        <section className="card relative overflow-hidden p-5">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sand text-forest">
              {day.kind === "recovery" ? <Footprints className="size-6" aria-hidden /> : <Moon className="size-6" aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tracking-wide text-forest uppercase">
                {t("common.today")} · {t("wk.dayOf", { n: pos + 1, total: program.days.length })}
              </p>
              <h2 className="text-xl">{day.kind === "recovery" ? t("wk.recoveryDay") : t("wk.restDay")}</h2>
              <p className="mt-1 text-[15px] text-ink-2">{day.kind === "recovery" ? t("wk.recoveryBody") : t("wk.restDayBody")}</p>
              {day.kind === "recovery" && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {day.main.map((m) => {
                    const ex = getExercise(m.exerciseId);
                    return (
                      <li key={m.slot} className="rounded-full bg-sand px-3 py-1 text-sm font-medium">
                        {ex.name} · {formatDose(m, ex, t("wk.perSide"))}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {day.kind === "recovery" && (
              <LinkButton href={`/workouts/session/${pos}`} size="md">
                {t("wk.start")}
              </LinkButton>
            )}
            {nextWorkout > 0 && (
              <LinkButton href={`/workouts/day/${nextWorkout}`} variant="outline" size="md">
                {t("wk.trainAnyway", { n: nextWorkout + 1 })}
              </LinkButton>
            )}
          </div>
        </section>
      ) : null}

      {missedRecently && !prog.doneToday && <p className="rounded-2xl bg-sand px-4 py-3 text-[15px] text-ink-2">{t("wk.missedNote")}</p>}

      {/* Progress + streak */}
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted">{t("wk.dayOf", { n: Math.min(prog.daysDone + (prog.finished ? 0 : 1), program.days.length), total: program.days.length })}</p>
            <p className="font-display text-3xl font-bold tabular">{t("wk.progress", { done: prog.workoutsDone, total: prog.workoutsTotal })}</p>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold", prog.streak > 0 ? "bg-lime text-[#0a0c0e]" : "bg-sand text-muted")}>
            <Flame className="size-4" aria-hidden /> {t("wk.streak", { n: prog.streak })}
          </span>
        </div>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-sand-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={program.days.length}
          aria-valuenow={prog.daysDone}
          aria-label={t("wk.dayOf", { n: prog.daysDone, total: program.days.length })}
        >
          <div className="h-full rounded-full bg-lime transition-[width]" style={{ width: `${(prog.daysDone / program.days.length) * 100}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted">{t("wk.streakHelp")}</p>
      </Card>

      {/* Cardio / active minutes */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-muted">
              <HeartPulse className="size-4 text-water" aria-hidden /> {t("cardio.week")}
            </p>
            <p className="font-display text-3xl font-bold tabular">
              {activeMinutes} <span className="text-lg font-semibold text-muted">/ {WHO_WEEKLY_MODERATE_MIN} {t("common.min")}</span>
            </p>
          </div>
          <CardioLogButton date={today} maxDate={today} weightKg={kg} variant="outline" />
        </div>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-sand-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={WHO_WEEKLY_MODERATE_MIN}
          aria-valuenow={Math.min(activeMinutes, WHO_WEEKLY_MODERATE_MIN)}
          aria-label={t("cardio.week")}
        >
          <div className="h-full rounded-full bg-water" style={{ width: `${Math.min(100, (activeMinutes / WHO_WEEKLY_MODERATE_MIN) * 100)}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted">{t("cardio.weekHelp")}</p>
      </Card>

      {/* This week */}
      <section>
        <SectionTitle
          action={
            <Link href="/workouts/calendar" className="inline-flex items-center gap-1 text-sm font-semibold text-forest">
              <CalendarDays className="size-4" aria-hidden /> {t("cal.open")}
            </Link>
          }
        >
          {t("wk.thisWeek")}
        </SectionTitle>
        <Card className="p-3 sm:p-4">
          <WeekCalendar
            cells={prog.cells}
            today={today}
            locale={locale}
            labels={{
              completed: t("wk.cal.completed"),
              missed: t("wk.cal.missed"),
              upcoming: t("wk.cal.upcoming"),
              rest: t("wk.cal.rest"),
              today: t("wk.cal.today"),
              recovery: t("wk.recoveryDay"),
              title: t("wk.thisWeek"),
            }}
          />
        </Card>
      </section>

      {/* Coming up */}
      {upcoming.length > 0 && (
        <section>
          <SectionTitle>{t("wk.upNext")}</SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-3">
            {upcoming.map((d) => {
              const ex = getExercise(d.main[0].exerciseId);
              return (
                <li key={d.index}>
                  <Link href={`/workouts/day/${d.index}`} className="card flex items-center gap-3 p-2.5 transition-shadow hover:shadow-[var(--shadow-lift)]">
                    <ExerciseMedia exercise={ex} animate={false} className="size-14 shrink-0 rounded-xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-muted">
                        {t("wk.dayN", { n: d.index + 1 })} · {t(`wk.setting.${d.setting}`)}
                      </span>
                      <span className="block truncate font-semibold">{focus(d)}</span>
                      <span className="block text-sm text-muted tabular">{t("wk.minutes", { n: estimateDay(d, kg).minutes })}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <LibraryTile t={t} />

      <ShareCard token={share?.token ?? null} views={share?.views ?? 0} />

      <p className="flex items-start gap-2 rounded-2xl border border-amber/30 bg-amber-100 px-4 py-3 text-sm leading-relaxed text-amber-ink">
        <Stethoscope className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">{t("wk.doctor.title")}.</span> {t("wk.doctor.body")}
        </span>
      </p>
    </div>
  );
}

function LibraryTile({ t }: { t: TFunc }) {
  return (
    <Link href="/workouts/library" className="card-lime flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex-1">
        <h2 className="text-xl">{t("wk.library")}</h2>
        <p className="text-[15px] text-[#0a0c0e]/70">{t("wk.libraryBody", { n: EXERCISES.length })}</p>
      </div>
      <ArrowCircle dark className="size-12" />
    </Link>
  );
}
