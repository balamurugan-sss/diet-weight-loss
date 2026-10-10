"use client";

import { Heart, Lock, RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { activatePlanAction, createPlanAction, regenerateDayAction, toggleFavouritePlanAction } from "@/server/actions/plans";

export function RegenerateDayButton({ planId, dayIndex, left }: { planId: string; dayIndex: number; left: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        disabled={pending || left <= 0}
        onClick={() =>
          start(async () => {
            const r = await regenerateDayAction(planId, dayIndex);
            if (!r.ok) setErr(r.error);
            else router.refresh();
          })
        }
      >
        <RefreshCw className={cn("size-4", pending && "animate-spin")} aria-hidden /> {t("planner.regenerateDay")}
      </Button>
      <p className="mt-1 text-xs text-muted">{err ? t(err as MessageKey) : t("common.remaining", { n: left })}</p>
    </div>
  );
}

export function FavouritePlanButton({ planId, favourite }: { planId: string; favourite: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant={favourite ? "secondary" : "outline"}
      size="sm"
      disabled={pending}
      aria-pressed={favourite}
      onClick={() => start(async () => void (await toggleFavouritePlanAction(planId), router.refresh()))}
    >
      <Heart className={cn("size-4", favourite && "fill-current")} aria-hidden /> {t("planner.saveFavourite")}
    </Button>
  );
}

export function NewPlanForm({ allowed, left, isPremium }: { allowed: number[]; left: number; isPremium: boolean }) {
  const { t } = useI18n();
  const [days, setDays] = useState(7);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-ink-2">{t("planner.length")}</p>
        <div className="grid grid-cols-3 gap-3">
          {[7, 14, 30].map((d) => {
            const locked = !allowed.includes(d);
            return (
              <button
                key={d}
                type="button"
                disabled={locked}
                aria-pressed={days === d}
                onClick={() => setDays(d)}
                className={cn(
                  "relative rounded-2xl border p-4 text-center transition-all",
                  days === d ? "border-forest bg-forest-50 ring-2 ring-forest/15" : "border-line bg-surface",
                  locked && "opacity-60",
                )}
              >
                <span className="block font-display text-3xl font-semibold">{d}</span>
                <span className="text-sm text-muted">{t("planner.days", { n: d }).replace(String(d), "").trim()}</span>
                {locked && (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-lime-100 px-1.5 py-0.5 text-[10px] font-bold text-forest-700">
                    <Lock className="size-3" aria-hidden /> {t("common.premium")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {!isPremium && <p className="mt-2 text-sm text-muted">{t("planner.premiumDays")}</p>}
      </div>
      <p className="rounded-2xl bg-sand px-4 py-3 text-sm text-ink-2">{left > 0 ? t("planner.limitNote", { n: left }) : t("planner.limitReached")}</p>
      {err && <p className="text-sm text-terracotta">{t(err as MessageKey)}</p>}
      <Button
        size="xl"
        className="w-full"
        disabled={pending || left <= 0}
        onClick={() =>
          start(async () => {
            const r = await createPlanAction(days);
            if (r && !r.ok) setErr(r.error);
          })
        }
      >
        <Sparkles className="size-5" aria-hidden /> {pending ? t("planner.generating") : t("planner.generate")}
      </Button>
    </div>
  );
}

export function ActivatePlanButton({ planId }: { planId: string }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant="secondary" disabled={pending} onClick={() => start(async () => void (await activatePlanAction(planId)))}>
      {t("planner.activate")}
    </Button>
  );
}
