"use client";

import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { addWaterAction, logWeightAction } from "@/server/actions/progress";

/** "Your current weight 74.1 kg · 6 kg left" with a Track button that opens a one-field logger. */
export function WeightTrack({ current, left }: { current: number | null; left: number | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current != null ? String(current) : "");
  const [pending, start] = useTransition();
  const save = () =>
    start(async () => {
      const res = await logWeightAction(Number(value));
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  return (
    <div className="rounded-md bg-surface p-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-ink-2">{t("me.currentWeight")}</p>
          <p className="flex items-baseline gap-2">
            <span className="text-[2.1rem] leading-tight font-extrabold tabular">{current ?? "—"} kg</span>
            {left != null && <span className="border-l border-line pl-2 text-[11px] font-bold tracking-[0.1em] text-muted uppercase">{t("me.kgLeft", { n: left })}</span>}
          </p>
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex flex-col items-center gap-1 border-l border-line pl-4 text-sm font-semibold text-lime">
          <PlusCircle className="size-6" aria-hidden /> {t("me.track")}
        </button>
      </div>
      {open && (
        <div className="mt-3 flex gap-2">
          <input
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={t("home.logWeight")}
            className="h-12 w-28 rounded-md border border-line bg-sand px-3 text-lg font-bold tabular outline-none focus:border-lime"
          />
          <span className="self-center text-muted">kg</span>
          <Button variant="lime" size="lg" className="ml-auto" disabled={pending || !(Number(value) > 25)} onClick={save}>
            {t("common.save")}
          </Button>
        </div>
      )}
    </div>
  );
}

/** +250 ml. */
export function WaterButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await addWaterAction(250);
          router.refresh();
        })
      }
      className="flex flex-col items-center gap-1 border-l border-line pl-4 text-sm font-semibold text-water"
    >
      <PlusCircle className="size-6" aria-hidden /> {label}
    </button>
  );
}
