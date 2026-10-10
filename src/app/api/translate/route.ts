import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { apiUser, json } from "@/server/api";
import { config, ProviderError } from "@/server/config";
import { db, schema } from "@/server/db/client";
import { translateTexts } from "@/server/providers/translate";
import { consume, limitFor, refund } from "@/server/services/usage";

export const maxDuration = 120;

const Body = z.object({ recipeId: z.string().max(80), lang: z.enum(["ta", "ml"]) });

/** Machine-translates a recipe's validated steps; stored and labelled as "machine". */
export async function POST(req: Request) {
  const auth = await apiUser(req);
  if ("error" in auth) return auth.error;
  const { user } = auth.current;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "bad_request" }, 400);
  const { recipeId, lang } = parsed.data;
  const [recipe] = await db.select().from(schema.recipes).where(eq(schema.recipes.id, recipeId)).limit(1);
  if (!recipe) return json({ error: "not_found" }, 404);
  const existing = await db.select().from(schema.recipeTranslations).where(eq(schema.recipeTranslations.recipeId, recipeId));
  if (existing.some((t) => t.lang === lang)) return json({ ok: true, cached: true });
  if (limitFor(user, "translate") === 0) return json({ error: "premium" }, 402);
  if (!config.translate.provider) return json({ error: "not_configured" }, 503);
  if (!(await consume(user, "translate"))) return json({ error: "quota" }, 429);
  try {
    const steps = await db.select().from(schema.recipeSteps).where(eq(schema.recipeSteps.recipeId, recipeId)).orderBy(asc(schema.recipeSteps.stepIndex));
    const [title, ...translated] = await translateTexts([recipe.title, ...steps.map((s) => s.text)], lang);
    await db
      .insert(schema.recipeTranslations)
      .values({ recipeId, lang, title, steps: translated, status: "machine", source: `${config.translate.provider}:${config.translate.model}`, contentHash: recipe.contentHash, updatedAt: new Date() })
      .onConflictDoNothing();
    return json({ ok: true, cached: false });
  } catch (e) {
    await refund(user, "translate");
    const status = e instanceof ProviderError ? e.status : 500;
    if (!(e instanceof ProviderError)) console.error(e);
    return json({ error: "failed" }, status);
  }
}
