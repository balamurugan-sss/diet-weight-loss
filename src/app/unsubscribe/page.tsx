import Link from "next/link";
import { UnsubscribeButton } from "@/components/settings/NotificationSettings";
import { LogoMark } from "@/components/brand/Brand";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getI18n } from "@/server/i18n";

export const metadata = { title: "Unsubscribe", referrer: "no-referrer", robots: { index: false } };

/** From the link in an offers email. A button (not the visit itself) unsubscribes, so link scanners can't. */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { t: token } = await searchParams;
  const { t, lang, messages, transliteration } = await getI18n();
  return (
    <I18nProvider lang={lang} messages={messages} transliteration={transliteration}>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-2xl font-extrabold">{t("app.name")}</span>
        </Link>
        <div className="card space-y-4 p-6">
          <h1 className="text-2xl font-semibold">{t("unsub.title")}</h1>
          <p className="text-[15px] text-ink-2">{t("unsub.body")}</p>
          <UnsubscribeButton token={typeof token === "string" ? token : ""} />
        </div>
      </div>
    </I18nProvider>
  );
}
