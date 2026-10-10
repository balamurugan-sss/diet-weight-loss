"use client";

import { Footprints, Moon, Zap } from "lucide-react";
import { useActionState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { saveGoalsAction } from "@/server/actions/me";

export function GoalsForm({ steps, activeKcal, sleepHours }: { steps: number; activeKcal: number; sleepHours: number }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(saveGoalsAction, undefined);
  const fields = [
    { name: "steps", icon: Footprints, label: t("me.goals.steps"), help: t("me.goals.stepsHelp"), value: steps, step: 500, min: 1000, max: 50000, unit: t("me.goals.stepsUnit") },
    { name: "activeKcal", icon: Zap, label: t("me.goals.active"), help: t("me.goals.activeHelp"), value: activeKcal, step: 50, min: 50, max: 3000, unit: "kcal" },
    { name: "sleepHours", icon: Moon, label: t("me.goals.sleep"), help: t("me.goals.sleepHelp"), value: sleepHours, step: 0.5, min: 4, max: 12, unit: t("me.goals.hours") },
  ];
  return (
    <form action={action} className="space-y-3">
      {fields.map(({ name, icon: Icon, label, help, value, step, min, max, unit }) => (
        <label key={name} className="block rounded-md bg-surface p-4">
          <span className="flex items-center gap-2 text-[17px] font-bold">
            <Icon className="size-5 text-lime" aria-hidden /> {label}
          </span>
          <span className="mt-0.5 block text-sm text-muted">{help}</span>
          <span className="mt-3 flex items-center gap-2">
            <input
              name={name}
              type="number"
              inputMode="decimal"
              defaultValue={value}
              step={step}
              min={min}
              max={max}
              required
              className="h-12 w-36 rounded-md border border-line bg-sand px-3 text-xl font-bold tabular outline-none focus:border-lime"
            />
            <span className="text-muted">{unit}</span>
          </span>
        </label>
      ))}
      {state?.error && (
        <p role="alert" className="text-sm text-terracotta">
          {t(state.error as MessageKey)}
        </p>
      )}
      <Button type="submit" variant="lime" size="xl" className="w-full justify-between" disabled={pending}>
        {pending ? t("common.saving") : t("me.goals.save")} <span aria-hidden>→</span>
      </Button>
    </form>
  );
}
