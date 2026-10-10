import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/server/db/client";
import { readSession } from "./session";

export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  isGuest: boolean;
  plan: "free" | "premium";
  isPremium: boolean;
};
export type Profile = typeof schema.profiles.$inferSelect;

export const getCurrentUser = cache(async (): Promise<{ user: CurrentUser; profile: Profile | null } | null> => {
  const session = await readSession();
  if (!session) return null;
  const [row] = await db
    .select({ user: schema.users, profile: schema.profiles })
    .from(schema.users)
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .where(eq(schema.users.id, session.userId))
    .limit(1);
  if (!row) return null;
  const u = row.user;
  const isPremium = u.plan === "premium" && (!u.premiumUntil || u.premiumUntil.getTime() > Date.now());
  return {
    user: { id: u.id, email: u.email, displayName: u.displayName, isGuest: u.isGuest, plan: u.plan, isPremium },
    profile: row.profile,
  };
});

export async function requireUser() {
  const current = await getCurrentUser();
  if (!current) redirect("/");
  return current;
}

/** For app screens that need a completed health profile. */
export async function requireOnboarded() {
  const current = await requireUser();
  if (!current.profile?.onboardingCompletedAt) redirect("/onboarding");
  return current as { user: CurrentUser; profile: Profile };
}
