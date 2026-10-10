"use client";

import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";

export type PlanDay = { index: number; date: string; done: boolean };

/** "‹ 📅 Today ›" — step day by day, or open the month calendar (ticks on days with every meal cooked). */
export function PlanDateNav({ days, current, today, locale }: { days: PlanDay[]; current: number; today: number; locale: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(current);
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...o, timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  const cur = days[current];
  const label = current === today ? t("common.today") : fmt(cur.date, { weekday: "short", day: "numeric", month: "short" });
  const byDate = new Map(days.map((d) => [d.date, d]));
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))];
  const dow = Array.from({ length: 7 }, (_, i) => fmt(`2026-10-${String(4 + i).padStart(2, "0")}`, { weekday: "narrow" }));
  const arrow = "grid size-11 place-items-center rounded-full bg-sand text-charcoal hover:bg-sand-2";

  return (
    <div className="flex items-center justify-between">
      {current > 0 ? (
        <Link href={`/planner?day=${current - 1}`} className={arrow} aria-label={t("meals.prevDay")}>
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
      ) : (
        <span className="size-11" />
      )}
      <button
        type="button"
        onClick={() => {
          setPicked(current);
          setOpen(true);
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-[17px] font-semibold hover:bg-sand"
        aria-haspopup="dialog"
      >
        <CalendarDays className="size-5" aria-hidden /> {label}
      </button>
      {current < days.length - 1 ? (
        <Link href={`/planner?day=${current + 1}`} className={arrow} aria-label={t("meals.nextDay")}>
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      ) : (
        <span className="size-11" />
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={t("meals.pickDay")} closeLabel={t("common.close")}>
        <div className="grid grid-cols-7 border-b border-line pb-2 text-center text-sm font-bold text-ink-2">
          {dow.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        {months.map((m) => {
          const first = new Date(m + "-01T00:00:00Z");
          const lead = first.getUTCDay();
          const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
          return (
            <div key={m} className="mt-4">
              <p className="mb-2 font-bold">{fmt(m + "-01", { month: "long", year: "numeric" })}</p>
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {Array.from({ length: lead }, (_, i) => (
                  <span key={`b${i}`} />
                ))}
                {Array.from({ length: count }, (_, i) => {
                  const date = `${m}-${String(i + 1).padStart(2, "0")}`;
                  const d = byDate.get(date);
                  const sel = d?.index === picked;
                  return (
                    <button
                      key={date}
                      type="button"
                      disabled={!d}
                      onClick={() => d && setPicked(d.index)}
                      aria-pressed={sel}
                      className={cn("mx-auto flex h-12 w-11 flex-col items-center justify-center rounded-full text-[16px] tabular disabled:text-muted/50", sel && "bg-lime font-bold text-on-accent")}
                    >
                      {i + 1}
                      {d?.done && <Check className={cn("size-3", sel ? "text-on-accent" : "text-[#16a34a]")} strokeWidth={3.5} aria-label={t("meals.cooked")} />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="sticky bottom-0 -mx-5 mt-4 flex items-center justify-between border-t border-line bg-surface px-5 pt-3">
          <button type="button" className="min-h-12 px-2 font-semibold" onClick={() => setPicked(today)}>
            {t("meals.clear")}
          </button>
          <button
            type="button"
            className="inline-flex min-h-13 items-center gap-6 bg-lime px-6 text-[18px] font-bold text-on-accent"
            onClick={() => {
              setOpen(false);
              router.push(picked === today ? "/planner" : `/planner?day=${picked}`);
            }}
          >
            {t("meals.apply")} <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
      </Sheet>
    </div>
  );
}
