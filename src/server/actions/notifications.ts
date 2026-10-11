"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboarded } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";
import { endpointId } from "@/server/push";
import { rateLimit } from "@/server/rateLimit";

type Result = { ok: true } | { ok: false; error: string };

const Subscription = z.object({
  endpoint: z.string().url().max(1000).startsWith("https://"),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

/** Saves this device's push subscription (after the browser asked permission). */
export async function savePushSubscriptionAction(input: unknown): Promise<Result> {
  const parsed = Subscription.safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };
  const { user } = await requireOnboarded();
  if (!(await rateLimit(`push-sub:${user.id}`, 20, 3600))) return { ok: false, error: "auth.rateLimited" };
  const { endpoint, keys } = parsed.data;
  await db
    .insert(schema.pushSubscriptions)
    .values({ id: endpointId(endpoint), userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth })
    .onConflictDoUpdate({ target: schema.pushSubscriptions.id, set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth } });
  return { ok: true };
}

export async function removePushSubscriptionAction(endpoint: unknown): Promise<Result> {
  const e = z.string().max(1000).safeParse(endpoint);
  if (!e.success) return { ok: false, error: "common.error" };
  const { user } = await requireOnboarded();
  await db.delete(schema.pushSubscriptions).where(and(eq(schema.pushSubscriptions.id, endpointId(e.data)), eq(schema.pushSubscriptions.userId, user.id)));
  return { ok: true };
}

export async function setMarketingEmailAction(on: unknown): Promise<Result> {
  if (typeof on !== "boolean") return { ok: false, error: "common.error" };
  const { user } = await requireOnboarded();
  await db.update(schema.users).set({ marketingEmail: on }).where(eq(schema.users.id, user.id));
  revalidatePath("/settings/app");
  return { ok: true };
}

export async function dismissAnnouncementAction(id: unknown): Promise<Result> {
  const parsed = z.string().min(1).max(64).safeParse(id);
  if (!parsed.success) return { ok: false, error: "common.error" };
  const { user } = await requireOnboarded();
  const [exists] = await db.select({ id: schema.announcements.id }).from(schema.announcements).where(eq(schema.announcements.id, parsed.data)).limit(1);
  if (exists) await db.insert(schema.announcementDismissals).values({ userId: user.id, announcementId: exists.id }).onConflictDoNothing();
  revalidatePath("/home");
  return { ok: true };
}

/** From the link in a marketing email; works without logging in. */
export async function unsubscribeAction(token: unknown): Promise<Result> {
  const t = z.string().min(10).max(100).safeParse(token);
  if (!t.success) return { ok: false, error: "common.error" };
  const res = await db.update(schema.users).set({ marketingEmail: false }).where(eq(schema.users.unsubscribeToken, t.data));
  return res.rowsAffected ? { ok: true } : { ok: false, error: "unsub.bad" };
}
