import { desc, eq } from "drizzle-orm";
import { ChefHat, Flame, Leaf, Mic } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { RecipeArt } from "@/components/recipes/RecipeArt";
import { buttonClass } from "@/components/ui/Button";
import { startAsGuest } from "@/server/actions/auth";
import { getCurrentUser } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { getI18n } from "@/server/i18n";

export default async function Landing({ searchParams }: PageProps<"/">) {
  const current = await getCurrentUser();
  if (current?.profile?.onboardingCompletedAt) redirect("/home");
  const { t, lang, messages, transliteration } = await getI18n();
  const { error } = await searchParams;
  const featured = await db
    .select({ id: schema.recipes.id, title: schema.recipes.title, kcal: schema.recipes.kcal, net: schema.recipes.netCarbsG, palette: schema.recipes.palette, isKeto: schema.recipes.isKeto })
    .from(schema.recipes)
    .where(eq(schema.recipes.validationStatus, "validated"))
    .orderBy(desc(schema.recipes.isKeto))
    .limit(3);

  const features = [
    { icon: Leaf, title: t("landing.f1.title"), body: t("landing.f1.body") },
    { icon: Flame, title: t("landing.f2.title"), body: t("landing.f2.body") },
    { icon: Mic, title: t("landing.f3.title"), body: t("landing.f3.body") },
  ];

  return (
    <I18nProvider lang={lang} messages={messages} transliteration={transliteration}>
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <header className="flex items-center justify-between py-5">
          <span className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-2xl bg-forest text-lg text-lime" aria-hidden>◐</span>
            <span className="font-display text-2xl font-semibold text-forest">{t("app.name")}</span>
          </span>
          <LanguageSwitcher current={lang} label={t("settings.language")} />
        </header>

        <section className="hero-gradient relative overflow-hidden rounded-[2rem] px-6 py-10 text-white sm:px-10 sm:py-14 lg:grid lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-10">
          <div className="animate-fade-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-lime">
              <ChefHat className="size-4" aria-hidden /> {t("app.tagline")}
            </p>
            <h1 className="max-w-xl text-[2.35rem] leading-[1.08] font-semibold sm:text-5xl">{t("landing.headline")}</h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/85">{t("landing.sub")}</p>
            {error === "rate" && <p className="mt-4 rounded-xl bg-terracotta/90 px-3 py-2 text-sm">{t("auth.rateLimited")}</p>}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <form action={startAsGuest}>
                <button className={buttonClass("lime", "xl", "w-full sm:w-auto")}>
                  {current ? t("common.continue") : t("landing.cta")}
                </button>
              </form>
              {!current && (
                <Link href="/login" className={buttonClass("ghost", "xl", "text-white hover:bg-white/10")}>
                  {t("landing.login")}
                </Link>
              )}
            </div>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-3 lg:mt-0" aria-hidden>
            {featured.map((r, i) => (
              <div key={r.id} className={`overflow-hidden rounded-3xl bg-white text-charcoal shadow-[var(--shadow-lift)] ${i === 1 ? "translate-y-6" : ""}`}>
                <RecipeArt id={r.id} palette={r.palette} className="aspect-[4/5] w-full" />
                <div className="p-2.5">
                  <p className="line-clamp-2 text-xs leading-snug font-semibold">{r.title}</p>
                  <p className="mt-1 text-[11px] text-muted tabular">
                    {Math.round(r.kcal)} kcal · {r.net} g net
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6">
              <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-lime-100 text-forest">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </section>
        <p className="mt-10 text-center text-sm text-muted">{t("landing.disclaimer")}</p>
      </div>
    </I18nProvider>
  );
}
