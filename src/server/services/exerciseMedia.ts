import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { cache } from "react";
import { exerciseVideoPrompt } from "@/lib/media/veo";
import { getExercise } from "@/lib/workouts/exercises";
import { ProviderError } from "@/server/config";
import { db, schema } from "@/server/db/client";
import { checkVideo, downloadVideo, startVideo, veoModel } from "@/server/providers/veo";

const DAILY_LIMIT = () => Number(process.env.VEO_DAILY_LIMIT || 20);
const MAX_RUNNING = 4;

const meta = {
  id: schema.exerciseMedia.id,
  exerciseId: schema.exerciseMedia.exerciseId,
  status: schema.exerciseMedia.status,
  model: schema.exerciseMedia.model,
  bytes: schema.exerciseMedia.bytes,
  error: schema.exerciseMedia.error,
  createdAt: schema.exerciseMedia.createdAt,
};

/** Latest clip (any status) per exercise, without the video bytes. */
export async function mediaOverview() {
  const rows = await db.select(meta).from(schema.exerciseMedia).orderBy(desc(schema.exerciseMedia.createdAt));
  const latest = new Map<string, (typeof rows)[number]>();
  const approved = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    if (!latest.has(r.exerciseId)) latest.set(r.exerciseId, r);
    if (r.status === "approved" && !approved.has(r.exerciseId)) approved.set(r.exerciseId, r);
  }
  return { latest, approved };
}

/** exerciseId → URL of its approved clip, for the pages that show demos. */
export const approvedVideos = cache(async (exerciseIds?: string[]) => {
  const rows = await db
    .select({ id: schema.exerciseMedia.id, exerciseId: schema.exerciseMedia.exerciseId })
    .from(schema.exerciseMedia)
    .where(and(eq(schema.exerciseMedia.status, "approved"), exerciseIds?.length ? inArray(schema.exerciseMedia.exerciseId, exerciseIds) : undefined))
    .orderBy(desc(schema.exerciseMedia.reviewedAt));
  const out: Record<string, string> = {};
  for (const r of rows) out[r.exerciseId] ??= `/api/media/exercise/${r.id}`;
  return out;
});

export async function startClip(exerciseId: string) {
  const ex = getExercise(exerciseId);
  const since = new Date(Date.now() - 86400000);
  const [{ today }] = await db.select({ today: sql<number>`count(*)` }).from(schema.exerciseMedia).where(gte(schema.exerciseMedia.createdAt, since));
  if (today >= DAILY_LIMIT()) throw new ProviderError("daily_limit", 429);
  const [{ running }] = await db.select({ running: sql<number>`count(*)` }).from(schema.exerciseMedia).where(eq(schema.exerciseMedia.status, "generating"));
  if (running >= MAX_RUNNING) throw new ProviderError("busy", 429);
  const prompt = exerciseVideoPrompt(ex);
  const id = randomUUID();
  const operation = await startVideo(prompt);
  await db.insert(schema.exerciseMedia).values({ id, exerciseId, status: "generating", provider: "google-veo", model: veoModel(), prompt, operation });
  return id;
}

/** Polls a generating clip and stores it when done. Safe to call repeatedly. */
export async function refreshClip(id: string) {
  const [row] = await db.select().from(schema.exerciseMedia).where(eq(schema.exerciseMedia.id, id));
  if (!row || row.status !== "generating" || !row.operation) return row?.status ?? null;
  const state = await checkVideo(row.operation);
  if (!state.done) return "generating";
  if ("error" in state) {
    await db.update(schema.exerciseMedia).set({ status: "failed", error: state.error.slice(0, 300) }).where(eq(schema.exerciseMedia.id, id));
    return "failed";
  }
  const video = await downloadVideo(state.uri);
  await db.update(schema.exerciseMedia).set({ status: "ready", data: video.data, mime: video.mime, bytes: video.data.length }).where(eq(schema.exerciseMedia.id, id));
  return "ready";
}

export async function reviewClip(id: string, decision: "approved" | "rejected") {
  const [row] = await db.select(meta).from(schema.exerciseMedia).where(eq(schema.exerciseMedia.id, id));
  if (!row || (row.status !== "ready" && row.status !== "approved")) return false;
  if (decision === "approved") {
    // One live clip per exercise: earlier approvals step back to "ready".
    await db
      .update(schema.exerciseMedia)
      .set({ status: "ready" })
      .where(and(eq(schema.exerciseMedia.exerciseId, row.exerciseId), eq(schema.exerciseMedia.status, "approved"), ne(schema.exerciseMedia.id, id)));
  }
  await db.update(schema.exerciseMedia).set({ status: decision, reviewedAt: new Date() }).where(eq(schema.exerciseMedia.id, id));
  return true;
}

export async function clipBlob(id: string) {
  const [row] = await db
    .select({ status: schema.exerciseMedia.status, data: schema.exerciseMedia.data, mime: schema.exerciseMedia.mime })
    .from(schema.exerciseMedia)
    .where(eq(schema.exerciseMedia.id, id));
  return row ?? null;
}
