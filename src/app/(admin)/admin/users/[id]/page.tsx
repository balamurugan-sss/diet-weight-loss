import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserActions } from "@/components/admin/AdminForms";
import { fmtDate } from "@/lib/admin/format";
import { LANGUAGES } from "@/lib/i18n/languages";
import { requireAdmin } from "@/server/admin";
import { getI18n } from "@/server/i18n";
import { userDetail } from "@/server/services/admin";
import { APP_TIMEZONE } from "@/server/time";

export const metadata = { title: "User" };

export default async function AdminUser({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { t } = await getI18n();
  const u = await userDetail((await params).id);
  if (!u) notFound();
  const d = (x: Date | null) => fmtDate(x, APP_TIMEZONE);
  const plan = u.isPremium
    ? `${t("common.premium")} · ${u.premiumUntil ? t("admin.user.until", { date: d(u.premiumUntil) }) : t("admin.user.noEnd")}${u.paidViaStripe ? ` · ${t("admin.user.stripe")}` : ""}`
    : t("common.free");
  const rows: [string, React.ReactNode][] = [
    [t("admin.user.plan"), plan],
    [t("admin.user.joined"), d(u.createdAt)],
    [t("admin.user.lastActive"), d(u.lastActiveAt)],
    [t("admin.user.language"), LANGUAGES.find((l) => l.code === u.language)?.name ?? u.language],
    [t("admin.user.setup"), u.onboarded ? t("admin.user.setupDone") : t("admin.user.setupNot")],
    [t("admin.user.program"), u.program ?? t("admin.user.noProgram")],
    [t("admin.user.devices"), u.signedIn],
    [t("admin.user.push"), u.pushDevices],
    [t("admin.user.emailOptIn"), u.marketingEmail ? t("settings.on") : t("settings.off")],
    [t("admin.user.health"), u.health.length ? u.health.join(", ") : t("settings.off")],
  ];
  const box = "rounded-md bg-surface p-5";
  return (
    <div className="space-y-5">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 font-semibold text-lime">
        <ArrowLeft className="size-4" aria-hidden /> {t("admin.user.back")}
      </Link>
      <header>
        <h1 className="text-[1.8rem] leading-tight font-extrabold">{u.displayName ?? "—"}</h1>
        <p className="text-muted">{u.email}</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <section className={box}>
          <h2 className="mb-3 text-lg font-bold">{t("admin.user.account")}</h2>
          <dl className="divide-y divide-line">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5 text-[15px]">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-5 mb-2 text-sm font-bold text-muted uppercase">{t("admin.user.activity")}</h3>
          <dl className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-sand p-3">
              <dd className="text-2xl font-extrabold tabular">{u.workouts30}</dd>
              <dt className="text-sm text-muted">{t("admin.user.workouts")}</dt>
            </div>
            <div className="rounded-md bg-sand p-3">
              <dd className="text-2xl font-extrabold tabular">{u.meals30}</dd>
              <dt className="text-sm text-muted">{t("admin.user.meals")}</dt>
            </div>
          </dl>
          <p className="mt-4 flex items-start gap-2 text-sm text-muted">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("admin.user.privacy")}
          </p>
        </section>
        <section className={box}>
          <h2 className="mb-3 text-lg font-bold">{t("admin.user.help")}</h2>
          <UserActions userId={u.id} isPremium={u.isPremium} paidViaStripe={u.paidViaStripe} />
        </section>
      </div>
      <section className={box}>
        <h2 className="mb-2 text-lg font-bold">{t("admin.user.history")}</h2>
        {u.actions.length === 0 ? (
          <p className="text-muted">{t("admin.noActions")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {u.actions.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-3 py-2 text-sm">
                <span className="font-semibold">{a.action}</span>
                {a.detail && <span className="text-ink-2">{a.detail}</span>}
                <span className="ml-auto text-muted">
                  {a.adminEmail} · {d(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
