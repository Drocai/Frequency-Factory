import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import * as db from "../../server/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export const config = { api: { bodyParser: false } };

async function buffer(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as any) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = await buffer(req);
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const userId = Number(metadata.userId);

        if (!userId) break;

        if (session.customer) {
          await db.setUserStripeCustomerId(userId, session.customer as string);
        }

        if (session.id) {
          await db.updatePaymentStatus(session.id, "completed");
        }

        if (metadata.type === "token_pack") {
          const tokens = Number(metadata.tokens);
          if (tokens > 0) {
            await db.awardTokens(userId, tokens, "referral", `Purchased ${tokens} FT token pack`);
          }
        } else if (metadata.type === "promotion") {
          const subId = Number(metadata.submissionId);
          if (metadata.promotionType === "skip_queue" && subId) {
            await db.updateSubmissionQueuePosition(subId, 1);
          } else if (metadata.promotionType === "featured" && subId) {
            await db.setSubmissionFeatured(subId, 24);
          } else if (metadata.promotionType === "priority_review" && subId) {
            await db.setSubmissionPriorityReview(subId);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const user = await db.getUserByStripeCustomerId(customerId);
        if (!user) break;

        const isActive = sub.status === "active" || sub.status === "trialing";
        await db.updateSubscriptionPlan(user.id, isActive ? "pro" : "free");
        await db.upsertSubscription({
          userId: user.id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          plan: isActive ? "pro" : "free",
          status: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : sub.status === "trialing" ? "trialing" : "canceled",
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const user = await db.getUserByStripeCustomerId(customerId);
        if (!user) break;

        await db.updateSubscriptionPlan(user.id, "free");
        await db.upsertSubscription({
          userId: user.id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          plan: "free",
          status: "canceled",
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const user = await db.getUserByStripeCustomerId(customerId);
        if (user) {
          await db.updateSubscriptionPlan(user.id, "free");
        }
        break;
      }
    }
  } catch (err) {
    console.error("[Stripe Webhook] Error processing event:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }

  return res.status(200).json({ received: true });
}
