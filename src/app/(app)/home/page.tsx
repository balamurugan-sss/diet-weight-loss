import { ArrowRight, Dumbbell } from "lucide-react";
import Link from "next/link";
import { StatStrip, TwoTone } from "@/components/brand/Brand";
import { WaterTracker, WeightQuickLog } from "@/components/home/Trackers";
import { RecipeVisual } from "@/components/recipes/RecipeVisual";
import { BodyPanel } from "@/components/today/BodyPanel";
import { CheckIns } from "@/components/today/CheckIns";
import { DayTimeline } from "@/components/today/DayTimeline";
import { TrainTodayCard } from "@/components/today/TrainTodayCard";
import { buttonClass, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MacroBar, ProgressRing } from "@/components/ui/ProgressRing";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { profileAge } from "@/lib/profile/health";
import { quickFoods } from "@/lib/today/quickFoods";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { dayView } from "@/server/services/dayView";
import { currentDayIndex, getActivePlan } from "@/server/services/plans";
import { intakeForDate, latestWeight, waterFor } from "@/server/services/progress";
import { targetsForProfile } from "@/server/services/targets";
import { todayOverview } from "@/server/services/today";
import { trainingContext } from "@/server/services/workouts";
import { hourNow, todayISO } from "@/server/time";

export const metadata = { title: "Today" };

const SLOT_HOUR: Record<string, number> = { breakfast: 10, mid_morning: 12, lunch: 15, evening: 18, dinner: 23 };

/**
 * Today: the day's activity line first, then the questions worth asking right
 * now (wake-up, morning drink, workout time, pre-workout food, protein), body
 * data from the watch, training, and the food budget. Meal planning lives in
 * the Meals tab.
 */
