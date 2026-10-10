"use client";

import { HeartPulse, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button, buttonClass } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import { Stepper } from "@/components/ui/Stepper";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { CARDIO_ACTIVITY_IDS, CARDIO_INTENSITIES, cardioEnergy, type CardioActivity, type CardioIntensity } from "@/lib/workouts/cardio";
import { logCardioAction } from "@/server/actions/cardio";

export function CardioLogButton({ date, maxDate, weightKg, variant = "primary" }: { date: string; maxDate: string; weightKg: number; variant?: "primary" | "outline" }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState<CardioActivity>("walk");
  const [intensity, setIntensity] = useState<CardioIntensity>("moderate");
  const [minutes, setMinutes] = useState(30);
  const [day, setDay] = useState(date);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const est = cardioEnergy(activity, intensity, minutes, weightKg);

  const save = () =>
    start(async () => {
      setError(null);
      const res = await logCardioAction({ date: day, activity, intensity, minutes });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else setError(t(res.error as MessageKey));
    });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDay(date);
          setOpen(true);
        }}
        className={buttonClass(variant, "sm")}
      >
        <Plus className="size-4" aria-hidden /> {t("cardio.log")}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t("cardio.log")} closeLabel={t("common.close")}>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-2">{t("cardio.activity")}</p>
            <div className="flex flex-wrap gap-2">
              {CARDIO_ACTIVITY_IDS.map((a) => (
                <Chip key={a} selected={activity === a} onClick={() => setActivity(a)}>
                  {t(`cardio.act.${a}` as MessageKey)}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-2">{t("cardio.intensity")}</p>
            <div role="radiogroup" aria-label={t("cardio.intensity")} className="grid grid-cols-3 gap-2">
              {CARDIO_INTENSITIES.map((i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={intensity === i}
                  onClick={() => setIntensity(i)}
                  className={cn(
                    "rounded-2xl border p-2.5 text-left transition-colors",
                    intensity === i ? "border-forest bg-forest-50 ring-2 ring-forest/15" : "border-line bg-surface hover:border-forest/40",
                  )}
                >
                  <span className="block text-sm font-semibold">{t(`cardio.int.${i}` as MessageKey)}</span>
                  <span className="block text-xs leading-snug text-muted">{t(`cardio.int.${i}.help` as MessageKey)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-ink-2">{t("cardio.minutes")}</p>
              <Stepper value={minutes} onChange={setMinutes} min={5} max={300} step={5} label={t("cardio.minutes")} format={(v) => `${v} min`} />
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink-2">{t("cardio.date")}</span>
              <input
                type="date"
                value={day}
                max={maxDate}
                onChange={(e) => setDay(e.target.value)}
                className="h-12 rounded-full border border-line bg-surface px-4 text-[15px] text-charcoal [color-scheme:inherit]"
              />
            </label>
          </div>
          <p className="flex items-center gap-2 text-sm font-medium text-forest">
            <HeartPulse className="size-4" aria-hidden /> {t("cardio.estimate", { kcal: est.kcal })}
          </p>
          {error && (
            <p role="alert" className="text-sm font-medium text-terracotta">
              {error}
            </p>
          )}
          <Button variant="lime" size="lg" className="w-full" onClick={save} disabled={pending}>
            {pending ? t("common.saving") : t("cardio.add", { n: minutes })}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
