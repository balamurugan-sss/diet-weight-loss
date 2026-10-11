import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { and, count, desc, eq, gt, gte, isNull, like, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { premiumEnd } from "@/lib/admin/rules";
import { db, schema } from "@/server/db/client";

const { users, profiles } = schema;
const DAY = 86_400_000;
export const PAGE_SIZE = 25;

/** Premium in force right now (the same rule as the session's isPremium). */
const premiumNow = () => and(eq(users.plan, "premium"), or(isNull(users.premiumUntil), gt(users.premiumUntil, new Date())));

export type UserFilter = "all" | "premium" | "free" | "new" | "inactive";

const filterWhere = (f: UserFilter): SQL | undefined =>
  f === "premium"
    ? premiumNow()
    : f === "free"
      ? or(ne(users.plan, "premium"), lt(users.premiumUntil, new Date()))
      : f === "new"
        ? gte(users.createdAt, new Date(Date.now() - 7 * DAY))
        : f === "inactive"
          ? or(isNull(users.lastActiveAt), lt(users.lastActiveAt, new Date(Date.now() - 14 * DAY)))
          : undefined;

/** Account list for the admin: search by email or first name, newest first. */
export async function listUsers({ q, filter, page }: { q: string; filter: UserFilter; page: number }) {
  const term = q.trim().toLowerCase().slice(0, 100);
  const where = and(
    eq(users.isGuest, false),
    term ? or(like(users.email, `%${term}%`), like(sql`lower(${users.displayName})`, `%${term}%`)) : undefined,
    filterWhere(filter),
  );
  const [rows, [{ n }]] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        plan: users.plan,
        premiumUntil: users.premiumUntil,
        createdAt: users.createdAt,
        lastActiveAt: users.lastActiveAt,
        onboarded: profiles.onboardingCompletedAt,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset(Math.max(0, page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(users).where(where),
  ]);
  return { rows: rows.map((r) => ({ ...r, isPremium: isPremium(r) })), total: n };
}

export const isPremium = (u: { plan: string; premiumUntil: Date | null }) => u.plan === "premium" && (!u.premiumUntil || u.premiumUntil.getTime() > Date.now());

export async function adminStats() {
  const week = new Date(Date.now() - 7 * DAY);
  const one = async (where: SQL | undefined) => (await db.select({ n: count() }).from(users).where(and(eq(users.isGuest, false), where)))[0].n;
  const [total, premium, active, fresh, emailOptIn, [{ n: devices }]] = await Promise.all([
    one(undefined),
    one(premiumNow()),
    one(gte(users.lastActiveAt, week)),
    one(gte(users.createdAt, week)),
    one(eq(users.marketingEmail, true)),
    db.select({ n: sql<number>`count(distinct ${schema.pushSubscriptions.userId})` }).from(schema.pushSubscriptions),
  ]);
  return { total, premium, active, fresh, emailOptIn, pushUsers: Number(devices) };
}

/**
 * What an admin needs to help someone: account status, setup progress and
 * recent activity counts. Health readings, weights and food details are
 * deliberately not shown.
 */
export async function userDetail(id: string) {
  const [row] = await db.select({ user: users, profile: profiles }).from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.id, id)).limit(1);
  if (!row || row.user.isGuest) return null;
  const month = new Date(Date.now() - 30 * DAY);
  const [[program], [{ workouts }], [{ meals }], [{ devices }], [{ logins }], health, actions] = await Promise.all([
    db
      .select({ name: schema.workoutPrograms.name })
      .from(schema.workoutPrograms)
      .where(and(eq(schema.workoutPrograms.userId, id), eq(schema.workoutPrograms.status, "active")))
      .limit(1),
    db
      .select({ workouts: count() })
      .from(schema.workoutSessions)
      .where(and(eq(schema.workoutSessions.userId, id), eq(schema.workoutSessions.status, "completed"), gte(schema.workoutSessions.startedAt, month))),
    db.select({ meals: count() }).from(schema.mealLogs).where(and(eq(schema.mealLogs.userId, id), gte(schema.mealLogs.createdAt, month))),
    db.select({ devices: count() }).from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, id)),
    db.select({ logins: count() }).from(schema.sessions).where(and(eq(schema.sessions.userId, id), gt(schema.sessions.expiresAt, new Date()))),
    db.select({ provider: schema.healthConnections.provider }).from(schema.healthConnections).where(eq(schema.healthConnections.userId, id)),
    db.select().from(schema.adminActions).where(eq(schema.adminActions.targetUserId, id)).orderBy(desc(schema.adminActions.createdAt)).limit(10),
  ]);
  const u = row.user;
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    plan: u.plan,
    premiumUntil: u.premiumUntil,
    isPremium: isPremium(u),
    paidViaStripe: Boolean(u.stripeSubscriptionId),
    marketingEmail: u.marketingEmail,
    createdAt: u.createdAt,
    lastActiveAt: u.lastActiveAt,
    language: row.profile?.language ?? "en",
    onboarded: Boolean(row.profile?.onboardingCompletedAt),
    program: program?.name ?? null,
    workouts30: workouts,
    meals30: meals,
    pushDevices: devices,
    signedIn: logins,
    health: health.map((h) => h.provider),
    actions,
  };
}

export async function logAdmin(adminEmail: string, action: string, targetUserId: string | null, detail?: string) {
  await db.insert(schema.adminActions).values({ id: randomUUID(), adminEmail, action, targetUserId, detail: detail ?? null });
}

export async function grantPremium(userId: string, months: number | null) {
  const [u] = await db.select({ plan: users.plan, premiumUntil: users.premiumUntil }).from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return null;
  const until = premiumEnd(u.premiumUntil, isPremium(u), months);
  await db.update(users).set({ plan: "premium", premiumUntil: until }).where(eq(users.id, userId));
  return until;
}

export async function revokePremium(userId: string) {
  await db.update(users).set({ plan: "free", premiumUntil: null }).where(eq(users.id, userId));
}

export async function listInvites() {
  return db.select().from(schema.premiumInvites).orderBy(desc(schema.premiumInvites.createdAt));
}

/** At sign-up: turns a pending admin grant for this email into premium. */
export async function applyPremiumInvite(userId: string, email: string) {
  const [invite] = await db.select().from(schema.premiumInvites).where(eq(schema.premiumInvites.email, email)).limit(1);
  if (!invite) return;
  await grantPremium(userId, invite.months);
  await db.delete(schema.premiumInvites).where(eq(schema.premiumInvites.email, email));
  await logAdmin(invite.grantedBy, "premium.invite_applied", userId, invite.months == null ? "no end date" : `${invite.months} months`);
}

/** A per-user token for unsubscribe links, created the first time it's needed. */
export async function unsubscribeToken(userId: string, existing: string | null) {
  if (existing) return existing;
  const token = randomBytes(24).toString("base64url");
  await db.update(users).set({ unsubscribeToken: token }).where(eq(users.id, userId));
  return token;
}
