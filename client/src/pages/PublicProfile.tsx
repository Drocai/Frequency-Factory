import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import {
  Target,
  TrendingUp,
  Coins,
  Crown,
  Calendar,
  Award,
  Flame,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";

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

export default function PublicProfile() {
  const [, params] = useRoute("/u/:userId");
  const userId = Number(params?.userId);

  const profileQuery = trpc.user.getPublicProfile.useQuery(
    { userId },
    { enabled: !!userId && !isNaN(userId) },
  );
  const badgesQuery = trpc.badges.getUserBadges.useQuery(
    { userId },
    { enabled: !!userId && !isNaN(userId) },
  );

  const profile = profileQuery.data;
  const userBadges = badgesQuery.data ?? [];

  if (profileQuery.isLoading) {
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
            USER NOT FOUND
          </h1>
          <Link href="/feed">
            <span
              className="font-secondary text-sm underline"
              style={{ color: "var(--ff-text-secondary)" }}
            >
              Back to Feed
            </span>
          </Link>
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

  let socials: Record<string, string> = {};
  try {
    socials = profile.socialLinks ? JSON.parse(profile.socialLinks) : {};
  } catch {
    /* ignore */
  }

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
          <Link href="/feed">
            <ArrowLeft className="w-5 h-5" style={{ color: "var(--ff-text-secondary)" }} />
          </Link>
          <h1
            className="font-primary text-lg tracking-wider"
            style={{ color: "var(--ff-primary)" }}
          >
            {profile.avatarName || profile.name || "PROFILE"}
          </h1>
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
            {profile.isFounder === 1 && (
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
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
            label="Earned"
            value={`${profile.totalTokensEarned ?? 0} FT`}
            color="#FFD700"
          />
        </div>

        {/* Badges */}
        {userBadges.length > 0 && (
          <div>
            <h3
              className="font-primary text-sm tracking-wider mb-3"
              style={{ color: "var(--ff-text-secondary)" }}
            >
              Badges
            </h3>
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
          </div>
        )}

        {/* Social Links */}
        {Object.entries(socials).some(([, v]) => v) && (
          <div>
            <h3
              className="font-primary text-sm tracking-wider mb-3"
              style={{ color: "var(--ff-text-secondary)" }}
            >
              Socials
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(socials).map(
                ([platform, handle]) =>
                  handle && (
                    <span
                      key={platform}
                      className="px-3 py-1 rounded-full font-secondary text-xs"
                      style={{
                        background: "var(--ff-bg-tertiary)",
                        border: "1px solid var(--ff-gray-700)",
                        color: "var(--ff-text-secondary)",
                      }}
                    >
                      {platform}: {handle}
                    </span>
                  ),
              )}
            </div>
          </div>
        )}
      </div>
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
      className="p-3 rounded-xl text-center"
      style={{
        background: "var(--ff-bg-tertiary)",
        border: "1px solid var(--ff-gray-700)",
      }}
    >
      <div className="flex justify-center mb-1" style={{ color }}>
        {icon}
      </div>
      <div className="font-primary text-lg text-white">{value}</div>
      <div
        className="font-secondary text-[10px]"
        style={{ color: "var(--ff-text-secondary)" }}
      >
        {label}
      </div>
    </div>
  );
}
