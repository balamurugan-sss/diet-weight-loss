import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/PasswordResetForms";
import { LogoMark } from "@/components/brand/Brand";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getI18n } from "@/server/i18n";

export const metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
  const { t, lang, messages, transliteration } = await getI18n();
  return (
    <I18nProvider lang={lang} messages={messages} transliteration={transliteration}>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-2xl font-extrabold">{t("app.name")}</span>
        </Link>
        <div className="card p-6">
          <h1 className="text-2xl font-semibold">{t("auth.forgotTitle")}</h1>
          <p className="mt-1 mb-6 text-sm text-muted">{t("auth.forgotBody")}</p>
          <ForgotPasswordForm />
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
