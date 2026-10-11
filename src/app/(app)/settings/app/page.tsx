import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/profile/SettingsForm";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { TopBar } from "@/components/ui/TopBar";
import { requireOnboarded } from "@/server/auth/dal";
import { config } from "@/server/config";
import { db, schema } from "@/server/db/client";
import { getI18n } from "@/server/i18n";
import { targetsForProfile } from "@/server/services/targets";
import { getTheme } from "@/server/theme";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, profile } = await requireOnboarded();
  const [prefs] = await db.select({ marketingEmail: schema.users.marketingEmail }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
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
      <NotificationSettings vapidKey={config.push.privateKey ? config.push.publicKey : null} marketingEmail={prefs?.marketingEmail ?? false} />
    </div>
  );
}
