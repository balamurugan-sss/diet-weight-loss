import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { heroPrompt, stepPrompt } from "@/lib/media/prompts";
import { apiUser, json } from "@/server/api";
import { config, ProviderError } from "@/server/config";
import { db, schema } from "@/server/db/client";
import { generateImage } from "@/server/providers/image";
import { rateLimit } from "@/server/rateLimit";
import { imagesFor } from "@/server/services/media";
import { consume, limitFor, refund } from "@/server/services/usage";

export const maxDuration = 120;

const Body = z.object({ recipeId: z.string().max(80), stepIndex: z.number().int().min(-1).max(30), regenerate: z.boolean().optional() });

export async function POST(req: Request) {
  const auth = await apiUser(req);
  if ("error" in auth) return auth.error;
  const { user } = auth.current;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "bad_request" }, 400);
  const { recipeId, stepIndex, regenerate } = parsed.data;

  const [recipe] = await db.select().from(schema.recipes).where(eq(schema.recipes.id, recipeId)).limit(1);
  if (!recipe) return json({ error: "not_found" }, 404);
  const steps = await db.select().from(schema.recipeSteps).where(eq(schema.recipeSteps.recipeId, recipeId)).orderBy(asc(schema.recipeSteps.stepIndex));
  if (stepIndex >= steps.length) return json({ error: "bad_request" }, 400);

  if (!regenerate) {
    const existing = (await imagesFor([recipeId], stepIndex)).get(recipeId);
    if (existing) return json({ id: existing.id, kind: existing.kind, cached: true });
  }

  const feature = stepIndex === -1 ? "heroImage" : "stepImage";
  if (limitFor(user, feature) === 0) return json({ error: "premium" }, 402);
  if (!config.image.provider) return json({ error: "not_configured" }, 503);
  if (!(await rateLimit(`img:${user.id}`, 6, 60))) return json({ error: "rate_limited" }, 429);
  if (!(await consume(user, feature))) return json({ error: "quota" }, 429);

  try {
    const lines = await db.select({ id: schema.recipeIngredients.ingredientId }).from(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, recipeId));
    const ids = [...new Set(lines.map((l) => l.id))];
    const names = new Map((await db.select({ id: schema.ingredients.id, name: schema.ingredients.name }).from(schema.ingredients).where(inArray(schema.ingredients.id, ids))).map((i) => [i.id, i.name]));
    const nameOf = (id: string) => names.get(id) ?? id;
    const pr = { title: recipe.title, cuisine: recipe.cuisine, description: recipe.description, steps };

    // Continuity: pass the previous step's image as a visual reference.
    let reference: { data: Buffer; mime: string } | undefined;
    if (stepIndex > 0) {
      const prev = (await imagesFor([recipeId], stepIndex - 1)).get(recipeId);
      if (prev) {
        const [row] = await db.select({ data: schema.imageAssets.data, mime: schema.imageAssets.mime }).from(schema.imageAssets).where(eq(schema.imageAssets.id, prev.id));
        if (row) reference = { data: row.data, mime: row.mime };
      }
    }
    const prompt = stepIndex === -1 ? heroPrompt(pr, nameOf) : stepPrompt(pr, stepIndex, ids, nameOf, !!reference);
    const img = await generateImage(prompt, reference);
    const id = randomUUID();
    await db.transaction(async (tx) => {
      if (regenerate)
        await tx
          .update(schema.imageAssets)
          .set({ status: "rejected" })
          .where(and(eq(schema.imageAssets.recipeId, recipeId), eq(schema.imageAssets.stepIndex, stepIndex), eq(schema.imageAssets.status, "generated")));
      await tx.insert(schema.imageAssets).values({
        id,
        recipeId,
        stepIndex,
        status: "generated",
        kind: "ai_illustration",
        provider: img.provider,
        model: img.model,
        prompt,
        mime: img.mime,
        data: img.data,
        bytes: img.data.length,
        createdBy: user.id,
      });
    });
    return json({ id, kind: "ai_illustration", cached: false });
  } catch (e) {
    await refund(user, feature);
    const status = e instanceof ProviderError ? e.status : 500;
    if (!(e instanceof ProviderError)) console.error(e);
    return json({ error: status === 429 ? "busy" : "failed" }, status);
  }
}

export async function GET() {
  return json({ configured: !!config.image.provider }, 200);
}

