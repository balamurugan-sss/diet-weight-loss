import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { config } from "@/server/config";
import { db, schema } from "@/server/db/client";

async function setPlanForCustomer(customerId: string, active: boolean, subscriptionId: string | null) {
  await db
    .update(schema.users)
    .set({ plan: active ? "premium" : "free", stripeSubscriptionId: subscriptionId, premiumUntil: null })
    .where(eq(schema.users.stripeCustomerId, customerId));
}

export async function POST(req: Request) {
  if (!config.stripe.secretKey || !config.stripe.webhookSecret) return new Response("Not configured", { status: 503 });
  const stripe = new Stripe(config.stripe.secretKey);
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig ?? "", config.stripe.webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  // Idempotency: Stripe retries deliveries.
  const inserted = await db.insert(schema.stripeEvents).values({ id: event.id, type: event.type }).onConflictDoNothing().returning();
  if (!inserted.length) return new Response("ok");

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      const userId = s.client_reference_id ?? s.metadata?.userId;
      if (userId && typeof s.customer === "string")
        await db
          .update(schema.users)
          .set({ plan: "premium", stripeCustomerId: s.customer, stripeSubscriptionId: typeof s.subscription === "string" ? s.subscription : null })
          .where(eq(schema.users.id, userId));
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const active = event.type !== "customer.subscription.deleted" && ["active", "trialing", "past_due"].includes(sub.status);
      if (typeof sub.customer === "string") await setPlanForCustomer(sub.customer, active, active ? sub.id : null);
      break;
    }
  }
  return new Response("ok");
}
