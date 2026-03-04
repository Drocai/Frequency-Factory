import React, { useState, useEffect, useRef } from 'react';
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
import MissionGenerator from '@/components/MissionGenerator';
import FoundingSlotsCounter from '@/components/FoundingSlotsCounter';
import { trpc } from '@/lib/trpc';
import { supabase, getAnonUserId } from '@/lib/supabase';
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

const isDirectAudioUrl = (url?: string | null) => {
  if (!url) return false;
  const u = url.trim().toLowerCase();
  return (
    u.includes("supabase.co/storage") ||
    u.endsWith(".mp3") ||
    u.endsWith(".wav") ||
    u.endsWith(".ogg") ||
    u.endsWith(".m4a")
  );
};

const isStreamingPlatformUrl = (url?: string | null) => {
  if (!url) return false;
  const u = url.trim().toLowerCase();
  return (
    u.includes("youtube.com") ||
    u.includes("youtu.be") ||
    u.includes("open.spotify.com") ||
    u.includes("soundcloud.com")
  );
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
        {(() => {
          const url = track.streamingLink?.trim();
          if (!url) return <StaticWaveform />;
          if (isDirectAudioUrl(url)) {
            return (
              <audio controls preload="none" style={{ width: "100%" }}>
                <source src={url} />
              </audio>
            );
          }
          if (isStreamingPlatformUrl(url)) {
            return <StreamingPlayer url={url} height={80} showControls={true} />;
          }
          return <StaticWaveform />;
        })()}
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

  // Fetch tracks from Supabase
  const [tracks, setTracks] = useState<any[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);

  const fetchTracks = async () => {
    setTracksLoading(true);
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setTracks(
        data.map((t: any) => ({
          id: t.id,
          artistName: t.artist_name || t.artist || "Unknown",
          trackTitle: t.track_title || t.title || "Untitled",
          artist_image: t.artist_image || t.cover_url,
          cover_art: t.cover_url || t.cover_art,
          streamingLink: t.streaming_link || t.audio_url,
          genre: t.genre,
          likes: t.like_count || 0,
          commentsCount: t.comment_count || 0,
          avgHookStrength: t.avg_hook,
          avgOriginality: t.avg_originality,
          avgProductionQuality: t.avg_production,
          totalCertifications: t.rating_count || 0,
        }))
      );
    }
    setTracksLoading(false);
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  // Fetch user profile via tRPC (auth-adjacent, uses Phase 0 API)
  const { data: profile, refetch: refetchProfile } = trpc.user.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Daily bonus — placeholder until Phase 3 (Supabase Edge Functions)
  const dailyBonusClaimed = useRef(false);

  useEffect(() => {
    if (isAuthenticated && profile && !dailyBonusClaimed.current) {
      dailyBonusClaimed.current = true;
      // TODO: Phase 3 — call Supabase Edge Function for daily bonus
    }
  }, [isAuthenticated, profile]);

  // Check if user needs to select avatar
  useEffect(() => {
    if (isAuthenticated && profile && !profile.hasCompletedOnboarding) {
      // Redirect to avatar selection
      setLocation('/avatar');
    }
  }, [isAuthenticated, profile, setLocation]);

  // Note: Daily bonus claim removed (Phase 3 — Supabase Edge Functions)

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

    // Toggle like in Supabase (Phase 3 will add a proper likes table)
    // For now, just update UI optimistically
    toast.success(isCurrentlyLiked ? "Removed like" : "Liked!");
  };

  const handlePredictionSubmit = async (trackId: number, scores: any) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to certify tracks');
      return;
    }

    // Save rating to Supabase (unified with Listen.tsx rating system)
    const userId = user?.id?.toString() || getAnonUserId();
    const { error } = await supabase.from("ratings").upsert(
      {
        track_id: trackId,
        user_id: userId,
        rating: Math.max(
          1,
          Math.min(
            5,
            Math.round(
              (scores.hookStrength +
                scores.originality +
                scores.productionQuality +
                (scores.vibe ?? 50)) /
                80
            )
          )
        ),
        hook_strength: scores.hookStrength,
        production_quality: scores.productionQuality,
        originality: scores.originality,
        vibe: scores.vibe ?? 50,
      },
      { onConflict: "track_id,user_id" }
    );

    if (error) {
      toast.error("Failed to submit prediction");
    } else {
      toast.success("Prediction locked! +5 FT earned");
      fetchTracks();
    }

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

      {/* Founding Artist CTA */}
      {isAuthenticated && (
        <div className="px-4 pt-2 pb-4">
          <FoundingSlotsCounter remaining={42} total={100} compact />
        </div>
      )}

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

      {/* Mission Generator — ROI-driven engagement CTA */}
      <MissionGenerator isAuthenticated={isAuthenticated} idleTimeMs={30000} />
    </div>
  );
}
