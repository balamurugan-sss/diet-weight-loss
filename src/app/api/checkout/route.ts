import { NextResponse } from "next/server";
import Stripe from "stripe";

const PLAN_PRICES: Record<string, { amount: number; interval: "month" | "year"; label: string }> = {
  monthly: { amount: 999, interval: "month", label: "FitFusion AI Premium — Monthly" },
  yearly: { amount: 7999, interval: "year", label: "FitFusion AI Premium — Yearly" },
};

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Payments aren't configured in this environment. Add STRIPE_SECRET_KEY to enable checkout." },
      { status: 503 }
    );
  }

  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plan = PLAN_PRICES[body.plan ?? ""];
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  try {
    const stripe = new Stripe(secretKey);
    const origin = request.headers.get("origin") ?? new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: plan.amount,
            recurring: { interval: plan.interval },
            product_data: { name: plan.label },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/premium?status=success`,
      cancel_url: `${origin}/premium?status=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Could not start checkout session" }, { status: 502 });
  }
}
