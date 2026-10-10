import { ArrowRight, ChevronDown, Flame, ShieldCheck, Timer, Users, Utensils, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Tx } from "@/components/i18n/I18nProvider";
import { FavouriteButton, RecipeIngredients } from "@/components/recipes/RecipeInteractive";
import { RecipeVisual } from "@/components/recipes/RecipeVisual";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Chip";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { languageInfo } from "@/lib/i18n/languages";
import { KETO_MAX_NET_CARBS_PER_SERVING } from "@/lib/recipes/nutrition";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { getRecipeDetail, lineViews, localisedSteps } from "@/server/services/recipes";

export async function generateMetadata({ params }: PageProps<"/recipes/[slug]">) {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ") };
}

export default async function RecipePage({ params, searchParams }: PageProps<"/recipes/[slug]">) {
  const { user, profile } = await requireOnboarded();
  const { t, info } = await getI18n();
  const { slug } = await params;
  const sp = await searchParams;
  // Opened from a meal-plan card: close goes back to the plan and cooking logs that meal.
  const item = typeof sp.item === "string" && /^[\w-]{1,64}$/.test(sp.item) ? sp.item : null;
  const back = item ? "/planner" : "/recipes";
  const itemQuery = item ? `?item=${item}` : "";
  const detail = await getRecipeDetail(slug, info.contentLang, user.id);
  if (!detail) notFound();
  const { recipe } = detail;
  const loc = localisedSteps(detail);
  const labels = { ai: t("recipe.illustration"), photo: t("recipe.verifiedPhoto"), placeholder: t("recipe.illustrationPlaceholder") };
  const nutrition = [
    { k: "macro.calories" as const, v: Math.round(recipe.kcal), u: "kcal", c: "var(--color-charcoal)" },
    { k: "macro.protein" as const, v: recipe.proteinG, u: "g", c: "var(--color-protein)" },
    { k: "macro.totalCarbs" as const, v: recipe.carbsG, u: "g", c: "var(--color-carbs)" },
    { k: "macro.fibre" as const, v: recipe.fibreG, u: "g", c: "var(--color-fibre)" },
    { k: "macro.netCarbs" as const, v: recipe.netCarbsG, u: "g", c: "var(--color-carbs)" },
    { k: "macro.fat" as const, v: recipe.fatG, u: "g", c: "var(--color-fat)" },
  ];

  return (
    <article className="space-y-6 pb-24">
      <div className="relative -mx-4 -mt-5 sm:mx-0 sm:mt-0">
        <RecipeVisual recipeId={recipe.id} palette={recipe.palette} image={detail.heroImage} alt={recipe.title} labels={labels} className="aspect-[4/3] sm:rounded-md" />
        <Link href={back} aria-label={t("common.back")} className="absolute top-3 left-3 grid size-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur">
          <X className="size-6" strokeWidth={2.2} />
        </Link>
        <div className="absolute top-3 right-3">
          <FavouriteButton recipeId={recipe.id} initial={detail.isFavourite} compact />
        </div>
      </div>

      <header>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-bold tracking-[0.08em] text-ink-2 uppercase">
          <span className="inline-flex items-center gap-1.5">
            <Timer className="size-4 text-water" aria-hidden /> {recipe.prepMin + recipe.cookMin} {t("common.min")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Flame className="size-4 text-lime" aria-hidden /> {Math.round(recipe.kcal)} kcal
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" aria-hidden /> {recipe.servings} {t("common.servings")}
          </span>
        </p>
        <h1 className="mt-3 text-[2rem] leading-[1.1]">
          <Tx>{loc.title}</Tx>
        </h1>
        {loc.title !== recipe.title && <p className="mt-1 text-sm text-muted">{recipe.title}</p>}
        <dl className="mt-5 grid grid-cols-3 divide-x divide-line border border-line text-center">
          {[
            [`${recipe.proteinG} g`, t("macro.protein")],
            [`${recipe.carbsG} g`, t("macro.carbs")],
            [`${recipe.fatG} g`, t("macro.fat")],
          ].map(([v, l]) => (
            <div key={l} className="py-3">
              <dd className="text-xl font-bold tabular">{v}</dd>
              <dt className="text-[11px] font-bold tracking-[0.08em] text-muted uppercase">{l}</dt>
            </div>
          ))}
        </dl>
      </header>

      <section>
        <h2 className="border-b-2 border-line pb-2 text-[1.2rem] font-bold">{t("recipe.ingredients")}</h2>
        <div className="mt-2">
          <RecipeIngredients lines={lineViews(detail)} servings={recipe.servings} units={profile.units} />
        </div>
      </section>

      <section>
        <h2 className="border-b-2 border-line pb-2 text-[1.2rem] font-bold">{t("recipe.cooking")}</h2>
        {loc.lang !== "en" && loc.status !== "reviewed" && <p className="mt-2 text-xs text-muted">{t(loc.status === "machine" ? "cook.audio.machine" : "cook.audio.draft")}</p>}
        {info.contentLang !== "en" && loc.lang === "en" && <p className="mt-2 text-xs text-muted">{t("cook.audio.noTranslation", { lang: languageInfo(info.code).nativeName })}</p>}
        <ol className="divide-y divide-line">
          {loc.steps.map((s, i) => (
            <li key={s.stepIndex} className="flex gap-3 py-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sand-2 text-sm font-bold">{i + 1}</span>
              <p className="text-[16px] leading-relaxed text-ink-2">
                <Tx>{s.text}</Tx>
                {s.timerSec ? <span className="text-muted"> ({Math.round(s.timerSec / 60)} {t("common.min")})</span> : null}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <details className="group rounded-md bg-surface">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 font-semibold">
          {t("recipe.moreDetails")} <ChevronDown className="size-5 text-muted transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="space-y-5 px-4 pb-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="forest">{t(`cuisine.${recipe.cuisine}` as MessageKey)}</Badge>
            <Badge>{t(`diet.${recipe.dietType}` as MessageKey)}</Badge>
            {recipe.isKeto && <Badge tone="lime">{t("cat.keto")}</Badge>}
            {!recipe.isKeto && recipe.isLowCarb && <Badge tone="lime">{t("cat.low_carb")}</Badge>}
            {recipe.isHighProtein && <Badge tone="forest">{t("cat.high_protein")}</Badge>}
          </div>
          {recipe.description && <p className="text-[15px] leading-relaxed text-ink-2">{recipe.description}</p>}
          <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {nutrition.map((n) => (
              <div key={n.k} className="rounded-sm bg-sand/60 p-3">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-2">
                  <span className="size-2 rounded-full" style={{ background: n.c }} aria-hidden /> {t(n.k)}
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular">
                  {n.v}
                  <span className="ml-0.5 text-sm font-medium text-muted">{n.u}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-muted">
            {t("recipe.netCarbsExplain")} {t("recipe.nutritionNote")}
          </p>
          <p className={`rounded-sm px-3 py-2 text-sm ${recipe.isKeto ? "bg-lime-100 text-forest-700" : "bg-sand text-ink-2"}`}>
            <span className="font-semibold">{t("recipe.ketoCheck")}:</span>{" "}
            {recipe.isKeto
              ? t("recipe.ketoYes", { n: recipe.netCarbsG })
              : `${recipe.netCarbsG} g net carbs per serving — above the ${KETO_MAX_NET_CARBS_PER_SERVING} g keto-meal limit, or too large a share of energy from carbs.`}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="font-semibold">{t("recipe.allergens")}:</span>
            {recipe.allergens.length ? recipe.allergens.map((a) => <Badge key={a} tone="terracotta">{t(`allergen.${a}` as MessageKey)}</Badge>) : <span className="text-muted">{t("recipe.noAllergens")}</span>}
          </div>
      <div className="grid gap-5 md:grid-cols-2">
        {detail.substitutions.length > 0 && (
          <Card>
            <h2 className="mb-3 text-lg font-semibold">{t("recipe.substitutions")}</h2>
            <ul className="space-y-3">
              {detail.substitutions.map(({ s, fromName, toName }) => (
                <li key={s.id} className="text-[15px]">
                  <p className="font-semibold">
                    {fromName}
                    {toName ? ` → ${toName}` : ""}
                  </p>
                  <p className="text-sm text-muted">{s.note}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Utensils className="size-5" aria-hidden /> {t("recipe.equipment")}
          </h2>
          <ul className="flex flex-wrap gap-1.5">
            {recipe.equipment.map((e) => (
              <li key={e}>
                <Badge>{e.split("|").map((x) => t(`equip.${x}` as MessageKey)).join(" / ")}</Badge>
              </li>
            ))}
          </ul>
          {(recipe.storage || recipe.reheating) && (
            <dl className="mt-4 space-y-2 text-[15px]">
              {recipe.storage && (
                <div>
                  <dt className="font-semibold">{t("recipe.storage")}</dt>
                  <dd className="text-ink-2">{recipe.storage}</dd>
                </div>
              )}
              {recipe.reheating && (
                <div>
                  <dt className="font-semibold">{t("recipe.reheating")}</dt>
                  <dd className="text-ink-2">{recipe.reheating}</dd>
                </div>
              )}
            </dl>
          )}
        </Card>
      </div>

        </div>
      </details>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
        <Link href={`/cook/${recipe.slug}${itemQuery}`} className={buttonClass("lime", "xl", "mx-auto w-full max-w-5xl justify-between")}>
          {t("recipe.startCooking")} <ArrowRight className="size-5" aria-hidden />
        </Link>
      </div>

      <footer className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <ShieldCheck className="size-4 text-forest" aria-hidden />
        <span>
          {t("recipe.validated")} · {t("recipe.source")}: {recipe.provenance.author ?? recipe.provenance.source} · {recipe.provenance.importBatch} · ID {recipe.id}
        </span>
      </footer>
    </article>
  );
}
