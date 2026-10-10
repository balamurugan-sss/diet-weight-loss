"use server";

import { revalidatePath } from "next/cache";
import { HealthImportInput } from "@/lib/health/types";
import { requireOnboarded } from "@/server/auth/dal";
import { ProviderError } from "@/server/config";
import { rateLimit } from "@/server/rateLimit";
import { disconnectGoogle, saveHealthImport, syncGoogle } from "@/server/services/health";
import { bodyWeight } from "@/server/services/workouts";

export type HealthResult = { ok: true; days: number; workouts: number } | { ok: false; error: string };

/** Saves daily totals parsed in the browser from an Apple Health or Fitbit export. */
export async function importHealthAction(input: unknown): Promise<HealthResult> {
  const parsed = HealthImportInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "health.importInvalid" };
  const { user, profile } = await requireOnboarded();
  if (!(await rateLimit(`health-import:${user.id}`, 10, 3600))) return { ok: false, error: "health.rateLimited" };
  const res = await saveHealthImport(user.id, parsed.data.source, parsed.data, await bodyWeight(user.id, profile));
  revalidatePath("/", "layout");
  return { ok: true, ...res };
}

export async function syncGoogleHealthAction(): Promise<HealthResult> {
  const { user, profile } = await requireOnboarded();
  if (!(await rateLimit(`health-sync:${user.id}`, 12, 3600))) return { ok: false, error: "health.rateLimited" };
  try {
    const res = await syncGoogle(user.id, await bodyWeight(user.id, profile));
    revalidatePath("/", "layout");
    return { ok: true, ...res };
  } catch (e) {
    return { ok: false, error: `health.google.${e instanceof ProviderError ? e.message : "sync_failed"}` };
  }
}

export async function disconnectGoogleHealthAction(): Promise<{ ok: true }> {
  const { user } = await requireOnboarded();
  await disconnectGoogle(user.id);
  revalidatePath("/health");
  return { ok: true };
}
