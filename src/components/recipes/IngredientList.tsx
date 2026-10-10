"use client";

import { AlertTriangle } from "lucide-react";
import { Tx, useI18n } from "@/components/i18n/I18nProvider";
import { Segmented, Stepper } from "@/components/ui/Stepper";
import { cn } from "@/lib/cn";
import { displayQuantity, type UnitSystem } from "@/lib/recipes/measures";
import type { UnitWeights } from "@/lib/recipes/types";

export type IngredientLineView = {
  ingredientId: string;
  name: string;
  nameTa: string | null;
  nameMl: string | null;
  grams: number;
  measureText: string | null;
  prepNote: string | null;
  optional: boolean;
  toTaste: boolean;
  category: string;
  unitWeights: UnitWeights;
  densityGPerMl: number | null;
  hiddenCarbNote: string | null;
  allergens: string[];
};

export function localName(l: Pick<IngredientLineView, "name" | "nameTa" | "nameMl">, lang: string) {
  if (lang === "ta" && l.nameTa) return l.nameTa;
  if (lang === "ml" && l.nameMl) return l.nameMl;
  return l.name;
}

export function IngredientList({
  lines,
  baseServings,
  servings,
  onServings,
  units,
  onUnits,
  checkable = false,
  checked,
  onToggle,
  large = false,
}: {
  lines: IngredientLineView[];
  baseServings: number;
  servings: number;
  onServings: (n: number) => void;
  units: UnitSystem;
  onUnits: (u: UnitSystem) => void;
  checkable?: boolean;
  checked?: Set<string>;
  onToggle?: (id: string) => void;
  large?: boolean;
}) {
  const { t, lang } = useI18n();
  const factor = servings / baseServings;
  const hidden = lines.filter((l) => l.hiddenCarbNote && !l.optional);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink-2">{t("cook.servings")}</span>
          <Stepper label={t("cook.servings")} value={servings} min={1} max={24} onChange={onServings} size={large ? "lg" : "md"} />
        </div>
        <Segmented
          label={t("settings.units")}
          value={units}
          onChange={onUnits}
          options={[
            { value: "kitchen", label: t("recipe.units.kitchen") },
            { value: "metric", label: t("recipe.units.metric") },
          ]}
        />
      </div>
      <ul className="divide-y divide-line">
        {lines.map((l) => {
          const q = displayQuantity(l, l, factor, units);
          const name = localName(l, lang);
          const isChecked = checked?.has(l.ingredientId);
          const body = (
            <>
              <span className={cn("min-w-0 flex-1", isChecked && "text-muted line-through")}>
                <span className={cn("font-medium", large && "text-lg")}>
                  <Tx>{name}</Tx>
                </span>
                {name !== l.name && <span className="block text-xs text-muted">{l.name}</span>}
                {(l.prepNote || l.optional || l.toTaste) && (
                  <span className="block text-sm text-muted">
                    {[l.prepNote, l.toTaste && t("recipe.toTaste"), l.optional && t("recipe.optional")].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
              <span className={cn("shrink-0 text-right tabular", large ? "text-lg" : "")}>
                <span className="block font-semibold">{q.primary}</span>
                {q.secondary && <span className="block text-xs text-muted">{q.secondary}</span>}
              </span>
            </>
          );
          return (
            <li key={l.ingredientId + (l.prepNote ?? "")}>
              {checkable ? (
                <label className={cn("flex cursor-pointer items-start gap-3", large ? "py-4" : "py-3")}>
                  <input type="checkbox" checked={!!isChecked} onChange={() => onToggle?.(l.ingredientId)} className="mt-1 size-5 accent-[var(--color-forest)]" />
                  {body}
                </label>
              ) : (
                <div className={cn("flex items-start gap-3", large ? "py-4" : "py-3")}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {hidden.length > 0 && (
        <div className="mt-4 rounded-2xl bg-amber-100 p-3 text-sm text-amber-ink">
          <p className="mb-1 flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="size-4" aria-hidden /> {t("recipe.hiddenCarbs")}
          </p>
          <ul className="list-disc space-y-0.5 pl-5">
            {hidden.map((l) => (
              <li key={l.ingredientId}>{l.hiddenCarbNote}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
