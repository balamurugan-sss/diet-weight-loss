import { Check, Minus } from "lucide-react";
import { UpgradeButtons } from "@/components/profile/AccountForms";
import { Card, PageHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { requireOnboarded } from "@/server/auth/dal";
import { config } from "@/server/config";
import { getI18n } from "@/server/i18n";
import { PLAN_LIMITS, PREMIUM_PRICE_INR, usageToday, type Feature } from "@/server/services/usage";

export const metadata = { title: "Subscription" };

const FEATURES: { label: string; free: boolean | string; premium: boolean | string }[] = [
  { label: "BMI, calorie and macro targets", free: true, premium: true },
  { label: "Recipe library and basic cooking steps", free: true, premium: true },
  { label: "Meal plans", free: "7-day, 3 a day", premium: "7, 14 and 30-day" },
  { label: "Meal swaps and portion changes", free: "15 swaps a day", premium: "100 swaps a day" },
  { label: "Device-voice narration (all languages your phone supports)", free: true, premium: true },
  { label: "Natural-voice narration in Tamil, Malayalam and Indian English", free: false, premium: true },
  { label: "AI cooking-step images", free: false, premium: "60 a day" },
  { label: "AI finished-dish images", free: "3 a day", premium: "30 a day" },
  { label: "Automated weekly grocery lists for every week of the plan", free: "This week only", premium: true },
  { label: "Advanced progress analytics (12-month trends)", free: "60 days", premium: true },
];

const FEATURE_KEYS: Feature[] = ["mealPlan", "dayRegen", "swap", "heroImage", "stepImage", "cloudTts"];

export default async function SubscriptionPage({ searchParams }: PageProps<"/subscription">) {
  const { user } = await requireOnboarded();
  const { t } = await getI18n();
  const usage = await usageToday(user.id);
  const { success } = await searchParams;
  const tier = user.isPremium ? "premium" : "free";
  const cell = (v: boolean | string) => (v === true ? <Check className="mx-auto size-5 text-forest" aria-label="Included" /> : v === false ? <Minus className="mx-auto size-5 text-muted" aria-label="Not included" /> : <span className="text-sm">{v}</span>);
  return (
    <div className="space-y-5">
      <PageHeader title={t("sub.title")} subtitle={t("sub.current", { plan: user.isPremium ? t("common.premium") : t("common.free") })} />
      {success && <p className="rounded-2xl bg-forest-50 px-4 py-2 font-semibold text-forest">✓</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={cn(!user.isPremium && "ring-2 ring-forest")}>
          <h2 className="text-xl font-semibold">{t("sub.free.title")}</h2>
          <p className="font-display text-3xl font-semibold">₹0</p>
        </Card>
        <Card className={cn("hero-gradient border-0 text-white", user.isPremium && "ring-2 ring-lime")}>
          <h2 className="text-xl font-semibold">{t("sub.premium.title")}</h2>
          <p className="font-display text-3xl font-semibold">{t("sub.price", { n: PREMIUM_PRICE_INR })}</p>
          <div className="mt-4">
            <UpgradeButtons isPremium={user.isPremium} configured={!!(config.stripe.secretKey && config.stripe.priceId)} devToggle={config.allowDevPremium} />
          </div>
        </Card>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[34rem] text-left">
          <thead>
            <tr className="border-b border-line text-sm">
              <th className="p-3 font-semibold" scope="col"></th>
              <th className="p-3 text-center font-semibold" scope="col">{t("common.free")}</th>
              <th className="p-3 text-center font-semibold" scope="col">{t("common.premium")}</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f) => (
              <tr key={f.label} className="border-b border-line last:border-0">
                <th scope="row" className="p-3 text-[15px] font-medium">{f.label}</th>
                <td className="p-3 text-center">{cell(f.free)}</td>
                <td className="p-3 text-center">{cell(f.premium)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t("sub.usage")}</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {FEATURE_KEYS.map((f) => {
            const limit = PLAN_LIMITS[tier][f];
            const used = usage[f] ?? 0;
            return (
              <li key={f} className="flex items-center justify-between rounded-2xl bg-sand/60 px-3 py-2 text-sm">
                <span>{t(`feat.${f}` as MessageKey)}</span>
                {limit === 0 ? <Badge>{t("common.premium")}</Badge> : <span className="font-semibold tabular">{used} / {limit}</span>}
              </li>
            );
          })}
        </ul>
      </Card>
      <p className="text-sm text-muted">{t("sub.transparent")}</p>
    </div>
  );
}
