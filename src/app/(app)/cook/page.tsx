import { and, desc, eq, isNull } from "drizzle-orm";
import { ChefHat, Languages, Mic, Timer } from "lucide-react";
import Link from "next/link";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeVisual } from "@/components/recipes/RecipeVisual";
import { buttonClass } from "@/components/ui/Button";
import { Card, PageHeader, SectionTitle } from "@/components/ui/Card";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { requireOnboarded } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { getI18n } from "@/server/i18n";
import { dayView } from "@/server/services/dayView";
import { heroImages } from "@/server/services/media";
import { currentDayIndex, getActivePlan } from "@/server/services/plans";
import { favouriteRecipes } from "@/server/services/recipes";

export const metadata = { title: "Cooking assistant" };

export default async function CookHub() {
  const { user, profile } = await requireOnboarded();
  const { t } = await getI18n();
  const labels = { ai: t("recipe.illustration"), photo: t("recipe.verifiedPhoto"), placeholder: t("recipe.illustrationPlaceholder") };
  const [sessions, plan, favs] = await Promise.all([
    db
      .select({ s: schema.cookingSessions, r: { id: schema.recipes.id, slug: schema.recipes.slug, title: schema.recipes.title, palette: schema.recipes.palette } })
      .from(schema.cookingSessions)
      .innerJoin(schema.recipes, eq(schema.recipes.id, schema.cookingSessions.recipeId))
      .where(and(eq(schema.cookingSessions.userId, user.id), isNull(schema.cookingSessions.finishedAt)))
      .orderBy(desc(schema.cookingSessions.updatedAt))
      .limit(3),
    getActivePlan(user.id),
    favouriteRecipes(user.id, 8),
  ]);
  const view = plan ? await dayView(plan, profile, currentDayIndex(plan)) : null;
  const imgs = await heroImages(sessions.map((s) => s.r.id));
  const how = [
    { icon: ChefHat, k: "cook.how1" as const },
    { icon: Languages, k: "cook.how2" as const },
    { icon: Timer, k: "cook.how3" as const },
    { icon: Mic, k: "cook.how4" as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("cook.title")} />
      {sessions.length > 0 && (
        <section>
          <SectionTitle>{t("cook.continue")}</SectionTitle>
          <ul className="space-y-3">
            {sessions.map(({ s, r }) => (
              <li key={r.id}>
                <Link href={`/cook/${r.slug}`} className="card flex items-center gap-3 p-3 hover:shadow-[var(--shadow-lift)]">
                  <RecipeVisual recipeId={r.id} palette={r.palette} image={imgs.get(r.id)} alt={r.title} labels={labels} showLabel={false} className="size-16 shrink-0 rounded-2xl" />
                  <span className="flex-1">
                    <span className="block font-semibold">{r.title}</span>
                    <span className="text-sm text-muted">{t("cook.step", { n: s.stepIndex + 1, total: "…" })}</span>
                  </span>
                  <span className={buttonClass("lime", "sm")}>{t("cook.continue")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {view && (
        <section>
          <SectionTitle>{t("cook.fromPlan")}</SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2">
            {view.slots.flatMap((s) =>
              s.items
                .filter((i) => i.course !== "accompaniment" || s.items.length === 1)
                .map((i) => (
                  <li key={i.id} className="min-w-0">
                    <Link href={`/cook/${i.slug}?item=${i.id}`} className="card flex items-center gap-3 p-3 hover:shadow-[var(--shadow-lift)]">
                      <RecipeVisual recipeId={i.recipeId} palette={i.palette} image={i.image} alt={i.title} labels={labels} showLabel={false} className="size-14 shrink-0 rounded-xl" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-muted uppercase">{t(`slot.${s.slot}` as MessageKey)}</span>
                        <span className="block truncate font-semibold">{i.title}</span>
                      </span>
                      <ChefHat className="size-5 text-forest" aria-hidden />
                    </Link>
                  </li>
                )),
            )}
          </ul>
        </section>
      )}

      <Card className="card-sand border-0">
        <h2 className="mb-3 text-lg font-semibold">{t("cook.howTitle")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {how.map(({ icon: Icon, k }) => (
            <li key={k} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-surface text-forest">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="text-[15px]">{t(k)}</span>
            </li>
          ))}
        </ul>
      </Card>

      {favs.length > 0 && (
        <section>
          <SectionTitle>{t("home.saved")}</SectionTitle>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {favs.map((r) => (
              <li key={r.id}>
                <RecipeCard r={r} t={t} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
