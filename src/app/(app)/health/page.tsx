import { AlertTriangle, ArrowRight, CheckCircle2, Footprints, HeartPulse, Info, Lock, Moon, Smartphone, Timer } from "lucide-react";
import Link from "next/link";
import { StepsChart } from "@/components/charts/ProgressCharts";
import { GoogleHealthCard } from "@/components/health/GoogleHealthCard";
import { HealthImport } from "@/components/health/HealthImport";
import { Card, PageHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { analyseDay, formatVars, STEP_GOAL } from "@/lib/health/analysis";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { addDays } from "@/lib/workouts/progress";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { googleHealthConfigured } from "@/server/providers/googleHealth";
import { getGoogleConnection, healthDaysBetween } from "@/server/services/health";
import { todayISO } from "@/server/time";

export const metadata = { title: "Health data" };

export default async function HealthPage({ searchParams }: PageProps<"/health">) {
  const { user } = await requireOnboarded();
  const { t, lang } = await getI18n();
  const locale = lang === "ta" ? "ta-IN" : lang === "ml" ? "ml-IN" : "en-IN";
  const sp = await searchParams;
  const today = todayISO();
  const [days, conn] = await Promise.all([healthDaysBetween(user.id, addDays(today, -21), today), getGoogleConnection(user.id)]);
  // Analyse today, or the most recent day in the last 2 days (sync can lag).
  const latest = [...days].reverse().find((d) => d.date >= addDays(today, -2));
  const analysis = latest ? analyseDay(days, latest.date) : null;
  const fmtDate = (iso: string) => new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  const hm = (min: number) => t("health.hm", { h: Math.floor(min / 60), m: min % 60 });
  const status = typeof sp.google === "string" ? sp.google : null;
  const last14 = days.filter((d) => d.date > addDays(today, -14) && d.steps != null).map((d) => ({ date: d.date, steps: d.steps! }));

  const tiles = analysis?.today
    ? [
        { icon: Footprints, label: t("health.steps"), value: analysis.today.steps?.toLocaleString("en-IN"), usual: analysis.baseline.steps?.toLocaleString("en-IN") },
        { icon: Timer, label: t("health.active"), value: analysis.today.activeMinutes != null ? `${analysis.today.activeMinutes}` : null, usual: null },
        { icon: Moon, label: t("health.sleep"), value: analysis.today.sleepMinutes != null ? hm(analysis.today.sleepMinutes) : null, usual: analysis.baseline.sleepMinutes ? hm(analysis.baseline.sleepMinutes) : null },
        {
          icon: HeartPulse,
          label: t("health.rhr"),
          value: analysis.today.restingHr != null ? `${analysis.today.restingHr} ${t("health.bpm")}` : null,
          usual: analysis.baseline.restingHr ? `${analysis.baseline.restingHr}` : null,
        },
      ]
    : [];

  return (
    <div className="space-y-5">
      <PageHeader title={t("health.title")} subtitle={t("health.subtitle")} />

      {analysis?.today ? (
        <section className="space-y-4">
          <Card>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">{t("health.today")}</h2>
              {latest!.date !== today && <span className="text-sm text-muted">{t("health.latest", { date: fmtDate(latest!.date) })}</span>}
            </div>
            <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {tiles.map(({ icon: Icon, label, value, usual }) => (
                <div key={label} className="rounded-2xl bg-sand/70 p-3">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                    <Icon className="size-3.5" aria-hidden /> {label}
                  </dt>
                  <dd className="mt-1 font-display text-xl font-bold tabular">{value ?? "—"}</dd>
                  {usual && <dd className="text-xs text-muted tabular">{t("health.usual", { v: usual })}</dd>}
                </div>
              ))}
            </dl>
          </Card>

          {analysis.insights.length > 0 && (
            <Card>
              <h2 className="mb-2 text-lg font-semibold">{t("health.insights")}</h2>
              <ul className="space-y-2">
                {analysis.insights.map((i) => (
                  <li
                    key={i.id}
                    className={cn(
                      "flex gap-3 rounded-2xl p-3 text-[15px] leading-relaxed",
                      i.tone === "caution" ? "bg-amber-100 text-amber-ink" : i.tone === "good" ? "bg-forest-50 text-charcoal" : "bg-sand/70 text-ink-2",
                    )}
                  >
                    {i.tone === "caution" ? (
                      <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
                    ) : i.tone === "good" ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden />
                    ) : (
                      <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
                    )}
                    <span>{t(`health.ins.${i.id}` as MessageKey, formatVars(i.vars))}</span>
                  </li>
                ))}
              </ul>
              {analysis.suggestRecovery && (
                <Link href="/workouts/calendar" className="mt-3 flex items-center gap-3 rounded-2xl border border-forest/25 bg-forest-50 p-3 text-[15px] hover:border-forest/50">
                  <Footprints className="size-5 shrink-0 text-forest" aria-hidden />
                  <span className="flex-1">{t("health.recovery")}</span>
                  <ArrowRight className="size-4 text-muted" aria-hidden />
                </Link>
              )}
            </Card>
          )}

          {last14.length >= 2 && (
            <Card>
              <h2 className="mb-3 text-lg font-semibold">{t("health.stepsChart")}</h2>
              <StepsChart data={last14} goal={STEP_GOAL} label={t("health.stepsChart")} />
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-semibold text-forest">Table</summary>
                <table className="mt-2 w-full text-left tabular">
                  <tbody>
                    {[...last14].reverse().map((d) => (
                      <tr key={d.date} className="border-t border-line">
                        <td className="py-1.5">{fmtDate(d.date)}</td>
                        <td className="py-1.5 text-right">{d.steps.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </Card>
          )}
        </section>
      ) : (
        <p className="card-sand p-5 text-[15px] text-ink-2">{t("health.noData")}</p>
      )}

      <Card className="space-y-5">
        <h2 className="text-lg font-semibold">{t("health.connect")}</h2>
        <GoogleHealthCard
          configured={googleHealthConfigured()}
          connected={!!conn}
          lastSync={conn?.lastSyncAt ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(conn.lastSyncAt) : null}
          lastError={conn?.lastError ?? null}
          status={status}
        />
        <div className="border-t border-line pt-5">
          <h3 className="mb-1 font-semibold">{t("health.import.title")}</h3>
          <p className="mb-3 text-sm text-muted">{t("health.import.body")}</p>
          <HealthImport />
        </div>
        <p className="flex items-start gap-2 border-t border-line pt-4 text-sm text-muted">
          <Smartphone className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("health.native")}
        </p>
      </Card>

      <p className="flex items-start gap-2 text-sm text-muted">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("health.privacy")}
      </p>
    </div>
  );
}
