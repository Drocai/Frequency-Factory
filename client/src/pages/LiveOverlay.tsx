import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

// Design system colors
const colors = {
  primary: '#FF4500',
  primaryLight: '#FF6B35',
  blueToken: '#1E90FF',
  gray900: '#0A0A0A',
  gray800: '#1A1A1A',
  gray700: '#2A2A2A',
  white: '#FFFFFF',
  textSecondary: '#A0A0A0',
};

interface Track {
  id: number;
  artist_name: string;
  track_title: string;
  genre: string;
  cover_art?: string;
}

interface Prediction {
  id: number;
  user_name: string;
  prediction_value: number;
  created_at: string;
}

// Now Playing Card
const NowPlayingCard = ({ track }: { track: Track | null }) => (
  <motion.div
    className="p-4 rounded-xl"
    style={{ 
      background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
      border: `2px solid ${colors.primary}`,
      boxShadow: `0 0 30px rgba(255, 69, 0, 0.3)`,
    }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center gap-4">
      {/* Frequency Factory Logo */}
      <div 
        className="w-16 h-16 rounded-lg flex items-center justify-center"
        style={{ background: colors.gray700, border: `1px solid ${colors.gray800}` }}
      >
        <img src="/assets/frequency-crown.png" alt="FF" className="w-12 h-12" />
      </div>

      {/* Track Info */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-white tracking-wide">
          {track?.artist_name || 'ARTIST NAME'}
        </h2>
        <p className="text-gray-400">
          {track?.track_title || 'Track Title'} — {track?.genre || 'Genre'}
        </p>
      </div>
    </div>

    {/* Gradient bar */}
    <div 
      className="h-1 mt-4 rounded-full"
      style={{
        background: 'linear-gradient(90deg, #FF4500 0%, #FF6B35 30%, #8B00FF 70%, #1E90FF 100%)',
      }}
    />
  </motion.div>
);

// Queue Card
const QueueCard = ({ tracks }: { tracks: Track[] }) => (
  <motion.div
    className="p-4 rounded-xl"
    style={{ 
      background: 'rgba(26, 26, 26, 0.9)',
      border: `1px solid ${colors.gray700}`,
    }}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
  >
    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      Up Next
    </h3>
    <div className="space-y-2">
      {tracks.slice(0, 5).map((track, index) => (
        <div key={track.id} className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 w-4">{index + 1}</span>
          <span className="text-white truncate flex-1">{track.artist_name}</span>
          <span className="text-gray-400 truncate">{track.track_title}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

// Live Predictions Card
const LivePredictionsCard = ({ predictions }: { predictions: Prediction[] }) => (
  <motion.div
    className="p-4 rounded-xl"
    style={{ 
      background: 'rgba(26, 26, 26, 0.9)',
      border: `1px solid ${colors.gray700}`,
    }}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
  >
    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
      Live Predictions
    </h3>
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {predictions.slice(0, 5).map((pred) => (
          <motion.div
            key={pred.id}
            className="flex items-center justify-between text-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <span className="text-gray-400">{pred.user_name}</span>
            <span 
              className="font-bold"
              style={{ color: colors.primaryLight }}
            >
              {pred.prediction_value}/10
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  </motion.div>
);

// Top Predictors Leaderboard
const LeaderboardCard = ({ leaders }: { leaders: { name: string; score: number; tokens: number }[] }) => (
  <motion.div
    className="p-4 rounded-xl"
    style={{ 
      background: 'rgba(26, 26, 26, 0.9)',
      border: `1px solid ${colors.gray700}`,
    }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <h3 className="text-lg font-bold text-white mb-3">🏆 Top Predictors</h3>
    <div className="space-y-2">
      {leaders.map((leader, index) => (
        <div key={leader.name} className="flex items-center gap-3 text-sm">
          <span 
            className="w-6 h-6 rounded-full flex items-center justify-center font-bold"
            style={{ 
              background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.gray700,
              color: index < 3 ? '#000' : '#fff',
            }}
          >
            {index + 1}
          </span>
          <span className="text-white flex-1">{leader.name}</span>
          <span className="text-gray-400">{leader.tokens} FT</span>
        </div>
      ))}
    </div>
  </motion.div>
);

export default function LiveOverlay() {
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [leaders, setLeaders] = useState([
    { name: 'BeatMaster', score: 95, tokens: 1250 },
    { name: 'SynthQueen', score: 92, tokens: 980 },
    { name: 'DJ_Pulse', score: 88, tokens: 750 },
    { name: 'AudioPhreak', score: 85, tokens: 620 },
    { name: 'Freq_Factory', score: 82, tokens: 540 },
  ]);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      const { data: tracks } = await supabase
        .from('submissions')
        .select('*')
        .eq('status', 'approved')
        .order('submitted_at', { ascending: true })
        .limit(10);

      if (tracks && tracks.length > 0) {
        setNowPlaying(tracks[0]);
        setQueue(tracks.slice(1));
      }
    };

    fetchData();

    // Subscribe to real-time predictions
    const subscription = supabase
      .channel('live_predictions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'predictions' }, (payload) => {
        const newPrediction: Prediction = {
          id: payload.new.id,
          user_name: 'Anonymous',
          prediction_value: payload.new.prediction_value?.score || 7,
          created_at: payload.new.created_at,
        };
        setPredictions(prev => [newPrediction, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div 
      className="min-h-screen p-6"
      style={{ 
        background: 'transparent', // Transparent for OBS
        fontFamily: 'Rajdhani, Inter, sans-serif',
      }}
    >
      {/* Main Layout - positioned for overlay */}
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Now Playing - Bottom of screen */}
        <div className="fixed bottom-6 left-6 right-6 max-w-2xl">
          <NowPlayingCard track={nowPlaying} />
        </div>

        {/* Side panels */}
        <div className="fixed top-6 right-6 w-64 space-y-4">
          <QueueCard tracks={queue} />
          <LivePredictionsCard predictions={predictions} />
        </div>

        <div className="fixed top-6 left-6 w-64">
          <LeaderboardCard leaders={leaders} />
        </div>
      </div>

      {/* Frequency Factory Watermark */}
      <div className="fixed bottom-2 right-2 text-xs text-gray-600">
        Frequency Factory © 2026
      </div>
    </div>
  );
}
