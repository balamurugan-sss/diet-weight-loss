import { AlertTriangle, Info } from "lucide-react";
import Link from "next/link";
import { ClipRow } from "@/components/admin/ClipRow";
import { PageHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { estimateCostUsd } from "@/lib/media/veo";
import { EXERCISES } from "@/lib/workouts/exercises";
import { requireAdmin } from "@/server/admin";
import { getI18n } from "@/server/i18n";
import { veoConfigured, veoModel } from "@/server/providers/veo";
import { mediaOverview } from "@/server/services/exerciseMedia";

export const metadata = { title: "Exercise clips", robots: { index: false } };

export default async function AdminMediaPage({ searchParams }: PageProps<"/admin/media">) {
  await requireAdmin();
  const { t } = await getI18n();
  const sp = await searchParams;
  const filter = sp.f === "review" || sp.f === "missing" ? sp.f : "all";
  const { latest, approved } = await mediaOverview();
  const configured = veoConfigured();
  const model = veoModel();
  const missing = EXERCISES.filter((e) => !approved.has(e.id)).length;
  const list = EXERCISES.filter((e) =>
    filter === "review" ? latest.get(e.id)?.status === "ready" : filter === "missing" ? !approved.has(e.id) : true,
  );
  const chip = (active: boolean) =>
    cn("inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-medium", active ? "border-forest bg-forest text-on-accent" : "border-line bg-surface");

  return (
    <div className="space-y-5">
      <PageHeader title={t("media.title")} subtitle={t("media.subtitle")} />
      {configured ? (
        <p className="flex items-start gap-2 rounded-2xl bg-sand px-4 py-3 text-sm text-ink-2">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {t("media.cost", { usd: estimateCostUsd(model).toFixed(2), model })}. {t("media.missing", { n: missing, usd: estimateCostUsd(model, missing).toFixed(2) })}
          </span>
        </p>
      ) : (
        <p className="rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-ink">{t("media.notConfigured")}</p>
      )}
      <p className="flex items-start gap-2 rounded-2xl border border-amber/30 bg-amber-100 px-4 py-3 text-sm text-amber-ink">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("media.checkForm")}
      </p>
      <div className="flex gap-2">
        {(["all", "review", "missing"] as const).map((f) => (
          <Link key={f} href={f === "all" ? "/admin/media" : `/admin/media?f=${f}`} className={chip(filter === f)} aria-current={filter === f ? "true" : undefined}>
            {t(`media.filter.${f}`)}
          </Link>
        ))}
      </div>
      <ul className="space-y-2.5">
        {list.map((e) => {
          const c = latest.get(e.id);
          return (
            <ClipRow
              key={e.id}
              exerciseId={e.id}
              name={e.name}
              pattern={e.pattern}
              configured={configured}
              clip={c ? { id: c.id, status: c.status, error: c.error } : null}
            />
          );
        })}
      </ul>
    </div>
  );
}
