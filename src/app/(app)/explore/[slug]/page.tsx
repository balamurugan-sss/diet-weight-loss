import { AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";
import { Tags } from "@/components/brand/Brand";
import { GuideArt } from "@/components/explore/GuideCard";
import { GuideBody } from "@/components/explore/GuideBody";
import { AddToDayButton, PrintButton, StartProgramButton } from "@/components/explore/GuideClient";
import { ProgramPreview } from "@/components/explore/ProgramPreview";
import { TopBar } from "@/components/ui/TopBar";
import { getGuide, getProgramTemplate, GUIDES, templateDays } from "@/lib/guides";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { bodyWeight, getActiveProgram, getSidePrograms } from "@/server/services/workouts";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/explore/[slug]">) {
  const g = getGuide((await params).slug);
  return { title: g?.title ?? "Guide", description: g?.summary };
}

export default async function GuidePage({ params }: PageProps<"/explore/[slug]">) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const { user, profile } = await requireOnboarded();
  const { t } = await getI18n();
  const tpl = guide.programId ? getProgramTemplate(guide.programId) : null;
  const [active, sides, kg] = tpl ? await Promise.all([getActiveProgram(user.id), getSidePrograms(user.id), bodyWeight(user.id, profile)]) : [null, [], 70];
  const following = !!(tpl && active?.split === "guide" && active.name === tpl.name);
  const side = tpl ? (sides.find((p) => p.name === tpl.name) ?? null) : null;
  const days = tpl ? templateDays(tpl, kg) : [];
  const workouts = tpl?.days.filter((d) => d.kind === "workout").length ?? 0;

  return (
    <article className="mx-auto max-w-2xl">
      <div className="no-print">
        <TopBar title={t("nav.explore")} back="/explore" backLabel={t("common.back")} />
      </div>
      <div className="relative -mx-4 -mt-5 mb-5 sm:mx-0 sm:mt-0 print:hidden">
        <GuideArt guide={guide} className="aspect-[16/8] sm:rounded-md" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <Tags items={guide.tags} />
        </div>
      </div>
      <header className="mb-6 space-y-3">
        <p className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
          {guide.category === "program" ? t("explore.program") : t("explore.guide")} · {t("explore.read", { n: guide.readMinutes })}
          {tpl && ` · ${t("explore.days", { n: tpl.days.length, w: workouts })}`}
        </p>
        <h1 className="text-[2rem] leading-tight">{guide.title}</h1>
        <p className="text-[17px] text-ink-2">{guide.summary}</p>
        {guide.caution && (
          <p className="flex gap-2 rounded-md bg-amber-100 p-3 text-[15px] text-amber-ink">
            <AlertTriangle className="mt-0.5 size-4.5 shrink-0" aria-hidden /> {guide.caution}
          </p>
        )}
        <div className="no-print flex flex-wrap gap-2">
          <PrintButton label={t("explore.print")} />
        </div>
        {tpl && (
          <div className="space-y-2">
            {!following && <AddToDayButton programId={tpl.id} sideId={side?.id ?? null} />}
            <StartProgramButton programId={tpl.id} active={following} />
          </div>
        )}
      </header>

      {tpl && (
        <div className="mb-8">
          <ProgramPreview days={days} t={t} />
        </div>
      )}

      <GuideBody sections={guide.sections} />

      {guide.sources.length > 0 && (
        <section className="mt-10 border-t border-line pt-4">
          <h2 className="mb-2 text-base font-bold">{t("explore.sources")}</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
            {guide.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-lime hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}
      <p className="mt-6 text-xs text-muted">{t("explore.disclaimer")}</p>
    </article>
  );
}
