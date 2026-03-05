import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { Link, useLocation } from "wouter";
import {
  Target,
  Trophy,
  TrendingUp,
  Award,
  LogOut,
  Coins,
  Flame,
  Crown,
  Settings,
  Calendar,
} from "lucide-react";

const BADGE_ICONS: Record<string, React.ElementType> = {
  crown: Crown,
  flame: Flame,
  fire: Flame,
  target: Target,
  trophy: Trophy,
  music: Award,
  sparkles: Award,
  award: Award,
};

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  const profileQuery = trpc.user.getProfile.useQuery(undefined, {
    enabled: !!user,
  });
  const badgesQuery = trpc.badges.myBadges.useQuery(undefined, {
    enabled: !!user,
  });
  const tokenHistoryQuery = trpc.tokens.getHistory.useQuery(
    { limit: 10 },
    { enabled: !!user },
  );

  const profile = profileQuery.data;
  const userBadges = badgesQuery.data ?? [];
  const tokenHistory = tokenHistoryQuery.data ?? [];

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  if (loading || profileQuery.isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--ff-bg-primary)" }}
      >
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{
            borderColor: "var(--ff-primary)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--ff-bg-primary)" }}
      >
        <div className="text-center space-y-4">
          <h1
            className="font-primary text-2xl tracking-wider"
            style={{ color: "var(--ff-primary)" }}
          >
            FREQUENCY FACTORY
          </h1>
          <p
            className="font-secondary text-sm"
            style={{ color: "var(--ff-text-secondary)" }}
          >
            Sign in to view your profile
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="font-primary tracking-wider text-black"
            style={{ background: "var(--ff-gradient-primary)" }}
          >
            ENTER THE FACTORY
          </Button>
        </div>
      </div>
    );
  }

  const accuracy =
    profile.totalPredictions && profile.totalPredictions > 0
      ? Math.round(
          ((profile.accuratePredictions ?? 0) / profile.totalPredictions) * 100,
        )
      : 0;

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--ff-bg-primary)" }}>
      {/* Header */}
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
            PROFILE
          </h1>
          <div className="flex items-center gap-3">
            <Link href="/settings">
              <button
                className="p-2 rounded-lg transition-colors"
                style={{ color: "var(--ff-text-secondary)" }}
              >
                <Settings className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/shop">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
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
                  {profile.tokenBalance} FT
                </span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* Avatar + Name */}
        <div className="text-center">
          <div
            className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-primary"
            style={{
              background: "var(--ff-gradient-primary)",
              boxShadow: "0 0 30px rgba(255, 109, 0, 0.4)",
              color: "black",
            }}
          >
            {(profile.avatarName ?? "U").charAt(0)}
          </div>
          <h2 className="font-primary text-xl tracking-wide text-white mt-3">
            {profile.avatarName || profile.name || "Factory Worker"}
          </h2>
          {profile.bio && (
            <p
              className="font-secondary text-sm mt-1"
              style={{ color: "var(--ff-text-secondary)" }}
            >
              {profile.bio}
            </p>
          )}
          <div className="flex items-center justify-center gap-3 mt-2">
            {profile.isFounder && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-primary"
                style={{
                  background: "rgba(255, 215, 0, 0.15)",
                  color: "#FFD700",
                  border: "1px solid rgba(255, 215, 0, 0.3)",
                }}
              >
                <Crown className="w-3 h-3" />
                Founder #{profile.founderSlot}
              </span>
            )}
            <span
              className="flex items-center gap-1 text-xs font-secondary"
              style={{ color: "var(--ff-text-secondary)" }}
            >
              <Calendar className="w-3 h-3" />
              Joined {memberSince}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Predictions"
            value={profile.totalPredictions ?? 0}
            color="#1E90FF"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Accuracy"
            value={`${accuracy}%`}
            color="#32CD32"
          />
          <StatCard
            icon={<Coins className="w-5 h-5" />}
            label="Total Earned"
            value={`${profile.totalTokensEarned ?? 0} FT`}
            color="#FFD700"
          />
          <StatCard
            icon={<Flame className="w-5 h-5" />}
            label="Streak"
            value={`${profile.loginStreak ?? 0}d`}
            color="#FF4500"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/shop">
            <div
              className="p-4 rounded-xl text-center cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                background: "var(--ff-bg-tertiary)",
                border: "1px solid var(--ff-gray-700)",
              }}
            >
              <div className="flex justify-center mb-2" style={{ color: "#FFD700" }}>
                <Coins className="w-5 h-5" />
              </div>
              <div className="font-primary text-sm text-white">Get Tokens</div>
              <div
                className="font-secondary text-xs mt-0.5"
                style={{ color: "var(--ff-text-secondary)" }}
              >
                Visit Token Shop
              </div>
            </div>
          </Link>
          <Link href="/pro">
            <div
              className="p-4 rounded-xl text-center cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                background: "var(--ff-bg-tertiary)",
                border: "1px solid var(--ff-gray-700)",
              }}
            >
              <div className="flex justify-center mb-2" style={{ color: "#9B30FF" }}>
                <Crown className="w-5 h-5" />
              </div>
              <div className="font-primary text-sm text-white">Go Pro</div>
              <div
                className="font-secondary text-xs mt-0.5"
                style={{ color: "var(--ff-text-secondary)" }}
              >
                Unlimited Predictions
              </div>
            </div>
          </Link>
        </div>

        {/* Badges */}
        <Section title="Badges">
          {userBadges.length === 0 ? (
            <p
              className="font-secondary text-sm text-center py-4"
              style={{ color: "var(--ff-text-secondary)" }}
            >
              No badges yet — keep predicting!
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {userBadges.map((b) => {
                const Icon = BADGE_ICONS[b.icon ?? "award"] ?? Award;
                return (
                  <div
                    key={b.id}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl"
                    style={{
                      background: "var(--ff-bg-tertiary)",
                      border: "1px solid var(--ff-gray-700)",
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: "var(--ff-primary)" }} />
                    <span className="font-primary text-[10px] tracking-wide text-white text-center">
                      {b.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Token History */}
        <Section title="Recent Activity">
          {tokenHistory.length === 0 ? (
            <p
              className="font-secondary text-sm text-center py-4"
              style={{ color: "var(--ff-text-secondary)" }}
            >
              No token activity yet
            </p>
          ) : (
            <div className="space-y-2">
              {tokenHistory.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{
                    background: "var(--ff-bg-tertiary)",
                    border: "1px solid var(--ff-gray-800)",
                  }}
                >
                  <div>
                    <p className="font-secondary text-sm text-white">
                      {tx.description || tx.type.replace(/_/g, " ")}
                    </p>
                    <p
                      className="font-secondary text-[10px]"
                      style={{ color: "var(--ff-text-secondary)" }}
                    >
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className="font-primary text-sm"
                    style={{
                      color: tx.amount > 0 ? "var(--ff-token-gold)" : "#FF4500",
                    }}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount} FT
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full font-primary tracking-wider"
          style={{
            borderColor: "rgba(255, 69, 0, 0.3)",
            color: "#FF4500",
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          LOGOUT
        </Button>
      </div>

      <BottomNav activeTab="profile" />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className="p-4 rounded-xl text-center"
      style={{
        background: "var(--ff-bg-tertiary)",
        border: "1px solid var(--ff-gray-700)",
      }}
    >
      <div className="flex justify-center mb-2" style={{ color }}>
        {icon}
      </div>
      <div className="font-primary text-xl text-white">{value}</div>
      <div
        className="font-secondary text-xs mt-0.5"
        style={{ color: "var(--ff-text-secondary)" }}
      >
        {label}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className="font-primary text-sm tracking-wider mb-3"
        style={{ color: "var(--ff-text-secondary)" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
