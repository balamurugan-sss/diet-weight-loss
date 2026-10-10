import { AlarmClock, CupSoda, Dumbbell, HeartPulse, PencilLine, Play, Sunrise, Utensils } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { TFunc } from "@/lib/i18n/t";
import { QUICK_SLOT } from "@/lib/today/quickFoods";
import { toMinutes, type TimelineItem } from "@/lib/today/timeline";
import { RemoveLogButton } from "./RemoveLogButton";

const QUICK = new Set<string>(Object.values(QUICK_SLOT));

function iconFor(item: TimelineItem) {
  if (item.kind === "wake") return Sunrise;
  if (item.kind === "workout_plan") return AlarmClock;
  if (item.kind === "workout") return Dumbbell;
  if (item.kind === "cardio") return HeartPulse;
  return item.slot === QUICK_SLOT.morning ? CupSoda : Utensils;
}

/** The day's activity line: time on the left, what happened on the right, with a "now" marker. */
export function DayTimeline({ items, now, t }: { items: TimelineItem[]; now: string; t: TFunc }) {
  const nowMin = toMinutes(now);
  const nowAt = items.findIndex((i) => i.time != null && toMinutes(i.time) > nowMin);
  const hm = (min: number) => t("health.hm", { h: Math.floor(min / 60), m: min % 60 });

  const rows = items.map((item) => {
    const Icon = iconFor(item);
    const future = item.time != null && toMinutes(item.time) > nowMin;
    let title: string;
    let detail: string | null = null;
    let action: React.ReactNode = null;
    switch (item.kind) {
      case "wake":
        title = t("today.tl.wake");
        detail = [
          item.sleepMinutes != null ? t("today.tl.slept", { hm: hm(item.sleepMinutes) }) : null,
          item.sleepStart ? t("today.tl.bed", { time: item.sleepStart }) : null,
          item.source === "device" ? t("today.tl.fromWatch") : null,
        ]
          .filter(Boolean)
          .join(" · ");
        break;
      case "food":
        title = item.title;
        detail = `${t(`slot.${item.slot}` as MessageKey)} · ${item.kcal} kcal${item.proteinG >= 3 ? ` · ${item.proteinG} g ${t("macro.protein").toLowerCase()}` : ""}`;
        if (QUICK.has(item.slot)) action = <RemoveLogButton logId={item.logId} label={t("today.tl.remove", { what: item.title })} />;
        break;
      case "workout_plan":
        title = t("today.tl.plan");
        detail = t("today.tl.planDetail");
        break;
      case "workout":
        title = item.recovery ? t("wk.recoveryDay") : item.status === "completed" ? t("today.tl.workoutDone") : t("today.tl.workoutNow");
        detail =
          item.status === "completed"
            ? [item.end ? `${item.time}–${item.end}` : null, item.minutes != null ? t("wk.minutes", { n: item.minutes }) : null, item.kcal != null ? t("wk.kcal", { n: item.kcal }) : null]
                .filter(Boolean)
                .join(" · ")
            : t("today.tl.inProgress");
        action =
          item.status === "completed" ? (
            !item.recovery && (
              <Link href={`/workouts/session/${item.dayIndex}/edit`} className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-semibold text-forest hover:bg-forest-50">
                <PencilLine className="size-4" aria-hidden /> {t("today.tl.edit")}
              </Link>
            )
          ) : (
            <Link href={`/workouts/session/${item.dayIndex}`} className="inline-flex h-9 items-center gap-1 rounded-lg bg-lime px-2.5 text-sm font-bold text-white">
              <Play className="size-4" aria-hidden /> {t("today.tl.resume")}
            </Link>
          );
        break;
      case "cardio":
        title = t(`cardio.act.${item.activity}` as MessageKey);
        detail = `${t("wk.minutes", { n: item.minutes })} · ${t("wk.kcal", { n: item.kcal })}`;
        break;
    }
    return { item, Icon, title, detail, action, future };
  });

  const marker = (
    <li key="now" className="relative flex items-center gap-3 py-1" aria-label={t("today.tl.now", { time: now })}>
      <span className="w-12 text-right font-display text-sm font-extrabold text-forest tabular">{now}</span>
      <span className="relative z-10 size-3 -skew-x-12 bg-lime ring-4 ring-surface" aria-hidden />
      <span className="h-0.5 flex-1 bg-lime/60" aria-hidden />
    </li>
  );

  return (
    <section className="card p-4" aria-labelledby="tl-title">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 id="tl-title" className="text-[1.35rem]">
          {t("today.tl.title")}
        </h2>
        <span className="text-sm text-muted">{t("today.tl.count", { n: items.length })}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[15px] text-muted">{t("today.tl.empty")}</p>
      ) : (
        <ol className="relative">
          <span className="absolute top-2 bottom-2 left-[3.95rem] w-0.5 bg-line" aria-hidden />
          {rows.map(({ item, Icon, title, detail, action, future }, i) => (
            <FragmentRow key={`${item.kind}-${i}`} showMarker={i === nowAt} marker={marker}>
              <li className={cn("relative flex items-start gap-3 py-2", future && "opacity-60")}>
                <span className="w-12 pt-1.5 text-right font-display text-[15px] font-bold text-ink-2 tabular">{item.time ?? "—"}</span>
                <span className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-lg", item.kind === "workout" ? "bg-lime text-white" : "bg-sand text-forest")}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="leading-tight font-semibold">{title}</p>
                  {detail && <p className="text-sm text-muted">{detail}</p>}
                </div>
                {action}
              </li>
            </FragmentRow>
          ))}
          {nowAt === -1 && marker}
        </ol>
      )}
    </section>
  );
}

function FragmentRow({ showMarker, marker, children }: { showMarker: boolean; marker: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      {showMarker && marker}
      {children}
    </>
  );
}
