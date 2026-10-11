import { CancelInviteButton, InviteForm } from "@/components/admin/AdminForms";
import { fmtDate } from "@/lib/admin/format";
import { requireAdmin } from "@/server/admin";
import { getI18n } from "@/server/i18n";
import { adminStats, listInvites } from "@/server/services/admin";
import { db, schema } from "@/server/db/client";
import { desc } from "drizzle-orm";
import { APP_TIMEZONE } from "@/server/time";

export const metadata = { title: "Overview" };

export default async function AdminHome() {
  await requireAdmin();
  const { t } = await getI18n();
  const [stats, invites, actions] = await Promise.all([
    adminStats(),
    listInvites(),
    db.select().from(schema.adminActions).orderBy(desc(schema.adminActions.createdAt)).limit(12),
  ]);
  const tiles = [
    [stats.total, t("admin.stats.total")],
    [stats.premium, t("admin.stats.premium")],
    [stats.active, t("admin.stats.active")],
    [stats.fresh, t("admin.stats.new")],
    [stats.emailOptIn, t("admin.stats.email")],
    [stats.pushUsers, t("admin.stats.push")],
  ] as const;
  return (
    <div className="space-y-8">
      <h1 className="text-[1.8rem] font-extrabold">{t("admin.nav.overview")}</h1>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([v, l]) => (
          <div key={l} className="rounded-md bg-surface p-4">
            <dd className="text-[1.8rem] leading-none font-extrabold tabular">{v}</dd>
            <dt className="mt-2 text-xs font-bold tracking-[0.08em] text-muted uppercase">{l}</dt>
          </div>
        ))}
      </dl>

      <section className="space-y-3 rounded-md bg-surface p-5">
        <h2 className="text-xl font-bold">{t("admin.invite.title")}</h2>
        <p className="text-[15px] text-muted">{t("admin.invite.body")}</p>
        <InviteForm />
        {invites.length > 0 && (
          <ul className="divide-y divide-line border-t border-line pt-1">
            {invites.map((i) => (
              <li key={i.email} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1 truncate font-semibold">{i.email}</span>
                <span className="text-sm text-muted">
                  {i.months == null ? t("admin.invite.none") : t(`admin.invite.m${i.months as 1 | 3 | 6 | 12}`)} · {t("admin.invite.pending")}
                </span>
                <CancelInviteButton email={i.email} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">{t("admin.recent")}</h2>
        {actions.length === 0 ? (
          <p className="text-muted">{t("admin.noActions")}</p>
        ) : (
          <ul className="divide-y divide-line rounded-md bg-surface">
            {actions.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-3 px-4 py-2.5 text-sm">
                <span className="font-semibold">{a.action}</span>
                {a.detail && <span className="text-ink-2">{a.detail}</span>}
                <span className="ml-auto text-muted">
                  {a.adminEmail} · {fmtDate(a.createdAt, APP_TIMEZONE)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
