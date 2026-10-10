"use server";

import { revalidatePath } from "next/cache";
import { requireOnboarded } from "@/server/auth/dal";
import { createShareLink, revokeShareLinks } from "@/server/services/share";

export async function createShareLinkAction(): Promise<{ ok: true; token: string }> {
  const { user } = await requireOnboarded();
  const link = await createShareLink(user.id);
  revalidatePath("/workouts");
  return { ok: true, token: link.token };
}

export async function revokeShareLinkAction(): Promise<{ ok: true }> {
  const { user } = await requireOnboarded();
  await revokeShareLinks(user.id);
  revalidatePath("/workouts");
  return { ok: true };
}
