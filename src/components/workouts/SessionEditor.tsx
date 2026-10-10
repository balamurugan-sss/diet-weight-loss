"use client";

import { ArrowLeft, Check, Minus, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button, buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { editSessionAction } from "@/server/actions/workouts";

type Row = { reps: number | null; seconds: number | null; weightKg: number | null; done: boolean };
export type EditorExercise = { slot: number; name: string; plan: string; mode: "reps" | "time"; load: boolean; maxSets: number; rows: Row[] };

const num = (v: string, int = true) => {
  if (v.trim() === "") return null;
  const n = int ? Math.round(Number(v)) : Math.round(Number(v) * 4) / 4;
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const field =
  "h-11 w-16 rounded-lg border border-line bg-surface px-2 text-center text-[17px] font-bold tabular outline-none focus:border-forest focus:ring-2 focus:ring-forest/20";

export function SessionEditor({ sessionId, title, dayIndex, query = "", durationMin, exercises }: { sessionId: string; title: string; dayIndex: number; query?: string; durationMin: number; exercises: EditorExercise[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [list, setList] = useState(exercises);
  const [minutes, setMinutes] = useState(String(durationMin));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const update = (slot: number, fn: (rows: Row[]) => Row[]) => setList((l) => l.map((e) => (e.slot === slot ? { ...e, rows: fn(e.rows) } : e)));
  const setRow = (slot: number, i: number, patch: Partial<Row>) => update(slot, (rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = () =>
    start(async () => {
      setError(null);
      const res = await editSessionAction({
        sessionId,
        durationMin: Math.min(360, Math.max(1, num(minutes) ?? durationMin)),
        sets: list.flatMap((e) => e.rows.map((r, setIndex) => ({ slot: e.slot, setIndex, ...r }))),
      });
      if (!res.ok) return setError(t("common.error"));
      router.push("/home?edited=1");
    });

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 pt-5 pb-32">
      <header className="mb-5 flex items-center gap-3">
        <Link href={`/workouts/session/${dayIndex}${query}`} className="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-surface" aria-label={t("common.back")}>
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted">{t("today.edit.kicker")}</p>
          <h1 className="truncate text-[1.7rem]">{title}</h1>
        </div>
      </header>
      <p className="mb-4 text-[15px] text-ink-2">{t("today.edit.body")}</p>

      <label className="card mb-4 flex items-center justify-between gap-3 p-4">
        <span className="font-semibold">{t("today.edit.duration")}</span>
        <span className="flex items-center gap-2">
          <input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} className={field} aria-label={t("today.edit.duration")} />
          <span className="text-muted">{t("common.min")}</span>
        </span>
      </label>

      <ul className="space-y-3">
        {list.map((e) => (
          <li key={e.slot} className="card p-4">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-lg normal-case">{e.name}</h2>
              <span className="shrink-0 text-sm text-muted">
                {t("today.edit.planned")}: {e.plan}
              </span>
            </div>
            <ol className="space-y-2">
              {e.rows.map((r, i) => (
                <li key={i} className={cn("flex flex-wrap items-center gap-2 rounded-lg p-2", r.done ? "bg-forest-50" : "bg-sand/60")}>
                  <span className="w-12 text-sm font-semibold text-muted">
                    {t("wk.s.set", { n: i + 1 })}
                  </span>
                  {e.mode === "reps" ? (
                    <label className="flex items-center gap-1.5">
                      <input inputMode="numeric" value={r.reps ?? ""} onChange={(ev) => setRow(e.slot, i, { reps: num(ev.target.value) })} className={field} aria-label={`${e.name} ${t("wk.s.set", { n: i + 1 })} ${t("wk.s.reps")}`} />
                      <span className="text-sm text-muted">{t("wk.s.reps")}</span>
                    </label>
                  ) : (
                    <label className="flex items-center gap-1.5">
                      <input inputMode="numeric" value={r.seconds ?? ""} onChange={(ev) => setRow(e.slot, i, { seconds: num(ev.target.value) })} className={field} aria-label={`${e.name} ${t("wk.s.set", { n: i + 1 })} ${t("wk.s.seconds")}`} />
                      <span className="text-sm text-muted">s</span>
                    </label>
                  )}
                  {e.load && (
                    <label className="flex items-center gap-1.5">
                      <input inputMode="decimal" value={r.weightKg ?? ""} onChange={(ev) => setRow(e.slot, i, { weightKg: num(ev.target.value, false) })} className={field} aria-label={`${e.name} ${t("wk.s.set", { n: i + 1 })} kg`} />
                      <span className="text-sm text-muted">kg</span>
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={() => setRow(e.slot, i, { done: !r.done })}
                    aria-pressed={r.done}
                    aria-label={`${e.name} ${t("wk.s.set", { n: i + 1 })}: ${t("today.edit.didIt")}`}
                    className={cn("ml-auto grid size-11 place-items-center rounded-lg border-2", r.done ? "border-transparent bg-forest text-on-accent" : "border-line text-muted")}
                  >
                    <Check className="size-5" strokeWidth={3} aria-hidden />
                  </button>
                </li>
              ))}
            </ol>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className={buttonClass("ghost", "sm")}
                disabled={e.rows.length >= e.maxSets}
                onClick={() => update(e.slot, (rows) => [...rows, { ...(rows.at(-1) ?? { reps: null, seconds: null, weightKg: null }), done: true }])}
              >
                <Plus className="size-4" aria-hidden /> {t("today.edit.addSet")}
              </button>
              <button type="button" className={buttonClass("ghost", "sm")} disabled={e.rows.length <= 1} onClick={() => update(e.slot, (rows) => rows.slice(0, -1))}>
                <Minus className="size-4" aria-hidden /> {t("today.edit.removeSet")}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-ivory/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-xl">
          {error && (
            <p role="alert" className="mb-2 text-sm text-terracotta">
              {error}
            </p>
          )}
          <Button variant="lime" size="xl" className="w-full" onClick={save} disabled={pending}>
            <Save className="size-5" aria-hidden /> {pending ? t("common.saving") : t("today.edit.save")}
          </Button>
        </div>
      </div>
    </main>
  );
}
