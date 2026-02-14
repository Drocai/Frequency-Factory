import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { supabase, type Track, GENRES, getAnonUserId } from '@/lib/supabase';
import {
  Play, Pause, Music, Filter, ArrowUp, Target, Sparkles, Zap, Music2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  ProRatingBadge — replaces 5-star with Factory Metrics mini-view    */
/* ------------------------------------------------------------------ */

function ProRatingBadge({
  value,
  count,
  trackId,
  onRated,
}: {
  value: number | null;
  count: number;
  trackId: string;
  onRated: () => void;
}) {
  const [showQuickRate, setShowQuickRate] = useState(false);
  const [metrics, setMetrics] = useState({ hook: 50, production: 50, originality: 50, vibe: 50 });
  const [saving, setSaving] = useState(false);

  const overall = Math.round((metrics.hook + metrics.production + metrics.originality + metrics.vibe) / 4);

  const getTierColor = (score: number) => {
    if (score >= 75) return '#FFD700';
    if (score >= 60) return '#C0C0C0';
    if (score >= 40) return '#CD7F32';
    return '#666';
  };

  const rate = async () => {
    if (saving) return;
    setSaving(true);
    const userId = getAnonUserId();
    // Save as composite rating (overall score mapped to 1-5 for backwards compat)
    const mappedRating = Math.max(1, Math.min(5, Math.round(overall / 20)));
    const { error } = await supabase.from('ratings').upsert(
      { track_id: trackId, user_id: userId, rating: mappedRating },
      { onConflict: 'track_id,user_id' },
    );
    setSaving(false);
    if (!error) {
      setShowQuickRate(false);
      onRated();
    }
  };

  const tierColor = getTierColor(value ? value * 20 : overall);

  return (
    <div className="relative">
      {/* Score badge */}
      <button
        onClick={() => setShowQuickRate(!showQuickRate)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition hover:bg-[#222]"
        style={{ border: '1px solid #333' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: `${tierColor}20`,
            color: tierColor,
            border: `2px solid ${tierColor}`,
          }}
        >
          {value ? Math.round(value * 20) : '—'}
        </div>
        <div className="text-left">
          <div className="text-white text-xs font-semibold">Factory Score</div>
          <div className="text-gray-500 text-[10px]">{count} ratings</div>
        </div>
      </button>

      {/* Quick-rate dropdown */}
      <AnimatePresence>
        {showQuickRate && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-64 rounded-xl p-3 z-20 space-y-2"
            style={{ background: '#1A1A1A', border: '1px solid #333', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
          >
            <div className="text-xs text-gray-400 font-medium mb-2">Quick Rate</div>

            {[
              { key: 'hook', label: 'Hook', icon: Target, color: '#FF4500' },
              { key: 'production', label: 'Production', icon: Sparkles, color: '#1E90FF' },
              { key: 'originality', label: 'Originality', icon: Zap, color: '#8B00FF' },
              { key: 'vibe', label: 'Vibe', icon: Music2, color: '#FFD700' },
            ].map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="flex items-center gap-2">
                <Icon className="w-3 h-3 shrink-0" style={{ color }} />
                <span className="text-gray-400 text-[10px] w-16">{label}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={metrics[key as keyof typeof metrics]}
                  onChange={(e) => setMetrics(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="flex-1 h-1 rounded-full cursor-pointer appearance-none"
                  style={{
                    background: `linear-gradient(to right, ${color} 0%, ${color} ${metrics[key as keyof typeof metrics]}%, #333 ${metrics[key as keyof typeof metrics]}%, #333 100%)`,
                  }}
                />
                <span className="text-white text-[10px] font-bold w-6 text-right tabular-nums">
                  {metrics[key as keyof typeof metrics]}
                </span>
              </div>
            ))}

            <button
              onClick={rate}
              disabled={saving}
              className="w-full py-2 rounded-lg text-xs font-bold text-white mt-2"
              style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
            >
              {saving ? 'SAVING...' : `LOCK IN ${overall}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AudioPlayer (minimal)                                              */
/* ------------------------------------------------------------------ */

function AudioPlayer({ url }: { url: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    if (!ref.current) return;
    if (playing) {
      ref.current.pause();
    } else {
      ref.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={ref}
        src={url}
        onTimeUpdate={() => {
          if (ref.current) setProgress((ref.current.currentTime / (ref.current.duration || 1)) * 100);
        }}
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={toggle}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0"
        style={{
          background: playing ? '#ff6d00' : '#222',
          border: `1px solid ${playing ? '#ff6d00' : '#444'}`,
        }}
      >
        {playing ? <Pause className="w-4 h-4 text-black" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
      </button>
      <div className="flex-1 h-1.5 rounded-full bg-[#222] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progress}%`, background: '#ff6d00' }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TrackCard                                                          */
/* ------------------------------------------------------------------ */

function TrackCard({ track, onRated }: { track: Track; onRated: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden transition-all hover:ring-1 hover:ring-[#ff6d00]/40"
      style={{ background: '#111', border: '1px solid #222' }}
    >
      {/* Cover */}
      <div className="relative aspect-square bg-[#0a0a0a] flex items-center justify-center">
        {track.cover_url ? (
          <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <Music className="w-12 h-12 text-[#333]" />
        )}
        {track.genre && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/70 text-[#ff6d00] backdrop-blur-sm">
            {track.genre}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-white font-semibold truncate">{track.title}</h3>
          <p className="text-gray-500 text-sm truncate">{track.artist}</p>
        </div>

        <AudioPlayer url={track.audio_url} />

        <ProRatingBadge
          value={track.average_rating}
          count={track.rating_count}
          trackId={track.id}
          onRated={onRated}
        />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Listen (main)                                                      */
/* ------------------------------------------------------------------ */

export default function Listen() {
  const [, setLocation] = useLocation();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const fetchTracks = async () => {
    setLoading(true);
    let q = supabase.from('tracks').select('*').eq('status', 'approved').order('created_at', { ascending: false });
    if (genre) q = q.eq('genre', genre);
    const { data } = await q;
    setTracks(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTracks(); }, [genre]);

  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-[#222]"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation('/')}>
          <img src="/assets/frequency-crown-actual.png" alt="FF" className="w-8 h-8 object-contain" />
          <span className="text-white font-bold tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            FREQUENCY FACTORY
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`p-2 rounded-lg transition ${showFilter ? 'bg-[#ff6d00] text-black' : 'bg-[#222] text-gray-400 hover:text-white'}`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLocation('/')}
            className="px-4 py-2 rounded-lg text-sm font-bold text-black transition"
            style={{ background: '#ff6d00' }}
          >
            <ArrowUp className="w-4 h-4 inline mr-1 -mt-0.5" />
            Submit
          </button>
        </div>
      </nav>

      {/* Genre Filter */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-[#222]"
            style={{ background: '#0a0a0a' }}
          >
            <div className="px-6 py-4 flex flex-wrap gap-2">
              <button
                onClick={() => setGenre('')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  genre === '' ? 'bg-[#ff6d00] text-black' : 'bg-[#222] text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    genre === g ? 'bg-[#ff6d00] text-black' : 'bg-[#222] text-gray-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-3xl text-white font-bold tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          APPROVED TRACKS
        </h1>
        <p className="text-gray-500 text-sm mt-1">{tracks.length} tracks{genre ? ` in ${genre}` : ''}</p>
      </div>

      {/* Grid */}
      <div className="px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#ff6d00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-20">
            <Music className="w-12 h-12 text-[#333] mx-auto mb-4" />
            <p className="text-gray-500">No approved tracks yet{genre ? ` in ${genre}` : ''}.</p>
            <button
              onClick={() => setLocation('/')}
              className="mt-4 px-6 py-3 rounded-lg text-sm font-bold text-black"
              style={{ background: '#ff6d00' }}
            >
              Be the first — Submit Your Track
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tracks.map((t) => (
              <TrackCard key={t.id} track={t} onRated={fetchTracks} />
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      {!loading && tracks.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => setLocation('/')}
            className="px-8 py-3 rounded-full text-black font-bold shadow-lg transition-transform hover:scale-105"
            style={{ background: '#ff6d00', boxShadow: '0 0 30px rgba(255,109,0,0.5)' }}
          >
            Submit Your Track
          </button>
        </div>
      )}

      {/* Quick-rate slider styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
