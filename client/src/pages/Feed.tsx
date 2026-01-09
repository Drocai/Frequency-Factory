import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, MessageCircle, Menu, Play, Pause, X
} from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import NotificationCenter from '@/components/NotificationCenter';
import QuencyChat from '@/components/QuencyChat';
import PredictionModal from '@/components/PredictionModal';
import CommentsModal from '@/components/CommentsModal';

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

// WaveSurfer Player Component with gradient waveform
const WaveSurferPlayer = React.memo(({ audioUrl }: { audioUrl: string }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wsInstanceRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!waveformRef.current) return;
    if (wsInstanceRef.current) wsInstanceRef.current.destroy();
    
    // Create gradient canvas for waveform
    const ctx = document.createElement('canvas').getContext('2d');
    let gradient: CanvasGradient | string = '#FF6B35';
    if (ctx) {
      gradient = ctx.createLinearGradient(0, 0, 300, 0);
      gradient.addColorStop(0, '#FF4500');
      gradient.addColorStop(0.5, '#FF6B35');
      gradient.addColorStop(0.75, '#8B00FF');
      gradient.addColorStop(1, '#1E90FF');
    }

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      url: audioUrl,
      height: 50,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      waveColor: gradient,
      progressColor: '#FFFFFF',
      cursorColor: 'transparent',
      cursorWidth: 0,
      interact: true,
    });
    
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));
    wsInstanceRef.current = ws;
    
    return () => ws.destroy();
  }, [audioUrl]);

  const handlePlayPause = () => wsInstanceRef.current?.playPause();

  return (
    <div className="relative cursor-pointer" onClick={handlePlayPause}>
      <div ref={waveformRef} className="w-full" />
      {!isPlaying && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 backdrop-blur-sm">
          <Play className="w-6 h-6 text-white" fill="white" />
        </div>
      )}
    </div>
  );
});
WaveSurferPlayer.displayName = 'WaveSurferPlayer';

// Static waveform visualization (when no audio URL)
const StaticWaveform = () => (
  <div className="h-12 flex items-end justify-center gap-[2px] px-2">
    {Array.from({ length: 60 }).map((_, i) => {
      const height = Math.sin(i * 0.3) * 20 + Math.random() * 15 + 10;
      const hue = 20 + (i / 60) * 280; // Orange to blue gradient
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

// Track Card Component matching mockup
const TrackCard = ({ 
  track, 
  onPredictClick, 
  onCommentClick,
  onLike,
  hasPredicted,
  isLiked 
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
        {/* Artist Photo with ring */}
        <div 
          className="w-14 h-14 rounded-full p-[3px]"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
          }}
        >
          <img 
            src={track.artist_image || track.cover_art || '/assets/logo-crown.png'} 
            alt={track.artist_name}
            className="w-full h-full rounded-full object-cover bg-gray-800"
            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/logo-crown.png'; }}
          />
        </div>
        
        {/* Artist Name & Track Title */}
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg">{track.artist_name}</h3>
          <p className="text-gray-400 text-sm">{track.track_title}</p>
        </div>

        {/* Certified Badge */}
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

      {/* Waveform */}
      <div className="mb-4">
        {track.audio_url ? (
          <WaveSurferPlayer audioUrl={track.audio_url} />
        ) : (
          <StaticWaveform />
        )}
      </div>

      {/* Engagement Row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-6">
          {/* Like Button */}
          <button 
            onClick={() => onLike(track.id)}
            className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition"
          >
            <Heart 
              className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
            />
            <span className="text-sm">{formatCount(track.likes || 0)}</span>
          </button>
          
          {/* Comment Button */}
          <button 
            onClick={() => onCommentClick(track)}
            className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{formatCount(track.comments_count || 0)}</span>
          </button>
        </div>

        {/* Certify Button */}
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

// Format large numbers (1200 -> 1.2K)
const formatCount = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Token Balance Badge
const TokenBadge = ({ balance }: { balance: number }) => (
  <div 
    className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-sm"
    style={{ 
      background: colors.gray800, 
      border: `1px solid ${colors.gray700}`,
      color: colors.white,
    }}
  >
    <span>{balance}</span>
    <span className="text-orange-400">FT</span>
  </div>
);

// Main Feed Component
export default function Feed() {
  const [userId, setUserId] = useState<string>('demo-user-' + Date.now());
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [commentTrack, setCommentTrack] = useState<any>(null);
  const [userPredictions, setUserPredictions] = useState<Set<number>>(new Set());
  const [userLikes, setUserLikes] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState(50);

  useEffect(() => {
    // Check for saved avatar, redirect if not set
    const savedAvatar = localStorage.getItem('selectedAvatar');
    if (!savedAvatar) {
      // For now, just continue - can redirect to /avatar later
    }

    // Fetch tracks
    const fetchTracks = async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching tracks:', error);
      } else {
        setTracks(data || []);
      }
      setIsLoading(false);
    };

    fetchTracks();

    // Real-time subscription for new tracks
    const subscription = supabase
      .channel('tracks_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => {
        fetchTracks();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handlePredictClick = (track: any) => {
    setSelectedTrack(track);
  };

  const handleCommentClick = (track: any) => {
    setCommentTrack(track);
  };

  const handleLike = async (trackId: number) => {
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

    setTracks(prev => prev.map(t => 
      t.id === trackId 
        ? { ...t, likes: (t.likes || 0) + (isCurrentlyLiked ? -1 : 1) }
        : t
    ));

    // Update in database
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      await supabase
        .from('submissions')
        .update({ likes: (track.likes || 0) + (isCurrentlyLiked ? -1 : 1) })
        .eq('id', trackId);
    }
  };

  const handlePredictionSubmit = (trackId: number, scores: any) => {
    setUserPredictions(prev => new Set(prev).add(trackId));
    setTokenBalance(prev => prev + 5); // Award tokens for prediction
    toast.success('Prediction locked! +5 FT earned');
  };

  return (
    <div 
      className="min-h-screen flex flex-col pb-24"
      style={{ background: colors.gray900 }}
    >
      {/* Header - matching mockup */}
      <header 
        className="sticky top-0 z-40 p-4 flex items-center justify-between"
        style={{ background: colors.gray900 }}
      >
        {/* Menu */}
        <button className="p-2 -ml-2">
          <Menu className="w-6 h-6 text-gray-400" />
        </button>

        {/* Logo */}
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

        {/* Token Balance & Notifications */}
        <div className="flex items-center gap-2">
          <TokenBadge balance={tokenBalance} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-2">
        {/* Section Header */}
        <h2 className="text-white font-semibold text-xl px-4 mb-4">
          Personalized feed
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : tracks.length > 0 ? (
          <div>
            {tracks.map(track => (
              <TrackCard 
                key={track.id} 
                track={track} 
                onPredictClick={handlePredictClick}
                onCommentClick={handleCommentClick}
                onLike={handleLike}
                hasPredicted={userPredictions.has(track.id)}
                isLiked={userLikes.has(track.id)}
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
            userId={userId} 
          />
        )}
      </AnimatePresence>

      {/* Comments Modal */}
      <AnimatePresence>
        {commentTrack && (
          <CommentsModal
            track={commentTrack}
            onClose={() => setCommentTrack(null)}
            userId={userId}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav activeTab="home" />

      {/* QUENCY AI Chat */}
      <QuencyChat />
    </div>
  );
}
