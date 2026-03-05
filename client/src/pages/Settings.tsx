import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, Save, Crown, ExternalLink } from "lucide-react";

const avatars = [
  { id: 1, name: "BeatMaster", color: "#1E90FF" },
  { id: 2, name: "SynthQueen", color: "#FF4500" },
  { id: 3, name: "VoxMaster", color: "#FF6B35" },
  { id: 4, name: "DJ_Pulse", color: "#9B30FF" },
  { id: 5, name: "AudioPhreak", color: "#32CD32" },
  { id: 6, name: "Freq_Factory", color: "#9ACD32" },
];

interface SocialLinks {
  twitter?: string;
  instagram?: string;
  spotify?: string;
  soundcloud?: string;
}

export default function Settings() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const profileQuery = trpc.user.getProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const subscriptionQuery = trpc.stripe.getSubscription.useQuery(undefined, {
    enabled: !!user,
  });

  const createPortalSession = trpc.stripe.createPortalSession.useMutation({
    onSuccess: (data: any) => {
      if (data?.url) {
        window.open(data.url, "_blank");
      } else if (data?.error) {
        toast.error(data.error);
      }
    },
    onError: () => toast.error("Failed to open billing portal"),
  });

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
      profileQuery.refetch();
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const updateAvatar = trpc.user.updateAvatar.useMutation({
    onSuccess: () => {
      toast.success("Avatar updated");
      profileQuery.refetch();
    },
    onError: () => toast.error("Failed to update avatar"),
  });

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [socials, setSocials] = useState<SocialLinks>({});
  const [selectedAvatar, setSelectedAvatar] = useState<number>(1);

  const profile = profileQuery.data;

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.name || "");
      setBio(profile.bio || "");
      setSelectedAvatar(profile.avatarId ?? 1);
      try {
        setSocials(profile.socialLinks ? JSON.parse(profile.socialLinks) : {});
      } catch {
        setSocials({});
      }
    }
  }, [profile]);

  async function handleSave() {
    await updateProfile.mutateAsync({
      name: displayName || undefined,
      bio: bio || undefined,
      socialLinks: JSON.stringify(socials),
    });

    if (profile && selectedAvatar !== profile.avatarId) {
      const avatar = avatars.find((a) => a.id === selectedAvatar);
      if (avatar) {
        await updateAvatar.mutateAsync({
          avatarId: avatar.id,
          avatarName: avatar.name,
        });
      }
    }
  }

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

  return (
    <div className="min-h-screen" style={{ background: "var(--ff-bg-primary)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-sm"
        style={{
          background: "var(--ff-bg-primary)",
          borderBottom: "1px solid var(--ff-gray-800)",
        }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/profile")}>
            <ArrowLeft className="w-5 h-5" style={{ color: "var(--ff-text-secondary)" }} />
          </button>
          <h1
            className="font-primary text-lg tracking-wider"
            style={{ color: "var(--ff-primary)" }}
          >
            SETTINGS
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* Avatar */}
        <FieldGroup label="Avatar">
          <div className="grid grid-cols-6 gap-2">
            {avatars.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => setSelectedAvatar(avatar.id)}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-primary"
                  style={{
                    background:
                      selectedAvatar === avatar.id
                        ? `linear-gradient(135deg, ${avatar.color}, ${avatar.color}80)`
                        : "var(--ff-bg-tertiary)",
                    border:
                      selectedAvatar === avatar.id
                        ? `2px solid ${avatar.color}`
                        : "1px solid var(--ff-gray-600)",
                    color: "white",
                  }}
                >
                  {avatar.name.charAt(0)}
                </div>
              </button>
            ))}
          </div>
        </FieldGroup>

        {/* Display Name */}
        <FieldGroup label="Display Name">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={64}
            className="w-full px-3 py-2 rounded-lg font-secondary text-sm text-white outline-none"
            style={{
              background: "var(--ff-bg-tertiary)",
              border: "1px solid var(--ff-gray-600)",
            }}
            placeholder="Your display name"
          />
        </FieldGroup>

        {/* Bio */}
        <FieldGroup label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            rows={3}
            className="w-full px-3 py-2 rounded-lg font-secondary text-sm text-white outline-none resize-none"
            style={{
              background: "var(--ff-bg-tertiary)",
              border: "1px solid var(--ff-gray-600)",
            }}
            placeholder="Tell the Factory about yourself"
          />
          <p
            className="text-right font-secondary text-[10px] mt-1"
            style={{ color: "var(--ff-text-secondary)" }}
          >
            {bio.length}/280
          </p>
        </FieldGroup>

        {/* Social Links */}
        <FieldGroup label="Social Links">
          <div className="space-y-2">
            {(["twitter", "instagram", "spotify", "soundcloud"] as const).map(
              (platform) => (
                <input
                  key={platform}
                  type="text"
                  value={socials[platform] || ""}
                  onChange={(e) =>
                    setSocials((s) => ({ ...s, [platform]: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg font-secondary text-sm text-white outline-none"
                  style={{
                    background: "var(--ff-bg-tertiary)",
                    border: "1px solid var(--ff-gray-600)",
                  }}
                  placeholder={platform.charAt(0).toUpperCase() + platform.slice(1)}
                />
              ),
            )}
          </div>
        </FieldGroup>

        {/* Account Info */}
        <FieldGroup label="Account">
          <div
            className="px-3 py-2 rounded-lg font-secondary text-sm"
            style={{
              background: "var(--ff-bg-tertiary)",
              border: "1px solid var(--ff-gray-700)",
              color: "var(--ff-text-secondary)",
            }}
          >
            {profile?.email || "No email"}
          </div>
        </FieldGroup>

        {/* Subscription */}
        <FieldGroup label="Subscription">
          <div
            className="px-4 py-3 rounded-lg"
            style={{
              background: "var(--ff-bg-tertiary)",
              border: `1px solid ${subscriptionQuery.data?.plan === "pro" ? "rgba(155, 48, 255, 0.4)" : "var(--ff-gray-700)"}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown
                  className="w-5 h-5"
                  style={{ color: subscriptionQuery.data?.plan === "pro" ? "#9B30FF" : "var(--ff-text-secondary)" }}
                />
                <div>
                  <span className="font-primary text-sm text-white">
                    {subscriptionQuery.data?.plan === "pro" ? "FF Pro" : "Free Plan"}
                  </span>
                  {subscriptionQuery.data?.plan === "pro" && subscriptionQuery.data?.currentPeriodEnd && (
                    <p
                      className="font-secondary text-[10px]"
                      style={{ color: "var(--ff-text-secondary)" }}
                    >
                      Renews {new Date(subscriptionQuery.data.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {subscriptionQuery.data?.plan === "pro" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => createPortalSession.mutate()}
                  disabled={createPortalSession.isPending}
                  className="font-primary text-xs tracking-wider"
                  style={{ borderColor: "rgba(155, 48, 255, 0.4)", color: "#9B30FF" }}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  {createPortalSession.isPending ? "..." : "MANAGE"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate("/pro")}
                  className="font-primary text-xs tracking-wider text-white"
                  style={{ background: "linear-gradient(135deg, #9B30FF, #6B0FCC)" }}
                >
                  <Crown className="w-3 h-3 mr-1" />
                  UPGRADE
                </Button>
              )}
            </div>
          </div>
        </FieldGroup>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending || updateAvatar.isPending}
          className="w-full font-primary tracking-wider text-black"
          style={{ background: "var(--ff-gradient-primary)" }}
        >
          <Save className="w-4 h-4 mr-2" />
          {updateProfile.isPending ? "SAVING..." : "SAVE CHANGES"}
        </Button>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="font-primary text-xs tracking-wider block mb-2"
        style={{ color: "var(--ff-text-secondary)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
