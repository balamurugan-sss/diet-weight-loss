import { I18nProvider } from "@/components/i18n/I18nProvider";
import { ProfileWizard } from "@/components/onboarding/ProfileWizard";
import { requireUser } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { profileToDraft } from "@/server/services/profileDraft";

export const metadata = { title: "Set up your plan" };

export default async function OnboardingPage() {
  const { user, profile } = await requireUser();
  const { lang, messages, transliteration } = await getI18n();
  return (
    <I18nProvider lang={lang} messages={messages} transliteration={transliteration}>
      <ProfileWizard initial={profileToDraft(user, profile)} />
    </I18nProvider>
  );
}
