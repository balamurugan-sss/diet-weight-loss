"use client";

import { ArrowLeftRight, Check, ChefHat, Clock, Repeat2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { RecipeVisual } from "@/components/recipes/RecipeVisual";
import { Button, buttonClass } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import { Stepper } from "@/components/ui/Stepper";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { friendlyNumber } from "@/lib/recipes/measures";
import {
  applyAlternativeAction,
  getAlternativesAction,
  setPortionAction,
  swapIngredientAction,
  toggleEatenAction,
  type Alternative,
} from "@/server/actions/plans";
import type { DayItemView } from "@/server/services/dayView";

export function MealSlot({
  planId,
  dayIndex,
  slot,
  items,
  kcal,
  editable = true,
  swapsLeft,
}: {
  planId: string;
  dayIndex: number;
  slot: string;
  items: DayItemView[];
  kcal: number;
  editable?: boolean;
  swapsLeft?: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [swapOpen, setSwapOpen] = useState(false);
  const [alts, setAlts] = useState<Alternative[] | null>(null);
  const [ingItem, setIngItem] = useState<DayItemView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lead = items.find((i) => i.course !== "base" && i.course !== "accompaniment") ?? items[0];
  const allDone = items.every((i) => i.completed);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "common.error");
      else {
        setError(null);
        router.refresh();
      }
    });

  return (
    <article className="card overflow-hidden">
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h3 className="font-semibold">{t(`slot.${slot}` as MessageKey)}</h3>
        <span className="text-sm font-semibold text-muted tabular">
          {kcal} {t("common.kcal")}
        </span>
      </header>
      <ul className="divide-y divide-line">
        {items.map((it) => (
          <li key={it.id} className={cn("flex gap-3 p-3 sm:p-4", it.completed && "bg-forest-50/50")}>
            <Link href={`/recipes/${it.slug}`} className="shrink-0">
              <RecipeVisual
                recipeId={it.recipeId}
                palette={it.palette}
                image={it.image}
                className="size-20 rounded-2xl sm:size-24"
                showLabel={false}
                alt={it.title}
                labels={{ ai: t("recipe.illustration"), photo: t("recipe.verifiedPhoto"), placeholder: t("recipe.illustrationPlaceholder") }}
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/recipes/${it.slug}`} className="line-clamp-2 leading-snug font-semibold hover:text-forest">
                {it.title}
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted tabular">
                <span className="font-semibold text-charcoal">{it.kcal} kcal</span>
                <span>P {it.proteinG} g</span>
                <span>Net C {it.netCarbsG} g</span>
                <span className="inline-flex items-center gap-0.5">
                  <Clock className="size-3" aria-hidden /> {it.totalMin}′
                </span>
              </p>
              {it.swaps.length > 0 && (
                <p className="mt-1 text-xs font-medium text-forest">
                  {it.swaps.map((s) => it.substitutions.find((x) => x.from === s.from && x.to === s.to)?.toName).filter(Boolean).join(", ")}
                </p>
              )}
              {editable && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Stepper
                    label={t("planner.portion")}
                    value={it.portion}
                    min={0.25}
                    max={3}
                    step={0.25}
                    format={(v) => `${friendlyNumber(v)}×`}
                    onChange={(v) => run(() => setPortionAction(it.id, v))}
                  />
                  {it.substitutions.length > 0 && (
                    <button type="button" onClick={() => setIngItem(it)} className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold text-forest hover:bg-forest-50">
                      <ArrowLeftRight className="size-4" aria-hidden /> {t("planner.swapIngredient")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {editable && (
        <footer className="flex flex-wrap items-center gap-2 border-t border-line p-3">
          <Link href={`/cook/${lead.slug}?item=${lead.id}`} className={buttonClass("lime", "sm")}>
            <ChefHat className="size-4" aria-hidden /> {t("home.startCooking")}
          </Link>
          <Button
            variant={allDone ? "secondary" : "outline"}
            size="sm"
            disabled={pending}
            onClick={() =>
              run(async () => {
                for (const it of items) if (it.completed === allDone) await toggleEatenAction(it.id);
                return { ok: true };
              })
            }
          >
            <Check className="size-4" aria-hidden /> {allDone ? t("home.eaten") : t("home.markEaten")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              setSwapOpen(true);
              setAlts(null);
              start(async () => setAlts(await getAlternativesAction(planId, dayIndex, slot)));
            }}
          >
            <Repeat2 className="size-4" aria-hidden /> {t("planner.swapMeal")}
          </Button>
        </footer>
      )}
      {error && <p className="px-4 pb-3 text-sm text-terracotta">{t(error as MessageKey)}</p>}

      <Sheet open={swapOpen} onClose={() => setSwapOpen(false)} title={t("planner.alternatives")} closeLabel={t("common.close")}>
        {swapsLeft !== undefined && <p className="mb-3 text-sm text-muted">{t("common.remaining", { n: swapsLeft })}</p>}
        {!alts ? (
          <p className="py-8 text-center text-muted">{t("common.loading")}</p>
        ) : (
          <ul className="space-y-2">
            {alts.map((a, i) => (
              <li key={i}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      const r = await applyAlternativeAction(planId, dayIndex, slot, a.meal);
                      if (r.ok) setSwapOpen(false);
                      return r;
                    })
                  }
                  className="w-full rounded-2xl border border-line p-3 text-left transition-colors hover:border-forest"
                >
                  <span className="block font-semibold leading-snug">{a.titles.join(" + ")}</span>
                  <span className="mt-1 flex flex-wrap gap-2 text-[13px] text-muted tabular">
                    <span className="font-semibold text-charcoal">{a.kcal} kcal</span>
                    <span>P {a.proteinG} g</span>
                    <span>Net C {a.netCarbsG} g</span>
                    <span>₹{a.costInr}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>

      <Sheet open={!!ingItem} onClose={() => setIngItem(null)} title={t("planner.swapIngredient")} closeLabel={t("common.close")}>
        {ingItem && (
          <ul className="space-y-2">
            {ingItem.substitutions.map((s) => {
              const active = ingItem.swaps.some((x) => x.from === s.from && x.to === s.to);
              return (
                <li key={s.from + s.to} className={cn("rounded-2xl border p-3", active ? "border-forest bg-forest-50" : "border-line")}>
                  <p className="font-semibold">
                    {s.fromName} → {s.toName} {active && <Badge tone="forest">✓</Badge>}
                  </p>
                  <p className="mt-1 text-sm text-muted">{s.note}</p>
                  <Button
                    size="sm"
                    variant={active ? "outline" : "secondary"}
                    className="mt-2"
                    disabled={pending}
                    onClick={() => run(async () => {
                      const r = await swapIngredientAction(ingItem.id, s.from, active ? null : s.to);
                      if (r.ok) setIngItem(null);
                      return r;
                    })}
                  >
                    {active ? t("common.cancel") : t("planner.swapIngredient")}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>
    </article>
  );
}
