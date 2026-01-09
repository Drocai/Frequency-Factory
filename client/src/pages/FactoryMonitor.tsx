import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, LogIn } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';

// Design system colors
const colors = {
  primary: '#FF4500',
  primaryLight: '#FF6B35',
  blueToken: '#1E90FF',
  teal: '#14B8A6',
  gray900: '#0A0A0A',
  gray800: '#1A1A1A',
  gray700: '#2A2A2A',
  gray600: '#3A3A3A',
  white: '#FFFFFF',
  textSecondary: '#A0A0A0',
};

interface QueueItem {
  id: number;
  position: number;
  artistName: string;
  trackTitle: string;
  genre: string;
  eta: string;
  ticket: string;
  status: 'queued' | 'up_next' | 'processing' | 'done';
}

// Stat Card Component
const StatCard = ({ label, value, subLabel }: { label: string; value: string | number; subLabel?: string }) => (
  <div 
    className="flex-1 p-3 rounded-lg text-center"
    style={{ background: colors.gray700, border: `1px solid ${colors.gray600}` }}
  >
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-gray-400">{label}</p>
    {subLabel && <p className="text-xs text-gray-500">{subLabel}</p>}
  </div>
);

// Queue Row Component
const QueueRow = ({ 
  item, 
  onSkip, 
  userTokens, 
  isAuthenticated,
  isSkipping 
}: { 
  item: QueueItem; 
  onSkip: (id: number) => void; 
  userTokens: number;
  isAuthenticated: boolean;
  isSkipping: boolean;
}) => {
  const statusColors = {
    queued: colors.gray600,
    up_next: colors.blueToken,
    processing: colors.primary,
    done: '#10B981',
  };

  const canSkip = isAuthenticated && userTokens >= 10 && item.status === 'queued';

  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-lg mb-2"
      style={{ background: colors.gray700, border: `1px solid ${colors.gray600}` }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Position */}
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
        style={{ background: colors.gray800, border: `2px solid ${statusColors[item.status]}` }}
      >
        {item.position}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{item.artistName}</p>
        <p className="text-gray-400 text-sm truncate">{item.trackTitle}</p>
      </div>

      {/* ETA */}
      <div className="text-center px-2">
        <p className="text-white text-sm">{item.eta}</p>
        <p className="text-gray-500 text-xs">ETA</p>
      </div>

      {/* Lane/Genre */}
      <div className="hidden sm:block text-center px-2">
        <p className="text-gray-400 text-xs">{item.genre}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button 
          className="p-2 rounded-lg text-gray-400 hover:text-white transition"
          style={{ background: colors.gray800 }}
        >
          <ExternalLink className="w-4 h-4" />
        </button>
        
        {item.status === 'queued' && (
          <motion.button
            onClick={() => onSkip(item.id)}
            disabled={!canSkip || isSkipping}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ 
              background: canSkip ? colors.teal : colors.gray600,
              color: canSkip ? colors.white : colors.textSecondary,
              cursor: canSkip ? 'pointer' : 'not-allowed',
              opacity: isSkipping ? 0.7 : 1,
            }}
            whileHover={canSkip && !isSkipping ? { scale: 1.05 } : {}}
            whileTap={canSkip && !isSkipping ? { scale: 0.95 } : {}}
          >
            {isSkipping ? 'Skipping...' : 'Pay for Skip'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default function FactoryMonitor() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [highlightMine, setHighlightMine] = useState(false);
  const [skipsPurchased, setSkipsPurchased] = useState(0);

  // Fetch queue from tRPC
  const { data: queueData, refetch: refetchQueue } = trpc.submissions.getQueue.useQuery();

  // Fetch user profile for token balance
  const { data: profile, refetch: refetchProfile } = trpc.user.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Skip queue mutation
  const skipMutation = trpc.submissions.skipQueue.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Skip purchased! You moved up in the queue. -10 FT');
        setSkipsPurchased(prev => prev + 1);
        refetchQueue();
        refetchProfile();
      } else if (data.error === 'insufficient_balance') {
        toast.error('Not enough tokens! Need 10 FT to skip.');
      }
    },
    onError: (error) => {
      toast.error('Failed to skip: ' + error.message);
    },
  });

  // Transform queue data
  const queue: QueueItem[] = (queueData || []).map((item: any, index: number) => ({
    id: item.id,
    position: index + 1,
    artistName: item.artistName,
    trackTitle: item.trackTitle,
    genre: item.genre || 'Unknown',
    eta: `${Math.floor((index + 1) * 3.5)}:00`,
    ticket: item.ticketNumber || `#${1000 + item.id}`,
    status: index === 0 ? 'processing' : index < 3 ? 'up_next' : 'queued',
  }));

  const userTokens = profile?.tokenBalance ?? 0;

  const stats = {
    nowPlaying: queue.length > 0 ? `${queue[0].artistName} - ${queue[0].trackTitle}`.slice(0, 30) : '—',
    avgWait: queue.length > 0 ? `${Math.floor(queue.length * 3.5 / 2)}:00` : '—',
    skipsPurchased,
    weekendSpots: 5,
  };

  const handleSkip = async (trackId: number) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to skip queue');
      return;
    }

    if (userTokens < 10) {
      toast.error('Not enough tokens! Need 10 FT to skip.');
      return;
    }

    skipMutation.mutate({ submissionId: trackId });
  };

  return (
    <div className="min-h-screen flex flex-col pb-20" style={{ background: colors.gray900 }}>
      {/* Header */}
      <header className="p-4 flex items-center justify-between" style={{ background: colors.gray800 }}>
        <button onClick={() => setLocation('/feed')} className="p-2">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">Factory Monitor</h1>
          <span 
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{ background: colors.teal, color: colors.white }}
          >
            Queue {queue.length}
          </span>
        </div>
        {isAuthenticated ? (
          <div 
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{ background: colors.gray700, color: colors.white }}
          >
            {userTokens} FT
          </div>
        ) : (
          <a href={getLoginUrl()}>
            <Button size="sm" variant="outline" className="text-orange-400 border-orange-400 hover:bg-orange-400/10">
              <LogIn className="w-4 h-4 mr-1" />
              Sign In
            </Button>
          </a>
        )}
      </header>

      {/* Stats Row */}
      <div className="p-4 flex gap-2 overflow-x-auto">
        <StatCard label="Now Playing" value={stats.nowPlaying === '—' ? '—' : '▶'} />
        <StatCard label="Avg Wait" value={stats.avgWait} subLabel="(mm:ss)" />
        <StatCard label="Skips Purchased" value={stats.skipsPurchased} subLabel="Today" />
        <StatCard label="Weekend Bracket" value={stats.weekendSpots} subLabel="Spots Left" />
      </div>

      {/* Login Prompt for non-authenticated users */}
      {!isAuthenticated && (
        <div className="mx-4 mb-4 p-4 rounded-xl" style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}>
          <p className="text-gray-300 text-sm mb-3">Sign in to skip queue and manage your submissions!</p>
          <a href={getLoginUrl()}>
            <Button className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In (10 FT to Skip)
            </Button>
          </a>
        </div>
      )}

      {/* Conveyor Order Explanation */}
      <div className="mx-4 p-3 rounded-lg" style={{ background: colors.gray800 }}>
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Conveyor Order (left → right): <span className="text-gray-300">queued</span> · 
            <span className="text-blue-400"> up next</span> · 
            <span className="text-orange-400"> processing</span> · 
            <span className="text-green-400"> done</span>
          </p>
          <button 
            onClick={() => setHighlightMine(!highlightMine)}
            className="px-3 py-1 rounded text-sm"
            style={{ 
              background: highlightMine ? colors.teal : colors.gray700,
              color: colors.white,
            }}
          >
            Highlight my entry
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 p-4 overflow-y-auto">
        {queue.length > 0 ? (
          <>
            {/* Table Header */}
            <div className="flex items-center gap-3 px-3 py-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
              <div className="w-10">#</div>
              <div className="flex-1">Artist / Track</div>
              <div className="w-16 text-center">ETA</div>
              <div className="hidden sm:block w-20 text-center">Lane</div>
              <div className="w-32 text-center">Action</div>
            </div>

            {/* Queue Items */}
            {queue.map(item => (
              <QueueRow 
                key={item.id} 
                item={item} 
                onSkip={handleSkip}
                userTokens={userTokens}
                isAuthenticated={isAuthenticated}
                isSkipping={skipMutation.isPending}
              />
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No tracks in queue</p>
            <button 
              onClick={() => setLocation('/submit')}
              className="mt-4 px-6 py-3 rounded-lg font-bold"
              style={{ background: colors.teal, color: colors.white }}
            >
              Submit Your Track
            </button>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="p-4 text-center text-gray-500 text-xs">
        ETAs are estimates. Skips move you forward but do not replace or kick others—just reorders fairly.
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="monitor" />
    </div>
  );
}
