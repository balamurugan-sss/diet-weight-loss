import { ArrowRight } from "lucide-react";
import { GuideRow, ProgramCard } from "@/components/explore/GuideCard";
import { TopBar } from "@/components/ui/TopBar";
import { GUIDES } from "@/lib/guides";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";

export const metadata = { title: "Explore" };

/** Explore: followable programs, then trending guides. All printable. */
export default async function ExplorePage() {
  await requireOnboarded();
  const { t } = await getI18n();
  const programs = GUIDES.filter((g) => g.category === "program");
  const trending = GUIDES.filter((g) => g.category === "trending");
  return (
    <div className="space-y-7">
      <TopBar title={t("nav.explore")} />
      <section>
        <h2 className="mb-3 text-[1.5rem] font-extrabold">{t("program.perks")}</h2>
        <a
          href="#guides"
          className="relative flex min-h-28 items-center justify-between overflow-hidden border border-line bg-surface px-5 [clip-path:polygon(0_0,92%_0,100%_22%,100%_100%,8%_100%,0_78%)] hover:border-lime/60"
        >
          <span className="pointer-events-none absolute -left-6 h-40 w-24 -skew-x-[20deg] bg-lime/80" aria-hidden />
          <span className="pointer-events-none absolute left-16 h-40 w-3 -skew-x-[20deg] bg-lime/50" aria-hidden />
          <span className="relative ml-auto flex items-center gap-2 text-right text-[1.35rem] font-bold text-lime">
            {t("program.guides")} <ArrowRight className="size-6" aria-hidden />
          </span>
        </a>
      </section>
      <section>
        <h2 className="mb-1 text-[1.6rem] font-extrabold">{t("explore.programs")}</h2>
        <p className="mb-3 text-[15px] text-muted">{t("explore.programsBody")}</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((g) => (
            <li key={g.slug}>
              <ProgramCard guide={g} label={t("explore.open")} />
            </li>
          ))}
        </ul>
      </section>
      <section id="guides" className="scroll-mt-6">
        <h2 className="mb-3 text-[1.6rem] font-extrabold">{t("explore.trending")}</h2>
        <ul className="grid gap-2 lg:grid-cols-2">
          {trending.map((g) => (
            <li key={g.slug}>
              <GuideRow guide={g} minutes={t("explore.read", { n: g.readMinutes })} />
            </li>
          ))}
        </ul>
      </section>
      <p className="text-sm text-muted">{t("explore.disclaimer")}</p>
    </div>
  );
}
