import { Search } from "lucide-react";
import Link from "next/link";
import { ExerciseMedia } from "@/components/workouts/ExerciseMedia";
import { PageHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { EXERCISES } from "@/lib/workouts/exercises";
import { EQUIPMENT, MUSCLES, type Equipment, type Muscle, type Setting } from "@/lib/workouts/types";
import { getI18n } from "@/server/i18n";

export const metadata = { title: "Exercise library" };

const FILTER_MUSCLES = MUSCLES.filter((m) => m !== "full_body");
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function LibraryPage({ searchParams }: PageProps<"/workouts/library">) {
  const { t } = await getI18n();
  const sp = await searchParams;
  const muscle = FILTER_MUSCLES.find((m) => m === one(sp.muscle)) as Muscle | undefined;
  const eq = EQUIPMENT.find((e) => e === one(sp.eq)) as Equipment | undefined;
  const where = (["home", "gym"] as const).find((w) => w === one(sp.where)) as Setting | undefined;
  const q = (one(sp.q) ?? "").trim().toLowerCase().slice(0, 60);

  const list = EXERCISES.filter(
    (e) =>
      (!muscle || e.muscles.includes(muscle) || e.secondary?.includes(muscle)) &&
      (!eq || (eq === "none" ? e.equipment.length === 0 : e.equipment.includes(eq))) &&
      (!where || e.settings.includes(where)) &&
      (!q || e.name.toLowerCase().includes(q)),
  );

  const href = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = { muscle, eq, where, q: q || undefined, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    const s = params.toString();
    return `/workouts/library${s ? `?${s}` : ""}`;
  };
  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-9 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium transition-colors",
      active ? "border-forest bg-forest text-on-accent" : "border-line bg-surface text-charcoal hover:border-forest/40",
    );
  const eqLabel = (e: Equipment) => (e === "none" ? t("wk.bodyweight") : t(`wk.eq.${e}` as MessageKey));

  return (
    <div className="space-y-5">
      <PageHeader title={t("wk.library")} subtitle={t("wk.lib.count", { n: list.length })} />

      <form action="/workouts/library" className="relative">
        {muscle && <input type="hidden" name="muscle" value={muscle} />}
        {eq && <input type="hidden" name="eq" value={eq} />}
        {where && <input type="hidden" name="where" value={where} />}
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t("wk.lib.search")}
          aria-label={t("wk.lib.search")}
          className="h-12 w-full rounded-full border border-line bg-surface pr-4 pl-12 text-[15px] outline-none focus:border-forest"
        />
      </form>

      <div className="space-y-2.5">
        <div className="flex gap-2">
          {(["all", "home", "gym"] as const).map((w) => (
            <Link key={w} href={href({ where: w === "all" ? undefined : w })} className={chip(w === "all" ? !where : where === w)} aria-current={(w === "all" ? !where : where === w) ? "true" : undefined}>
              {w === "all" ? t("wk.filter.all") : t(`wk.setting.${w}`)}
            </Link>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label={t("wk.target")}>
          <Link href={href({ muscle: undefined })} className={chip(!muscle)}>
            {t("wk.filter.all")}
          </Link>
          {FILTER_MUSCLES.map((m) => (
            <Link key={m} href={href({ muscle: m === muscle ? undefined : m })} className={chip(m === muscle)} aria-current={m === muscle ? "true" : undefined}>
              {t(`wk.muscle.${m}` as MessageKey)}
            </Link>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label={t("wk.equipment")}>
          <Link href={href({ eq: undefined })} className={chip(!eq)}>
            {t("wk.filter.all")}
          </Link>
          {EQUIPMENT.map((e) => (
            <Link key={e} href={href({ eq: e === eq ? undefined : e })} className={chip(e === eq)} aria-current={e === eq ? "true" : undefined}>
              {eqLabel(e)}
            </Link>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="card p-6 text-center text-muted">{t("wk.lib.empty")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((e) => (
            <li key={e.id} className="min-w-0">
              <Link href={`/workouts/library/${e.id}`} className="card block overflow-hidden p-1.5 transition-shadow hover:shadow-[var(--shadow-lift)]">
                <ExerciseMedia exercise={e} animate={false} className="aspect-square rounded-[1.1rem]" />
                <div className="px-2 pt-2 pb-1.5">
                  <p className="line-clamp-2 min-h-[2.5em] text-[15px] leading-tight font-semibold">{e.name}</p>
                  <p className="mt-1 truncate text-xs text-muted">{e.muscles.map((m) => t(`wk.muscle.${m}` as MessageKey)).join(" · ")}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Badge tone={e.difficulty === 1 ? "forest" : e.difficulty === 2 ? "lime" : "amber"}>{t(`wk.diff.${e.difficulty}` as MessageKey)}</Badge>
                    {e.equipment.length === 0 && <Badge>{t("wk.bodyweight")}</Badge>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
