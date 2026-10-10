import { SettingsForm } from "@/components/profile/SettingsForm";
import { TopBar } from "@/components/ui/TopBar";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { targetsForProfile } from "@/server/services/targets";
import { getTheme } from "@/server/theme";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile } = await requireOnboarded();
  const { t } = await getI18n();
  const guideline = targetsForProfile({ ...profile, waterGoalMl: null })?.waterMl ?? 2500;
  return (
    <div className="mx-auto max-w-2xl">
      <TopBar title={t("settings.app")} back="/settings" backLabel={t("common.back")} />
      <SettingsForm
        initial={{
          language: profile.language,
          transliteration: profile.transliteration,
          units: profile.units,
          narrationRate: profile.narrationRate,
          keepAwake: profile.keepAwake,
          voiceCommands: profile.voiceCommands,
          waterGoalMl: profile.waterGoalMl,
        }}
        guidelineMl={guideline}
        theme={await getTheme()}
      />
    </div>
  );
}
