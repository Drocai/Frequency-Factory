import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Menu, LogIn, Share2 } from 'lucide-react';
import { useLocation } from 'wouter';
import StreamingPlayer from '@/components/StreamingPlayer';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import QuencyChat from '@/components/QuencyChat';
import PredictionModal from '@/components/PredictionModal';
import CommentsModal from '@/components/CommentsModal';
import ShareModal from '@/components/ShareModal';
import DailyBonusModal from '@/components/DailyBonusModal';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';

// Design system colors
const colors = {
  primary: '#FF4500',
  primaryLight: '#FF6B35',
  blueToken: '#1E90FF',
  purpleToken: '#8B00FF',
  goldToken: '#FFD700',
  gray900: '#0A0A0A',
  gray800: '#1A1A1A',
  gray700: '#2A2A2A',
  white: '#FFFFFF',
  textSecondary: '#A0A0A0',
  gradientCard: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)',
  glowRedStrong: '0 0 20px rgba(255, 69, 0, 0.8), 0 0 40px rgba(255, 69, 0, 0.6)',
  gradientPrimary: 'linear-gradient(135deg, #FF4500 0%, #FF6B35 100%)',
};

// Static waveform visualization (when no audio URL)
const StaticWaveform = () => (
  <div className="h-12 flex items-end justify-center gap-[2px] px-2">
    {Array.from({ length: 60 }).map((_, i) => {
      const height = Math.sin(i * 0.3) * 20 + Math.random() * 15 + 10;
      const hue = 20 + (i / 60) * 280;
      return (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            height: `${height}px`,
            background: `hsl(${hue}, 80%, 55%)`,
          }}
        />
      );
    })}
  </div>
);

