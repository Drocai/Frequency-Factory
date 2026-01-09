import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Music, BarChart3, Award, Users, Settings,
  TrendingUp, TrendingDown, Play, Eye, Heart, MessageCircle,
  ChevronRight, ArrowLeft
} from 'lucide-react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

const colors = {
  primary: '#FF4500',
  primaryLight: '#FF6B35',
  teal: '#14B8A6',
  blue: '#1E90FF',
  purple: '#8B00FF',
  gray900: '#0A0A0A',
  gray800: '#1A1A1A',
  gray700: '#2A2A2A',
  gray600: '#3A3A3A',
  white: '#FFFFFF',
  textSecondary: '#A0A0A0',
};

interface Track {
  id: number;
  track_title: string;
  genre: string;
  plays: number;
  likes: number;
  comments_count: number;
  status: string;
  submitted_at: string;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Music, label: 'Tracks', id: 'tracks' },
  { icon: BarChart3, label: 'Analytics', id: 'analytics' },
  { icon: Award, label: 'Rewards', id: 'rewards' },
  { icon: Users, label: 'Community', id: 'community' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

// Stat Card Component
const StatCard = ({ 
  label, 
  value, 
  change, 
  icon: Icon,
  color 
}: { 
  label: string; 
  value: string | number; 
  change?: number;
  icon: React.ElementType;
  color: string;
}) => (
  <div 
    className="p-4 rounded-xl"
    style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}
  >
    <div className="flex items-center justify-between mb-3">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: `${color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-gray-400 text-sm">{label}</p>
  </div>
);

// Track Row Component
const TrackRow = ({ track }: { track: Track }) => (
  <div 
    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-700/50 transition cursor-pointer"
    style={{ background: colors.gray800 }}
  >
    <div 
      className="w-12 h-12 rounded-lg flex items-center justify-center"
      style={{ background: colors.gray700 }}
    >
      <Music className="w-6 h-6 text-gray-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white font-medium truncate">{track.track_title}</p>
      <p className="text-gray-400 text-sm">{track.genre}</p>
    </div>
    <div className="flex items-center gap-4 text-sm text-gray-400">
      <div className="flex items-center gap-1">
        <Play className="w-4 h-4" />
        <span>{track.plays || 0}</span>
      </div>
      <div className="flex items-center gap-1">
        <Heart className="w-4 h-4" />
        <span>{track.likes || 0}</span>
      </div>
      <div className="flex items-center gap-1">
        <MessageCircle className="w-4 h-4" />
        <span>{track.comments_count || 0}</span>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-gray-500" />
  </div>
);

// Simple Bar Chart Component
const SimpleBarChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-2">
          <motion.div
            className="w-full rounded-t-lg"
            style={{ background: item.color }}
            initial={{ height: 0 }}
            animate={{ height: `${(item.value / maxValue) * 100}%` }}
            transition={{ delay: index * 0.1 }}
          />
          <span className="text-xs text-gray-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// Demographics Pie
const DemographicsPie = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  return (
    <div className="flex items-center gap-6">
      {/* Simple representation */}
      <div className="flex-1 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ background: item.color }}
            />
            <span className="text-gray-300 text-sm flex-1">{item.label}</span>
            <span className="text-white font-medium">{Math.round((item.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ArtistDashboard() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState({
    totalPlays: 0,
    totalLikes: 0,
    totalComments: 0,
    tokenBalance: 125,
    tracksSubmitted: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(10);

      if (data) {
        setTracks(data);
        setStats({
          totalPlays: data.reduce((sum, t) => sum + (t.plays || 0), 0),
          totalLikes: data.reduce((sum, t) => sum + (t.likes || 0), 0),
          totalComments: data.reduce((sum, t) => sum + (t.comments_count || 0), 0),
          tokenBalance: 125,
          tracksSubmitted: data.length,
        });
      }
    };

    fetchData();
  }, []);

  const weeklyData = [
    { label: 'Mon', value: 120, color: colors.primary },
    { label: 'Tue', value: 180, color: colors.primary },
    { label: 'Wed', value: 150, color: colors.primary },
    { label: 'Thu', value: 220, color: colors.primary },
    { label: 'Fri', value: 280, color: colors.primaryLight },
    { label: 'Sat', value: 350, color: colors.primaryLight },
    { label: 'Sun', value: 310, color: colors.primaryLight },
  ];

  const demographicsData = [
    { label: '18-24', value: 35, color: colors.primary },
    { label: '25-34', value: 40, color: colors.blue },
    { label: '35-44', value: 15, color: colors.purple },
    { label: '45+', value: 10, color: colors.teal },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: colors.gray900 }}>
      {/* Sidebar */}
      <aside 
        className="w-64 p-4 hidden md:flex flex-col"
        style={{ background: colors.gray800, borderRight: `1px solid ${colors.gray700}` }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/assets/frequency-crown.png" alt="FF" className="w-10 h-10" />
          <div>
            <h1 className="text-lg font-bold text-white">Frequency</h1>
            <p className="text-xs text-gray-400">Artist Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
                style={isActive ? { background: `${colors.primary}20`, color: colors.primary } : {}}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Back to Feed */}
        <button
          onClick={() => setLocation('/feed')}
          className="flex items-center gap-2 px-4 py-3 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Feed</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, Artist!</h1>
            <p className="text-gray-400">Here's what's happening with your tracks</p>
          </div>
          <div 
            className="px-4 py-2 rounded-lg font-bold"
            style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}
          >
            <span className="text-white">{stats.tokenBalance}</span>
            <span className="text-orange-400 ml-1">FT</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            label="Total Plays" 
            value={stats.totalPlays.toLocaleString()} 
            change={12}
            icon={Play}
            color={colors.primary}
          />
          <StatCard 
            label="Total Likes" 
            value={stats.totalLikes.toLocaleString()} 
            change={8}
            icon={Heart}
            color={colors.teal}
          />
          <StatCard 
            label="Comments" 
            value={stats.totalComments.toLocaleString()} 
            change={-3}
            icon={MessageCircle}
            color={colors.blue}
          />
          <StatCard 
            label="Tracks Submitted" 
            value={stats.tracksSubmitted} 
            icon={Music}
            color={colors.purple}
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Performance */}
          <div 
            className="p-6 rounded-xl"
            style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}
          >
            <h3 className="text-lg font-bold text-white mb-4">Weekly Performance</h3>
            <SimpleBarChart data={weeklyData} />
          </div>

          {/* Listener Demographics */}
          <div 
            className="p-6 rounded-xl"
            style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}
          >
            <h3 className="text-lg font-bold text-white mb-4">Listener Demographics</h3>
            <DemographicsPie data={demographicsData} />
          </div>
        </div>

        {/* Recent Tracks */}
        <div 
          className="p-6 rounded-xl"
          style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Your Tracks</h3>
            <button 
              onClick={() => setLocation('/submit')}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: colors.teal, color: colors.white }}
            >
              Submit New Track
            </button>
          </div>
          
          <div className="space-y-2">
            {tracks.length > 0 ? (
              tracks.map(track => (
                <TrackRow key={track.id} track={track} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No tracks submitted yet</p>
                <button 
                  onClick={() => setLocation('/submit')}
                  className="mt-4 px-6 py-2 rounded-lg font-medium"
                  style={{ background: colors.primary, color: colors.white }}
                >
                  Submit Your First Track
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Token Earnings */}
        <div 
          className="mt-6 p-6 rounded-xl"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.purple}20 100%)`,
            border: `1px solid ${colors.gray700}`,
          }}
        >
          <h3 className="text-lg font-bold text-white mb-4">Token Earnings</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">+50</p>
              <p className="text-gray-400 text-sm">From Submissions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">+45</p>
              <p className="text-gray-400 text-sm">From Predictions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">+30</p>
              <p className="text-gray-400 text-sm">From Comments</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
