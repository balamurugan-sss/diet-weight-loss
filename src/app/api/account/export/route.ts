import { eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/server/auth/dal";
import { db, schema } from "@/server/db/client";

/** Everything we store about the signed-in user, as a downloadable JSON file. */
export async function GET() {
  const current = await getCurrentUser();
  if (!current) return new Response("Unauthorized", { status: 401 });
  const id = current.user.id;
  const [user] = await db
    .select({ id: schema.users.id, email: schema.users.email, displayName: schema.users.displayName, plan: schema.users.plan, createdAt: schema.users.createdAt })
    .from(schema.users)
    .where(eq(schema.users.id, id));
  const plans = await db.select().from(schema.mealPlans).where(eq(schema.mealPlans.userId, id));
  const workoutSessions = await db.select().from(schema.workoutSessions).where(eq(schema.workoutSessions.userId, id));
  const data = {
    exportedAt: new Date().toISOString(),
    user,
    profile: current.profile,
    mealPlans: plans,
    mealPlanItems: plans.length ? await db.select().from(schema.mealPlanItems).where(inArray(schema.mealPlanItems.planId, plans.map((p) => p.id))) : [],
    mealLogs: await db.select().from(schema.mealLogs).where(eq(schema.mealLogs.userId, id)),
    weightLogs: await db.select().from(schema.weightLogs).where(eq(schema.weightLogs.userId, id)),
    waterLogs: await db.select().from(schema.waterLogs).where(eq(schema.waterLogs.userId, id)),
    favourites: await db.select().from(schema.favourites).where(eq(schema.favourites.userId, id)),
    cookingSessions: await db.select().from(schema.cookingSessions).where(eq(schema.cookingSessions.userId, id)),
    workoutProfile: (await db.select().from(schema.workoutProfiles).where(eq(schema.workoutProfiles.userId, id)))[0] ?? null,
    workoutPrograms: await db.select().from(schema.workoutPrograms).where(eq(schema.workoutPrograms.userId, id)),
    workoutSessions,
    cardioLogs: await db.select().from(schema.cardioLogs).where(eq(schema.cardioLogs.userId, id)),
    healthDays: await db.select().from(schema.healthDays).where(eq(schema.healthDays.userId, id)),
    // Connection metadata only — OAuth tokens are secrets and never exported.
    healthConnections: await db
      .select({ provider: schema.healthConnections.provider, scope: schema.healthConnections.scope, connectedAt: schema.healthConnections.connectedAt, lastSyncAt: schema.healthConnections.lastSyncAt })
      .from(schema.healthConnections)
      .where(eq(schema.healthConnections.userId, id)),
    workoutSets: workoutSessions.length
      ? await db.select().from(schema.workoutSets).where(inArray(schema.workoutSets.sessionId, workoutSessions.map((s) => s.id)))
      : [],
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="thali-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
