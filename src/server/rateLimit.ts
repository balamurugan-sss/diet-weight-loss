import "server-only";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db, schema } from "@/server/db/client";

/** Fixed-window limiter persisted in the database so it survives restarts. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSec);
  const [row] = await db
    .insert(schema.rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: schema.rateLimits.key,
      set: {
        count: sql`CASE WHEN ${schema.rateLimits.windowStart} = ${windowStart} THEN ${schema.rateLimits.count} + 1 ELSE 1 END`,
        windowStart,
      },
    })
    .returning({ count: schema.rateLimits.count });
  return (row?.count ?? 1) <= limit;
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function resetRateLimit(key: string) {
  await db.delete(schema.rateLimits).where(eq(schema.rateLimits.key, key));
}
