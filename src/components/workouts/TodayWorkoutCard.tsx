import { ArrowRight, CheckCircle2, Dumbbell, Flame, Footprints, Moon } from "lucide-react";
import Link from "next/link";
import { ArrowCircle } from "@/components/brand/Brand";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { TFunc } from "@/lib/i18n/t";
import { getExercise } from "@/lib/workouts/exercises";
import { fuelIdeas } from "@/lib/workouts/fuel";
import { estimateDay } from "@/lib/workouts/load";
import type { Profile } from "@/server/auth/dal";
import { bodyWeight, getActiveProgram, programDay, programProgress } from "@/server/services/workouts";
import { ExerciseMedia } from "./ExerciseMedia";

/** Home dashboard card: today's workout (or rest / done), with pre- or post-workout Indian food ideas. */
export async function TodayWorkoutCard({ userId, profile, t, keto }: { userId: string; profile: Profile; t: TFunc; keto: boolean }) {
  const program = await getActiveProgram(userId);
  if (!program) {
    return (
      <Link href="/workouts/setup" className="card flex items-center gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-lime-100 text-forest-700">
          <Dumbbell className="size-6" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">{t("wk.home.setupTitle")}</span>
          <span className="text-sm text-muted">{t("wk.home.setupBody")}</span>
        </span>
        <ArrowRight className="size-5 text-muted" aria-hidden />
      </Link>
    );
  }

  const [prog, kg] = await Promise.all([programProgress(program), bodyWeight(userId, profile)]);
  const day = prog.finished ? null : programDay(program, prog.position);
  const diet = profile.dietPreference ?? "vegetarian";
  const ideas = fuelIdeas(diet, { keto, when: prog.doneToday ? "post" : "pre" }).slice(0, 3);
  const lead = day?.kind === "workout" ? getExercise(day.main[0].exerciseId) : null;
  const est = day ? estimateDay(day, kg) : null;

  return (
    <section className="card overflow-hidden p-1.5">
      <div className="flex items-center gap-3 p-2.5">
        {lead && !prog.doneToday ? (
          <ExerciseMedia exercise={lead} animate={false} className="size-16 shrink-0 rounded-2xl" />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sand text-forest">
            {prog.doneToday ? <CheckCircle2 className="size-7" aria-hidden /> : day?.kind === "recovery" ? <Footprints className="size-7" aria-hidden /> : <Moon className="size-7" aria-hidden />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wide text-forest uppercase">{t("wk.today")}</p>
          <p className="truncate text-lg leading-tight font-semibold">
            {prog.finished
              ? t("wk.finished")
              : prog.doneToday
                ? t("wk.doneToday")
                : day?.kind === "workout"
                  ? `${t("wk.dayN", { n: prog.position + 1 })} · ${t(`wk.focus.${day.focus}` as MessageKey)}`
                  : day?.kind === "recovery"
                    ? t("wk.recoveryDay")
                    : t("wk.restDay")}
          </p>
          <p className="text-sm text-muted tabular">
            {day && day.kind !== "rest" && !prog.doneToday && <>{t("wk.minutes", { n: est!.minutes })} · {t("wk.kcal", { n: est!.kcal })} · </>}
            <span className="whitespace-nowrap">
              <Flame className="inline size-3.5 align-[-2px]" aria-hidden /> {t("wk.streak", { n: prog.streak })}
            </span>
          </p>
        </div>
        <Link href={day && day.kind !== "rest" && !prog.doneToday ? `/workouts/session/${prog.position}` : "/workouts"} aria-label={day?.kind === "workout" && !prog.doneToday ? t("wk.start") : t("wk.title")}>
          <ArrowCircle className="size-12" />
        </Link>
      </div>
      {ideas.length > 0 && day?.kind !== "rest" && (
        <div className="rounded-[1.1rem] bg-sand/70 px-3.5 py-3">
          <p className="text-xs font-semibold text-muted">
            {t("wk.fuel.title")} · {prog.doneToday ? t("wk.fuel.post") : t("wk.fuel.pre")}
          </p>
          <ul className="no-scrollbar -mx-1 mt-1.5 flex gap-2 overflow-x-auto px-1">
            {ideas.map((f) => (
              <li key={f.id} className="shrink-0">
                <Link
                  href={f.recipeHints[0] ? `/recipes?q=${encodeURIComponent(f.recipeHints[0].replace(/-/g, " "))}` : "/recipes"}
                  className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-3 text-sm font-medium hover:border-forest/40"
                >
                  {f.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