// Track Card Component
const TrackCard = ({ 
  track, 
  onPredictClick, 
  onCommentClick,
  onShareClick,
  onLike,
  hasPredicted,
  isLiked,
  isAuthenticated,
}: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 rounded-2xl p-4 mb-4"
      style={{ 
        background: colors.gradientCard, 
        border: `1px solid ${colors.gray700}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Artist Info Row */}
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-14 h-14 rounded-full p-[3px]"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
          }}
        >
          <img 
            src={track.artist_image || track.cover_art || '/assets/logo-crown.png'} 
            alt={track.artistName}
            className="w-full h-full rounded-full object-cover bg-gray-800"
            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/logo-crown.png'; }}
          />
        </div>
        
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg">{track.artistName}</h3>
          <p className="text-gray-400 text-sm">{track.trackTitle}</p>
        </div>

        {hasPredicted && (
          <div 
            className="px-2 py-1 rounded text-xs font-bold"
            style={{ 
              background: 'linear-gradient(135deg, #0D7377 0%, #14FFEC 100%)',
              color: colors.white,
            }}
          >
            CERTIFIED
          </div>
        )}
      </div>

      {/* Audio Player */}
      <div className="mb-4">
        {track.streamingLink ? (
          <StreamingPlayer 
            url={track.streamingLink} 
            height={80}
            showControls={true}
          />
        ) : (
          <StaticWaveform />
        )}
      </div>

      {/* Engagement Row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-6">
          <button 
            onClick={() => onLike(track.id)}
            className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition"
          >
            <Heart 
              className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
            />
            <span className="text-sm">{formatCount(track.likes || 0)}</span>
          </button>
          
          <button 
            onClick={() => onCommentClick(track)}
            className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{formatCount(track.commentsCount || 0)}</span>
          </button>

          <button 
            onClick={() => onShareClick(track)}
            className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <motion.button
          onClick={() => onPredictClick(track)}
          disabled={hasPredicted}
          className="px-5 py-2 rounded-lg font-bold text-sm tracking-wider flex items-center gap-2"
          style={{ 
            background: hasPredicted 
              ? 'linear-gradient(135deg, #0D7377 0%, #14FFEC 100%)' 
              : colors.gradientPrimary,
            boxShadow: hasPredicted 
              ? '0 0 15px rgba(20, 255, 236, 0.4)' 
              : colors.glowRedStrong,
            color: colors.white,
          }}
          whileHover={{ scale: hasPredicted ? 1 : 1.05 }}
          whileTap={{ scale: hasPredicted ? 1 : 0.95 }}
        >
          {hasPredicted ? 'CERTIFIED ✓' : 'CERTIFY'}
        </motion.button>
      </div>
    </motion.div>
  );
};

const formatCount = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Token Balance Badge
const TokenBadge = ({ balance, onClick }: { balance: number; onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-gray-700 transition"
    style={{ 
      background: colors.gray800, 
      border: `1px solid ${colors.gray700}`,
      color: colors.white,
    }}
  >
    <span>{balance}</span>
    <span className="text-orange-400">FT</span>
  </button>
);

// Login Prompt Component
const LoginPrompt = () => (
  <div className="mx-4 mb-4 p-4 rounded-xl" style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}>
    <p className="text-gray-300 text-sm mb-3">Sign in to certify tracks, earn tokens, and save your progress!</p>
    <a href={getLoginUrl()}>
      <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
        <LogIn className="w-4 h-4 mr-2" />
        Sign In to Earn Tokens
      </Button>
    </a>
  </div>
);

// Main Feed Component
export default function Feed() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [commentTrack, setCommentTrack] = useState<any>(null);
  const [shareTrack, setShareTrack] = useState<any>(null);
  const [dailyBonusData, setDailyBonusData] = useState<any>(null);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [userPredictions, setUserPredictions] = useState<Set<number>>(new Set());
  const [userLikes, setUserLikes] = useState<Set<number>>(new Set());

  // Fetch submissions from tRPC
  const { data: tracks, isLoading: tracksLoading, refetch: refetchTracks } = trpc.submissions.list.useQuery({
    status: 'approved',
    limit: 20,
  });

  // Fetch user profile (token balance, etc.)
  const { data: profile, refetch: refetchProfile } = trpc.user.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch user's likes
  const { data: likesData } = trpc.likes.getUserLikes.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const likeMutation = trpc.likes.toggle.useMutation({
    onSuccess: () => {
      refetchTracks();
    },
  });

  const predictionMutation = trpc.predictions.create.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        refetchProfile();
        refetchTracks();
        toast.success('Prediction locked! +5 FT earned');
      } else if (data.error === 'already_predicted') {
        toast.error('You already certified this track');
      }
    },
    onError: () => {
      toast.error('Failed to submit prediction');
    },
  });

  // Daily bonus mutation
  const dailyBonusMutation = trpc.tokens.claimDailyBonus.useMutation({
    onSuccess: (data) => {
      if (data && !data.alreadyClaimed) {
        setDailyBonusData(data);
        setShowDailyBonus(true);
        refetchProfile();
      }
    },
  });

  // Update user likes when data changes
  useEffect(() => {
    if (likesData) {
      setUserLikes(new Set(likesData));
    }
  }, [likesData]);

  // Check if user needs to select avatar
  useEffect(() => {
    if (isAuthenticated && profile && !profile.hasCompletedOnboarding) {
      // Redirect to avatar selection
      setLocation('/avatar');
    }
  }, [isAuthenticated, profile, setLocation]);

  // Check for daily bonus on login
  useEffect(() => {
    if (isAuthenticated && profile?.hasCompletedOnboarding && !dailyBonusMutation.isPending) {
      dailyBonusMutation.mutate();
    }
  }, [isAuthenticated, profile, dailyBonusMutation]);

  const handlePredictClick = (track: any) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to certify tracks');
      return;
    }
    setSelectedTrack(track);
  };

  const handleCommentClick = (track: any) => {
    setCommentTrack(track);
  };

  const handleShareClick = (track: any) => {
    setShareTrack(track);
  };

  const handleLike = async (trackId: number) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like tracks');
      return;
    }

    const isCurrentlyLiked = userLikes.has(trackId);
    
    // Optimistic update
    setUserLikes(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });

    likeMutation.mutate({ submissionId: trackId });
  };

  const handlePredictionSubmit = async (trackId: number, scores: any) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to certify tracks');
      return;
    }

    predictionMutation.mutate({
      submissionId: trackId,
      hookStrength: scores.hookStrength,
      originality: scores.originality,
      productionQuality: scores.productionQuality,
    });

    setUserPredictions(prev => new Set(prev).add(trackId));
    setSelectedTrack(null);
  };

  const tokenBalance = profile?.tokenBalance ?? 50;
  const isLoading = authLoading || tracksLoading;

  return (
    <div 
      className="min-h-screen flex flex-col pb-24"
      style={{ background: colors.gray900 }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-40 p-4 flex items-center justify-between"
        style={{ background: colors.gray900 }}
      >
        <button className="p-2 -ml-2">
          <Menu className="w-6 h-6 text-gray-400" />
        </button>

        <div className="flex flex-col items-center">
          <img 
            src="/assets/frequency-crown.png" 
            alt="Frequency Factory" 
            className="w-10 h-10 mb-1"
          />
          <h1 
            className="text-lg font-bold tracking-widest"
            style={{ 
              color: colors.white,
              fontFamily: 'Rajdhani, sans-serif',
            }}
          >
            FREQUENCY FACTORY
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <TokenBadge 
              balance={tokenBalance} 
              onClick={() => setLocation('/rewards')}
            />
          ) : (
            <a href={getLoginUrl()}>
              <Button size="sm" variant="outline" className="text-orange-400 border-orange-400 hover:bg-orange-400/10">
                <LogIn className="w-4 h-4 mr-1" />
                Sign In
              </Button>
            </a>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-2">
        <h2 className="text-white font-semibold text-xl px-4 mb-4">
          {isAuthenticated ? 'Personalized feed' : 'Trending tracks'}
        </h2>

        {/* Login Prompt for non-authenticated users */}
        {!isAuthenticated && !authLoading && (
          <LoginPrompt />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : tracks && tracks.length > 0 ? (
          <div>
            {tracks.map((track: any) => (
              <TrackCard 
                key={track.id} 
                track={track} 
                onPredictClick={handlePredictClick}
                onCommentClick={handleCommentClick}
                onShareClick={handleShareClick}
                onLike={handleLike}
                hasPredicted={userPredictions.has(track.id)}
                isLiked={userLikes.has(track.id)}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500 text-lg mb-4">No tracks in the factory yet!</p>
            <p className="text-gray-600 text-sm">Be the first to submit a track</p>
          </div>
        )}
      </main>

      {/* Prediction Modal */}
      <AnimatePresence>
        {selectedTrack && (
          <PredictionModal 
            track={selectedTrack} 
            onClose={() => setSelectedTrack(null)} 
            onPredict={handlePredictionSubmit}
            userId={user?.id?.toString() || 'guest'} 
          />
        )}
      </AnimatePresence>

      {/* Comments Modal */}
      <AnimatePresence>
        {commentTrack && (
          <CommentsModal
            track={commentTrack}
            onClose={() => setCommentTrack(null)}
            userId={user?.id?.toString() || 'guest'}
          />
        )}
      </AnimatePresence>

      {/* Share Modal */}
      {shareTrack && (
        <ShareModal
          isOpen={!!shareTrack}
          onClose={() => setShareTrack(null)}
          track={{
            id: shareTrack.id,
            artistName: shareTrack.artistName,
            trackTitle: shareTrack.trackTitle,
            hookStrength: shareTrack.avgHookStrength,
            originality: shareTrack.avgOriginality,
            productionQuality: shareTrack.avgProductionQuality,
            totalCertifications: shareTrack.totalCertifications,
          }}
        />
      )}

      {/* Daily Bonus Modal */}
      <DailyBonusModal
        isOpen={showDailyBonus}
        onClose={() => setShowDailyBonus(false)}
        bonusData={dailyBonusData}
      />

      {/* Bottom Navigation */}
      <BottomNav activeTab="home" />

      {/* QUENCY AI Chat */}
      <QuencyChat />
    </div>
  );
}
