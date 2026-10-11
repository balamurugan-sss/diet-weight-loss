import "server-only";
import { createHash } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import webpush from "web-push";
import { config } from "@/server/config";
import { db, schema } from "@/server/db/client";

export const pushConfigured = () => Boolean(config.push.publicKey && config.push.privateKey);
export const endpointId = (endpoint: string) => createHash("sha256").update(endpoint).digest("hex");

export type PushMessage = { title: string; body: string; url: string };

/**
 * Sends one notification to each subscription (10 at a time). Subscriptions
 * the push service reports as gone (404/410) are deleted. Returns how many
 * were accepted.
 */
export async function sendPush(subs: (typeof schema.pushSubscriptions.$inferSelect)[], msg: PushMessage): Promise<number> {
  if (!pushConfigured() || subs.length === 0) return 0;
  webpush.setVapidDetails(config.push.subject, config.push.publicKey!, config.push.privateKey!);
  const payload = JSON.stringify(msg);
  const gone: string[] = [];
  let sent = 0;
  for (let i = 0; i < subs.length; i += 10) {
    await Promise.all(
      subs.slice(i, i + 10).map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 });
          sent++;
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) gone.push(s.id);
          else console.error("[push] send failed", status ?? (e instanceof Error ? e.message : e));
        }
      }),
    );
  }
  if (gone.length) await db.delete(schema.pushSubscriptions).where(inArray(schema.pushSubscriptions.id, gone));
  return sent;
}

export async function pushDevices(userId: string) {
  return db.select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, userId));
}
