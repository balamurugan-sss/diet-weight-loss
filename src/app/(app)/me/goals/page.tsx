import { GoalsForm } from "@/components/me/GoalsForm";
import { TopBar } from "@/components/ui/TopBar";
import { goalsFor } from "@/lib/today/goals";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";

export const metadata = { title: "Daily goals" };

export default async function GoalsPage({ searchParams }: PageProps<"/me/goals">) {
  const { profile } = await requireOnboarded();
  const { t } = await getI18n();
  const { connected } = await searchParams;
  const g = goalsFor(profile);
  return (
    <div className="mx-auto max-w-xl">
      <TopBar title={t("me.goals.title")} back="/me" backLabel={t("common.back")} />
      {connected && <p className="mb-4 rounded-md bg-forest-50 px-4 py-3 font-semibold text-forest">{t("me.goals.connected")}</p>}
      <h2 className="mb-1 text-[1.6rem] font-extrabold">{t("me.goals.heading")}</h2>
      <p className="mb-5 text-[15px] text-muted">{t("me.goals.body")}</p>
      <GoalsForm steps={g.steps} activeKcal={g.activeKcal} sleepHours={g.sleepMin / 60} />
    </div>
  );
}
