import { ArrowLeft, Check, ChevronLeft, ChevronRight, Dumbbell, Footprints, HeartPulse, Moon, X } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CardioDeleteButton } from "@/components/workouts/CardioDeleteButton";
import { CardioLogButton } from "@/components/workouts/CardioLogButton";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { dayTypeForFocus, type DayType } from "@/lib/workouts/cardio";
import { addDays, daysBetweenISO, weekStart, type CalendarCell } from "@/lib/workouts/progress";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { cardioBetween } from "@/server/services/cardio";
import { bodyWeight, getActiveProgram, programProgress } from "@/server/services/workouts";
import { todayISO } from "@/server/time";
import { dayTitle } from "@/lib/workouts/label";

export const metadata = { title: "Training calendar" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const TYPE_STYLE: Record<DayType, { cell: string; icon: typeof Dumbbell }> = {
  strength: { cell: "bg-forest-50 text-forest", icon: Dumbbell },
  cardio: { cell: "bg-water-100 text-water", icon: HeartPulse },
  recovery: { cell: "bg-amber-100 text-amber-ink", icon: Footprints },
  rest: { cell: "bg-sand/60 text-muted", icon: Moon },
};

export default async function CalendarPage({ searchParams }: PageProps<"/workouts/calendar">) {
  const { user, profile } = await requireOnboarded();
  const { t, lang } = await getI18n();
  const locale = lang === "ta" ? "ta-IN" : lang === "ml" ? "ml-IN" : "en-IN";
  const sp = await searchParams;
  const today = todayISO();
  const monthParam = one(sp.m);
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : today.slice(0, 7);
  const first = `${month}-01`;
  const nextMonth = addDays(first, 32).slice(0, 7);
  const prevMonth = addDays(first, -1).slice(0, 7);
  const last = addDays(`${nextMonth}-01`, -1);
  const gridStart = weekStart(first);
  const gridEnd = addDays(weekStart(last), 6);
  const selectedParam = one(sp.d);
  const selected = selectedParam && /^\d{4}-\d{2}-\d{2}$/.test(selectedParam) ? selectedParam : first <= today && today <= last ? today : first;

  const program = await getActiveProgram(user.id);
  const [prog, cardio, kg] = await Promise.all([
    program ? programProgress(program, [gridStart, gridEnd], today) : null,
    cardioBetween(user.id, gridStart, gridEnd),
    bodyWeight(user.id, profile),
  ]);
  const cellByDate = new Map<string, CalendarCell>((prog?.cells ?? []).map((c) => [c.date, c]));
  const cardioByDate = new Map<string, typeof cardio>();
  for (const c of cardio) cardioByDate.set(c.date, [...(cardioByDate.get(c.date) ?? []), c]);

  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...o, timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  const days = Array.from({ length: daysBetweenISO(gridStart, gridEnd) + 1 }, (_, i) => addDays(gridStart, i));
  const typeOf = (cell: CalendarCell | undefined, cardioMin: number): DayType | null => {
    const planned = cell && cell.dayIndex != null && program ? program.days[cell.dayIndex] : null;
    if (planned) return dayTypeForFocus(planned.focus, planned.kind);
    return cardioMin > 0 ? "cardio" : null;
  };
  const shortLabel = (cell: CalendarCell | undefined) => {
    const planned = cell && cell.dayIndex != null && program ? program.days[cell.dayIndex] : null;
    return planned ? t(`wk.focusShort.${planned.kind === "workout" ? planned.focus : planned.kind}` as MessageKey) : "";
  };

  const sel = cellByDate.get(selected);
  const selPlanned = sel && sel.dayIndex != null && program ? program.days[sel.dayIndex] : null;
  const selCardio = cardioByDate.get(selected) ?? [];

  return (
    <div className="space-y-5">
      <Link href="/workouts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
        <ArrowLeft className="size-4" aria-hidden /> {t("wk.title")}
      </Link>

      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.7rem] leading-tight sm:text-3xl">{t("cal.title")}</h1>
          <p className="mt-0.5 text-[15px] text-muted">{fmt(first, { month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/workouts/calendar?m=${prevMonth}`} aria-label={t("cal.prev")} className="grid size-11 place-items-center rounded-full border border-line bg-surface hover:border-forest/50">
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <Link href={`/workouts/calendar?m=${nextMonth}`} aria-label={t("cal.next")} className="grid size-11 place-items-center rounded-full border border-line bg-surface hover:border-forest/50">
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        </div>
      </header>

      <Card className="p-2.5 sm:p-4">
        <div className="grid grid-cols-7 gap-1 pb-1.5 text-center text-[11px] font-semibold text-muted uppercase" aria-hidden>
          {days.slice(0, 7).map((d) => (
            <span key={d}>{fmt(d, { weekday: "narrow" })}</span>
          ))}
        </div>
        <ol className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const cell = cellByDate.get(d);
            const dayCardio = cardioByDate.get(d) ?? [];
            const cardioMin = dayCardio.reduce((n, c) => n + c.minutes, 0);
            const type = typeOf(cell, cardioMin);
            const style = type ? TYPE_STYLE[type] : null;
            const Icon = style?.icon;
            const inMonth = d.startsWith(month);
            const isToday = d === today;
            const isSel = d === selected;
            const status = cell?.status;
            const label = [
              fmt(d, { weekday: "long", day: "numeric", month: "long" }),
              type ? t(`cal.type.${type}` as MessageKey) : "",
              shortLabel(cell),
              status === "completed" ? t("wk.cal.completed") : status === "missed" ? t("wk.cal.missed") : "",
              cardioMin ? t("cal.cardioMin", { n: cardioMin }) : "",
            ]
              .filter(Boolean)
              .join(", ");
            return (
              <li key={d}>
                <Link
                  href={`/workouts/calendar?m=${month}&d=${d}`}
                  scroll={false}
                  aria-label={label}
                  aria-current={isSel ? "date" : undefined}
                  className={cn(
                    "relative flex aspect-[4/5] flex-col justify-between rounded-xl p-1 text-left transition-shadow sm:aspect-square sm:p-1.5",
                    style?.cell ?? "text-ink-2",
                    !inMonth && "opacity-35",
                    isSel && "ring-2 ring-forest",
                    isToday && !isSel && "ring-1 ring-forest/50",
                  )}
                >
                  <span className="flex items-start justify-between">
                    <span className={cn("text-[13px] leading-none font-bold tabular", isToday ? "text-charcoal" : "")}>{fmt(d, { day: "numeric" })}</span>
                    {status === "completed" && (
                      <span className="grid size-4 place-items-center rounded-full bg-lime text-white">
                        <Check className="size-3" strokeWidth={3.5} aria-hidden />
                      </span>
                    )}
                    {status === "missed" && <X className="size-3.5 text-terracotta" strokeWidth={3} aria-hidden />}
                  </span>
                  <span className="flex flex-col items-start gap-0.5">
                    {Icon && <Icon className="size-3.5" aria-hidden />}
                    {shortLabel(cell) && <span className="max-w-full truncate text-[10px] leading-none font-semibold">{shortLabel(cell)}</span>}
                    {cardioMin > 0 && <span className="rounded bg-water/20 px-0.5 text-[9.5px] leading-tight font-bold text-water tabular">{cardioMin}′</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-xs text-muted" aria-hidden>
          {(Object.keys(TYPE_STYLE) as DayType[]).map((k) => {
            const I = TYPE_STYLE[k].icon;
            return (
              <li key={k} className="flex items-center gap-1.5">
                <span className={cn("grid size-5 place-items-center rounded-md", TYPE_STYLE[k].cell)}>
                  <I className="size-3" />
                </span>
                {t(`cal.type.${k}` as MessageKey)}
              </li>
            );
          })}
          <li className="flex items-center gap-1.5">
            <span className="grid size-4 place-items-center rounded-full bg-lime text-white">
              <Check className="size-2.5" strokeWidth={4} />
            </span>
            {t("wk.cal.completed")}
          </li>
          <li className="flex items-center gap-1.5">
            <X className="size-3.5 text-terracotta" strokeWidth={3} /> {t("wk.cal.missed")}
          </li>
        </ul>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{fmt(selected, { weekday: "long", day: "numeric", month: "long" })}</h2>
          {selected <= today && <CardioLogButton date={selected} maxDate={today} weightKg={kg} />}
        </div>

        {selPlanned ? (
          <Link
            href={`/workouts/day/${sel!.dayIndex}`}
            className="mt-3 flex items-center gap-3 rounded-2xl bg-sand/70 p-3 hover:bg-sand"
          >
            {(() => {
              const type = dayTypeForFocus(selPlanned.focus, selPlanned.kind);
              const I = TYPE_STYLE[type].icon;
              return (
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", TYPE_STYLE[type].cell)}>
                  <I className="size-5" aria-hidden />
                </span>
              );
            })()}
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-muted">
                {t("wk.dayN", { n: sel!.dayIndex! + 1 })} · {sel!.status === "completed" ? t("wk.cal.completed") : sel!.status === "missed" ? t("wk.cal.missed") : t("cal.planned")}
              </span>
              <span className="block font-semibold">
                {dayTitle(selPlanned, t)}
              </span>
            </span>
            <ChevronRight className="size-4 text-muted" aria-hidden />
          </Link>
        ) : (
          !selCardio.length && <p className="mt-3 text-[15px] text-muted">{t("cal.nothing")}</p>
        )}

        {selCardio.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {selCardio.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-water-100 text-water">
                  <HeartPulse className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">
                    {t(`cardio.act.${c.activity}` as MessageKey)} · {c.minutes} {t("common.min")}
                  </span>
                  <span className="block text-sm text-muted">
                    {t(`cardio.int.${c.intensity}` as MessageKey)} · ≈ {c.kcal} {t("common.kcal")}
                    {c.source !== "manual" && <> · {t(`cardio.source.${c.source}` as MessageKey)}</>}
                  </span>
                </span>
                <CardioDeleteButton id={c.id} label={t("cardio.remove")} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
