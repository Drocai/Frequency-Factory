import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Clock, Zap, Calendar, ExternalLink, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

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
  artist_name: string;
  track_title: string;
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
const QueueRow = ({ item, onSkip, userTokens }: { item: QueueItem; onSkip: (id: number) => void; userTokens: number }) => {
  const statusColors = {
    queued: colors.gray600,
    up_next: colors.blueToken,
    processing: colors.primary,
    done: '#10B981',
  };

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
        <p className="text-white font-medium truncate">{item.artist_name}</p>
        <p className="text-gray-400 text-sm truncate">{item.track_title}</p>
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
            disabled={userTokens < 10}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ 
              background: userTokens >= 10 ? colors.teal : colors.gray600,
              color: userTokens >= 10 ? colors.white : colors.textSecondary,
              cursor: userTokens >= 10 ? 'pointer' : 'not-allowed',
            }}
            whileHover={userTokens >= 10 ? { scale: 1.05 } : {}}
            whileTap={userTokens >= 10 ? { scale: 0.95 } : {}}
          >
            Pay for Skip
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default function FactoryMonitor() {
  const [, setLocation] = useLocation();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [userTokens, setUserTokens] = useState(50);
  const [stats, setStats] = useState({
    nowPlaying: '—',
    avgWait: '—',
    skipsPurchased: 0,
    weekendSpots: 5,
  });
  const [highlightMine, setHighlightMine] = useState(false);

  useEffect(() => {
    // Fetch queue from Supabase
    const fetchQueue = async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, artist_name, track_title, genre, submitted_at, status')
        .in('status', ['pending', 'approved'])
        .order('submitted_at', { ascending: true })
        .limit(20);

      if (data) {
        const queueItems: QueueItem[] = data.map((item, index) => ({
          id: item.id,
          position: index + 1,
          artist_name: item.artist_name,
          track_title: item.track_title,
          genre: item.genre || 'Unknown',
          eta: `${Math.floor((index + 1) * 3.5)}:00`,
          ticket: `#${1000 + item.id}`,
          status: index === 0 ? 'processing' : index < 3 ? 'up_next' : 'queued',
        }));
        setQueue(queueItems);

        if (queueItems.length > 0) {
          setStats(prev => ({
            ...prev,
            nowPlaying: `${queueItems[0].artist_name} - ${queueItems[0].track_title}`.slice(0, 30),
            avgWait: `${Math.floor(queueItems.length * 3.5 / 2)}:00`,
          }));
        }
      }
    };

    fetchQueue();

    // Set up real-time subscription
    const subscription = supabase
      .channel('queue_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => {
        fetchQueue();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSkip = async (trackId: number) => {
    if (userTokens < 10) {
      toast.error('Not enough tokens! Need 10 FT to skip.');
      return;
    }

    // Deduct tokens
    setUserTokens(prev => prev - 10);
    setStats(prev => ({ ...prev, skipsPurchased: prev.skipsPurchased + 1 }));

    // Move track up in queue (optimistic update)
    setQueue(prev => {
      const index = prev.findIndex(item => item.id === trackId);
      if (index > 1) {
        const newQueue = [...prev];
        const [item] = newQueue.splice(index, 1);
        newQueue.splice(1, 0, item); // Move to position 2 (after currently playing)
        return newQueue.map((q, i) => ({ ...q, position: i + 1 }));
      }
      return prev;
    });

    toast.success('Skip purchased! You moved up in the queue.');
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
        <div 
          className="px-3 py-1 rounded-full text-sm font-bold"
          style={{ background: colors.gray700, color: colors.white }}
        >
          {userTokens} FT
        </div>
      </header>

      {/* Stats Row */}
      <div className="p-4 flex gap-2 overflow-x-auto">
        <StatCard label="Now Playing" value={stats.nowPlaying === '—' ? '—' : '▶'} />
        <StatCard label="Avg Wait" value={stats.avgWait} subLabel="(mm:ss)" />
        <StatCard label="Skips Purchased" value={stats.skipsPurchased} subLabel="Today" />
        <StatCard label="Weekend Bracket" value={stats.weekendSpots} subLabel="Spots Left" />
      </div>

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
