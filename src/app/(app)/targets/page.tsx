import { AlertTriangle, Droplets, Flame, Info, Scale, Stethoscope } from "lucide-react";
import { ProjectionChart } from "@/components/charts/ProjectionChart";
import { LinkButton } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { assessBmi, BMI_LIMITATIONS, WHO_BANDS } from "@/lib/nutrition/bmi";
import { projectWeight } from "@/lib/nutrition/targets";
import { profileAge } from "@/lib/profile/health";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { targetsForProfile } from "@/server/services/targets";

export const metadata = { title: "Your targets" };

const BAND_COLOURS = ["#9cc3e0", "#8fc27a", "#e8c15a", "#e59a5b", "#d9714f", "#b8492f"];

export default async function TargetsPage() {
  const { profile } = await requireOnboarded();
  const { t } = await getI18n();
  const targets = targetsForProfile(profile);
  if (!targets) return <p>{t("common.error")}</p>;
  const age = profileAge(profile)!;
  const bmi = assessBmi(profile.weightKg!, profile.heightCm!, age);
  const projection = projectWeight(profile.weightKg!, targets.effectiveTargetKg, targets.weeklyLossKg);
  const kcalShare = (g: number, f: number) => Math.round(((g * f) / targets.kcal) * 100);
  const gaugePos = Math.min(100, Math.max(0, ((bmi.bmi - 15) / (42 - 15)) * 100));
  const macros = [
    { key: "macro.protein" as const, g: targets.proteinG, pct: kcalShare(targets.proteinG, 4), color: "var(--color-protein)" },
    { key: "macro.carbs" as const, g: targets.carbsG, pct: kcalShare(targets.carbsG, 4), color: "var(--color-carbs)" },
    { key: "macro.fat" as const, g: targets.fatG, pct: kcalShare(targets.fatG, 9), color: "var(--color-fat)" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t("targets.title")} subtitle={t(`style.${targets.style}`)} />

      {(targets.screening.requiresProfessional || targets.styleNote) && (
        <div className="flex gap-3 rounded-[var(--radius-card)] border border-amber/30 bg-amber-100 p-4 text-amber-ink">
          <Stethoscope className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="text-[15px] leading-relaxed">
            {targets.screening.requiresProfessional && <p className="font-semibold">{t("targets.professional")}</p>}
            {targets.styleNote && <p>{targets.styleNote}</p>}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-muted">
                <Scale className="size-4" aria-hidden /> {t("targets.bmi")}
              </p>
              <p className="mt-1 font-display text-5xl font-semibold tabular text-charcoal">{bmi.bmi}</p>
            </div>
            {bmi.kind === "adult" && <Badge tone={bmi.who.id === "healthy" ? "forest" : "amber"}>{bmi.who.label}</Badge>}
          </div>
          {bmi.kind === "adult" ? (
            <>
              <div className="relative mt-5" aria-hidden>
                <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                  {WHO_BANDS.map((b, i) => {
                    const lo = Math.max(15, b.min);
                    const hi = Math.min(42, b.max);
                    return <span key={b.id} style={{ flex: hi - lo, background: BAND_COLOURS[i] }} />;
                  })}
                </div>
                <span className="absolute -top-1.5 size-6 -translate-x-1/2 rounded-full border-4 border-white bg-charcoal shadow" style={{ left: `${gaugePos}%` }} />
                <div className="mt-1.5 flex justify-between text-[11px] text-muted tabular">
                  <span>15</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>35</span>
                  <span>40+</span>
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-[15px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("targets.bmiWho")}</dt>
                  <dd className="font-semibold">{bmi.who.label}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("targets.bmiAsian")}</dt>
                  <dd className="font-semibold">{bmi.asianIndian.label}</dd>
                </div>
              </dl>
              <p className="mt-2 text-sm text-muted">{t("targets.bmiAsianHelp")}</p>
              <p className="mt-3 rounded-2xl bg-forest-50 px-3 py-2 text-sm font-medium text-forest">
                {t("targets.healthyRange", { min: bmi.healthyRangeKg[0], max: bmi.healthyRangeKg[1] })}
              </p>
            </>
          ) : (
            <p className="mt-4 rounded-2xl bg-sand p-3 text-[15px] leading-relaxed">{bmi.message}</p>
          )}
          <details className="group mt-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-forest">
              <Info className="size-4" aria-hidden /> {t("targets.limitations")}
            </summary>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
              {BMI_LIMITATIONS.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </details>
        </Card>

        <Card className="hero-gradient border-0 text-white">
          <p className="flex items-center gap-2 text-sm font-semibold text-lime">
            <Flame className="size-4" aria-hidden /> {t("targets.daily")}
          </p>
          <p className="mt-1 font-display text-5xl font-semibold tabular">
            {targets.kcal.toLocaleString("en-IN")} <span className="text-2xl font-medium text-white/70">{t("common.kcal")}</span>
          </p>
          <p className="mt-1 text-white/80">{t("targets.range", { min: targets.kcalMin, max: targets.kcalMax })}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs font-medium text-white/70">{t("targets.maintenance")}</p>
              <p className="text-xl font-semibold tabular">{targets.maintenanceKcal.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs font-medium text-white/70">BMR</p>
              <p className="text-xl font-semibold tabular">{targets.bmr.toLocaleString("en-IN")}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/75">{t("targets.maintenanceHelp")}</p>
          {targets.goal === "maintain" && <p className="mt-2 text-sm font-medium text-lime">{t("targets.maintainNote")}</p>}
          {targets.floorApplied && <p className="mt-2 text-sm font-medium text-lime">{t("targets.floorNote")}</p>}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">{t("targets.macros")}</h2>
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden>
            {macros.map((m) => (
              <span key={m.key} style={{ flex: m.pct, background: m.color }} />
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-3">
            {macros.map((m) => (
              <li key={m.key} className="rounded-2xl bg-sand/70 p-3">
                <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-2">
                  <span className="size-2.5 rounded-full" style={{ background: m.color }} aria-hidden /> {t(m.key)}
                </span>
                <span className="block text-xl font-semibold tabular">{m.g} g</span>
                <span className="text-xs text-muted tabular">{m.pct}%</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="forest">
              {t("macro.fibre")}: {targets.fibreG} g
            </Badge>
            {targets.netCarbLimitG && <Badge tone="lime">{t("targets.netCarbLimit", { n: targets.netCarbLimitG })}</Badge>}
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <Droplets className="size-5 text-water" aria-hidden /> {t("targets.water")}
          </h2>
          <p className="font-display text-4xl font-semibold tabular text-water">{(targets.waterMl / 1000).toFixed(1)} L</p>
          <p className="text-sm text-muted">≈ {Math.round(targets.waterMl / 250)} × 250 ml</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">{t("targets.waterHelp")}</p>
        </Card>
      </div>

      {targets.goal === "lose" && projection.weeksRange && targets.effectiveTargetKg && (
        <Card>
          <h2 className="text-lg font-semibold">{t("targets.timeline")}</h2>
          <p className="mt-1 text-[15px] text-ink-2">
            {t("targets.timelineBody", { target: targets.effectiveTargetKg, min: projection.weeksRange[0], max: projection.weeksRange[1] })}
          </p>
          <div className="mt-4">
            <ProjectionChart points={projection.points} targetKg={targets.effectiveTargetKg} weekLabel="Week" ariaLabel={t("targets.timeline")} />
          </div>
          <p className="mt-2 text-sm text-muted">{t("targets.timelineNote")}</p>
        </Card>
      )}

      {targets.screening.flags.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">{t("targets.flags")}</h2>
          <ul className="space-y-2">
            {targets.screening.flags.map((f) => (
              <li key={f.code} className={cn("flex gap-3 rounded-2xl p-3 text-[15px]", f.level === "professional" ? "bg-amber-100 text-amber-ink" : "bg-sand text-ink-2")}>
                {f.level === "info" ? <Info className="mt-0.5 size-5 shrink-0" aria-hidden /> : <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />}
                <span>
                  <span className="font-semibold">{f.title}.</span> {f.message}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-sm text-muted">{t("safety.disclaimer")}</p>
      <LinkButton href="/planner/new" size="xl" className="w-full sm:w-auto">
        {t("targets.cta")}
      </LinkButton>
    </div>
  );
}
