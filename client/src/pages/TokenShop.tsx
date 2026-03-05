import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { Coins, Zap, Crown } from "lucide-react";
import { toast } from "sonner";

const TOKEN_PACKS = [
  { id: "pack_100", tokens: 100, price: "$1", color: "#1E90FF", icon: Coins },
  { id: "pack_600", tokens: 600, price: "$5", color: "#FF4500", icon: Zap, popular: true },
  { id: "pack_1500", tokens: 1500, price: "$10", color: "#FFD700", icon: Crown },
];

export default function TokenShop() {
  useAuth({ redirectOnUnauthenticated: true });

  const profileQuery = trpc.user.getProfile.useQuery();
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

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--ff-bg-primary)" }}>
      <header
        className="sticky top-0 z-50 backdrop-blur-sm"
        style={{
          background: "var(--ff-bg-primary)",
          borderBottom: "1px solid var(--ff-gray-800)",
        }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1
            className="font-primary text-lg tracking-wider"
            style={{ color: "var(--ff-primary)" }}
          >
            TOKEN SHOP
          </h1>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: "var(--ff-bg-tertiary)",
              border: "1px solid var(--ff-gray-600)",
            }}
          >
            <Coins className="w-4 h-4" style={{ color: "var(--ff-token-gold)" }} />
            <span
              className="font-primary text-sm"
              style={{ color: "var(--ff-token-gold)" }}
            >
              {profileQuery.data?.tokenBalance ?? 0} FT
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        <div className="text-center">
          <h2
            className="font-primary text-xl tracking-wider"
            style={{ color: "var(--ff-primary)" }}
          >
            GET MORE FREQUENCY TOKENS
          </h2>
          <p
            className="font-secondary text-sm mt-2"
            style={{ color: "var(--ff-text-secondary)" }}
          >
            Skip the queue, tip artists, and unlock perks
          </p>
        </div>

        <div className="space-y-4">
          {TOKEN_PACKS.map((pack) => {
            const Icon = pack.icon;
            return (
              <div
                key={pack.id}
                className="relative p-5 rounded-xl"
                style={{
                  background: "var(--ff-bg-tertiary)",
                  border: pack.popular
                    ? `2px solid ${pack.color}`
                    : "1px solid var(--ff-gray-700)",
                  boxShadow: pack.popular
                    ? `0 0 20px ${pack.color}30`
                    : "none",
                }}
              >
                {pack.popular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full font-primary text-xs tracking-wider text-black"
                    style={{ background: pack.color }}
                  >
                    MOST POPULAR
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: `${pack.color}20`, border: `1px solid ${pack.color}40` }}
                    >
                      <Icon className="w-7 h-7" style={{ color: pack.color }} />
                    </div>
                    <div>
                      <div className="font-primary text-xl text-white">
                        {pack.tokens.toLocaleString()} FT
                      </div>
                      <div
                        className="font-secondary text-sm"
                        style={{ color: "var(--ff-text-secondary)" }}
                      >
                        {pack.price}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      checkout.mutate({ type: "token_pack", packId: pack.id })
                    }
                    disabled={checkout.isPending}
                    className="font-primary tracking-wider text-black"
                    style={{ background: `linear-gradient(135deg, ${pack.color}, ${pack.color}CC)` }}
                  >
                    BUY
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="text-center font-secondary text-xs"
          style={{ color: "var(--ff-text-secondary)" }}
        >
          Secure payments via Stripe. Tokens are non-refundable.
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
