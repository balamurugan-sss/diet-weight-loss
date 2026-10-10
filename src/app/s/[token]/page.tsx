import { ArrowRight, Flame, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark, StatStrip, Squiggle, TwoTone } from "@/components/brand/Brand";
import { RecipeVisual } from "@/components/recipes/RecipeVisual";
import { buttonClass } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { WeekCalendar } from "@/components/workouts/WeekCalendar";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { getI18n } from "@/server/i18n";
import { sharedPlan } from "@/server/services/share";
import { todayISO } from "@/server/time";

// Shared links are private by nature: never indexed, and the token isn't leaked via Referer.
export const metadata: Metadata = {
  title: "A Thali plan",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function SharedPlanPage({ params }: PageProps<"/s/[token]">) {
  const { token } = await params;
  const { t, lang } = await getI18n();
  const data = await sharedPlan(token);
  const locale = lang === "ta" ? "ta-IN" : lang === "ml" ? "ml-IN" : "en-IN";
  const labels = { ai: t("recipe.illustration"), photo: t("recipe.verifiedPhoto"), placeholder: t("recipe.illustrationPlaceholder") };

  const header = (
    <header className="flex items-center justify-between gap-3">
      <Link href="/" className="flex items-center gap-2.5">
        <LogoMark />
        <span className="font-display text-xl font-extrabold">{t("app.name")}</span>
      </Link>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-xs font-semibold text-muted">
        <ShieldCheck className="size-3.5 text-forest" aria-hidden /> {t("share.private")}
      </span>
    </header>
  );

  if (!data || (!data.workouts && !data.meals)) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-8 px-4 py-6">
        {header}
        <div className="my-auto space-y-4 text-center">
          <h1 className="text-2xl">{t("share.unavailable")}</h1>
          <Link href="/" className={buttonClass("lime", "lg")}>
            {t("share.cta")}
          </Link>
        </div>
      </main>
    );
  }

  const w = data.workouts;
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 pt-5 pb-12">
      {header}

      {w && (
        <section className="hero-gradient relative overflow-hidden rounded-[var(--radius-card)] p-5 text-white sm:p-7">
          <Squiggle className="absolute -top-6 -right-20 h-24 w-64 opacity-50" />
          <div className="relative">
            <p className="text-xs font-bold tracking-wide text-lime uppercase">{t("share.heading")}</p>
            <TwoTone as="h1" text={t(`wk.split.${w.split}` as MessageKey)} className="mt-1 text-[2rem] leading-tight" />
            <p className="mt-1 text-white/75">
              {t(`wk.level.${w.level}` as MessageKey)} · {t(`wk.goal.${w.goal}` as MessageKey)} · {t("wk.daysPerWeek", { n: w.daysPerWeek })}
            </p>
            <StatStrip
              className="mt-5 border-white/15 bg-white/5"
              items={[
                { value: `${w.week}/${w.weeks}`, label: t("share.week") },
                { value: `${w.progress.workoutsDone}/${w.progress.workoutsTotal}`, label: t("share.workouts") },
                {
                  value: (
                    <span className="inline-flex items-center gap-1">
                      <Flame className="size-4 text-lime" aria-hidden />
                      {w.progress.streak}
                    </span>
                  ),
                  label: t("share.streak"),
                },
              ]}
            />
            <div
              className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={w.totalDays}
              aria-valuenow={w.progress.daysDone}
              aria-label={t("wk.dayOf", { n: w.progress.daysDone, total: w.totalDays })}
            >
              <div className="h-full rounded-full bg-lime" style={{ width: `${(w.progress.daysDone / w.totalDays) * 100}%` }} />
            </div>
          </div>
        </section>
      )}

      {w && (
        <section>
          <SectionTitle>{t("wk.thisWeek")}</SectionTitle>
          <Card className="p-3 sm:p-4">
            <WeekCalendar
              cells={w.progress.cells.map((c) => ({ ...c, dayIndex: null }))}
              today={todayISO()}
              locale={locale}
              labels={{
                completed: t("wk.cal.completed"),
                missed: t("wk.cal.missed"),
                upcoming: t("wk.cal.upcoming"),
                rest: t("wk.cal.rest"),
                today: t("wk.cal.today"),
                recovery: t("wk.recoveryDay"),
                title: t("wk.thisWeek"),
              }}
            />
          </Card>
        </section>
      )}

      {data.meals && (
        <section>
          <SectionTitle>
            {t("share.todayMeals")} <span className="text-sm font-medium text-muted">· {t(`style.${data.meals.style}` as MessageKey)}</span>
          </SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.meals.slots.map((s) => (
              <li key={s.slot} className="card flex items-center gap-3 p-3">
                <RecipeVisual recipeId={s.lead.recipeId} palette={s.lead.palette} image={s.lead.image} alt={s.lead.title} labels={labels} showLabel={false} className="size-14 shrink-0 rounded-2xl" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted uppercase">{t(`slot.${s.slot}` as MessageKey)}</p>
                  <p className="line-clamp-2 leading-snug font-semibold">{s.titles.join(" + ")}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href="/" className="card-lime flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5">
        <div className="flex-1">
          <h2 className="text-xl">{t("share.cta")}</h2>
          <p className="text-[15px] text-[#0c0c0b]/70">{t("share.ctaBody")}</p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#0c0c0b] text-lime">
          <ArrowRight className="size-5" aria-hidden />
        </span>
      </Link>
      <p className="text-center text-xs text-muted">{t("safety.disclaimer")}</p>
    </main>
  );
}
