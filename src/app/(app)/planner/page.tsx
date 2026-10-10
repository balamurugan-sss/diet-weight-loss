import { ArrowRight, CalendarDays, Dumbbell, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DayTotals } from "@/components/planner/DayTotals";
import { MealSlot } from "@/components/planner/MealSlot";
import { FavouritePlanButton, RegenerateDayButton } from "@/components/planner/PlanControls";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { dayView } from "@/server/services/dayView";
import { currentDayIndex, getActivePlan, planDate } from "@/server/services/plans";
import { remaining } from "@/server/services/usage";
import { trainingContext } from "@/server/services/workouts";

export const metadata = { title: "Meal plan" };

export default async function PlannerPage({ searchParams }: PageProps<"/planner">) {
  const { user, profile } = await requireOnboarded();
  const plan = await getActivePlan(user.id);
  if (!plan) redirect("/planner/new");
  const { t, lang } = await getI18n();
  const sp = await searchParams;
  const today = currentDayIndex(plan);
  const requested = Number(sp.day);
  const day = Number.isInteger(requested) && requested >= 0 && requested < plan.days ? requested : today;
  const [view, regenLeft, swapsLeft, training] = await Promise.all([
    dayView(plan, profile, day),
    remaining(user, "dayRegen"),
    remaining(user, "swap"),
    day === today ? trainingContext(user.id, profile) : null,
  ]);
  const locale = lang === "ta" ? "ta-IN" : lang === "ml" ? "ml-IN" : "en-IN";
  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...opts, timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.7rem] leading-tight font-semibold sm:text-3xl">{t("planner.title")}</h1>
          <p className="mt-1 text-[15px] text-muted">
            {t("planner.days", { n: plan.days })} · {t(`style.${plan.planStyle}` as never)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/shopping" className={buttonClass("outline", "sm")}>
            <ShoppingBasket className="size-4" aria-hidden /> {t("nav.shopping")}
          </Link>
          <Link href="/planner/saved" className={buttonClass("outline", "sm")}>
            {t("planner.saved")}
          </Link>
          <Link href="/planner/new" className={buttonClass("primary", "sm")}>
            {t("planner.new")}
          </Link>
        </div>
      </header>

      <nav aria-label={t("planner.title")} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {Array.from({ length: plan.days }, (_, i) => {
          const date = planDate(plan, i);
          const active = i === day;
          return (
            <Link
              key={i}
              href={`/planner?day=${i}`}
              aria-current={active ? "date" : undefined}
              className={cn(
                "flex min-w-[3.6rem] shrink-0 flex-col items-center rounded-2xl border px-2 py-2 transition-colors",
                active ? "border-forest bg-forest text-on-accent" : "border-line bg-surface hover:border-forest/40",
              )}
            >
              <span className={cn("text-[11px] font-semibold uppercase", active ? "text-on-accent/70" : "text-muted")}>{fmt(date, { weekday: "short" })}</span>
              <span className="text-lg font-semibold tabular">{fmt(date, { day: "numeric" })}</span>
              {i === today && <span className={cn("mt-0.5 size-1.5 rounded-full", active ? "bg-on-accent" : "bg-forest")} aria-label={t("common.today")} />}
            </Link>
          );
        })}
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <CalendarDays className="size-4" aria-hidden />
            {t("planner.day", { n: day + 1 })} · {fmt(view.date, { weekday: "long", day: "numeric", month: "long" })}
          </div>
          {training?.trainingDay && training.adjusted && (
            <Link href="/workouts" className="flex items-center gap-3 rounded-2xl border border-forest/25 bg-forest-50 px-4 py-3 hover:border-forest/50">
              <Dumbbell className="size-5 shrink-0 text-forest" aria-hidden />
              <span className="min-w-0 flex-1 text-[15px]">
                <span className="block font-semibold text-forest">
                  {t("wk.trainingDay")}
                  {training.adjusted.addBackKcal > 0 && <> · {t("wk.bonus", { n: training.adjusted.addBackKcal })}</>}
                </span>
                <span className="block text-sm text-ink-2">{t("wk.trainingDayProtein", { g: training.adjusted.proteinG })}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
            </Link>
          )}
          {view.slots.map((s) => (
            <MealSlot key={s.slot} planId={plan.id} dayIndex={day} slot={s.slot} items={s.items} kcal={s.kcal} swapsLeft={swapsLeft} />
          ))}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-6">
          <DayTotals view={view} targets={plan.targets} t={t} />
          <div className="flex flex-wrap items-start gap-3">
            <RegenerateDayButton planId={plan.id} dayIndex={day} left={regenLeft} />
            <FavouritePlanButton planId={plan.id} favourite={plan.isFavourite} />
          </div>
        </aside>
      </div>
    </div>
  );
}
