import { AlertTriangle, ArrowLeft, ArrowRight, Stethoscope } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseMedia } from "@/components/workouts/ExerciseMedia";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Chip";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { EXERCISE_BY_ID } from "@/lib/workouts/exercises";
import { getI18n } from "@/server/i18n";

export async function generateMetadata({ params }: PageProps<"/workouts/library/[id]">) {
  const { id } = await params;
  return { title: EXERCISE_BY_ID.get(id)?.name ?? "Exercise" };
}

export default async function ExercisePage({ params }: PageProps<"/workouts/library/[id]">) {
  const { id } = await params;
  const ex = EXERCISE_BY_ID.get(id);
  if (!ex) notFound();
  const { t } = await getI18n();
  const harder = ex.harder ? EXERCISE_BY_ID.get(ex.harder) : undefined;
  const easier = ex.easier ? EXERCISE_BY_ID.get(ex.easier) : undefined;
  const muscles = (ms: string[]) => ms.map((m) => t(`wk.muscle.${m}` as MessageKey)).join(", ");

  return (
    <div className="space-y-5">
      <Link href="/workouts/library" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
        <ArrowLeft className="size-4" aria-hidden /> {t("wk.library")}
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div className="card p-1.5">
          <ExerciseMedia exercise={ex} className="aspect-square rounded-[1.15rem]" label={ex.media ? t("wk.media.photo") : t("wk.media.animation")} />
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={ex.difficulty === 1 ? "forest" : ex.difficulty === 2 ? "lime" : "amber"}>{t(`wk.diff.${ex.difficulty}` as MessageKey)}</Badge>
              {ex.settings.map((s) => (
                <Badge key={s}>{t(`wk.setting.${s}`)}</Badge>
              ))}
            </div>
            <h1 className="mt-2 text-[1.9rem] leading-tight">{ex.name}</h1>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-sand p-3">
              <dt className="text-xs font-semibold text-muted">{t("wk.target")}</dt>
              <dd className="mt-0.5 font-semibold">{muscles(ex.muscles)}</dd>
              {ex.secondary && <dd className="text-sm text-muted">+ {muscles(ex.secondary)}</dd>}
            </div>
            <div className="rounded-2xl bg-sand p-3">
              <dt className="text-xs font-semibold text-muted">{t("wk.equipment")}</dt>
              <dd className="mt-0.5 font-semibold">{ex.equipment.length ? ex.equipment.map((e) => t(`wk.eq.${e}` as MessageKey)).join(", ") : t("wk.bodyweight")}</dd>
            </div>
          </dl>

          <Card>
            <h2 className="mb-3 text-lg font-semibold">{t("wk.steps")}</h2>
            <ol className="space-y-3">
              {ex.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-forest text-sm font-bold text-on-accent tabular">{i + 1}</span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold">{t("wk.mistakes")}</h2>
            <ul className="space-y-2.5">
              {ex.mistakes.map((m) => (
                <li key={m} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-2">
                  <AlertTriangle className="mt-0.5 size-4.5 shrink-0 text-amber" aria-hidden />
                  {m}
                </li>
              ))}
            </ul>
          </Card>

          {(easier || harder) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { ex: easier, label: t("wk.easier") },
                { ex: harder, label: t("wk.harder") },
              ]
                .filter((x) => x.ex)
                .map(({ ex: other, label }) => (
                  <Link key={other!.id} href={`/workouts/library/${other!.id}`} className="card flex items-center gap-3 p-2.5 hover:shadow-[var(--shadow-lift)]">
                    <ExerciseMedia exercise={other!} animate={false} className="size-14 shrink-0 rounded-xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-muted">{label}</span>
                      <span className="block truncate font-semibold">{other!.name}</span>
                    </span>
                    <ArrowRight className="size-4 text-muted" aria-hidden />
                  </Link>
                ))}
            </div>
          )}

          <p className="flex items-start gap-2 text-sm text-muted">
            <Stethoscope className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t("wk.doctor.title")}
          </p>
        </div>
      </div>
    </div>
  );
}
