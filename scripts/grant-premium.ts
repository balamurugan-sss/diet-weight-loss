/**
 * Gives premium by email from the command line (same rules as Admin → Overview):
 *   npx tsx scripts/grant-premium.ts <email> [months|none]
 * An existing account becomes premium now; otherwise premium starts when that
 * email signs up. Uses DATABASE_URL, so it works against production too.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  const arg = process.argv[3] ?? "none";
  const months = arg === "none" ? null : Number(arg);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || (months != null && !(months >= 1 && months <= 120))) {
    console.error("usage: tsx scripts/grant-premium.ts <email> [months|none]");
    process.exit(1);
  }
  const until = months == null ? null : new Date(new Date().setMonth(new Date().getMonth() + months));
  const [u] = await db.select({ id: schema.users.id, isGuest: schema.users.isGuest }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (u && !u.isGuest) {
    await db.update(schema.users).set({ plan: "premium", premiumUntil: until }).where(eq(schema.users.id, u.id));
    await db.insert(schema.adminActions).values({ id: randomUUID(), adminEmail: "cli", action: "premium.grant", targetUserId: u.id, detail: months == null ? "no end date" : `${months} months` });
    console.log("Account found: premium is on now.");
  } else {
    await db
      .insert(schema.premiumInvites)
      .values({ email, months, grantedBy: "cli" })
      .onConflictDoUpdate({ target: schema.premiumInvites.email, set: { months, grantedBy: "cli", createdAt: new Date() } });
    console.log("No account yet: premium will start when this email signs up.");
  }
}

main().then(() => process.exit(0));
