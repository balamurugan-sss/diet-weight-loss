import { I18nProvider } from "@/components/i18n/I18nProvider";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";

export default async function FocusLayout({ children }: { children: React.ReactNode }) {
  await requireOnboarded();
  const { lang, messages, transliteration } = await getI18n();
  return (
    <I18nProvider lang={lang} messages={messages} transliteration={transliteration}>
      {children}
    </I18nProvider>
  );
}
