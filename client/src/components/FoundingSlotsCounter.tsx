import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Shield, Zap } from 'lucide-react';

interface FoundingSlotsCounterProps {
  remaining?: number;
  total?: number;
  compact?: boolean;
}

export default function FoundingSlotsCounter({
  remaining = 42,
  total = 100,
  compact = false,
}: FoundingSlotsCounterProps) {
  const [displayCount, setDisplayCount] = useState(remaining);
  const filled = total - remaining;
  const percentage = (filled / total) * 100;

  // Animate counter on mount
  useEffect(() => {
    setDisplayCount(remaining);
  }, [remaining]);

  const urgencyColor = remaining <= 10
    ? '#FF0000'
    : remaining <= 25
      ? '#FF4500'
      : remaining <= 50
        ? '#FFD700'
        : '#14FFEC';

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{
          background: `${urgencyColor}10`,
          border: `1px solid ${urgencyColor}30`,
        }}
      >
        <Shield className="w-3 h-3" style={{ color: urgencyColor }} />
        <span className="text-xs font-bold" style={{ color: urgencyColor }}>
          {displayCount} Founding Slots Left
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
        border: `1px solid ${urgencyColor}30`,
        boxShadow: `0 0 30px ${urgencyColor}10`,
      }}
    >
      {/* Background glow */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20"
        style={{ background: urgencyColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5" style={{ color: urgencyColor }} />
          <div>
            <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              FOUNDING ARTIST PROGRAM
            </h3>
            <p className="text-gray-500 text-[10px]">Limited to {total} exclusive slots</p>
          </div>
        </div>
        <div className="text-right">
          <motion.div
            key={displayCount}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold tabular-nums"
            style={{ color: urgencyColor, fontFamily: 'Rajdhani, sans-serif' }}
          >
            {displayCount}
          </motion.div>
          <span className="text-gray-500 text-[10px]">remaining</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10">
        <div className="h-3 rounded-full overflow-hidden" style={{ background: '#2A2A2A' }}>
          <motion.div
            className="h-full rounded-full relative"
            style={{
              background: `linear-gradient(90deg, ${urgencyColor}80, ${urgencyColor})`,
              boxShadow: `0 0 10px ${urgencyColor}40`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite',
              }}
            />
          </motion.div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-gray-600 text-[10px]">{filled} claimed</span>
          <span className="text-gray-600 text-[10px]">{total} total</span>
        </div>
      </div>

      {/* Perks */}
      <div className="mt-4 space-y-2 relative z-10">
        {[
          { icon: Zap, text: '50 FT Founding Bonus', color: '#FFD700' },
          { icon: Shield, text: 'Exclusive Founder Badge', color: '#8B00FF' },
          { icon: Crown, text: 'Priority Track Reviews', color: '#FF4500' },
        ].map(({ icon: Icon, text, color }) => (
          <div key={text} className="flex items-center gap-2">
            <Icon className="w-3 h-3" style={{ color }} />
            <span className="text-gray-400 text-xs">{text}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </motion.div>
  );
}
