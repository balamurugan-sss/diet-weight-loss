import { DayEditor } from "@/components/today/DayEditor";
import { macroLine } from "@/components/today/DayTimeline";
import { TopBar } from "@/components/ui/TopBar";
import { dayTotals } from "@/lib/today/timeline";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { todayOverview } from "@/server/services/today";

export const metadata = { title: "Edit my day" };

export default async function EditDayPage() {
  const { user, profile } = await requireOnboarded();
  const { t } = await getI18n();
  const o = await todayOverview(user.id, profile, 0);
  const totals = dayTotals(o.timeline);
  // Remount the editor whenever saved values change, so it always starts from the server's state.
  const version = o.timeline.map((i) => `${i.kind}${i.time}${"kcal" in i ? i.kcal : ""}${"minutes" in i ? i.minutes : ""}`).join("|");
  return (
    <div className="mx-auto max-w-xl">
      <TopBar title={t("day.editTitle")} back="/home" backLabel={t("common.back")} />
      {o.timeline.length ? <DayEditor key={version} items={o.timeline} /> : <p className="text-muted">{t("today.tl.empty")}</p>}
      {totals.kcal > 0 && (
        <p className="mt-4 rounded-md bg-surface p-4 text-sm text-ink-2 tabular">
          <span className="font-bold text-charcoal">{t("day.total")}</span> · {macroLine(totals, t)}
        </p>
      )}
    </div>
  );
}
