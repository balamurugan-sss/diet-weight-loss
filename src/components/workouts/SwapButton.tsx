"use client";

import { ArrowLeftRight, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Segmented } from "@/components/ui/Stepper";
import { Sheet } from "@/components/ui/Sheet";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Pattern } from "@/lib/workouts/types";
import { getSwapOptionsAction, swapExerciseAction, type SwapOption } from "@/server/actions/workouts";
import { ExerciseFigure } from "./ExerciseFigure";

export function SwapButton({ programId, dayIndex, slot, name, swapped }: { programId: string; dayIndex: number; slot: number; name: string; swapped: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<SwapOption[] | null>(null);
  const [scope, setScope] = useState<"day" | "all">("day");
  const [pending, start] = useTransition();
  const ref = { programId, dayIndex, slot };

  const show = () => {
    setOpen(true);
    setOptions(null);
    start(async () => setOptions(await getSwapOptionsAction(ref)));
  };
  const choose = (exerciseId: string | null) =>
    start(async () => {
      const res = await swapExerciseAction(ref, { exerciseId, scope });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    });

  return (
    <>
      <button type="button" onClick={show} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-semibold text-forest hover:border-forest/50">
        <ArrowLeftRight className="size-4" aria-hidden /> {t("wk.swap")}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t("wk.swapTitle", { name })} closeLabel={t("common.close")}>
        <div className="mb-4">
          <Segmented
            value={scope}
            onChange={setScope}
            label={t("wk.swap")}
            options={[
              { value: "day", label: t("wk.swapThisDay") },
              { value: "all", label: t("wk.swapEverywhere") },
            ]}
          />
        </div>
        {options === null ? (
          <p className="py-6 text-center text-muted">{t("common.loading")}</p>
        ) : options.length === 0 ? (
          <p className="py-6 text-center text-muted">{t("wk.noSwaps")}</p>
        ) : (
          <ul className="space-y-2">
            {options.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => choose(o.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 text-left hover:border-forest/50 disabled:opacity-60"
                >
                  <span className="size-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                    <ExerciseFigure pattern={o.pattern as Pattern} label={o.name} animate={false} className="h-full w-full p-1.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{o.name}</span>
                    <span className="block truncate text-sm text-muted">
                      {o.muscles.map((m) => t(`wk.muscle.${m}` as MessageKey)).join(", ")} ·{" "}
                      {o.equipment.length ? o.equipment.map((e) => t(`wk.eq.${e}` as MessageKey)).join(", ") : t("wk.bodyweight")}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-muted">{t(`wk.diff.${o.difficulty}` as MessageKey)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {swapped && (
          <button type="button" disabled={pending} onClick={() => choose(null)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
            <RotateCcw className="size-4" aria-hidden /> {t("wk.swapReset")}
          </button>
        )}
      </Sheet>
    </>
  );
}
