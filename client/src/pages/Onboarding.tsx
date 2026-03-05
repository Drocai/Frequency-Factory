import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Music, Headphones, Coins, BarChart3, Trophy, Sparkles, Check } from "lucide-react";

const avatars = [
  { id: 1, name: "BeatMaster", color: "#1E90FF", description: "The rhythm architect" },
  { id: 2, name: "SynthQueen", color: "#FF4500", description: "Electronic royalty" },
  { id: 3, name: "VoxMaster", color: "#FF6B35", description: "Vocal virtuoso" },
  { id: 4, name: "DJ_Pulse", color: "#9B30FF", description: "Bass drop specialist" },
  { id: 5, name: "AudioPhreak", color: "#32CD32", description: "Sound explorer" },
  { id: 6, name: "Freq_Factory", color: "#9ACD32", description: "Factory original" },
];

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const { user, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<"listener" | "artist" | "both" | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);

  const completeOnboardingMutation = trpc.user.completeOnboarding.useMutation({
    onError: () => toast.error("Failed to complete onboarding"),
  });

  function nextStep() {
    if (step < TOTAL_STEPS) setStep(step + 1);
  }

  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  async function completeOnboarding() {
    const avatar = avatars.find(a => a.id === selectedAvatar);
    await completeOnboardingMutation.mutateAsync({
      avatarId: avatar?.id ?? 1,
      avatarName: avatar?.name ?? "BeatMaster",
      userType: userType ?? undefined,
    });
    window.location.href = "/feed";
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ff-bg-primary)" }}>
      {/* Progress bar */}
      <div className="w-full h-1 bg-[var(--ff-gray-800)]">
        <motion.div
          className="h-full"
          style={{ background: "var(--ff-gradient-primary)" }}
          animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex justify-center gap-2 pt-6 pb-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-colors"
            style={{
              background: i + 1 <= step ? "var(--ff-primary)" : "var(--ff-gray-600)",
            }}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md"
          >
            {step === 1 && (
              <StepRole
                selected={userType}
                onSelect={t => { setUserType(t); nextStep(); }}
              />
            )}
            {step === 2 && (
              <StepAvatar
                selected={selectedAvatar}
                onSelect={setSelectedAvatar}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {step === 3 && (
              <StepExplainer
                userType={userType}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {step === 4 && (
              <StepComplete
                avatarName={avatars.find(a => a.id === selectedAvatar)?.name || "Factory Worker"}
                userType={userType}
                onComplete={completeOnboarding}
                onBack={prevStep}
                loading={completeOnboardingMutation.isPending}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Step 1: Role Selection ──────────────────────────────────────

function StepRole({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (type: "listener" | "artist" | "both") => void;
}) {
  return (
    <div className="space-y-6 text-center">
      <div>
        <h1 className="font-primary text-2xl tracking-wider" style={{ color: "var(--ff-primary)" }}>
          WELCOME TO THE FACTORY
        </h1>
        <p className="font-secondary text-sm mt-2" style={{ color: "var(--ff-text-secondary)" }}>
          What brings you here?
        </p>
      </div>

      <div className="space-y-3">
        <RoleCard
          icon={<Headphones className="w-8 h-8" />}
          title="I'm here to discover & predict"
          description="Listen to new music, rate tracks on 4 metrics, earn Frequency Tokens, and compete on leaderboards."
          color="#1E90FF"
          onClick={() => onSelect("listener")}
        />
        <RoleCard
          icon={<Music className="w-8 h-8" />}
          title="I'm an artist"
          description="Submit your tracks for community feedback, get real metrics on your music, and gain exposure."
          color="#FF4500"
          onClick={() => onSelect("artist")}
        />
        <RoleCard
          icon={<Sparkles className="w-8 h-8" />}
          title="Both!"
          description="Predict hits AND submit your own tracks. Get the full Factory experience."
          color="#FFD700"
          onClick={() => onSelect("both")}
        />
      </div>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  description,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full p-4 rounded-xl text-left flex items-start gap-4 transition-colors"
      style={{
        background: "var(--ff-bg-tertiary)",
        border: "1px solid var(--ff-gray-600)",
      }}
    >
      <div className="mt-0.5" style={{ color }}>{icon}</div>
      <div>
        <h3 className="font-primary text-base tracking-wide text-white">{title}</h3>
        <p className="font-secondary text-xs mt-1" style={{ color: "var(--ff-text-secondary)" }}>
          {description}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Step 2: Avatar Selection ────────────────────────────────────

function StepAvatar({
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  selected: number | null;
  onSelect: (id: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6 text-center">
      <div>
        <h1 className="font-primary text-2xl tracking-wider" style={{ color: "var(--ff-primary)" }}>
          CHOOSE YOUR AVATAR
        </h1>
        <p className="font-secondary text-sm mt-2" style={{ color: "var(--ff-text-secondary)" }}>
          This is how the Factory knows you
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {avatars.map(avatar => (
          <motion.button
            key={avatar.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(avatar.id)}
            className="flex flex-col items-center gap-2"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-primary"
              style={{
                background: selected === avatar.id
                  ? `linear-gradient(135deg, ${avatar.color}, ${avatar.color}80)`
                  : "var(--ff-bg-tertiary)",
                border: selected === avatar.id
                  ? `3px solid ${avatar.color}`
                  : "2px solid var(--ff-gray-600)",
                boxShadow: selected === avatar.id
                  ? `0 0 20px ${avatar.color}60`
                  : "none",
                color: "white",
              }}
            >
              {avatar.name.charAt(0)}
            </div>
            <div>
              <p className="font-primary text-xs tracking-wide text-white">{avatar.name}</p>
              <p className="font-secondary text-[10px]" style={{ color: "var(--ff-text-secondary)" }}>
                {avatar.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button
          className="flex-1 font-primary tracking-wider text-black"
          style={{ background: selected ? "var(--ff-gradient-primary)" : "var(--ff-gray-600)" }}
          disabled={!selected}
          onClick={onNext}
        >
          CONTINUE
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Explainer ───────────────────────────────────────────

function StepExplainer({
  userType,
  onNext,
  onBack,
}: {
  userType: string | null;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6 text-center">
      <div>
        <h1 className="font-primary text-2xl tracking-wider" style={{ color: "var(--ff-primary)" }}>
          HOW IT WORKS
        </h1>
      </div>

      <div className="space-y-4">
        <ExplainerCard
          icon={<Coins className="w-6 h-6" />}
          title="Frequency Tokens (FT)"
          description="Your currency in the Factory. Earn FT by certifying tracks, posting comments, daily logins, and more. Spend FT to skip the queue or unlock rewards."
          color="#FFD700"
        />
        <ExplainerCard
          icon={<BarChart3 className="w-6 h-6" />}
          title="Factory Metrics"
          description="Rate tracks on 4 dimensions: Hook Strength, Production Quality, Originality, and Vibe. Your ratings help artists improve and build the community score."
          color="#FF4500"
        />
        <ExplainerCard
          icon={<Trophy className="w-6 h-6" />}
          title="Leaderboards & Rewards"
          description="Compete for Top Predictor, Token Earner, and more. Climb the ranks, earn badges, and unlock exclusive perks."
          color="#1E90FF"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button
          className="flex-1 font-primary tracking-wider text-black"
          style={{ background: "var(--ff-gradient-primary)" }}
          onClick={onNext}
        >
          GOT IT
        </Button>
      </div>
    </div>
  );
}

function ExplainerCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div
      className="p-4 rounded-xl text-left flex items-start gap-3"
      style={{
        background: "var(--ff-bg-tertiary)",
        border: "1px solid var(--ff-gray-700)",
      }}
    >
      <div className="mt-0.5" style={{ color }}>{icon}</div>
      <div>
        <h3 className="font-primary text-sm tracking-wide text-white">{title}</h3>
        <p className="font-secondary text-xs mt-1" style={{ color: "var(--ff-text-secondary)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── Step 4: Completion ──────────────────────────────────────────

function StepComplete({
  avatarName,
  userType,
  onComplete,
  onBack,
  loading,
}: {
  avatarName: string;
  userType: string | null;
  onComplete: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <div
          className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
          style={{
            background: "var(--ff-gradient-primary)",
            boxShadow: "0 0 40px rgba(255, 109, 0, 0.5)",
          }}
        >
          <Check className="w-12 h-12 text-black" />
        </div>
      </motion.div>

      <div>
        <h1 className="font-primary text-2xl tracking-wider" style={{ color: "var(--ff-primary)" }}>
          YOU'RE IN, {avatarName.toUpperCase()}!
        </h1>
        <p className="font-secondary text-sm mt-2" style={{ color: "var(--ff-text-secondary)" }}>
          You start with <strong style={{ color: "var(--ff-token-gold)" }}>50 FT</strong> — your signup bonus.
          {userType === "artist" && " Submit your first track to earn more!"}
          {userType === "listener" && " Certify your first track to earn more!"}
          {userType === "both" && " Start certifying or submit your own tracks!"}
        </p>
      </div>

      <div className="p-4 rounded-xl" style={{ background: "var(--ff-bg-tertiary)", border: "1px solid var(--ff-gray-700)" }}>
        <div className="flex items-center justify-between">
          <span className="font-secondary text-sm" style={{ color: "var(--ff-text-secondary)" }}>Signup Bonus</span>
          <span className="font-primary text-lg" style={{ color: "var(--ff-token-gold)" }}>+50 FT</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button
          className="flex-1 font-primary text-lg tracking-wider text-black"
          style={{ background: loading ? "var(--ff-gray-600)" : "var(--ff-gradient-primary)" }}
          disabled={loading}
          onClick={onComplete}
        >
          {loading ? "..." : "ENTER THE FACTORY"}
        </Button>
      </div>
    </div>
  );
}
