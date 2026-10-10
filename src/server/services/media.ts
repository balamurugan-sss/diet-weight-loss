import "server-only";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export type ImageRef = { id: string; kind: "ai_illustration" | "verified_photo"; status: "approved" | "generated" };

const visible = or(eq(schema.imageAssets.status, "approved"), eq(schema.imageAssets.status, "generated"));

/** Best image per recipe/step: curated (approved) beats generated, newest first. */
export async function imagesFor(recipeIds: string[], stepIndex?: number): Promise<Map<string, ImageRef>> {
  if (!recipeIds.length) return new Map();
  const rows = await db
    .select({
      id: schema.imageAssets.id,
      recipeId: schema.imageAssets.recipeId,
      stepIndex: schema.imageAssets.stepIndex,
      kind: schema.imageAssets.kind,
      status: schema.imageAssets.status,
    })
    .from(schema.imageAssets)
    .where(
      and(
        inArray(schema.imageAssets.recipeId, recipeIds),
        stepIndex === undefined ? undefined : eq(schema.imageAssets.stepIndex, stepIndex),
        visible,
      ),
    )
    .orderBy(desc(schema.imageAssets.createdAt));
  const out = new Map<string, ImageRef>();
  for (const r of rows) {
    const key = stepIndex === undefined ? `${r.recipeId}:${r.stepIndex}` : r.recipeId;
    const prev = out.get(key);
    if (!prev || (prev.status === "generated" && r.status === "approved"))
      out.set(key, { id: r.id, kind: r.kind, status: r.status as ImageRef["status"] });
  }
  return out;
}

export const heroImages = (recipeIds: string[]) => imagesFor(recipeIds, -1);
