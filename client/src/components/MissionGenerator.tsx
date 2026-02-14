import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Users, Share2, Star, Gift, X, ChevronRight, Zap, CheckCircle, Flame } from 'lucide-react';
import { useLocation } from 'wouter';

interface Mission {
  id: string;
  type: 'rate' | 'invite' | 'share' | 'explore' | 'bonus';
  title: string;
  description: string;
  reward: number;
  icon: React.ElementType;
  color: string;
  action: string;
  path?: string;
}

const MISSIONS: Mission[] = [
  {
    id: 'rate-track',
    type: 'rate',
    title: 'CERTIFY A TRACK',
    description: 'Use the Pro Engine to rate a track and earn tokens',
    reward: 5,
    icon: Target,
    color: '#FF4500',
    action: 'Rate Now',
    path: '/feed',
  },
  {
    id: 'invite-artist',
    type: 'invite',
    title: 'INVITE AN ARTIST',
    description: 'Share the Factory link with an artist you know',
    reward: 10,
    icon: Users,
    color: '#8B00FF',
    action: 'Get Invite Link',
  },
  {
    id: 'share-track',
    type: 'share',
    title: 'SHARE A CERTIFIED TRACK',
    description: 'Post a certified track to your socials',
    reward: 3,
    icon: Share2,
    color: '#1E90FF',
    action: 'Share',
    path: '/feed',
  },
  {
    id: 'explore-discover',
    type: 'explore',
    title: 'DISCOVER NEW MUSIC',
    description: 'Browse and listen to 3 tracks in the Discover page',
    reward: 2,
    icon: Star,
    color: '#FFD700',
    action: 'Explore',
    path: '/discover',
  },
  {
    id: 'daily-bonus',
    type: 'bonus',
    title: 'CLAIM DAILY BONUS',
    description: 'Log in daily to stack your streak multiplier',
    reward: 1,
    icon: Gift,
    color: '#14FFEC',
    action: 'Claim',
    path: '/feed',
  },
];

/* ------------------------------------------------------------------ */
/*  Scanline Effect — CRT-style sweep on entrance                      */
/* ------------------------------------------------------------------ */

