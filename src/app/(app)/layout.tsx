import { I18nProvider } from "@/components/i18n/I18nProvider";
import { BottomNav, SideNav } from "@/components/layout/AppNav";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireOnboarded();
  const { lang, messages, transliteration, t } = await getI18n();
  return (
    <I18nProvider lang={lang} messages={messages} transliteration={transliteration}>
      <div className="flex min-h-dvh">
        <SideNav footer={<p className="px-2 text-xs leading-relaxed text-muted">{t("safety.disclaimer")}</p>} />
        <main className="min-w-0 flex-1 px-4 pt-5 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-12">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
      <BottomNav />
    </I18nProvider>
  );
}
