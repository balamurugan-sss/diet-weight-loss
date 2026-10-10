import "server-only";
import { asc, eq } from "drizzle-orm";
import { narrationLang, stepNarration } from "@/lib/i18n/narration";
import { db, schema } from "@/server/db/client";

/**
 * Narration for each step in `lang`, built only from validated recipe text
 * (or its stored translation). Returns null when no translation exists, so
 * callers can show an explicit fallback instead of switching language.
 */
export async function stepNarrations(recipeId: string, lang: string) {
  const steps = await db.select().from(schema.recipeSteps).where(eq(schema.recipeSteps.recipeId, recipeId)).orderBy(asc(schema.recipeSteps.stepIndex));
  const nl = narrationLang(lang);
  let texts = steps.map((s) => s.text);
  let status: string | null = null;
  if (nl !== "en") {
    const all = await db.select().from(schema.recipeTranslations).where(eq(schema.recipeTranslations.recipeId, recipeId));
    const match = all.find((t) => t.lang === nl);
    if (!match || match.steps.length !== steps.length) return null;
    texts = match.steps;
    status = match.status;
  }
  return {
    status,
    steps: steps.map((s, i) => stepNarration(nl, { text: texts[i], timerSec: s.timerSec, tempC: s.tempC }, i + 1, steps.length)),
  };
}
