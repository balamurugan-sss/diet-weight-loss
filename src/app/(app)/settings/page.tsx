import { Bell, ChevronRight, ShieldCheck, CircleHelp, ClipboardList, Crown, Heart, HeartPulse, LogOut, PersonStanding, Smartphone, UserRound, Utensils } from "lucide-react";
import Link from "next/link";
import { SettingsList, TopBar } from "@/components/ui/TopBar";
import { isAdminEmail } from "@/server/admin";
import { requireOnboarded } from "@/server/auth/dal";
import { logOut } from "@/server/actions/auth";
import { getI18n } from "@/server/i18n";
import { getGoogleConnection, healthDaysBetween } from "@/server/services/health";
import { todayISO } from "@/server/time";
import { addDays } from "@/lib/workouts/progress";

export const metadata = { title: "Settings" };

const FAQ = ["help.q1", "help.q2", "help.q3", "help.q4"] as const;

/** Settings: one list, as in the reference — program, nutrition, account, data sources, help, log out. */
export default async function SettingsPage() {
  const { user } = await requireOnboarded();
  const { t } = await getI18n();
  const today = todayISO();
  const [google, days] = await Promise.all([getGoogleConnection(user.id), healthDaysBetween(user.id, addDays(today, -30), today)]);
  const on = t("settings.on");
  const off = t("settings.off");

  const groups: { href: string; icon: typeof Bell; label: string; value?: string }[][] = [
    [
      { href: "/workouts/settings", icon: PersonStanding, label: t("settings.workouts") },
      { href: "/targets", icon: Utensils, label: t("settings.nutrition") },
      { href: "/profile", icon: UserRound, label: t("settings.account") },
      { href: "/settings/app", icon: Bell, label: t("settings.app") },
      { href: "/profile/edit?step=about", icon: ClipboardList, label: t("settings.personal") },
    ],
    [
      { href: "/me/sync/apple", icon: Heart, label: t("sync.apple"), value: days.length && !google ? on : off },
      { href: "/me/sync/google", icon: HeartPulse, label: t("sync.google"), value: google ? on : off },
      { href: "/health", icon: Smartphone, label: t("settings.bodyData") },
    ],
    [{ href: "/subscription", icon: Crown, label: t("nav.subscription"), value: user.isPremium ? t("common.premium") : t("common.free") }],
  ];
  if (isAdminEmail(user.email)) groups.push([{ href: "/admin", icon: ShieldCheck, label: t("admin.open") }]);
  const row = "flex min-h-15 items-center gap-4 px-4 hover:bg-sand/60";

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <TopBar title={t("nav.settings")} back="/me" backLabel={t("nav.me")} />
      {groups.map((g, i) => (
        <SettingsList key={i}>
          {g.map(({ href, icon: Icon, label, value }) => (
            <li key={href}>
              <Link href={href} className={row}>
                <Icon className="size-6 text-ink-2" strokeWidth={1.8} aria-hidden />
                <span className="flex-1 text-[17px]">{label}</span>
                {value && <span className="text-[15px] text-muted">{value}</span>}
                <ChevronRight className="size-5 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </SettingsList>
      ))}

      <section id="help" className="scroll-mt-6 overflow-hidden rounded-md bg-surface">
        <h2 className="flex min-h-15 items-center gap-4 px-4 text-[17px] font-normal">
          <CircleHelp className="size-6 text-ink-2" strokeWidth={1.8} aria-hidden /> {t("settings.help")}
        </h2>
        <ul className="divide-y divide-line border-t border-line">
          {FAQ.map((k) => (
            <li key={k}>
              <details className="group px-4 py-3">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">{t(k)}</summary>
                <p className="mt-2 text-[15px] text-ink-2">{t(`${k}.a` as `${typeof k}.a`)}</p>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <form action={logOut}>
        <SettingsList>
          <li>
            <button type="submit" className={`${row} w-full text-left text-terracotta`}>
              <LogOut className="size-6" strokeWidth={1.8} aria-hidden />
              <span className="flex-1 text-[17px]">{t("auth.logout")}</span>
            </button>
          </li>
        </SettingsList>
      </form>
    </div>
  );
}
