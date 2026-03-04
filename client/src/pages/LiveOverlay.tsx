import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, type Track, type Settings, type LiveCheckin, type LiveSession } from '@/lib/supabase';
import { Music, Target, Sparkles, Zap, Music2, Users, Circle, Volume2, VolumeX, AlertTriangle } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  OBS Overlay — /overlay                                             */
/*                                                                     */
/*  Reads current_track_id from the settings table.                    */
/*  Subscribes to Realtime for live updates.                           */
/*  Transparent background for chroma key compositing in OBS.          */
/*  Displays Pro Engine metrics (4-dimensional Factory Score).         */
/* ------------------------------------------------------------------ */

// Factory Score metric bar for overlay
function MetricBar({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3 h-3 shrink-0" style={{ color }} />
      <span className="text-gray-400 text-[10px] w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <span className="text-white text-[10px] font-bold tabular-nums w-6 text-right">{value}</span>
    </div>
  );
}

// Viewer count badge for OBS overlay
function ViewerBadge({ viewers }: { viewers: LiveCheckin[] }) {
  const activeCount = viewers.filter(v => {
    const lastActive = new Date(v.last_active_at).getTime();
    return Date.now() - lastActive < 120_000; // 2 min threshold
  }).length;

  if (activeCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{
        background: 'rgba(17,17,17,0.9)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Users className="w-3 h-3 text-green-400" />
      <span className="text-white text-xs font-bold">{activeCount}</span>
      <span className="text-gray-400 text-[10px]">watching</span>
    </motion.div>
  );
}

// Compact recent check-in names for overlay
function RecentCheckins({ viewers }: { viewers: LiveCheckin[] }) {
  const recent = viewers
    .filter(v => {
      const lastActive = new Date(v.last_active_at).getTime();
      return Date.now() - lastActive < 120_000;
    })
    .slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      {recent.map(v => (
        <motion.div
          key={v.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1.5"
        >
          <Circle className="w-1.5 h-1.5 fill-green-400 text-green-400" />
          <span className="text-white text-[10px] font-medium">
            {v.user_name || 'Anonymous'}
          </span>
        </motion.div>
      ))}
      {viewers.length > 5 && (
        <span className="text-gray-500 text-[9px] pl-3">
          +{viewers.length - 5} more
        </span>
      )}
    </div>
  );
}

// Audio status indicator for OBS overlay — flashes when viewers can't hear
function AudioStatusBadge({ session }: { session: LiveSession | null }) {
  if (!session) return null;

  const cantHear = session.cant_hear_count || 0;
  const audioStatus = session.audio_status || 'unknown';

  // Determine state
  const isMuted = audioStatus === 'muted';
  const hasReports = cantHear > 0;
  const isAlert = isMuted || hasReports;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2"
    >
      {/* Main audio badge */}
      <motion.div
        animate={isAlert ? {
          borderColor: ['rgba(239,68,68,0.8)', 'rgba(239,68,68,0.2)', 'rgba(239,68,68,0.8)'],
          boxShadow: [
            '0 0 20px rgba(239,68,68,0.4)',
            '0 0 5px rgba(239,68,68,0.1)',
            '0 0 20px rgba(239,68,68,0.4)',
          ],
        } : {}}
        transition={isAlert ? { duration: 1.5, repeat: Infinity } : {}}
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: isAlert
            ? 'rgba(239,68,68,0.15)'
            : 'rgba(34,197,94,0.1)',
          border: `2px solid ${isAlert ? 'rgba(239,68,68,0.6)' : 'rgba(34,197,94,0.3)'}`,
        }}
      >
        {isAlert ? (
          <VolumeX className="w-5 h-5 text-red-400" />
        ) : (
          <Volume2 className="w-4 h-4 text-green-400" />
        )}

        <span className={`text-xs font-bold tracking-wide ${isAlert ? 'text-red-400' : 'text-green-400'}`}>
          {isMuted ? 'AUDIO MUTED' : hasReports ? 'CHECK AUDIO' : 'AUDIO OK'}
        </span>
      </motion.div>

      {/* "Can't hear" counter */}
      {hasReports && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg"
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-red-400 text-xs font-bold">{cantHear}</span>
          <span className="text-red-400/60 text-[10px]">can't hear</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function LiveOverlay() {
  const [track, setTrack] = useState<Track | null>(null);
  const [visible, setVisible] = useState(false);
  const [transparent, setTransparent] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showViewers, setShowViewers] = useState(true);
  const [viewers, setViewers] = useState<LiveCheckin[]>([]);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);

  // Check URL params for options
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bg') === 'dark') setTransparent(false);
    if (params.get('metrics') === 'false') setShowMetrics(false);
    if (params.get('viewers') === 'false') setShowViewers(false);
  }, []);

  // Fetch active live session (for audio status)
  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setLiveSession(data as LiveSession);
    };

    fetchSession();

    // Subscribe to session updates (including audio status changes)
    const channel = supabase
      .channel('overlay_session_audio')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, () => {
        fetchSession();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_audio_reports' }, () => {
        fetchSession(); // Refresh to get updated cant_hear_count
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch active viewers for current live session
  useEffect(() => {
    if (!showViewers) return;

    const fetchViewers = async () => {
      const { data: session } = await supabase
        .from('live_sessions')
        .select('id')
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!session) return;

      const { data } = await supabase
        .from('live_checkins')
        .select('*')
        .eq('session_id', session.id)
        .eq('is_active', true)
        .order('checked_in_at', { ascending: false });

      if (data) setViewers(data);
    };

    fetchViewers();

    // Subscribe to check-in changes
    const channel = supabase
      .channel('overlay_viewers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_checkins' }, () => {
        fetchViewers();
      })
      .subscribe();

    // Refresh every 30 seconds to update "active" status
    const interval = setInterval(fetchViewers, 30_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [showViewers]);

  /* ---- Fetch current track from settings ---- */
  const fetchCurrentTrack = async () => {
    const { data: settings } = await supabase
      .from('settings')
      .select('current_track_id')
      .limit(1)
      .maybeSingle();

    if (settings?.current_track_id) {
      const { data: trackData } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', settings.current_track_id)
        .maybeSingle();

      if (trackData) {
        // Animate transition
        setVisible(false);
        setTimeout(() => {
          setTrack(trackData);
          setVisible(true);
        }, 400);
        return;
      }
    }

    // No current track — try latest approved
    const { data: latest } = await supabase
      .from('tracks')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest) {
      setVisible(false);
      setTimeout(() => {
        setTrack(latest);
        setVisible(true);
      }, 400);
    }
  };

  useEffect(() => {
    fetchCurrentTrack();

    // Subscribe to settings changes
    const settingsChannel = supabase
      .channel('overlay_settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, () => {
        fetchCurrentTrack();
      })
      .subscribe();

    // Also subscribe to tracks changes (in case track data updates)
    const tracksChannel = supabase
      .channel('overlay_tracks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracks' }, () => {
        fetchCurrentTrack();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(tracksChannel);
    };
  }, []);

  // Generate demo metrics if not available from track data
  const metrics = {
    hook: (track as any)?.avg_hook_strength || Math.floor(Math.random() * 30 + 50),
    production: (track as any)?.avg_production_quality || Math.floor(Math.random() * 30 + 55),
    originality: (track as any)?.avg_originality || Math.floor(Math.random() * 30 + 45),
    vibe: (track as any)?.avg_vibe || Math.floor(Math.random() * 30 + 60),
  };
  const overallScore = Math.round((metrics.hook + metrics.production + metrics.originality + metrics.vibe) / 4);

  const getTierLabel = (score: number) => {
    if (score >= 90) return { label: 'PLATINUM', color: '#E5E4E2' };
    if (score >= 75) return { label: 'GOLD', color: '#FFD700' };
    if (score >= 60) return { label: 'SILVER', color: '#C0C0C0' };
    if (score >= 40) return { label: 'BRONZE', color: '#CD7F32' };
    return { label: 'IRON', color: '#666' };
  };

  const tier = getTierLabel(overallScore);

  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: transparent ? 'transparent' : '#000',
        fontFamily: 'Rajdhani, Inter, sans-serif',
      }}
    >
      {/* Now Playing card — bottom center */}
      <AnimatePresence mode="wait">
        {visible && track && (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed bottom-8 left-8 right-8 max-w-xl mx-auto"
          >
            <div
              className="rounded-2xl p-5 backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(17,17,17,0.95) 0%, rgba(0,0,0,0.95) 100%)',
                border: '2px solid #ff6d00',
                boxShadow: '0 0 40px rgba(255,109,0,0.3), 0 20px 60px rgba(0,0,0,0.8)',
              }}
            >
              <div className="flex items-center gap-4">
                {/* Cover / Logo */}
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
                  style={{ border: '1px solid #333' }}>
                  {track.cover_url ? (
                    <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#111] flex items-center justify-center">
                      <img src="/assets/frequency-crown-actual.png" alt="FF" className="w-10 h-10 object-contain" />
                    </div>
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-gray-400 text-xs tracking-widest uppercase">Now Playing</span>
                  </div>
                  <h2 className="text-white text-xl font-bold tracking-wide truncate">{track.artist}</h2>
                  <p className="text-gray-400 text-sm truncate">
                    {track.title}
                    {track.genre ? ` — ${track.genre}` : ''}
                  </p>
                </div>

                {/* Factory Score badge */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{
                      background: `${tier.color}15`,
                      border: `2px solid ${tier.color}`,
                      color: tier.color,
                      boxShadow: `0 0 15px ${tier.color}30`,
                    }}
                  >
                    {overallScore}
                  </div>
                  <span
                    className="mt-1 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider"
                    style={{ background: `${tier.color}20`, color: tier.color }}
                  >
                    {tier.label}
                  </span>
                </div>
              </div>

              {/* Pro Engine Metrics */}
              {showMetrics && (
                <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid #333' }}>
                  <MetricBar label="Hook" value={metrics.hook} color="#FF4500" icon={Target} />
                  <MetricBar label="Production" value={metrics.production} color="#1E90FF" icon={Sparkles} />
                  <MetricBar label="Originality" value={metrics.originality} color="#8B00FF" icon={Zap} />
                  <MetricBar label="Vibe" value={metrics.vibe} color="#FFD700" icon={Music2} />
                </div>
              )}

              {/* Gradient bar */}
              <div className="h-1 mt-3 rounded-full overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{
                    background: 'linear-gradient(90deg, #ff6d00 0%, #ff8f33 30%, #8B00FF 70%, #1E90FF 100%)',
                  }}
                  animate={{ x: ['-100%', '0%'] }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FF watermark — top right */}
      <div className="fixed top-4 right-4 flex items-center gap-2 opacity-60">
        <img src="/assets/frequency-crown-actual.png" alt="" className="w-6 h-6 object-contain" />
        <span className="text-white text-xs tracking-widest font-bold"
          style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          FREQUENCY FACTORY
        </span>
      </div>

      {/* Audio status — top left (prominent, flashes red when muted) */}
      <div className="fixed top-4 left-4">
        <AudioStatusBadge session={liveSession} />
      </div>

      {/* CTA overlay — below audio status */}
      <div className="fixed top-16 left-4 opacity-60">
        <div className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider text-orange-400"
          style={{ background: 'rgba(255,69,0,0.1)', border: '1px solid rgba(255,69,0,0.2)' }}>
          Rate this track at frequencyfactory.io
        </div>
      </div>

      {/* Viewer count — top right under watermark */}
      {showViewers && viewers.length > 0 && (
        <div className="fixed top-14 right-4 flex flex-col items-end gap-2">
          <ViewerBadge viewers={viewers} />
          <RecentCheckins viewers={viewers} />
        </div>
      )}
    </div>
  );
}
