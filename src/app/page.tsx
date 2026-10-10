import { desc, eq } from "drizzle-orm";
import { ArrowRight, Dumbbell, HeartPulse, Utensils } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowCircle, LogoMark, TwoTone } from "@/components/brand/Brand";
import { HeroRibbon } from "@/components/brand/HeroRibbon";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getCurrentUser } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { getI18n } from "@/server/i18n";

export default async function Landing({ searchParams }: PageProps<"/">) {
  const current = await getCurrentUser();
  if (current?.profile?.onboardingCompletedAt) redirect("/home");
  const { t, lang, info, messages, transliteration } = await getI18n();
  const { error } = await searchParams;
  const [hero] = await db
    .select({ id: schema.recipes.id, palette: schema.recipes.palette })
    .from(schema.recipes)
    .where(eq(schema.recipes.validationStatus, "validated"))
    .orderBy(desc(schema.recipes.isKeto))
    .limit(1);

  const features = [
    { icon: Dumbbell, title: t("landing.f1.title"), body: t("landing.f1.body") },
    { icon: Utensils, title: t("landing.f2.title"), body: t("landing.f2.body") },
    { icon: HeartPulse, title: t("landing.f3.title"), body: t("landing.f3.body") },
  ];

  return (
    <I18nProvider lang={lang} messages={messages} transliteration={transliteration}>
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <header className="flex items-center justify-between py-5">
          <span className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-[1.7rem] font-extrabold tracking-wide uppercase">{t("app.name")}</span>
          </span>
          <LanguageSwitcher current={lang} label={t("settings.language")} />
        </header>

        <section className="lg:grid lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-12">
          <div className="lg:order-2">
            {hero && <HeroRibbon words="MOVE WELL • TRAIN HARD • EAT RIGHT • RECOVER •" recipeId={hero.id} palette={hero.palette} notes={info.uiLang === "en"} />}
          </div>
          <div className="mt-2 animate-fade-up lg:order-1 lg:mt-0">
            <TwoTone text={t("landing.headline")} className="text-[2.6rem] leading-[1.02] sm:text-6xl" />
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-ink-2">{t("landing.sub")}</p>
            {error === "rate" && <p className="mt-4 rounded-xl bg-terracotta-100 px-3 py-2 text-sm text-terracotta">{t("auth.rateLimited")}</p>}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={buttonClass("lime", "xl", "sm:min-w-72")}>
                {current ? t("common.continue") : t("landing.cta")} <ArrowRight className="size-5" aria-hidden />
              </Link>
              {!current && (
                <Link href="/login" className={buttonClass("outline", "xl")}>
                  {t("landing.login")}
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-3 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className={cn("flex flex-col p-6", i === 0 ? "card-lime" : "card")}>
              <span className={cn("mb-5 grid size-11 place-items-center rounded-2xl", i === 0 ? "bg-[#0a0c0e] text-lime" : "bg-forest-50 text-forest")}>
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="text-xl">{title}</h2>
              <p className={cn("mt-2 flex-1 text-[15px] leading-relaxed", i === 0 ? "text-white/75" : "text-muted")}>{body}</p>
              <ArrowCircle dark={i === 0} className="mt-5 self-end" />
            </div>
          ))}
        </section>
        <p className="mt-10 text-center text-sm text-muted">{t("landing.disclaimer")}</p>
      </div>
    </I18nProvider>
  );
}
