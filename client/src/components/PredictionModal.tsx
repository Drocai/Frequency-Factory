import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Target, Sparkles, Music, Timer, ChevronRight } from 'lucide-react';

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
  onPredict: (trackId: number, scores: { hookStrength: number; originality: number; productionQuality: number; vibe: number }) => void;
  userId: string;
}

// 17-Second Engagement Protocol Timer
function EngagementTimer({ onComplete }: { onComplete: () => void }) {
  const [seconds, setSeconds] = useState(17);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive || seconds <= 0) {
      if (seconds <= 0) onComplete();
      return;
    }
    const timer = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [isActive, seconds, onComplete]);

  const progress = ((17 - seconds) / 17) * 100;

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ background: 'rgba(255,69,0,0.1)', border: '1px solid rgba(255,69,0,0.2)' }}>
      <Timer className="w-4 h-4 text-orange-400 shrink-0" />
      <div className="flex-1">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: colors.gray700 }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.gold})` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
      <span className="text-xs font-mono text-orange-400 shrink-0 tabular-nums w-6 text-right">
        {seconds}s
      </span>
    </div>
  );
}

// VU-Meter style slider visualization
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

  return (
    <div className="p-4 rounded-xl" style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}>
      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${metric.color}20` }}>
            <Icon className="w-4 h-4" style={{ color: metric.color }} />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{metric.label}</h3>
            <p className="text-gray-500 text-xs">{metric.description}</p>
          </div>
        </div>
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: metric.color, textShadow: `0 0 10px ${metric.glowColor}` }}
        >
          {metric.value}
        </span>
      </div>

      {/* VU Meter visualization */}
      <div className="flex gap-[2px] mb-2 h-4 items-end">
        {Array.from({ length: segmentCount }).map((_, i) => {
          const isActive = i < activeSegments;
          const intensity = i / segmentCount;
          let segColor = metric.color;
          if (intensity > 0.8) segColor = '#FF0000';
          else if (intensity > 0.6) segColor = colors.gold;

          return (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all duration-75"
              style={{
                height: isActive ? `${60 + intensity * 40}%` : '30%',
                background: isActive ? segColor : `${colors.gray700}`,
                opacity: isActive ? 0.8 + intensity * 0.2 : 0.3,
                boxShadow: isActive ? `0 0 4px ${segColor}40` : 'none',
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
    </div>
  );
}

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

  const updateMetric = (id: string, value: number) => {
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, value } : m));
    if (!hasInteracted) setHasInteracted(true);
  };

  const overallScore = Math.round(metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length);

  const handleEngagementComplete = useCallback(() => {
    setEngagementComplete(true);
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const scores = {
      hookStrength: metrics.find(m => m.id === 'hookStrength')?.value || 50,
      originality: metrics.find(m => m.id === 'originality')?.value || 50,
      productionQuality: metrics.find(m => m.id === 'productionQuality')?.value || 50,
      vibe: metrics.find(m => m.id === 'vibe')?.value || 50,
    };
    onPredict(track.id, scores);
  };

  // Score tier label
  const getScoreTier = (score: number) => {
    if (score >= 90) return { label: 'PLATINUM', color: '#E5E4E2' };
    if (score >= 75) return { label: 'GOLD', color: '#FFD700' };
    if (score >= 60) return { label: 'SILVER', color: '#C0C0C0' };
    if (score >= 40) return { label: 'BRONZE', color: '#CD7F32' };
    return { label: 'IRON', color: '#666' };
  };

  const tier = getScoreTier(overallScore);

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
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: colors.gradientCard, border: `1px solid ${colors.gray700}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: `1px solid ${colors.gray700}` }}>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-orange-400 text-xs font-bold tracking-widest uppercase">Pro Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              FACTORY METRICS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-700 transition"
          >
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
        <div className="mx-4 p-4 rounded-xl text-center" style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}>
          <div className="flex items-center justify-center gap-3">
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Factory Score</span>
              <div
                className="text-5xl font-bold mt-1 leading-none"
                style={{
                  color: colors.white,
                  textShadow: `0 0 30px ${tier.color}80`,
                  fontFamily: 'Rajdhani, sans-serif',
                }}
              >
                {overallScore}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
                style={{ background: `${tier.color}20`, color: tier.color, border: `1px solid ${tier.color}40` }}
              >
                {tier.label}
              </span>
              <span className="text-gray-500 text-[10px]">/ 100</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="p-4 space-y-3">
          <motion.button
            onClick={handleSubmit}
            disabled={isSubmitting || !hasInteracted}
            className="w-full p-4 rounded-xl text-white font-bold text-lg tracking-wider flex items-center justify-center gap-2 disabled:opacity-40"
            style={{
              background: hasInteracted ? colors.gradientPrimary : colors.gray700,
              boxShadow: hasInteracted ? colors.glowRedStrong : 'none',
            }}
            whileHover={{ scale: isSubmitting || !hasInteracted ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting || !hasInteracted ? 1 : 0.98 }}
          >
            {isSubmitting ? (
              'CERTIFYING...'
            ) : (
              <>
                LOCK IN {overallScore}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          {/* Token reward + CTA */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              +5 FT for certifying
            </span>
            <span className="text-orange-400 font-medium">
              {engagementComplete ? 'Engagement Bonus: +2 FT' : 'Stay 17s for +2 FT bonus'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Custom slider styles */}
      <style>{`
        .pro-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: ${colors.white};
          border: 3px solid ${colors.primary};
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255,69,0,0.5);
          transition: box-shadow 0.2s;
        }
        .pro-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 20px rgba(255,69,0,0.8);
        }
        .pro-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: ${colors.white};
          border: 3px solid ${colors.primary};
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </motion.div>
  );
}
