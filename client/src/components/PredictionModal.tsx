import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, Zap, Target, Sparkles, Music, Timer, ChevronRight, Crown, Trophy, Flame } from 'lucide-react';

const colors = {
  primary: '#FF4500',
  primaryLight: '#FF6B35',
  teal: '#14FFEC',
  purple: '#8B00FF',
  gold: '#FFD700',
  blue: '#1E90FF',
  gray900: '#0A0A0A',
  gray800: '#1A1A1A',
  gray700: '#2A2A2A',
  white: '#FFFFFF',
  gradientCard: 'linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)',
  glowRedStrong: '0 0 20px rgba(255, 69, 0, 0.8), 0 0 40px rgba(255, 69, 0, 0.6)',
  gradientPrimary: 'linear-gradient(135deg, #FF4500 0%, #FF6B35 100%)',
};

interface FactoryMetric {
  id: string;
  label: string;
  description: string;
  value: number;
  icon: React.ElementType;
  color: string;
  glowColor: string;
}

interface PredictionModalProps {
  track: any;
  onClose: () => void;
  onPredict: (trackId: number, scores: { hookStrength: number; originality: number; productionQuality: number; vibe: number; engagementBonus?: boolean }) => void;
  userId: string;
}

/* ------------------------------------------------------------------ */
/*  Particle Burst — fires on slider max-out                           */
/* ------------------------------------------------------------------ */

