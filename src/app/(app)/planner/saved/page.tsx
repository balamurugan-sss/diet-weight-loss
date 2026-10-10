import { Heart } from "lucide-react";
import { ActivatePlanButton } from "@/components/planner/PlanControls";
import { PageHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Chip";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { savedPlans } from "@/server/services/plans";

export const metadata = { title: "Saved plans" };

export default async function SavedPlansPage() {
  const { user } = await requireOnboarded();
  const { t } = await getI18n();
  const plans = await savedPlans(user.id);
  return (
    <div>
      <PageHeader title={t("planner.saved")} />
      <ul className="space-y-3">
        {plans.map((p) => (
          <li key={p.id} className="card flex items-center justify-between gap-3 p-4">
            <div>
              <p className="flex items-center gap-2 font-semibold">
                {p.isFavourite && <Heart className="size-4 fill-terracotta text-terracotta" aria-hidden />} {p.name}
              </p>
              <p className="text-sm text-muted tabular">
                {p.startDate} · {p.targets.kcal} kcal
              </p>
            </div>
            {p.status === "active" ? <Badge tone="forest">{t("planner.active")}</Badge> : <ActivatePlanButton planId={p.id} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
