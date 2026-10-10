import { NewPlanForm } from "@/components/planner/PlanControls";
import { Card, PageHeader } from "@/components/ui/Card";
import { PlanSwitch } from "@/components/workouts/PlanSwitch";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { targetsForProfile } from "@/server/services/targets";
import { PLAN_DAYS, remaining } from "@/server/services/usage";

export const metadata = { title: "New meal plan" };

export default async function NewPlanPage() {
  const { user, profile } = await requireOnboarded();
  const { t } = await getI18n();
  const targets = targetsForProfile(profile)!;
  const left = await remaining(user, "mealPlan");
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5">
        <PlanSwitch active="meals" labels={{ meals: t("plan.meals"), workouts: t("plan.workouts"), switch: t("plan.switch") }} />
      </div>
      <PageHeader title={t("planner.new")} subtitle={`${t(`style.${targets.style}`)} · ${targets.kcal} kcal · P ${targets.proteinG} g${targets.netCarbLimitG ? ` · ≤${targets.netCarbLimitG} g net carbs` : ""}`} />
      {targets.styleNote && <p className="mb-4 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-ink">{targets.styleNote}</p>}
      <Card>
        <NewPlanForm allowed={PLAN_DAYS[user.isPremium ? "premium" : "free"]} left={left} isPremium={user.isPremium} />
      </Card>
    </div>
  );
}