export default async function TodayPage({ searchParams }: PageProps<"/home">) {
  const { user, profile } = await requireOnboarded();
  const { t } = await getI18n();
  const sp = await searchParams;
  const baseTargets = targetsForProfile(profile)!;
  const today = todayISO();
  const [plan, intake, water, weight, training] = await Promise.all([
    getActivePlan(user.id),
    intakeForDate(user.id, today),
    waterFor(user.id, today),
    latestWeight(user.id),
    trainingContext(user.id, profile, today),
  ]);
  const targets = training?.adjusted ?? baseTargets;
  const bonus = training?.adjusted?.addBackKcal ?? 0;
  const proteinLeft = Math.max(0, targets.proteinG - intake.proteinG);
  const o = await todayOverview(user.id, profile, proteinLeft);
  const view = plan ? await dayView(plan, profile, currentDayIndex(plan)) : null;

  const hour = hourNow();
  const greet = hour < 12 ? "home.greeting.morning" : hour < 17 ? "home.greeting.afternoon" : "home.greeting.evening";
  const next =
    view?.slots.find((s) => !s.items.every((i) => i.completed) && hour < (SLOT_HOUR[s.slot] ?? 24)) ??
    view?.slots.find((s) => !s.items.every((i) => i.completed));
  const nextLead = next?.items.find((i) => i.course !== "base" && i.course !== "accompaniment") ?? next?.items[0];
  const left = targets.kcal - intake.kcal;
  const labels = { ai: t("recipe.illustration"), photo: t("recipe.verifiedPhoto"), placeholder: t("recipe.illustrationPlaceholder") };

  const diet = profile.dietPreference ?? "vegetarian";
  const keto = targets.style === "keto";
  // No protein powders when extra protein isn't safe (kidney disease, under 18).
  const allowSupplements = (profileAge(profile) ?? 30) >= 18 && !(profile.conditions ?? []).includes("kidney");
  const foods = {
    morning: quickFoods("morning", { diet, keto }),
    pre: quickFoods("pre", { diet, keto }),
    protein: quickFoods("protein", { diet, keto, allowSupplements }),
  };
  const pos = o.workout.position;
  const startHref = pos != null && o.workout.plannedDay && o.workout.plannedDay.kind !== "rest" ? `/workouts/session/${pos}` : null;
  const kg = weight?.weightKg ?? profile.weightKg ?? 70;

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold tracking-wide text-muted uppercase">
          {new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(today + "T00:00:00Z"))}
        </p>
        <TwoTone text={`${t(greet)}${user.displayName ? `, ${user.displayName}` : ""}`} className="mt-0.5 text-[2.3rem] sm:text-5xl" />
      </header>

      {sp.edited === "1" && <p className="rounded-lg bg-forest-50 px-4 py-3 text-[15px] font-semibold text-forest">{t("today.edit.saved")}</p>}

      <DayTimeline items={o.timeline} now={o.now} t={t} />

      <CheckIns prompts={o.prompts} now={o.now} deviceWake={o.deviceWake} workoutPlan={o.events.workout_plan ?? null} startHref={startHref} foods={foods} proteinLeftG={proteinLeft} />

      <div className="grid gap-5 lg:grid-cols-2">
        <BodyPanel health={o.health} t={t} />
        <TrainTodayCard o={o} kg={kg} t={t} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="flex items-center gap-5">
            <ProgressRing value={intake.kcal} max={targets.kcal} label={t("macro.calories")}>
              <span className="block font-display text-3xl font-extrabold tabular">{intake.kcal}</span>
              <span className="block text-xs text-muted">{t("home.ofTarget", { n: targets.kcal })}</span>
            </ProgressRing>
            <div className="flex-1 space-y-2.5">
              <p className={cn("text-sm font-semibold", left >= 0 ? "text-forest" : "text-amber")}>
                {left >= 0 ? t("home.caloriesLeft", { n: left }) : t("home.caloriesOver", { n: -left })}
              </p>
              {bonus > 0 && (
                <p className="inline-flex items-center gap-1 rounded-md bg-lime-100 px-2.5 py-0.5 text-xs font-bold text-forest-700">
                  <Dumbbell className="size-3.5" aria-hidden /> {t("wk.bonus", { n: bonus })}
                </p>
              )}
              <MacroBar label={t("macro.protein")} value={intake.proteinG} target={targets.proteinG} color="var(--color-protein)" />
              {targets.netCarbLimitG ? (
                <MacroBar label={t("macro.netCarbs")} value={intake.netCarbsG} target={targets.netCarbLimitG} color="var(--color-carbs)" />
              ) : (
                <MacroBar label={t("macro.carbs")} value={intake.carbsG} target={targets.carbsG} color="var(--color-carbs)" />
              )}
              <MacroBar label={t("macro.fat")} value={intake.fatG} target={targets.fatG} color="var(--color-fat)" />
            </div>
          </div>
        </Card>
        <WaterTracker ml={water} goalMl={targets.waterMl} />
      </div>

      {nextLead && next ? (
        <section className="card overflow-hidden p-1.5 sm:grid sm:grid-cols-[1fr_1.2fr]">
          <RecipeVisual recipeId={nextLead.recipeId} palette={nextLead.palette} image={nextLead.image} alt={nextLead.title} labels={labels} className="aspect-[16/10] rounded-lg sm:aspect-auto sm:h-full" />
          <div className="flex flex-col p-4 sm:p-5">
            <p className="text-xs font-bold tracking-wider text-forest uppercase">
              {t("home.nextMeal")} · {t(`slot.${next.slot}` as MessageKey)}
            </p>
            <h2 className="mt-1 text-[1.5rem] normal-case">{next.items.map((i) => i.title).join(" + ")}</h2>
            <StatStrip
              className="mt-3"
              items={[
                { value: `${next.kcal}`, label: t("macro.calories") },
                { value: `${next.items.reduce((s, i) => s + i.proteinG, 0)} g`, label: t("macro.protein") },
                { value: `~${nextLead.totalMin} ${t("common.min")}`, label: t("recipe.cook") },
              ]}
            />
            <div className="mt-3 flex gap-2 sm:mt-auto sm:pt-3">
              <Link href={`/cook/${nextLead.slug}?item=${nextLead.id}`} className={buttonClass("lime", "lg", "flex-1")}>
                {t("home.startCooking")} <ArrowRight className="size-5" aria-hidden />
              </Link>
              <Link href="/planner" className={buttonClass("outline", "lg")}>
                {t("nav.meals")}
              </Link>
            </div>
          </div>
        </section>
      ) : !plan ? (
        <Card className="hero-gradient border-0 p-6 text-white">
          <h2 className="text-xl">{t("home.noPlan")}</h2>
          <p className="mt-1 text-white/80">{t("home.noPlanBody")}</p>
          <LinkButton href="/planner/new" variant="lime" size="lg" className="mt-4">
            {t("home.createPlan")}
          </LinkButton>
        </Card>
      ) : null}

      <WeightQuickLog current={weight?.weightKg ?? profile.weightKg} />
    </div>
  );
}
