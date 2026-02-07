import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, type Track, type Settings } from '@/lib/supabase';
import { Star, Music } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  OBS Overlay — /overlay                                             */
/*                                                                     */
/*  Reads current_track_id from the settings table.                    */
/*  Subscribes to Realtime for live updates.                           */
/*  Transparent background for chroma key compositing in OBS.          */
/* ------------------------------------------------------------------ */

export default function LiveOverlay() {
  const [track, setTrack] = useState<Track | null>(null);
  const [visible, setVisible] = useState(false);
  const [transparent, setTransparent] = useState(true);

  // Check URL params for options
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bg') === 'dark') setTransparent(false);
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

                {/* Rating badge */}
                {track.average_rating && (
                  <div className="flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(255,109,0,0.15)' }}>
                    <Star className="w-4 h-4 text-[#ff6d00]" fill="#ff6d00" />
                    <span className="text-white text-sm font-bold">{track.average_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Gradient bar */}
              <div className="h-1 mt-4 rounded-full overflow-hidden">
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
    </div>
  );
}
