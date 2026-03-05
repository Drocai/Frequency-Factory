import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { Zap, Star, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PROMO_OPTIONS = [
  {
    type: "skip_queue" as const,
    label: "Skip Queue",
    description: "Jump to position #1 in the review queue",
    price: "$5",
    tokenAlt: "10 FT",
    icon: Zap,
    color: "#FF4500",
  },
  {
    type: "featured" as const,
    label: "Featured Placement",
    description: "Pinned at the top of the Feed for 24 hours",
    price: "$15",
    icon: Star,
    color: "#FFD700",
  },
  {
    type: "priority_review" as const,
    label: "Priority Review",
    description: "Flagged for live stream review by the Factory",
    price: "$10",
    icon: Eye,
    color: "#1E90FF",
  },
];

export default function ArtistPromo() {
  useAuth({ redirectOnUnauthenticated: true });

  const submissionsQuery = trpc.submissions.mySubmissions.useQuery();
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

  const skipWithTokens = trpc.submissions.skipQueue.useMutation({
    onSuccess: () => {
      toast.success("Queue skipped! Your track is now #1");
      submissionsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const submissions = submissionsQuery.data || [];

  function handlePromo(
    submissionId: number,
    promoType: "skip_queue" | "featured" | "priority_review",
    useTokens?: boolean,
  ) {
    if (promoType === "skip_queue" && useTokens) {
      skipWithTokens.mutate({ submissionId });
    } else {
      checkout.mutate({
        type: "promotion",
        promotionType: promoType,
        submissionId,
      });
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--ff-bg-primary)" }}>
      <header
        className="sticky top-0 z-50 backdrop-blur-sm"
        style={{
          background: "var(--ff-bg-primary)",
          borderBottom: "1px solid var(--ff-gray-800)",
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <h1
            className="font-primary text-lg tracking-wider"
            style={{ color: "var(--ff-primary)" }}
          >
            PROMOTE YOUR TRACKS
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <div className="text-center">
          <h2
            className="font-primary text-xl tracking-wider"
            style={{ color: "var(--ff-primary)" }}
          >
            BOOST YOUR MUSIC
          </h2>
          <p
            className="font-secondary text-sm mt-2"
            style={{ color: "var(--ff-text-secondary)" }}
          >
            Get your tracks heard faster with paid promotions
          </p>
        </div>

        {submissionsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--ff-primary)" }} />
          </div>
        ) : submissions.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl"
            style={{
              background: "var(--ff-bg-tertiary)",
              border: "1px solid var(--ff-gray-700)",
            }}
          >
            <p className="font-secondary" style={{ color: "var(--ff-text-secondary)" }}>
              No submissions yet. Submit a track first!
            </p>
            <Button
              className="mt-4 font-primary tracking-wider text-black"
              style={{ background: "var(--ff-primary)" }}
              onClick={() => (window.location.href = "/submit")}
            >
              SUBMIT A TRACK
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "var(--ff-bg-tertiary)",
                  border: "1px solid var(--ff-gray-700)",
                }}
              >
                {/* Track header */}
                <div
                  className="p-4"
                  style={{ borderBottom: "1px solid var(--ff-gray-700)" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-primary text-white">{sub.trackTitle}</h3>
                      <p
                        className="font-secondary text-sm"
                        style={{ color: "var(--ff-text-secondary)" }}
                      >
                        {sub.artistName}
                      </p>
                    </div>
                    <span
                      className="px-2 py-1 rounded-full font-primary text-xs tracking-wider"
                      style={{
                        background:
                          sub.status === "approved"
                            ? "rgba(34,197,94,0.2)"
                            : sub.status === "pending"
                              ? "rgba(255,165,0,0.2)"
                              : "rgba(128,128,128,0.2)",
                        color:
                          sub.status === "approved"
                            ? "#22c55e"
                            : sub.status === "pending"
                              ? "#FFA500"
                              : "#888",
                      }}
                    >
                      {(sub.status || "pending").toUpperCase()}
                    </span>
                  </div>
                  {sub.isFeatured === 1 && (
                    <span
                      className="inline-block mt-2 px-2 py-0.5 rounded-full font-primary text-xs"
                      style={{ background: "rgba(255,215,0,0.2)", color: "#FFD700" }}
                    >
                      FEATURED
                    </span>
                  )}
                  {sub.isPriorityReview === 1 && (
                    <span
                      className="inline-block mt-2 ml-2 px-2 py-0.5 rounded-full font-primary text-xs"
                      style={{ background: "rgba(30,144,255,0.2)", color: "#1E90FF" }}
                    >
                      PRIORITY REVIEW
                    </span>
                  )}
                </div>

                {/* Promo options */}
                <div className="p-4 space-y-3">
                  {PROMO_OPTIONS.map((promo) => {
                    const Icon = promo.icon;
                    return (
                      <div
                        key={promo.type}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{
                          background: "var(--ff-bg-secondary)",
                          border: `1px solid ${promo.color}30`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" style={{ color: promo.color }} />
                          <div>
                            <div className="font-primary text-sm text-white">{promo.label}</div>
                            <div
                              className="font-secondary text-xs"
                              style={{ color: "var(--ff-text-secondary)" }}
                            >
                              {promo.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {promo.tokenAlt && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePromo(sub.id, promo.type, true)}
                              disabled={skipWithTokens.isPending || checkout.isPending}
                              className="font-primary text-xs tracking-wider"
                              style={{ borderColor: promo.color, color: promo.color }}
                            >
                              {promo.tokenAlt}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handlePromo(sub.id, promo.type)}
                            disabled={checkout.isPending}
                            className="font-primary text-xs tracking-wider text-black"
                            style={{ background: promo.color }}
                          >
                            {promo.price}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
