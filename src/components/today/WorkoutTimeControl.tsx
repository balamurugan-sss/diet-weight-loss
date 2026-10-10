"use client";

import { AlarmClock, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { setWorkoutTimeAction } from "@/server/actions/today";

/** "Training at 18:30 · in 2 h 5 min" with an inline editor. */
export function WorkoutTimeControl({ plan, now }: { plan: string | null; now: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(plan ?? "18:00");
  const [pending, start] = useTransition();
  const save = (v: string | null) =>
    start(async () => {
      const res = await setWorkoutTimeAction(v);
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    });

  if (editing)
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="time"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-11 rounded-lg border border-line bg-surface px-3 font-display text-xl font-bold tabular outline-none focus:border-forest"
          aria-label={t("today.q.plan")}
        />
        <Button size="md" variant="lime" disabled={pending || !value} onClick={() => save(value)}>
          {t("today.setTime")}
        </Button>
        {plan && (
          <Button size="md" variant="ghost" disabled={pending} onClick={() => save(null)}>
            <X className="size-4" aria-hidden /> {t("today.clearTime")}
          </Button>
        )}
      </div>
    );

  const [h, m] = (plan ?? "00:00").split(":").map(Number);
  const [nh, nm] = now.split(":").map(Number);
  const diff = h * 60 + m - (nh * 60 + nm);
  return (
    <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[15px] font-semibold hover:border-forest/50">
      <AlarmClock className="size-4 text-forest" aria-hidden />
      {plan
        ? diff > 0
          ? t("today.planAt", { time: plan, h: Math.floor(diff / 60), m: diff % 60 })
          : t("today.planWas", { time: plan })
        : t("today.planSet")}
    </button>
  );
}
