"use client";

import { ArrowLeft, ArrowRight, Check, ChevronDown, Flame, Pause, Play, Timer, Trophy, Utensils, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { chime, useTimer, useWakeLock } from "@/components/cook/hooks";
import { useI18n } from "@/components/i18n/I18nProvider";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { ADD_BACK_SHARE } from "@/lib/workouts/fuel";
import { formatClock, formatDose, formatSeconds, perHand } from "@/lib/workouts/format";
import type { Overload } from "@/lib/workouts/load";
import type { Exercise, Prescription, ProgramDay, WorkoutGoal } from "@/lib/workouts/types";
import { finishSessionAction, logSetAction, startSessionAction } from "@/server/actions/workouts";
import type { SessionSummary } from "@/server/services/workouts";
import { ExerciseMedia } from "./ExerciseMedia";

export type SetHint = { last: string | null; overload: Overload; prefillKg: number | null };
type SetState = { reps: number | null; seconds: number | null; weightKg: number | null; done: boolean };
type Step = { p: Prescription; section: "warmup" | "main" | "cooldown" };

const key = (slot: number, setIndex: number) => `${slot}:${setIndex}`;

export function SessionPlayer({
  dayIndex,
  totalDays,
  day,
  title,
  exercises,
  initialSessionId,
  initialSets,
  hints,
  completed,
  goal,
  fuel,
}: {
  dayIndex: number;
  totalDays: number;
  day: ProgramDay;
  title: string;
  exercises: Record<string, Exercise>;
  initialSessionId: string | null;
  initialSets: ({ slot: number; setIndex: number } & SetState)[];
  hints: Record<number, SetHint>;
  completed: SessionSummary | null;
  goal: WorkoutGoal;
  fuel: { id: string; title: string; detail: string }[];
}) {
  const { t } = useI18n();
  useWakeLock(!completed);
  const steps: Step[] = useMemo(
    () => [
      ...day.warmup.map((p) => ({ p, section: "warmup" as const })),
      ...day.main.map((p) => ({ p, section: "main" as const })),
      ...day.cooldown.map((p) => ({ p, section: "cooldown" as const })),
    ],
    [day],
  );
  const firstMain = day.warmup.length;
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(completed);
  const [pending, start] = useTransition();

  // Resume at the first main exercise with an unfinished set when sets were already logged.
  const [sets, setSets] = useState<Record<string, SetState>>(() => Object.fromEntries(initialSets.map((s) => [key(s.slot, s.setIndex), s])));
  const [i, setI] = useState(() => {
    if (!initialSets.length) return 0;
    const idx = day.main.findIndex((m) => Array.from({ length: m.sets }, (_, k) => !initialSets.find((s) => s.slot === m.slot && s.setIndex === k)?.done).some(Boolean));
    return idx < 0 ? steps.length - 1 : firstMain + idx;
  });

  // Start (or reuse) the server session once, on the client.
  useEffect(() => {
    if (sessionId || completed) return;
    let cancelled = false;
    void startSessionAction(dayIndex).then((res) => {
      if (cancelled) return;
      if (res.ok) setSessionId(res.sessionId);
      else setError(t("wk.s.cannotStart"));
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId, completed, dayIndex, t]);

  // Active time, kept per session in this browser so a reload or a later resume doesn't count the gap.
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const restored = useRef(false);
  useEffect(() => {
    if (!sessionId || summary || paused) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (!restored.current) {
        restored.current = true;
        let stored = 0;
        try {
          stored = Number(localStorage.getItem(`wk-elapsed-${sessionId}`)) || 0;
        } catch {}
        setElapsed((e) => Math.max(e, stored) + 1);
        return;
      }
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [sessionId, summary, paused]);
  useEffect(() => {
    if (!sessionId || elapsed === 0) return;
    try {
      localStorage.setItem(`wk-elapsed-${sessionId}`, String(elapsed));
    } catch {}
  }, [sessionId, elapsed]);

  const rest = useTimer(() => chime());
  const workTarget = useRef<{ slot: number; setIndex: number } | null>(null);
  const [timingSet, setTimingSet] = useState<number | null>(null);
  const step = steps[i];
  const ex = exercises[step.p.exerciseId];

  const save = useCallback(
    (slot: number, setIndex: number, next: SetState) => {
      setSets((s) => ({ ...s, [key(slot, setIndex)]: next }));
      if (!sessionId) return;
      void logSetAction({ sessionId, slot, setIndex, ...next }).then((r) => !r.ok && setError(t("common.error")));
    },
    [sessionId, t],
  );

  const valueFor = (p: Prescription, setIndex: number): SetState =>
    sets[key(p.slot, setIndex)] ?? {
      reps: p.reps ? p.reps[0] : null,
      seconds: p.seconds ?? null,
      weightKg: exercises[p.exerciseId].load ? (hints[p.slot]?.prefillKg ?? p.loadKg ?? null) : null,
      done: false,
    };

  const toggleSet = (p: Prescription, setIndex: number) => {
    const v = valueFor(p, setIndex);
    const done = !v.done;
    save(p.slot, setIndex, { ...v, done });
    const isLastSet = setIndex === p.sets - 1;
    const isLastStep = i === steps.length - 1;
    if (done && p.restSec > 0 && !(isLastSet && isLastStep)) rest.start(p.restSec);
    if (!done) rest.stop();
  };

  // Timed sets / warm-up holds.
  const work = useTimer(() => {
    chime();
    const target = workTarget.current;
    workTarget.current = null;
    setTimingSet(null);
    if (!target) return;
    if (step.section === "main") {
      const p = step.p;
      const v = valueFor(p, target.setIndex);
      save(p.slot, target.setIndex, { ...v, seconds: p.seconds ?? v.seconds, done: true });
      const isLastSet = target.setIndex === p.sets - 1;
      if (p.restSec > 0 && !(isLastSet && i === steps.length - 1)) rest.start(p.restSec);
    } else if (i < steps.length - 1) {
      setTimeout(() => setI((x) => Math.min(steps.length - 1, x + 1)), 900);
    }
  });
  const startWork = (setIndex: number) => {
    const sides = ex.perSide ? 2 : 1;
    workTarget.current = { slot: step.p.slot, setIndex };
    setTimingSet(setIndex);
    rest.stop();
    work.start((step.p.seconds ?? 30) * sides);
  };

  const go = (n: number) => {
    work.stop();
    workTarget.current = null;
    setTimingSet(null);
    setI(Math.max(0, Math.min(steps.length - 1, n)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = () => {
    if (!sessionId) return;
    rest.stop();
    work.stop();
    start(async () => {
      const res = await finishSessionAction(sessionId, elapsed);
      if (res.ok) {
        setSummary(res.summary);
        try {
          localStorage.removeItem(`wk-elapsed-${sessionId}`);
        } catch {}
      } else setError(t("common.error"));
    });
  };

  if (summary) return <Summary summary={summary} title={title} recovery={day.kind === "recovery"} goal={goal} fuel={fuel} />;

  const next = steps[i + 1];
  const nextEx = next ? exercises[next.p.exerciseId] : null;
  const hint = step.section === "main" ? hints[step.p.slot] : undefined;
  const sectionLabel = step.section === "warmup" ? t("wk.warmup") : step.section === "cooldown" ? t("wk.cooldown") : day.kind === "recovery" ? t("wk.recoveryDay") : t("wk.main");
  const sectionSteps = steps.filter((s) => s.section === step.section);
  const posInSection = sectionSteps.indexOf(step) + 1;
  const loaded = !!ex.load;
  const isLast = i === steps.length - 1;
  const logSets = step.section === "main" && day.kind === "workout";
  const timedSingle = !logSets && ex.mode === "time";

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col pb-40">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-ivory/95 px-4 pt-3 pb-2.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href={`/workouts/day/${dayIndex}`} className="grid size-10 place-items-center rounded-full border border-line bg-surface" aria-label={t("wk.s.leave")}>
            <X className="size-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-muted">{t("wk.dayOf", { n: dayIndex + 1, total: totalDays })}</p>
            <p className="truncate font-semibold">{title}</p>
          </div>
          <button
            type="button"
            onClick={() => setPaused((x) => !x)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sand px-3 font-display text-lg font-bold tabular"
            aria-label={`${t("wk.s.elapsed")} ${formatClock(elapsed)}`}
          >
            {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
            {formatClock(elapsed)}
          </button>
        </div>
        <div className="mt-2.5 flex gap-1" aria-hidden>
          {steps.map((s, k) => (
            <span key={k} className={cn("h-1.5 flex-1 rounded-full", k < i ? "bg-lime" : k === i ? "bg-forest" : "bg-sand-2", s.section !== "main" && "max-w-3")} />
          ))}
        </div>
      </header>

      {error && (
        <p role="alert" className="mx-4 mt-3 rounded-2xl bg-terracotta-100 px-4 py-2.5 text-sm font-medium text-terracotta">
          {error}
        </p>
      )}

      <main className="flex-1 px-4 pt-4">
        <p className="text-xs font-bold tracking-wide text-forest uppercase">
          {sectionLabel} · {posInSection}/{sectionSteps.length}
        </p>
        <div className="mt-2 grid gap-4 sm:grid-cols-[15rem_1fr] sm:items-start">
          <div className="card p-1.5">
            <ExerciseMedia exercise={ex} className="aspect-[4/3] rounded-[1.1rem] sm:aspect-square" />
          </div>
          <div>
            <h1 className="text-[1.75rem] leading-tight">{ex.name}</h1>
            <p className="mt-1 text-[15px] text-muted tabular">
              {formatDose(step.p, ex, t("wk.perSide"))}
              {logSets && step.p.restSec > 0 && <> · {t("wk.restS", { n: step.p.restSec })}</>}
            </p>
            <p className="mt-0.5 text-sm text-muted">{ex.muscles.map((m) => t(`wk.muscle.${m}` as MessageKey)).join(" · ")}</p>
            <details className="group mt-3 rounded-2xl bg-sand px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                {t("wk.steps")}
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px] leading-relaxed text-ink-2">
                {ex.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <p className="mt-3 text-sm font-semibold">{t("wk.mistakes")}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-2">
                {ex.mistakes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>

        {hint && (hint.last || hint.overload.kind !== "none") && (
          <div className="mt-4 rounded-2xl border border-forest/25 bg-forest-50 px-4 py-3 text-[15px]">
            {hint.last && <p className="text-sm text-muted">{t("wk.s.last", { detail: hint.last })}</p>}
            {hint.overload.kind !== "none" && <p className="mt-0.5 font-semibold text-forest">{overloadText(hint.overload, t, exercises)}</p>}
          </div>
        )}

        {logSets ? (
          <ol className="mt-4 space-y-2">
            {Array.from({ length: step.p.sets }, (_, k) => {
              const v = valueFor(step.p, k);
              const timing = work.running && timingSet === k;
              return (
                <li key={k} className={cn("flex items-center gap-2.5 rounded-2xl border p-2.5 pl-4 transition-colors", v.done ? "border-transparent bg-lime-100 text-[#0c0c0b]" : "border-line bg-surface")}>
                  <span className={cn("w-12 shrink-0 text-sm font-semibold", v.done ? "text-[#0c0c0b]/70" : "text-muted")}>{t("wk.s.set", { n: k + 1 })}</span>
                  {ex.mode === "reps" ? (
                    <label className="flex items-center gap-1.5">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={500}
                        value={v.reps ?? ""}
                        onChange={(e) => save(step.p.slot, k, { ...v, reps: e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))) })}
                        className="h-11 w-16 rounded-xl border border-line bg-surface text-center text-lg font-bold text-charcoal tabular"
                        aria-label={`${t("wk.s.set", { n: k + 1 })} ${t("wk.s.reps")}`}
                      />
                      <span className={cn("text-xs", v.done ? "text-[#0c0c0b]/70" : "text-muted")}>{t("wk.s.reps")}</span>
                    </label>
                  ) : (
                    <button
                      type="button"
                      disabled={v.done}
                      onClick={() => (timing ? work.stop() : startWork(k))}
                      className={cn("inline-flex h-11 items-center gap-1.5 rounded-xl px-3 font-bold tabular", timing ? "bg-forest text-on-accent" : "bg-sand text-charcoal", v.done && "opacity-60")}
                    >
                      <Timer className="size-4" aria-hidden />
                      {timing ? formatClock(work.remaining) : formatSeconds((step.p.seconds ?? 30) * (ex.perSide ? 2 : 1))}
                    </button>
                  )}
                  {loaded && (
                    <label className="flex items-center gap-1.5">
                      <input
                        type="number"
                        inputMode="decimal"
                        step={0.5}
                        min={0}
                        max={500}
                        value={v.weightKg ?? ""}
                        onChange={(e) => save(step.p.slot, k, { ...v, weightKg: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
                        className="h-11 w-18 rounded-xl border border-line bg-surface text-center text-lg font-bold text-charcoal tabular"
                        aria-label={`${t("wk.s.set", { n: k + 1 })} ${t("wk.s.kg")}`}
                      />
                      <span className={cn("text-xs", v.done ? "text-[#0c0c0b]/70" : "text-muted")}>
                        {t("wk.s.kg")}
                        {perHand(ex) && <span className="block">{t("wk.each")}</span>}
                      </span>
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleSet(step.p, k)}
                    aria-pressed={v.done}
                    aria-label={v.done ? t("wk.s.undoSet", { n: k + 1 }) : t("wk.s.markSet", { n: k + 1 })}
                    className={cn(
                      "ml-auto grid size-12 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      v.done ? "border-[#0c0c0b] bg-[#0c0c0b] text-[#d4f23f]" : "border-line text-muted hover:border-forest hover:text-forest",
                    )}
                  >
                    <Check className="size-6" strokeWidth={3} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ol>
        ) : timedSingle ? (
          <div className="mt-5 flex flex-col items-center gap-3">
            <p className="font-display text-6xl font-bold tabular">{formatClock(work.running ? work.remaining : (step.p.seconds ?? 30) * (ex.perSide ? 2 : 1))}</p>
            <button type="button" onClick={() => (work.running ? work.stop() : startWork(0))} className={buttonClass(work.running ? "outline" : "primary", "lg")}>
              {work.running ? (
                <>
                  <Pause className="size-5" aria-hidden /> {t("wk.s.stopTimer")}
                </>
              ) : (
                <>
                  <Play className="size-5" aria-hidden /> {t("wk.s.startTimer", { n: formatSeconds((step.p.seconds ?? 30) * (ex.perSide ? 2 : 1)) })}
                </>
              )}
            </button>
          </div>
        ) : null}

        {nextEx && next && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-sand p-2.5">
            <ExerciseMedia exercise={nextEx} animate={false} className="size-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted">{t("wk.s.nextUp")}</p>
              <p className="truncate font-semibold">{nextEx.name}</p>
            </div>
            <p className="shrink-0 pr-2 text-sm text-muted tabular">{formatDose(next.p, nextEx, t("wk.perSide"))}</p>
          </div>
        )}
      </main>

      {/* Bottom: rest countdown + navigation */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-2xl space-y-2.5">
          {rest.running && (
            <div className="card-lime-strong flex items-center gap-3 px-4 py-2.5" role="timer" aria-live="polite">
              <span className="text-sm font-bold uppercase">{t("wk.s.rest")}</span>
              <span className="font-display text-3xl font-bold tabular">{formatClock(rest.remaining)}</span>
              <span className="ml-auto flex gap-2">
                <button type="button" onClick={() => rest.add(15)} className="h-10 rounded-full bg-[#0c0c0b]/10 px-3 text-sm font-bold">
                  {t("wk.s.add15")}
                </button>
                <button type="button" onClick={() => rest.stop()} className="h-10 rounded-full bg-[#0c0c0b] px-4 text-sm font-bold text-[#d4f23f]">
                  {t("wk.s.skipRest")}
                </button>
              </span>
            </div>
          )}
          <div className="flex gap-2.5">
            <button type="button" onClick={() => go(i - 1)} disabled={i === 0} className="grid size-15 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-charcoal hover:border-forest/50 disabled:opacity-40" aria-label={t("wk.s.prev")}>
              <ArrowLeft className="size-5" aria-hidden />
            </button>
            {isLast ? (
              <button type="button" onClick={finish} disabled={pending || !sessionId} className={buttonClass("lime", "xl", "flex-1")}>
                {day.kind === "recovery" ? t("wk.s.markRecovery") : t("wk.s.finish")} <Check className="size-5" aria-hidden />
              </button>
            ) : (
              <button type="button" onClick={() => go(i + 1)} className={buttonClass(i < firstMain ? "primary" : "lime", "xl", "flex-1")}>
                {t("wk.s.next")} <ArrowRight className="size-5" aria-hidden />
              </button>
            )}
          </div>
          {!isLast && (
            <button type="button" onClick={finish} disabled={pending || !sessionId} className="block w-full text-center text-sm font-semibold text-muted hover:text-charcoal">
              {t("wk.s.finish")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function overloadText(o: Overload, t: ReturnType<typeof useI18n>["t"], exercises: Record<string, Exercise>) {
  switch (o.kind) {
    case "increase":
      return t("wk.s.ov.increase", { kg: o.weightKg, by: `${o.by} kg` });
    case "hold":
      return o.weightKg != null ? t("wk.s.ov.hold", { kg: o.weightKg }) : "";
    case "reduce":
      return t("wk.s.ov.reduce", { kg: o.weightKg });
    case "more_reps":
      return t("wk.s.ov.more_reps", { n: o.reps });
    case "more_time":
      return t("wk.s.ov.more_time", { n: o.seconds });
    case "harder":
      return t("wk.s.ov.harder", { name: exercises[o.exerciseId]?.name ?? o.exerciseId });
    default:
      return "";
  }
}

function Summary({
  summary,
  title,
  recovery,
  goal,
  fuel,
}: {
  summary: SessionSummary;
  title: string;
  recovery: boolean;
  goal: WorkoutGoal;
  fuel: { id: string; title: string; detail: string }[];
}) {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-5 px-4 pt-8 pb-10">
      <section className="card-lime-strong relative overflow-hidden p-6 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#0c0c0b] text-[#d4f23f]">
          <Trophy className="size-8" aria-hidden />
        </span>
        <h1 className="mt-3 text-[2rem] leading-tight">{recovery ? t("wk.s.recoveryComplete") : t("wk.s.complete")}</h1>
        <p className="font-medium text-[#0c0c0b]/70">{title}</p>
        <dl className="mt-5 grid grid-cols-3 divide-x divide-[#0c0c0b]/15 rounded-2xl bg-[#0c0c0b]/[0.07]">
          <div className="px-2 py-3">
            <dd className="font-display text-2xl font-bold tabular">{formatClock(summary.durationSec)}</dd>
            <dt className="text-xs text-[#0c0c0b]/65">{t("wk.s.duration")}</dt>
          </div>
          <div className="px-2 py-3">
            <dd className="font-display text-2xl font-bold tabular">{summary.kcal}</dd>
            <dt className="text-xs text-[#0c0c0b]/65">
              {t("common.kcal")} · {t("wk.s.burned")}
            </dt>
          </div>
          <div className="px-2 py-3">
            <dd className="font-display text-2xl font-bold tabular">
              {summary.exercisesDone}/{summary.exercisesTotal}
            </dd>
            <dt className="text-xs text-[#0c0c0b]/65">{t("wk.s.exercisesDone")}</dt>
          </div>
        </dl>
      </section>

      {summary.addBackKcal > 0 && (
        <section className="card flex items-start gap-3 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-forest-50 text-forest">
            <Flame className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">{t("wk.s.foodBonus", { n: summary.addBackKcal })}</p>
            <p className="text-sm text-muted">{t("wk.s.foodBonusHelp", { share: Math.round(ADD_BACK_SHARE[goal] * 100) })}</p>
          </div>
        </section>
      )}

      {fuel.length > 0 && (
        <section className="card p-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Utensils className="size-5 text-forest" aria-hidden /> {t("wk.s.refuel")}
          </h2>
          <ul className="mt-2 divide-y divide-line">
            {fuel.map((f) => (
              <li key={f.id} className="py-2.5">
                <p className="font-semibold">{f.title}</p>
                <p className="text-sm text-muted">{f.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-muted">{t("wk.s.estimateNote")}</p>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Link href="/workouts" className={buttonClass("primary", "xl", "sm:flex-1")}>
          {t("wk.s.backToPlan")}
        </Link>
        <Link href="/home" className={buttonClass("outline", "xl", "sm:flex-1")}>
          {t("wk.s.home")}
        </Link>
      </div>
    </main>
  );
}
