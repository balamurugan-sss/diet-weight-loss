import { eq, sql } from "drizzle-orm";
import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MealCard } from "@/components/planner/MealCard";
import { PlanDateNav, type PlanDay } from "@/components/planner/PlanDateNav";
import { RegenerateDayButton } from "@/components/planner/PlanControls";
import { slotTime } from "@/lib/planner/mealTimes";
import { requireOnboarded } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { getI18n } from "@/server/i18n";
import { dayView } from "@/server/services/dayView";
import { currentDayIndex, getActivePlan, planDate } from "@/server/services/plans";
import { dayEventsFor } from "@/server/services/today";
import { remaining } from "@/server/services/usage";
import { healthDaysBetween } from "@/server/services/health";
import { trainingContext } from "@/server/services/workouts";

export const metadata = { title: "Meal plan" };

/** Meal plan: one day at a time — a big card per meal with its time, Mark as cooked and Swap. */
export default async function PlannerPage({ searchParams }: PageProps<"/planner">) {
  const { user, profile } = await requireOnboarded();
  const plan = await getActivePlan(user.id);
  if (!plan) redirect("/planner/new");
  const { t, lang } = await getI18n();
  const sp = await searchParams;
  const today = currentDayIndex(plan);
  const requested = Number(sp.day);
  const day = Number.isInteger(requested) && requested >= 0 && requested < plan.days ? requested : today;
  const date = planDate(plan, day);
  const [view, regenLeft, swapsLeft, training, events, health, progress] = await Promise.all([
    dayView(plan, profile, day),
    remaining(user, "dayRegen"),
    remaining(user, "swap"),
    day === today ? trainingContext(user.id, profile) : null,
    dayEventsFor(user.id, date),
    healthDaysBetween(user.id, date, date),
    // Days where every meal was marked cooked get a tick in the calendar.
    db
      .select({ day: schema.mealPlanItems.dayIndex, total: sql<number>`count(*)`, done: sql<number>`count(${schema.mealPlanItems.completedAt})` })
      .from(schema.mealPlanItems)
      .where(eq(schema.mealPlanItems.planId, plan.id))
      .groupBy(schema.mealPlanItems.dayIndex),
  ]);
  const locale = lang === "ta" ? "ta-IN" : lang === "ml" ? "ml-IN" : "en-IN";
  const doneDays = new Set(progress.filter((p) => Number(p.total) > 0 && Number(p.done) === Number(p.total)).map((p) => p.day));
  const days: PlanDay[] = Array.from({ length: plan.days }, (_, i) => ({ index: i, date: planDate(plan, i), done: doneDays.has(i) }));
  // Meal times follow the day's wake-up (logged or from the watch); 07:00 otherwise.
  const wake = events.wake ?? health[0]?.wakeTime ?? null;

  return (
    <div className="space-y-5">
      <PlanDateNav days={days} current={day} today={today} locale={locale} />

      {training?.trainingDay && training.adjusted && (
        <Link href="/home" className="flex items-center gap-3 rounded-md bg-forest-50 px-4 py-3 text-[15px]">
          <Dumbbell className="size-5 shrink-0 text-lime" aria-hidden />
          <span>
            <span className="font-semibold text-lime">{t("wk.trainingDay")}</span>
            {training.adjusted.addBackKcal > 0 && <span className="text-ink-2"> · {t("wk.bonus", { n: training.adjusted.addBackKcal })}</span>}
          </span>
        </Link>
      )}

      {view.slots.map((s) => (
        <MealCard key={s.slot} planId={plan.id} dayIndex={day} slot={s.slot} time={slotTime(s.slot, wake)} items={s.items} editable swapsLeft={swapsLeft} />
      ))}

      <footer className="space-y-3 rounded-md bg-surface p-4">
        <p className="text-[15px] text-ink-2 tabular">
          <span className="font-bold text-charcoal">{view.totals.kcal} kcal</span> · P {Math.round(view.totals.proteinG)} g · C {Math.round(view.totals.carbsG)} g · F {Math.round(view.totals.fatG)} g
          <span className="text-muted"> / {plan.targets.kcal} kcal</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <RegenerateDayButton planId={plan.id} dayIndex={day} left={regenLeft} />
          <Link href="/recipes" className="inline-flex h-11 items-center rounded-md bg-sand px-4 text-[15px] font-semibold hover:bg-sand-2">
            {t("nav.recipes")}
          </Link>
          <Link href="/planner/new" className="inline-flex h-11 items-center rounded-md bg-sand px-4 text-[15px] font-semibold hover:bg-sand-2">
            {t("planner.new")}
          </Link>
          <Link href="/planner/saved" className="inline-flex h-11 items-center rounded-md bg-sand px-4 text-[15px] font-semibold hover:bg-sand-2">
            {t("planner.saved")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
