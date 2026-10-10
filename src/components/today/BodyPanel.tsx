import { AlertTriangle, ArrowRight, CheckCircle2, Footprints, HeartPulse, Info, Moon, Smartphone, Watch } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatVars, STEP_GOAL } from "@/lib/health/analysis";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { TFunc } from "@/lib/i18n/t";
import type { TodayOverview } from "@/server/services/today";
import { HeartRateLine } from "./HeartRateLine";

/** Connect buttons: each opens its sync screen (Apple Health via export import; Google via the Google Health API). */
export function ConnectRow({ t }: { t: TFunc; googleConnected?: boolean; compact?: boolean }) {
  const btn = "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-sand px-3 text-sm font-semibold hover:bg-sand-2";
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/me/sync/apple" className={btn}>
        <Smartphone className="size-4 text-lime" aria-hidden /> {t("today.connect.apple")}
      </Link>
      <Link href="/me/sync/google" className={btn}>
        <Watch className="size-4 text-lime" aria-hidden /> {t("today.connect.google")}
      </Link>
    </div>
  );
}

/** Today's body data: heart rate (with the hourly line), steps, sleep and sleep score, plus the most useful note. */
export function BodyPanel({ health, t }: { health: TodayOverview["health"]; t: TFunc }) {
  const d = health.latest;
  if (!d) {
    return (
      <section className="card p-4">
        <h2 className="flex items-center gap-2 text-[1.35rem]">
          <HeartPulse className="size-5 text-terracotta" aria-hidden /> {t("today.body.title")}
        </h2>
        <p className="mt-1 mb-3 text-[15px] text-muted">{t("today.body.connectBody")}</p>
        <ConnectRow t={t} googleConnected={health.connected.google} />
        <p className="mt-3 text-xs text-muted">{t("today.body.privacy")}</p>
      </section>
    );
  }
  const a = health.analysis;
  const hm = (min: number) => t("health.hm", { h: Math.floor(min / 60), m: min % 60 });
  const top = a?.insights.find((i) => i.tone === "caution") ?? a?.insights.find((i) => i.tone === "info") ?? a?.insights[0];
  const TopIcon = top?.tone === "caution" ? AlertTriangle : top?.tone === "good" ? CheckCircle2 : Info;
  const stepsPct = d.steps != null ? Math.min(100, Math.round((d.steps / STEP_GOAL) * 100)) : 0;
  const score = health.score;

  const tile = "rounded-lg bg-sand/70 p-3";
  const label = "flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted uppercase";
  const big = "mt-1 font-display text-[1.9rem] leading-none font-extrabold tabular";

  return (
    <section className="card p-4" aria-labelledby="body-title">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="body-title" className="flex items-center gap-2 text-[1.35rem]">
          <HeartPulse className="size-5 text-terracotta" aria-hidden /> {t("today.body.title")}
        </h2>
        <Link href="/health" className="inline-flex items-center gap-1 text-sm font-semibold text-forest">
          {t("today.body.all")} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      {!health.today && <p className="mb-2 text-sm text-muted">{t("today.body.yesterday")}</p>}

      <dl className="grid grid-cols-2 gap-2">
        <div className={tile}>
          <dt className={label}>
            <HeartPulse className="size-3.5 text-terracotta" aria-hidden /> {t("today.body.heart")}
          </dt>
          <dd className={big}>
            {d.restingHr ?? d.avgHr ?? "—"}
            <span className="ml-1 text-sm font-semibold text-muted">{t("health.bpm")}</span>
          </dd>
          <dd className="mt-1 text-xs text-muted tabular">
            {[d.restingHr != null ? t("today.body.resting") : d.avgHr != null ? t("today.body.avg") : null, d.restingHr != null && d.avgHr != null ? `${t("today.body.avg")} ${d.avgHr}` : null, d.maxHr != null ? `${t("today.body.max")} ${d.maxHr}` : null]
              .filter(Boolean)
              .join(" · ")}
          </dd>
        </div>
        <div className={tile}>
          <dt className={label}>
            <Footprints className="size-3.5 text-water" aria-hidden /> {t("health.steps")}
          </dt>
          <dd className={big}>{d.steps != null ? d.steps.toLocaleString("en-IN") : "—"}</dd>
          <dd className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-2" aria-hidden>
            <span className="block h-full bg-water" style={{ width: `${stepsPct}%` }} />
          </dd>
          <dd className="mt-1 text-xs text-muted tabular">{t("today.body.stepGoal", { pct: stepsPct, goal: STEP_GOAL.toLocaleString("en-IN") })}</dd>
        </div>
        <div className={tile}>
          <dt className={label}>
            <Moon className="size-3.5 text-water" aria-hidden /> {t("health.sleep")}
          </dt>
          <dd className={big}>{d.sleepMinutes != null ? hm(d.sleepMinutes) : "—"}</dd>
          <dd className="mt-1 text-xs text-muted tabular">
            {[d.sleepStart && d.wakeTime ? `${d.sleepStart} → ${d.wakeTime}` : null, d.deepMinutes != null ? `${t("today.body.deep")} ${hm(d.deepMinutes)}` : null, d.remMinutes != null ? `REM ${hm(d.remMinutes)}` : null]
              .filter(Boolean)
              .join(" · ")}
          </dd>
        </div>
        <div className={cn(tile, score && score.score >= 80 && "bg-forest-50")}>
          <dt className={label}>
            <Moon className="size-3.5 text-forest" aria-hidden /> {t("today.body.score")}
          </dt>
          <dd className={big}>
            {score?.score ?? "—"}
            {score && <span className="ml-1 text-sm font-semibold text-muted">/100</span>}
          </dd>
          {score && (
            <dd className="mt-1 text-xs text-muted">
              {t(`today.body.label.${score.label}` as MessageKey)} · {score.source === "device" ? t("today.body.fromDevice") : t("today.body.estimate")}
            </dd>
          )}
        </div>
      </dl>

      {d.hrHourly && (
        <div className="mt-3">
          <HeartRateLine
            hours={d.hrHourly}
            resting={d.restingHr}
            labels={{ title: t("today.body.hrLine"), bpm: t("health.bpm"), resting: t("today.body.resting"), hour: t("today.body.hour") }}
          />
        </div>
      )}

      {top && (
        <p className={cn("mt-3 flex gap-2 rounded-lg p-3 text-[15px] leading-snug", top.tone === "caution" ? "bg-amber-100 text-amber-ink" : "bg-sand/70 text-ink-2")}>
          <TopIcon className={cn("mt-0.5 size-4.5 shrink-0", top.tone === "good" && "text-forest")} aria-hidden />
          {t(`health.ins.${top.id}` as MessageKey, formatVars(top.vars))}
        </p>
      )}
      {a?.suggestRecovery && <p className="mt-2 text-sm font-semibold text-amber-ink">{t("today.body.recover")}</p>}

      {!health.connected.google && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">{t("today.connect.more")}</p>
          <ConnectRow t={t} googleConnected={health.connected.google} compact />
        </div>
      )}
    </section>
  );
}
