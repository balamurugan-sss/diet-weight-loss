import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/PasswordResetForms";
import { LogoMark } from "@/components/brand/Brand";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { findReset } from "@/server/auth/passwordReset";
import { getI18n } from "@/server/i18n";

// The token is in the URL: never send it on to another site as a referrer.
export const metadata = { title: "Set a new password", referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const valid = value ? await findReset(value) : null;
  const { t, lang, messages, transliteration } = await getI18n();
  return (
    <I18nProvider lang={lang} messages={messages} transliteration={transliteration}>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-2xl font-extrabold">{t("app.name")}</span>
        </Link>
        <div className="card p-6">
          <h1 className="mb-6 text-2xl font-semibold">{t("auth.resetTitle")}</h1>
          {valid ? (
            <ResetPasswordForm token={value} />
          ) : (
            <div className="space-y-4">
              <p role="alert" className="rounded-xl bg-terracotta-100 px-3 py-2 text-sm text-terracotta">
                {t("auth.resetExpired")}
              </p>
              <Link href="/forgot-password" className="block font-semibold text-forest underline-offset-4 hover:underline">
                {t("auth.requestNew")}
              </Link>
            </div>
          )}
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-semibold text-forest underline-offset-4 hover:underline">
            {t("auth.backToLogin")}
          </Link>
        </p>
      </div>
    </I18nProvider>
  );
}