function ParticleBurst({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 12 });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((_, i) => {
        const angle = (360 / 12) * i;
        const rad = (angle * Math.PI) / 180;
        const dist = 30 + Math.random() * 20;
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{ background: color, left: '50%', top: '50%' }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(rad) * dist,
              y: Math.sin(rad) * dist,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pulse Ring — expanding ring on max-out                             */
/* ------------------------------------------------------------------ */

function PulseRing({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  return (
    <motion.div
      className="absolute inset-0 rounded-xl pointer-events-none"
      style={{ border: `2px solid ${color}` }}
      initial={{ opacity: 0.8, scale: 1 }}
      animate={{ opacity: 0, scale: 1.15 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  17-Second Engagement Protocol Timer                                */
/* ------------------------------------------------------------------ */

function EngagementTimer({ onComplete }: { onComplete: () => void }) {
  const [seconds, setSeconds] = useState(17);
  const [completed, setCompleted] = useState(false);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (seconds <= 0) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        setCompleted(true);
        onComplete();
      }
      return;
    }
    const timer = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds, onComplete]);

  const progress = ((17 - seconds) / 17) * 100;

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-2 rounded-lg relative overflow-hidden"
      style={{
        background: completed ? 'rgba(34,197,94,0.15)' : 'rgba(255,69,0,0.1)',
        border: `1px solid ${completed ? 'rgba(34,197,94,0.3)' : 'rgba(255,69,0,0.2)'}`,
      }}
      animate={completed ? { scale: [1, 1.03, 1] } : {}}
      transition={{ duration: 0.4 }}
    >
      {/* Completion flash */}
      <AnimatePresence>
        {completed && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'rgba(34,197,94,0.2)' }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        )}
      </AnimatePresence>

      {completed ? (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <Zap className="w-4 h-4 text-green-400 shrink-0" />
        </motion.div>
      ) : (
        <Timer className="w-4 h-4 text-orange-400 shrink-0" />
      )}

      <div className="flex-1">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: colors.gray700 }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: completed
                ? 'linear-gradient(90deg, #22c55e, #14FFEC)'
                : `linear-gradient(90deg, ${colors.primary}, ${colors.gold})`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <span className={`text-xs font-mono shrink-0 tabular-nums w-16 text-right font-bold ${completed ? 'text-green-400' : 'text-orange-400'}`}>
        {completed ? '+2 FT' : `${seconds}s`}
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  VU-Meter Slider with max-out explosion                             */
/* ------------------------------------------------------------------ */

function VUMeterSlider({
  metric,
  onChange,
}: {
  metric: FactoryMetric;
  onChange: (value: number) => void;
}) {
  const segmentCount = 20;
  const activeSegments = Math.round((metric.value / 100) * segmentCount);
  const Icon = metric.icon;
  const isMaxed = metric.value >= 95;
  const [justMaxed, setJustMaxed] = useState(false);
  const prevValue = useRef(metric.value);

  // Detect crossing the 95 threshold
  useEffect(() => {
    if (metric.value >= 95 && prevValue.current < 95) {
      setJustMaxed(true);
      setTimeout(() => setJustMaxed(false), 800);
    }
    prevValue.current = metric.value;
  }, [metric.value]);

  return (
    <motion.div
      className="p-4 rounded-xl relative"
      style={{
        background: colors.gray800,
        border: isMaxed ? `1px solid ${metric.color}60` : `1px solid ${colors.gray700}`,
        boxShadow: isMaxed ? `0 0 20px ${metric.color}20, inset 0 0 20px ${metric.color}05` : 'none',
      }}
      animate={justMaxed ? { scale: [1, 1.02, 0.99, 1] } : {}}
      transition={{ duration: 0.4 }}
    >
      {/* Pulse ring on max-out */}
      <PulseRing color={metric.color} active={justMaxed} />

      {/* Particle burst on max-out */}
      <AnimatePresence>
        {justMaxed && <ParticleBurst color={metric.color} active={justMaxed} />}
      </AnimatePresence>

      {/* Max-out corner badge */}
      <AnimatePresence>
        {isMaxed && (
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full z-10"
            style={{ background: `${metric.color}25`, border: `1px solid ${metric.color}40` }}
          >
            <Flame className="w-3 h-3" style={{ color: metric.color }} />
            <span className="text-[9px] font-bold tracking-wider" style={{ color: metric.color }}>MAX</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${metric.color}20` }}
            animate={isMaxed ? {
              boxShadow: [
                `0 0 0px ${metric.color}00`,
                `0 0 15px ${metric.color}60`,
                `0 0 0px ${metric.color}00`,
              ],
            } : {}}
            transition={isMaxed ? { duration: 1.5, repeat: Infinity } : {}}
          >
            <Icon className="w-4 h-4" style={{ color: metric.color }} />
          </motion.div>
          <div>
            <h3 className="text-white font-semibold text-sm">{metric.label}</h3>
            <p className="text-gray-500 text-xs">{metric.description}</p>
          </div>
        </div>
        <motion.span
          className="text-2xl font-bold tabular-nums"
          style={{
            color: metric.color,
            textShadow: isMaxed
              ? `0 0 20px ${metric.glowColor}, 0 0 40px ${metric.glowColor}`
              : `0 0 10px ${metric.glowColor}`,
          }}
          animate={justMaxed ? { scale: [1, 1.4, 1] } : {}}
          transition={{ duration: 0.3 }}
          key={metric.value} // re-trigger animation on value change
        >
          {metric.value}
        </motion.span>
      </div>

      {/* VU Meter visualization */}
      <div className="flex gap-[2px] mb-2 h-5 items-end">
        {Array.from({ length: segmentCount }).map((_, i) => {
          const isActive = i < activeSegments;
          const intensity = i / segmentCount;
          let segColor = metric.color;
          if (intensity > 0.8) segColor = '#FF0000';
          else if (intensity > 0.6) segColor = colors.gold;

          return (
            <motion.div
              key={i}
              className="flex-1 rounded-sm"
              animate={{
                height: isActive ? `${60 + intensity * 40}%` : '25%',
                opacity: isActive ? 0.8 + intensity * 0.2 : 0.2,
              }}
              transition={{ duration: 0.06, delay: isActive ? i * 0.008 : 0 }}
              style={{
                background: isActive ? segColor : colors.gray700,
                boxShadow: isActive && isMaxed
                  ? `0 0 6px ${segColor}60, 0 -2px 8px ${segColor}30`
                  : isActive
                    ? `0 0 4px ${segColor}30`
                    : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Slider */}
      <input
        type="range"
        min="0"
        max="100"
        value={metric.value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-lg cursor-pointer appearance-none pro-slider"
        style={{
          background: `linear-gradient(to right, ${metric.color} 0%, ${metric.color} ${metric.value}%, ${colors.gray700} ${metric.value}%, ${colors.gray700} 100%)`,
        }}
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Certification Success Screen                                       */
/* ------------------------------------------------------------------ */

function CertificationSuccess({
  score,
  tierLabel,
  tierColor,
  engagementBonus,
  onClose,
}: {
  score: number;
  tierLabel: string;
  tierColor: string;
  engagementBonus: boolean;
  onClose: () => void;
}) {
  const totalTokens = 5 + (engagementBonus ? 2 : 0);
  const [displayTokens, setDisplayTokens] = useState(0);

  // Count-up animation
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setDisplayTokens(current);
      if (current >= totalTokens) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  }, [totalTokens]);

  // Radial burst particles
  const burstParticles = Array.from({ length: 24 });

  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 rounded-2xl"
      style={{ background: 'rgba(0,0,0,0.95)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Radial particle burst */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {burstParticles.map((_, i) => {
          const angle = (360 / 24) * i;
          const rad = (angle * Math.PI) / 180;
          const dist = 80 + Math.random() * 60;
          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ background: i % 3 === 0 ? tierColor : i % 3 === 1 ? colors.gold : colors.primary }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1.5 }}
              animate={{ x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, opacity: 0, scale: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: i * 0.02 }}
            />
          );
        })}
      </div>

      {/* Trophy icon with spring entrance */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
        className="mb-4"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: `${tierColor}20`,
            border: `3px solid ${tierColor}`,
            boxShadow: `0 0 40px ${tierColor}40`,
          }}
        >
          <Trophy className="w-10 h-10" style={{ color: tierColor }} />
        </div>
      </motion.div>

      {/* CERTIFIED text */}
      <motion.h2
        className="text-3xl font-bold tracking-widest mb-1"
        style={{ fontFamily: 'Rajdhani, sans-serif', color: tierColor }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        CERTIFIED
      </motion.h2>

      {/* Tier badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        className="px-4 py-1 rounded-full mb-4"
        style={{ background: `${tierColor}20`, border: `1px solid ${tierColor}40` }}
      >
        <span className="text-sm font-bold tracking-wider" style={{ color: tierColor }}>
          {tierLabel} — {score}/100
        </span>
      </motion.div>

      {/* Token count-up */}
      <motion.div
        className="flex items-center gap-2 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.span
          className="text-4xl font-bold text-orange-400"
          style={{ fontFamily: 'Rajdhani, sans-serif' }}
          key={displayTokens}
          animate={{ scale: [1.2, 1] }}
          transition={{ duration: 0.15 }}
        >
          +{displayTokens}
        </motion.span>
        <span className="text-gray-400 text-sm">FT earned</span>
      </motion.div>

      {/* Breakdown */}
      <motion.div
        className="space-y-1 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center gap-2 text-xs">
          <Target className="w-3 h-3 text-orange-400" />
          <span className="text-gray-400">Certification</span>
          <span className="text-white font-bold ml-auto">+5 FT</span>
        </div>
        {engagementBonus && (
          <motion.div
            className="flex items-center gap-2 text-xs"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Zap className="w-3 h-3 text-green-400" />
            <span className="text-gray-400">17s Engagement</span>
            <span className="text-green-400 font-bold ml-auto">+2 FT</span>
          </motion.div>
        )}
      </motion.div>

      {/* Close */}
      <motion.button
        onClick={onClose}
        className="px-8 py-3 rounded-xl text-white font-bold tracking-wider"
        style={{ background: colors.gradientPrimary, boxShadow: colors.glowRedStrong }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        CONTINUE
      </motion.button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main PredictionModal                                               */
/* ------------------------------------------------------------------ */

export default function PredictionModal({ track, onClose, onPredict, userId }: PredictionModalProps) {
  const [metrics, setMetrics] = useState<FactoryMetric[]>([
    {
      id: 'hookStrength',
      label: 'Hook Strength',
      description: 'How memorable and infectious is the hook?',
      value: 50,
      icon: Target,
      color: '#FF4500',
      glowColor: 'rgba(255,69,0,0.5)',
    },
    {
      id: 'productionQuality',
      label: 'Production Quality',
      description: 'Professional mixing, mastering & sound design',
      value: 50,
      icon: Sparkles,
      color: '#1E90FF',
      glowColor: 'rgba(30,144,255,0.5)',
    },
    {
      id: 'originality',
      label: 'Originality',
      description: 'Does it push creative boundaries?',
      value: 50,
      icon: Zap,
      color: '#8B00FF',
      glowColor: 'rgba(139,0,255,0.5)',
    },
    {
      id: 'vibe',
      label: 'Vibe',
      description: 'Overall feel, energy & replay value',
      value: 50,
      icon: Music,
      color: '#FFD700',
      glowColor: 'rgba(255,215,0,0.5)',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [engagementComplete, setEngagementComplete] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [prevTier, setPrevTier] = useState('BRONZE');

  const updateMetric = (id: string, value: number) => {
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, value } : m));
    if (!hasInteracted) setHasInteracted(true);
  };

  const overallScore = Math.round(metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length);

  const handleEngagementComplete = useCallback(() => {
    setEngagementComplete(true);
  }, []);

  const getScoreTier = (score: number) => {
    if (score >= 90) return { label: 'PLATINUM', color: '#E5E4E2' };
    if (score >= 75) return { label: 'GOLD', color: '#FFD700' };
    if (score >= 60) return { label: 'SILVER', color: '#C0C0C0' };
    if (score >= 40) return { label: 'BRONZE', color: '#CD7F32' };
    return { label: 'IRON', color: '#666' };
  };

  const tier = getScoreTier(overallScore);

  // Track tier changes for animation
  const tierChanged = tier.label !== prevTier;
  useEffect(() => {
    if (tierChanged) {
      const timeout = setTimeout(() => setPrevTier(tier.label), 600);
      return () => clearTimeout(timeout);
    }
  }, [tier.label, tierChanged]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const scores = {
      hookStrength: metrics.find(m => m.id === 'hookStrength')?.value || 50,
      originality: metrics.find(m => m.id === 'originality')?.value || 50,
      productionQuality: metrics.find(m => m.id === 'productionQuality')?.value || 50,
      vibe: metrics.find(m => m.id === 'vibe')?.value || 50,
      engagementBonus: engagementComplete,
    };
    onPredict(track.id, scores);
    // Show success screen
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
    }, 600);
  };

  // Count how many metrics are maxed (95+)
  const maxedCount = metrics.filter(m => m.value >= 95).length;
  const allMaxed = maxedCount === 4;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.9)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="w-full max-w-md rounded-2xl overflow-hidden relative"
        style={{ background: colors.gradientCard, border: `1px solid ${colors.gray700}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Success Screen Overlay */}
        <AnimatePresence>
          {showSuccess && (
            <CertificationSuccess
              score={overallScore}
              tierLabel={tier.label}
              tierColor={tier.color}
              engagementBonus={engagementComplete}
              onClose={onClose}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: `1px solid ${colors.gray700}` }}>
          <div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-orange-400 text-xs font-bold tracking-widest uppercase">Pro Engine</span>
              {allMaxed && (
                <motion.span
                  className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: '#FFD70025', color: '#FFD700', border: '1px solid #FFD70040' }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  ALL MAX
                </motion.span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              FACTORY METRICS
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Track Info */}
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,69,0,0.05)' }}>
          <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
            {track.cover_art || track.artist_image ? (
              <img src={track.cover_art || track.artist_image} alt="" className="w-full h-full object-cover" />
            ) : (
              <Music className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{track.trackTitle || track.track_title}</p>
            <p className="text-gray-500 text-xs truncate">by {track.artistName || track.artist_name}</p>
          </div>
        </div>

        {/* 17-Second Engagement Timer */}
        <div className="px-4 pt-3">
          <EngagementTimer onComplete={handleEngagementComplete} />
        </div>

        {/* Scrollable metrics area */}
        <div className="px-4 py-4 space-y-3 max-h-[45vh] overflow-y-auto">
          {metrics.map(metric => (
            <VUMeterSlider
              key={metric.id}
              metric={metric}
              onChange={(value) => updateMetric(metric.id, value)}
            />
          ))}
        </div>

        {/* Overall Score */}
        <motion.div
          className="mx-4 p-4 rounded-xl text-center relative overflow-hidden"
          style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}
          animate={tierChanged ? {
            borderColor: [tier.color, colors.gray700],
            boxShadow: [`0 0 20px ${tier.color}30`, `0 0 0px ${tier.color}00`],
          } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Tier transition flash */}
          <AnimatePresence>
            {tierChanged && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `${tier.color}15` }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              />
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-3 relative z-10">
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Factory Score</span>
              <motion.div
                className="text-5xl font-bold mt-1 leading-none"
                style={{
                  color: colors.white,
                  textShadow: `0 0 30px ${tier.color}80`,
                  fontFamily: 'Rajdhani, sans-serif',
                }}
                animate={tierChanged ? { scale: [1, 1.15, 1], rotate: [0, -2, 2, 0] } : {}}
                transition={{ duration: 0.5 }}
                key={overallScore}
              >
                {overallScore}
              </motion.div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <motion.span
                className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
                style={{ background: `${tier.color}20`, color: tier.color, border: `1px solid ${tier.color}40` }}
                key={tier.label}
                initial={tierChanged ? { scale: 0, rotate: -10 } : false}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                {tier.label}
              </motion.span>
              <span className="text-gray-500 text-[10px]">/ 100</span>
            </div>
          </div>
        </motion.div>

        {/* Submit Button */}
        <div className="p-4 space-y-3">
          <motion.button
            onClick={handleSubmit}
            disabled={isSubmitting || !hasInteracted}
            className="w-full p-4 rounded-xl text-white font-bold text-lg tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 relative overflow-hidden"
            style={{
              background: hasInteracted ? colors.gradientPrimary : colors.gray700,
              boxShadow: hasInteracted ? colors.glowRedStrong : 'none',
            }}
            whileHover={{ scale: isSubmitting || !hasInteracted ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting || !hasInteracted ? 1 : 0.98 }}
          >
            {/* Shimmer on hover */}
            {hasInteracted && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}

            {isSubmitting ? (
              <motion.span
                className="flex items-center gap-2"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <Crown className="w-5 h-5 animate-spin" />
                CERTIFYING...
              </motion.span>
            ) : (
              <>
                <span className="relative z-10">LOCK IN {overallScore}</span>
                <ChevronRight className="w-5 h-5 relative z-10" />
              </>
            )}
          </motion.button>

          {/* Token reward + CTA */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">+5 FT for certifying</span>
            <motion.span
              className={`font-medium ${engagementComplete ? 'text-green-400' : 'text-orange-400'}`}
              animate={engagementComplete ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {engagementComplete ? 'Engagement Bonus: +2 FT' : 'Stay 17s for +2 FT bonus'}
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* Custom slider styles */}
      <style>{`
        .pro-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: ${colors.white};
          border: 3px solid ${colors.primary};
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(255,69,0,0.5);
          transition: box-shadow 0.2s, transform 0.1s;
        }
        .pro-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 24px rgba(255,69,0,0.8);
          transform: scale(1.1);
        }
        .pro-slider::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }
        .pro-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: ${colors.white};
          border: 3px solid ${colors.primary};
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </motion.div>
  );
}
