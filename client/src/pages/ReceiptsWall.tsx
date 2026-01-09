import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, TrendingUp, Heart, Zap, Target, Crown,
  ArrowLeft, ExternalLink, Play
} from 'lucide-react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

const colors = {
  primary: '#FF4500',
  primaryLight: '#FF6B35',
  teal: '#14B8A6',
  blue: '#1E90FF',
  purple: '#8B00FF',
  gold: '#FFD700',
  gray900: '#0A0A0A',
  gray800: '#1A1A1A',
  gray700: '#2A2A2A',
  white: '#FFFFFF',
  textSecondary: '#A0A0A0',
};

interface CertifiedTrack {
  id: number;
  artist_name: string;
  track_title: string;
  genre: string;
  certified_at: string;
  metric: string;
  value: string;
  badge: 'gold' | 'silver' | 'bronze';
}

interface LeaderboardEntry {
  rank: number;
  artist_name: string;
  track_title: string;
  value: string;
  badge: 'gold' | 'silver' | 'bronze';
}

// Badge Component
const Badge = ({ type }: { type: 'gold' | 'silver' | 'bronze' }) => {
  const badgeColors = {
    gold: { bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', text: '#000' },
    silver: { bg: 'linear-gradient(135deg, #C0C0C0 0%, #A8A9AD 100%)', text: '#000' },
    bronze: { bg: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)', text: '#FFF' },
  };

  return (
    <div 
      className="w-8 h-8 rounded-full flex items-center justify-center"
      style={{ background: badgeColors[type].bg }}
    >
      <Trophy className="w-4 h-4" style={{ color: badgeColors[type].text }} />
    </div>
  );
};

// Leaderboard Card Component
const LeaderboardCard = ({ 
  title, 
  icon: Icon, 
  entries,
  accentColor 
}: { 
  title: string; 
  icon: React.ElementType;
  entries: LeaderboardEntry[];
  accentColor: string;
}) => (
  <div 
    className="p-4 rounded-xl"
    style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}
  >
    <div className="flex items-center gap-2 mb-4">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${accentColor}20` }}
      >
        <Icon className="w-4 h-4" style={{ color: accentColor }} />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
    </div>

    <div className="space-y-3">
      {entries.map((entry, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3 p-2 rounded-lg"
          style={{ background: colors.gray700 }}
        >
          <Badge type={entry.badge} />
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{entry.artist_name}</p>
            <p className="text-gray-400 text-sm truncate">{entry.track_title}</p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold">{entry.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// Featured Winner Card
const FeaturedWinner = ({ track }: { track: CertifiedTrack }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="relative p-6 rounded-2xl overflow-hidden"
    style={{ 
      background: `linear-gradient(135deg, ${colors.primary}30 0%, ${colors.purple}30 100%)`,
      border: `2px solid ${colors.gold}`,
    }}
  >
    {/* Crown decoration */}
    <div className="absolute top-0 right-0 p-4 opacity-20">
      <Crown className="w-24 h-24 text-yellow-500" />
    </div>

    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: colors.gold, color: '#000' }}
        >
          🏆 CERTIFIED WINNER
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-1">{track.artist_name}</h2>
      <p className="text-gray-300 mb-4">{track.track_title}</p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-400" />
          <span className="text-white">{track.metric}: <span className="font-bold">{track.value}</span></span>
        </div>
        <button 
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{ background: colors.teal, color: colors.white }}
        >
          <Play className="w-4 h-4" />
          Listen
        </button>
      </div>
    </div>
  </motion.div>
);

export default function ReceiptsWall() {
  const [, setLocation] = useLocation();
  const [featuredWinner, setFeaturedWinner] = useState<CertifiedTrack | null>(null);
  const [leaderboards, setLeaderboards] = useState({
    biggest48hLift: [] as LeaderboardEntry[],
    mostSaves: [] as LeaderboardEntry[],
    fastestTo1k: [] as LeaderboardEntry[],
    bestCTR: [] as LeaderboardEntry[],
  });

  useEffect(() => {
    // Fetch certified tracks
    const fetchData = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('status', 'approved')
        .order('likes', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        // Set featured winner
        setFeaturedWinner({
          id: data[0].id,
          artist_name: data[0].artist_name,
          track_title: data[0].track_title,
          genre: data[0].genre || 'Unknown',
          certified_at: data[0].submitted_at,
          metric: 'Total Certifications',
          value: `${data[0].likes || 0}`,
          badge: 'gold',
        });

        // Create leaderboard entries
        const createEntries = (tracks: any[], valueKey: string, suffix: string = ''): LeaderboardEntry[] => {
          return tracks.slice(0, 3).map((t, i) => ({
            rank: i + 1,
            artist_name: t.artist_name,
            track_title: t.track_title,
            value: `${t[valueKey] || Math.floor(Math.random() * 1000)}${suffix}`,
            badge: i === 0 ? 'gold' : i === 1 ? 'silver' : 'bronze' as const,
          }));
        };

        setLeaderboards({
          biggest48hLift: createEntries(data, 'likes', ' streams'),
          mostSaves: createEntries(data, 'likes', ' saves'),
          fastestTo1k: createEntries(data, 'likes', 'h'),
          bestCTR: createEntries(data, 'likes', '%'),
        });
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: colors.gray900 }}>
      {/* Header */}
      <header 
        className="p-4 flex items-center gap-4"
        style={{ background: colors.gray800, borderBottom: `1px solid ${colors.gray700}` }}
      >
        <button onClick={() => setLocation('/feed')} className="p-2">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Receipts Wall</h1>
          <p className="text-gray-400 text-sm">Certified winners & top performers</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Featured Winner */}
        {featuredWinner && (
          <FeaturedWinner track={featuredWinner} />
        )}

        {/* Leaderboards Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <LeaderboardCard
            title="Biggest 48h Lift"
            icon={TrendingUp}
            entries={leaderboards.biggest48hLift}
            accentColor={colors.primary}
          />
          <LeaderboardCard
            title="Most Saves"
            icon={Heart}
            entries={leaderboards.mostSaves}
            accentColor={colors.teal}
          />
          <LeaderboardCard
            title="Fastest to 1K"
            icon={Zap}
            entries={leaderboards.fastestTo1k}
            accentColor={colors.blue}
          />
          <LeaderboardCard
            title="Best CTR"
            icon={Target}
            entries={leaderboards.bestCTR}
            accentColor={colors.purple}
          />
        </div>

        {/* All-Time Hall of Fame */}
        <div 
          className="p-6 rounded-xl"
          style={{ 
            background: `linear-gradient(135deg, ${colors.gray800} 0%, ${colors.gray700} 100%)`,
            border: `1px solid ${colors.gray700}`,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-bold text-white">All-Time Hall of Fame</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Tracks that achieved legendary status in the Factory
          </p>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-white">127</p>
              <p className="text-gray-400 text-sm">Certified Tracks</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">45</p>
              <p className="text-gray-400 text-sm">Artists Featured</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">2.4M</p>
              <p className="text-gray-400 text-sm">Total Streams</p>
            </div>
          </div>
        </div>
      </main>

      <BottomNav activeTab="rewards" />
    </div>
  );
}
