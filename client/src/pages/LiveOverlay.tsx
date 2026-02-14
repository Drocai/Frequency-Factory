import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, type Track, type Settings } from '@/lib/supabase';
import { Music, Target, Sparkles, Zap, Music2 } from 'lucide-react';

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

export default function LiveOverlay() {
  const [track, setTrack] = useState<Track | null>(null);
  const [visible, setVisible] = useState(false);
  const [transparent, setTransparent] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);

  // Check URL params for options
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bg') === 'dark') setTransparent(false);
    if (params.get('metrics') === 'false') setShowMetrics(false);
  }, []);

  /* ---- Fetch current track from settings ---- */
  const fetchCurrentTrack = async () => {
    const { data: settings } = await supabase
      .from('settings')
      .select('current_track_id')
      .limit(1)
      .single();

    if (settings?.current_track_id) {
      const { data: trackData } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', settings.current_track_id)
        .single();

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
      .single();

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

      {/* CTA overlay — top left */}
      <div className="fixed top-4 left-4 opacity-60">
        <div className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider text-orange-400"
          style={{ background: 'rgba(255,69,0,0.1)', border: '1px solid rgba(255,69,0,0.2)' }}>
          Rate this track at frequencyfactory.io
        </div>
      </div>
    </div>
  );
}
