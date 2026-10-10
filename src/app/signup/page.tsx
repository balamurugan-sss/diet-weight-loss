import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { LogoMark } from "@/components/brand/Brand";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getCurrentUser } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";

export const metadata = { title: "Create account" };

export default async function SignUpPage() {
  const current = await getCurrentUser();
  if (current && !current.user.isGuest) redirect(current.profile?.onboardingCompletedAt ? "/home" : "/onboarding");
  const { t, lang, messages, transliteration } = await getI18n();
  return (
    <I18nProvider lang={lang} messages={messages} transliteration={transliteration}>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-2xl font-extrabold tracking-tight uppercase">{t("app.name")}</span>
        </Link>
        <div className="card p-6">
          <h1 className="text-2xl font-semibold">{t("auth.signupTitle")}</h1>
          <p className="mt-1 mb-6 text-sm text-muted">{current?.user.isGuest ? t("auth.claimBody") : t("auth.signupBody")}</p>
          <SignUpForm />
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-forest underline-offset-4 hover:underline">
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </I18nProvider>
  );
}
