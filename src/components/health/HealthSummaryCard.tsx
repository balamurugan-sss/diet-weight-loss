import { AlertTriangle, ArrowRight, CheckCircle2, Footprints, Info, Moon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { analyseDay, formatVars } from "@/lib/health/analysis";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { TFunc } from "@/lib/i18n/t";
import { addDays } from "@/lib/workouts/progress";
import { healthDaysBetween } from "@/server/services/health";
import { todayISO } from "@/server/time";

/** Home: today's steps and sleep with the most important note. Hidden until there is data. */
export async function HealthSummaryCard({ userId, t }: { userId: string; t: TFunc }) {
  const today = todayISO();
  const days = await healthDaysBetween(userId, addDays(today, -21), today);
  const latest = [...days].reverse().find((d) => d.date >= addDays(today, -2));
  if (!latest) return null;
  const a = analyseDay(days, latest.date);
  const top = a.insights.find((i) => i.tone === "caution") ?? a.insights.find((i) => i.tone === "info") ?? a.insights[0];
  const Icon = top?.tone === "caution" ? AlertTriangle : top?.tone === "good" ? CheckCircle2 : Info;

  return (
    <Link href="/health" className="card block p-4 transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-center gap-4">
        <p className="text-xs font-bold tracking-wide text-forest uppercase">{t("health.today")}</p>
        <span className="ml-auto flex items-center gap-3 text-sm font-semibold tabular">
          {latest.steps != null && (
            <span className="inline-flex items-center gap-1">
              <Footprints className="size-4 text-water" aria-hidden /> {latest.steps.toLocaleString("en-IN")}
            </span>
          )}
          {latest.sleepMinutes != null && (
            <span className="inline-flex items-center gap-1">
              <Moon className="size-4 text-water" aria-hidden /> {t("health.hm", { h: Math.floor(latest.sleepMinutes / 60), m: latest.sleepMinutes % 60 })}
            </span>
          )}
          <ArrowRight className="size-4 text-muted" aria-hidden />
        </span>
      </div>
      {top && (
        <p className={cn("mt-2.5 flex gap-2 text-[15px] leading-snug", top.tone === "caution" ? "text-amber-ink" : "text-ink-2")}>
          <Icon className={cn("mt-0.5 size-4.5 shrink-0", top.tone === "good" && "text-forest")} aria-hidden />
          {t(`health.ins.${top.id}` as MessageKey, formatVars(top.vars))}
        </p>
      )}
    </Link>
  );
}
