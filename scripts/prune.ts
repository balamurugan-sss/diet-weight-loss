/**
 * Housekeeping (run daily via cron): removes expired sessions, stale rate-limit
 * windows, and guest accounts with no activity for 90 days.
 */
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

async function main() {
  const now = Date.now();
  const sessions = await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date(now)));
  const limits = await db.delete(schema.rateLimits).where(lt(schema.rateLimits.windowStart, Math.floor(now / 1000) - 86400));
  const cutoff = new Date(now - 90 * 86400000);
  const stale = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.isGuest, true), or(isNull(schema.users.lastActiveAt), lt(schema.users.lastActiveAt, cutoff)), lt(schema.users.createdAt, cutoff)));
  for (const { id } of stale) {
    await db.update(schema.imageAssets).set({ createdBy: null }).where(eq(schema.imageAssets.createdBy, id));
    await db.delete(schema.users).where(eq(schema.users.id, id)); // child rows cascade
  }
  console.log(`pruned ${sessions.rowsAffected} sessions, ${limits.rowsAffected} rate-limit rows, ${stale.length} stale guests`);
}

main().then(() => process.exit(0));
