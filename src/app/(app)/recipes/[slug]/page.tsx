import { ArrowRight, ChevronLeft, ShieldCheck, Timer, Users, Utensils } from "lucide-react";
import { StatStrip, StickerPill } from "@/components/brand/Brand";
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

export default async function RecipePage({ params }: PageProps<"/recipes/[slug]">) {
  const { user, profile } = await requireOnboarded();
  const { t, info } = await getI18n();
  const { slug } = await params;
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
    <article className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div className="relative -mx-4 sm:mx-0">
          <RecipeVisual recipeId={recipe.id} palette={recipe.palette} image={detail.heroImage} alt={recipe.title} labels={labels} className="aspect-[4/3.6] sm:rounded-[1.75rem]" />
          <Link href="/recipes" aria-label={t("common.back")} className="absolute top-3 left-3 grid size-11 place-items-center rounded-full bg-[#f4f4ee] text-[#0a0c0e] shadow-lg">
            <ChevronLeft className="size-5" strokeWidth={2.5} />
          </Link>
          <div className="absolute top-3 right-3">
            <FavouriteButton recipeId={recipe.id} initial={detail.isFavourite} compact />
          </div>
        </div>
        <div className="relative">
          <StickerPill className="absolute -top-9 right-1 lg:top-0">
            <span>{recipe.prepMin + recipe.cookMin} {t("common.min")}</span>
            <span>₹{Math.round(recipe.costPerServingInr)} / {t("common.serving")}</span>
          </StickerPill>
          <div className="mb-2 flex flex-wrap gap-1.5 pr-32">
            <Badge tone="forest">{t(`cuisine.${recipe.cuisine}` as MessageKey)}</Badge>
            <Badge>{t(`diet.${recipe.dietType}` as MessageKey)}</Badge>
            {recipe.isKeto && <Badge tone="lime">{t("cat.keto")}</Badge>}
            {!recipe.isKeto && recipe.isLowCarb && <Badge tone="lime">{t("cat.low_carb")}</Badge>}
            {recipe.isHighProtein && <Badge tone="forest">{t("cat.high_protein")}</Badge>}
          </div>
          <h1 className="text-[2rem] leading-[1.05] sm:text-[2.6rem]">
            <Tx>{loc.title}</Tx>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {loc.title !== recipe.title ? `${recipe.title} · ` : ""}
            {recipe.region ?? t(`cuisine.${recipe.cuisine}` as MessageKey)}
          </p>
          <StatStrip
            className="mt-5"
            items={[
              { value: Math.round(recipe.kcal), label: t("macro.calories") },
              { value: `${recipe.proteinG} g`, label: t("macro.protein") },
              { value: `${recipe.netCarbsG} g`, label: t("macro.netCarbs") },
              { value: `${recipe.prepMin + recipe.cookMin}′`, label: `${t("recipe.prep")} + ${t("recipe.cook")}` },
            ]}
          />
          <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{recipe.description}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <Users className="size-4" aria-hidden /> {recipe.servings} {t("common.servings")}
            </span>
            {recipe.restMin > 0 && (
              <span className="inline-flex items-center gap-1">
                <Timer className="size-4" aria-hidden /> {t("recipe.rest")}: {recipe.restMin} {t("common.min")}
              </span>
            )}
          </p>
          <Link href={`/cook/${recipe.slug}`} className={buttonClass("lime", "xl", "mt-5 w-full")}>
            {t("recipe.startCooking")} <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t("recipe.nutrition")}</h2>
        <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {nutrition.map((n) => (
            <div key={n.k} className="rounded-2xl bg-sand/60 p-3">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-2">
                <span className="size-2 rounded-full" style={{ background: n.c }} aria-hidden /> {t(n.k)}
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular">
                {n.v}
                <span className="ml-0.5 text-sm font-medium text-muted">{n.u}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-muted">
          {t("recipe.netCarbsExplain")} {t("recipe.nutritionNote")}
        </p>
        <p className={`mt-3 rounded-2xl px-3 py-2 text-sm ${recipe.isKeto ? "bg-lime-100 text-forest-700" : "bg-sand text-ink-2"}`}>
          <span className="font-semibold">{t("recipe.ketoCheck")}:</span>{" "}
          {recipe.isKeto
            ? t("recipe.ketoYes", { n: recipe.netCarbsG })
            : `${recipe.netCarbsG} g net carbs per serving — above the ${KETO_MAX_NET_CARBS_PER_SERVING} g keto-meal limit, or too large a share of energy from carbs.`}
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">{t("recipe.ingredients")}</h2>
          <RecipeIngredients lines={lineViews(detail)} servings={recipe.servings} units={profile.units} />
          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-sm">
            <span className="font-semibold">{t("recipe.allergens")}:</span>
            {recipe.allergens.length ? recipe.allergens.map((a) => <Badge key={a} tone="terracotta">{t(`allergen.${a}` as MessageKey)}</Badge>) : <span className="text-muted">{t("recipe.noAllergens")}</span>}
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-semibold">{t("recipe.method")}</h2>
          {loc.lang !== "en" && loc.status !== "reviewed" && <p className="mb-2 text-xs text-muted">{t(loc.status === "machine" ? "cook.audio.machine" : "cook.audio.draft")}</p>}
          {info.contentLang !== "en" && loc.lang === "en" && <p className="mb-2 text-xs text-muted">{t("cook.audio.noTranslation", { lang: languageInfo(info.code).nativeName })}</p>}
          <ol className="mt-3 space-y-4">
            {loc.steps.map((s) => (
              <li key={s.stepIndex} className="flex gap-3">
                <RecipeVisual recipeId={recipe.id} palette={recipe.palette} image={detail.stepImages[s.stepIndex]} stepIndex={s.stepIndex} alt={s.title} labels={labels} showLabel={false} className="size-16 shrink-0 rounded-xl sm:size-20" />
                <div>
                  <p className="text-xs font-bold text-forest uppercase">
                    {t("cook.step", { n: s.stepIndex + 1, total: loc.steps.length })}
                    {s.timerSec ? ` · ${Math.round(s.timerSec / 60)} ${t("common.min")}` : ""}
                    {s.tempC ? ` · ${s.tempC}°C` : ""}
                  </p>
                  <p className="font-semibold">{s.title}</p>
                  <p className="mt-0.5 text-[15px] leading-relaxed text-ink-2">
                    <Tx>{s.text}</Tx>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
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

      <footer className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <ShieldCheck className="size-4 text-forest" aria-hidden />
        <span>
          {t("recipe.validated")} · {t("recipe.source")}: {recipe.provenance.author ?? recipe.provenance.source} · {recipe.provenance.importBatch} · ID {recipe.id}
        </span>
      </footer>
    </article>
  );
}
