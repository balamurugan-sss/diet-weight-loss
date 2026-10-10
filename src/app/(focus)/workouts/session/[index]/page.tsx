import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SessionPlayer, type SetHint } from "@/components/workouts/SessionPlayer";
import { buttonClass } from "@/components/ui/Button";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { getExercise } from "@/lib/workouts/exercises";
import { fuelIdeas, workoutAddBack } from "@/lib/workouts/fuel";
import { suggestOverload } from "@/lib/workouts/load";
import type { Exercise } from "@/lib/workouts/types";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { targetsForProfile } from "@/server/services/targets";
import {
  bodyWeight,
  canStartDay,
  getActiveProgram,
  getSession,
  previousSets,
  programDay,
  programProgress,
  sessionSets,
  summarise,
} from "@/server/services/workouts";

export const metadata = { title: "Workout" };

export default async function SessionPage({ params }: PageProps<"/workouts/session/[index]">) {
  const { user, profile } = await requireOnboarded();
  const program = await getActiveProgram(user.id);
  if (!program) redirect("/workouts");
  const index = Number((await params).index);
  const day = Number.isInteger(index) ? programDay(program, index) : null;
  if (!day || day.kind === "rest") notFound();
  const { t } = await getI18n();

  const [session, prog, kg] = await Promise.all([getSession(program.id, index), programProgress(program), bodyWeight(user.id, profile)]);
  if (!session && !canStartDay(program, prog, index)) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg">{t("wk.s.cannotStart")}</p>
        <Link href="/workouts" className={buttonClass("primary", "lg")}>
          <ArrowLeft className="size-5" aria-hidden /> {t("wk.s.backToPlan")}
        </Link>
      </main>
    );
  }

  const sets = session ? await sessionSets(session.id) : [];
  const mainIds = [...new Set(day.main.map((m) => m.exerciseId))];
  const previous = await previousSets(user.id, mainIds, session?.id ?? "");

  const hints: Record<number, SetHint> = {};
  for (const m of day.main) {
    const ex = getExercise(m.exerciseId);
    const prev = previous.get(m.exerciseId)?.filter((s) => s.done) ?? [];
    const overload = prev.length ? suggestOverload(m, prev) : { kind: "none" as const };
    const last = prev.length
      ? prev
          .map((s) => (ex.mode === "time" ? `${s.seconds ?? "?"} s` : s.weightKg != null ? `${s.weightKg} kg × ${s.reps ?? "?"}` : `${s.reps ?? "?"}`))
          .join(", ")
      : null;
    const prefillKg =
      overload.kind === "increase" || overload.kind === "reduce" ? overload.weightKg : overload.kind === "hold" && overload.weightKg != null ? overload.weightKg : (m.loadKg ?? null);
    hints[m.slot] = { last, overload, prefillKg };
  }

  const exercises: Record<string, Exercise> = {};
  for (const p of [...day.warmup, ...day.main, ...day.cooldown]) exercises[p.exerciseId] = getExercise(p.exerciseId);
  for (const h of Object.values(hints)) if (h.overload.kind === "harder") exercises[h.overload.exerciseId] = getExercise(h.overload.exerciseId);

  const targets = targetsForProfile(profile);
  const keto = targets?.style === "keto";
  const fuel = fuelIdeas(profile.dietPreference ?? "vegetarian", { keto, when: "post" }).slice(0, 3);
  const completed =
    session?.status === "completed"
      ? {
          ...summarise(day, sets, session.durationSec ?? 0, kg, program.goal),
          kcal: session.kcal ?? 0,
          netKcal: session.netKcal ?? 0,
          addBackKcal: workoutAddBack(session.netKcal ?? 0, program.goal),
        }
      : null;

  return (
    <SessionPlayer
      dayIndex={index}
      totalDays={program.days.length}
      day={day}
      title={day.kind === "recovery" ? t("wk.recoveryDay") : t(`wk.focus.${day.focus}` as MessageKey)}
      exercises={exercises}
      initialSessionId={session?.id ?? null}
      initialSets={sets.map((s) => ({ slot: s.slot, setIndex: s.setIndex, reps: s.reps, seconds: s.seconds, weightKg: s.weightKg, done: s.done }))}
      hints={hints}
      completed={completed}
      goal={program.goal}
      fuel={fuel.map((f) => ({ id: f.id, title: f.title, detail: f.detail }))}
    />
  );
}
