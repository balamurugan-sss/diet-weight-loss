import { BellRing, Mail, Smartphone } from "lucide-react";
import { DeleteMessageButton, MessageForm } from "@/components/admin/AdminForms";
import { fmtDate } from "@/lib/admin/format";
import { requireAdmin } from "@/server/admin";
import { emailConfigured } from "@/server/email";
import { getI18n } from "@/server/i18n";
import { pushConfigured } from "@/server/push";
import { audienceCounts, IN_APP_DAYS, listAnnouncements } from "@/server/services/announcements";
import { APP_TIMEZONE } from "@/server/time";

export const metadata = { title: "Messages" };

export default async function AdminMessages() {
  await requireAdmin();
  const { t } = await getI18n();
  const [counts, sent] = await Promise.all([audienceCounts(), listAnnouncements()]);
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-[1.8rem] font-extrabold">{t("admin.msg.title")}</h1>
        <p className="text-[15px] text-muted">{t("admin.msg.body")}</p>
        <div className="rounded-md bg-surface p-5">
          <MessageForm counts={counts} pushOn={pushConfigured()} emailOn={emailConfigured()} inAppDays={IN_APP_DAYS} />
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">{t("admin.msg.history")}</h2>
        {sent.length === 0 ? (
          <p className="text-muted">{t("admin.msg.none")}</p>
        ) : (
          <ul className="divide-y divide-line rounded-md bg-surface">
            {sent.map((m) => (
              <li key={m.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{m.title}</p>
                  <p className="text-sm text-ink-2">{m.body}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                    <span>
                      {fmtDate(m.createdAt, APP_TIMEZONE)} · {t(`admin.msg.aud.${m.audience}`)}
                    </span>
                    {m.inApp && (
                      <span className="inline-flex items-center gap-1">
                        <Smartphone className="size-3.5" aria-hidden /> {t("admin.msg.inAppShort")}
                      </span>
                    )}
                    {m.push && (
                      <span className="inline-flex items-center gap-1">
                        <BellRing className="size-3.5" aria-hidden /> {m.pushSent}
                      </span>
                    )}
                    {m.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="size-3.5" aria-hidden /> {m.emailSent}
                      </span>
                    )}
                  </p>
                </div>
                <DeleteMessageButton id={m.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
