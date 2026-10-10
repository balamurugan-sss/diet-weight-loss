"use client";

import { Droplets, Minus, Plus, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { inputClass } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/Button";
import { addWaterAction, logWeightAction } from "@/server/actions/progress";

export function WaterTracker({ ml, goalMl }: { ml: number; goalMl: number }) {
  const { t } = useI18n();
  const [, start] = useTransition();
  const [value, setOptimistic] = useOptimistic(ml);
  const glasses = Math.round(goalMl / 250);
  const filled = Math.floor(value / 250);
  const change = (d: number) =>
    start(async () => {
      setOptimistic(Math.max(0, value + d));
      await addWaterAction(d);
    });
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Droplets className="size-5 text-water" aria-hidden /> {t("macro.water")}
        </h2>
        <span className="text-sm text-muted tabular">
          <span className="font-semibold text-charcoal">{(value / 1000).toFixed(2)}</span> / {(goalMl / 1000).toFixed(1)} L
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-hidden>
        {Array.from({ length: glasses }, (_, i) => (
          <span key={i} className={`h-7 w-5 rounded-b-lg rounded-t-sm border-2 transition-colors ${i < filled ? "border-water bg-water/80" : "border-water/30 bg-water-100"}`} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => change(-250)} aria-label="−250 ml" disabled={value <= 0}>
          <Minus className="size-4" />
        </Button>
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => change(250)}>
          <Plus className="size-4" aria-hidden /> {t("home.addWater")} (250 ml)
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">{t("targets.waterHelp")}</p>
    </section>
  );
}

export function WeightQuickLog({ current }: { current: number | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const [w, setW] = useState(current ? String(current) : "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  return (
    <section className="card p-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <Scale className="size-5 text-forest" aria-hidden /> {t("home.logWeight")}
      </h2>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await logWeightAction(Number(w));
            setSaved(r.ok);
            router.refresh();
          });
        }}
      >
        <div className="relative flex-1">
          <input className={inputClass} inputMode="decimal" type="number" step="0.1" min={25} max={300} value={w} onChange={(e) => (setW(e.target.value), setSaved(false))} aria-label={t("progress.weight")} />
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">kg</span>
        </div>
        <Button type="submit" disabled={pending || !w}>
          {saved ? "✓" : t("common.save")}
        </Button>
      </form>
    </section>
  );
}
