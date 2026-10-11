import "server-only";
import { and, count, desc, eq, gt, gte, inArray, isNull, notExists, or, sql, type SQL } from "drizzle-orm";
import { config } from "@/server/config";
import { db, schema } from "@/server/db/client";
import { escapeHtml, sendEmails, type Mail } from "@/server/email";
import { sendPush } from "@/server/push";
import { unsubscribeToken } from "./admin";

const { users, announcements: ann } = schema;
export type Audience = "all" | "free" | "premium";
export type Announcement = typeof ann.$inferSelect;

/** In-app messages stay up for this long (or until dismissed). */
export const IN_APP_DAYS = 14;

const premiumNow = () => and(eq(users.plan, "premium"), or(isNull(users.premiumUntil), gt(users.premiumUntil, new Date())));
const audienceWhere = (a: Audience): SQL | undefined =>
  a === "premium" ? premiumNow() : a === "free" ? sql`not (${premiumNow()})` : undefined;

/** Who each audience reaches, per channel, for the compose screen. */
export async function audienceCounts() {
  const out = {} as Record<Audience, { users: number; push: number; email: number }>;
  for (const a of ["all", "free", "premium"] as const) {
    const base = and(eq(users.isGuest, false), audienceWhere(a));
    const [[{ n }], [{ e }], [{ p }]] = await Promise.all([
      db.select({ n: count() }).from(users).where(base),
      db.select({ e: count() }).from(users).where(and(base, eq(users.marketingEmail, true))),
      db.select({ p: count() }).from(schema.pushSubscriptions).innerJoin(users, eq(users.id, schema.pushSubscriptions.userId)).where(base),
    ]);
    out[a] = { users: n, push: p, email: e };
  }
  return out;
}

export async function listAnnouncements() {
  return db.select().from(ann).orderBy(desc(ann.createdAt)).limit(50);
}

/** Sends a saved announcement by push and/or email and records how many went out. */
export async function deliver(a: Announcement) {
  const base = and(eq(users.isGuest, false), audienceWhere(a.audience));
  const url = a.link ?? "/home";
  let pushSent = 0;
  let emailSent = 0;
  if (a.push) {
    const subs = await db
      .select({ sub: schema.pushSubscriptions })
      .from(schema.pushSubscriptions)
      .innerJoin(users, eq(users.id, schema.pushSubscriptions.userId))
      .where(base);
    pushSent = await sendPush(
      subs.map((s) => s.sub),
      { title: a.title, body: a.body, url },
    );
  }
  if (a.email) {
    const people = await db
      .select({ id: users.id, email: users.email, token: users.unsubscribeToken })
      .from(users)
      .where(and(base, eq(users.marketingEmail, true)));
    const href = url.startsWith("/") ? `${config.appUrl}${url}` : url;
    const mails: Mail[] = [];
    for (const p of people) {
      if (!p.email) continue;
      const tok = encodeURIComponent(await unsubscribeToken(p.id, p.token));
      const unsub = `${config.appUrl}/unsubscribe?t=${tok}`;
      mails.push({
        to: p.email,
        subject: a.title,
        text: `${a.body}\n\n${href}\n\n—\nYou get these because you turned on offers and news from Movewell. Unsubscribe: ${unsub}`,
        html: `<h2 style="margin:0 0 8px">${escapeHtml(a.title)}</h2><p>${escapeHtml(a.body)}</p><p><a href="${escapeHtml(href)}">Open Movewell</a></p><hr><p style="color:#666;font-size:12px">You get these because you turned on offers and news from Movewell. <a href="${escapeHtml(unsub)}">Unsubscribe</a></p>`,
        headers: { "List-Unsubscribe": `<${config.appUrl}/api/unsubscribe?t=${tok}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
    }
    emailSent = await sendEmails(mails);
  }
  await db.update(ann).set({ pushSent, emailSent }).where(eq(ann.id, a.id));
}

/** The newest in-app message for this person that they haven't dismissed. */
export async function currentAnnouncement(userId: string, premium: boolean): Promise<Announcement | null> {
  const since = new Date(Date.now() - IN_APP_DAYS * 86_400_000);
  const [row] = await db
    .select()
    .from(ann)
    .where(
      and(
        eq(ann.inApp, true),
        gte(ann.createdAt, since),
        inArray(ann.audience, premium ? ["all", "premium"] : ["all", "free"]),
        notExists(
          db
            .select({ x: sql`1` })
            .from(schema.announcementDismissals)
            .where(and(eq(schema.announcementDismissals.announcementId, ann.id), eq(schema.announcementDismissals.userId, userId))),
        ),
      ),
    )
    .orderBy(desc(ann.createdAt))
    .limit(1);
  return row ?? null;
}
