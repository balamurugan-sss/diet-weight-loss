import { ChefHat, Clock, Flame, IndianRupee, ShieldCheck, Timer, Users, Utensils } from "lucide-react";
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
  const { profile } = await requireOnboarded();
  const { t, info } = await getI18n();
  const { slug } = await params;
  const { user } = await requireOnboarded();
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
        <RecipeVisual recipeId={recipe.id} palette={recipe.palette} image={detail.heroImage} alt={recipe.title} labels={labels} className="-mx-4 aspect-[4/3] sm:mx-0 sm:rounded-[1.75rem]" />
        <div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge tone="forest">{t(`cuisine.${recipe.cuisine}` as MessageKey)}</Badge>
            <Badge>{t(`diet.${recipe.dietType}` as MessageKey)}</Badge>
            {recipe.isKeto && <Badge tone="lime">{t("cat.keto")}</Badge>}
            {!recipe.isKeto && recipe.isLowCarb && <Badge tone="lime">{t("cat.low_carb")}</Badge>}
            {recipe.isHighProtein && <Badge tone="forest">{t("cat.high_protein")}</Badge>}
          </div>
          <h1 className="text-[1.85rem] leading-tight font-semibold sm:text-4xl">
            <Tx>{loc.title}</Tx>
          </h1>
          {loc.title !== recipe.title && <p className="mt-1 text-sm text-muted">{recipe.title}</p>}
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{recipe.description}</p>
          <dl className="mt-5 grid grid-cols-4 gap-2 text-center">
            {[
              { icon: Clock, label: t("recipe.prep"), v: `${recipe.prepMin}′` },
              { icon: Flame, label: t("recipe.cook"), v: `${recipe.cookMin}′` },
              { icon: Users, label: t("common.servings"), v: recipe.servings },
              { icon: IndianRupee, label: t("common.serving"), v: `₹${Math.round(recipe.costPerServingInr)}` },
            ].map(({ icon: Icon, label, v }) => (
              <div key={label} className="rounded-2xl bg-sand/70 px-1 py-2.5">
                <Icon className="mx-auto size-4 text-forest" aria-hidden />
                <dd className="mt-1 font-semibold tabular">{v}</dd>
                <dt className="text-[11px] text-muted">{label}</dt>
              </div>
            ))}
          </dl>
          {recipe.restMin > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
              <Timer className="size-4" aria-hidden /> {t("recipe.rest")}: {recipe.restMin} {t("common.min")}
            </p>
          )}
          <div className="mt-5 flex gap-2">
            <Link href={`/cook/${recipe.slug}`} className={buttonClass("lime", "lg", "flex-1")}>
              <ChefHat className="size-5" aria-hidden /> {t("recipe.startCooking")}
            </Link>
            <FavouriteButton recipeId={recipe.id} initial={detail.isFavourite} />
          </div>
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
          {info.contentLang !== "en" && loc.lang === "en" && <p className="mb-2 text-xs text-muted">{t("cook.audio.noTranslation", { lang: languageInfo(info.code).name })}</p>}
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
