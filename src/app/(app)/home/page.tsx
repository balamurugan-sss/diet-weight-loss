import { ArrowRight, ShoppingBasket } from "lucide-react";
import { StatStrip, StickerPill, TwoTone } from "@/components/brand/Brand";
import Link from "next/link";
import { WaterTracker, WeightQuickLog } from "@/components/home/Trackers";
import { RecipeVisual } from "@/components/recipes/RecipeVisual";
import { buttonClass, LinkButton } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Chip";
import { MacroBar, ProgressRing } from "@/components/ui/ProgressRing";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { dayView } from "@/server/services/dayView";
import { currentDayIndex, getActivePlan } from "@/server/services/plans";
import { intakeForDate, latestWeight, waterFor } from "@/server/services/progress";
import { favouriteRecipes } from "@/server/services/recipes";
import { targetsForProfile } from "@/server/services/targets";
import { hourNow, todayISO } from "@/server/time";

export const metadata = { title: "Home" };

const SLOT_HOUR: Record<string, number> = { breakfast: 10, mid_morning: 12, lunch: 15, evening: 18, dinner: 23 };

export default async function HomePage() {
  const { user, profile } = await requireOnboarded();
  const { t } = await getI18n();
  const targets = targetsForProfile(profile)!;
  const today = todayISO();
  const [plan, intake, water, weight, favs] = await Promise.all([
    getActivePlan(user.id),
    intakeForDate(user.id, today),
    waterFor(user.id, today),
    latestWeight(user.id),
    favouriteRecipes(user.id, 6),
  ]);
  const view = plan ? await dayView(plan, profile, currentDayIndex(plan)) : null;
  const hour = hourNow();
  const greet = hour < 12 ? "home.greeting.morning" : hour < 17 ? "home.greeting.afternoon" : "home.greeting.evening";
  const next =
    view?.slots.find((s) => !s.items.every((i) => i.completed) && hour < (SLOT_HOUR[s.slot] ?? 24)) ??
    view?.slots.find((s) => !s.items.every((i) => i.completed));
  const nextLead = next?.items.find((i) => i.course !== "base" && i.course !== "accompaniment") ?? next?.items[0];
  const left = targets.kcal - intake.kcal;
  const labels = { ai: t("recipe.illustration"), photo: t("recipe.verifiedPhoto"), placeholder: t("recipe.illustrationPlaceholder") };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-muted">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date())}</p>
        <TwoTone text={`${t(greet)}${user.displayName ? `, ${user.displayName}` : ""}`} className="mt-0.5 text-[2rem] leading-tight sm:text-4xl" />
      </header>

      {nextLead && next ? (
        <section className="card overflow-hidden p-1.5 sm:grid sm:grid-cols-[1.15fr_1fr]">
          <div className="relative">
            <RecipeVisual recipeId={nextLead.recipeId} palette={nextLead.palette} image={nextLead.image} alt={nextLead.title} labels={labels} className="aspect-[16/11] rounded-[1.15rem] sm:aspect-auto sm:h-full" />
            <StickerPill className="absolute right-3 -bottom-5 sm:right-auto sm:-bottom-4 sm:-left-3">
              <span>{t(`slot.${next.slot}` as MessageKey)}</span>
              <span>{next.kcal} kcal</span>
            </StickerPill>
          </div>
          <div className="relative flex flex-col p-4 pt-6 sm:p-6">
            <p className="text-xs font-bold tracking-wide text-forest uppercase">{t("home.nextMeal")}</p>
            <h2 className="mt-1 text-[1.6rem] leading-[1.1]">{next.items.map((i) => i.title).join(" + ")}</h2>
            <StatStrip
              className="mt-4"
              items={[
                { value: `${next.kcal}`, label: t("macro.calories") },
                { value: `${next.items.reduce((s, i) => s + i.proteinG, 0)} g`, label: t("macro.protein") },
                { value: `~${nextLead.totalMin} ${t("common.min")}`, label: t("recipe.cook") },
              ]}
            />
            <Link href={`/cook/${nextLead.slug}?item=${nextLead.id}`} className={buttonClass("lime", "xl", "mt-4 w-full sm:mt-auto")}>
              {t("home.startCooking")} <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
        </section>
      ) : !plan ? (
        <Card className="hero-gradient border-0 p-6 text-white">
          <h2 className="text-xl font-semibold">{t("home.noPlan")}</h2>
          <p className="mt-1 text-white/80">{t("home.noPlanBody")}</p>
          <LinkButton href="/planner/new" variant="lime" size="lg" className="mt-4">
            {t("home.createPlan")}
          </LinkButton>
        </Card>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="flex items-center gap-5">
            <ProgressRing value={intake.kcal} max={targets.kcal} label={t("macro.calories")}>
              <span className="block text-3xl font-semibold tabular">{intake.kcal}</span>
              <span className="block text-xs text-muted">{t("home.ofTarget", { n: targets.kcal })}</span>
            </ProgressRing>
            <div className="flex-1 space-y-2.5">
              <p className={cn("text-sm font-semibold", left >= 0 ? "text-forest" : "text-amber")}>
                {left >= 0 ? t("home.caloriesLeft", { n: left }) : t("home.caloriesOver", { n: -left })}
              </p>
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

      {view && (
        <section>
          <SectionTitle
            action={
              <Link href="/planner" className="inline-flex items-center gap-1 text-sm font-semibold text-forest">
                {t("nav.planner")} <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          >
            {t("home.todayMeals")}
          </SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2">
            {view.slots.map((s) => {
              const lead = s.items.find((i) => i.course !== "base" && i.course !== "accompaniment") ?? s.items[0];
              const done = s.items.every((i) => i.completed);
              return (
                <li key={s.slot} className="min-w-0">
                  <Link href={`/recipes/${lead.slug}`} className="card flex items-center gap-3 p-3 transition-shadow hover:shadow-[var(--shadow-lift)]">
                    <RecipeVisual recipeId={lead.recipeId} palette={lead.palette} image={lead.image} alt={lead.title} labels={labels} showLabel={false} className="size-16 shrink-0 rounded-2xl" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted uppercase">{t(`slot.${s.slot}` as MessageKey)}</p>
                      <p className="truncate font-semibold">{s.items.map((i) => i.title).join(" + ")}</p>
                      <p className="text-sm text-muted tabular">{s.kcal} kcal</p>
                    </div>
                    {done && <Badge tone="forest">{t("home.eaten")}</Badge>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <WeightQuickLog current={weight?.weightKg ?? profile.weightKg} />
        <Link href="/shopping" className="card flex items-center gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]">
          <span className="grid size-12 place-items-center rounded-2xl bg-lime-100 text-forest-700">
            <ShoppingBasket className="size-6" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">{t("nav.shopping")}</span>
            <span className="text-sm text-muted">{plan ? t("planner.days", { n: plan.days }) : t("shop.noPlan")}</span>
          </span>
          <ArrowRight className="size-5 text-muted" aria-hidden />
        </Link>
      </div>

      {favs.length > 0 && (
        <section>
          <SectionTitle>{t("home.saved")}</SectionTitle>
          <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {favs.map((r) => (
              <li key={r.id} className="w-40 shrink-0">
                <Link href={`/recipes/${r.slug}`} className="block overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-soft)]">
                  <RecipeVisual recipeId={r.id} palette={r.palette} image={r.image} alt={r.title} labels={labels} showLabel={false} className="aspect-square" />
                  <p className="line-clamp-2 p-2.5 text-sm leading-snug font-semibold">{r.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
