import { ChevronRight, Crown, Download, Settings, Target } from "lucide-react";
import Link from "next/link";
import { DeleteAccountForm, LogoutButton, SecureAccountForm } from "@/components/profile/AccountForms";
import { Card, PageHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Chip";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { profileAge } from "@/lib/profile/health";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";

export const metadata = { title: "Profile" };

export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  const { user, profile } = await requireOnboarded();
  const { t } = await getI18n();
  const { updated } = await searchParams;
  const sections: { step: string; key: MessageKey; summary: string }[] = [
    { step: "about", key: "profile.editHealth", summary: `${profileAge(profile)} · ${profile.heightCm} cm · ${profile.weightKg} kg${profile.targetWeightKg ? ` → ${profile.targetWeightKg} kg` : ""}` },
    { step: "food", key: "profile.editFood", summary: [t(`diet.${profile.dietPreference ?? "vegetarian"}` as MessageKey), ...profile.cuisines.slice(0, 3).map((c) => t(`cuisine.${c}` as MessageKey))].join(" · ") },
    { step: "kitchen", key: "profile.editKitchen", summary: `${profile.cookingTimeMin ? `${profile.cookingTimeMin} min · ` : ""}${profile.householdSize} ${t("common.servings")}${profile.budgetInr ? ` · ₹${profile.budgetInr}/${profile.budgetPeriod}` : ""}` },
    { step: "style", key: "profile.editPlan", summary: t(`style.${profile.planStyle ?? "balanced"}` as MessageKey) },
  ];
  const links = [
    { href: "/targets", icon: Target, key: "nav.targets" as const },
    { href: "/settings", icon: Settings, key: "nav.settings" as const },
    { href: "/subscription", icon: Crown, key: "nav.subscription" as const },
  ];
  return (
    <div className="space-y-5">
      <PageHeader title={t("profile.title")} />
      {updated && <p className="rounded-2xl bg-forest-50 px-4 py-2 text-sm font-semibold text-forest">{t("profile.updated")}</p>}
      <Card className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-lime font-display text-2xl text-forest-700">{(user.displayName ?? "T").slice(0, 1).toUpperCase()}</span>
        <div className="flex-1">
          <p className="text-lg font-semibold">{user.displayName ?? t("app.name")}</p>
          <p className="text-sm text-muted">{user.email ?? t("auth.guestBadge")}</p>
        </div>
        <Badge tone={user.isPremium ? "lime" : "neutral"}>{user.isPremium ? t("common.premium") : t("common.free")}</Badge>
      </Card>

      <Card className="p-0">
        <ul className="divide-y divide-line">
          {sections.map((s) => (
            <li key={s.step}>
              <Link href={`/profile/edit?step=${s.step}`} className="flex items-center gap-3 px-4 py-4 hover:bg-sand/40">
                <span className="flex-1">
                  <span className="block font-semibold">{t(s.key)}</span>
                  <span className="block truncate text-sm text-muted">{s.summary}</span>
                </span>
                <ChevronRight className="size-5 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
          {links.map(({ href, icon: Icon, key }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-3 px-4 py-4 hover:bg-sand/40">
                <Icon className="size-5 text-forest" aria-hidden />
                <span className="flex-1 font-semibold">{t(key)}</span>
                <ChevronRight className="size-5 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t("profile.account")}</h2>
        {user.isGuest ? <SecureAccountForm /> : <p className="mb-3 text-sm text-muted">{user.email}</p>}
        <div className="mt-4">
          <LogoutButton />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t("profile.privacy")}</h2>
        <a href="/api/account/export" className="mb-5 inline-flex items-center gap-2 font-semibold text-forest">
          <Download className="size-4" aria-hidden /> {t("profile.export")}
        </a>
        <DeleteAccountForm />
      </Card>
      <p className="text-sm text-muted">{t("safety.disclaimer")}</p>
    </div>
  );
}
