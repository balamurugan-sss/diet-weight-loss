import Link from "next/link";
import { cn } from "@/lib/cn";

export type StripDay = { date: string; dow: string; num: number; today: boolean; selected: boolean; workout: boolean; done: boolean };

/** S M T W T F S across the top; today filled orange, the selected day ringed, a dot under training days. */
export function WeekStrip({ days, label }: { days: StripDay[]; label: string }) {
  return (
    <nav aria-label={label} className="-mx-4 bg-surface px-2 pt-2 pb-3 sm:mx-0 sm:rounded-md">
      <ol className="grid grid-cols-7">
        {days.map((d) => (
          <li key={d.date}>
            <Link
              href={d.today ? "/home" : `/home?d=${d.date}`}
              aria-current={d.selected ? "date" : undefined}
              className="flex flex-col items-center gap-1.5 py-1"
              scroll={false}
            >
              <span className="text-[12px] font-semibold text-muted">{d.dow}</span>
              <span
                className={cn(
                  "grid size-10 place-items-center rounded-full text-[17px] font-semibold tabular",
                  d.today ? "bg-lime text-on-accent" : d.selected ? "ring-2 ring-lime" : "text-charcoal",
                )}
              >
                {d.num}
              </span>
              <span className={cn("size-1.5 rounded-full", d.done ? "bg-lime" : d.workout ? "bg-charcoal/80" : "bg-transparent")} aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
