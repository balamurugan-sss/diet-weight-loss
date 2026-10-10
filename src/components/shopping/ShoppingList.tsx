"use client";

import { AlertTriangle, Home, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Chip";
import { Stepper } from "@/components/ui/Stepper";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { SECTION_ORDER, type ShopRow } from "@/lib/shopping/aggregate";
import { setHouseholdSize, setShoppingState } from "@/server/actions/shopping";

type State = Record<string, { checked: boolean; haveAtHome: boolean }>;

export function ShoppingList({
  planId,
  weekIndex,
  rows,
  initialState,
  household,
  userAllergies,
  carbAware,
}: {
  planId: string;
  weekIndex: number;
  rows: ShopRow[];
  initialState: State;
  household: number;
  userAllergies: string[];
  carbAware: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [, start] = useTransition();
  const [state, apply] = useOptimistic(initialState, (s: State, p: { ids: string[]; patch: Partial<State[string]> }) => {
    const n = { ...s };
    for (const id of p.ids) n[id] = { ...{ checked: false, haveAtHome: false }, ...n[id], ...p.patch };
    return n;
  });
  const update = (ids: string[], patch: { checked?: boolean; haveAtHome?: boolean }) =>
    start(async () => {
      apply({ ids, patch });
      await setShoppingState(planId, weekIndex, ids, patch);
    });
  const toBuy = rows.filter((r) => !state[r.ingredientId]?.haveAtHome);
  const total = toBuy.reduce((s, r) => s + r.costInr, 0);
  const warnings = rows.filter((r) => (carbAware && r.hiddenCarbNote) || r.allergens.some((a) => userAllergies.includes(a)));
  const pantry = rows.filter((r) => r.pantryStaple && !state[r.ingredientId]?.haveAtHome);

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-muted">{t("shop.total")}</p>
          <p className="font-display text-3xl font-semibold tabular">₹{total.toLocaleString("en-IN")}</p>
          <p className="text-xs text-muted">{t("shop.costNote")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{t("shop.people", { n: household })}</span>
          <Stepper label={t("ob.kitchen.household")} value={household} min={1} max={12} onChange={(v) => start(async () => (await setHouseholdSize(v), router.refresh()))} />
          <Button variant="outline" size="sm" className="no-print" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden /> {t("shop.print")}
          </Button>
        </div>
      </div>

      {pantry.length > 0 && (
        <button type="button" onClick={() => update(pantry.map((r) => r.ingredientId), { haveAtHome: true })} className="no-print inline-flex items-center gap-2 text-sm font-semibold text-forest">
          <Home className="size-4" aria-hidden /> {t("shop.inPantry")}: {pantry.slice(0, 4).map((r) => r.name).join(", ")}
          {pantry.length > 4 ? "…" : ""}
        </button>
      )}

      {warnings.length > 0 && (
        <div className="rounded-2xl bg-amber-100 p-4 text-sm text-[#6d4704]">
          <p className="mb-1 flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="size-4" aria-hidden /> {t("shop.warnings")}
          </p>
          <ul className="list-disc space-y-0.5 pl-5">
            {warnings.map((r) => (
              <li key={r.ingredientId}>
                <span className="font-semibold">{r.name}</span>: {r.hiddenCarbNote ?? r.allergens.map((a) => t(`allergen.${a}` as MessageKey)).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {SECTION_ORDER.map((section) => {
        const list = rows.filter((r) => r.section === section);
        if (!list.length) return null;
        return (
          <section key={section} className="card overflow-hidden">
            <h2 className="border-b border-line bg-sand/50 px-4 py-2.5 font-semibold">{t(`shop.section.${section}` as MessageKey)}</h2>
            <ul className="divide-y divide-line">
              {list.map((r) => {
                const s = state[r.ingredientId];
                return (
                  <li key={r.ingredientId} className={cn("flex items-center gap-3 px-4 py-3", s?.haveAtHome && "opacity-50")}>
                    <input
                      type="checkbox"
                      className="size-5 shrink-0 accent-[var(--color-forest)]"
                      checked={!!s?.checked}
                      onChange={(e) => update([r.ingredientId], { checked: e.target.checked })}
                      aria-label={r.name}
                    />
                    <div className={cn("min-w-0 flex-1", s?.checked && "line-through decoration-2")}>
                      <p className="font-medium">{r.name}</p>
                      <p className="truncate text-xs text-muted">{r.recipes.slice(0, 3).join(", ")}{r.recipes.length > 3 ? ` +${r.recipes.length - 3}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular">{r.quantity}</p>
                      <p className="text-xs text-muted tabular">
                        {r.buy ? `${r.buy} · ` : ""}₹{r.costInr}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => update([r.ingredientId], { haveAtHome: !s?.haveAtHome })}
                      aria-pressed={!!s?.haveAtHome}
                      className="no-print shrink-0"
                    >
                      <Badge tone={s?.haveAtHome ? "forest" : "neutral"}>
                        <Home className="size-3" aria-hidden /> {t("shop.haveIt")}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
