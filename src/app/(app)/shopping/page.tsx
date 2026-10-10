import Link from "next/link";
import { ShoppingList } from "@/components/shopping/ShoppingList";
import { LinkButton, buttonClass } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Card";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { currentDayIndex, getActivePlan } from "@/server/services/plans";
import { shoppingForWeek } from "@/server/services/shopping";
import { targetsForProfile } from "@/server/services/targets";

export const metadata = { title: "Shopping list" };

export default async function ShoppingPage({ searchParams }: PageProps<"/shopping">) {
  const { user, profile } = await requireOnboarded();
  const { t } = await getI18n();
  const plan = await getActivePlan(user.id);
  if (!plan)
    return (
      <div>
        <PageHeader title={t("shop.title")} />
        <div className="card-sand p-8 text-center">
          <p className="mb-4 text-muted">{t("shop.noPlan")}</p>
          <LinkButton href="/planner/new">{t("home.createPlan")}</LinkButton>
        </div>
      </div>
    );
  const weeks = Math.ceil(plan.days / 7);
  const current = Math.floor(currentDayIndex(plan) / 7);
  const requested = Number((await searchParams).week);
  const allowedWeek = (w: number) => user.isPremium || w === current;
  const week = Number.isInteger(requested) && requested >= 0 && requested < weeks && allowedWeek(requested) ? requested : current;
  const { rows, state, recipeCount } = await shoppingForWeek(plan, week, profile.householdSize);
  const targets = targetsForProfile(profile);
  return (
    <div className="space-y-4">
      <PageHeader title={t("shop.title")} subtitle={`${t("shop.week", { n: week + 1 })} · ${t("shop.forRecipes", { n: recipeCount })}`} />
      {weeks > 1 && (
        <nav className="no-print flex flex-wrap gap-2">
          {Array.from({ length: weeks }, (_, w) => (
            <Link key={w} href={`/shopping?week=${w}`} aria-disabled={!allowedWeek(w)} className={buttonClass(w === week ? "primary" : "outline", "sm", !allowedWeek(w) ? "pointer-events-none opacity-40" : "")}>
              {t("shop.week", { n: w + 1 })}
            </Link>
          ))}
        </nav>
      )}
      {!user.isPremium && <p className="rounded-2xl bg-sand px-4 py-3 text-sm text-ink-2">{t("shop.premium")}</p>}
      <ShoppingList
        planId={plan.id}
        weekIndex={week}
        rows={rows}
        initialState={Object.fromEntries([...state].map(([k, v]) => [k, { checked: v.checked, haveAtHome: v.haveAtHome }]))}
        household={profile.householdSize}
        userAllergies={profile.allergies}
        carbAware={targets?.style === "keto" || targets?.style === "low_carb"}
      />
    </div>
  );
}
