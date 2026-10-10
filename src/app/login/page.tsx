import Link from "next/link";
import { LogoMark } from "@/components/brand/Brand";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { startAsGuest } from "@/server/actions/auth";
import { getCurrentUser } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  const current = await getCurrentUser();
  if (current && !current.user.isGuest) redirect("/home");
  const { t, lang, messages, transliteration } = await getI18n();
  return (
    <I18nProvider lang={lang} messages={messages} transliteration={transliteration}>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-2xl font-extrabold tracking-tight">{t("app.name")}</span>
        </Link>
        <div className="card p-6">
          <h1 className="mb-6 text-2xl font-semibold">{t("auth.loginTitle")}</h1>
          <LoginForm />
        </div>
        <form action={startAsGuest} className="mt-6 text-center text-sm text-muted">
          {t("auth.noAccount")}{" "}
          <button className="font-semibold text-forest underline-offset-4 hover:underline">{t("auth.startFresh")}</button>
        </form>
      </div>
    </I18nProvider>
  );
}
