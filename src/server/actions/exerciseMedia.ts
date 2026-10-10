"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EXERCISE_BY_ID } from "@/lib/workouts/exercises";
import { requireAdmin } from "@/server/admin";
import { ProviderError } from "@/server/config";
import { refreshClip, reviewClip, startClip } from "@/server/services/exerciseMedia";

export type MediaResult = { ok: true; status?: string | null } | { ok: false; error: string };
const Id = z.string().uuid();

export async function generateClipAction(exerciseId: unknown): Promise<MediaResult> {
  await requireAdmin();
  const id = z.string().max(60).safeParse(exerciseId);
  if (!id.success || !EXERCISE_BY_ID.has(id.data)) return { ok: false, error: "common.error" };
  try {
    await startClip(id.data);
  } catch (e) {
    return { ok: false, error: `media.err.${e instanceof ProviderError ? e.message : "failed"}` };
  }
  revalidatePath("/admin/media");
  return { ok: true, status: "generating" };
}

export async function refreshClipAction(id: unknown): Promise<MediaResult> {
  await requireAdmin();
  const parsed = Id.safeParse(id);
  if (!parsed.success) return { ok: false, error: "common.error" };
  try {
    return { ok: true, status: await refreshClip(parsed.data) };
  } catch (e) {
    return { ok: false, error: `media.err.${e instanceof ProviderError ? e.message : "failed"}` };
  }
}

export async function reviewClipAction(id: unknown, decision: unknown): Promise<MediaResult> {
  await requireAdmin();
  const parsed = z.object({ id: Id, decision: z.enum(["approved", "rejected"]) }).safeParse({ id, decision });
  if (!parsed.success || !(await reviewClip(parsed.data.id, parsed.data.decision))) return { ok: false, error: "common.error" };
  revalidatePath("/", "layout");
  return { ok: true, status: parsed.data.decision };
}
