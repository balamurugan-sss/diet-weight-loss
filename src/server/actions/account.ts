"use server";

import { eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { requireUser } from "@/server/auth/dal";
import { SESSION_COOKIE } from "@/server/auth/session";
import { config } from "@/server/config";
import { db, schema } from "@/server/db/client";

/** Permanently deletes the account and every row that belongs to it. */
export async function deleteAccountAction(_prev: unknown, form: FormData) {
  const { user } = await requireUser();
  if (form.get("confirm") !== "DELETE") return { error: "profile.deleteConfirm" };
  if (config.stripe.secretKey) {
    const [row] = await db.select({ sub: schema.users.stripeSubscriptionId }).from(schema.users).where(eq(schema.users.id, user.id));
    if (row?.sub) await new Stripe(config.stripe.secretKey).subscriptions.cancel(row.sub).catch((e) => console.error("stripe cancel failed", e));
  }
  await db.transaction(async (tx) => {
    const plans = await tx.select({ id: schema.mealPlans.id }).from(schema.mealPlans).where(eq(schema.mealPlans.userId, user.id));
    const planIds = plans.map((p) => p.id);
    if (planIds.length) {
      await tx.delete(schema.shoppingState).where(inArray(schema.shoppingState.planId, planIds));
      await tx.delete(schema.mealPlanItems).where(inArray(schema.mealPlanItems.planId, planIds));
    }
    for (const table of [schema.mealPlans, schema.mealLogs, schema.weightLogs, schema.waterLogs, schema.favourites, schema.recentViews, schema.cookingSessions, schema.usageCounters, schema.sessions] as const)
      await tx.delete(table).where(eq(table.userId, user.id));
    await tx.update(schema.imageAssets).set({ createdBy: null }).where(eq(schema.imageAssets.createdBy, user.id));
    await tx.delete(schema.profiles).where(eq(schema.profiles.userId, user.id));
    await tx.delete(schema.users).where(eq(schema.users.id, user.id));
  });
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/?deleted=1");
}

export async function startCheckoutAction() {
  const { user } = await requireUser();
  if (!config.stripe.secretKey || !config.stripe.priceId) return { error: "sub.notConfigured" };
  const stripe = new Stripe(config.stripe.secretKey);
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
  let customer = row.stripeCustomerId;
  if (!customer) {
    customer = (await stripe.customers.create({ email: row.email ?? undefined, metadata: { userId: user.id } })).id;
    await db.update(schema.users).set({ stripeCustomerId: customer }).where(eq(schema.users.id, user.id));
  }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: config.stripe.priceId, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { userId: user.id },
    success_url: `${config.appUrl}/subscription?success=1`,
    cancel_url: `${config.appUrl}/subscription`,
  });
  redirect(session.url!);
}

export async function billingPortalAction() {
  const { user } = await requireUser();
  if (!config.stripe.secretKey) return { error: "sub.notConfigured" };
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
  if (!row.stripeCustomerId) return { error: "sub.notConfigured" };
  const portal = await new Stripe(config.stripe.secretKey).billingPortal.sessions.create({ customer: row.stripeCustomerId, return_url: `${config.appUrl}/subscription` });
  redirect(portal.url);
}

/** Development-only: lets you exercise Premium gating without a payment. */
export async function toggleDevPremiumAction() {
  const { user } = await requireUser();
  if (!config.allowDevPremium) return;
  await db.update(schema.users).set({ plan: user.isPremium ? "free" : "premium", premiumUntil: null }).where(eq(schema.users.id, user.id));
  redirect("/subscription");
}