function ScanlineEffect({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Horizontal scanline sweep */}
      <motion.div
        className="absolute left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
        initial={{ top: 0 }}
        animate={{ top: '100%' }}
        transition={{ duration: 0.6, ease: 'linear' }}
      />
      {/* CRT scanlines overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mission Accept Celebration                                         */
/* ------------------------------------------------------------------ */

function AcceptCelebration({ color, onComplete }: { color: string; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particles = Array.from({ length: 8 });

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rounded-2xl overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      {/* Flash */}
      <motion.div
        className="absolute inset-0"
        style={{ background: `${color}20` }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      />

      {/* Checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      >
        <CheckCircle className="w-12 h-12" style={{ color }} />
      </motion.div>

      {/* Mini particles */}
      {particles.map((_, i) => {
        const angle = (360 / 8) * i;
        const rad = (angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{ background: color }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: Math.cos(rad) * 40,
              y: Math.sin(rad) * 40,
              opacity: 0,
            }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          />
        );
      })}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  MissionGenerator                                                    */
/* ------------------------------------------------------------------ */

interface MissionGeneratorProps {
  isAuthenticated: boolean;
  idleTimeMs?: number;
}

export default function MissionGenerator({ isAuthenticated, idleTimeMs = 30000 }: MissionGeneratorProps) {
  const [, setLocation] = useLocation();
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [glowPulse, setGlowPulse] = useState(false);

  const pickRandomMission = useCallback(() => {
    const index = Math.floor(Math.random() * MISSIONS.length);
    return MISSIONS[index];
  }, []);

  // Show mission after idle time
  useEffect(() => {
    if (!isAuthenticated || dismissed) return;

    let idleTimer: ReturnType<typeof setTimeout>;
    let lastActivity = Date.now();

    const resetIdle = () => {
      lastActivity = Date.now();
      if (isVisible && !accepting) {
        setIsVisible(false);
      }
    };

    const checkIdle = () => {
      if (Date.now() - lastActivity >= idleTimeMs && !isVisible) {
        setCurrentMission(pickRandomMission());
        setIsVisible(true);
      }
    };

    // Initial mission after idle timeout
    idleTimer = setTimeout(() => {
      setCurrentMission(pickRandomMission());
      setIsVisible(true);
    }, idleTimeMs);

    const interval = setInterval(checkIdle, 5000);

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('touchstart', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('scroll', resetIdle);

    return () => {
      clearTimeout(idleTimer);
      clearInterval(interval);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('touchstart', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('scroll', resetIdle);
    };
  }, [isAuthenticated, idleTimeMs, isVisible, dismissed, pickRandomMission, accepting]);

  // Glow pulse loop while visible
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => setGlowPulse(true), 2000);
    return () => clearTimeout(timer);
  }, [isVisible]);

  const handleAction = () => {
    setAccepting(true);
  };

  const handleAcceptComplete = () => {
    if (currentMission?.path) {
      setLocation(currentMission.path);
    }
    if (currentMission?.type === 'invite') {
      navigator.clipboard.writeText(`${window.location.origin}/?ref=invite`);
    }
    setAccepting(false);
    setIsVisible(false);
    setGlowPulse(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    setGlowPulse(false);
    // Re-enable after 2 minutes
    setTimeout(() => setDismissed(false), 120000);
  };

  return (
    <AnimatePresence>
      {isVisible && currentMission && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.85, rotateX: 15 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, y: 60, scale: 0.9, rotateX: 10 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed bottom-24 right-4 z-40 w-72"
          style={{ perspective: '800px' }}
        >
          <motion.div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)',
              border: `1px solid ${currentMission.color}40`,
              boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${currentMission.color}20`,
            }}
            animate={glowPulse ? {
              boxShadow: [
                `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${currentMission.color}20`,
                `0 10px 40px rgba(0,0,0,0.5), 0 0 35px ${currentMission.color}40`,
                `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${currentMission.color}20`,
              ],
            } : {}}
            transition={glowPulse ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
          >
            {/* Scanline entrance effect */}
            <ScanlineEffect color={currentMission.color} />

            {/* Accept celebration overlay */}
            <AnimatePresence>
              {accepting && (
                <AcceptCelebration color={currentMission.color} onComplete={handleAcceptComplete} />
              )}
            </AnimatePresence>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-700 transition z-10"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>

            {/* Mission badge with icon pulse */}
            <div className="flex items-center gap-2 mb-3 relative z-[1]">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Zap className="w-3 h-3 text-orange-400" />
              </motion.div>
              <span className="text-orange-400 text-[10px] font-bold tracking-widest uppercase">Mission Available</span>
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-orange-400 ml-auto"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>

            {/* Content */}
            <div className="flex items-start gap-3 relative z-[1]">
              <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative"
                style={{ background: `${currentMission.color}15`, border: `1px solid ${currentMission.color}30` }}
                animate={glowPulse ? {
                  boxShadow: [
                    `0 0 0px ${currentMission.color}00`,
                    `0 0 12px ${currentMission.color}50`,
                    `0 0 0px ${currentMission.color}00`,
                  ],
                } : {}}
                transition={glowPulse ? { duration: 2, repeat: Infinity } : {}}
              >
                <currentMission.icon className="w-5 h-5" style={{ color: currentMission.color }} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {currentMission.title}
                </h4>
                <p className="text-gray-500 text-xs mt-0.5">{currentMission.description}</p>
              </div>
            </div>

            {/* Reward + Action */}
            <div className="flex items-center justify-between mt-3 relative z-[1]">
              <motion.div
                className="flex items-center gap-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Flame className="w-3 h-3" style={{ color: currentMission.color }} />
                <span className="text-xs font-bold" style={{ color: currentMission.color }}>
                  +{currentMission.reward} FT
                </span>
              </motion.div>

              <motion.button
                onClick={handleAction}
                disabled={accepting}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold text-white transition relative overflow-hidden"
                style={{ background: currentMission.color }}
                whileHover={{ scale: 1.05, boxShadow: `0 0 15px ${currentMission.color}50` }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                {/* Button shimmer */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: 1 }}
                />
                <span className="relative z-10">{currentMission.action}</span>
                <ChevronRight className="w-3 h-3 relative z-10" />
              </motion.button>
            </div>

            {/* Bottom urgency bar */}
            <motion.div
              className="mt-3 h-0.5 rounded-full overflow-hidden"
              style={{ background: '#2A2A2A' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: currentMission.color }}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 30, ease: 'linear' }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
