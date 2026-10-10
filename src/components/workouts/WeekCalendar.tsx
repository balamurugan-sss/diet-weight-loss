import { Check, Dumbbell, Footprints, Moon, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CalendarCell } from "@/lib/workouts/progress";

type Labels = { completed: string; missed: string; upcoming: string; rest: string; today: string; recovery: string; title: string };

/** Mon–Sun strip: completed / missed / today / upcoming / rest, each with an icon and a text label. */
export function WeekCalendar({ cells, today, locale, labels }: { cells: CalendarCell[]; today: string; locale: string; labels: Labels }) {
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...o, timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  const statusLabel = (c: CalendarCell) =>
    c.status === "completed"
      ? labels.completed
      : c.status === "missed"
        ? labels.missed
        : c.status === "today"
          ? labels.today
          : c.status === "upcoming"
            ? labels.upcoming
            : c.status === "rest"
              ? c.kind === "recovery"
                ? labels.recovery
                : labels.rest
              : "";

  return (
    <div>
      <ol className="grid grid-cols-7 gap-1.5" aria-label={labels.title}>
        {cells.map((c) => {
          const isToday = c.date === today;
          const label = statusLabel(c);
          const glyph =
            c.status === "completed" ? (
              <span className="grid size-8 place-items-center rounded-full bg-lime text-[#0c0c0b]">
                <Check className="size-4.5" strokeWidth={3} aria-hidden />
              </span>
            ) : c.status === "missed" ? (
              <span className="grid size-8 place-items-center rounded-full border-2 border-terracotta/70 text-terracotta">
                <X className="size-4" strokeWidth={3} aria-hidden />
              </span>
            ) : c.status === "today" || c.status === "upcoming" ? (
              <span className={cn("grid size-8 place-items-center rounded-full", c.status === "today" ? "bg-forest text-on-accent" : "bg-sand-2 text-ink-2")}>
                <Dumbbell className="size-4" aria-hidden />
              </span>
            ) : c.status === "rest" ? (
              <span className="grid size-8 place-items-center rounded-full bg-sand text-muted">
                {c.kind === "recovery" ? <Footprints className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
              </span>
            ) : (
              <span className="grid size-8 place-items-center text-muted" aria-hidden>
                –
              </span>
            );
          const body = (
            <>
              <span className={cn("text-[11px] font-semibold uppercase", isToday ? "text-forest" : "text-muted")}>{fmt(c.date, { weekday: "narrow" })}</span>
              <span className={cn("text-sm font-semibold tabular", isToday ? "text-charcoal" : "text-ink-2")}>{fmt(c.date, { day: "numeric" })}</span>
              {glyph}
              <span className="sr-only">
                {fmt(c.date, { weekday: "long" })}: {label}
              </span>
            </>
          );
          const cls = cn("flex flex-col items-center gap-1 rounded-2xl py-2", isToday && "bg-forest-50 ring-1 ring-forest/30");
          return (
            <li key={c.date}>
              {c.dayIndex != null && c.kind !== "rest" ? (
                <Link href={`/workouts/day/${c.dayIndex}`} className={cn(cls, "hover:bg-sand")} title={label}>
                  {body}
                </Link>
              ) : (
                <div className={cls} title={label || undefined}>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted" aria-hidden>
        <li className="flex items-center gap-1.5">
          <span className="grid size-4 place-items-center rounded-full bg-lime text-[#0c0c0b]">
            <Check className="size-2.5" strokeWidth={4} />
          </span>
          {labels.completed}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="grid size-4 place-items-center rounded-full border-[1.5px] border-terracotta/70 text-terracotta">
            <X className="size-2.5" strokeWidth={4} />
          </span>
          {labels.missed}
        </li>
        <li className="flex items-center gap-1.5">
          <Dumbbell className="size-3.5" /> {labels.upcoming}
        </li>
        <li className="flex items-center gap-1.5">
          <Moon className="size-3.5" /> {labels.rest}
        </li>
      </ul>
    </div>
  );
}
