import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Check, X, Crown } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const FEATURES = [
  { label: "Daily predictions", free: "10/day", pro: "Unlimited" },
  { label: "Factory Metrics", free: true, pro: true },
  { label: "Leaderboards", free: true, pro: true },
  { label: "Detailed analytics", free: false, pro: true },
  { label: "Pro badge", free: false, pro: true },
  { label: "Early access", free: false, pro: true },
  { label: "Priority support", free: false, pro: true },
];

export default function SubscriptionPage() {
  useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const subQuery = trpc.stripe.getSubscription.useQuery();
  const checkout = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data && "url" in data && data.url) {
        window.location.href = data.url;
      } else if (data && "error" in data) {
        toast.error(data.error as string);
      }
    },
    onError: () => toast.error("Failed to start checkout"),
  });

  const currentPlan = subQuery.data?.plan || "free";
  const isPro = currentPlan === "pro";

  return (
    <div className="min-h-screen" style={{ background: "var(--ff-bg-primary)" }}>
      <header
        className="sticky top-0 z-50 backdrop-blur-sm"
        style={{
          background: "var(--ff-bg-primary)",
          borderBottom: "1px solid var(--ff-gray-800)",
        }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/profile")}>
            <span style={{ color: "var(--ff-text-secondary)" }}>&#8592;</span>
          </button>
          <h1
            className="font-primary text-lg tracking-wider"
            style={{ color: "var(--ff-primary)" }}
          >
            FF PRO
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {isPro && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl"
            style={{
              background: "rgba(255, 215, 0, 0.1)",
              border: "1px solid rgba(255, 215, 0, 0.3)",
            }}
          >
            <Crown className="w-5 h-5" style={{ color: "#FFD700" }} />
            <span className="font-primary text-sm" style={{ color: "#FFD700" }}>
              You're a Pro member!
            </span>
          </div>
        )}

        {/* Comparison table */}
        <div className="grid grid-cols-3 gap-0">
          {/* Header */}
          <div className="p-3" />
          <div
            className="p-3 text-center rounded-t-xl"
            style={{ background: "var(--ff-bg-tertiary)", border: "1px solid var(--ff-gray-700)" }}
          >
            <span className="font-primary text-xs tracking-wider text-white">FREE</span>
          </div>
          <div
            className="p-3 text-center rounded-t-xl"
            style={{
              background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,109,0,0.15))",
              border: "1px solid rgba(255, 215, 0, 0.3)",
            }}
          >
            <span className="font-primary text-xs tracking-wider" style={{ color: "#FFD700" }}>
              PRO
            </span>
          </div>

          {/* Features */}
          {FEATURES.map((f, i) => (
            <>
              <div
                key={`label-${i}`}
                className="px-3 py-2.5 font-secondary text-xs text-white"
                style={{ borderBottom: "1px solid var(--ff-gray-800)" }}
              >
                {f.label}
              </div>
              <div
                key={`free-${i}`}
                className="px-3 py-2.5 text-center"
                style={{
                  background: "var(--ff-bg-tertiary)",
                  borderBottom: "1px solid var(--ff-gray-700)",
                  borderLeft: "1px solid var(--ff-gray-700)",
                  borderRight: "1px solid var(--ff-gray-700)",
                }}
              >
                {typeof f.free === "string" ? (
                  <span className="font-secondary text-xs" style={{ color: "var(--ff-text-secondary)" }}>
                    {f.free}
                  </span>
                ) : f.free ? (
                  <Check className="w-4 h-4 mx-auto" style={{ color: "#32CD32" }} />
                ) : (
                  <X className="w-4 h-4 mx-auto" style={{ color: "var(--ff-gray-600)" }} />
                )}
              </div>
              <div
                key={`pro-${i}`}
                className="px-3 py-2.5 text-center"
                style={{
                  background: "rgba(255,215,0,0.05)",
                  borderBottom: "1px solid rgba(255, 215, 0, 0.15)",
                  borderLeft: "1px solid rgba(255, 215, 0, 0.15)",
                  borderRight: "1px solid rgba(255, 215, 0, 0.15)",
                }}
              >
                {typeof f.pro === "string" ? (
                  <span className="font-secondary text-xs" style={{ color: "#FFD700" }}>
                    {f.pro}
                  </span>
                ) : (
                  <Check className="w-4 h-4 mx-auto" style={{ color: "#FFD700" }} />
                )}
              </div>
            </>
          ))}
        </div>

        {/* CTA */}
        {!isPro && (
          <div className="text-center space-y-3">
            <div
              className="font-primary text-3xl tracking-wider"
              style={{ color: "#FFD700" }}
            >
              $7.99<span className="text-sm">/mo</span>
            </div>
            <Button
              onClick={() => checkout.mutate({ type: "subscription" })}
              disabled={checkout.isPending}
              className="w-full font-primary tracking-wider text-black text-lg py-6"
              style={{
                background: "linear-gradient(135deg, #FFD700, #FF6D00)",
              }}
            >
              {checkout.isPending ? "..." : "UPGRADE TO PRO"}
            </Button>
            <p
              className="font-secondary text-xs"
              style={{ color: "var(--ff-text-secondary)" }}
            >
              Cancel anytime. Billed monthly via Stripe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
