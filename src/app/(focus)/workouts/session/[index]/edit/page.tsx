import { notFound, redirect } from "next/navigation";
import { SessionEditor, type EditorExercise } from "@/components/workouts/SessionEditor";
import { getExercise } from "@/lib/workouts/exercises";
import { formatDose } from "@/lib/workouts/format";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { getSession, programDay, programForRequest, sessionSets } from "@/server/services/workouts";
import { dayTitle } from "@/lib/workouts/label";

export const metadata = { title: "Edit workout" };

/** "Edit what I did": correct reps, weights, extra or skipped sets and the duration of a finished workout. */
export default async function EditSessionPage({ params, searchParams }: PageProps<"/workouts/session/[index]/edit">) {
  const { user } = await requireOnboarded();
  const program = await programForRequest(user.id, (await searchParams).p);
  if (!program) redirect("/workouts");
  const index = Number((await params).index);
  const day = Number.isInteger(index) ? programDay(program, index) : null;
  const session = day ? await getSession(program.id, index) : null;
  if (!day || !session) notFound();
  const q = program.status === "side" ? `?p=${program.id}` : "";
  if (session.status !== "completed") redirect(`/workouts/session/${index}${q}`);
  const { t } = await getI18n();
  const sets = await sessionSets(session.id);

  const exercises: EditorExercise[] = day.main.map((m) => {
    const ex = getExercise(m.exerciseId);
    const logged = sets.filter((s) => s.slot === m.slot).sort((a, b) => a.setIndex - b.setIndex);
    const rows = logged.length
      ? logged.map((s) => ({ reps: s.reps, seconds: s.seconds, weightKg: s.weightKg, done: s.done }))
      : Array.from({ length: m.sets }, () => ({ reps: m.reps?.[1] ?? null, seconds: m.seconds ?? null, weightKg: m.loadKg ?? null, done: false }));
    return {
      slot: m.slot,
      name: ex.name,
      plan: formatDose(m, ex, t("wk.perSide")),
      mode: ex.mode,
      load: !!ex.load,
      maxSets: m.sets + 3,
      rows,
    };
  });

  return (
    <SessionEditor
      sessionId={session.id}
      title={dayTitle(day, t)}
      dayIndex={index}
      query={q}
      durationMin={Math.max(1, Math.round((session.durationSec ?? 0) / 60))}
      exercises={exercises}
    />
  );
}
