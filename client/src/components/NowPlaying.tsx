import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Star, ThumbsUp, ThumbsDown, Users } from 'lucide-react';
import { supabase, getAnonUserId } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NowPlayingData {
  id: string;
  artist_name: string;
  track_title: string;
  cover_url: string | null;
  track_id: string | null;
  started_at: string;
}

interface TrackRating {
  average_rating: number | null;
  rating_count: number;
  total_rating: number;
}

// ---------------------------------------------------------------------------
// NowPlaying component
// ---------------------------------------------------------------------------

export default function NowPlaying() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [trackRating, setTrackRating] = useState<TrackRating | null>(null);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [offline, setOffline] = useState(false);

  // Fetch now_playing data
  const fetchNowPlaying = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://waapstehyslrjuqnthyj.supabase.co'}/rest/v1/now_playing?select=*&order=started_at.desc&limit=1`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Accept-Profile': 'public',
          },
        }
      );
      const data = await response.json();
      // PostgREST returns an object with a "message" key on table-not-found errors
      if (Array.isArray(data) && data.length > 0) {
        setNowPlaying(data[0]);
        setOffline(false);
      } else if (Array.isArray(data) && data.length === 0) {
        // Table exists but is empty — show offline state
        setOffline(true);
      } else {
        // Table doesn't exist yet or API error — show offline
        setOffline(true);
      }
    } catch {
      setOffline(true);
    }
  }, []);

  // Resolve the track_id from the tracks table by matching artist + title
  const resolveTrackId = useCallback(async (np: NowPlayingData) => {
    if (np.track_id) {
      setTrackId(np.track_id);
      return;
    }
    try {
      const { data } = await supabase
        .from('tracks')
        .select('id')
        .eq('artist', np.artist_name)
        .eq('title', np.track_title)
        .limit(1)
        .single();
      if (data) setTrackId(data.id);
    } catch {
      setTrackId(null);
    }
  }, []);

  // Fetch current track rating from tracks table
  const fetchTrackRating = useCallback(async (id: string) => {
    try {
      const { data } = await supabase
        .from('tracks')
        .select('average_rating, rating_count, total_rating')
        .eq('id', id)
        .single();
      if (data) setTrackRating(data);
    } catch {
      // ignore
    }
  }, []);

  // Check if user already rated this track
  const checkUserRating = useCallback((id: string) => {
    const key = `ff_rated_${id}`;
    const stored = localStorage.getItem(key);
    if (stored) setUserRating(parseInt(stored, 10));
    else setUserRating(null);
  }, []);

  // Poll now_playing every 10 seconds
  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

  // Subscribe to Supabase Realtime for now_playing changes
  useEffect(() => {
    const channel = supabase
      .channel('now-playing-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'now_playing' },
        (payload) => {
          if (payload.new) {
            setNowPlaying(payload.new as NowPlayingData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Subscribe to Realtime for tracks table rating changes
  useEffect(() => {
    if (!trackId) return;
    const channel = supabase
      .channel(`track-rating-${trackId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tracks', filter: `id=eq.${trackId}` },
        (payload) => {
          if (payload.new) {
            setTrackRating({
              average_rating: payload.new.average_rating,
              rating_count: payload.new.rating_count,
              total_rating: payload.new.total_rating,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId]);

  // When now_playing changes, resolve track and check rating
  useEffect(() => {
    if (!nowPlaying) return;
    resolveTrackId(nowPlaying);
  }, [nowPlaying, resolveTrackId]);

  useEffect(() => {
    if (!trackId) return;
    fetchTrackRating(trackId);
    checkUserRating(trackId);
  }, [trackId, fetchTrackRating, checkUserRating]);

  // Pulsing LIVE indicator
  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 1500);
    return () => clearInterval(interval);
  }, []);

  // Submit a rating (1-5 stars)
  const submitRating = async (rating: number) => {
    if (!trackId || saving || userRating !== null) return;
    setSaving(true);

    const userId = getAnonUserId();
    const { error } = await supabase.from('ratings').upsert(
      { track_id: trackId, user_id: userId, rating },
      { onConflict: 'track_id,user_id' }
    );

    if (!error) {
      setUserRating(rating);
      localStorage.setItem(`ff_rated_${trackId}`, rating.toString());
      // Refresh rating data
      fetchTrackRating(trackId);
    }
    setSaving(false);
  };

  // Show offline banner when stream isn't running or table doesn't exist
  if (!nowPlaying && offline) {
    return (
      <div
        className="rounded-2xl p-4 md:p-5"
        style={{
          background: 'linear-gradient(135deg, #111 0%, #0a0a0a 100%)',
          border: '1px solid #222',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-1.5">
            <span className="block w-2.5 h-2.5 rounded-full" style={{ background: '#555' }} />
            <span className="text-xs font-bold tracking-widest text-gray-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              OFFLINE
            </span>
          </div>
          <Radio className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-gray-600 text-xs">Stream starting soon...</span>
        </div>
      </div>
    );
  }

  if (!nowPlaying) return null;

  const isOffline = nowPlaying.artist_name === 'Frequency Factory';
  const displayRating = hoverRating ?? userRating;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div
        className="rounded-2xl p-4 md:p-5"
        style={{
          background: 'linear-gradient(135deg, #111 0%, #0a0a0a 100%)',
          border: '1px solid #222',
          boxShadow: '0 0 40px rgba(255, 69, 0, 0.08)',
        }}
      >
        {/* Header with LIVE badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center gap-1.5">
              <span
                className="block w-2.5 h-2.5 rounded-full transition-opacity duration-700"
                style={{
                  background: '#FF4500',
                  opacity: pulse ? 1 : 0.3,
                  boxShadow: pulse ? '0 0 8px rgba(255, 69, 0, 0.6)' : 'none',
                }}
              />
              <span
                className="text-xs font-bold tracking-widest"
                style={{ color: '#FF4500', fontFamily: 'Rajdhani, sans-serif' }}
              >
                LIVE
              </span>
            </div>
            <Radio className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-gray-600 text-xs">24/7 Stream</span>
          </div>
          {trackRating && trackRating.rating_count > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5" />
              <span>{trackRating.rating_count} vote{trackRating.rating_count !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Track info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={nowPlaying.track_title + nowPlaying.artist_name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4"
          >
            {/* Cover art or placeholder */}
            <div
              className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: '#1a1a1a', border: '1px solid #333' }}
            >
              {nowPlaying.cover_url ? (
                <img src={nowPlaying.cover_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #FF450020, #FF6B3520)',
                  }}
                >
                  <Radio className="w-6 h-6 text-orange-500/50" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base md:text-lg truncate">
                {nowPlaying.track_title}
              </p>
              <p className="text-gray-400 text-sm truncate">
                {nowPlaying.artist_name}
              </p>

              {/* Live average rating display */}
              {trackRating && trackRating.rating_count > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="w-3 h-3"
                      style={{
                        color: s <= Math.round(trackRating.average_rating ?? 0) ? '#FFD700' : '#333',
                        fill: s <= Math.round(trackRating.average_rating ?? 0) ? '#FFD700' : 'transparent',
                      }}
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">
                    {(trackRating.average_rating ?? 0).toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Rating UI — only show for real tracks, not the "offline" placeholder */}
        {!isOffline && trackId && (
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid #1a1a1a' }}>
            {userRating !== null ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">Your rating:</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="w-4 h-4"
                      style={{
                        color: s <= userRating ? '#FFD700' : '#333',
                        fill: s <= userRating ? '#FFD700' : 'transparent',
                      }}
                    />
                  ))}
                </div>
                <span className="text-orange-400 text-xs font-medium">Thanks!</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-xs shrink-0">Rate this track:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => submitRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(null)}
                      disabled={saving}
                      className="p-1 rounded transition-transform hover:scale-125 disabled:opacity-50"
                    >
                      <Star
                        className="w-5 h-5 transition-colors"
                        style={{
                          color: displayRating !== null && s <= displayRating ? '#FFD700' : '#444',
                          fill: displayRating !== null && s <= displayRating ? '#FFD700' : 'transparent',
                        }}
                      />
                    </button>
                  ))}
                </div>
                {/* Quick thumbs */}
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => submitRating(5)}
                    disabled={saving}
                    className="p-1.5 rounded-lg hover:bg-green-500/10 transition disabled:opacity-50"
                    title="Fire!"
                  >
                    <ThumbsUp className="w-4 h-4 text-green-500" />
                  </button>
                  <button
                    onClick={() => submitRating(1)}
                    disabled={saving}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition disabled:opacity-50"
                    title="Not for me"
                  >
                    <ThumbsDown className="w-4 h-4 text-red-500/60" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
