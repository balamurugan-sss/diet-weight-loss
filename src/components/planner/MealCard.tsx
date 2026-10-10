"use client";

import { ArrowLeftRight, CheckCircle2, Clock, PlusCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { RecipeVisual } from "@/components/recipes/RecipeVisual";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Stepper } from "@/components/ui/Stepper";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { friendlyNumber } from "@/lib/recipes/measures";
import { recipeFeedbackAction } from "@/server/actions/feedback";
import { applyAlternativeAction, getAlternativesAction, setPortionAction, swapIngredientAction, toggleEatenAction, type Alternative } from "@/server/actions/plans";
import type { DayItemView } from "@/server/services/dayView";

/**
 * One meal in the plan, as in the reference: slot name, a big photo with the
 * time and title on it, then "Mark as cooked" and "Swap". Portions and
 * ingredient swaps live inside the Swap sheet to keep the card simple.
 */
export function MealCard({ planId, dayIndex, slot, time, items, editable, swapsLeft }: { planId: string; dayIndex: number; slot: string; time: string; items: DayItemView[]; editable: boolean; swapsLeft?: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [swapOpen, setSwapOpen] = useState(false);
  const [alts, setAlts] = useState<Alternative[] | null>(null);
  const [feedback, setFeedback] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lead = items.find((i) => i.course !== "base" && i.course !== "accompaniment") ?? items[0];
  const done = items.every((i) => i.completed);
  // Cards show the short name ("Cherupayar Curry"); the full name is on the recipe page.
  const title = items.map((i) => i.title.replace(/\s*\([^)]*\)/g, "").trim()).join(" + ");
  const kcal = items.reduce((s, i) => s + i.kcal, 0);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? "common.error");
      setError(null);
      after?.();
      router.refresh();
    });

  const cooked = () =>
    run(
      async () => {
        for (const it of items) if (it.completed === done) await toggleEatenAction(it.id);
        return { ok: true };
      },
      () => !done && setFeedback(true),
    );

  const bar = "flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-[13px] font-medium transition-colors hover:bg-sand-2 disabled:opacity-50";

  return (
    <section aria-label={t(`slot.${slot}` as MessageKey)}>
      <h2 className="mb-2 text-[1.2rem] font-bold">{t(`slot.${slot}` as MessageKey)}</h2>
      <article className="overflow-hidden rounded-md bg-surface">
        <Link href={`/recipes/${lead.slug}?item=${lead.id}`} className="relative block">
          <RecipeVisual
            recipeId={lead.recipeId}
            palette={lead.palette}
            image={lead.image}
            alt={title}
            showLabel={false}
            labels={{ ai: t("recipe.illustration"), photo: t("recipe.verifiedPhoto"), placeholder: t("recipe.illustrationPlaceholder") }}
            className="aspect-[16/10] w-full"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-sm bg-white px-2 py-0.5 text-[13px] font-bold text-[#141414] tabular">
              <Clock className="size-3.5 text-[#16a34a]" aria-hidden /> {time}
            </span>
            <p className="text-[1.35rem] leading-tight font-bold text-white">{title}</p>
            <p className="mt-0.5 text-sm text-white/75 tabular">
              {kcal} kcal · {lead.totalMin} {t("common.min")}
            </p>
          </div>
          {done && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-sm bg-lime px-2 py-1 text-sm font-bold text-on-accent">
              <CheckCircle2 className="size-4" aria-hidden /> {t("meals.cooked")}
            </span>
          )}
        </Link>
        {editable && (
          <div className="flex divide-x divide-line bg-sand">
            <button type="button" onClick={cooked} disabled={pending} className={cn(bar, done ? "text-muted" : "text-lime")} aria-pressed={done}>
              {done ? <CheckCircle2 className="size-6" aria-hidden /> : <PlusCircle className="size-6" aria-hidden />}
              {done ? t("meals.cooked") : t("meals.markCooked")}
            </button>
            <button
              type="button"
              className={cn(bar, "text-muted")}
              onClick={() => {
                setSwapOpen(true);
                setAlts(null);
                start(async () => setAlts(await getAlternativesAction(planId, dayIndex, slot)));
              }}
            >
              <ArrowLeftRight className="size-6" aria-hidden /> {t("meals.swap")}
            </button>
          </div>
        )}
      </article>
      {error && <p className="mt-2 text-sm text-terracotta">{t(error as MessageKey)}</p>}

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
                  onClick={() => run(() => applyAlternativeAction(planId, dayIndex, slot, a.meal), () => setSwapOpen(false))}
                  className="w-full rounded-md bg-sand p-3 text-left transition-colors hover:bg-sand-2"
                >
                  <span className="block leading-snug font-semibold">{a.titles.join(" + ")}</span>
                  <span className="mt-1 flex flex-wrap gap-2 text-[13px] text-muted tabular">
                    <span className="font-semibold text-charcoal">{a.kcal} kcal</span>
                    <span>P {a.proteinG} g</span>
                    <span>Net C {a.netCarbsG} g</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 space-y-3 border-t border-line pt-4">
          <p className="text-sm font-bold text-muted">{t("meals.adjust")}</p>
          {items.map((it) => (
            <div key={it.id} className="rounded-md bg-sand p-3">
              <p className="mb-2 font-semibold">{it.title}</p>
              <Stepper label={t("planner.portion")} value={it.portion} min={0.25} max={3} step={0.25} format={(v) => `${friendlyNumber(v)}×`} onChange={(v) => run(() => setPortionAction(it.id, v))} />
              {it.substitutions.map((s) => {
                const active = it.swaps.some((x) => x.from === s.from && x.to === s.to);
                return (
                  <button
                    key={s.from + s.to}
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => swapIngredientAction(it.id, s.from, active ? null : s.to))}
                    className={cn("mt-2 block w-full rounded-md border p-2.5 text-left text-sm", active ? "border-lime bg-forest-50" : "border-line")}
                  >
                    <span className="font-semibold">
                      {s.fromName} → {s.toName}
                      {active && " ✓"}
                    </span>
                    <span className="block text-muted">{s.note}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </Sheet>

      <Sheet open={feedback} onClose={() => setFeedback(false)} title={t("meals.fb.title")} closeLabel={t("common.close")}>
        <p className="text-center text-muted">{t("meals.fb.body")}</p>
        <div className="my-6 flex justify-center gap-10 border-t border-line pt-6">
          {[true, false].map((v) => {
            const Icon = v ? ThumbsUp : ThumbsDown;
            return (
              <button
                key={String(v)}
                type="button"
                onClick={() => setLiked(v)}
                aria-pressed={liked === v}
                aria-label={v ? t("meals.fb.yes") : t("meals.fb.no")}
                className={cn("grid size-24 place-items-center rounded-md transition-colors", liked === v ? "bg-lime text-on-accent" : "bg-sand text-muted hover:bg-sand-2")}
              >
                <Icon className="size-12" aria-hidden />
              </button>
            );
          })}
        </div>
        <Button
          variant="lime"
          size="xl"
          className="w-full justify-between"
          disabled={liked == null || pending}
          onClick={() => start(async () => {
            await recipeFeedbackAction({ recipeId: lead.recipeId, liked });
            setFeedback(false);
          })}
        >
          {t("meals.fb.submit")} <span aria-hidden>→</span>
        </Button>
      </Sheet>
    </section>
  );
}
