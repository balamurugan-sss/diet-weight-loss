"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { saveScheduleAction } from "@/server/actions/workouts";

/** Workout days: tap the weekdays to train (3–6). Saving restarts the 4-week plan from today on those days. */
export function ScheduleForm({ initial, labels }: { initial: number[]; labels: string[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [days, setDays] = useState<number[]>(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const changed = [...days].sort().join() !== [...initial].sort().join();
  const toggle = (d: number) => setDays((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]));
  const save = () =>
    start(async () => {
      setMsg(null);
      const res = await saveScheduleAction(days);
      if (res.ok) {
        setMsg(t("program.schedule.saved"));
        router.refresh();
      } else setMsg(t(res.error as MessageKey));
    });

  return (
    <div className="rounded-md bg-surface p-4">
      <p className="mb-3 text-sm text-ink-2">{t("program.schedule.days")}</p>
      <ul className="grid grid-cols-7 gap-1.5">
        {labels.map((l, d) => {
          const on = days.includes(d);
          return (
            <li key={d} className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-semibold text-muted">{l}</span>
              <button
                type="button"
                onClick={() => toggle(d)}
                aria-pressed={on}
                aria-label={l}
                className={cn("grid size-11 place-items-center rounded-full transition-colors", on ? "bg-lime text-on-accent" : "bg-sand-2 text-transparent hover:bg-sand")}
              >
                <Check className="size-5" strokeWidth={3} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-center font-bold">{t("program.schedule.title")}</p>
      <p className="text-center text-sm text-muted">
        {days.length < 3 || days.length > 6 ? t("program.schedule.count") : t("program.schedule.picked", { n: days.length })}
      </p>
      {changed && (
        <>
          <p className="mt-3 rounded-md bg-sand px-3 py-2 text-sm text-ink-2">{t("program.schedule.restart")}</p>
          <Button variant="lime" size="lg" className="mt-3 w-full" disabled={pending || days.length < 3 || days.length > 6} onClick={save}>
            {pending ? t("common.saving") : t("program.schedule.save")}
          </Button>
        </>
      )}
      {msg && (
        <p role="status" className="mt-2 text-center text-sm font-semibold text-forest">
          {msg}
        </p>
      )}
    </div>
  );
}
