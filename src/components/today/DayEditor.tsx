"use client";

import { ChevronDown, ChevronUp, CupSoda, Dumbbell, GripVertical, HeartPulse, Sunrise, AlarmClock, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { QUICK_SLOT } from "@/lib/today/quickFoods";
import { timeForPosition, type TimelineItem } from "@/lib/today/timeline";
import { setCardioMinutesAction, setItemTimeAction, setWorkoutMinutesAction } from "@/server/actions/today";

type Row = TimelineItem & { key: string };

const keyOf = (i: TimelineItem, n: number) =>
  i.kind === "food" ? `f:${i.logId}` : i.kind === "workout" ? `w:${i.sessionId}` : i.kind === "cardio" ? `c:${i.id}` : `${i.kind}:${n}`;

const target = (i: TimelineItem) =>
  i.kind === "food" ? { kind: "food" as const, id: i.logId } : i.kind === "workout" ? { kind: "workout" as const, id: i.sessionId } : i.kind === "cardio" ? { kind: "cardio" as const, id: i.id } : { kind: i.kind };

/**
 * Edit my day: drag an item (or use the arrows) to where it happened and it
 * takes the time between its new neighbours; or type the time. Workouts and
 * cardio also take how long they really lasted — calories are recalculated.
 */
export function DayEditor({ items: initial }: { items: TimelineItem[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => initial.map((i, n) => ({ ...i, key: keyOf(i, n) })));
  const [drag, setDrag] = useState<{ key: string; over: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const refs = useRef(new Map<string, HTMLLIElement>());

  const save = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "common.error");
      router.refresh();
    });

  const setTime = (key: string, time: string) => {
    const row = rows.find((r) => r.key === key);
    if (!row || !/^\d{2}:\d{2}$/.test(time)) return;
    setRows((rs) => rs.map((r) => (r.key === key ? ({ ...r, time } as Row) : r)).sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99")));
    save(() => setItemTimeAction({ ...target(row), time }));
  };

  /** Moves `key` to index `to` among the other rows and gives it the in-between time. */
  const moveTo = (key: string, to: number) => {
    const others = rows.filter((r) => r.key !== key);
    const clamped = Math.max(0, Math.min(others.length, to));
    setTime(key, timeForPosition(others.map((r) => r.time), clamped));
  };

  const onPointerDown = (key: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ key, over: rows.findIndex((r) => r.key === key) });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const others = rows.filter((r) => r.key !== drag.key);
    let over = others.length;
    for (let i = 0; i < others.length; i++) {
      const el = refs.current.get(others[i].key);
      if (el && e.clientY < el.getBoundingClientRect().top + el.offsetHeight / 2) {
        over = i;
        break;
      }
    }
    if (over !== drag.over) setDrag({ ...drag, over });
  };
  const onPointerUp = () => {
    if (drag) moveTo(drag.key, drag.over);
    setDrag(null);
  };

  // While dragging, show the dragged row at its prospective place.
  const shown = drag
    ? (() => {
        const others = rows.filter((r) => r.key !== drag.key);
        const moving = rows.find((r) => r.key === drag.key)!;
        return [...others.slice(0, drag.over), moving, ...others.slice(drag.over)];
      })()
    : rows;

  const field = "h-11 rounded-md border border-line bg-sand px-2.5 text-[16px] font-bold tabular outline-none focus:border-lime";

  return (
    <div onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => setDrag(null)}>
      <p className="mb-4 text-[15px] text-muted">{t("day.editHelp")}</p>
      {error && (
        <p role="alert" className="mb-3 text-sm text-terracotta">
          {t(error as MessageKey)}
        </p>
      )}
      <ol className="space-y-2">
        {shown.map((r, i) => {
          const Icon = r.kind === "wake" ? Sunrise : r.kind === "workout_plan" ? AlarmClock : r.kind === "workout" ? Dumbbell : r.kind === "cardio" ? HeartPulse : r.slot === QUICK_SLOT.morning ? CupSoda : Utensils;
          const title =
            r.kind === "wake"
              ? t("today.tl.wake")
              : r.kind === "workout_plan"
                ? t("today.tl.plan")
                : r.kind === "workout"
                  ? (r.label ?? t("today.tl.workoutDone"))
                  : r.kind === "cardio"
                    ? t(`cardio.act.${r.activity}` as MessageKey)
                    : r.title;
          const dragging = drag?.key === r.key;
          return (
            <li
              key={r.key}
              ref={(el) => {
                if (el) refs.current.set(r.key, el);
                else refs.current.delete(r.key);
              }}
              className={cn("rounded-md bg-surface p-3 transition-shadow", dragging && "relative z-10 shadow-[var(--shadow-lift)] ring-2 ring-lime")}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onPointerDown={onPointerDown(r.key)}
                  className="grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted active:cursor-grabbing"
                  aria-label={t("day.drag", { what: title })}
                >
                  <GripVertical className="size-5" aria-hidden />
                </button>
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-sand text-lime">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 leading-snug font-semibold">{title}</p>
                  {r.kind === "food" && (
                    <p className="text-xs text-muted tabular">
                      {r.kcal} kcal · {t("day.p")} {r.proteinG} g · {t("day.c")} {r.carbsG} g · {t("day.f")} {r.fatG} g · {t("day.fibre")} {r.fibreG} g
                    </p>
                  )}
                </div>
                <input
                  type="time"
                  value={r.time ?? ""}
                  onChange={(e) => setTime(r.key, e.target.value)}
                  disabled={pending}
                  className={cn(field, "w-[6.6rem]")}
                  aria-label={t("day.timeOf", { what: title })}
                />
              </div>
              <div className="mt-2 flex items-center gap-2 pl-[3.25rem]">
                <button type="button" onClick={() => moveTo(r.key, i - 1)} disabled={i === 0 || pending} className="grid size-9 place-items-center rounded-md bg-sand disabled:opacity-40" aria-label={t("day.earlier", { what: title })}>
                  <ChevronUp className="size-4" aria-hidden />
                </button>
                <button type="button" onClick={() => moveTo(r.key, i + 1)} disabled={i === shown.length - 1 || pending} className="grid size-9 place-items-center rounded-md bg-sand disabled:opacity-40" aria-label={t("day.later", { what: title })}>
                  <ChevronDown className="size-4" aria-hidden />
                </button>
                {((r.kind === "workout" && r.status === "completed") || r.kind === "cardio") && (
                  <label className="ml-auto flex items-center gap-1.5 text-sm whitespace-nowrap text-ink-2">
                    {t("day.howLong")}
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={360}
                      defaultValue={r.minutes ?? undefined}
                      disabled={pending}
                      onBlur={(e) => {
                        const n = Math.round(Number(e.target.value));
                        if (!(n >= 1 && n <= 360) || n === r.minutes) return;
                        save(() => (r.kind === "workout" ? setWorkoutMinutesAction({ id: r.sessionId, minutes: n }) : setCardioMinutesAction({ id: r.id, minutes: n })));
                      }}
                      className={cn(field, "w-16 text-center")}
                      aria-label={t("day.minutesOf", { what: title })}
                    />
                    {t("common.min")}
                    {r.kcal != null && <span className="text-muted tabular">· {r.kcal} kcal</span>}
                  </label>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
