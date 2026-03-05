import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  _stripe = new Stripe(key);
  return _stripe;
}

// ── Token pack definitions ─────────────────────────────────
export const TOKEN_PACKS = [
  { id: "pack_100", tokens: 100, priceUsd: 100, label: "100 FT" },
  { id: "pack_600", tokens: 600, priceUsd: 500, label: "600 FT" },
  { id: "pack_1500", tokens: 1500, priceUsd: 1000, label: "1,500 FT" },
] as const;

// ── Promotion pricing ──────────────────────────────────────
export const PROMOTIONS = {
  skip_queue: { priceUsd: 500, label: "Skip Queue" },
  featured: { priceUsd: 1500, label: "Featured Placement (24h)" },
  priority_review: { priceUsd: 1000, label: "Priority Review" },
} as const;

// ── Subscription pricing ───────────────────────────────────
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || "";
