import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Users, Share2, Star, Gift, X, ChevronRight, Zap } from 'lucide-react';
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

interface MissionGeneratorProps {
  isAuthenticated: boolean;
  idleTimeMs?: number;
}

export default function MissionGenerator({ isAuthenticated, idleTimeMs = 30000 }: MissionGeneratorProps) {
  const [, setLocation] = useLocation();
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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
      if (isVisible) {
        setIsVisible(false);
      }
    };

    const checkIdle = () => {
      if (Date.now() - lastActivity >= idleTimeMs && !isVisible) {
        setCurrentMission(pickRandomMission());
        setIsVisible(true);
      }
    };

    // Initial mission after shorter delay
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
  }, [isAuthenticated, idleTimeMs, isVisible, dismissed, pickRandomMission]);

  const handleAction = () => {
    if (currentMission?.path) {
      setLocation(currentMission.path);
    }
    if (currentMission?.type === 'invite') {
      navigator.clipboard.writeText(`${window.location.origin}/?ref=invite`);
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    // Re-enable after 2 minutes
    setTimeout(() => setDismissed(false), 120000);
  };

  return (
    <AnimatePresence>
      {isVisible && currentMission && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-24 right-4 z-40 w-72"
        >
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)',
              border: `1px solid ${currentMission.color}40`,
              boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${currentMission.color}20`,
            }}
          >
            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-700 transition"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>

            {/* Mission badge */}
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3 h-3 text-orange-400" />
              <span className="text-orange-400 text-[10px] font-bold tracking-widest uppercase">Mission Available</span>
            </div>

            {/* Content */}
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${currentMission.color}15`, border: `1px solid ${currentMission.color}30` }}
              >
                <currentMission.icon className="w-5 h-5" style={{ color: currentMission.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {currentMission.title}
                </h4>
                <p className="text-gray-500 text-xs mt-0.5">{currentMission.description}</p>
              </div>
            </div>

            {/* Reward + Action */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs font-bold" style={{ color: currentMission.color }}>
                +{currentMission.reward} FT
              </span>
              <button
                onClick={handleAction}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition hover:brightness-110"
                style={{ background: currentMission.color }}
              >
                {currentMission.action}
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
