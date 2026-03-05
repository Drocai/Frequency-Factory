import { trpc } from "@/lib/trpc";
import { Crown, Target } from "lucide-react";
import { useLocation } from "wouter";

export default function PredictionLimitBanner() {
  const [, navigate] = useLocation();
  const { data } = trpc.predictions.dailyStatus.useQuery();

  if (!data) return null;

  const { used, isPro, remaining } = data;
  const limit = 10;

  if (isPro) {
    return (
      <div
        className="mx-4 mb-4 flex items-center gap-3 px-4 py-2.5 rounded-xl"
        style={{
          background: "linear-gradient(135deg, rgba(155,48,255,0.15) 0%, rgba(107,15,204,0.1) 100%)",
          border: "1px solid rgba(155,48,255,0.3)",
        }}
      >
        <Crown className="w-5 h-5 flex-shrink-0" style={{ color: "#9B30FF" }} />
        <span className="text-sm font-bold" style={{ color: "#C77DFF" }}>
          UNLIMITED PREDICTIONS
        </span>
      </div>
    );
  }

  const progress = Math.min(100, (used / limit) * 100);
  const isAtLimit = remaining <= 0;

  return (
    <div
      className="mx-4 mb-4 px-4 py-3 rounded-xl"
      style={{
        background: isAtLimit
          ? "linear-gradient(135deg, rgba(255,69,0,0.15) 0%, rgba(255,0,0,0.08) 100%)"
          : "rgba(42,42,42,0.8)",
        border: `1px solid ${isAtLimit ? "rgba(255,69,0,0.4)" : "#333"}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-bold text-white">
            {isAtLimit ? "Daily limit reached" : `${remaining}/${limit} predictions left`}
          </span>
        </div>
        {isAtLimit && (
          <button
            onClick={() => navigate("/pro")}
            className="px-3 py-1 rounded-lg text-xs font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #9B30FF, #6B0FCC)",
            }}
          >
            UPGRADE TO PRO
          </button>
        )}
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#333" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: isAtLimit
              ? "linear-gradient(90deg, #FF4500, #FF0000)"
              : "linear-gradient(90deg, #FF4500, #FF6B35)",
          }}
        />
      </div>
    </div>
  );
}
