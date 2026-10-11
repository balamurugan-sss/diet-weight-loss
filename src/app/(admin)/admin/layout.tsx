import { ShieldCheck } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { requireAdmin } from "@/server/admin";
import { getI18n } from "@/server/i18n";

export const metadata = { title: { template: "%s · Movewell Admin", default: "Movewell Admin" }, robots: { index: false } };

/** The admin area: its own shell, separate from the app's tabs. Non-admins get a 404. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const { lang, messages, transliteration, t } = await getI18n();
  return (
    <I18nProvider lang={lang} messages={messages} transliteration={transliteration}>
      <div className="min-h-dvh lg:flex">
        <aside className="border-b border-line bg-surface px-4 py-4 lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0 lg:py-6">
          <p className="mb-3 flex items-center gap-2 px-1 text-lg font-extrabold lg:mb-6">
            <ShieldCheck className="size-6 text-lime" aria-hidden /> {t("admin.title")}
          </p>
          <AdminNav />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </I18nProvider>
  );
}
