import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CookingMode, type Narration } from "@/components/cook/CookingMode";
import { stepNarration } from "@/lib/i18n/narration";
import { requireOnboarded } from "@/server/auth/dal";
import { config } from "@/server/config";
import { db, schema } from "@/server/db/client";
import { getI18n } from "@/server/i18n";
import { ownedItem } from "@/server/services/plans";
import { getRecipeDetail, lineViews } from "@/server/services/recipes";
import { remaining } from "@/server/services/usage";

export const metadata = { title: "Cooking mode" };

export default async function CookPage({ params, searchParams }: PageProps<"/cook/[slug]">) {
  const { user, profile } = await requireOnboarded();
  const { info } = await getI18n();
  const { slug } = await params;
  const sp = await searchParams;
  const detail = await getRecipeDetail(slug, info.contentLang, user.id);
  if (!detail) notFound();
  const { recipe, steps } = detail;

  const narrations: Record<string, Narration> = {
    en: { status: null, texts: steps.map((s) => s.text), spoken: steps.map((s, i) => stepNarration("en", s, i + 1, steps.length)) },
  };
  const translations = await db.select().from(schema.recipeTranslations).where(eq(schema.recipeTranslations.recipeId, recipe.id));
  for (const tr of translations) {
    if ((tr.lang !== "ta" && tr.lang !== "ml") || tr.steps.length !== steps.length) continue;
    narrations[tr.lang] = {
      status: tr.status,
      texts: tr.steps,
      spoken: steps.map((s, i) => stepNarration(tr.lang as "ta" | "ml", { ...s, text: tr.steps[i] }, i + 1, steps.length)),
    };
  }

  const itemId = typeof sp.item === "string" ? sp.item : null;
  const item = itemId ? await ownedItem(user.id, itemId) : null;
  const [session] = await db
    .select()
    .from(schema.cookingSessions)
    .where(and(eq(schema.cookingSessions.userId, user.id), eq(schema.cookingSessions.recipeId, recipe.id)))
    .limit(1);
  const resume = session && !session.finishedAt ? session : null;
  const [stepImage, cloudTts] = await Promise.all([remaining(user, "stepImage"), remaining(user, "cloudTts")]);

  return (
    <CookingMode
      recipe={{ id: recipe.id, slug: recipe.slug, title: recipe.title, servings: recipe.servings, palette: recipe.palette }}
      steps={steps.map((s) => ({ stepIndex: s.stepIndex, title: s.title, kind: s.kind, timerSec: s.timerSec, tempC: s.tempC, heat: s.heat }))}
      narrations={narrations}
      lines={lineViews(detail)}
      stepImages={detail.stepImages}
      initial={{
        stepIndex: resume?.stepIndex ?? 0,
        completed: resume?.completedSteps ?? [],
        servings: resume?.servings ?? (profile.householdSize > 1 ? profile.householdSize : recipe.servings),
      }}
      prefs={{ lang: profile.language, rate: profile.narrationRate, units: profile.units, keepAwake: profile.keepAwake, voiceCommands: profile.voiceCommands }}
      planItemId={item && item.item.recipeId === recipe.id ? item.item.id : null}
      premium={user.isPremium}
      configured={{ images: !!config.image.provider, tts: !!config.tts.provider, translate: !!config.translate.provider }}
      quota={{ stepImage, cloudTts }}
    />
  );
}
